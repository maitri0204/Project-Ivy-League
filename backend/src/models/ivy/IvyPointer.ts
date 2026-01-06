import mongoose, { Document, Schema } from 'mongoose';
import { PointerNo } from '../../types/PointerNo';

export interface IIvyPointer extends Document {
  pointerNo: PointerNo;
  title: string;
  description: string;
  maxScore: number;
}

const ivyPointerSchema = new Schema<IIvyPointer>({
  pointerNo: { type: Number, enum: Object.values(PointerNo), required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  maxScore: { type: Number, required: true },
});

export default mongoose.model<IIvyPointer>('IvyPointer', ivyPointerSchema);

