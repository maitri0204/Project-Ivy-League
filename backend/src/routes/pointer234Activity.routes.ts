import { Router } from 'express';
import {
  selectActivitiesHandler,
  getStudentActivitiesHandler,
  uploadProofHandler,
  uploadProofMiddleware,
  evaluateActivityHandler,
  updateWeightagesHandler,
} from '../controllers/pointer234Activity.controller';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Pointer 2/3/4 Activity routes are working' });
});

// POST /pointer/activity/select - Counselor selects activities
router.post('/activity/select', selectActivitiesHandler);

// GET /pointer/activity/student/:studentId - Get student activities
router.get('/activity/student/:studentId', getStudentActivitiesHandler);

// PUT /pointer/activity/weightages - Counselor updates weightages
router.put('/activity/weightages', updateWeightagesHandler);

// POST /pointer/activity/proof/upload - Student uploads proof
router.post('/activity/proof/upload', uploadProofMiddleware, uploadProofHandler);

// POST /pointer/activity/evaluate - Counselor evaluates activity
router.post('/activity/evaluate', evaluateActivityHandler);

export default router;

