import prisma from '../config/database';
import subscriptionService from './subscription.service';
import notificationService from './notification.service';

export class ResponseService {
  /**
   * Создать отклик на заказ
   */
  async createResponse(orderId: string, executorId: string) {
    // Проверить заказ
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.status !== 'PUBLISHED') {
      throw new Error('Заказ недоступен для откликов');
    }

    if (order.customerId === executorId) {
      throw new Error('Нельзя откликаться на собственный заказ');
    }

    // Проверить, не откликнулся ли уже
    const existing = await prisma.response.findFirst({
      where: {
        orderId,
        executorId,
      },
    });

    if (existing) {
      throw new Error('Вы уже откликнулись на этот заказ');
    }

    // Проверить исполнителя
    const executor = await prisma.user.findUnique({
      where: { id: executorId },
      include: {
        executorProfile: true,
        balance: true,
        subscription: true,
      },
    });

    if (!executor || executor.role !== 'EXECUTOR') {
      throw new Error('Пользователь не является исполнителем');
    }

    if (executor.status !== 'ACTIVE') {
      throw new Error('Профиль исполнителя не активирован');
    }

    if (!executor.executorProfile) {
      throw new Error('Профиль исполнителя не заполнен');
    }

    // Получить текущий тариф и стоимость отклика
    const tariff = await subscriptionService.getCurrentTariff(executorId);
    const commission = await subscriptionService.getResponseCost(executorId);

    // Проверить баланс (если требуется оплата)
    if (commission > 0) {
      const totalBalance =
        parseFloat(executor.balance?.amount.toString() || '0') +
        parseFloat(executor.balance?.bonusAmount.toString() || '0');

      if (totalBalance < commission) {
        throw new Error(`Недостаточно средств на балансе. Необходимо ${commission}₽`);
      }

      // Списать комиссию (сначала бонусы, потом основной баланс)
      const bonusBalance = parseFloat(executor.balance?.bonusAmount.toString() || '0');
      const amountFromBonus = Math.min(bonusBalance, commission);
      const amountFromMain = commission - amountFromBonus;

      await prisma.balance.update({
        where: { userId: executorId },
        data: {
          bonusAmount: {
            decrement: amountFromBonus,
          },
          amount: {
            decrement: amountFromMain,
          },
        },
      });

      // Записать транзакцию
      await prisma.transaction.create({
        data: {
          userId: executorId,
          type: 'RESPONSE_FEE',
          amount: -commission,
          description: `Отклик на заказ #${orderId.slice(0, 8)}`,
          relatedOrderId: orderId,
        },
      });
    }

    // Создать отклик
    const response = await prisma.response.create({
      data: {
        orderId,
        executorId,
        commissionPaid: commission,
        tariffType: tariff.tariffType as any,
        status: 'PENDING',
      },
      include: {
        executor: {
          include: {
            executorProfile: true,
          },
        },
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    // Отправить уведомление заказчику о новом отклике (fire-and-forget)
    notificationService.notifyOrderResponse(
      order.customerId,
      executor.fullName,
      orderId,
      order.title
    ).catch(err => console.error('Notification error:', err));

    return response;
  }

  /**
   * Получить отклики на заказ
   */
  async getOrderResponses(orderId: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    // Только заказчик может видеть все отклики
    if (userId && order.customerId !== userId) {
      throw new Error('Недостаточно прав для просмотра откликов');
    }

    const responses = await prisma.response.findMany({
      where: { 
        orderId,
        status: { not: 'CANCELLED' },
      },
      include: {
        executor: {
          select: {
            id: true,
            fullName: true,
            photo: true,
            rating: true,
            completedOrders: true,
            executorProfile: {
              select: {
                region: true,
                shortDescription: true,
                fullDescription: true,
                specializations: true,
                workPhotos: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return responses;
  }

  /**
   * Получить отклики исполнителя
   */
  async getExecutorResponses(executorId: string) {
    const responses = await prisma.response.findMany({
      where: { executorId },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                organization: true,
                city: true,
                rating: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return responses;
  }

  /**
   * Принять отклик (когда заказчик выбирает исполнителя)
   * Вызывается из orderService.selectExecutor
   */
  async acceptResponse(orderId: string, executorId: string) {
    const response = await prisma.response.findFirst({
      where: {
        orderId,
        executorId,
      },
      include: {
        executor: {
          include: {
            executorProfile: true,
            balance: true,
          },
        },
      },
    });

    if (!response) {
      throw new Error('Отклик не найден');
    }

    // Если тариф COMFORT, списать 500₽ сейчас
    if (response.tariffType === 'COMFORT') {
      const balance = response.executor.balance?.amount || 0;
      const fee = 500;

      if (parseFloat(balance.toString()) < fee) {
        throw new Error(
          `У исполнителя недостаточно средств для завершения сделки. Необходимо ${fee}₽`
        );
      }

      await prisma.balance.update({
        where: { userId: executorId },
        data: {
          amount: {
            decrement: fee,
          },
        },
      });

      await prisma.transaction.create({
        data: {
          userId: executorId,
          type: 'ORDER_FEE',
          amount: -fee,
          description: `Комиссия за выбранный заказ #${orderId.slice(0, 8)}`,
          relatedOrderId: orderId,
        },
      });

      await prisma.response.update({
        where: { id: response.id },
        data: {
          commissionPaid: fee,
        },
      });
    }

    // Обновить статус отклика
    const updated = await prisma.response.update({
      where: { id: response.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Отклонить отклик
   */
  async rejectResponse(responseId: string) {
    const response = await prisma.response.update({
      where: { id: responseId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
    });

    // TODO: Отправить уведомление исполнителю

    return response;
  }

  /**
   * Отклонить все отклики (кроме выбранного)
   */
  async rejectAllExcept(orderId: string, acceptedExecutorId: string) {
    await prisma.response.updateMany({
      where: {
        orderId,
        executorId: {
          not: acceptedExecutorId,
        },
        status: 'PENDING',
      },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
    });
  }

  /**
   * Вернуть средства откликнувшимся (при отмене заказа)
   */
  async refundResponses(orderId: string) {
    const responses = await prisma.response.findMany({
      where: {
        orderId,
        status: 'PENDING',
        commissionPaid: {
          gt: 0,
        },
      },
    });

    for (const response of responses) {
      // Вернуть средства
      await prisma.balance.update({
        where: { userId: response.executorId },
        data: {
          amount: {
            increment: response.commissionPaid,
          },
        },
      });

      // Записать транзакцию возврата
      await prisma.transaction.create({
        data: {
          userId: response.executorId,
          type: 'REFUND',
          amount: response.commissionPaid,
          description: `Возврат за отклик на отменённый заказ #${orderId.slice(0, 8)}`,
          relatedOrderId: orderId,
        },
      });
    }

    // Обновить статус откликов
    await prisma.response.updateMany({
      where: {
        orderId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }
}

export default new ResponseService();

