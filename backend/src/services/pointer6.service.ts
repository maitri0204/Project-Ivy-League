import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import StudentIvyService from '../models/ivy/StudentIvyService';
import User from '../models/ivy/User';
import { USER_ROLE } from '../types/roles';
import { PointerNo } from '../types/PointerNo';
import Pointer6CourseList, { IPointer6CourseList } from '../models/ivy/Pointer6CourseList';
import Pointer6Certificate, { IPointer6Certificate } from '../models/ivy/Pointer6Certificate';
import Pointer6Evaluation, { IPointer6Evaluation } from '../models/ivy/Pointer6Evaluation';
import { updateScoreAfterEvaluation } from './ivyScore.service';

// File storage directory for Pointer 6
const UPLOAD_DIR_P6 = path.join(process.cwd(), 'uploads', 'pointer6');
if (!fs.existsSync(UPLOAD_DIR_P6)) {
  fs.mkdirSync(UPLOAD_DIR_P6, { recursive: true });
}

const savePointer6File = async (file: Express.Multer.File, subfolder: string): Promise<string> => {
  const folderPath = path.join(UPLOAD_DIR_P6, subfolder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(folderPath, fileName);
  fs.writeFileSync(filePath, file.buffer);

  return `/uploads/pointer6/${subfolder}/${fileName}`;
};

/** Counselor uploads course list (Excel) */
export const uploadCourseList = async (
  studentIvyServiceId: string,
  counselorId: string,
  file: Express.Multer.File
): Promise<IPointer6CourseList> => {
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

  // Validate Excel mimetype
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed');
  }

  const fileUrl = await savePointer6File(file, 'courses');

  // Overwrite existing course list if any
  const existing = await Pointer6CourseList.findOne({
    studentIvyServiceId,
    pointerNo: PointerNo.IntellectualCuriosity,
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
    existing.uploadedBy = new mongoose.Types.ObjectId(counselorId);
    existing.uploadedAt = new Date();
    await existing.save();
    return existing;
  }

  const courseList = await Pointer6CourseList.create({
    studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
    pointerNo: PointerNo.IntellectualCuriosity,
    fileUrl,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    uploadedBy: new mongoose.Types.ObjectId(counselorId),
  });

  return courseList;
};

/** Student uploads one or more completion certificates */
export const uploadCertificates = async (
  studentIvyServiceId: string,
  studentId: string,
  files: Express.Multer.File[]
): Promise<IPointer6Certificate[]> => {
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

  const student = await User.findById(studentId);
  if (!student || student.role !== USER_ROLE.STUDENT) {
    throw new Error('Unauthorized: User is not a student');
  }

  if (!files || files.length === 0) {
    throw new Error('No certificate files provided');
  }

  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
  ];

  const created: IPointer6Certificate[] = [];

  for (const file of files) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      // Skip unsupported file types
      continue;
    }

    const fileUrl = await savePointer6File(file, 'certificates');

    const certificate = await Pointer6Certificate.create({
      studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
      pointerNo: PointerNo.IntellectualCuriosity,
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: new mongoose.Types.ObjectId(studentId),
    });

    created.push(certificate);
  }

  if (created.length === 0) {
    throw new Error('No valid certificate files were uploaded');
  }

  // If new certificates are uploaded, delete existing evaluation to trigger re-evaluation
  await Pointer6Evaluation.deleteOne({
    studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
    pointerNo: PointerNo.IntellectualCuriosity,
  });

  // Reset Pointer 6 score to 0 until re-evaluated
  await updateScoreAfterEvaluation(
    studentIvyServiceId,
    PointerNo.IntellectualCuriosity,
    0
  );

  return created;
}

/** Counselor assigns Pointer 6 score */
export const evaluatePointer6 = async (
  studentIvyServiceId: string,
  counselorId: string,
  score: number,
  feedback?: string
): Promise<IPointer6Evaluation> => {
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

  let evaluation = await Pointer6Evaluation.findOne({
    studentIvyServiceId,
    pointerNo: PointerNo.IntellectualCuriosity,
  });

  if (evaluation) {
    evaluation.score = score;
    evaluation.feedback = feedback || '';
    evaluation.evaluatedBy = new mongoose.Types.ObjectId(counselorId);
    evaluation.evaluatedAt = new Date();
    await evaluation.save();
    return evaluation;
  }

  evaluation = await Pointer6Evaluation.create({
    studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
    pointerNo: PointerNo.IntellectualCuriosity,
    score,
    feedback: feedback || '',
    evaluatedBy: new mongoose.Types.ObjectId(counselorId),
  });

  // Update overall Ivy score
  await updateScoreAfterEvaluation(
    service._id.toString(),
    PointerNo.IntellectualCuriosity,
    score
  );

  return evaluation;
};

/** Get Pointer 6 status for a student (by studentId or serviceId) */
export const getPointer6Status = async (
  studentIdOrServiceId: string,
  useServiceId: boolean = false
) => {
  if (!mongoose.Types.ObjectId.isValid(studentIdOrServiceId)) {
    throw new Error('Invalid studentId or studentIvyServiceId');
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

  const courseList = await Pointer6CourseList.findOne({
    studentIvyServiceId: service._id,
    pointerNo: PointerNo.IntellectualCuriosity,
  });

  const certificates = await Pointer6Certificate.find({
    studentIvyServiceId: service._id,
    pointerNo: PointerNo.IntellectualCuriosity,
  }).sort({ uploadedAt: -1 });

  const evaluation = await Pointer6Evaluation.findOne({
    studentIvyServiceId: service._id,
    pointerNo: PointerNo.IntellectualCuriosity,
  });

  return {
    studentIvyServiceId: service._id,
    courseList: courseList
      ? {
        _id: courseList._id,
        fileName: courseList.fileName,
        fileUrl: courseList.fileUrl,
        uploadedAt: courseList.uploadedAt,
      }
      : null,
    certificates: certificates.map((c) => ({
      _id: c._id,
      fileName: c.fileName,
      fileUrl: c.fileUrl,
      uploadedAt: c.uploadedAt,
    })),
    evaluation: evaluation
      ? {
        score: evaluation.score,
        feedback: evaluation.feedback,
        evaluatedAt: evaluation.evaluatedAt,
      }
      : null,
  };
};


