import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import User, { IUser } from '../models/user.model';
import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Debug environment variables after dotenv config
console.log("Environment variables for OAuth (after direct dotenv loading):");
console.log("- GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "defined" : "undefined");
console.log("- GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "defined" : "undefined");
console.log("- GOOGLE_CALLBACK_URL:", process.env.GOOGLE_CALLBACK_URL);

// Create a new OAuth2 client with the configured keys
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

interface GoogleTokenPayload {
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

// Generate JWT token
const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const payload = { id: user._id, email: user.email, role: user.role } as TokenPayload;
  
  // Using an assertion to bypass TypeScript's type checking for this particular call
  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any);
};

// @desc    Google OAuth login
// @route   GET /api/auth/google
// @access  Public
export const googleAuth = (req: Request, res: Response): void => {
  // Get the role from query parameters (default to 'patient')
  const role = req.query.role || 'patient';
  
  // Store the role in the state parameter to retrieve it in the callback
  const state = JSON.stringify({ role });
  
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    prompt: 'consent',
    include_granted_scopes: true,
    state: state // Pass the role information to the callback
  });

  console.log("Google OAuth URL:", authorizeUrl);
  console.log("Role set to:", role);
  res.redirect(authorizeUrl);
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=invalid_code`);
      return;
    }

    // Exchange code for tokens
    console.log("Exchanging code for tokens");
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    console.log("Received tokens:", tokens ? "Token received" : "No tokens received");
    
    if (!tokens.id_token) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=invalid_token`);
      return;
    }
    
    // Get user info using the access token
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    
    const userInfo = await oauth2.userinfo.get();
    
    if (!userInfo.data || !userInfo.data.email) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=invalid_userinfo`);
      return;
    }
    
    const payload = {
      email: userInfo.data.email,
      name: userInfo.data.name || '',
      picture: userInfo.data.picture,
      given_name: userInfo.data.given_name,
      family_name: userInfo.data.family_name
    } as GoogleTokenPayload;
    
    // Find existing user or create a new one
  let user = await User.findOne({ email: payload.email });

    // Get the role from the state parameter
    let role = 'patient'; // Default to patient
    try {
      if (req.query.state && typeof req.query.state === 'string') {
        const stateData = JSON.parse(req.query.state);
        if (stateData.role) {
          role = stateData.role as string;
        }
      }
    } catch (e) {
      console.error('Failed to parse state parameter:', e);
      // Continue with default role
    }
    console.log("Using role:", role);
    
    if (!user) {
      // Create new user with the role specified in the query
      user = new User({
        name: payload.name || '',
        email: payload.email,
        role: role,
        isEmailVerified: true, // Google OAuth users are verified
        password: Math.random().toString(36).slice(-8), // Random password for OAuth users
      });
      
      await user.save();
      console.log(`Created new user with role: ${role}`);
      
      // Create the specific user type (Patient or Doctor) profile
      try {
        if (role === 'patient') {
          // Import here to avoid circular dependency
          const Patient = require('../models/patient.model').default;

          const newPatient = new Patient({
            user: user._id,
            // other fields are optional and can be set later via profile update
          });

          await newPatient.save();
          console.log('Patient profile created for OAuth user');
        } else if (role === 'doctor') {
          // Import here to avoid circular dependency
          const Doctor = require('../models/doctor.model').default;

          const newDoctor = new Doctor({
            user: user._id,
            // other fields are optional and can be set later via profile update
          });

          await newDoctor.save();
          console.log('Doctor profile created for OAuth user');
        }
      } catch (profileError) {
        console.error('Error creating user profile for OAuth user:', profileError);
        // We don't want to fail registration if profile creation fails
        // The profile can be created later
      }
    } else {
      // Existing user: enforce role consistency
      if (user.role !== role) {
        console.warn(`Role mismatch for ${user.email}: existing=${user.role}, requested=${role}`);
        res.redirect(`${process.env.FRONTEND_URL}/auth/login?role=${role}&error=role_mismatch`);
        return;
      }
    }

    // Generate JWT
    const token = generateToken(user);

    // Redirect to frontend dashboard based on role
    const dashboardPath = user.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient';
    res.redirect(`${process.env.FRONTEND_URL}${dashboardPath}?token=${token}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    user = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role,
      isEmailVerified: false, // Would normally send verification email
    });

    await user.save();

    // Create the specific user type (Patient or Doctor)
    try {
      if (role === 'patient') {
        // Import here to avoid circular dependency
        const Patient = require('../models/patient.model').default;

        const newPatient = new Patient({
          user: user._id,
          // optional fields can be provided later
        });

        await newPatient.save();
        console.log('Patient profile created');
      } else if (role === 'doctor') {
        // Import here to avoid circular dependency
        const Doctor = require('../models/doctor.model').default;

        const newDoctor = new Doctor({
          user: user._id,
          // optional fields can be provided later
        });

        await newDoctor.save();
        console.log('Doctor profile created');
      }
    } catch (profileError) {
      console.error('Error creating user profile:', profileError);
      // We don't want to fail registration if profile creation fails
      // The profile can be created later
    }

    // Generate token
    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password, role } = req.body as { email: string; password: string; role?: string };

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If a role was specified by the client, enforce role match
    if (role && user.role !== role) {
      return res.status(403).json({ message: `Account exists as ${user.role}. Please sign in as ${user.role} or use a different email.` });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req: Request, res: Response): Response => {
  // JWT is stateless, so we just tell the client to remove the token
  return res.status(200).json({ message: 'Logged out successfully' });
};