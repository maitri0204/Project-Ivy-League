import { Request, Response } from 'express';
import multer from 'multer';
import {
  uploadCourseList,
  uploadCertificates,
  evaluatePointer6,
  getPointer6Status,
} from '../services/pointer6.service';

// Multer in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/** POST /pointer6/course-list/upload (Counselor only) */
export const uploadCourseListMiddleware = upload.single('courseListFile');

export const uploadCourseListHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const { studentIvyServiceId } = req.body;
    const counselorId = req.body.counselorId || req.headers['user-id'];

    if (!studentIvyServiceId) {
      res.status(400).json({ success: false, message: 'studentIvyServiceId is required' });
      return;
    }
    if (!counselorId) {
      res.status(400).json({ success: false, message: 'counselorId is required' });
      return;
    }

    const courseList = await uploadCourseList(studentIvyServiceId, counselorId as string, req.file);

    res.status(200).json({
      success: true,
      message: 'Course list uploaded successfully',
      data: {
        _id: courseList._id,
        fileName: courseList.fileName,
        fileUrl: courseList.fileUrl,
        uploadedAt: courseList.uploadedAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload course list',
    });
  }
};

/** POST /pointer6/certificate/upload (Student only, multiple files) */
export const uploadCertificatesMiddleware = upload.array('certificates', 10);

export const uploadCertificatesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No certificate files uploaded' });
      return;
    }

    const { studentIvyServiceId } = req.body;
    const studentId = req.body.studentId || req.headers['user-id'];

    if (!studentIvyServiceId) {
      res.status(400).json({ success: false, message: 'studentIvyServiceId is required' });
      return;
    }
    if (!studentId) {
      res.status(400).json({ success: false, message: 'studentId is required' });
      return;
    }

    const certificates = await uploadCertificates(
      studentIvyServiceId,
      studentId as string,
      files,
    );

    res.status(200).json({
      success: true,
      message: 'Certificates uploaded successfully',
      data: certificates.map((c) => ({
        _id: c._id,
        fileName: c.fileName,
        fileUrl: c.fileUrl,
        uploadedAt: c.uploadedAt,
      })),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload certificates',
    });
  }
};

/** POST /pointer6/evaluate (Counselor only) */
export const evaluatePointer6Handler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentIvyServiceId, score, feedback } = req.body;
    const counselorId = req.body.counselorId || req.headers['user-id'];

    if (!studentIvyServiceId) {
      res.status(400).json({ success: false, message: 'studentIvyServiceId is required' });
      return;
    }
    if (score === undefined || score === null) {
      res.status(400).json({ success: false, message: 'score is required (0-10)' });
      return;
    }
    if (!counselorId) {
      res.status(400).json({ success: false, message: 'counselorId is required' });
      return;
    }

    const evaluation = await evaluatePointer6(
      studentIvyServiceId,
      counselorId as string,
      Number(score),
      feedback,
    );

    res.status(200).json({
      success: true,
      message: 'Pointer 6 evaluated successfully',
      data: {
        _id: evaluation._id,
        score: evaluation.score,
        feedback: evaluation.feedback,
        evaluatedAt: evaluation.evaluatedAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to evaluate Pointer 6',
    });
  }
};

/** GET /pointer6/status/:studentId or /pointer6/status?studentIvyServiceId=xxx */
export const getPointer6StatusHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { studentIvyServiceId } = req.query;

    const identifier = studentIvyServiceId ? (studentIvyServiceId as string) : studentId;
    const useServiceId = !!studentIvyServiceId;

    if (!identifier) {
      res.status(400).json({
        success: false,
        message: 'studentId or studentIvyServiceId is required',
      });
      return;
    }

    const status = await getPointer6Status(identifier, useServiceId);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get Pointer 6 status',
    });
  }
};


