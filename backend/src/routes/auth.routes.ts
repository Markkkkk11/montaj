import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  verifySMSSchema,
  sendSMSSchema,
} from '../validation/auth.validation';

const router = Router();

// Публичные маршруты
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/verify-sms', validateBody(verifySMSSchema), authController.verifySMS);
router.post('/send-sms', validateBody(sendSMSSchema), authController.sendSMS);

// Защищённые маршруты
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);

export default router;

