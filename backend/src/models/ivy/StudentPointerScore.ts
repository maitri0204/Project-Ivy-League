import mongoose, { Document, Schema } from 'mongoose';
import { PointerNo } from '../../types/PointerNo';

export interface IStudentPointerScore extends Document {
  studentIvyServiceId: mongoose.Types.ObjectId;
  pointerNo: PointerNo;
  scoreObtained: number;
  maxScore: number;
  lastUpdated?: Date;
}

const studentPointerScoreSchema = new Schema<IStudentPointerScore>({
  studentIvyServiceId: { type: Schema.Types.ObjectId, ref: 'StudentIvyService', required: true },
<<<<<<< HEAD
  pointerNo: { type: Number, enum: Object.values(PointerNo).filter((v) => typeof v === 'number'), required: true },
=======
  pointerNo: { type: Number, enum: Object.values(PointerNo).filter(v => typeof v === 'number') as number[], required: true },
>>>>>>> b2960f9b4d97283f403a2bc5fd6f3cf5c65d2e9e
  scoreObtained: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model<IStudentPointerScore>('StudentPointerScore', studentPointerScoreSchema);

