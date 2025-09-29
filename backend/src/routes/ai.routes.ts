import express from 'express';
import { checkSymptoms } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Symptom checker
router.post('/symptom-check', checkSymptoms);

export default router;