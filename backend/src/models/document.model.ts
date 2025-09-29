import mongoose, { Document as MongoDocument, Schema, Model } from 'mongoose';
import { IPatient } from './patient.model';
import { IUser } from './user.model';

// Document type - Simplified for minimal requirements
export type DocumentType = 'medical_report' | 'other';

// Document interface - Simplified for minimal requirements
export interface IDocument extends MongoDocument {
  patientId: mongoose.Types.ObjectId | IPatient;
  type: DocumentType;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// Document schema - Simplified for minimal requirements
const documentSchema = new Schema<IDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    type: {
      type: String,
      enum: ['medical_report', 'other'],
      required: true,
      default: 'medical_report'
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Index for efficient searching
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Document: Model<IDocument> = mongoose.model<IDocument>('Document', documentSchema);

export default Document;