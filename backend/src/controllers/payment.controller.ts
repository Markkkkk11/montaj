import { Request, Response } from 'express';
import paymentService from '../services/payment.service';
import subscriptionService from '../services/subscription.service';

export class PaymentController {
  /**
   * Создать платёж для пополнения баланса
   */
  async createTopUp(req: Request, res: Response) {
    try {
      const { amount } = req.body;
      const userId = req.user!.id;

      const returnUrl = `${process.env.FRONTEND_URL}/profile/balance?tab=payments`;

      const payment = await paymentService.createTopUpPayment(
        userId,
        parseFloat(amount),
        returnUrl
      );

      res.json({
        success: true,
        payment,
        confirmationUrl: payment.confirmationUrl,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Создать платёж для подписки Premium
   */
  async createSubscriptionPayment(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const tariffType = 'PREMIUM';

      const returnUrl = `${process.env.FRONTEND_URL}/profile/subscription`;

      const payment = await paymentService.createSubscriptionPayment(
        userId,
        tariffType,
        returnUrl
      );

      res.json({
        success: true,
        payment,
        confirmationUrl: payment.confirmationUrl,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получить информацию о платеже
   */
  async getPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const payment = await paymentService.getPayment(id, userId);

      res.json({
        success: true,
        payment,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получить историю платежей
   */
  async getPaymentHistory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await paymentService.getUserPayments(userId, page, limit);

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

  /**
   * Обработать успешный платёж (callback после оплаты)
   */
  async handlePaymentSuccess(req: Request, res: Response) {
    try {
      const { payment_id } = req.query;

      if (!payment_id || typeof payment_id !== 'string') {
        throw new Error('Отсутствует ID платежа');
      }

      const payment = await paymentService.processSuccessfulPayment(payment_id);

      res.json({
        success: true,
        payment,
        message: 'Платёж успешно обработан',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Webhook от ЮKassa
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const event = req.body;

      await paymentService.handleWebhook(event);

      // ЮKassa ожидает 200 OK
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      // Всё равно возвращаем 200, чтобы ЮKassa не повторяла запрос
      res.status(200).json({ success: false });
    }
  }
}

export default new PaymentController();

