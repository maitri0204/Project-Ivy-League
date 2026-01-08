import { Router } from 'express';
import {
  evaluateActivityHandler,
  getStudentActivitiesHandler,
  proofUploadMiddleware,
  selectActivitiesHandler,
  uploadProofHandler,
} from '../controllers/pointerActivity.controller';

const router = Router();

// Counselor selects activities
router.post('/select', selectActivitiesHandler);

// Student / counselor fetch activities
router.get('/student/:studentId', getStudentActivitiesHandler);
router.get('/student', getStudentActivitiesHandler);

// Student uploads proof files
router.post('/proof/upload', proofUploadMiddleware, uploadProofHandler);

// Counselor evaluates submission
router.post('/evaluate', evaluateActivityHandler);

export default router;


