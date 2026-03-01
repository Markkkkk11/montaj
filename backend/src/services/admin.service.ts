import prisma from '../config/database';
import notificationService from './notification.service';

export class AdminService {
  /**
   * Получить статистику платформы
   */
  async getStatistics() {
    const [
      totalUsers,
      totalExecutors,
      totalCustomers,
      pendingUsers,
      activeUsers,
      totalOrders,
      publishedOrders,
      completedOrders,
      totalReviews,
      pendingReviews,
      totalRevenue,
      thisMonthRevenue,
    ] = await Promise.all([
      // Пользователи
      prisma.user.count(),
      prisma.user.count({ where: { role: 'EXECUTOR' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),

      // Заказы
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PUBLISHED' } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),

      // Отзывы
      prisma.review.count(),
      prisma.review.count({ where: { status: 'PENDING' } }),

      // Доходы
      prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'SUCCEEDED',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    // Подсчитываем заказы в работе
    const inProgressOrders = await prisma.order.count({ where: { status: 'IN_PROGRESS' } });

    return {
      // Пользователи
      totalUsers,
      totalExecutors,
      totalCustomers,
      pendingUsers,
      activeUsers,
      
      // Заказы
      totalOrders,
      publishedOrders,
      inProgressOrders,
      completedOrders,
      
      // Отзывы
      totalReviews,
      pendingReviews,
      
      // Доходы
      totalRevenue: parseFloat(totalRevenue._sum.amount?.toString() || '0'),
      monthlyRevenue: parseFloat(thisMonthRevenue._sum.amount?.toString() || '0'),
    };
  }

  /**
   * Получить пользователей для модерации
   */
  async getUsersForModeration(status?: string, page: number = 1, limit: number = 20, role?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          executorProfile: true,
          balance: true,
          subscription: true,
          _count: {
            select: {
              createdOrders: true,
              assignedOrders: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Убрать пароли, добавить ordersCount
    const usersWithoutPasswords = users.map((user) => {
      const { password, _count, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        ordersCount: user.role === 'CUSTOMER' ? _count.createdOrders : _count.assignedOrders,
      };
    });

    return {
      users: usersWithoutPasswords,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Модерировать пользователя
   */
  async moderateUser(
    userId: string,
    action: 'APPROVE' | 'REJECT' | 'BLOCK' | 'UNBLOCK',
    adminId: string,
    reason?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    let newStatus: 'ACTIVE' | 'REJECTED' | 'BLOCKED' = 'ACTIVE';

    switch (action) {
      case 'APPROVE':
        newStatus = 'ACTIVE';
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        break;
      case 'BLOCK':
        newStatus = 'BLOCKED';
        break;
      case 'UNBLOCK':
        newStatus = 'ACTIVE';
        break;
    }

    // Обновить статус пользователя
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    // Отправить уведомление пользователю при одобрении
    if (action === 'APPROVE') {
      notificationService.notifyUserApproved(userId)
        .catch(err => console.error('Notification error:', err));
    }

    // Записать в лог
    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType: 'USER',
        targetId: userId,
        reason,
        metadata: {
          userRole: user.role,
          oldStatus: user.status,
          newStatus,
        },
      },
    });

    return updatedUser;
  }

  /**
   * Получить заказы для модерации
   */
  async getOrdersForModeration(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              organization: true,
            },
          },
          executor: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              rating: true,
            },
          },
          responses: {
            select: {
              id: true,
              executorId: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Модерировать заказ
   */
  async moderateOrder(
    orderId: string,
    action: 'APPROVE' | 'REJECT' | 'BLOCK',
    adminId: string,
    reason?: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    let newStatus: 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED' = 'PUBLISHED';

    switch (action) {
      case 'APPROVE':
        newStatus = 'PUBLISHED';
        break;
      case 'REJECT':
      case 'BLOCK':
        newStatus = 'CANCELLED';
        break;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    // Записать в лог
    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType: 'ORDER',
        targetId: orderId,
        reason,
        metadata: {
          oldStatus: order.status,
          newStatus,
        },
      },
    });

    return updatedOrder;
  }

  /**
   * Получить отзывы для модерации
   */
  async getReviewsForModeration(status?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
          reviewee: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
          order: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Модерировать отзыв
   */
  async moderateReview(
    reviewId: string,
    action: 'APPROVE' | 'REJECT',
    adminId: string,
    note?: string
  ) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewee: true,
      },
    });

