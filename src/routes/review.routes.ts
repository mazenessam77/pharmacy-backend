import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createReviewSchema } from '../validations/review.validation';

const router = Router();

router.use(authenticate);

router.post('/', authorize('patient'), validate(createReviewSchema), reviewController.createReview);
router.get('/pharmacy/:id', reviewController.getPharmacyReviews);

export default router;
