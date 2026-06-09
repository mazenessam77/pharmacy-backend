import { Router } from 'express';
import * as savedBasketController from '../controllers/savedBasket.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createBasketSchema, updateBasketSchema } from '../validations/savedBasket.validation';

// Mounted at /api/baskets — a patient's reusable medicine baskets.
const router = Router();

router.use(authenticate);

router.post('/', authorize('patient'), validate(createBasketSchema), savedBasketController.createBasket);
router.get('/', authorize('patient'), savedBasketController.getBaskets);
router.patch('/:id', authorize('patient'), validate(updateBasketSchema), savedBasketController.updateBasket);
router.delete('/:id', authorize('patient'), savedBasketController.deleteBasket);

export default router;
