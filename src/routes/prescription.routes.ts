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

// Upload flow (patients only): presigned S3 PUT → complete. No automated
// analysis — the image is stored as-is for pharmacists to review manually.
router.post('/presign', authorize('patient'), uploadLimiter, validate(presignUploadSchema), prescriptionController.presignUpload);
router.post('/complete', authorize('patient'), uploadLimiter, validate(completeUploadSchema), prescriptionController.completeUpload);
router.post('/upload', authorize('patient'), uploadLimiter, upload.single('image'), prescriptionController.uploadPrescription);
router.get('/', authorize('patient'), prescriptionController.getPrescriptions);

// Viewing: the owning patient, or a pharmacy that received an order carrying
// this prescription (object-level check inside the controller).
router.get('/:id', authorize('patient', 'pharmacy'), prescriptionController.getPrescriptionById);
router.get('/:id/image', authorize('patient', 'pharmacy'), prescriptionController.getPrescriptionImage);

export default router;
