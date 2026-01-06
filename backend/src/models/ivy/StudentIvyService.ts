import mongoose, { Document, Schema } from 'mongoose';
import { ServiceStatus } from '../../types/ServiceStatus';

export interface IStudentIvyService extends Document {
  studentId: mongoose.Types.ObjectId;
  counselorId: mongoose.Types.ObjectId;
  status: ServiceStatus;
  overallScore?: number;
  studentInterest?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const studentIvyServiceSchema = new Schema<IStudentIvyService>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  counselorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: Object.values(ServiceStatus), default: ServiceStatus.Active },
  overallScore: { type: Number },
  studentInterest: { type: String },
},{
  timestamps: true,
});

export default mongoose.model<IStudentIvyService>('StudentIvyService', studentIvyServiceSchema);

