import express from 'express';
import { 
  getDocument,
  uploadDocument,
  getPatientDocuments,
  deleteDocument
} from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Upload a document - patients only
router.post('/', authorize('patient'), upload.single('file'), uploadDocument);

// Get current user's documents (for patients)
router.get('/my-documents', authorize('patient'), getPatientDocuments);

// Get patient's documents by patient ID
router.get('/patient/:patientId', authorize('patient', 'doctor'), getPatientDocuments);

// Get specific document
router.get('/:id', getDocument);

// Delete document
router.delete('/:id', authorize('patient', 'doctor'), deleteDocument);

export default router;