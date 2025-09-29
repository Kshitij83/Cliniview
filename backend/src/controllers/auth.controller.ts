import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User, { IUser } from '../models/user.model';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
  const redirectUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    redirect_uri: process.env.GOOGLE_CALLBACK_URL as string,
  });

  res.redirect(redirectUrl);
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
    const { tokens } = await client.getToken({
      code,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL as string,
    });

    if (!tokens.id_token) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=invalid_token`);
      return;
    }

    // Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID as string,
    });

    const payload = ticket.getPayload() as GoogleTokenPayload;
    
    if (!payload || !payload.email) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=invalid_payload`);
      return;
    }
    
    // Find existing user or create a new one
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Create new user (role needs to be selected by the user during registration flow)
      res.redirect(`${process.env.FRONTEND_URL}/auth/complete-registration?email=${payload.email}&name=${payload.name}`);
      return;
    }

    // Generate JWT
    const token = generateToken(user);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/oauth-callback?token=${token}`);
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
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
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