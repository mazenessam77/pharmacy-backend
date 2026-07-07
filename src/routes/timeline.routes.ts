import { Router } from 'express';
import * as timelineController from '../controllers/timeline.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateQuery } from '../middleware/validate';
import { timelineQuerySchema } from '../validations/timeline.validation';

const router = Router();

router.use(authenticate);
// Patient-only: the feed is the patient's own story (pharmacies/admins have
// their own views elsewhere).
router.get('/', authorize('patient'), validateQuery(timelineQuerySchema), timelineController.getMyTimeline);

export default router;
