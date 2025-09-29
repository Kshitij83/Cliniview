import { Request, Response } from 'express';
import Patient from '../models/patient.model';
import SymptomCheck from '../models/symptomCheck.model';
import axios from 'axios';

// @desc    Check symptoms through ML service
// @route   POST /api/ai/symptom-check
// @access  Private
export const checkSymptoms = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { patientId, symptoms } = req.body;
    
    if (!patientId || !symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ 
        message: 'Patient ID and symptoms array are required' 
      });
    }
    
    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Call ML service (this would be an actual API call in production)
    try {
      // Example API call to the ML service
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/api/symptom-check`, {
        patient_id: patientId,
        symptoms
      }, {
        headers: {
          'X-API-Key': process.env.ML_API_KEY || 'test-key'
        }
      });
      
      const { 
        explanation,
        possible_conditions,
        severity, 
        recommendations
      } = mlResponse.data;
      
      // Save results to database
      const symptomCheck = new SymptomCheck({
        patientId,
        symptoms,
        aiResponse: explanation,
        possibleConditions: possible_conditions,
        severity,
        recommendations,
        modelVersion: '1.0'
      });
      
      await symptomCheck.save();
      
      return res.status(200).json(symptomCheck);
    } catch (apiError) {
      console.error('ML API error:', apiError);
      
      // Fallback response if ML service is unavailable
      return res.status(503).json({ 
        message: 'Symptom checking service is currently unavailable'
      });
    }
  } catch (error) {
    console.error('Symptom check error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};