import { Request, Response } from 'express';
import DiagnosticNote from '../models/diagnosticNote.model';
import Doctor from '../models/doctor.model';
import Document from '../models/document.model';

// @desc    Add a comment to a document
// @route   POST /api/notes
// @access  Private (Doctor only)
export const addComment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { documentId, comments } = req.body;
    
    if (!documentId || !comments) {
      return res.status(400).json({ 
        message: 'Document ID and comments are required' 
      });
    }
    
    // Verify the document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Get doctor ID based on user ID
    const doctor = await Doctor.findOne({ user: req.user!.id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    
    // Create diagnostic note
    const diagnosticNote = await DiagnosticNote.create({
      patientId: document.patientId,
      doctorId: doctor.id,
      documentId,
      comments
    });
    
    // Populate the doctor details
    await diagnosticNote.populate({
      path: 'doctorId',
      populate: {
        path: 'user',
        select: 'name'
      }
    });
    
    return res.status(201).json({
      success: true,
      data: diagnosticNote
    });
    
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all comments for a document
// @route   GET /api/notes/document/:documentId
// @access  Private
export const getDocumentComments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const documentId = req.params.documentId;
    
    // Verify the document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // If patient, verify they own the document
    if (req.user?.role === 'patient') {
      const patient = await Document.findOne({ 
        _id: documentId,
        patientId: req.user.id
      });
      
      if (!patient) {
        return res.status(403).json({ 
          message: 'Not authorized to access these comments' 
        });
      }
    }
    
    const comments = await DiagnosticNote.find({ documentId })
      .populate({
        path: 'doctorId',
        populate: {
          path: 'user',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
      
    return res.status(200).json(comments);
    
  } catch (error) {
    console.error('Error fetching document comments:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};