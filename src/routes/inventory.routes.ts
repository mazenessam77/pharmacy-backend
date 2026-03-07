import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { uploadCSV } from '../middleware/upload';
import { addInventorySchema, updateInventorySchema } from '../validations/inventory.validation';

const router = Router();

router.use(authenticate);
router.use(authorize('pharmacy'));

router.get('/', inventoryController.getInventory);
router.post('/', validate(addInventorySchema), inventoryController.addInventoryItem);
router.put('/:id', validate(updateInventorySchema), inventoryController.updateInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);
router.post('/bulk-import', uploadCSV.single('file'), inventoryController.bulkImport);

export default router;
