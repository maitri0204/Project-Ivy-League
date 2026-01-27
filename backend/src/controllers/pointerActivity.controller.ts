import { Request, Response } from 'express';
import multer from 'multer';
import {
  selectActivities,
  getStudentActivities,
  uploadProof,
  evaluateActivity,
  uploadCounselorDocuments,
  updateDocumentTaskStatus,
} from '../services/pointerActivity.service';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

export const proofUploadMiddleware = upload.array('proofFiles', 5);
export const counselorDocsMiddleware = upload.array('counselorDocs', 5);

export const selectActivitiesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentIvyServiceId, counselorId: counselorIdFromBody, pointerNo, agentSuggestionIds, isVisibleToStudent, weightages } =
      req.body;
    const counselorId = counselorIdFromBody || req.headers['user-id'];

    if (!studentIvyServiceId) {
      res.status(400).json({ success: false, message: 'studentIvyServiceId is required' });
      return;
    }
    if (!pointerNo) {
      res.status(400).json({ success: false, message: 'pointerNo is required (2, 3, or 4)' });
      return;
    }
    if (!agentSuggestionIds || !Array.isArray(agentSuggestionIds) || agentSuggestionIds.length === 0) {
      res.status(400).json({ success: false, message: 'agentSuggestionIds must be a non-empty array' });
      return;
    }
    if (!counselorId) {
      res.status(400).json({ success: false, message: 'counselorId is required' });
      return;
    }

    const selections = await selectActivities(
      studentIvyServiceId,
      counselorId as string,
      Number(pointerNo),
      agentSuggestionIds,
      isVisibleToStudent !== false, // default true
      weightages, // Pass weightages array
    );

    res.status(200).json({
      success: true,
      message: 'Activities saved successfully',
      data: selections.map(({ selection, suggestion }) => ({
        selectionId: selection._id,
        pointerNo: selection.pointerNo,
        isVisibleToStudent: selection.isVisibleToStudent,
        suggestion: {
          _id: suggestion._id,
          title: suggestion.title,
          description: suggestion.description,
          tags: suggestion.tags,
        },
      })),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to save activities',
    });
  }
};

export const getStudentActivitiesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { studentIvyServiceId, includeInvisible } = req.query;

    const identifier = studentIvyServiceId ? (studentIvyServiceId as string) : (studentId as string);
    const useServiceId = !!studentIvyServiceId;

    if (!identifier) {
      res.status(400).json({
        success: false,
        message: 'studentId or studentIvyServiceId is required',
      });
      return;
    }

    const data = await getStudentActivities(
      identifier,
      useServiceId,
      includeInvisible === 'true',
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch activities',
    });
  }
};

export const uploadProofHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No proof files uploaded' });
      return;
    }

    const { counselorSelectedSuggestionId, studentId, remarks } = req.body;

    if (!counselorSelectedSuggestionId) {
      res.status(400).json({ success: false, message: 'counselorSelectedSuggestionId is required' });
      return;
    }
    if (!studentId) {
      res.status(400).json({ success: false, message: 'studentId is required' });
      return;
    }

    const submission = await uploadProof(
      counselorSelectedSuggestionId,
      studentId,
      files,
      remarks,
    );

    res.status(200).json({
      success: true,
      message: 'Proof uploaded successfully',
      data: {
        _id: submission._id,
        files: submission.files,
        remarks: submission.remarks,
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

export const evaluateActivityHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentSubmissionId, counselorId: counselorIdFromBody, score, feedback } = req.body;
    const counselorId = counselorIdFromBody || req.headers['user-id'];

    if (!studentSubmissionId) {
      res.status(400).json({ success: false, message: 'studentSubmissionId is required' });
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

    const evaluation = await evaluateActivity(
      studentSubmissionId,
      counselorId as string,
      Number(score),
      feedback,
    );

    res.status(200).json({
      success: true,
      message: 'Evaluation saved successfully',
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

export const uploadCounselorDocumentsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files uploaded' });
      return;
    }

    const { selectionId } = req.body;
    const counselorId = req.body.counselorId || req.headers['user-id'];

    if (!selectionId) {
      res.status(400).json({ success: false, message: 'selectionId is required' });
      return;
    }
    if (!counselorId) {
      res.status(400).json({ success: false, message: 'counselorId is required' });
      return;
    }

    const selection = await uploadCounselorDocuments(selectionId, counselorId as string, files);

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        selectionId: selection._id,
        counselorDocuments: selection.counselorDocuments,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload documents',
    });
  }
};

export const updateDocumentTaskStatusHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { selectionId, documentUrl, taskIndex, status } = req.body;
    const counselorId = req.body.counselorId || req.headers['user-id'];

    if (!selectionId) {
      res.status(400).json({ success: false, message: 'selectionId is required' });
      return;
    }
    if (!counselorId) {
      res.status(400).json({ success: false, message: 'counselorId is required' });
      return;
    }
    if (!documentUrl) {
      res.status(400).json({ success: false, message: 'documentUrl is required' });
      return;
    }
    if (typeof taskIndex !== 'number') {
      res.status(400).json({ success: false, message: 'taskIndex is required' });
      return;
    }
    if (!status || !['not-started', 'in-progress', 'completed'].includes(status)) {
      res.status(400).json({ success: false, message: 'status must be one of: not-started, in-progress, completed' });
      return;
    }

    const selection = await updateDocumentTaskStatus(
      selectionId,
      counselorId as string,
      documentUrl,
      taskIndex,
      status
    );

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: {
        selectionId: selection._id,
        counselorDocuments: selection.counselorDocuments,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update task status',
    });
  }
};

