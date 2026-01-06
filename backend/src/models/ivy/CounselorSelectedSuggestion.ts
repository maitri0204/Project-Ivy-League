import mongoose, { Document, Schema } from 'mongoose';
import { PointerNo } from '../../types/PointerNo';

export interface ICounselorSelectedSuggestion extends Document {
  studentIvyServiceId: mongoose.Types.ObjectId;
  agentSuggestionId: mongoose.Types.ObjectId;
  pointerNo: PointerNo;
  isVisibleToStudent: boolean;
  selectedAt?: Date;
}

const counselorSelectedSuggestionSchema = new Schema<ICounselorSelectedSuggestion>({
  studentIvyServiceId: { type: Schema.Types.ObjectId, ref: 'StudentIvyService', required: true },
  agentSuggestionId: { type: Schema.Types.ObjectId, ref: 'AgentSuggestion', required: true },
  pointerNo: { type: Number, enum: Object.values(PointerNo), required: true },
  isVisibleToStudent: { type: Boolean, default: false, required: true },
  selectedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICounselorSelectedSuggestion>('CounselorSelectedSuggestion', counselorSelectedSuggestionSchema);

