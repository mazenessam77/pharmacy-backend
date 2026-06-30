import { Router } from 'express';
import * as deliveryController from '../controllers/delivery.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeDelivery } from '../middleware/authorizeDelivery';
import { validate } from '../middleware/validate';
import {
  assignDriverSchema,
  gpsFixSchema,
  updateDeliveryStatusSchema,
} from '../validations/delivery.validation';

const router = Router();

router.use(authenticate);

// Assignment creates the delivery, so it can't use authorizeDelivery (no delivery
// exists yet) — ownership is enforced inside the controller.
router.post('/:orderId/assign', validate(assignDriverSchema), deliveryController.assignDelivery);

// Reads — participant-only (patient / pharmacy / driver / admin).
router.get('/:orderId/tracking', authorizeDelivery, deliveryController.getTracking);
router.get('/:orderId/eta', authorizeDelivery, deliveryController.getEta);
router.get('/:orderId/driver', authorizeDelivery, deliveryController.getDriver);
router.get('/:orderId/history', authorizeDelivery, deliveryController.getHistory);

// Writes — assigned driver / admin (re-checked in the controller).
router.post('/:orderId/location', authorizeDelivery, validate(gpsFixSchema), deliveryController.postLocation);
router.patch('/:orderId/status', authorizeDelivery, validate(updateDeliveryStatusSchema), deliveryController.patchStatus);

// Dev/ops: simulate a driver GPS stream (admin-only, checked in controller).
router.post('/:orderId/simulate', authorizeDelivery, deliveryController.simulateDelivery);

export default router;
