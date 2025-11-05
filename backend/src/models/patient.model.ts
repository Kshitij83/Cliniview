import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './user.model';

/**
 * Interface for Patient document in MongoDB
 * Represents a patient's profile with optional personal health information
 */
export interface IPatient extends Document {
  user: mongoose.Types.ObjectId | IUser;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Patient collection
 * Links to User document and stores optional personal health details
 */
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

/**
 * Patient model for database operations
 * Used to manage patient profiles and medical information
 */
const Patient: Model<IPatient> = mongoose.model<IPatient>('Patient', patientSchema);

export default Patient;