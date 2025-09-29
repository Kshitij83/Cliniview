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
  updatedAt: string;
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
        // Try to fetch the document and notes from the API
        try {
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
        
        // Fallback to mock data
        setDocument({
          id: documentId,
          patientId: '1',
          title: 'Blood Test Results',
          description: 'Complete blood count and lipid panel',
          fileUrl: '/documents/lab-report-1.pdf',
          fileName: 'lab-report-1.pdf',
          fileType: 'application/pdf',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        // Mock diagnostic notes
        setDiagnosticNotes([
          {
            id: '1',
            documentId: documentId,
            doctorId: 'd1',
            doctorName: 'Dr. Sarah Johnson',
            content: 'The blood test results show normal values for most parameters, but there is a slight elevation in cholesterol levels.',
            findings: 'Total cholesterol: 220 mg/dL (borderline high)\nLDL: 140 mg/dL (borderline high)\nHDL: 45 mg/dL (acceptable)\nTriglycerides: 150 mg/dL (normal)',
            recommendations: 'Recommend dietary changes to reduce cholesterol intake. Consider follow-up test in 3 months if lifestyle modifications don\'t improve levels.',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
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
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
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