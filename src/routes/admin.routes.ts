import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/stats', adminController.getStats);
router.get('/pharmacies/pending', adminController.getPendingPharmacies);
router.get('/pharmacies', adminController.getAllPharmacies);
router.put('/pharmacies/:id/verify', adminController.verifyPharmacy);
router.delete('/pharmacies/:id', adminController.deletePharmacy);
router.get('/users', adminController.getUsers);
router.put('/users/:id/ban', adminController.banUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderDetails);
router.delete('/orders/:id', adminController.deleteOrder);

// Medicine catalog CRUD
router.post('/medicines', adminController.createMedicine);
router.put('/medicines/:id', adminController.updateMedicine);
router.delete('/medicines/:id', adminController.deleteMedicine);

export default router;
