import mongoose, { Document, Schema, Model } from 'mongoose';
import { IPatient } from './patient.model';
import { IDoctor } from './doctor.model';
import { IDocument } from './document.model';

// DiagnosticNote interface - Simplified for minimal requirements
export interface IDiagnosticNote extends Document {
  patientId: mongoose.Types.ObjectId | IPatient;
  doctorId: mongoose.Types.ObjectId | IDoctor;
  documentId: mongoose.Types.ObjectId | IDocument;
  comments: string;
  createdAt: Date;
  updatedAt: Date;
}

// DiagnosticNote schema - Simplified to focus on doctor comments on documents
const diagnosticNoteSchema = new Schema<IDiagnosticNote>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    comments: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

const DiagnosticNote: Model<IDiagnosticNote> = mongoose.model<IDiagnosticNote>('DiagnosticNote', diagnosticNoteSchema);

export default DiagnosticNote;