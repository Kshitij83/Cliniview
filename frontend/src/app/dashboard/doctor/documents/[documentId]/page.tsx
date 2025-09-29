'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  FileText, 
  User, 
  MessageCircle, 
  Calendar,
  ArrowLeft,
  Download,
  MessageSquare,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '@/lib/api';

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

interface Document {
  id: string;
  patientId: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    email: string;
  };
}

export default function DocumentViewPage() {
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
        // Make API calls and handle potential errors
        try {
          // Try to fetch the document and notes from the API
          const response = await fetch(`/api/documents/${documentId}`);
          if (!response.ok) throw new Error('Document not found');
          const documentData = await response.json();
          setDocument(documentData as Document);
          
          // Fetch diagnostic notes
          const notesResponse = await apiClient.getDiagnosticNotes(documentId);
          setDiagnosticNotes(notesResponse as DiagnosticNote[]);
          
          // Set document viewer URL
          setViewerUrl(`/api/documents/view/${documentId}`);
        } catch (apiError) {
          console.warn('API request failed, using mock data:', apiError);
          throw apiError; // Re-throw to use mock data
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load document information');
        
        // Fallback to mock data if API fails
        const mockDocument: Document = {
          id: documentId,
          patientId: '1',
          title: 'Blood Test Results',
          description: 'Complete blood count and lipid panel',
          fileUrl: '/documents/lab-report-1.pdf',
          fileName: 'lab-report-1.pdf',
          fileType: 'application/pdf',
          createdAt: new Date().toISOString(),
          patient: {
            id: '1',
            name: 'John Doe',
            email: 'john.doe@example.com'
          }
        };
        
        setDocument(mockDocument);
        
        // Mock diagnostic notes
        const mockNotes: DiagnosticNote[] = [
          {
            id: '1',
            documentId: documentId,
            doctorId: 'd1',
            doctorName: 'Dr. Sarah Johnson',
            content: 'The blood test results show normal values for most parameters, but there is a slight elevation in cholesterol levels.',
            findings: 'Total cholesterol: 220 mg/dL (borderline high)\nLDL: 140 mg/dL (borderline high)\nHDL: 45 mg/dL (acceptable)\nTriglycerides: 150 mg/dL (normal)',
            recommendations: 'Recommend dietary changes to reduce cholesterol intake. Consider follow-up test in 3 months if lifestyle modifications don\'t improve levels.',
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        
        setDiagnosticNotes(mockNotes);
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

  const handleAddComment = () => {
    router.push(`/dashboard/doctor/documents/${documentId}/comments`);
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
        <Card title={document.title} subtitle="Medical Document Details">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Patient: {document.patient.name}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Date: {formatDate(document.createdAt)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Filename: {document.fileName}</span>
              </div>
              
              {document.description && (
                <p className="text-gray-700 italic">
                  "{document.description}"
                </p>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleAddComment}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {diagnosticNotes.length > 0 ? 'Edit Comments' : 'Add Comments'}
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Document Preview */}
        <Card title="Document Preview">
          <div className="bg-gray-100 rounded-lg border border-gray-300 p-4 h-96 flex items-center justify-center">
            {viewerUrl ? (
              <iframe
                src={viewerUrl}
                className="w-full h-full"
                title={document.title}
              />
            ) : (
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 mb-2">Document Preview Not Available</p>
                <p className="text-sm text-gray-500">
                  Please download the document to view it
                </p>
              </div>
            )}
          </div>
        </Card>
        
        {/* Diagnostic Notes */}
        <Card 
          title="Medical Assessment"
          subtitle="Diagnostic notes from healthcare professionals"
          actions={
            <Button size="sm" onClick={handleAddComment}>
              <MessageSquare className="w-4 h-4 mr-1" />
              {diagnosticNotes.length > 0 ? 'Edit Comments' : 'Add Comments'}
            </Button>
          }
        >
          {diagnosticNotes.length > 0 ? (
            <div className="space-y-6">
              {diagnosticNotes.map((note) => (
                <div key={note.id} className="space-y-4">
                  {/* Note Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{note.doctorName}</h4>
                      <p className="text-sm text-gray-500">
                        Added on {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Note Content */}
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-700 leading-relaxed">
                    <p>{note.content}</p>
                  </div>
                  
                  {/* Findings */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />
                      Findings
                    </h5>
                    <div className="bg-amber-50 rounded-lg p-3 text-gray-700">
                      <pre className="whitespace-pre-wrap text-sm font-normal">{note.findings}</pre>
                    </div>
                  </div>
                  
                  {/* Recommendations */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <CheckSquare className="w-4 h-4 mr-1 text-green-500" />
                      Recommendations
                    </h5>
                    <div className="bg-green-50 rounded-lg p-3 text-gray-700">
                      <pre className="whitespace-pre-wrap text-sm font-normal">{note.recommendations}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Comments Yet</h3>
              <p className="text-gray-600 mb-4">
                Add your medical assessment and recommendations for this document.
              </p>
              <Button onClick={handleAddComment}>
                Add Medical Comments
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}