import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { authenticate, requireRole, requireStatus } from '../middleware/auth.middleware';
import {
  createOrderSchema,
  updateOrderSchema,
  getOrdersQuerySchema,
} from '../validation/order.validation';
import { upload } from '../config/multer';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Публичные маршруты (для всех авторизованных)
router.get('/', validateQuery(getOrdersQuerySchema), orderController.getOrders);
router.get('/my/list', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

// Маршруты для заказчиков
router.post(
  '/',
  requireRole('CUSTOMER'),
  requireStatus('ACTIVE'),
  validateBody(createOrderSchema),
  orderController.createOrder
);

router.put(
  '/:id',
  requireRole('CUSTOMER'),
  validateBody(updateOrderSchema),
  orderController.updateOrder
);

router.delete('/:id', requireRole('CUSTOMER'), orderController.cancelOrder);

router.post('/:id/select-executor', requireRole('CUSTOMER'), orderController.selectExecutor);

router.post(
  '/:id/upload-files',
  requireRole('CUSTOMER'),
  upload.array('files', 5),
  orderController.uploadFiles
);

// Маршруты для исполнителей
router.post(
  '/:id/start-work',
  requireRole('EXECUTOR'),
  requireStatus('ACTIVE'),
  orderController.startWork
);

router.post(
  '/:id/cancel-work',
  requireRole('EXECUTOR'),
  requireStatus('ACTIVE'),
  orderController.cancelWork
);

router.post(
  '/:id/complete',
  requireRole('EXECUTOR'),
  requireStatus('ACTIVE'),
  orderController.completeOrder
);

export default router;

