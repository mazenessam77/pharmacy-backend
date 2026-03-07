import { Router } from 'express';
import * as orderResponseController from '../controllers/orderResponse.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createOrderResponseSchema } from '../validations/order.validation';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', authorize('pharmacy'), validate(createOrderResponseSchema), orderResponseController.submitResponse);
router.get('/', authorize('patient', 'admin'), orderResponseController.getResponses);
router.put('/:responseId/accept', authorize('patient'), orderResponseController.acceptResponse);

export default router;
