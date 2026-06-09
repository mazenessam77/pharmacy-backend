import { Router } from 'express';
import * as savedMedicationController from '../controllers/savedMedication.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  saveMedicationSchema,
  updateSavedMedicationSchema,
} from '../validations/savedMedication.validation';

// Mounted at /api/medications  ->  endpoints live under /api/medications/saved
const router = Router();

router.use(authenticate);

router.post('/saved', authorize('patient'), validate(saveMedicationSchema), savedMedicationController.saveMedication);
router.get('/saved', authorize('patient'), savedMedicationController.getSavedMedications);
router.patch('/saved/:id', authorize('patient'), validate(updateSavedMedicationSchema), savedMedicationController.updateSavedMedication);
router.delete('/saved/:id', authorize('patient'), savedMedicationController.deleteSavedMedication);

export default router;
