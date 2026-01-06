import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentSubmission extends Document {
  studentIvyServiceId: mongoose.Types.ObjectId;
  counselorSelectedSuggestionId: mongoose.Types.ObjectId;
  files: string[];
  remarks?: string;
  submittedAt?: Date;
}

const studentSubmissionSchema = new Schema<IStudentSubmission>({
  studentIvyServiceId: { type: Schema.Types.ObjectId, ref: 'StudentIvyService', required: true },
  counselorSelectedSuggestionId: { type: Schema.Types.ObjectId, ref: 'CounselorSelectedSuggestion', required: true },
  files: [{ type: String, required: true }],
  remarks: { type: String },
  submittedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IStudentSubmission>('StudentSubmission', studentSubmissionSchema);

