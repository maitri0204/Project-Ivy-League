import { Router } from 'express';
import {
  uploadCourseListHandler,
  uploadCourseListMiddleware,
  uploadCertificatesHandler,
  uploadCertificatesMiddleware,
  evaluatePointer6Handler,
  getPointer6StatusHandler,
} from '../controllers/pointer6.controller';

const router = Router();

// POST /pointer6/course-list/upload - Counselor uploads course list Excel
router.post('/course-list/upload', uploadCourseListMiddleware, uploadCourseListHandler);

// POST /pointer6/certificate/upload - Student uploads certificates (multiple)
router.post('/certificate/upload', uploadCertificatesMiddleware, uploadCertificatesHandler);

// POST /pointer6/evaluate - Counselor assigns score
router.post('/evaluate', evaluatePointer6Handler);

// GET /pointer6/status/:studentId - by studentId
// GET /pointer6/status?studentIvyServiceId=xxx - by serviceId
router.get('/status', getPointer6StatusHandler);
router.get('/status/:studentId', getPointer6StatusHandler);

export default router;


