import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { sendMessageSchema } from '../validations/message.validation';

const router = Router();

router.use(authenticate);

router.get('/:orderId/:recipientId', messageController.getChatHistory);
router.post('/', validate(sendMessageSchema), messageController.sendMessage);
router.put('/:id/read', messageController.markAsRead);
router.put('/read-all/:orderId', messageController.markAllAsRead);

export default router;
