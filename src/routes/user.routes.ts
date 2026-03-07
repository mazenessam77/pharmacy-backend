import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', upload.single('avatar'), userController.updateProfile);
router.put('/location', userController.updateLocation);
router.put('/search-radius', userController.updateSearchRadius);
router.put('/fcm-token', userController.updateFcmToken);

export default router;
