import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import AcademicDocument, { IAcademicDocument } from '../models/ivy/AcademicDocument';
import AcademicEvaluation, { IAcademicEvaluation } from '../models/ivy/AcademicEvaluation';
import StudentIvyService from '../models/ivy/StudentIvyService';
import User from '../models/ivy/User';
import { USER_ROLE } from '../types/roles';
import { AcademicDocumentType } from '../types/AcademicDocumentType';
import { PointerNo } from '../types/PointerNo';
import { updateScoreAfterEvaluation } from './ivyScore.service';

// File storage directory for Pointer 1
const UPLOAD_DIR_P1 = path.join(process.cwd(), 'uploads', 'pointer1');
if (!fs.existsSync(UPLOAD_DIR_P1)) {
    fs.mkdirSync(UPLOAD_DIR_P1, { recursive: true });
}

const savePointer1File = async (file: Express.Multer.File, subfolder: string): Promise<string> => {
    const folderPath = path.join(UPLOAD_DIR_P1, subfolder);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return `/uploads/pointer1/${subfolder}/${fileName}`;
};

/** Student uploads academic document */
export const uploadAcademicDocument = async (
    studentIvyServiceId: string,
    studentId: string,
    documentType: AcademicDocumentType,
    file: Express.Multer.File,
    customLabel?: string
): Promise<IAcademicDocument> => {
    if (!mongoose.Types.ObjectId.isValid(studentIvyServiceId)) {
        throw new Error('Invalid studentIvyServiceId');
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
        throw new Error('Invalid studentId');
    }

    const service = await StudentIvyService.findById(studentIvyServiceId);
    if (!service) {
        throw new Error('Student Ivy Service not found');
    }
    if (service.studentId.toString() !== studentId) {
        throw new Error('Unauthorized: Student does not match this service');
    }

    const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only PDF and Images (JPG/PNG) are allowed');
    }

    console.log(`[P1-Upload] Start: serviceId=${studentIvyServiceId}, docType=${documentType}, label=${customLabel}`);
    const fileUrl = await savePointer1File(file, documentType.toLowerCase());
    console.log(`[P1-Upload] File saved: ${fileUrl}`);

    // Logic: Overwrite if single-upload type, or if UNIVERSITY_MARKSHEET with same customLabel
    let existing = null;
    if (documentType === AcademicDocumentType.UNIVERSITY_MARKSHEET) {
        if (customLabel) {
            existing = await AcademicDocument.findOne({
                studentIvyServiceId,
                documentType,
                customLabel
            });
        }
    } else {
        existing = await AcademicDocument.findOne({
            studentIvyServiceId,
            documentType,
        });
    }

    if (existing) {
        console.log(`[P1-Upload] Overwriting existing document: ${existing._id}`);
        const oldFilePath = path.join(process.cwd(), existing.fileUrl);
        if (fs.existsSync(oldFilePath)) {
            try { fs.unlinkSync(oldFilePath); } catch (e) { }
        }

        // Reset evaluation for this specific document if it exists
        await AcademicEvaluation.deleteOne({ academicDocumentId: existing._id });

        existing.fileUrl = fileUrl;
        existing.fileName = file.originalname;
        existing.fileSize = file.size;
        existing.mimeType = file.mimetype;
        existing.customLabel = customLabel;
        existing.uploadedAt = new Date();
        await existing.save();

        // Refresh mean score (since one evaluation was removed)
        await refreshPointer1MeanScore(studentIvyServiceId);

        return existing;
    }

    console.log(`[P1-Upload] Creating new document record...`);
    const academicDoc = await AcademicDocument.create({
        studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
        documentType,
        customLabel,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
    });
    console.log(`[P1-Upload] Success: ${academicDoc._id}`);

    return academicDoc;
};

/** Recalculates the mean score for Pointer 1 */
export const refreshPointer1MeanScore = async (studentIvyServiceId: string) => {
    // 1. Get all marksheets for this service
    const marksheets = await AcademicDocument.find({
        studentIvyServiceId,
        documentType: {
            $in: [
                AcademicDocumentType.MARKSHEET_8,
                AcademicDocumentType.MARKSHEET_9,
                AcademicDocumentType.MARKSHEET_10,
                AcademicDocumentType.MARKSHEET_11,
                AcademicDocumentType.MARKSHEET_12,
                AcademicDocumentType.UNIVERSITY_MARKSHEET
            ]
        }
    });

    const docIds = marksheets.map(m => m._id);

    // 2. Get evaluations for these marksheets
    const evaluations = await AcademicEvaluation.find({
        academicDocumentId: { $in: docIds }
    });

    if (evaluations.length === 0) {
        await updateScoreAfterEvaluation(studentIvyServiceId, PointerNo.AcademicExcellence, 0);
        return 0;
    }

    // 3. Calculate mean of evaluated marksheets
    const totalScore = evaluations.reduce((sum, ev) => sum + ev.score, 0);
    const meanScore = totalScore / evaluations.length;

    // 4. Update overall score
    await updateScoreAfterEvaluation(
        studentIvyServiceId,
        PointerNo.AcademicExcellence,
        meanScore
    );

    return meanScore;
};

