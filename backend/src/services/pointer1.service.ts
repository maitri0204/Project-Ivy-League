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
    file: Express.Multer.File
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

    const fileUrl = await savePointer1File(file, documentType.toLowerCase());

    // Overwrite existing of same type if any
    const existing = await AcademicDocument.findOne({
        studentIvyServiceId,
        documentType,
    });

    if (existing) {
        const oldFilePath = path.join(process.cwd(), existing.fileUrl);
        if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
        }
        existing.fileUrl = fileUrl;
        existing.fileName = file.originalname;
        existing.fileSize = file.size;
        existing.mimeType = file.mimetype;
        existing.uploadedAt = new Date();
        await existing.save();
        return existing;
    }

    const academicDoc = await AcademicDocument.create({
        studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
        documentType,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
    });

    return academicDoc;
};

/** Counselor evaluates Academic Excellence */
export const evaluateAcademicExcellence = async (
    studentIvyServiceId: string,
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

    const counselor = await User.findById(counselorId);
    if (!counselor || counselor.role !== USER_ROLE.COUNSELOR) {
        throw new Error('Unauthorized: User is not a counselor');
    }

    let evaluation = await AcademicEvaluation.findOne({ studentIvyServiceId });

    if (evaluation) {
        evaluation.score = score;
        evaluation.feedback = feedback || '';
        evaluation.evaluatedBy = new mongoose.Types.ObjectId(counselorId);
        evaluation.evaluatedAt = new Date();
        await evaluation.save();
    } else {
        evaluation = await AcademicEvaluation.create({
            studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
            score,
            feedback: feedback || '',
            evaluatedBy: new mongoose.Types.ObjectId(counselorId),
        });
    }

    // Update overall Ivy score
    await updateScoreAfterEvaluation(
        service._id.toString(),
        PointerNo.AcademicExcellence,
        score
    );

    return evaluation;
};

/** Get Pointer 1 status/documents */
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

    const documents = await AcademicDocument.find({ studentIvyServiceId: service._id });
    const evaluation = await AcademicEvaluation.findOne({ studentIvyServiceId: service._id });

    return {
        studentIvyServiceId: service._id,
        documents,
        evaluation: evaluation ? {
            score: evaluation.score,
            feedback: evaluation.feedback,
            evaluatedAt: evaluation.evaluatedAt
        } : null,
    };
};
