import { Request, Response } from 'express';
import Patient from '../models/patient.model';
import Document from '../models/document.model';
import AIHealthSummary from '../models/aiHealthSummary.model';

/**
 * Get patient profile by user ID
 * @route   GET /api/patients/:id
 * @access  Private
 */
export const getPatient = async (req: Request, res: Response): Promise<Response> => {
  try {
    const patientId = req.params.id;
    
    const patient = await Patient.findOne({ user: patientId }).populate('user');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    return res.status(200).json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update patient profile
 * @route   PUT /api/patients/:id
 * @access  Private (Patient, Doctor)
 */
export const updatePatient = async (req: Request, res: Response): Promise<Response> => {
  try {
    const patientId = req.params.id;
    const updateData = req.body;
    
    // Find and update patient
    const patient = await Patient.findOneAndUpdate(
      { user: patientId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    return res.status(200).json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Upload a document for a patient
 * @route   POST /api/patients/:id/documents
 * @access  Private (Patient, Doctor)
 */
export const uploadDocument = async (req: Request, res: Response): Promise<Response> => {
  try {
    const patientId = req.params.id;
    const { type, title, description, tags } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Create document
    const document = new Document({
      patientId,
      type,
      title,
      description,
      fileUrl: `/uploads/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: req.user?.id,
      doctorId: req.user?.role === 'doctor' ? req.user?.id : undefined,
      tags: tags ? tags.split(',') : [],
    });
    
    await document.save();
    
    return res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all documents for a patient
 * @route   GET /api/patients/:id/documents
 * @access  Private (Patient, Doctor)
 */
export const getDocuments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const patientId = req.params.id;
    
    const documents = await Document.find({ patientId })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name');
    
    return res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get AI health summary for a patient
 * @route   GET /api/patients/:id/ai-summary
 * @access  Private (Patient, Doctor)
 */
export const getAIHealthSummary = async (req: Request, res: Response): Promise<Response> => {
  try {
    const patientId = req.params.id;
    
    // Find the most recent summary
    const summary = await AIHealthSummary.findOne({ patientId })
      .sort({ createdAt: -1 })
      .populate('documentSources');
    
    if (!summary) {
      return res.status(404).json({ 
        message: 'No health summary found for this patient' 
      });
    }
    
    return res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching AI health summary:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};