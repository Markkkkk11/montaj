import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticate);

// Получить уведомления
router.get('/', notificationController.getNotifications);

// Получить количество непрочитанных
router.get('/unread-count', notificationController.getUnreadCount);

// Отметить одно как прочитанное
router.patch('/:notificationId/read', notificationController.markAsRead);

// Отметить все как прочитанные
router.post('/mark-all-read', notificationController.markAllAsRead);

// Удалить уведомление
router.delete('/:notificationId', notificationController.deleteNotification);

// Настройки уведомлений
router.get('/settings', notificationController.getSettings);
router.put('/settings', notificationController.updateSettings);

export default router;

