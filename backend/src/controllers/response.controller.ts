import { Response } from 'express';
import { AuthRequest } from '../types';
import responseService from '../services/response.service';

export class ResponseController {
  /**
   * POST /api/responses
   * Создать отклик на заказ
   */
  async createResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      if (req.user.role !== 'EXECUTOR') {
        res.status(403).json({ error: 'Только исполнители могут откликаться на заказы' });
        return;
      }

      if (req.user.status !== 'ACTIVE') {
        res.status(403).json({ 
          error: 'Ваш профиль должен быть активирован для откликов',
          status: req.user.status 
        });
        return;
      }

      const { orderId } = req.body;

      if (!orderId) {
        res.status(400).json({ error: 'ID заказа обязателен' });
        return;
      }

      const response = await responseService.createResponse(orderId, req.user.id);

      res.status(201).json({
        message: 'Отклик отправлен успешно',
        response,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/responses/order/:orderId
   * Получить отклики на заказ (для заказчика)
   */
  async getOrderResponses(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { orderId } = req.params;

      const responses = await responseService.getOrderResponses(orderId, req.user.id);

      res.json({ responses });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/responses/my
   * Получить мои отклики (для исполнителя)
   */
  async getMyResponses(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      if (req.user.role !== 'EXECUTOR') {
        res.status(403).json({ error: 'Только исполнители имеют отклики' });
        return;
      }

      const responses = await responseService.getExecutorResponses(req.user.id);

      res.json({ responses });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ResponseController();

