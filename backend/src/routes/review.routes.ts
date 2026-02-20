import { Router } from 'express';
import reviewController from '../controllers/review.controller';
import { validateBody } from '../middleware/validation.middleware';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { createReviewSchema, moderateReviewSchema } from '../validation/review.validation';

const router = Router();

// Публичные маршруты (с опциональной аутентификацией для admin-проверки)
router.get('/user/:userId', optionalAuth, reviewController.getUserReviews);
router.get('/user/:userId/stats', reviewController.getUserReviewStats);

// Все маршруты ниже требуют аутентификации
router.use(authenticate);

// Именованные маршруты ПЕРЕД динамическим /:id
router.post('/', validateBody(createReviewSchema), reviewController.createReview);
router.get('/my', reviewController.getMyReviews);
router.get('/order/:orderId/can-leave', reviewController.canLeaveReview);
router.get('/pending', reviewController.getPendingReviews);

// Динамические маршруты ПОСЛЕ именованных (чтобы /:id не перехватывал /my, /pending и т.д.)
router.get('/:id', reviewController.getReviewById);
router.post('/:id/moderate', validateBody(moderateReviewSchema), reviewController.moderateReview);

export default router;
