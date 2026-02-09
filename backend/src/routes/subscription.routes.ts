import { Router } from 'express';
import subscriptionController from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { changeTariffSchema } from '../validation/payment.validation';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticate);

// Получить мою подписку
router.get('/my', subscriptionController.getMySubscription);

// Получить текущий тариф
router.get('/tariff', subscriptionController.getCurrentTariff);

// Получить информацию о тарифах
router.get('/tariffs', subscriptionController.getTariffInfo);

// Сменить тариф (только на Standard/Comfort)
router.post('/change-tariff', validateBody(changeTariffSchema), subscriptionController.changeTariff);

// Проверить возможность отклика
router.get('/can-respond', subscriptionController.checkCanRespond);

export default router;

