import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import AgentSuggestion from '../models/ivy/AgentSuggestion';
import CounselorSelectedSuggestion from '../models/ivy/CounselorSelectedSuggestion';
import StudentSubmission from '../models/ivy/StudentSubmission';
import CounselorEvaluation from '../models/ivy/CounselorEvaluation';
import StudentIvyService from '../models/ivy/StudentIvyService';
import User from '../models/ivy/User';
import { PointerNo } from '../types/PointerNo';
import { USER_ROLE } from '../types/roles';
import { updateScoreAfterEvaluation } from './ivyScore.service';
import { extractTOC } from './tocExtractor.service';

const SUPPORTED_POINTERS = [
  PointerNo.SpikeInOneArea,
  PointerNo.LeadershipInitiative,
  PointerNo.GlobalSocialImpact,
];

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'pointer-activities');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ensureObjectId = (value: string, label: string): mongoose.Types.ObjectId => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return new mongoose.Types.ObjectId(value);
};

const ensureAllowedPointer = (pointerNo: number) => {
  if (!SUPPORTED_POINTERS.includes(pointerNo)) {
    throw new Error('pointerNo must be 2, 3, or 4');
  }
};

const cleanFileName = (name: string) => name.replace(/[^\w.\- ]/g, '');

const saveProofFiles = async (
  files: Express.Multer.File[],
  pointerNo: PointerNo,
  selectionId: string,
): Promise<string[]> => {
  const folderPath = path.join(UPLOAD_DIR, pointerNo.toString(), selectionId);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  return files.map((file) => {
    const safeName = cleanFileName(file.originalname);
    const fileName = `${Date.now()}-${safeName}`;
    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/pointer-activities/${pointerNo}/${selectionId}/${fileName}`;
  });
};

const deleteFilesIfExist = (filePaths: string[]) => {
  filePaths.forEach((relativePath) => {
    const fullPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  });
};

const saveCounselorDocuments = async (
  files: Express.Multer.File[],
  pointerNo: PointerNo,
  selectionId: string,
): Promise<string[]> => {
  const folderPath = path.join(UPLOAD_DIR, 'counselor-docs', pointerNo.toString(), selectionId);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  return files.map((file) => {
    const safeName = cleanFileName(file.originalname);
    const fileName = `${Date.now()}-${safeName}`;
    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/pointer-activities/counselor-docs/${pointerNo}/${selectionId}/${fileName}`;
  });
};

