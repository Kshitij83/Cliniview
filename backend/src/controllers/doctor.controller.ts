import { Request, Response } from 'express';
import Doctor from '../models/doctor.model';
import Patient from '../models/patient.model';
import DiagnosticNote from '../models/diagnosticNote.model';

/**
 * Get doctor profile by user ID
 * @route   GET /api/doctors/:id
 * @access  Private
 */
export const getDoctor = async (req: Request, res: Response): Promise<Response> => {
  try {
    const doctorId = req.params.id;
    
    const doctor = await Doctor.findOne({ user: doctorId }).populate('user');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    return res.status(200).json(doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update doctor profile
 * @route   PUT /api/doctors/:id
 * @access  Private (Doctor only)
 */
export const updateDoctor = async (req: Request, res: Response): Promise<Response> => {
  try {
    const doctorId = req.params.id;
    const updateData = req.body;
    
    // Find and update doctor
    const doctor = await Doctor.findOneAndUpdate(
      { user: doctorId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    return res.status(200).json(doctor);
  } catch (error) {
    console.error('Error updating doctor:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get list of patients associated with a doctor
 * @route   GET /api/doctors/:id/patients
 * @access  Private (Doctor only)
 */
export const getPatients = async (req: Request, res: Response): Promise<Response> => {
  try {
    const doctorId = req.params.id;
    
    // Get doctor
    const doctor = await Doctor.findOne({ user: doctorId });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Get patients assigned to doctor
    const patients = await Patient.find({
      'assignedDoctors.doctor': doctor._id
    }).populate('user');
    
    return res.status(200).json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Add a diagnostic note for a patient
 * @route   POST /api/doctors/patients/:id/diagnostic-notes
 * @access  Private (Doctor only)
 */
export const addDiagnosticNote = async (req: Request, res: Response): Promise<Response> => {
  try {
    const patientId = req.params.id;
    const {
      diagnosis,
      symptoms,
      assessment,
      prescription,
      recommendedTests,
      followUpDate,
      notes,
      attachments
    } = req.body;
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Create diagnostic note
    const diagnosticNote = new DiagnosticNote({
      patientId,
      doctorId: req.user?.id,
      diagnosis,
      symptoms,
      assessment,
      prescription,
      recommendedTests,
      followUpDate,
      notes,
      attachments
    });
    
    await diagnosticNote.save();
    
    return res.status(201).json(diagnosticNote);
  } catch (error) {
    console.error('Error adding diagnostic note:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};