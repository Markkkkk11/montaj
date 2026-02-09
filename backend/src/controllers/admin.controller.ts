import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import adminService from '../services/admin.service';

export class AdminController {
  /**
   * Получить общую статистику платформы
   */
  async getStatistics(req: AuthRequest, res: Response) {
    try {
      const statistics = await adminService.getStatistics();

      res.json({
        success: true,
        statistics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получить пользователей для модерации
   */
  async getUsersForModeration(req: AuthRequest, res: Response) {
    try {
      const { status } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await adminService.getUsersForModeration(
        status as string,
        page,
        limit
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Модерировать пользователя
   */
  async moderateUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { action, reason } = req.body;
      const adminId = req.user!.id;

      const user = await adminService.moderateUser(userId, action, adminId, reason);

      res.json({
        success: true,
        user,
        message: `Пользователь ${action === 'APPROVE' ? 'одобрен' : action === 'REJECT' ? 'отклонён' : action === 'BLOCK' ? 'заблокирован' : 'разблокирован'}`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получить заказы для модерации
   */
  async getOrdersForModeration(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await adminService.getOrdersForModeration(page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Модерировать заказ
   */
  async moderateOrder(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const { action, reason } = req.body;
      const adminId = req.user!.id;

      const order = await adminService.moderateOrder(orderId, action, adminId, reason);

      res.json({
        success: true,
        order,
        message: `Заказ ${action === 'APPROVE' ? 'одобрен' : 'отклонён'}`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получить отзывы для модерации
   */
  async getReviewsForModeration(req: AuthRequest, res: Response) {
    try {
      const { status } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await adminService.getReviewsForModeration(
        status as string,
        page,
        limit
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Модерировать отзыв
   */
  async moderateReview(req: AuthRequest, res: Response) {
    try {
      const { reviewId } = req.params;
      const { action, note } = req.body;
      const adminId = req.user!.id;

      const review = await adminService.moderateReview(reviewId, action, adminId, note);

      res.json({
        success: true,
        review,
        message: `Отзыв ${action === 'APPROVE' ? 'одобрен' : 'отклонён'}`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получить логи действий администраторов
   */
  async getAdminLogs(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await adminService.getAdminLogs(page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получить финансовую аналитику
   */
  async getFinancialAnalytics(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const result = await adminService.getFinancialAnalytics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        analytics: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получить пользователя по ID
   */
  async getUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const user = await adminService.getUserById(userId);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Обновить пользователя
   */
  async updateUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const user = await adminService.updateUser(userId, req.body);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Удалить пользователя
   */
  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      await adminService.deleteUser(userId);
      res.json({ message: 'Пользователь удален' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Обновить баланс пользователя
   */
  async updateUserBalance(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { amount, bonusAmount } = req.body;
      const balance = await adminService.updateUserBalance(userId, amount, bonusAmount);
      res.json(balance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Обновить подписку пользователя
   */
  async updateUserSubscription(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const subscription = await adminService.updateUserSubscription(userId, req.body);
      res.json(subscription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Получить заказ по ID
   */
  async getOrder(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await adminService.getOrderById(orderId);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Обновить заказ
   */
  async updateOrder(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await adminService.updateOrder(orderId, req.body);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Удалить заказ
   */
  async deleteOrder(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      await adminService.deleteOrder(orderId);
      res.json({ message: 'Заказ удален' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AdminController();