export const selectActivities = async (
  studentIvyServiceId: string,
  counselorId: string,
  pointerNo: number,
  agentSuggestionIds: string[],
  isVisibleToStudent: boolean = true,
  weightages?: number[],
) => {
  ensureAllowedPointer(pointerNo);
  if (!agentSuggestionIds || agentSuggestionIds.length === 0) {
    throw new Error('agentSuggestionIds is required');
  }

  // Validate weightages for Pointers 2, 3, 4
  if (pointerNo === PointerNo.SpikeInOneArea || pointerNo === PointerNo.LeadershipInitiative || pointerNo === PointerNo.GlobalSocialImpact) {
    if (agentSuggestionIds.length === 1) {
      // Auto-assign 100 for single activity
      weightages = [100];
    } else if (weightages && weightages.length > 0) {
      // Multiple activities - validate weightages
      if (weightages.length !== agentSuggestionIds.length) {
        throw new Error('Weightages array must match the number of activities');
      }
      
      // Validate each weightage
      for (const w of weightages) {
        if (typeof w !== 'number' || w < 0 || w > 100) {
          throw new Error('Each weightage must be a number between 0 and 100');
        }
      }
      
      // Validate sum equals 100
      const sum = weightages.reduce((acc, w) => acc + w, 0);
      if (Math.abs(sum - 100) > 0.01) {
        throw new Error(`Total weightage must equal 100, got ${sum}`);
      }
    }
  }

  const service = await StudentIvyService.findById(ensureObjectId(studentIvyServiceId, 'studentIvyServiceId'));
  if (!service) {
    throw new Error('Student Ivy Service not found');
  }

  const counselor = await User.findById(counselorId);
  if (!counselor || counselor.role !== USER_ROLE.COUNSELOR) {
    throw new Error('Unauthorized: user is not a counselor');
  }

  const suggestionObjectIds = agentSuggestionIds.map((id) => ensureObjectId(id, 'agentSuggestionId'));
  const suggestions = await AgentSuggestion.find({
    _id: { $in: suggestionObjectIds },
    pointerNo,
  });

  if (suggestions.length !== agentSuggestionIds.length) {
    throw new Error('One or more agentSuggestionIds are invalid for the given pointer');
  }

  const existingSelections = await CounselorSelectedSuggestion.find({
    studentIvyServiceId: service._id,
    pointerNo,
  });

  const incomingSet = new Set(agentSuggestionIds.map((id) => id.toString()));
  const toDelete = existingSelections.filter(
    (sel) => !incomingSet.has(sel.agentSuggestionId.toString()),
  );

  // Remove deselected activities along with submissions and evaluations
  for (const sel of toDelete) {
    const submissions = await StudentSubmission.find({
      counselorSelectedSuggestionId: sel._id,
    });
    const submissionIds = submissions.map((s) => s._id);

    if (submissionIds.length > 0) {
      await CounselorEvaluation.deleteMany({ studentSubmissionId: { $in: submissionIds } });
    }

    // Delete stored files for these submissions
    submissions.forEach((sub) => deleteFilesIfExist(sub.files || []));

    await StudentSubmission.deleteMany({ counselorSelectedSuggestionId: sel._id });
    await sel.deleteOne();
  }

  // If activities were deleted, it might affect the average score for this pointer
  if (toDelete.length > 0) {
    await refreshPointerAverageScore(service._id.toString(), pointerNo);
  }

  const updatedSelections: typeof existingSelections = [];

  for (const agentSuggestionId of agentSuggestionIds) {
    const existing = existingSelections.find(
      (sel) => sel.agentSuggestionId.toString() === agentSuggestionId,
    );

    if (existing) {
      existing.isVisibleToStudent = isVisibleToStudent;
      // Update weightage for Pointers 2, 3, 4
      if ((pointerNo === PointerNo.SpikeInOneArea || pointerNo === PointerNo.LeadershipInitiative || pointerNo === PointerNo.GlobalSocialImpact) && weightages) {
        const index = agentSuggestionIds.indexOf(agentSuggestionId);
        if (index !== -1 && weightages[index] !== undefined) {
          existing.weightage = weightages[index];
        }
      }
      await existing.save();
      updatedSelections.push(existing);
    } else {
      const index = agentSuggestionIds.indexOf(agentSuggestionId);
      const created = await CounselorSelectedSuggestion.create({
        studentIvyServiceId: service._id,
        agentSuggestionId: ensureObjectId(agentSuggestionId, 'agentSuggestionId'),
        pointerNo,
        isVisibleToStudent,
        ...((pointerNo === PointerNo.SpikeInOneArea || pointerNo === PointerNo.LeadershipInitiative || pointerNo === PointerNo.GlobalSocialImpact) && weightages && weightages[index] !== undefined 
          ? { weightage: weightages[index] } 
          : {}),
      });
      updatedSelections.push(created);
    }
  }

  // Map suggestions for response
  const suggestionMap = new Map(
    suggestions.map((sug) => [sug._id.toString(), sug]),
  );

  return updatedSelections.map((sel) => ({
    selection: sel,
    suggestion: suggestionMap.get(sel.agentSuggestionId.toString())!,
  }));
};

export const uploadProof = async (
  counselorSelectedSuggestionId: string,
  studentId: string,
  files: Express.Multer.File[],
  remarks?: string,
) => {
  if (!files || files.length === 0) {
    throw new Error('At least one proof file is required');
  }

  const selection = await CounselorSelectedSuggestion.findById(
    ensureObjectId(counselorSelectedSuggestionId, 'counselorSelectedSuggestionId'),
  );
  if (!selection) {
    throw new Error('Selected activity not found');
  }
  ensureAllowedPointer(selection.pointerNo);

  const service = await StudentIvyService.findById(selection.studentIvyServiceId);
  if (!service) {
    throw new Error('Student Ivy Service not found');
  }
  if (service.studentId.toString() !== studentId) {
    throw new Error('Unauthorized: student does not match this service');
  }

  const student = await User.findById(studentId);
  if (!student || student.role !== USER_ROLE.STUDENT) {
    throw new Error('Unauthorized: user is not a student');
  }

  const filePaths = await saveProofFiles(files, selection.pointerNo, selection._id.toString());

  const existingSubmission = await StudentSubmission.findOne({
    counselorSelectedSuggestionId: selection._id,
  });

  if (existingSubmission) {
    console.log(`[P234-Upload] Replacing existing submission for selection: ${selection._id}`);
    // Remove old files
    deleteFilesIfExist(existingSubmission.files || []);

    // Delete existing evaluation if any, so counselor must evaluate again
    const delResult = await CounselorEvaluation.deleteOne({ studentSubmissionId: existingSubmission._id });
    console.log(`[P234-Upload] Deleted evaluation for ${existingSubmission._id}: ${delResult.deletedCount} records`);

    existingSubmission.files = filePaths;
    existingSubmission.remarks = remarks || '';
    existingSubmission.submittedAt = new Date();
    await existingSubmission.save();

    // Refresh average score (since evaluation was removed)
    await refreshPointerAverageScore(service._id.toString(), selection.pointerNo);

    return existingSubmission;
  }

  const submission = await StudentSubmission.create({
    studentIvyServiceId: service._id,
    counselorSelectedSuggestionId: selection._id,
    files: filePaths,
    remarks: remarks || '',
  });

  return submission;
};

