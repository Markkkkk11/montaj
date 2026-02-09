import { Router } from 'express';
import reviewController from '../controllers/review.controller';
import { validateBody } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { createReviewSchema, moderateReviewSchema } from '../validation/review.validation';

const router = Router();

// Публичные маршруты (с аутентификацией)
router.get('/user/:userId', reviewController.getUserReviews);
router.get('/user/:userId/stats', reviewController.getUserReviewStats);
router.get('/:id', reviewController.getReviewById);

// Требуют аутентификации
router.use(authenticate);

router.post('/', validateBody(createReviewSchema), reviewController.createReview);
router.get('/my', reviewController.getMyReviews);
router.get('/order/:orderId/can-leave', reviewController.canLeaveReview);

// Только для админов
router.get('/pending', reviewController.getPendingReviews);
router.post('/:id/moderate', validateBody(moderateReviewSchema), reviewController.moderateReview);

export default router;

