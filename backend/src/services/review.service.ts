import prisma from '../config/database';

export class ReviewService {
  /**
   * Создать отзыв
   */
  async createReview(data: {
    orderId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment: string;
  }) {
    const { orderId, reviewerId, revieweeId, rating, comment } = data;

    // Проверить заказ
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        executor: true,
      },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.status !== 'COMPLETED') {
      throw new Error('Отзыв можно оставить только на завершённый заказ');
    }

    // Проверить, что пользователь участвовал в заказе
    if (reviewerId !== order.customerId && reviewerId !== order.executorId) {
      throw new Error('Вы не участвовали в этом заказе');
    }

    // Проверить, что revieweeId корректен
    if (reviewerId === order.customerId && revieweeId !== order.executorId) {
      throw new Error('Вы можете оставить отзыв только об исполнителе этого заказа');
    }

    if (reviewerId === order.executorId && revieweeId !== order.customerId) {
      throw new Error('Вы можете оставить отзыв только о заказчике этого заказа');
    }

    // Проверить, что отзыв ещё не оставлен
    const existing = await prisma.review.findUnique({
      where: {
        orderId_reviewerId: {
          orderId,
          reviewerId,
        },
      },
    });

    if (existing) {
      throw new Error('Вы уже оставили отзыв по этому заказу');
    }

    // Валидация рейтинга
    if (rating < 1 || rating > 5) {
      throw new Error('Рейтинг должен быть от 1 до 5');
    }

    // Валидация комментария
    if (comment.trim().length < 10) {
      throw new Error('Комментарий должен содержать минимум 10 символов');
    }

    // Создать отзыв
    const review = await prisma.review.create({
      data: {
        orderId,
        reviewerId,
        revieweeId,
        rating,
        comment: comment.trim(),
        status: 'PENDING', // На модерацию
      },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            photo: true,
            role: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            fullName: true,
            photo: true,
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
    });

    return review;
  }

  /**
   * Получить отзывы о пользователе
   */
  async getUserReviews(userId: string, status?: string) {
    const where: any = {
      revieweeId: userId,
    };

    if (status) {
      where.status = status;
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            photo: true,
            role: true,
          },
        },
        order: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reviews;
  }

  /**
   * Получить отзывы, оставленные пользователем
   */
  async getReviewsByUser(userId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        reviewerId: userId,
      },
      include: {
        reviewee: {
          select: {
            id: true,
            fullName: true,
            photo: true,
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
    });

    return reviews;
  }

  /**
   * Получить отзыв по ID
   */
  async getReviewById(id: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            photo: true,
            role: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            fullName: true,
            photo: true,
            role: true,
          },
        },
        order: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    });

    return review;
  }

  /**
   * Одобрить отзыв (модератор)
   */
  async approveReview(reviewId: string, moderatorId: string) {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: 'APPROVED',
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
      },
    });

    // Пересчитать рейтинг пользователя
    await this.recalculateUserRating(review.revieweeId);

    return review;
  }

  /**
   * Отклонить отзыв (модератор)
   */
  async rejectReview(reviewId: string, moderatorId: string, note: string) {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: 'REJECTED',
        moderationNote: note,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
      },
    });

    return review;
  }

  /**
   * Пересчитать рейтинг пользователя
   */
  async recalculateUserRating(userId: string) {
    // Получить все одобренные отзывы о пользователе
    const approvedReviews = await prisma.review.findMany({
      where: {
        revieweeId: userId,
        status: 'APPROVED',
      },
      select: {
        rating: true,
      },
    });

    if (approvedReviews.length === 0) {
      // Если нет отзывов, оставляем начальный рейтинг 3.0
      await prisma.user.update({
        where: { id: userId },
        data: { rating: 3.0 },
      });
      return 3.0;
    }

    // Рассчитать средний рейтинг
    const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / approvedReviews.length;

    // Округлить до 1 знака после запятой
    const roundedRating = Math.round(averageRating * 10) / 10;

    // Обновить рейтинг пользователя
    await prisma.user.update({
      where: { id: userId },
      data: { rating: roundedRating },
    });

    return roundedRating;
  }

  /**
   * Получить статистику отзывов пользователя
   */
  async getUserReviewStats(userId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: userId,
        status: 'APPROVED',
      },
      select: {
        rating: true,
      },
    });

    const total = reviews.length;

    if (total === 0) {
      return {
        total: 0,
        averageRating: 3.0,
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    // Подсчитать распределение по звёздам
    const distribution = {
      5: reviews.filter((r: any) => r.rating === 5).length,
      4: reviews.filter((r: any) => r.rating === 4).length,
      3: reviews.filter((r: any) => r.rating === 3).length,
      2: reviews.filter((r: any) => r.rating === 2).length,
      1: reviews.filter((r: any) => r.rating === 1).length,
    };

    const totalRating = reviews.reduce((sum: any, review: any) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / total) * 10) / 10;

    return {
      total,
      averageRating,
      distribution,
    };
  }

  /**
   * Проверить, может ли пользователь оставить отзыв
   */
  async canLeaveReview(orderId: string, userId: string): Promise<{
    canLeave: boolean;
    reason?: string;
    revieweeId?: string;
  }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { canLeave: false, reason: 'Заказ не найден' };
    }

    if (order.status !== 'COMPLETED') {
      return { canLeave: false, reason: 'Заказ ещё не завершён' };
    }

    if (userId !== order.customerId && userId !== order.executorId) {
      return { canLeave: false, reason: 'Вы не участвовали в этом заказе' };
    }

    // Проверить, не оставлен ли уже отзыв
    const existing = await prisma.review.findUnique({
      where: {
        orderId_reviewerId: {
          orderId,
          reviewerId: userId,
        },
      },
    });

    if (existing) {
      return { canLeave: false, reason: 'Вы уже оставили отзыв по этому заказу' };
    }

    // Определить, о ком будет отзыв
    const revieweeId = userId === order.customerId ? order.executorId! : order.customerId;

    return { canLeave: true, revieweeId };
  }

  /**
   * Получить отзывы, ожидающие модерации
   */
  async getPendingReviews(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          status: 'PENDING',
        },
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              photo: true,
              role: true,
            },
          },
          reviewee: {
            select: {
              id: true,
              fullName: true,
              photo: true,
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
          createdAt: 'asc', // Старые первыми
        },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: {
          status: 'PENDING',
        },
      }),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default new ReviewService();

