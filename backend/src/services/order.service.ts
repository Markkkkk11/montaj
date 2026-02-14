import prisma from '../config/database';
import notificationService from './notification.service';

interface CreateOrderData {
  customerId: string;
  category: any;
  title: string;
  description: string;
  region: string;
  address: string;
  latitude?: number;
  longitude?: number;
  startDate: Date;
  endDate?: Date;
  budget: number;
  budgetType?: string;
  paymentMethod: 'CASH' | 'CARD' | 'BANK';
  files?: string[];
}

interface OrderFilters {
  category?: any;
  region?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: any;
  executorId?: string;
}

export class OrderService {
  /**
   * Создать новый заказ
   */
  async createOrder(data: CreateOrderData): Promise<any> {
    // Проверяем минимальную цену (5000₽)
    if (data.budget < 5000 && data.budgetType !== 'negotiable') {
      throw new Error('Минимальная цена заказа - 5000₽');
    }

    const order = await prisma.order.create({
      data: {
        customerId: data.customerId,
        category: data.category,
        title: data.title,
        description: data.description,
        region: data.region,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget,
        budgetType: data.budgetType || 'fixed',
        paymentMethod: data.paymentMethod,
        files: data.files || [],
        status: 'PUBLISHED',
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            organization: true,
            rating: true,
          },
        },
      },
    });

    return order;
  }

  /**
   * Получить список заказов с фильтрами
   */
  async getOrders(
    filters: OrderFilters,
    page: number = 1,
    limit: number = 20,
    userId?: string  // ID текущего пользователя (исполнителя)
  ): Promise<{ orders: any[]; total: number; pages: number }> {
    const where: any = {};

    // Применяем статус только если он не undefined явно
    if (filters.status !== undefined) {
      where.status = filters.status;
    } else if (!filters.executorId) {
      // Если не указан executorId, то по умолчанию PUBLISHED
      where.status = 'PUBLISHED';
    }
    // Если executorId указан и status === undefined, то не фильтруем по статусу

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.region) {
      where.region = {
        contains: filters.region,
        mode: 'insensitive',
      };
    }

    if (filters.minBudget || filters.maxBudget) {
      where.budget = {};
      if (filters.minBudget) {
        where.budget.gte = filters.minBudget;
      }
      if (filters.maxBudget) {
        where.budget.lte = filters.maxBudget;
      }
    }

    if (filters.executorId) {
      where.executorId = filters.executorId;
    }

    // Если запрос от исполнителя - применить дополнительные фильтры
    if (userId) {
      // Получить профиль исполнителя с его специализациями
      const executorProfile = await prisma.executorProfile.findUnique({
        where: { userId },
        select: { specializations: true }
      });

      // Фильтровать заказы только по специализациям исполнителя
      if (executorProfile && executorProfile.specializations.length > 0) {
        where.category = {
          in: executorProfile.specializations
        };
      } else {
        // Если специализации не выбраны - не показывать никакие заказы
        where.category = {
          in: []  // Пустой массив = нет результатов
        };
      }

      // Скрыть заказы, на которые он уже откликнулся
      where.responses = {
        none: {
          executorId: userId
        }
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              organization: true,
              rating: true,
              city: true,
            },
          },
          executor: {
            select: {
              id: true,
              fullName: true,
              rating: true,
              completedOrders: true,
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
          // Включаем информацию о просмотрах для текущего пользователя
          views: userId ? {
            where: {
              executorId: userId
            },
            select: {
              id: true,
              viewedAt: true,
            }
          } : false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Добавляем флаг hasViewed для каждого заказа
    const ordersWithFlags = orders.map((order: any) => ({
      ...order,
      hasViewed: userId && order.views && order.views.length > 0,
      views: undefined, // Удаляем массив views из ответа
    }));

    return {
      orders: ordersWithFlags,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Получить заказ по ID
   */
  async getOrderById(orderId: string, userId?: string): Promise<any | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            organization: true,
            city: true,
            rating: true,
            completedOrders: true,
            // Контакты скрыты до выбора исполнителя
            phone: userId ? true : false,
            email: userId ? true : false,
            messengers: userId ? true : false,
          },
        },
        executor: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            rating: true,
            completedOrders: true,
            executorProfile: true,
          },
        },
        responses: {
          where: userId
            ? {
                OR: [
                  { executorId: userId },
                  { order: { customerId: userId } },
                ],
              }
            : undefined,
          include: {
            executor: {
              select: {
                id: true,
                fullName: true,
                photo: true,
                rating: true,
                completedOrders: true,
                executorProfile: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Если заказ опубликован и смотрит не заказчик - скрываем контакты
    if (order && order.status === 'PUBLISHED' && order.customerId !== userId) {
      // @ts-ignore
      delete order.customer.phone;
      // @ts-ignore
      delete order.customer.email;
      // @ts-ignore
      delete order.customer.messengers;
    }

    return order;
  }

  /**
   * Получить заказы заказчика
   */
  async getCustomerOrders(customerId: string): Promise<any[]> {
    return prisma.order.findMany({
      where: { customerId },
      include: {
        executor: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            rating: true,
            completedOrders: true,
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Обновить заказ
   */
  async updateOrder(orderId: string, customerId: string, data: Partial<CreateOrderData>): Promise<any> {
    // Проверяем, что заказ принадлежит этому заказчику
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.customerId !== customerId) {
      throw new Error('У вас нет прав на редактирование этого заказа');
    }

    if (order.status !== 'PUBLISHED') {
      throw new Error('Можно редактировать только опубликованные заказы');
    }

    const updateData: any = {};

    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.region) updateData.region = data.region;
    if (data.address) updateData.address = data.address;
    if (data.startDate) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.budget) updateData.budget = data.budget;
    if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;

    return prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });
  }

  /**
   * Отменить заказ (заказчиком)
   */
  async cancelOrder(orderId: string, customerId: string): Promise<any> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        responses: true,
      },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.customerId !== customerId) {
      throw new Error('У вас нет прав на отмену этого заказа');
    }

    if (order.status !== 'PUBLISHED') {
      throw new Error('Можно отменить только опубликованные заказы');
    }

    // Возвращаем деньги всем откликнувшимся исполнителям
    for (const response of order.responses) {
      await prisma.balance.update({
        where: { userId: response.executorId },
        data: {
          amount: {
            increment: response.commissionPaid,
          },
        },
      });
    }

    return prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        closedAt: new Date(),
      },
    });
  }

  /**
   * Выбрать исполнителя для заказа
   */
  async selectExecutor(orderId: string, customerId: string, executorId: string): Promise<any> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        responses: true,
      },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.customerId !== customerId) {
      throw new Error('У вас нет прав на выбор исполнителя для этого заказа');
    }

    if (order.status !== 'PUBLISHED') {
      throw new Error('Исполнителя можно выбрать только для опубликованных заказов');
    }

    // Проверяем, что исполнитель откликнулся
    const response = order.responses.find((r) => r.executorId === executorId);
    if (!response) {
      throw new Error('Этот исполнитель не откликался на заказ');
    }

    // Если тариф COMFORT - списать 500₽ при выборе
    if (response.tariffType === 'COMFORT') {
      const executor = await prisma.user.findUnique({
        where: { id: executorId },
        include: { balance: true },
      });

      const orderTakenFee = 500;
      const totalBalance =
        parseFloat(executor?.balance?.amount.toString() || '0') +
        parseFloat(executor?.balance?.bonusAmount.toString() || '0');

      if (totalBalance < orderTakenFee) {
        throw new Error(
          `У исполнителя недостаточно средств для оплаты комиссии за взятый заказ (${orderTakenFee}₽)`
        );
      }

      // Списать комиссию
      const bonusBalance = parseFloat(executor?.balance?.bonusAmount.toString() || '0');
      const amountFromBonus = Math.min(bonusBalance, orderTakenFee);
      const amountFromMain = orderTakenFee - amountFromBonus;

      await prisma.balance.update({
        where: { userId: executorId },
        data: {
          bonusAmount: { decrement: amountFromBonus },
          amount: { decrement: amountFromMain },
        },
      });

      // Записать транзакцию
      await prisma.transaction.create({
        data: {
          userId: executorId,
          type: 'ORDER_FEE',
          amount: -orderTakenFee,
          description: `Комиссия за взятый заказ #${orderId.slice(0, 8)}`,
          relatedOrderId: orderId,
        },
      });
    }

    // Обновляем заказ
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        executorId,
        status: 'IN_PROGRESS',
      },
      include: {
        customer: true,
        executor: true,
      },
    });

    // Обновляем статус отклика
    await prisma.response.update({
      where: { id: response.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    // Уведомление исполнителю о выборе
    await notificationService.notifyExecutorSelected(
      executorId,
      orderId,
      updatedOrder.title,
      updatedOrder.customer.fullName,
      updatedOrder.customer.phone
    ).catch(err => console.error('Notification error:', err));

    // Отклоняем остальные отклики
    const otherResponses = order.responses.filter((r) => r.executorId !== executorId);
    for (const otherResponse of otherResponses) {
      await prisma.response.update({
        where: { id: otherResponse.id },
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
        },
      });
    }

    return updatedOrder;
  }

  /**
   * Исполнитель приступает к работе
   */
  async startWork(orderId: string, executorId: string): Promise<any> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.executorId !== executorId) {
      throw new Error('Вы не назначены исполнителем на этот заказ');
    }

    if (order.status !== 'IN_PROGRESS') {
      throw new Error('Можно приступить к работе только по активным заказам');
    }

    if (order.workStartedAt) {
      throw new Error('Вы уже приступили к выполнению этого заказа');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        workStartedAt: new Date(),
      },
      include: {
        customer: true,
        executor: true,
      },
    });

    // Уведомление заказчику о начале работы
    await notificationService.notifyWorkStarted(
      order.customerId,
      orderId,
      order.title,
      updatedOrder.executor?.fullName || 'Исполнитель'
    ).catch(err => console.error('Notification error:', err));

    return updatedOrder;
  }

  /**
   * Исполнитель отказывается от заказа
   */
  async cancelWork(orderId: string, executorId: string, reason?: string): Promise<any> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        responses: true,
      },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.executorId !== executorId) {
      throw new Error('Вы не назначены исполнителем на этот заказ');
    }

    if (order.status !== 'IN_PROGRESS') {
      throw new Error('Можно отказаться только от активных заказов');
    }

    // Возвращаем заказ в статус PUBLISHED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PUBLISHED',
        executorId: null,
        workStartedAt: null,
      },
      include: {
        customer: true,
      },
    });

    // Обновляем отклик исполнителя
    const executorResponse = order.responses.find(r => r.executorId === executorId);
    if (executorResponse) {
      await prisma.response.update({
        where: { id: executorResponse.id },
        data: {
          status: 'cancelled',
          rejectedAt: new Date(),
        },
      });
    }

    // Возвращаем все остальные отклики в статус pending
    await prisma.response.updateMany({
      where: {
        orderId,
        status: 'rejected',
      },
      data: {
        status: 'pending',
        rejectedAt: null,
      },
    });

    // Уведомление заказчику об отказе
    await notificationService.notifyExecutorCancelled(
      order.customerId,
      orderId,
      order.title,
      reason
    ).catch(err => console.error('Notification error:', err));

    return updatedOrder;
  }

  /**
   * Завершить заказ (исполнителем)
   */
  async completeOrder(orderId: string, executorId: string): Promise<any> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.executorId !== executorId) {
      throw new Error('Вы не назначены исполнителем на этот заказ');
    }

    if (order.status !== 'IN_PROGRESS') {
      throw new Error('Можно завершить только активные заказы');
    }

    // Обновляем заказ и счётчики выполненных заказов у исполнителя И заказчика
    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          closedAt: new Date(),
        },
      }),
      // Инкрементируем счётчик исполнителя
      prisma.user.update({
        where: { id: executorId },
        data: {
          completedOrders: {
            increment: 1,
          },
        },
      }),
      // Инкрементируем счётчик заказчика
      prisma.user.update({
        where: { id: order.customerId },
        data: {
          completedOrders: {
            increment: 1,
          },
        },
      }),
    ]);

    return updatedOrder;
  }

  /**
   * Записать просмотр заказа исполнителем
   */
  async recordOrderView(orderId: string, executorId: string): Promise<void> {
    // Проверяем существование заказа
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    // Записываем просмотр (если уже есть - игнорируем, благодаря unique constraint)
    try {
      await prisma.orderView.create({
        data: {
          orderId,
          executorId,
        },
      });
    } catch (error: any) {
      // Если запись уже существует (unique constraint violation) - игнорируем
      if (error.code !== 'P2002') {
        throw error;
      }
    }
  }

  /**
   * Автоматическое закрытие заказов без откликов
   */
  async autoCloseExpiredOrders(): Promise<number> {
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: {
          lt: new Date(),
        },
        responses: {
          none: {},
        },
      },
    });

    if (expiredOrders.length === 0) {
      return 0;
    }

    await prisma.order.updateMany({
      where: {
        id: {
          in: expiredOrders.map((o) => o.id),
        },
      },
      data: {
        status: 'CANCELLED',
        closedAt: new Date(),
      },
    });

    return expiredOrders.length;
  }
}

export default new OrderService();

