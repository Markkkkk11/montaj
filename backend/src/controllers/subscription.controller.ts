import { Request, Response } from 'express';
import subscriptionService from '../services/subscription.service';

export class SubscriptionController {
  /**
   * Получить текущую подписку пользователя
   */
  async getMySubscription(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const subscription = await subscriptionService.getUserSubscription(userId);

      res.json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получить текущий тариф
   */
  async getCurrentTariff(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const tariff = await subscriptionService.getCurrentTariff(userId);

      res.json({
        success: true,
        tariff,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Сменить тариф на Standard или Comfort
   */
  async changeTariff(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { tariffType } = req.body;

      if (!['STANDARD', 'COMFORT'].includes(tariffType)) {
        throw new Error('Можно переключиться только на Standard или Comfort. Для Premium требуется оплата.');
      }

      const subscription = await subscriptionService.changeTariff(userId, tariffType);

      res.json({
        success: true,
        subscription,
        message: `Тариф изменён на ${tariffType}`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получить информацию о всех тарифах
   */
  async getTariffInfo(req: Request, res: Response) {
    try {
      const tariffInfo = subscriptionService.getTariffInfo();

      res.json({
        success: true,
        tariffs: tariffInfo,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Проверить возможность отклика на заказ
   */
  async checkCanRespond(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const result = await subscriptionService.canRespondToOrder(userId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new SubscriptionController();