export const evaluateActivity = async (
  studentSubmissionId: string,
  counselorId: string,
  score: number,
  feedback?: string,
) => {
  if (score < 0 || score > 10) {
    throw new Error('Score must be between 0 and 10');
  }

  const submission = await StudentSubmission.findById(
    ensureObjectId(studentSubmissionId, 'studentSubmissionId'),
  );
  if (!submission) {
    throw new Error('Student submission not found');
  }

  const selection = await CounselorSelectedSuggestion.findById(submission.counselorSelectedSuggestionId);
  if (!selection) {
    throw new Error('Selected activity not found');
  }
  ensureAllowedPointer(selection.pointerNo);

  const service = await StudentIvyService.findById(submission.studentIvyServiceId);
  if (!service) {
    throw new Error('Student Ivy Service not found');
  }

  const counselor = await User.findById(counselorId);
  if (!counselor || counselor.role !== USER_ROLE.COUNSELOR) {
    throw new Error('Unauthorized: user is not a counselor');
  }

  let evaluation = await CounselorEvaluation.findOne({ studentSubmissionId: submission._id });
  if (evaluation) {
    evaluation.score = score;
    evaluation.feedback = feedback || '';
    evaluation.evaluatedAt = new Date();
    await evaluation.save();
  } else {
    evaluation = await CounselorEvaluation.create({
      studentSubmissionId: submission._id,
      pointerNo: Number(selection.pointerNo),
      score,
      feedback: feedback || '',
    });
  }

  // Recalculate average score for this pointer
  await refreshPointerAverageScore(service._id.toString(), Number(selection.pointerNo));

  return evaluation;
};

/**
 * Recalculates the average score for a given pointer and updates the Ivy ready score.
 */
const refreshPointerAverageScore = async (studentIvyServiceId: string, pointerNo: number) => {
  const studentSubmissions = await StudentSubmission.find({
    studentIvyServiceId: ensureObjectId(studentIvyServiceId, 'studentIvyServiceId')
  });
  const submissionIds = studentSubmissions.map(s => s._id);

  const evaluations = await CounselorEvaluation.find({
    studentSubmissionId: { $in: submissionIds },
    pointerNo: Number(pointerNo)
  });

  let averageScore = 0;
  if (evaluations.length > 0) {
    const totalScore = evaluations.reduce((sum, ev) => sum + ev.score, 0);
    averageScore = totalScore / evaluations.length;
  }

  await updateScoreAfterEvaluation(
    studentIvyServiceId,
    Number(pointerNo),
    averageScore
  );
};

