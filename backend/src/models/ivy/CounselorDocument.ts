import mongoose, { Document, Schema } from 'mongoose';
import { PointerNo } from '../../types/PointerNo';
import { DocumentType } from '../../types/DocumentType';

export interface ICounselorDocument extends Document {
  studentIvyServiceId: mongoose.Types.ObjectId;
  pointerNo: PointerNo;
  documentType: DocumentType;
  fileUrl: string;
  uploadedAt?: Date;
}

const counselorDocumentSchema = new Schema<ICounselorDocument>({
  studentIvyServiceId: { type: Schema.Types.ObjectId, ref: 'StudentIvyService', required: true },
  pointerNo: { type: Number, enum: [PointerNo.AuthenticStorytelling, PointerNo.IntellectualCuriosity], required: true },
  documentType: { type: String, enum: Object.values(DocumentType), required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICounselorDocument>('CounselorDocument', counselorDocumentSchema);

