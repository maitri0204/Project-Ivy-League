import mongoose, { Document, Schema } from 'mongoose';
import { PointerNo } from '../../types/PointerNo';

export interface ICounselorEvaluation extends Document {
  studentSubmissionId: mongoose.Types.ObjectId;
  pointerNo: PointerNo;
  score: number;
  feedback?: string;
  evaluatedAt?: Date;
}

const counselorEvaluationSchema = new Schema<ICounselorEvaluation>({
  studentSubmissionId: { type: Schema.Types.ObjectId, ref: 'StudentSubmission', required: true },
<<<<<<< HEAD
  pointerNo: { type: Number, enum: Object.values(PointerNo).filter((v) => typeof v === 'number'), required: true },
=======
  pointerNo: { type: Number, enum: Object.values(PointerNo).filter(v => typeof v === 'number') as number[], required: true },
>>>>>>> b2960f9b4d97283f403a2bc5fd6f3cf5c65d2e9e
  score: { type: Number, required: true },
  feedback: { type: String },
  evaluatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICounselorEvaluation>('CounselorEvaluation', counselorEvaluationSchema);

