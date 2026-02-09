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
  async getUsersForModeration(status?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          executorProfile: true,
          balance: true,
          subscription: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Убрать пароли
    const usersWithoutPasswords = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
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
      await notificationService.notifyUserApproved(userId)
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
  async getOrdersForModeration(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
      prisma.order.count(),
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

