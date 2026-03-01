import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import settingsController from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireActiveAdmin } from '../middleware/admin.middleware';
import { validateBody } from '../middleware/validation.middleware';
import {
  moderateUserSchema,
  moderateOrderSchema,
  moderateReviewSchema,
} from '../validation/admin.validation';

const router = Router();

// Все роуты требуют аутентификации и прав администратора
router.use(authenticate);
router.use(requireActiveAdmin);

// Статистика
router.get('/statistics', adminController.getStatistics);
router.get('/stats', adminController.getStatistics); // Alias

// Настройки платформы
router.get('/settings', settingsController.getAll);
router.get('/settings/:section', settingsController.getBySection);
router.put('/settings/:section', settingsController.updateSection);

// Управление пользователями
router.get('/users', adminController.getUsersForModeration);
router.get('/users/:userId/activity', adminController.getUserActivity);
router.get('/users/:userId', adminController.getUser);
router.patch('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
router.patch('/users/:userId/balance', adminController.updateUserBalance);
router.patch('/users/:userId/subscription', adminController.updateUserSubscription);
router.post('/users/:userId/moderate', validateBody(moderateUserSchema), adminController.moderateUser);

// Управление заказами
router.get('/orders', adminController.getOrdersForModeration);
router.get('/orders/:orderId', adminController.getOrder);
router.patch('/orders/:orderId', adminController.updateOrder);
router.delete('/orders/:orderId', adminController.deleteOrder);
router.post('/orders/:orderId/moderate', validateBody(moderateOrderSchema), adminController.moderateOrder);

// Управление отзывами
router.get('/reviews', adminController.getReviewsForModeration);
router.post('/reviews/:reviewId/moderate', validateBody(moderateReviewSchema), adminController.moderateReview);

// Логи действий администраторов
router.get('/logs', adminController.getAdminLogs);

// Финансовая аналитика
router.get('/analytics/financial', adminController.getFinancialAnalytics);

// История пополнений
router.get('/payments', adminController.getPaymentHistory);

export default router;

