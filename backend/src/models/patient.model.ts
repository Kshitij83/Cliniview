import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './user.model';

// Patient interface - Simplified for minimal requirements
export interface IPatient extends Document {
  user: mongoose.Types.ObjectId | IUser;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Patient schema - Simplified for minimal requirements
const patientSchema = new Schema<IPatient>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: false,
    },
    phone: {
      type: String,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

const Patient: Model<IPatient> = mongoose.model<IPatient>('Patient', patientSchema);

export default Patient;