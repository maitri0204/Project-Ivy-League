import { Router } from 'express';
import {
  uploadCourseListHandler,
  uploadCourseListMiddleware,
  uploadCertificatesHandler,
  uploadCertificatesMiddleware,
  replaceCertificateHandler,
  replaceCertificateMiddleware,
  deleteCertificateHandler,
  evaluateCertificateHandler,
  evaluatePointer6Handler,
  getPointer6StatusHandler,
} from '../controllers/pointer6.controller';

const router = Router();

// POST /pointer6/course-list/upload - Counselor uploads course list Excel
router.post('/course-list/upload', uploadCourseListMiddleware, uploadCourseListHandler);

// POST /pointer6/certificate/upload - Student uploads certificates (multiple)
router.post('/certificate/upload', uploadCertificatesMiddleware, uploadCertificatesHandler);

// PUT /pointer6/certificate/:certificateId/replace - Student replaces a certificate
router.put('/certificate/:certificateId/replace', replaceCertificateMiddleware, replaceCertificateHandler);

// DELETE /pointer6/certificate/:certificateId - Student deletes a certificate
router.delete('/certificate/:certificateId', deleteCertificateHandler);

// POST /pointer6/certificate/:certificateId/evaluate - Counselor evaluates individual certificate
router.post('/certificate/:certificateId/evaluate', evaluateCertificateHandler);

// POST /pointer6/evaluate - Counselor assigns score (DEPRECATED - use individual certificate evaluation)
router.post('/evaluate', evaluatePointer6Handler);

// GET /pointer6/status/:studentId - by studentId
// GET /pointer6/status?studentIvyServiceId=xxx - by serviceId
router.get('/status', getPointer6StatusHandler);
router.get('/status/:studentId', getPointer6StatusHandler);

export default router;


