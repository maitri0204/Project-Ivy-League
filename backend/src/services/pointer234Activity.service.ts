import mongoose from 'mongoose';
import CounselorSelectedSuggestion, { ICounselorSelectedSuggestion } from '../models/ivy/CounselorSelectedSuggestion';
import StudentSubmission, { IStudentSubmission } from '../models/ivy/StudentSubmission';
import CounselorEvaluation, { ICounselorEvaluation } from '../models/ivy/CounselorEvaluation';
import AgentSuggestion from '../models/ivy/AgentSuggestion';
import StudentIvyService from '../models/ivy/StudentIvyService';
import User from '../models/ivy/User';
import { PointerNo } from '../types/PointerNo';
import { USER_ROLE } from '../types/roles';
import path from 'path';
import fs from 'fs';
import { updateScoreAfterEvaluation } from './ivyScore.service';

// File storage directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'pointer234');
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
  return `/uploads/pointer234/${subfolder}/${fileName}`;
};

/**
 * Select activities (Counselor only)
 * Input: studentIvyServiceId, counselorId, agentSuggestionIds (array), pointerNo (2|3|4)
 */
export const selectActivities = async (
  studentIvyServiceId: string,
  counselorId: string,
  agentSuggestionIds: string[],
  pointerNo: PointerNo
): Promise<ICounselorSelectedSuggestion[]> => {
  // Validate studentIvyServiceId
  if (!mongoose.Types.ObjectId.isValid(studentIvyServiceId)) {
    throw new Error('Invalid studentIvyServiceId');
  }

  // Validate counselorId
  if (!mongoose.Types.ObjectId.isValid(counselorId)) {
    throw new Error('Invalid counselorId');
  }

  // Validate pointerNo (must be 2, 3, or 4)
  if (![PointerNo.SpikeInOneArea, PointerNo.LeadershipInitiative, PointerNo.GlobalSocialImpact].includes(pointerNo)) {
    throw new Error('Invalid pointerNo. Must be 2, 3, or 4');
  }

  // Validate agentSuggestionIds
  if (!Array.isArray(agentSuggestionIds) || agentSuggestionIds.length === 0) {
    throw new Error('agentSuggestionIds must be a non-empty array');
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

  // Verify all agent suggestions exist and match pointerNo
  const agentSuggestions = await AgentSuggestion.find({
    _id: { $in: agentSuggestionIds },
    pointerNo,
  });

  if (agentSuggestions.length !== agentSuggestionIds.length) {
    throw new Error('One or more agent suggestions not found or do not match pointerNo');
  }

  // Delete existing selections for this pointer and student service
  await CounselorSelectedSuggestion.deleteMany({
    studentIvyServiceId,
    pointerNo,
  });

  // Create new selections
  const selectedActivities = await CounselorSelectedSuggestion.insertMany(
    agentSuggestionIds.map((agentSuggestionId) => ({
      studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
      agentSuggestionId: new mongoose.Types.ObjectId(agentSuggestionId),
      pointerNo,
      isVisibleToStudent: true, // Auto-visible when selected
    }))
  );

  return selectedActivities;
};

/**
 * Get student activities with status (for student, parent, counselor views)
 * Returns activities with proof upload status and evaluation status
 */
export const getStudentActivities = async (studentId: string): Promise<any[]> => {
  // Validate studentId
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error('Invalid studentId');
  }

  // Find student's Ivy service
  const service = await StudentIvyService.findOne({ studentId });
  if (!service) {
    throw new Error('Student Ivy Service not found');
  }

  // Get all selected activities for this student
  const selectedActivities = await CounselorSelectedSuggestion.find({
    studentIvyServiceId: service._id,
    pointerNo: { $in: [PointerNo.SpikeInOneArea, PointerNo.LeadershipInitiative, PointerNo.GlobalSocialImpact] },
  }).populate('agentSuggestionId');

  // Get all submissions and evaluations
  const submissions = await StudentSubmission.find({
    studentIvyServiceId: service._id,
  }).populate('counselorSelectedSuggestionId');

  const evaluations = await CounselorEvaluation.find({
    studentSubmissionId: { $in: submissions.map((s) => s._id) },
  });

  // Build result array with activity details and status
  const activities = selectedActivities.map((selected) => {
    const agentSuggestion = selected.agentSuggestionId as any;
    const submission = submissions.find(
      (s) => s.counselorSelectedSuggestionId.toString() === selected._id.toString()
    );
    const evaluation = submission
      ? evaluations.find((e) => e.studentSubmissionId.toString() === submission._id.toString())
      : null;

    return {
      selectedActivityId: selected._id,
      agentSuggestionId: agentSuggestion._id,
      pointerNo: selected.pointerNo,
      title: agentSuggestion.title,
      description: agentSuggestion.description,
      tags: agentSuggestion.tags || [],
      selectedAt: selected.selectedAt,
      proofUploaded: !!submission,
      submission: submission
        ? {
          _id: submission._id,
          files: submission.files,
          remarks: submission.remarks,
          submittedAt: submission.submittedAt,
        }
        : null,
      evaluated: !!evaluation,
      evaluation: evaluation
        ? {
          _id: evaluation._id,
          score: evaluation.score,
          feedback: evaluation.feedback,
          evaluatedAt: evaluation.evaluatedAt,
        }
        : null,
    };
  });

  return activities;
};

