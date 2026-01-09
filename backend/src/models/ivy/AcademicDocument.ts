import mongoose, { Document, Schema } from 'mongoose';
import { AcademicDocumentType } from '../../types/AcademicDocumentType';

export interface IAcademicDocument extends Document {
    studentIvyServiceId: mongoose.Types.ObjectId;
    documentType: AcademicDocumentType;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
}

const academicDocumentSchema = new Schema<IAcademicDocument>({
    studentIvyServiceId: { type: Schema.Types.ObjectId, ref: 'StudentIvyService', required: true },
    documentType: { type: String, enum: Object.values(AcademicDocumentType), required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
});

// Ensure only one of each document type per service
academicDocumentSchema.index({ studentIvyServiceId: 1, documentType: 1 }, { unique: true });

export default mongoose.model<IAcademicDocument>('AcademicDocument', academicDocumentSchema);
