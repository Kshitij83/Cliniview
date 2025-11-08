import express from 'express';
import { 
  checkSymptoms,
  generateHealthSummary,
  chatWithAI,
  getConversationHistory,
  getAvailableModels,
  getContextSummary
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Symptom checker
router.post('/symptom-check', checkSymptoms);

// AI Health Summary routes
router.post('/health-summary', generateHealthSummary);
router.post('/chat', chatWithAI);
router.get('/conversation/:conversationId', getConversationHistory);
router.get('/models', getAvailableModels);
router.get('/context-summary', getContextSummary);

export default router;