    if (!review) {
      throw new Error('Отзыв не найден');
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: newStatus,
        moderationNote: note,
      },
    });

    // Если одобрен - пересчитать рейтинг
    if (newStatus === 'APPROVED') {
      const approvedReviews = await prisma.review.findMany({
        where: {
          revieweeId: review.revieweeId,
          status: 'APPROVED',
        },
      });

      const avgRating =
        approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;

      await prisma.user.update({
        where: { id: review.revieweeId },
        data: { rating: avgRating },
      });
    }

    // Записать в лог
    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType: 'REVIEW',
        targetId: reviewId,
        reason: note,
        metadata: {
          oldStatus: review.status,
          newStatus,
          rating: review.rating,
        },
      },
    });

    return updatedReview;
  }

  /**
   * Получить логи действий администраторов
   */
  async getAdminLogs(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        include: {
          admin: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.adminLog.count(),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получить финансовую аналитику
   */
  async getFinancialAnalytics(startDate?: Date, endDate?: Date) {
    const where: any = {
      status: 'SUCCEEDED',
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [payments, transactions] = await Promise.all([
      prisma.payment.findMany({
        where,
        select: {
          amount: true,
          purpose: true,
          createdAt: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          type: { in: ['RESPONSE_FEE', 'ORDER_FEE', 'SUBSCRIPTION'] },
          createdAt: where.createdAt,
        },
        select: {
          amount: true,
          type: true,
          createdAt: true,
        },
      }),
    ]);

    // Группировка по дням
    const paymentsByDay: { [key: string]: number } = {};
    const transactionsByType: { [key: string]: number } = {};

    payments.forEach((payment) => {
      const day = payment.createdAt.toISOString().split('T')[0];
      paymentsByDay[day] = (paymentsByDay[day] || 0) + parseFloat(payment.amount.toString());
    });

    transactions.forEach((transaction) => {
      const type = transaction.type;
      transactionsByType[type] =
        (transactionsByType[type] || 0) + Math.abs(parseFloat(transaction.amount.toString()));
    });

    return {
      paymentsByDay,
      transactionsByType,
      totalRevenue: payments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()),
        0
      ),
      totalCommissions: transactions.reduce(
        (sum, t) => sum + Math.abs(parseFloat(t.amount.toString())),
        0
      ),
    };
  }

  /**
   * Получить статистику активности пользователя
   */
  async getUserActivityStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, phone: true, email: true, fullName: true, city: true, messengers: true, createdAt: true, status: true },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Общие данные — история пополнений и трат
    const [payments, transactions] = await Promise.all([
      prisma.payment.findMany({
        where: { userId, status: 'SUCCEEDED' },
        select: { id: true, amount: true, purpose: true, description: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.transaction.findMany({
        where: { userId },
        select: { id: true, amount: true, type: true, description: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const totalTopUps = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    const totalSpent = transactions
      .filter(t => parseFloat(t.amount.toString()) < 0)
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);

    if (user.role === 'CUSTOMER') {
      const [ordersThisMonth, ordersTotal, activeOrders, completedOrders] = await Promise.all([
        prisma.order.count({
          where: { customerId: userId, createdAt: { gte: oneMonthAgo } },
        }),
        prisma.order.count({
          where: { customerId: userId },
        }),
        prisma.order.count({
          where: { customerId: userId, status: { in: ['PUBLISHED', 'IN_PROGRESS'] } },
        }),
        prisma.order.count({
          where: { customerId: userId, status: 'COMPLETED' },
        }),
      ]);

      return {
        user,
        stats: {
          ordersThisMonth,
          ordersTotal,
          activeOrders,
          completedOrders,
        },
        financial: { payments, transactions, totalTopUps, totalSpent },
      };
    } else {
      const [completedThisMonth, completedTotal, inProgressOrders, responsesThisMonth, responsesTotal] = await Promise.all([
        prisma.order.count({
          where: { executorId: userId, status: 'COMPLETED', updatedAt: { gte: oneMonthAgo } },
        }),
        prisma.order.count({
          where: { executorId: userId, status: 'COMPLETED' },
        }),
        prisma.order.count({
          where: { executorId: userId, status: 'IN_PROGRESS' },
        }),
        prisma.response.count({
          where: { executorId: userId, createdAt: { gte: oneMonthAgo } },
        }),
        prisma.response.count({
          where: { executorId: userId },
        }),
      ]);

      return {
        user,
        stats: {
          completedThisMonth,
          completedTotal,
          inProgressOrders,
          responsesThisMonth,
          responsesTotal,
        },
        financial: { payments, transactions, totalTopUps, totalSpent },
      };
    }
  }

  /**
   * Получить историю пополнений (все пользователи)
   */
  async getPaymentHistory(startDate?: Date, endDate?: Date, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const where: any = { status: 'SUCCEEDED' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [payments, total, totalSum] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totalSum: parseFloat(totalSum._sum.amount?.toString() || '0'),
    };
  }

  /**
   * Получить пользователя по ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        balance: true,
        subscription: true,
        executorProfile: true,
      },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    return user;
  }

  /**
   * Обновить пользователя
   */
  async updateUser(userId: string, data: any) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        email: data.email,
        city: data.city,
        status: data.status,
        rating: data.rating,
      },
      include: {
        balance: true,
        subscription: true,
      },
    });
  }

  /**
   * Удалить пользователя
   */
  async deleteUser(userId: string) {
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Обновить баланс пользователя
   */
  async updateUserBalance(userId: string, amount: number, bonusAmount: number) {
    return await prisma.balance.upsert({
      where: { userId },
      update: {
        amount,
        bonusAmount,
      },
      create: {
        userId,
        amount,
        bonusAmount,
      },
    });
  }

  /**
   * Обновить подписку пользователя
   */
  async updateUserSubscription(userId: string, data: any) {
    const expiresAt = data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return await prisma.subscription.upsert({
      where: { userId },
      update: {
        tariffType: data.tariffType,
        specializationCount: data.specializationCount,
        expiresAt,
      },
      create: {
        userId,
        tariffType: data.tariffType,
        specializationCount: data.specializationCount,
        expiresAt,
      },
    });
  }

  /**
   * Получить заказ по ID
   */
  async getOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        executor: true,
        responses: {
          include: {
            executor: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    return order;
  }

  /**
   * Обновить заказ
   */
  async updateOrder(orderId: string, data: any) {
    return await prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        customer: true,
        executor: true,
      },
    });
  }

  /**
   * Удалить заказ
   */
  async deleteOrder(orderId: string) {
    await prisma.order.delete({
      where: { id: orderId },
    });
  }
}

export default new AdminService();

