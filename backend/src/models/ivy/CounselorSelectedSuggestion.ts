import mongoose, { Document, Schema } from 'mongoose';
import { PointerNo } from '../../types/PointerNo';

export interface ICounselorSelectedSuggestion extends Document {
  studentIvyServiceId: mongoose.Types.ObjectId;
  agentSuggestionId: mongoose.Types.ObjectId;
  pointerNo: PointerNo;
  isVisibleToStudent: boolean;
  weightage?: number; // Weightage for Pointer 2 activities (sum should be 100)
  counselorDocuments?: string[]; // URLs of documents uploaded by counselor
  selectedAt?: Date;
}

const counselorSelectedSuggestionSchema = new Schema<ICounselorSelectedSuggestion>({
  studentIvyServiceId: { type: Schema.Types.ObjectId, ref: 'StudentIvyService', required: true },
  agentSuggestionId: { type: Schema.Types.ObjectId, ref: 'AgentSuggestion', required: true },
  // Restrict enum to numeric PointerNo values only to avoid string variants from TS enums
  pointerNo: { type: Number, enum: Object.values(PointerNo).filter(v => typeof v === 'number') as number[], required: true },
  isVisibleToStudent: { type: Boolean, default: false, required: true },
  weightage: { type: Number, min: 0, max: 100 }, // Optional weightage for Pointer 2
  counselorDocuments: { type: [String], default: [] }, // Array of document URLs
  selectedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICounselorSelectedSuggestion>('CounselorSelectedSuggestion', counselorSelectedSuggestionSchema);

