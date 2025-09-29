import mongoose, { Document, Schema, Model } from 'mongoose';
import { IPatient } from './patient.model';
import { IDocument } from './document.model';

// AIHealthSummary interface
export interface IAIHealthSummary extends Document {
  patientId: mongoose.Types.ObjectId | IPatient;
  summary: string;
  riskFactors?: string[];
  recommendations?: string[];
  confidence: number;
  documentSources?: (mongoose.Types.ObjectId | IDocument)[];
  version: string;
  generatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// AIHealthSummary schema
const aiHealthSummarySchema = new Schema<IAIHealthSummary>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    riskFactors: [String],
    recommendations: [String],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    documentSources: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    version: {
      type: String,
      default: '1.0',
    },
    generatedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AIHealthSummary: Model<IAIHealthSummary> = mongoose.model<IAIHealthSummary>('AIHealthSummary', aiHealthSummarySchema);

export default AIHealthSummary;