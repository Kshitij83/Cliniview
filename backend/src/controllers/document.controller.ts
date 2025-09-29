import { Request, Response } from 'express';
import Document from '../models/document.model';
import Patient from '../models/patient.model';
import DiagnosticNote from '../models/diagnosticNote.model';
import fs from 'fs';
import path from 'path';

// @desc    Get document
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req: Request, res: Response): Promise<Response> => {
  try {
    const documentId = req.params.id;
    
    const document = await Document.findById(documentId)
      .populate('patientId', 'user')
      .populate('uploadedBy', 'name role');
    
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

// @desc    Upload a document
// @route   POST /api/documents
// @access  Private (Patient)
export const uploadDocument = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Get patient ID based on user ID
    const patient = await Patient.findOne({ user: req.user!.id });
    
    if (!patient) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Patient profile not found' });
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

// @desc    Get all documents for a patient
// @route   GET /api/documents/patient/:patientId
// @access  Private (Patient, Doctor)
export const getPatientDocuments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const patientId = req.params.patientId;
    
    // If the user is a patient, they should only be able to view their own documents
    if (req.user?.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      
      if (!patient || patient.id.toString() !== patientId) {
        return res.status(403).json({ message: 'Not authorized to access these documents' });
      }
    }
    
    const documents = await Document.find({ patientId })
      .sort({ createdAt: -1 });
      
    return res.status(200).json(documents);
    
  } catch (error) {
    console.error('Error fetching patient documents:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Patient, Doctor)
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