import express from 'express';
import {
  addComment,
  getDocumentComments
} from '../controllers/diagnosticNote.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Add a comment to a document - doctors only
router.post('/', authorize('doctor'), addComment);

// Get all comments for a document
router.get('/document/:documentId', authenticate, getDocumentComments);

export default router;