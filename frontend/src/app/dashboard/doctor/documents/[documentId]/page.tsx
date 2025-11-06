'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  FileText, 
  Calendar, 
  ArrowLeft,
  Download,
  User,
  MessageSquare,
  CheckSquare,
  AlertTriangle,
  Upload,
  Plus
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Doctor document view page
 * Displays patient's medical document with options to upload prescription and add comments
 */

interface DiagnosticNote {
  id: string;
  documentId: string;
  doctorId: string;
  doctorName: string;
  content: string;
  findings: string;
  recommendations: string;
  createdAt: string;
  updatedAt: string;
}

interface Prescription {
  fileUrl: string;
  fileName: string;
  notes: string;
  uploadedAt: string;
  uploadedBy: {
    name: string;
  };
}

interface Document {
  _id?: string;
  id?: string;
  patientId?: {
    _id: string;
    user?: {
      name: string;
      email: string;
    };
  };
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileType?: string;
  createdAt: string;
  updatedAt?: string;
  prescriptions?: Prescription[];
}

export default function DoctorDocumentViewPage() {
  const params = useParams();
  const documentId = params.documentId as string;
  const router = useRouter();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [diagnosticNotes, setDiagnosticNotes] = useState<DiagnosticNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  
  // Prescription upload states
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Comment states
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commentFindings, setCommentFindings] = useState('');
  const [commentRecommendations, setCommentRecommendations] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [documentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getDocument(documentId);
      const doc = response.document || response;
      
      setDocument(doc);
      setViewerUrl(API_BASE.replace('/api', '') + doc.fileUrl);
      
      const notes = await apiClient.getDiagnosticNotes(documentId);
      setDiagnosticNotes(notes);
    } catch (err) {
      console.error('Error fetching document:', err);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPrescription = async () => {
    if (!prescriptionFile) {
      toast.error('Please select a file');
      return;
    }

    setUploadingPrescription(true);
    setUploadProgress(0);

    try {
      await apiClient.uploadPrescription(
        documentId,
        prescriptionFile,
        prescriptionNotes,
        (percent) => setUploadProgress(percent)
      );
      
      toast.success('Prescription uploaded successfully!');
      setShowPrescriptionForm(false);
      setPrescriptionFile(null);
      setPrescriptionNotes('');
      await fetchData();
    } catch (error: any) {
      console.error('Error uploading prescription:', error);
      toast.error(error.message || 'Failed to upload prescription');
    } finally {
      setUploadingPrescription(false);
      setUploadProgress(0);
    }
  };

  const handleSaveComment = async () => {
    if (!commentContent.trim()) {
      toast.error('Please enter comment content');
      return;
    }

    setSavingComment(true);

    try {
      await apiClient.saveDiagnosticNote({
        documentId,
        content: commentContent,
        findings: commentFindings,
        recommendations: commentRecommendations
      });

      toast.success('Comment saved successfully!');
      setShowCommentForm(false);
      setCommentContent('');
      setCommentFindings('');
      setCommentRecommendations('');
      
      const notes = await apiClient.getDiagnosticNotes(documentId);
      setDiagnosticNotes(notes);
    } catch (error: any) {
      console.error('Error saving comment:', error);
      toast.error(error.message || 'Failed to save comment');
    } finally {
      setSavingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!document) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Document Not Found</h3>
            <p className="text-gray-600 mb-4">
              The document you are looking for could not be found.
            </p>
            <Button onClick={() => router.push('/dashboard/doctor')}>
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  const patientName = document.patientId?.user?.name || 'Unknown Patient';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/doctor')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        {/* Document Information */}
        <Card title={document.title} subtitle={`Patient: ${patientName}`}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Patient: {patientName}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  Uploaded on {formatDate(document.createdAt)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  Filename: {document.fileName}
                </span>
              </div>
              
              {document.description && (
                <p className="text-gray-700 italic">
                  "{document.description}"
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const downloadUrl = API_BASE.replace('/api', '') + document.fileUrl;
                  const link = window.document.createElement('a');
                  link.href = downloadUrl;
                  link.download = document.fileName;
                  link.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowPrescriptionForm(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Prescription
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCommentForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Comment
              </Button>
            </div>
          </div>
        </Card>

        {/* Prescription Upload Form */}
        {showPrescriptionForm && (
          <Card title="Upload Prescription">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription File (PDF/Image) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                {prescriptionFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {prescriptionFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="Add any additional notes about this prescription..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {uploadingPrescription && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleUploadPrescription}
                  loading={uploadingPrescription}
                  disabled={!prescriptionFile}
                >
                  Upload Prescription
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPrescriptionForm(false);
                    setPrescriptionFile(null);
                    setPrescriptionNotes('');
                  }}
                  disabled={uploadingPrescription}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Comment Form */}
        {showCommentForm && (
          <Card title="Add Medical Comment">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment *
                </label>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Enter your medical assessment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Findings
                </label>
                <textarea
                  value={commentFindings}
                  onChange={(e) => setCommentFindings(e.target.value)}
                  placeholder="Document your clinical findings..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendations
                </label>
                <textarea
                  value={commentRecommendations}
                  onChange={(e) => setCommentRecommendations(e.target.value)}
                  placeholder="Provide treatment recommendations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveComment}
                  loading={savingComment}
                >
                  Save Comment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommentForm(false);
                    setCommentContent('');
                    setCommentFindings('');
                    setCommentRecommendations('');
                  }}
                  disabled={savingComment}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
        
        {/* Document Preview */}
        <Card title="Document Preview">
          <div className="bg-gray-100 rounded-lg border border-gray-300 overflow-hidden">
            {viewerUrl ? (
              <iframe
                src={viewerUrl}
                className="w-full h-[600px]"
                title={document.title}
              />
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 mb-2">Document Preview Not Available</p>
                <p className="text-sm text-gray-500">
                  Please download the document to view it
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Prescriptions */}
        {document.prescriptions && document.prescriptions.length > 0 && (
          <Card title="Prescriptions" subtitle="Prescriptions uploaded for this document">
            <div className="space-y-4">
              {document.prescriptions.map((prescription, index) => (
                <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium text-gray-900">{prescription.fileName}</h4>
                      </div>
                      {prescription.notes && (
                        <p className="text-sm text-gray-700 mb-2">{prescription.notes}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Uploaded by {prescription.uploadedBy?.name || 'Doctor'} on {formatDate(prescription.uploadedAt)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = window.document.createElement('a');
                        link.href = API_BASE.replace('/api', '') + prescription.fileUrl;
                        link.download = prescription.fileName;
                        link.click();
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {/* Medical Comments */}
        <Card 
          title="Medical Comments" 
          subtitle="Diagnostic notes and assessments"
        >
          {diagnosticNotes.length > 0 ? (
            <div className="space-y-6">
              {diagnosticNotes.map((note) => (
                <div key={note.id} className="space-y-4 pb-6 border-b border-gray-200 last:border-0">
                  {/* Note Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <User className="w-6 h-6 text-blue-500 mr-2" />
                      <div>
                        <h4 className="font-medium text-gray-900">{note.doctorName}</h4>
                        <p className="text-sm text-gray-500">
                          {formatDate(note.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Note Content */}
                  {note.content && (
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 leading-relaxed">
                      <p>{note.content}</p>
                    </div>
                  )}
                  
                  {/* Findings */}
                  {note.findings && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />
                        Findings
                      </h5>
                      <div className="bg-amber-50 rounded-lg p-3 text-gray-700">
                        <pre className="whitespace-pre-wrap text-sm font-sans">{note.findings}</pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  {note.recommendations && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <CheckSquare className="w-4 h-4 mr-1 text-green-500" />
                        Recommendations
                      </h5>
                      <div className="bg-green-50 rounded-lg p-3 text-gray-700">
                        <pre className="whitespace-pre-wrap text-sm font-sans">{note.recommendations}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Comments Yet</h3>
              <p className="text-gray-600 mb-4">
                Add your medical assessment and recommendations for this document.
              </p>
              <Button onClick={() => setShowCommentForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Medical Comment
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}