import { Request, Response } from 'express';
import Patient from '../models/patient.model';
import SymptomCheck from '../models/symptomCheck.model';
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
    
    // Call ML service
    try {
      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
      console.log('🔍 DEBUG: ML Service URL:', mlServiceUrl);
      console.log('🔍 DEBUG: Calling endpoint:', `${mlServiceUrl}/predict_symptom`);
      console.log('🔍 DEBUG: Request payload:', { symptoms });
      
      const mlResponse = await axios.post(`${mlServiceUrl}/predict_symptom`, {
        symptoms
      }, {
        timeout: 10000
      });
      
      console.log('✅ DEBUG: ML Response received, status:', mlResponse.status);
      console.log('✅ DEBUG: ML Response data:', JSON.stringify(mlResponse.data, null, 2));
      
      const {
        predictions,
        overall_severity,
        severity_score,
        recommendation_summary,
        total_symptoms,
        ai_response
      } = mlResponse.data;
      
      console.log('🔍 DEBUG: Extracted predictions count:', predictions?.length);
      
      // Transform predictions to match database schema
      const possibleConditions = predictions.map((pred: any) => ({
        name: pred.disease,
        probability: pred.confidence,
        description: `Severity: ${pred.severity} | Matching symptoms: ${pred.matching_symptoms}`
      }));
      
      console.log('🔍 DEBUG: Transformed possibleConditions:', possibleConditions.length);
      
      // Save results to database
      const symptomCheck = new SymptomCheck({
        patientId: patient.id,
        symptoms,
        aiResponse: ai_response,
        possibleConditions,
        severity: overall_severity,
        recommendations: recommendation_summary,
        modelVersion: '1.0'
      });
      
      console.log('🔍 DEBUG: About to save to database...');
      await symptomCheck.save();
      console.log('✅ DEBUG: Saved to database successfully');
      
      return res.status(200).json({
        success: true,
        data: {
          id: symptomCheck.id,
          symptoms,
          predictions,
          overallSeverity: overall_severity,
          severityScore: severity_score,
          recommendations: recommendation_summary,
          aiResponse: ai_response,
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