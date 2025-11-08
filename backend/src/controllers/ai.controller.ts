import { Request, Response } from 'express';
import Patient from '../models/patient.model';
import SymptomCheck from '../models/symptomCheck.model';
import AIHealthSummary from '../models/aiHealthSummary.model';
import aiService, { AIModel, ChatMessage } from '../services/aiService';
import contextService from '../services/contextService';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

/**
 * Check symptoms using ML service
 * Sends symptoms to ML API and returns analysis
 * @route   POST /api/ai/symptom-check
 * @access  Private (Patient)
 */
export const checkSymptoms = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ 
        message: 'Symptoms array is required and must not be empty' 
      });
    }
    
    // Get patient from authenticated user
    const patient = await Patient.findOne({ user: req.user!.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }
    
    // Transform symptoms for ML service
    let mlPayload;
    let mlEndpoint = '/predict_symptom';
    
    // Check if symptoms are objects with severity/duration or just strings
    if (symptoms.length > 0 && typeof symptoms[0] === 'object' && symptoms[0].name) {
      // Enhanced format: use symptom objects with severity/duration
      mlPayload = { symptoms };
      mlEndpoint = '/predict_symptom_enhanced';
      console.log('🔍 DEBUG: Using enhanced ML endpoint with symptom objects');
    } else {
      // Legacy format: convert strings to default symptom objects
      mlPayload = {
        symptoms: symptoms.map((symptom: string) => ({
          name: symptom,
          severity: 'moderate',
          duration: '2-3 days'
        }))
      };
      mlEndpoint = '/predict_symptom_enhanced';
      console.log('🔍 DEBUG: Converting strings to symptom objects for enhanced endpoint');
    }
    
    // Call ML service
    try {
      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
      console.log('🔍 DEBUG: ML Service URL:', mlServiceUrl);
      console.log('🔍 DEBUG: Calling endpoint:', `${mlServiceUrl}${mlEndpoint}`);
      console.log('🔍 DEBUG: Request payload:', JSON.stringify(mlPayload, null, 2));
      
      const mlResponse = await axios.post(`${mlServiceUrl}${mlEndpoint}`, mlPayload, {
        timeout: 10000
      });
      
      console.log('✅ DEBUG: ML Response received, status:', mlResponse.status);
      console.log('✅ DEBUG: ML Response data:', JSON.stringify(mlResponse.data, null, 2));
      
      const {
        predictions,
        method,
        total_symptoms,
        matched_symptoms,
        safety_features
      } = mlResponse.data;
      
      console.log('🔍 DEBUG: Extracted predictions count:', predictions?.length);
      
      // Transform predictions to match database schema
      const possibleConditions = predictions.map((pred: any) => ({
        name: pred.disease,
        probability: pred.confidence,
        description: `Severity: ${pred.severity} | Matching symptoms: ${pred.matching_symptoms}${
          pred.safety_notes && pred.safety_notes.length > 0 ? ' | ' + pred.safety_notes.join(', ') : ''
        }`
      }));
      
      // Calculate overall severity from ML predictions
      let overall_severity = 'low';
      let severity_score = 0;
      
      if (predictions.length > 0) {
        const maxConfidence = Math.max(...predictions.map((p: any) => p.confidence));
        const hasSeriousDisease = predictions.some((p: any) => p.severity === 'serious');
        
        if (maxConfidence > 0.7 || hasSeriousDisease) {
          overall_severity = 'high';
          severity_score = maxConfidence * 100;
        } else if (maxConfidence > 0.4) {
          overall_severity = 'medium';
          severity_score = maxConfidence * 100;
        } else {
          overall_severity = 'low';
          severity_score = maxConfidence * 100;
        }
      }
      
      // Generate recommendations from ML predictions
      const recommendation_summary = [];
      if (predictions.length > 0) {
        const topPrediction = predictions[0];
        if (topPrediction.recommendations && topPrediction.recommendations.length > 0) {
          recommendation_summary.push(...topPrediction.recommendations);
        }
        
        // Add general recommendations
        recommendation_summary.push("Monitor your symptoms for changes");
        recommendation_summary.push("Keep track of symptom duration and severity");
      } else {
        recommendation_summary.push("Unable to determine specific condition from provided symptoms");
        recommendation_summary.push("Consider consulting a healthcare professional for proper diagnosis");
      }
      
      // Generate AI response
      const ai_response = predictions.length > 0 
        ? `Based on your ${total_symptoms} symptom(s), our ML analysis identified ${predictions.length} potential conditions. The most likely condition is ${predictions[0].disease} with ${(predictions[0].confidence * 100).toFixed(1)}% confidence. This analysis considered symptom severity and duration for enhanced accuracy.`
        : `Unable to determine a specific condition from the provided symptoms. Please consult a healthcare professional for proper diagnosis.`;
      
      console.log('🔍 DEBUG: Transformed possibleConditions:', possibleConditions.length);
      
      // Extract symptom names for database storage
      const symptomNames = typeof symptoms[0] === 'object' 
        ? symptoms.map((s: any) => s.name) 
        : symptoms;
      
      // Save results to database
      const symptomCheck = new SymptomCheck({
        patientId: patient.id,
        symptoms: symptomNames,
        aiResponse: ai_response,
        possibleConditions,
        severity: overall_severity as any,
        recommendations: recommendation_summary,
        modelVersion: '2.0-ML-Enhanced'
      });
      
      console.log('🔍 DEBUG: About to save to database...');
      await symptomCheck.save();
      console.log('✅ DEBUG: Saved to database successfully');
      
      return res.status(200).json({
        success: true,
        data: {
          id: symptomCheck.id,
          symptoms: symptomNames,
          predictions,
          overallSeverity: overall_severity,
          severityScore: severity_score,
          recommendations: recommendation_summary,
          aiResponse: ai_response,
          method,
          mlFeatures: safety_features,
          createdAt: symptomCheck.createdAt
        }
      });
    } catch (apiError: any) {
      console.error('❌ ML API ERROR CAUGHT:');
      console.error('❌ Error message:', apiError.message);
      console.error('❌ Error code:', apiError.code);
      console.error('❌ Error response status:', apiError.response?.status);
      console.error('❌ Error response data:', apiError.response?.data);
      console.error('❌ Full error:', apiError);
      
      // Fallback response if ML service is unavailable
      return res.status(503).json({ 
        message: 'Symptom checking service is currently unavailable. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? apiError.message : undefined
      });
    }
  } catch (error) {
    console.error('Symptom check error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Check daily AI usage limit for a patient
 */
const checkDailyLimit = async (patientId: string): Promise<boolean> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const count = await AIHealthSummary.countDocuments({
    patientId,
    createdAt: { $gte: today }
  });
  
  const limit = parseInt(process.env.AI_DAILY_LIMIT || '10');
  return count < limit;
};

/**
 * Generate AI Health Summary
 * @route   POST /api/ai/health-summary
 * @access  Private (Patient)
 */
export const generateHealthSummary = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { model = process.env.AI_DEFAULT_MODEL || 'gpt-5-mini-2025-08-07' } = req.body;
    
    // Get patient from authenticated user
    const patient = await Patient.findOne({ user: req.user!.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Check daily limit
    const canGenerate = await checkDailyLimit((patient as any)._id.toString());
    if (!canGenerate) {
      return res.status(429).json({ 
        message: `Daily AI analysis limit reached. You can generate ${process.env.AI_DAILY_LIMIT || 10} summaries per day.`,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day
      });
    }

    // Validate context
    const contextValidation = await contextService.hasValidContext(req.user!.id);
    if (!contextValidation.isValid) {
      return res.status(400).json({
        message: 'Insufficient medical data for AI analysis',
        reason: contextValidation.reason,
        dataPoints: contextValidation.dataPoints
      });
    }

    // Aggregate patient context
    const context = await contextService.aggregatePatientContext(req.user!.id);
    
    // Generate AI health summary
    const summary = await aiService.generateHealthSummary(context, model as AIModel);
    
    // Save to database
    const savedSummary = new AIHealthSummary({
      patientId: (patient as any)._id,
      summary: summary.summary,
      riskFactors: summary.riskFactors,
      recommendations: summary.recommendations,
      confidence: summary.confidence,
      version: '2.0',
      generatedBy: summary.modelUsed
    });
    
    await savedSummary.save();
    
    return res.status(201).json({
      success: true,
      data: {
        id: savedSummary._id,
        summary: summary.summary,
        keyInsights: summary.keyInsights,
        riskFactors: summary.riskFactors,
        recommendations: summary.recommendations,
        healthTrends: summary.healthTrends,
        urgencyLevel: summary.urgencyLevel,
        confidence: summary.confidence,
        modelUsed: summary.modelUsed,
        conversationId: summary.conversationId,
        generatedAt: savedSummary.createdAt,
        contextSummary: {
          reportsCount: context.medicalReports.length,
          prescriptionsCount: context.prescriptions.length,
          symptomChecksCount: context.symptomChecks.length,
          timeframe: context.timeframe
        }
      }
    });

  } catch (error: any) {
    console.error('Health summary generation error:', error);
    return res.status(500).json({ 
      message: 'Failed to generate health summary',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Chat with AI about health
 * @route   POST /api/ai/chat
 * @access  Private (Patient)
 */
export const chatWithAI = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { 
      message, 
      conversationId, 
      model = process.env.AI_DEFAULT_MODEL || 'gpt-5-mini-2025-08-07' 
    } = req.body;

    if (!message || !conversationId) {
      return res.status(400).json({ 
        message: 'Message and conversation ID are required' 
      });
    }

    // Get patient from authenticated user
    const patient = await Patient.findOne({ user: req.user!.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Check daily limit (chat counts towards daily limit)
    const canGenerate = await checkDailyLimit((patient as any)._id.toString());
    if (!canGenerate) {
      return res.status(429).json({ 
        message: `Daily AI interaction limit reached. You can have ${process.env.AI_DAILY_LIMIT || 10} interactions per day.`,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    // Get patient context
    const context = await contextService.aggregatePatientContext(req.user!.id);
    
    // Chat with AI
    const response = await aiService.chatWithAI(message, conversationId, context, model as AIModel);
    
    // Save interaction to database (for tracking daily limit)
    const chatSummary = new AIHealthSummary({
      patientId: (patient as any)._id,
      summary: `Chat: ${message.substring(0, 100)}...`,
      riskFactors: [],
      recommendations: [],
      confidence: 0.8,
      version: '2.0-chat',
      generatedBy: model
    });
    
    await chatSummary.save();
    
    return res.status(200).json({
      success: true,
      data: {
        response: response.response,
        messageId: response.messageId,
        conversationId,
        model,
        timestamp: new Date()
      }
    });

  } catch (error: any) {
    console.error('AI chat error:', error);
    return res.status(500).json({ 
      message: 'Failed to process chat message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get conversation history
 * @route   GET /api/ai/conversation/:conversationId
 * @access  Private (Patient)
 */
export const getConversationHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { conversationId } = req.params;
    
    const history = aiService.getConversationHistory(conversationId);
    
    return res.status(200).json({
      success: true,
      data: {
        conversationId,
        messages: history,
        messageCount: history.length
      }
    });

  } catch (error: any) {
    console.error('Get conversation history error:', error);
    return res.status(500).json({ 
      message: 'Failed to get conversation history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get available AI models
 * @route   GET /api/ai/models
 * @access  Private (Patient)
 */
export const getAvailableModels = async (req: Request, res: Response): Promise<Response> => {
  try {
    const models = [
      {
        id: 'gpt-5-nano-2025-08-07',
        name: 'GPT-5 Nano',
        provider: 'OpenAI',
        description: 'Fast and efficient model for quick responses',
        features: ['Quick responses', 'Cost effective', 'General health advice']
      },
      {
        id: 'gpt-5-mini-2025-08-07',
        name: 'GPT-5 Mini',
        provider: 'OpenAI', 
        description: 'Balanced model for comprehensive health analysis',
        features: ['Detailed analysis', 'Medical reasoning', 'Personalized insights']
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        description: 'Google\'s advanced model with medical knowledge',
        features: ['Medical expertise', 'Fast processing', 'Contextual understanding']
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        models,
        defaultModel: process.env.AI_DEFAULT_MODEL || 'gpt-5-mini-2025-08-07',
        dailyLimit: parseInt(process.env.AI_DAILY_LIMIT || '10')
      }
    });

  } catch (error: any) {
    console.error('Get models error:', error);
    return res.status(500).json({ 
      message: 'Failed to get available models',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get patient context summary
 * @route   GET /api/ai/context-summary
 * @access  Private (Patient)
 */
export const getContextSummary = async (req: Request, res: Response): Promise<Response> => {
  try {
    const contextSummary = await contextService.getContextSummary(req.user!.id);
    const contextValidation = await contextService.hasValidContext(req.user!.id);
    
    return res.status(200).json({
      success: true,
      data: {
        ...contextSummary,
        isValidForAnalysis: contextValidation.isValid,
        validationMessage: contextValidation.reason,
        totalDataPoints: contextValidation.dataPoints
      }
    });

  } catch (error: any) {
    console.error('Get context summary error:', error);
    return res.status(500).json({ 
      message: 'Failed to get context summary',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};