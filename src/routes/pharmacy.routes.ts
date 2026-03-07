import { Router } from 'express';
import * as pharmacyController from '../controllers/pharmacy.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/nearby', authenticate, pharmacyController.getNearbyPharmacies);
router.put('/status', authenticate, authorize('pharmacy'), pharmacyController.togglePharmacyStatus);
router.get('/:id', authenticate, pharmacyController.getPharmacyById);

export default router;
