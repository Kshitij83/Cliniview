import express from 'express';
import { 
  getDoctor,
  updateDoctor,
  getPatients,
  addDiagnosticNote
} from '../controllers/doctor.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get doctor profile
router.get('/:id', getDoctor);

// Update doctor profile
router.put('/:id', authorize('doctor'), updateDoctor);

// Get doctor's patients
router.get('/:id/patients', authorize('doctor'), getPatients);

// Add diagnostic notes
router.post('/patients/:id/diagnostic-notes', authorize('doctor'), addDiagnosticNote);

export default router;