/** Counselor evaluates a specific academic document */
export const evaluateAcademicDocument = async (
    studentIvyServiceId: string,
    academicDocumentId: string,
    counselorId: string,
    score: number,
    feedback?: string
): Promise<IAcademicEvaluation> => {
    if (score < 0 || score > 10) {
        throw new Error('Score must be between 0 and 10');
    }
    if (!mongoose.Types.ObjectId.isValid(studentIvyServiceId)) {
        throw new Error('Invalid studentIvyServiceId');
    }
    if (!mongoose.Types.ObjectId.isValid(academicDocumentId)) {
        throw new Error('Invalid academicDocumentId');
    }
    if (!mongoose.Types.ObjectId.isValid(counselorId)) {
        throw new Error('Invalid counselorId');
    }

    const service = await StudentIvyService.findById(studentIvyServiceId);
    if (!service) {
        throw new Error('Student Ivy Service not found');
    }
    if (service.counselorId.toString() !== counselorId) {
        throw new Error('Unauthorized: Counselor does not match this service');
    }

    const document = await AcademicDocument.findById(academicDocumentId);
    if (!document || document.studentIvyServiceId.toString() !== studentIvyServiceId) {
        throw new Error('Document not found or does not belong to this service');
    }

    // Check if this document type should be evaluated
    const evaluatableTypes = [
        AcademicDocumentType.MARKSHEET_8,
        AcademicDocumentType.MARKSHEET_9,
        AcademicDocumentType.MARKSHEET_10,
        AcademicDocumentType.MARKSHEET_11,
        AcademicDocumentType.MARKSHEET_12,
        AcademicDocumentType.UNIVERSITY_MARKSHEET
    ];
    if (!evaluatableTypes.includes(document.documentType)) {
        throw new Error('This document type does not require evaluation');
    }

    let evaluation = await AcademicEvaluation.findOne({ academicDocumentId });

    if (evaluation) {
        evaluation.score = score;
        evaluation.feedback = feedback || '';
        evaluation.evaluatedBy = new mongoose.Types.ObjectId(counselorId);
        evaluation.evaluatedAt = new Date();
        await evaluation.save();
    } else {
        evaluation = await AcademicEvaluation.create({
            studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
            academicDocumentId: new mongoose.Types.ObjectId(academicDocumentId),
            score,
            feedback: feedback || '',
            evaluatedBy: new mongoose.Types.ObjectId(counselorId),
        });
    }

    // Refresh the overall Pointer 1 mean score
    await refreshPointer1MeanScore(studentIvyServiceId);

    return evaluation;
};

/** Get Pointer 1 status/documents with evaluations */
export const getAcademicStatus = async (studentIdOrServiceId: string, useServiceId: boolean = false) => {
    if (!mongoose.Types.ObjectId.isValid(studentIdOrServiceId)) {
        throw new Error('Invalid ID');
    }

    let service;
    if (useServiceId) {
        service = await StudentIvyService.findById(studentIdOrServiceId);
    } else {
        service = await StudentIvyService.findOne({ studentId: studentIdOrServiceId });
    }

    if (!service) {
        throw new Error('Student Ivy Service not found');
    }

    const documents = await AcademicDocument.find({ studentIvyServiceId: service._id }).lean();
    console.log(`[P1-Status] Found ${documents.length} docs for service ${service._id}`);
    const docIds = documents.map(d => d._id);
    const evaluations = await AcademicEvaluation.find({ academicDocumentId: { $in: docIds } }).lean();

    // Map evaluations to documents
    const evalMap: Record<string, any> = {};
    evaluations.forEach(ev => {
        evalMap[ev.academicDocumentId.toString()] = ev;
    });

    const docsWithEvals = documents.map(doc => ({
        ...doc,
        evaluation: evalMap[doc._id.toString()] || null
    }));

    // Current overall score for Pointer 1 from Service for reference
    const currentPointer1Score = service.overallScore; // Note: overallScore is total, but pointer breakdown is in ScoreCard

    return {
        studentIvyServiceId: service._id,
        documents: docsWithEvals,
    };
};
