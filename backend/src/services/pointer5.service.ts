import mongoose from 'mongoose';
import EssayGuideline, { IEssayGuideline } from '../models/ivy/EssayGuideline';
import EssaySubmission, { IEssaySubmission } from '../models/ivy/EssaySubmission';
import EssayEvaluation, { IEssayEvaluation } from '../models/ivy/EssayEvaluation';
import StudentIvyService from '../models/ivy/StudentIvyService';
import User from '../models/ivy/User';
import { PointerNo } from '../types/PointerNo';
import { USER_ROLE } from '../types/roles';
import path from 'path';
import fs from 'fs';

// File storage directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'pointer5');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save uploaded file to local storage
 */
export const saveFile = async (file: Express.Multer.File, subfolder: string): Promise<string> => {
  const folderPath = path.join(UPLOAD_DIR, subfolder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(folderPath, fileName);

  fs.writeFileSync(filePath, file.buffer);

  // Return relative path for storage in DB
  return `/uploads/pointer5/${subfolder}/${fileName}`;
};

/**
 * Upload essay guideline (Counselor only)
 */
export const uploadGuideline = async (
  studentIvyServiceId: string,
  counselorId: string,
  file: Express.Multer.File
): Promise<IEssayGuideline> => {
  // Validate studentIvyServiceId
  if (!mongoose.Types.ObjectId.isValid(studentIvyServiceId)) {
    throw new Error('Invalid studentIvyServiceId');
  }

  // Validate counselorId
  if (!mongoose.Types.ObjectId.isValid(counselorId)) {
    throw new Error('Invalid counselorId');
  }

  // Verify studentIvyService exists and counselor matches
  const service = await StudentIvyService.findById(studentIvyServiceId);
  if (!service) {
    throw new Error('Student Ivy Service not found');
  }

  if (service.counselorId.toString() !== counselorId) {
    throw new Error('Unauthorized: Counselor does not match this service');
  }

  // Verify counselor role
  const counselor = await User.findById(counselorId);
  if (!counselor || counselor.role !== USER_ROLE.COUNSELOR) {
    throw new Error('Unauthorized: User is not a counselor');
  }

  // Validate file type (Word document)
  const allowedMimeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-word',
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only Word documents (.doc, .docx) are allowed');
  }

  // Save file
  const fileUrl = await saveFile(file, 'guidelines');

  // Check if guideline already exists (overwrite)
  const existing = await EssayGuideline.findOne({
    studentIvyServiceId,
    pointerNo: PointerNo.AuthenticStorytelling,
  });

  if (existing) {
    // Delete old file
    const oldFilePath = path.join(process.cwd(), existing.fileUrl);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }
    // Update existing
    existing.fileUrl = fileUrl;
    existing.fileName = file.originalname;
    existing.fileSize = file.size;
    existing.mimeType = file.mimetype;
    existing.uploadedBy = new mongoose.Types.ObjectId(counselorId);
    existing.uploadedAt = new Date();
    await existing.save();
    return existing;
  }

  // Create new guideline
  const guideline = await EssayGuideline.create({
    studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
    pointerNo: PointerNo.AuthenticStorytelling,
    fileUrl,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    uploadedBy: new mongoose.Types.ObjectId(counselorId),
  });

  return guideline;
};

/**
 * Upload essay (Student only)
 */
export const uploadEssay = async (
  studentIvyServiceId: string,
  studentId: string,
  file: Express.Multer.File
): Promise<IEssaySubmission> => {
  // Validate studentIvyServiceId
  if (!mongoose.Types.ObjectId.isValid(studentIvyServiceId)) {
    throw new Error('Invalid studentIvyServiceId');
  }

  // Validate studentId
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error('Invalid studentId');
  }

  // Verify studentIvyService exists and student matches
  const service = await StudentIvyService.findById(studentIvyServiceId);
  if (!service) {
    throw new Error('Student Ivy Service not found');
  }

  if (service.studentId.toString() !== studentId) {
    throw new Error('Unauthorized: Student does not match this service');
  }

  // Verify student role
  const student = await User.findById(studentId);
  if (!student || student.role !== USER_ROLE.STUDENT) {
    throw new Error('Unauthorized: User is not a student');
  }

  // Check if guideline exists
  const guideline = await EssayGuideline.findOne({
    studentIvyServiceId,
    pointerNo: PointerNo.AuthenticStorytelling,
  });
  if (!guideline) {
    throw new Error('Essay guideline not found. Please ask your counselor to upload the guideline first.');
  }

  // Validate file type (Word document or PDF)
  const allowedMimeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-word',
    'application/pdf',
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only Word documents (.doc, .docx) or PDF files are allowed');
  }

  // Save file
  const fileUrl = await saveFile(file, 'essays');

  // Check if essay already exists (overwrite)
  const existing = await EssaySubmission.findOne({
    studentIvyServiceId,
    pointerNo: PointerNo.AuthenticStorytelling,
  });

  if (existing) {
    // Delete old file
    const oldFilePath = path.join(process.cwd(), existing.fileUrl);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }
    // Update existing
    existing.fileUrl = fileUrl;
    existing.fileName = file.originalname;
    existing.fileSize = file.size;
    existing.mimeType = file.mimetype;
    existing.submittedBy = new mongoose.Types.ObjectId(studentId);
    existing.submittedAt = new Date();
    await existing.save();
    return existing;
  }

  // Create new submission
  const submission = await EssaySubmission.create({
    studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
    pointerNo: PointerNo.AuthenticStorytelling,
    fileUrl,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    submittedBy: new mongoose.Types.ObjectId(studentId),
  });

  return submission;
};

