import prisma from '../config/database';
import notificationService from './notification.service';
import settingsService from './settings.service';
import { config } from '../config/env';
import fs from 'fs';
import path from 'path';

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
  sortBy?: 'createdAt' | 'startDate';
  sortOrder?: 'asc' | 'desc';
}

export class OrderService {
  /**
   * Создать новый заказ
   */
  async createOrder(data: CreateOrderData): Promise<any> {
    // Проверяем минимальную цену (3000₽)
    if (data.budget < 3000 && data.budgetType !== 'negotiable') {
      throw new Error('Минимальная цена заказа — 3000₽');
    }

    // Проверяем настройку автоодобрения заказов
    const autoApproveOrders = await settingsService.get('autoApproveOrders');
    const orderStatus = autoApproveOrders === 'true' ? 'PUBLISHED' : 'PENDING';

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
        status: orderStatus,
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
      // Маппинг расширенных названий → базовые для поиска по contains
      const regionMap: Record<string, string[]> = {
        'Москва и обл.': ['Москва'],
        'Санкт-Петербург и обл.': ['Санкт-Петербург'],
      };

      const variants = regionMap[filters.region];
      if (variants) {
        // Ищем заказы, где region содержит любое из названий (старое или новое)
        where.OR = [
          { region: { contains: filters.region, mode: 'insensitive' } },
          ...variants.map((v) => ({ region: { contains: v, mode: 'insensitive' as const } })),
        ];
      } else {
        where.region = {
          contains: filters.region,
          mode: 'insensitive',
        };
      }
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
              responses: { where: { status: { not: 'CANCELLED' } } },
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
          [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
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
            responses: { where: { status: { not: 'CANCELLED' } } },
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
    const executorIds: string[] = [];
    for (const response of order.responses) {
      await prisma.balance.update({
        where: { userId: response.executorId },
        data: {
          amount: {
            increment: response.commissionPaid,
          },
        },
      });
      executorIds.push(response.executorId);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        closedAt: new Date(),
      },
    });

    // Уведомление всем исполнителям, которые откликнулись
    if (executorIds.length > 0) {
      notificationService.notifyOrderCancelledByCustomer(
        executorIds,
        orderId,
        order.title
      ).catch(err => console.error('Notification error:', err));
    }

    return updatedOrder;
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
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    // Уведомление исполнителю о выборе (fire-and-forget, не блокируем ответ)
    notificationService.notifyExecutorSelected(
      executorId,
      orderId,
      updatedOrder.title,
      updatedOrder.customer.fullName,
      updatedOrder.customer.phone
    ).catch(err => console.error('Notification error:', err));

    // Отклоняем остальные отклики и уведомляем отклонённых исполнителей
    const otherResponses = order.responses.filter((r) => r.executorId !== executorId);
    for (const otherResponse of otherResponses) {
      await prisma.response.update({
        where: { id: otherResponse.id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
        },
      });

      // Уведомление отклонённому исполнителю (fire-and-forget)
      notificationService.notifyResponseRejected(
        otherResponse.executorId,
        orderId,
        updatedOrder.title
      ).catch(err => console.error('Notification error:', err));
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

    // Уведомление заказчику о начале работы (fire-and-forget)
    notificationService.notifyWorkStarted(
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
          status: 'CANCELLED',
          rejectedAt: new Date(),
        },
      });
    }

    // Возвращаем все остальные отклики в статус PENDING
    await prisma.response.updateMany({
      where: {
        orderId,
        status: 'REJECTED',
      },
      data: {
        status: 'PENDING',
        rejectedAt: null,
      },
    });

    // Уведомление заказчику об отказе (fire-and-forget)
    notificationService.notifyExecutorCancelled(
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
      include: {
        executor: true,
      },
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

    // Уведомление заказчику о завершении заказа (fire-and-forget)
    notificationService.notifyOrderCompleted(
      order.customerId,
      orderId,
      order.title
    ).catch(err => console.error('Notification error:', err));

    // Уведомление исполнителю о завершении заказа (fire-and-forget)
    notificationService.notifyOrderCompleted(
      executorId,
      orderId,
      order.title
    ).catch(err => console.error('Notification error:', err));

    // Удаляем файлы заказа и чата с диска (fire-and-forget)
    this.cleanupOrderFiles(orderId, order.files || [])
      .catch(err => console.error('File cleanup error:', err));

    return updatedOrder;
  }

  /**
   * Удалить все файлы заказа и чата с диска после завершения
   */
  private async cleanupOrderFiles(orderId: string, orderFiles: string[]): Promise<void> {
    const filesToDelete: string[] = [];

    // 1. Файлы прикреплённые к заказу
    for (const fileUrl of orderFiles) {
      const filename = fileUrl.startsWith('/uploads/') ? fileUrl.replace('/uploads/', '') : path.basename(fileUrl);
      const filePath = path.join(config.uploadDir, filename);
      filesToDelete.push(filePath);
    }

    // 2. Файлы из чата по этому заказу
    const chatMessages = await prisma.message.findMany({
      where: {
        orderId,
        fileUrl: { not: null },
      },
      select: { fileUrl: true },
    });

    for (const msg of chatMessages) {
      if (msg.fileUrl) {
        const filename = msg.fileUrl.startsWith('/uploads/') ? msg.fileUrl.replace('/uploads/', '') : path.basename(msg.fileUrl);
        const filePath = path.join(config.uploadDir, filename);
        filesToDelete.push(filePath);
      }
    }

    // 3. Удаляем файлы с диска
    let deletedCount = 0;
    for (const filePath of filesToDelete) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (err) {
        console.error(`Failed to delete file: ${filePath}`, err);
      }
    }

    // 4. Очищаем массив файлов в заказе (сами URL)
    await prisma.order.update({
      where: { id: orderId },
      data: { files: [] },
    });

    // 5. Очищаем ссылки на файлы в сообщениях чата
    await prisma.message.updateMany({
      where: {
        orderId,
        fileUrl: { not: null },
      },
      data: {
        fileUrl: null,
        fileName: null,
      },
    });

    console.log(`🗑️ Order ${orderId}: deleted ${deletedCount} files from disk`);
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

    // Записываем просмотр (upsert чтобы не дублировать)
    await prisma.orderView.upsert({
      where: {
        orderId_executorId: { orderId, executorId },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        orderId,
        executorId,
      },
    });
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

    // Удаляем файлы закрытых заказов
    for (const order of expiredOrders) {
      this.cleanupOrderFiles(order.id, order.files || [])
        .catch(err => console.error('File cleanup error (auto-close):', err));
    }

    return expiredOrders.length;
  }

  /**
   * Добавить файлы к заказу
   */
  async addFiles(orderId: string, fileUrls: string[]): Promise<any> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    // Merge new files with existing ones
    const updatedFiles = [...(order.files || []), ...fileUrls];

    return prisma.order.update({
      where: { id: orderId },
      data: { files: updatedFiles },
    });
  }
}

export default new OrderService();

