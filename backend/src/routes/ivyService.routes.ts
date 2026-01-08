import { Router } from 'express';
import { createIvyService, getStudentsForCounselorHandler, getServiceDetailsHandler, updateInterestHandler } from '../controllers/ivyService.controller';

const router = Router();

// POST /api/ivy-service - Create new Ivy League service
router.post('/', createIvyService);

// GET /api/ivy-service/counselor/:counselorId/students
router.get('/counselor/:counselorId/students', getStudentsForCounselorHandler);

// GET /api/ivy-service/:serviceId - Get service details
router.get('/:serviceId', getServiceDetailsHandler);

// PUT /api/ivy-service/:serviceId/interest - Update student interest
router.put('/:serviceId/interest', updateInterestHandler);

export default router;

