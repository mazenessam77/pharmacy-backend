import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createOrderSchema, cancelOrderSchema, updateOrderStatusSchema } from '../validations/order.validation';

const router = Router();

router.use(authenticate);

router.post('/', authorize('patient'), validate(createOrderSchema), orderController.createOrder);
router.get('/', authorize('patient', 'pharmacy'), orderController.getOrders);
router.get('/:id', authorize('patient', 'pharmacy', 'admin'), orderController.getOrderById);
router.put('/:id/cancel', authorize('patient'), orderController.cancelOrder);
router.put('/:id/status', authorize('pharmacy'), validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.post('/:id/reorder', authorize('patient'), orderController.reorder);

export default router;
