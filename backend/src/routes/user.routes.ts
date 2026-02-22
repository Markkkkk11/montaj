import { Router } from 'express';
import userController from '../controllers/user.controller';
import { validateBody } from '../middleware/validation.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { updateProfileSchema, updateExecutorProfileSchema } from '../validation/user.validation';
import { upload } from '../config/multer';

const router = Router();

// Публичный профиль (без авторизации)
router.get('/:id/public', userController.getPublicProfile);

// Все маршруты ниже требуют аутентификации
router.use(authenticate);

// Профиль пользователя
router.get('/profile', userController.getProfile);
router.put('/profile', validateBody(updateProfileSchema), userController.updateProfile);
router.post('/upload-photo', upload.single('photo'), userController.uploadPhoto);

// Профиль исполнителя (только для исполнителей)
router.put(
  '/executor-profile',
  requireRole('EXECUTOR'),
  validateBody(updateExecutorProfileSchema),
  userController.updateExecutorProfile
);

router.post(
  '/work-photos',
  requireRole('EXECUTOR'),
  upload.single('photo'),
  userController.addWorkPhoto
);

router.delete('/work-photos', requireRole('EXECUTOR'), userController.removeWorkPhoto);

// Баланс (только для исполнителей)
router.get('/balance', requireRole('EXECUTOR'), userController.getBalance);

export default router;

