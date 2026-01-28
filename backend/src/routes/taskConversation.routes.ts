import express from 'express';
import { getTaskConversation, addTaskMessage, messageFileUploadMiddleware } from '../controllers/taskConversation.controller';

const router = express.Router();

router.get('/conversation', getTaskConversation);
router.post('/conversation/message', messageFileUploadMiddleware, addTaskMessage);

export default router;
