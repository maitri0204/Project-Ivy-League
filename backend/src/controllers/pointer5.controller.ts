import { Request, Response } from 'express';
import {
  uploadGuideline,
  uploadEssay,
  evaluateEssay,
  getPointer5Status,
} from '../services/pointer5.service';
import { updateScoreAfterEvaluation } from '../services/ivyScore.service';
import { PointerNo } from '../types/PointerNo';
import multer from 'multer';
import path from 'path';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * POST /pointer5/guideline/upload
 * Counselor uploads essay guideline (Word document)
 */
export const uploadGuidelineMiddleware = upload.single('guidelineFile');

export const uploadGuidelineHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    const { studentIvyServiceId } = req.body;
    const counselorId = req.body.counselorId || req.headers['user-id']; // Get from body or header

    if (!studentIvyServiceId) {
      res.status(400).json({
        success: false,
        message: 'studentIvyServiceId is required',
      });
      return;
    }

    if (!counselorId) {
      res.status(400).json({
        success: false,
        message: 'counselorId is required',
      });
      return;
    }

    const guideline = await uploadGuideline(studentIvyServiceId, counselorId, req.file);

    res.status(200).json({
      success: true,
      message: 'Essay guideline uploaded successfully',
      data: {
        _id: guideline._id,
        fileName: guideline.fileName,
        fileUrl: guideline.fileUrl,
        uploadedAt: guideline.uploadedAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload guideline',
    });
  }
};

/**
 * POST /pointer5/essay/upload
 * Student uploads essay document
 */
export const uploadEssayMiddleware = upload.single('essayFile');

export const uploadEssayHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    const { studentIvyServiceId } = req.body;
    const studentId = req.body.studentId || req.headers['user-id']; // Get from body or header

    if (!studentIvyServiceId) {
      res.status(400).json({
        success: false,
        message: 'studentIvyServiceId is required',
      });
      return;
    }

    if (!studentId) {
      res.status(400).json({
        success: false,
        message: 'studentId is required',
      });
      return;
    }

    const submission = await uploadEssay(studentIvyServiceId, studentId, req.file);

    res.status(200).json({
      success: true,
      message: 'Essay uploaded successfully',
      data: {
        _id: submission._id,
        fileName: submission.fileName,
        fileUrl: submission.fileUrl,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload essay',
    });
  }
};

/**
 * POST /pointer5/essay/evaluate
 * Counselor evaluates essay and assigns score
 */
export const evaluateEssayHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { essaySubmissionId, score, feedback } = req.body;
    const counselorId = req.body.counselorId || req.headers['user-id'];

    if (!essaySubmissionId) {
      res.status(400).json({
        success: false,
        message: 'essaySubmissionId is required',
      });
      return;
    }

    if (score === undefined || score === null) {
      res.status(400).json({
        success: false,
        message: 'score is required (0-10)',
      });
      return;
    }

    if (!counselorId) {
      res.status(400).json({
        success: false,
        message: 'counselorId is required',
      });
      return;
    }

    const evaluation = await evaluateEssay(essaySubmissionId, counselorId, score, feedback);

    // Update overall Ivy score
    await updateScoreAfterEvaluation(
      evaluation.studentIvyServiceId.toString(),
      PointerNo.AuthenticStorytelling,
      evaluation.score
    );

    res.status(200).json({
      success: true,
      message: 'Essay evaluated successfully',
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
      message: error.message || 'Failed to evaluate essay',
    });
  }
};

/**
 * GET /pointer5/status/:studentId
 * GET /pointer5/status?studentIvyServiceId=xxx
 * Get Pointer 5 status for a student (visible to student, parent, counselor)
 */
export const getStatusHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { studentIvyServiceId } = req.query;

    // Support both studentId in params and studentIvyServiceId in query
    const identifier = studentIvyServiceId ? (studentIvyServiceId as string) : studentId;
    const useServiceId = !!studentIvyServiceId;

    if (!identifier) {
      res.status(400).json({
        success: false,
        message: 'studentId or studentIvyServiceId is required',
      });
      return;
    }

    const status = await getPointer5Status(identifier, useServiceId);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Error in getStatusHandler:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get status',
    });
  }
};

/**
 * GET /pointer5/file/:filePath
 * Serve uploaded files
 */
export const serveFileHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filePath } = req.params;
    const fs = require('fs');
    const path = require('path');

    // Security: prevent directory traversal
    // Remove any leading slashes and normalize
    let safePath = filePath.replace(/^\/+/, ''); // Remove leading slashes
    safePath = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, ''); // Prevent ../

    // Ensure path is within uploads directory
    if (!safePath.startsWith('uploads/pointer5')) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const fullPath = path.join(process.cwd(), safePath);

    if (!fs.existsSync(fullPath)) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    res.sendFile(fullPath);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to serve file',
    });
  }
};