export const getStudentActivities = async (
  studentIdOrServiceId: string,
  useServiceId: boolean = false,
  includeInvisible: boolean = false,
) => {
  if (!mongoose.Types.ObjectId.isValid(studentIdOrServiceId)) {
    throw new Error('Invalid studentId or studentIvyServiceId');
  }

  const service = useServiceId
    ? await StudentIvyService.findById(studentIdOrServiceId)
    : await StudentIvyService.findOne({ studentId: studentIdOrServiceId });

  if (!service) {
    throw new Error('Student Ivy Service not found');
  }

  const selectionQuery: any = {
    studentIvyServiceId: service._id,
    pointerNo: { $in: SUPPORTED_POINTERS },
  };
  if (!includeInvisible) {
    selectionQuery.isVisibleToStudent = true;
  }

  const selections = await CounselorSelectedSuggestion.find(selectionQuery);
  const suggestionIds = selections.map((sel) => sel.agentSuggestionId);
  const suggestions = await AgentSuggestion.find({ _id: { $in: suggestionIds } });
  const suggestionMap = new Map(suggestions.map((s) => [s._id.toString(), s]));

  const activities = [];
  for (const sel of selections) {
    const submission = await StudentSubmission.findOne({
      counselorSelectedSuggestionId: sel._id,
    });

    let evaluation = null;
    if (submission) {
      evaluation = await CounselorEvaluation.findOne({ studentSubmissionId: submission._id });
    }

    activities.push({
      selectionId: sel._id,
      pointerNo: sel.pointerNo,
      isVisibleToStudent: sel.isVisibleToStudent,
      suggestion: suggestionMap.get(sel.agentSuggestionId.toString()),
      selectedAt: sel.selectedAt,
      weightage: sel.weightage, // Include weightage for Pointer 2
      counselorDocuments: sel.counselorDocuments || [], // Include counselor uploaded documents
      proofUploaded: !!submission,
      evaluated: !!evaluation,
      submission: submission
        ? {
          _id: submission._id,
          files: submission.files,
          remarks: submission.remarks,
          submittedAt: submission.submittedAt,
        }
        : null,
      evaluation: evaluation
        ? {
          _id: evaluation._id,
          score: evaluation.score,
          feedback: evaluation.feedback,
          evaluatedAt: evaluation.evaluatedAt,
        }
        : null,
    });
  }

  // Sort by pointer then selection date
  activities.sort((a, b) => {
    if (a.pointerNo !== b.pointerNo) return a.pointerNo - b.pointerNo;
    const aDate = selections.find((s) => s._id.equals(a.selectionId))?.selectedAt?.getTime() || 0;
    const bDate = selections.find((s) => s._id.equals(b.selectionId))?.selectedAt?.getTime() || 0;
    return aDate - bDate;
  });

  return {
    studentIvyServiceId: service._id,
    studentId: service.studentId,
    counselorId: service.counselorId,
    activities,
  };
};

export const uploadCounselorDocuments = async (
  selectionId: string,
  counselorId: string,
  files: Express.Multer.File[],
) => {
  if (!files || files.length === 0) {
    throw new Error('At least one document file is required');
  }

  const selection = await CounselorSelectedSuggestion.findById(ensureObjectId(selectionId, 'selectionId'));
  if (!selection) {
    throw new Error('Selected activity not found');
  }
  ensureAllowedPointer(selection.pointerNo);

  const service = await StudentIvyService.findById(selection.studentIvyServiceId);
  if (!service) {
    throw new Error('Student Ivy Service not found');
  }

  if (service.counselorId.toString() !== counselorId) {
    throw new Error('Unauthorized: counselor does not match this service');
  }

  const counselor = await User.findById(counselorId);
  if (!counselor || counselor.role !== USER_ROLE.COUNSELOR) {
    throw new Error('Unauthorized: user is not a counselor');
  }

  // Validate file types (PDF and Word documents)
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  for (const file of files) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.originalname}. Only PDF and Word documents are allowed.`);
    }
  }

  // Save files first
  const savedFileUrls = await saveCounselorDocuments(files, selection.pointerNo, selection._id.toString());

  // Extract TOC and create document entries
  const documentEntries = await Promise.all(
    savedFileUrls.map(async (fileUrl) => {
      const fullPath = path.join(process.cwd(), fileUrl);
      
      // Extract table of contents from the document
      const extractedTasks = await extractTOC(fullPath);
      
      return {
        url: fileUrl,
        tasks: extractedTasks.map(task => ({
          title: task.title,
          page: task.page,
          status: 'not-started' as const
        }))
      };
    })
  );

  // Add to existing documents
  selection.counselorDocuments = [...(selection.counselorDocuments || []), ...documentEntries];
  await selection.save();

  return selection;
};

export const updateDocumentTaskStatus = async (
  selectionId: string,
  counselorId: string,
  documentUrl: string,
  taskIndex: number,
  status: 'not-started' | 'in-progress' | 'completed'
) => {
  const selection = await CounselorSelectedSuggestion.findById(ensureObjectId(selectionId, 'selectionId'));
  if (!selection) {
    throw new Error('Selected activity not found');
  }
  ensureAllowedPointer(selection.pointerNo);

  const service = await StudentIvyService.findById(selection.studentIvyServiceId);
  if (!service) {
    throw new Error('Student Ivy Service not found');
  }

  if (service.counselorId.toString() !== counselorId) {
    throw new Error('Unauthorized: counselor does not match this service');
  }

  const counselor = await User.findById(counselorId);
  if (!counselor || counselor.role !== USER_ROLE.COUNSELOR) {
    throw new Error('Unauthorized: user is not a counselor');
  }

  // Find the document and update task status
  const document = selection.counselorDocuments?.find(doc => doc.url === documentUrl);
  if (!document) {
    throw new Error('Document not found');
  }

  if (taskIndex < 0 || taskIndex >= document.tasks.length) {
    throw new Error('Invalid task index');
  }

  document.tasks[taskIndex].status = status;
  await selection.save();

  return selection;
};
