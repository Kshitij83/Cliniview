import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';

// Define the role type
export type UserRole = 'patient' | 'doctor';

// User interface
export interface IUser extends Document {
  email: string;
  name: string;
  password?: string; // Optional for OAuth users
  role: UserRole;
  avatar?: string;
  googleId?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      // Not required for OAuth users
    },
    role: {
      type: String,
      enum: ['patient', 'doctor'],
      required: true,
    },
    avatar: {
      type: String,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  const user = this as IUser;
  
  if (!user.isModified('password') || !user.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
});

// Check password match
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const user = this as IUser;
  if (!user.password) return false;
  return await bcrypt.compare(candidatePassword, user.password);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;