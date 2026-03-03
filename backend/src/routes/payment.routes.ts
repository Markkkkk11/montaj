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

// Создать платёж для подписки (Comfort / Premium)
router.post('/subscription', paymentController.createSubscriptionPayment);

// Обратная совместимость: старый роут для Premium
router.post('/subscription/premium', (req, res, next) => {
  req.body.tariffType = 'PREMIUM';
  next();
}, paymentController.createSubscriptionPayment);

// Callback после успешной оплаты (ПЕРЕД /:id чтобы не перехватился)
router.get('/success/callback', paymentController.handlePaymentSuccess);

// Получить историю платежей
router.get('/', paymentController.getPaymentHistory);

// Получить информацию о платеже (параметризованный роут — в конце)
router.get('/:id', paymentController.getPayment);

export default router;
