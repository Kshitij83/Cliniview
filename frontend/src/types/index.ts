export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  phone: string;
  address: string;
  emergencyContact: string;
}

export interface Doctor extends User {
  role: 'doctor';
  licenseNumber: string;
  specialization: string;
  hospital: string;
  experience: number;
}

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

export interface AIHealthSummary {
  id: string;
  patientId: string;
  summary: string;
  riskFactors: string[];
  recommendations: string[];
  generatedAt: string;
  confidence: number;
}

export interface SymptomCheck {
  id: string;
  patientId: string;
  symptoms: string[];
  aiResponse: string;
  possibleConditions: string[];
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface DiagnosticNote {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  prescription: string[];
  notes: string;
  createdAt: string;
}

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

export interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalDocuments: number;
  totalAISummaries: number;
}