/**
 * Upload proof for an activity (Student only)
 * Input: studentIvyServiceId, studentId, counselorSelectedSuggestionId, files (array)
 */
export const uploadProof = async (
  studentIvyServiceId: string,
  studentId: string,
  counselorSelectedSuggestionId: string,
  files: Express.Multer.File[]
): Promise<IStudentSubmission> => {
  // Validate studentIvyServiceId
  if (!mongoose.Types.ObjectId.isValid(studentIvyServiceId)) {
    throw new Error('Invalid studentIvyServiceId');
  }

  // Validate studentId
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error('Invalid studentId');
  }

  // Validate counselorSelectedSuggestionId
  if (!mongoose.Types.ObjectId.isValid(counselorSelectedSuggestionId)) {
    throw new Error('Invalid counselorSelectedSuggestionId');
  }

  // Validate files
  if (!files || files.length === 0) {
    throw new Error('At least one file is required');
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

  // Verify selected activity exists and belongs to this student service
  const selectedActivity = await CounselorSelectedSuggestion.findById(counselorSelectedSuggestionId);
  if (!selectedActivity) {
    throw new Error('Selected activity not found');
  }

  if (selectedActivity.studentIvyServiceId.toString() !== studentIvyServiceId) {
    throw new Error('Unauthorized: Activity does not belong to this student service');
  }

  // Validate file types (PDF, images, Word docs)
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  for (const file of files) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.originalname}. Allowed: PDF, images (JPG/PNG), Word documents`);
    }
  }

  // Save all files
  const fileUrls: string[] = [];
  for (const file of files) {
    const fileUrl = await saveFile(file, 'proofs');
    fileUrls.push(fileUrl);
  }

  // Check if submission already exists (update)
  const existing = await StudentSubmission.findOne({
    counselorSelectedSuggestionId,
  });

  if (existing) {
    // Delete old files
    for (const oldFileUrl of existing.files) {
      const oldFilePath = path.join(process.cwd(), oldFileUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Capture pointerNo for score refresh before updating
    const pointerNo = selectedActivity.pointerNo;

    // Delete existing evaluation if any, so counselor must evaluate again
    await CounselorEvaluation.deleteOne({ studentSubmissionId: existing._id });

    // Update existing
    existing.files = fileUrls;
    existing.submittedAt = new Date();
    await existing.save();

    // Refresh average score (since evaluation was removed, average might change)
    await refreshPointerAverageScore(studentIvyServiceId, pointerNo);

    return existing;
  }

  // Create new submission
  const submission = await StudentSubmission.create({
    studentIvyServiceId: new mongoose.Types.ObjectId(studentIvyServiceId),
    counselorSelectedSuggestionId: new mongoose.Types.ObjectId(counselorSelectedSuggestionId),
    files: fileUrls,
    submittedAt: new Date(),
  });

  return submission;
};

/**
 * Evaluate activity (Counselor only)
 * Input: studentSubmissionId, counselorId, score, feedback?
 */
export const evaluateActivity = async (
  studentSubmissionId: string,
  counselorId: string,
  score: number,
  feedback?: string
): Promise<ICounselorEvaluation> => {
  // Validate score range
  if (score < 0 || score > 10) {
    throw new Error('Score must be between 0 and 10');
  }

  // Validate studentSubmissionId
  if (!mongoose.Types.ObjectId.isValid(studentSubmissionId)) {
    throw new Error('Invalid studentSubmissionId');
  }

  // Validate counselorId
  if (!mongoose.Types.ObjectId.isValid(counselorId)) {
    throw new Error('Invalid counselorId');
  }

  // Verify submission exists
  const submission = await StudentSubmission.findById(studentSubmissionId).populate('counselorSelectedSuggestionId');
  if (!submission) {
    throw new Error('Student submission not found');
  }

  // Get pointerNo from selected activity
  const selectedActivity = submission.counselorSelectedSuggestionId as any;
  const pointerNo = selectedActivity.pointerNo;

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
  const existing = await CounselorEvaluation.findOne({ studentSubmissionId });
  if (existing) {
    existing.score = score;
    existing.feedback = feedback || '';
    existing.evaluatedAt = new Date();
    await existing.save();
  } else {
    // Create new evaluation
    await CounselorEvaluation.create({
      studentSubmissionId: new mongoose.Types.ObjectId(studentSubmissionId),
      pointerNo,
      score,
      feedback: feedback || '',
      evaluatedAt: new Date(),
    });
  }

  // Recalculate average score for this pointer
  const finalEvaluation = await CounselorEvaluation.findOne({ studentSubmissionId });
  await refreshPointerAverageScore(service._id.toString(), pointerNo);

  return finalEvaluation!;
};

/**
 * Recalculates the average score for a given pointer and updates the Ivy ready score.
 */
const refreshPointerAverageScore = async (studentIvyServiceId: string, pointerNo: number) => {
  const studentSubmissions = await StudentSubmission.find({ studentIvyServiceId });
  const submissionIds = studentSubmissions.map(s => s._id);

  const evaluations = await CounselorEvaluation.find({
    studentSubmissionId: { $in: submissionIds },
    pointerNo: Number(pointerNo)
  });

  let averageScore = 0;
  if (evaluations.length > 0) {
    averageScore = evaluations.reduce((sum, ev) => sum + ev.score, 0) / evaluations.length;
  }

  await updateScoreAfterEvaluation(
    studentIvyServiceId,
    Number(pointerNo),
    averageScore
  );
};

