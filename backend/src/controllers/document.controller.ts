import { Request, Response } from 'express';
import Document from '../models/document.model';
import Patient from '../models/patient.model';
import DiagnosticNote from '../models/diagnosticNote.model';
import fs from 'fs';
import path from 'path';

/**
 * Get a specific document by ID with comments
 * @route   GET /api/documents/:id
 * @access  Private
 */
export const getDocument = async (req: Request, res: Response): Promise<Response> => {
  try {
    const documentId = req.params.id;
    
    const document = await Document.findById(documentId)
      .populate('patientId', 'user')
      .populate('uploadedBy', 'name role')
      .populate('prescriptions.uploadedBy', 'name role');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Get any comments for this document
    const comments = await DiagnosticNote.find({ documentId: documentId })
      .populate('doctorId', 'user')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({ 
      document,
      comments
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Upload a new medical document
 * @route   POST /api/documents
 * @access  Private (Patient)
 */
export const uploadDocument = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Get patient ID based on user ID - create if doesn't exist
    let patient = await Patient.findOne({ user: req.user!.id });
    
    if (!patient) {
      // Create minimal patient profile if it doesn't exist
      console.log('Creating patient profile for user:', req.user!.id);
      patient = await Patient.create({
        user: req.user!.id,
      });
    }
    
    // Create document
    const document = await Document.create({
      patientId: patient._id,
      type: 'medical_report',
      title: req.body.title || 'Medical Report',
      description: req.body.description || '',
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user!.id
    });
    
    return res.status(201).json({
      success: true,
      data: document
    });
    
  } catch (error) {
    console.error('Error uploading document:', error);
    
    // Delete file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all documents for a patient
 * @route   GET /api/documents/patient/:patientId OR /api/documents/my-documents
 * @access  Private (Patient, Doctor)
 */
export const getPatientDocuments = async (req: Request, res: Response): Promise<Response> => {
  try {
    let patientId = req.params.patientId;
    
    // If no patientId provided (my-documents route), get from current user
    if (!patientId && req.user?.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      
      if (!patient) {
        // Return empty array if patient profile doesn't exist yet
        return res.status(200).json([]);
      }
      
      patientId = (patient as any)._id.toString();
    }
    
    // If the user is a patient accessing someone else's documents
    if (req.user?.role === 'patient' && patientId) {
      const patient = await Patient.findOne({ user: req.user.id });
      
      if (!patient || (patient as any)._id.toString() !== patientId) {
        return res.status(403).json({ message: 'Not authorized to access these documents' });
      }
    }
    
    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID required' });
    }
    
    const documents = await Document.find({ patientId })
      .sort({ createdAt: -1 });
      
    return res.status(200).json(documents);
    
  } catch (error) {
    console.error('Error fetching patient documents:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a document by ID
 * @route   DELETE /api/documents/:id
 * @access  Private (Patient, Doctor)
 */
export const deleteDocument = async (req: Request, res: Response): Promise<Response> => {
  try {
    const documentId = req.params.id;
    
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has permission to delete
    if (
      req.user?.role === 'patient' && 
      document.patientId.toString() !== req.user.id &&
      document.uploadedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ 
        message: 'Not authorized to delete this document' 
      });
    }
    
    // Delete file from filesystem
    try {
      const fileUrl = document.fileUrl;
      const filePath = path.join(__dirname, '..', '..', fileUrl);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      // Continue with deletion from DB even if file deletion fails
    }
    
    // Delete document from database
    await document.deleteOne();
    
    // Also delete any diagnostic notes related to this document
    await DiagnosticNote.deleteMany({ documentId: documentId });
    
    return res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all documents from all patients (for doctors)
 * @route   GET /api/documents/all
 * @access  Private (Doctor only)
 */
export const getAllDocuments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const documents = await Document.find()
      .populate('patientId')
      .populate('uploadedBy', 'name email')
      .populate({
        path: 'patientId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });
    
    return res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching all documents:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Upload prescription for a document
 * @route   POST /api/documents/:id/prescription
 * @access  Private (Doctor only)
 */
export const uploadPrescription = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const documentId = req.params.id;
    const { notes } = req.body;

    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Add prescription to document
    document.prescriptions.push({
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      uploadedBy: req.user!.id as any,
      notes: notes || '',
      uploadedAt: new Date()
    });

    await document.save();

    return res.status(200).json({
      success: true,
      message: 'Prescription uploaded successfully',
      data: document
    });

  } catch (error) {
    console.error('Error uploading prescription:', error);
    
    // Delete file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ message: 'Server error' });
  }
};