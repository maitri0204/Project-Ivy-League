import mongoose, { Document, Schema } from 'mongoose';
import { PointerNo } from '../../types/PointerNo';

export interface IIvyPointer extends Document {
  pointerNo: PointerNo;
  title: string;
  description: string;
  maxScore: number;
}

const ivyPointerSchema = new Schema<IIvyPointer>({
<<<<<<< HEAD
  pointerNo: {
    type: Number,
    enum: Object.values(PointerNo).filter((v) => typeof v === 'number'),
    required: true,
    unique: true,
  },
=======
  pointerNo: { type: Number, enum: Object.values(PointerNo).filter(v => typeof v === 'number') as number[], required: true, unique: true },
>>>>>>> b2960f9b4d97283f403a2bc5fd6f3cf5c65d2e9e
  title: { type: String, required: true },
  description: { type: String, required: true },
  maxScore: { type: Number, required: true },
});

export default mongoose.model<IIvyPointer>('IvyPointer', ivyPointerSchema);

