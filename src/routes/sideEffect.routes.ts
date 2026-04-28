import { Router } from 'express';
import * as sideEffectController from '../controllers/sideEffect.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.post('/', sideEffectController.createSideEffectReport);
router.get('/me', sideEffectController.getMySideEffectReports);
router.get('/pending', sideEffectController.listPendingReports);
router.get('/:id', sideEffectController.getSideEffectReportById);
router.patch('/:id/review', sideEffectController.reviewSideEffectReport);
router.post('/:id/regenerate', sideEffectController.regenerateAIRecommendation);

export default router;
