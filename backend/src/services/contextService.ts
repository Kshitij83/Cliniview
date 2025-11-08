import Document from '../models/document.model';
import DiagnosticNote from '../models/diagnosticNote.model';
import SymptomCheck from '../models/symptomCheck.model';
import Patient from '../models/patient.model';
import { PatientContext } from './aiService';

/**
 * Service to aggregate patient medical data for AI analysis
 */
export class ContextAggregationService {
  
  /**
   * Aggregate comprehensive patient context for AI health summary
   */
  async aggregatePatientContext(patientId: string, days: number = 7): Promise<PatientContext> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Get patient profile
      const patientProfile = await Patient.findOne({ user: patientId })
        .populate('user', 'name email');
      
      if (!patientProfile) {
        throw new Error('Patient profile not found');
      }

      // Get recent medical reports (last 3)
      const medicalReports = await Document.find({ 
        patientId: patientProfile._id,
        createdAt: { $gte: cutoffDate }
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('uploadedBy', 'name role');

      // Get recent doctor prescriptions/notes (last 3) 
      const prescriptions = await DiagnosticNote.find({
        patientId: patientProfile._id,
        createdAt: { $gte: cutoffDate }
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('doctorId', 'user')
        .populate('documentId', 'title type');

      // Get recent symptom analyses (last 5)
      const symptomChecks = await SymptomCheck.find({
        patientId: patientProfile._id,
        createdAt: { $gte: cutoffDate }
      })
        .sort({ createdAt: -1 })
        .limit(5);

      return {
        patientId,
        medicalReports: medicalReports || [],
        prescriptions: prescriptions || [],
        symptomChecks: symptomChecks || [],
        patientProfile: {
          name: (patientProfile.user as any)?.name || 'Unknown',
          age: patientProfile.dateOfBirth 
            ? Math.floor((Date.now() - new Date(patientProfile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null,
          gender: patientProfile.gender,
          phone: patientProfile.phone,
          medicalHistory: 'Not available', // Placeholder - would need separate model
          allergies: [], // Placeholder - would need separate model  
          currentMedications: [], // Placeholder - would need separate model
          emergencyContact: null // Placeholder - would need separate model
        },
        timeframe: `${days} days`
      };

    } catch (error: any) {
      console.error('Error aggregating patient context:', error);
      throw new Error(`Failed to aggregate patient context: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get patient context summary for display
   */
  async getContextSummary(patientId: string, days: number = 7): Promise<{
    reportsCount: number;
    prescriptionsCount: number;
    symptomChecksCount: number;
    lastActivity: Date | null;
    hasRecentActivity: boolean;
  }> {
    try {
      const context = await this.aggregatePatientContext(patientId, days);
      
      const allActivities = [
        ...context.medicalReports.map(r => r.createdAt),
        ...context.prescriptions.map(p => p.createdAt),
        ...context.symptomChecks.map(s => s.createdAt)
      ];

      const lastActivity = allActivities.length > 0 
        ? new Date(Math.max(...allActivities.map(d => new Date(d).getTime())))
        : null;

      return {
        reportsCount: context.medicalReports.length,
        prescriptionsCount: context.prescriptions.length,
        symptomChecksCount: context.symptomChecks.length,
        lastActivity,
        hasRecentActivity: allActivities.length > 0
      };

    } catch (error: any) {
      console.error('Error getting context summary:', error);
      throw new Error(`Failed to get context summary: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Check if patient has sufficient data for meaningful AI analysis
   */
  async hasValidContext(patientId: string, days: number = 7): Promise<{
    isValid: boolean;
    reason?: string;
    dataPoints: number;
  }> {
    try {
      const context = await this.aggregatePatientContext(patientId, days);
      
      const dataPoints = context.medicalReports.length + 
                        context.prescriptions.length + 
                        context.symptomChecks.length;

      if (dataPoints === 0) {
        return {
          isValid: false,
          reason: 'No recent medical data found. Please upload medical reports, visit a doctor, or use the symptom checker.',
          dataPoints: 0
        };
      }

      if (dataPoints < 2) {
        return {
          isValid: false,
          reason: 'Insufficient medical data for comprehensive analysis. Please add more medical information.',
          dataPoints
        };
      }

      return {
        isValid: true,
        dataPoints
      };

    } catch (error: any) {
      console.error('Error validating context:', error);
      return {
        isValid: false,
        reason: 'Unable to validate patient data.',
        dataPoints: 0
      };
    }
  }

  /**
   * Get context for specific timeframes
   */
  async getTimeframedContext(patientId: string, timeframe: '1d' | '3d' | '1w' | '2w' | '1m'): Promise<PatientContext> {
    const daysMap = {
      '1d': 1,
      '3d': 3,
      '1w': 7,
      '2w': 14,
      '1m': 30
    };
    
    return this.aggregatePatientContext(patientId, daysMap[timeframe]);
  }
}

export default new ContextAggregationService();