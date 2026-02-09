import { Router } from 'express';
import chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Получить количество непрочитанных сообщений
router.get('/unread-count', chatController.getUnreadCount);

// Работа с сообщениями конкретного заказа
router.get('/:orderId/messages', chatController.getMessages);
router.post('/:orderId/messages', chatController.sendMessage);
router.post('/:orderId/mark-read', chatController.markAsRead);
router.get('/:orderId/unread-count', chatController.getUnreadCountByOrder);

export default router;

