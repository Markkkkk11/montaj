import { Router } from 'express';
import responseController from '../controllers/response.controller';
import { authenticate, requireRole, requireStatus } from '../middleware/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Создать отклик (только исполнители)
router.post(
  '/',
  requireRole('EXECUTOR'),
  requireStatus('ACTIVE'),
  responseController.createResponse
);

// Получить отклики на заказ (только заказчик)
router.get('/order/:orderId', responseController.getOrderResponses);

// Получить мои отклики (только исполнители)
router.get('/my', requireRole('EXECUTOR'), responseController.getMyResponses);

export default router;

