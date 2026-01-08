import express from 'express';
import { getCounselorPerformanceHandler } from '../controllers/counselorPerformance.controller';

const router = express.Router();

// GET /admin/counselor/performance
router.get('/counselor/performance', getCounselorPerformanceHandler);

export default router;
