import express from 'express';
import { 
  googleAuth, 
  googleCallback, 
  register, 
  login, 
  logout 
} from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = express.Router();

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Traditional auth routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

export default router;