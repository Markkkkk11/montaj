import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createTopUpSchema } from '../validation/payment.validation';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticate);

// Создать платёж для пополнения
router.post('/top-up', validateBody(createTopUpSchema), paymentController.createTopUp);

// Создать платёж для подписки Premium
router.post('/subscription/premium', paymentController.createSubscriptionPayment);

// Получить информацию о платеже
router.get('/:id', paymentController.getPayment);

// Получить историю платежей
router.get('/', paymentController.getPaymentHistory);

// Callback после успешной оплаты
router.get('/success/callback', paymentController.handlePaymentSuccess);

export default router;