/**
 * Evaluate essay (Counselor only)
 */
export const evaluateEssay = async (
  essaySubmissionId: string,
  counselorId: string,
  score: number,
  feedback?: string
): Promise<IEssayEvaluation> => {
  // Validate score range
  if (score < 0 || score > 10) {
    throw new Error('Score must be between 0 and 10');
  }

  // Validate essaySubmissionId
  if (!mongoose.Types.ObjectId.isValid(essaySubmissionId)) {
    throw new Error('Invalid essaySubmissionId');
  }

  // Validate counselorId
  if (!mongoose.Types.ObjectId.isValid(counselorId)) {
    throw new Error('Invalid counselorId');
  }

  // Verify essay submission exists
  const submission = await EssaySubmission.findById(essaySubmissionId);
  if (!submission) {
    throw new Error('Essay submission not found');
  }

  // Verify counselor matches the service
  const service = await StudentIvyService.findById(submission.studentIvyServiceId);
  if (!service) {
    throw new Error('Student Ivy Service not found');
  }

  if (service.counselorId.toString() !== counselorId) {
    throw new Error('Unauthorized: Counselor does not match this service');
  }

  // Verify counselor role
  const counselor = await User.findById(counselorId);
  if (!counselor || counselor.role !== USER_ROLE.COUNSELOR) {
    throw new Error('Unauthorized: User is not a counselor');
  }

  // Check if evaluation already exists (update)
  const existing = await EssayEvaluation.findOne({ essaySubmissionId });
  if (existing) {
    existing.score = score;
    existing.feedback = feedback || '';
    existing.evaluatedBy = new mongoose.Types.ObjectId(counselorId);
    existing.evaluatedAt = new Date();
    await existing.save();
    return existing;
  }

  // Create new evaluation
  const evaluation = await EssayEvaluation.create({
    essaySubmissionId: new mongoose.Types.ObjectId(essaySubmissionId),
    studentIvyServiceId: submission.studentIvyServiceId,
    pointerNo: PointerNo.AuthenticStorytelling,
    score,
    feedback: feedback || '',
    evaluatedBy: new mongoose.Types.ObjectId(counselorId),
  });

  return evaluation;
};

/**
 * Get Pointer 5 status for a student
 * Can accept either studentId or studentIvyServiceId
 */
export const getPointer5Status = async (studentIdOrServiceId: string, useServiceId: boolean = false) => {
  // Validate input
  if (!mongoose.Types.ObjectId.isValid(studentIdOrServiceId)) {
    throw new Error('Invalid studentId or studentIvyServiceId');
  }

  // Find student's Ivy service
  let service;
  if (useServiceId) {
    service = await StudentIvyService.findById(studentIdOrServiceId);
  } else {
    service = await StudentIvyService.findOne({ studentId: studentIdOrServiceId });
  }
  
  if (!service) {
    throw new Error('Student Ivy Service not found');
  }

  // Get guideline
  const guideline = await EssayGuideline.findOne({
    studentIvyServiceId: service._id,
    pointerNo: PointerNo.AuthenticStorytelling,
  });

  // Get essay submission
  const submission = await EssaySubmission.findOne({
    studentIvyServiceId: service._id,
    pointerNo: PointerNo.AuthenticStorytelling,
  });

  // Get evaluation
  let evaluation = null;
  if (submission) {
    evaluation = await EssayEvaluation.findOne({
      essaySubmissionId: submission._id,
    });
  }

  return {
    studentIvyServiceId: service._id,
    guideline: guideline
      ? {
          _id: guideline._id,
          fileName: guideline.fileName,
          fileUrl: guideline.fileUrl,
          uploadedAt: guideline.uploadedAt,
        }
      : null,
    essay: submission
      ? {
          _id: submission._id,
          fileName: submission.fileName,
          fileUrl: submission.fileUrl,
          submittedAt: submission.submittedAt,
        }
      : null,
    evaluation: evaluation
      ? {
          score: evaluation.score,
          feedback: evaluation.feedback,
          evaluatedAt: evaluation.evaluatedAt,
        }
      : null,
  };
};

