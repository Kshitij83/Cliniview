import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './user.model';

// Doctor interface - Simplified for minimal requirements
export interface IDoctor extends Document {
  user: mongoose.Types.ObjectId | IUser;
  licenseNumber?: string;
  specialization?: string;
  hospital?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Doctor schema - Simplified for minimal requirements
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

const Doctor: Model<IDoctor> = mongoose.model<IDoctor>('Doctor', doctorSchema);

export default Doctor;