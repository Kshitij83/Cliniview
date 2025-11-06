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
  Clock
} from 'lucide-react';
import { apiClient } from '@/lib/api';

/**
 * Patient document view page
 * Displays a specific medical document with diagnostic notes from doctors
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Represents a diagnostic note on a patient's document
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
  patientId: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  createdAt: string;
  updatedAt: string;
  prescriptions?: Prescription[];
}

export default function PatientDocumentViewPage() {
  const params = useParams();
  const documentId = params.documentId as string;
  const router = useRouter();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [diagnosticNotes, setDiagnosticNotes] = useState<DiagnosticNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch document details using dedicated endpoint
        const response = await apiClient.getDocument(documentId);
        const doc = response.document || response;
        
        if (doc) {
          setDocument(doc);
          setViewerUrl(API_BASE.replace('/api', '') + doc.fileUrl);
        }
        
        // Fetch diagnostic notes
        try {
          const notes = await apiClient.getDiagnosticNotes(documentId);
          setDiagnosticNotes(notes);
        } catch (noteError) {
          console.log('No diagnostic notes yet:', noteError);
          setDiagnosticNotes([]);
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [documentId]);

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
            <Button onClick={() => router.push('/dashboard/patient')}>
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/patient')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        {/* Document Information */}
        <Card title={document.title} subtitle="Medical Document Details">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
            <div className="space-y-3">
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
            
            <div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (document?.fileUrl) {
                    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                    const downloadUrl = API_BASE.replace('/api', '') + document.fileUrl;
                    const link = window.document.createElement('a');
                    link.href = downloadUrl;
                    link.download = document.fileName;
                    link.click();
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Card>
        
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

        {/* Prescriptions from Doctors */}
        {document.prescriptions && document.prescriptions.length > 0 && (
          <Card title="Prescriptions" subtitle="Prescriptions from your healthcare provider">
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
                        Prescribed by {prescription.uploadedBy?.name || 'Doctor'} on {formatDate(prescription.uploadedAt)}
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
        
        {/* Doctor's Comments */}
        <Card 
          title="Doctor's Assessment" 
          subtitle="Medical review from your healthcare provider"
        >
          {diagnosticNotes.length > 0 ? (
            <div className="space-y-6">
              {diagnosticNotes.map((note) => (
                <div key={note.id} className="space-y-4">
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
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Doctor Comments Yet</h3>
              <p className="text-gray-600">
                Your document is waiting to be reviewed by a healthcare provider.
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-amber-600">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Assessment pending
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}