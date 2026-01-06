import { Router } from 'express';
import { getStudentInterestData, patchStudentInterest } from '../controllers/studentInterest.controller';

const router = Router();

// GET /api/student-interest?studentIvyServiceId=xxx - Get student interest
router.get('/', getStudentInterestData);

// PATCH /api/student-interest - Update student interest (Counselor only)
router.patch('/', patchStudentInterest);

export default router;

