import mongoose, { Document, Schema, Model } from 'mongoose';
import { IPatient } from './patient.model';

// Interface for possible conditions
interface IPossibleCondition {
  name: string;
  probability: number;
  description?: string;
}

// Interface for user feedback
interface IUserFeedback {
  wasHelpful?: boolean;
  comments?: string;
}

// Severity type
export type SeverityLevel = 'low' | 'medium' | 'high';

// SymptomCheck interface
export interface ISymptomCheck extends Document {
  patientId: mongoose.Types.ObjectId | IPatient;
  symptoms: string[];
  aiResponse: string;
  possibleConditions?: IPossibleCondition[];
  severity: SeverityLevel;
  recommendations?: string[];
  userFeedback?: IUserFeedback;
  modelVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

// SymptomCheck schema
const symptomCheckSchema = new Schema<ISymptomCheck>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    symptoms: {
      type: [String],
      required: true,
    },
    aiResponse: {
      type: String,
      required: true,
    },
    possibleConditions: [
      {
        name: String,
        probability: Number,
        description: String,
      },
    ],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    recommendations: {
      type: [String],
      default: [],
    },
    userFeedback: {
      wasHelpful: Boolean,
      comments: String,
    },
    modelVersion: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SymptomCheck: Model<ISymptomCheck> = mongoose.model<ISymptomCheck>('SymptomCheck', symptomCheckSchema);

export default SymptomCheck;