import { Router } from 'express';
import * as medicineController from '../controllers/medicine.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', medicineController.getMedicines);
router.get('/autocomplete', medicineController.autocomplete);
router.get('/:id', medicineController.getMedicineById);

export default router;
