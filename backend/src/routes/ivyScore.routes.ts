import { Router } from 'express';
import { getStudentIvyScore, recalculateIvyScore } from '../controllers/ivyScore.controller';

const router = Router();

// GET /api/ivy-score/:studentId - Get Ivy score for a student
router.get('/:studentId', getStudentIvyScore);

// POST /api/ivy-score/recalculate/:studentId - Manually recalculate score
router.post('/recalculate/:studentId', recalculateIvyScore);

export default router;
