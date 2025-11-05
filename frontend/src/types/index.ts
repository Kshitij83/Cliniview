/**
 * Base user interface for all user types in the system
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  avatar?: string;
  createdAt: string;
}

/**
 * Patient-specific user interface extending base User
 * Contains patient health and contact information
 */
export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  phone: string;
  address: string;
  emergencyContact: string;
}

/**
 * Doctor-specific user interface extending base User
 * Contains professional credentials and workplace information
 */
export interface Doctor extends User {
  role: 'doctor';
  licenseNumber: string;
  specialization: string;
  hospital: string;
  experience: number;
}

/**
 * Interface for medical document metadata
 * Represents uploaded files like lab reports, prescriptions, etc.
 */
export interface MedicalDocument {
  id: string;
  patientId: string;
  type: 'prescription' | 'lab_report' | 'medical_history' | 'other';
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  doctorId?: string;
}

/**
 * Interface for AI-generated health summaries
 * Contains ML analysis of patient health data
 */
export interface AIHealthSummary {
  id: string;
  patientId: string;
  summary: string;
  riskFactors: string[];
  recommendations: string[];
  generatedAt: string;
  confidence: number;
}

/**
 * Interface for symptom checker results
 * Contains AI analysis of reported symptoms and possible conditions
 */
export interface SymptomCheck {
  id: string;
  patientId: string;
  symptoms: string[];
  aiResponse: string;
  possibleConditions: string[];
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

/**
 * Interface for doctor's diagnostic notes on patient documents
 * Contains medical assessment and recommendations
 */
export interface DiagnosticNote {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  prescription: string[];
  notes: string;
  createdAt: string;
}

/**
 * Interface for user notifications
 * Represents system messages and alerts for users
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

/**
 * Interface for dashboard statistics and metrics
 * Contains counts for various entities in the system
 */
export interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalDocuments: number;
  totalAISummaries: number;
}