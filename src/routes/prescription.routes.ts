import { Router } from 'express';
import * as prescriptionController from '../controllers/prescription.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { upload } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(authorize('patient'));

router.post('/upload', uploadLimiter, upload.single('image'), prescriptionController.uploadPrescription);
router.post('/scan', uploadLimiter, upload.single('image'), prescriptionController.scanPrescription);
router.get('/', prescriptionController.getPrescriptions);
router.get('/:id', prescriptionController.getPrescriptionById);
router.put('/:id/verify', prescriptionController.verifyPrescription);

export default router;
