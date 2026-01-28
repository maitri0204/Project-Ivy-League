import { Router } from 'express';
import {
  evaluateActivityHandler,
  getStudentActivitiesHandler,
  proofUploadMiddleware,
  counselorDocsMiddleware,
  selectActivitiesHandler,
  uploadProofHandler,
  uploadCounselorDocumentsHandler,
  updateDocumentTaskStatusHandler,
  updateWeightagesHandler,
} from '../controllers/pointerActivity.controller';

const router = Router();

// Counselor selects activities
router.post('/select', selectActivitiesHandler);

// Student / counselor fetch activities
router.get('/student/:studentId', getStudentActivitiesHandler);
router.get('/student', getStudentActivitiesHandler);

// Student uploads proof files
router.post('/proof/upload', proofUploadMiddleware, uploadProofHandler);

// Counselor uploads documents for activities
router.post('/counselor/documents', counselorDocsMiddleware, uploadCounselorDocumentsHandler);

// Counselor updates task completion status
router.post('/counselor/task/status', updateDocumentTaskStatusHandler);

// Counselor updates weightages for activities
router.put('/weightages', updateWeightagesHandler);

// Counselor evaluates submission
router.post('/evaluate', evaluateActivityHandler);

export default router;


