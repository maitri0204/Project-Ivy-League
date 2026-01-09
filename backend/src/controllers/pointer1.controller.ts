import { Request, Response } from 'express';
import multer from 'multer';
import {
    uploadAcademicDocument,
    evaluateAcademicDocument,
    getAcademicStatus,
} from '../services/pointer1.service';
import { AcademicDocumentType } from '../types/AcademicDocumentType';

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const academicUploadMiddleware = upload.single('document');

export const uploadAcademicDocumentHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('[P1-Controller] Body:', req.body);
        console.log('[P1-Controller] File:', req.file ? req.file.originalname : 'MISSING');
        const { studentIvyServiceId, documentType, studentId, customLabel } = req.body;
        const file = req.file;

        if (!file) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }

        if (!studentIvyServiceId || !documentType || !studentId) {
            res.status(400).json({ success: false, message: 'All fields are required' });
            return;
        }

        // Validate documentType
        if (!Object.values(AcademicDocumentType).includes(documentType as AcademicDocumentType)) {
            res.status(400).json({ success: false, message: 'Invalid document type' });
            return;
        }

        const doc = await uploadAcademicDocument(
            studentIvyServiceId,
            studentId,
            documentType as AcademicDocumentType,
            file,
            customLabel
        );

        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            data: doc,
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const evaluateAcademicHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentIvyServiceId, academicDocumentId, counselorId, score, feedback } = req.body;

        if (!studentIvyServiceId || !academicDocumentId || !counselorId || score === undefined) {
            res.status(400).json({ success: false, message: 'Required fields missing' });
            return;
        }

        const evaluation = await evaluateAcademicDocument(
            studentIvyServiceId,
            academicDocumentId,
            counselorId,
            Number(score),
            feedback
        );

        res.status(200).json({
            success: true,
            message: 'Evaluation saved successfully',
            data: evaluation,
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAcademicStatusHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { studentIvyServiceId } = req.query;

        const identifier = studentIvyServiceId ? (studentIvyServiceId as string) : studentId;
        const useServiceId = !!studentIvyServiceId;

        if (!identifier) {
            res.status(400).json({ success: false, message: 'ID required' });
            return;
        }

        const data = await getAcademicStatus(identifier, useServiceId);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
