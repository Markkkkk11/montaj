import { Response } from 'express';
import { AuthRequest } from '../types';
import notificationService from '../services/notification.service';

export class NotificationController {
  /**
   * Получить уведомления пользователя
   */
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await notificationService.getUserNotifications(userId, page, limit);

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
   * Получить количество непрочитанных
   */
  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        count,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Отметить уведомление как прочитанное
   */
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { notificationId } = req.params;
      const userId = req.user!.id;

      const notification = await notificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        notification,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Отметить все как прочитанные
   */
  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'Все уведомления отмечены как прочитанные',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Удалить уведомление
   */
  async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const { notificationId } = req.params;
      const userId = req.user!.id;

      await notificationService.deleteNotification(notificationId, userId);

      res.json({
        success: true,
        message: 'Уведомление удалено',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получить настройки уведомлений
   */
  async getSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const settings = await notificationService.getOrCreateSettings(userId);

      res.json({
        success: true,
        settings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Обновить настройки уведомлений
   */
  async updateSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const settings = await notificationService.updateSettings(userId, req.body);

      res.json({
        success: true,
        settings,
        message: 'Настройки обновлены',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new NotificationController();

