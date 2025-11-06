import express from 'express';
import { 
  getDocument,
  uploadDocument,
  getPatientDocuments,
  deleteDocument,
  getAllDocuments,
  uploadPrescription
} from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Upload a document - patients only
router.post('/', authorize('patient'), upload.single('file'), uploadDocument);

// Get all documents (for doctors to see all patient records)
router.get('/all', authorize('doctor'), getAllDocuments);

// Get current user's documents (for patients)
router.get('/my-documents', authorize('patient'), getPatientDocuments);

// Get patient's documents by patient ID
router.get('/patient/:patientId', authorize('patient', 'doctor'), getPatientDocuments);

// Upload prescription for a document (doctors only)
router.post('/:id/prescription', authorize('doctor'), upload.single('file'), uploadPrescription);

// Get specific document
router.get('/:id', getDocument);

// Delete document
router.delete('/:id', authorize('patient', 'doctor'), deleteDocument);

export default router;