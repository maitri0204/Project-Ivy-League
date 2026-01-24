import { Request, Response } from 'express';
import {
  selectActivities,
  getStudentActivities,
  uploadProof,
  evaluateActivity,
  updateWeightages,
} from '../services/pointer234Activity.service';
import multer from 'multer';
import { PointerNo } from '../types/PointerNo';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
});

/**
 * POST /pointer/activity/select
 * Counselor selects activities
 */
export const selectActivitiesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentIvyServiceId, agentSuggestionIds, pointerNo, weightages } = req.body;
    const counselorId = req.body.counselorId || req.headers['user-id']; // Get from body or header

    if (!studentIvyServiceId) {
      res.status(400).json({
        success: false,
        message: 'studentIvyServiceId is required',
      });
      return;
    }

    if (!agentSuggestionIds || !Array.isArray(agentSuggestionIds) || agentSuggestionIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'agentSuggestionIds must be a non-empty array',
      });
      return;
    }

    if (!pointerNo || ![2, 3, 4].includes(Number(pointerNo))) {
      res.status(400).json({
        success: false,
        message: 'pointerNo must be 2, 3, or 4',
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

    const selected = await selectActivities(
      studentIvyServiceId,
      counselorId as string,
      agentSuggestionIds,
      Number(pointerNo) as PointerNo,
      weightages // Pass weightages to service
    );

    res.status(200).json({
      success: true,
      message: 'Activities selected successfully',
      data: {
        count: selected.length,
        selectedActivityIds: selected.map((s) => s._id),
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to select activities',
    });
  }
};

/**
 * GET /pointer/activity/student/:studentId
 * Get all activities for a student with status
 */
export const getStudentActivitiesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      res.status(400).json({
        success: false,
        message: 'studentId is required',
      });
      return;
    }

    const activities = await getStudentActivities(studentId as string);

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get student activities',
    });
  }
};

/**
 * POST /pointer/activity/proof/upload
 * Student uploads proof for an activity
 */
export const uploadProofMiddleware = upload.array('proofFiles', 10); // Max 10 files

export const uploadProofHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
      return;
    }

    const { studentIvyServiceId, counselorSelectedSuggestionId } = req.body;
    const studentId = req.body.studentId || req.headers['user-id']; // Get from body or header

    if (!studentIvyServiceId) {
      res.status(400).json({
        success: false,
        message: 'studentIvyServiceId is required',
      });
      return;
    }

    if (!counselorSelectedSuggestionId) {
      res.status(400).json({
        success: false,
        message: 'counselorSelectedSuggestionId is required',
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

    const submission = await uploadProof(
      studentIvyServiceId,
      studentId as string,
      counselorSelectedSuggestionId,
      files
    );

    res.status(200).json({
      success: true,
      message: 'Proof uploaded successfully',
      data: {
        _id: submission._id,
        files: submission.files,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload proof',
    });
  }
};

/**
 * POST /pointer/activity/evaluate
 * Counselor evaluates an activity
 */
export const evaluateActivityHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentSubmissionId, score, feedback } = req.body;
    const counselorId = req.body.counselorId || req.headers['user-id'];

    if (!studentSubmissionId) {
      res.status(400).json({
        success: false,
        message: 'studentSubmissionId is required',
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

    const evaluation = await evaluateActivity(studentSubmissionId, counselorId as string, score, feedback);

    res.status(200).json({
      success: true,
      message: 'Activity evaluated successfully',
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
      message: error.message || 'Failed to evaluate activity',
    });
  }
};

/**
 * PUT /pointer/activity/weightages
 * Counselor updates weightages for selected activities
 */
export const updateWeightagesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentIvyServiceId, weightages, pointerNo } = req.body;
    const counselorId = req.body.counselorId || req.headers['user-id'];

    if (!studentIvyServiceId) {
      res.status(400).json({
        success: false,
        message: 'studentIvyServiceId is required',
      });
      return;
    }

    if (!weightages || typeof weightages !== 'object') {
      res.status(400).json({
        success: false,
        message: 'weightages object is required',
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

    const updated = await updateWeightages(studentIvyServiceId, counselorId as string, weightages, pointerNo);

    res.status(200).json({
      success: true,
      message: 'Weightages updated successfully',
      data: {
        count: updated.length,
      },
    });
  } catch (error: any) {
    console.error('Update weightages error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update weightages',
    });
  }
};

