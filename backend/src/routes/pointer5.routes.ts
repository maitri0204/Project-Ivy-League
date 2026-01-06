import { Router } from 'express';
import {
  uploadGuidelineHandler,
  uploadGuidelineMiddleware,
  uploadEssayHandler,
  uploadEssayMiddleware,
  evaluateEssayHandler,
  getStatusHandler,
} from '../controllers/pointer5.controller';

const router = Router();

// POST /pointer5/guideline/upload - Counselor uploads guideline
router.post('/guideline/upload', uploadGuidelineMiddleware, uploadGuidelineHandler);

// POST /pointer5/essay/upload - Student uploads essay
router.post('/essay/upload', uploadEssayMiddleware, uploadEssayHandler);

// POST /pointer5/essay/evaluate - Counselor evaluates essay
router.post('/essay/evaluate', evaluateEssayHandler);

// GET /pointer5/status/:studentId - Get status by studentId (all roles)
// GET /pointer5/status?studentIvyServiceId=xxx - Get status by serviceId (all roles)
router.get('/status', getStatusHandler);
router.get('/status/:studentId', getStatusHandler);

export default router;


