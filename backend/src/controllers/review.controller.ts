import { Response } from 'express';
import { AuthRequest } from '../types';
import reviewService from '../services/review.service';

export class ReviewController {
  /**
   * POST /api/reviews
   * Создать отзыв
   */
  async createReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { orderId, rating, comment } = req.body;

      // Проверить, может ли пользователь оставить отзыв
      const canLeave = await reviewService.canLeaveReview(orderId, req.user.id);

      if (!canLeave.canLeave) {
        res.status(400).json({ error: canLeave.reason });
        return;
      }

      const review = await reviewService.createReview({
        orderId,
        reviewerId: req.user.id,
        revieweeId: canLeave.revieweeId!,
        rating,
        comment,
      });

      res.status(201).json({
        message: 'Отзыв создан и отправлен на модерацию',
        review,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/reviews/user/:userId
   * Получить отзывы о пользователе
   */
  async getUserReviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const status = req.query.status as string | undefined;

      // Только одобренные отзывы видны всем
      const reviews = await reviewService.getUserReviews(
        userId,
        status === 'all' && req.user?.role === 'ADMIN' ? undefined : 'APPROVED'
      );

      res.json({ reviews });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/reviews/my
   * Получить отзывы, оставленные текущим пользователем
   */
  async getMyReviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const reviews = await reviewService.getReviewsByUser(req.user.id);

      res.json({ reviews });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/reviews/:id
   * Получить отзыв по ID
   */
  async getReviewById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const review = await reviewService.getReviewById(id);

      if (!review) {
        res.status(404).json({ error: 'Отзыв не найден' });
        return;
      }

      res.json({ review });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/reviews/order/:orderId/can-leave
   * Проверить, может ли пользователь оставить отзыв
   */
  async canLeaveReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { orderId } = req.params;

      const result = await reviewService.canLeaveReview(orderId, req.user.id);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/reviews/user/:userId/stats
   * Получить статистику отзывов пользователя
   */
  async getUserReviewStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const stats = await reviewService.getUserReviewStats(userId);

      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/reviews/pending
   * Получить отзывы на модерации (только для админов)
   */
  async getPendingReviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Доступ запрещён' });
        return;
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await reviewService.getPendingReviews(page, limit);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/reviews/:id/moderate
   * Модерировать отзыв (только для админов)
   */
  async moderateReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Доступ запрещён' });
        return;
      }

      const { id } = req.params;
      const { action, note } = req.body;

      let review;

      if (action === 'approve') {
        review = await reviewService.approveReview(id, req.user.id);
      } else if (action === 'reject') {
        review = await reviewService.rejectReview(id, req.user.id, note);
      } else {
        res.status(400).json({ error: 'Некорректное действие' });
        return;
      }

      res.json({
        message: action === 'approve' ? 'Отзыв одобрен' : 'Отзыв отклонён',
        review,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new ReviewController();

