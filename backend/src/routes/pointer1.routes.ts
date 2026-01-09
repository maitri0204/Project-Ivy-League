import { Router } from 'express';
import {
    uploadAcademicDocumentHandler,
    academicUploadMiddleware,
    evaluateAcademicHandler,
    getAcademicStatusHandler,
} from '../controllers/pointer1.controller';

const router = Router();

// POST /api/pointer1/upload - Student uploads a document
router.post('/upload', academicUploadMiddleware, uploadAcademicDocumentHandler);

// POST /api/pointer1/evaluate - Counselor evaluates Pointer 1
router.post('/evaluate', evaluateAcademicHandler);

// GET /api/pointer1/status/:studentId - Get status and documents
router.get('/status/:studentId', getAcademicStatusHandler);

export default router;
