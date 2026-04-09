import { Request, Response } from 'express';
import subscriptionService from '../services/subscription.service';

export class SubscriptionController {
  private ensureExecutor = (req: Request) => {
    if (req.user?.role !== 'EXECUTOR') {
      throw new Error('Раздел тарифов доступен только исполнителям');
    }
  };

  /**
   * Получить текущую подписку пользователя
   */
  getMySubscription = async (req: Request, res: Response) => {
    try {
      this.ensureExecutor(req);
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
  };

  /**
   * Получить текущий тариф
   */
  getCurrentTariff = async (req: Request, res: Response) => {
    try {
      this.ensureExecutor(req);
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
  };

  /**
   * Сменить тариф на Standard (бесплатно)
   * Comfort и Premium — через оплату (/payments/subscription)
   */
  changeTariff = async (req: Request, res: Response) => {
    try {
      this.ensureExecutor(req);
      const userId = req.user!.id;
      const { tariffType } = req.body;

      if (!tariffType || !['STANDARD', 'COMFORT'].includes(tariffType)) {
        throw new Error('Можно переключиться только на Стандарт или Комфорт. Премиум подключается через оплату.');
      }

      const subscription = await subscriptionService.changeTariff(userId, tariffType);
      const tariffName = tariffType === 'COMFORT' ? 'Комфорт' : 'Стандарт';

      res.json({
        success: true,
        subscription,
        message: `Тариф изменён на ${tariffName}`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Получить информацию о всех тарифах
   */
  getTariffInfo = async (req: Request, res: Response) => {
    try {
      const tariffInfo = await subscriptionService.getTariffInfo();

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
  };

  /**
   * Оплатить Premium с баланса
   */
  payFromBalance = async (req: Request, res: Response) => {
    try {
      this.ensureExecutor(req);
      const userId = req.user!.id;
      const { tariffType } = req.body;

      if (tariffType !== 'PREMIUM') {
        throw new Error('Оплата с баланса доступна только для тарифа PREMIUM');
      }

      const subscription = await subscriptionService.payFromBalance(userId, tariffType);

      res.json({
        success: true,
        subscription,
        message: 'Подписка «Премиум» активирована на 30 дней',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Проверить возможность отклика на заказ
   */
  checkCanRespond = async (req: Request, res: Response) => {
    try {
      this.ensureExecutor(req);
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
  };
}

export default new SubscriptionController();
