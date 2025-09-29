import express from 'express';
import { 
  getPatient,
  updatePatient,
  uploadDocument,
  getDocuments,
  getAIHealthSummary
} from '../controllers/patient.controller';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get patient profile
router.get('/:id', getPatient);

// Update patient profile
router.put('/:id', authorize('patient', 'doctor'), updatePatient);

// Document management
router.post('/:id/documents', authorize('patient', 'doctor'), upload.single('file'), uploadDocument);
router.get('/:id/documents', authorize('patient', 'doctor'), getDocuments);

// AI-generated health summary
router.get('/:id/ai-summary', authorize('patient', 'doctor'), getAIHealthSummary);

export default router;