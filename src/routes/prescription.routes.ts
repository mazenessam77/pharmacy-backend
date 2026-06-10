import { Router } from 'express';
import * as prescriptionController from '../controllers/prescription.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { upload } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { presignUploadSchema, completeUploadSchema } from '../validations/prescription.validation';

const router = Router();

router.use(authenticate);
router.use(authorize('patient'));

// Async pipeline: presigned S3 upload → complete (creates doc + enqueues SQS job)
router.post('/presign', uploadLimiter, validate(presignUploadSchema), prescriptionController.presignUpload);
router.post('/complete', uploadLimiter, validate(completeUploadSchema), prescriptionController.completeUpload);
router.get('/:id/image', prescriptionController.getPrescriptionImage);

router.post('/upload', uploadLimiter, upload.single('image'), prescriptionController.uploadPrescription);
router.post('/scan', uploadLimiter, upload.single('image'), prescriptionController.scanPrescription);
router.get('/', prescriptionController.getPrescriptions);
router.get('/:id', prescriptionController.getPrescriptionById);
router.put('/:id/verify', prescriptionController.verifyPrescription);

export default router;
