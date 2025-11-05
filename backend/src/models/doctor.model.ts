import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './user.model';

/**
 * Interface for Doctor document in MongoDB
 * Represents a doctor's profile with optional professional details
 */
export interface IDoctor extends Document {
  user: mongoose.Types.ObjectId | IUser;
  licenseNumber?: string;
  specialization?: string;
  hospital?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Doctor collection
 * Links to User document and stores optional professional information
 */
const doctorSchema = new Schema<IDoctor>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    licenseNumber: {
      type: String,
      required: false,
      unique: true,
    },
    specialization: {
      type: String,
      required: false,
    },
    hospital: {
      type: String,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

/**
 * Doctor model for database operations
 * Used to manage doctor profiles in the application
 */
const Doctor: Model<IDoctor> = mongoose.model<IDoctor>('Doctor', doctorSchema);

export default Doctor;