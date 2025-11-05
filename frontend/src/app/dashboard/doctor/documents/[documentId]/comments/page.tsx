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
  Save,
  ArrowLeft,
  ExternalLink,
  Calendar,
  Download
} from 'lucide-react';
import { apiClient } from '@/lib/api';

/**
 * Doctor comments page for adding/editing diagnostic notes
 * Allows doctors to add findings and recommendations for a document
 */

/**
 * Represents a diagnostic note for a document
 */
interface DiagnosticNote {
  id?: string;
  documentId: string;
  doctorId: string;
  content: string;
  findings: string;
  recommendations: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Document {
  id: string;
  patientId: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    email: string;
  };
}

export default function DocumentCommentsPage() {
  const params = useParams();
  const documentId = params.documentId as string;
  const router = useRouter();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [note, setNote] = useState<DiagnosticNote>({
    documentId: documentId,
    doctorId: '', // Will be set from the API
    content: '',
    findings: '',
    recommendations: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try to get document and existing notes from the API
        try {
          // Fetch document data
          const response = await fetch(`/api/documents/${documentId}`);
          if (!response.ok) throw new Error('Document not found');
          const documentData = await response.json();
          setDocument(documentData as Document);
          
          // Check if there's an existing diagnostic note
          const notes = await apiClient.getDiagnosticNotes(documentId);
          if (Array.isArray(notes) && notes.length > 0) {
            // Use the first note (assuming one note per doctor per document)
            const existingNote = notes[0];
            setNote({
              id: existingNote.id,
              documentId: existingNote.documentId,
              doctorId: existingNote.doctorId,
              content: existingNote.content,
              findings: existingNote.findings,
              recommendations: existingNote.recommendations
            });
          }
        } catch (apiError) {
          console.warn('API request failed, using mock data:', apiError);
          
          // Mock document data as fallback
          const mockDocument: Document = {
            id: documentId,
            patientId: '1',
            title: 'Blood Test Results',
            description: 'Complete blood count and lipid panel',
            fileUrl: '/documents/lab-report-1.pdf',
            fileName: 'lab-report-1.pdf',
            createdAt: new Date().toISOString(),
            patient: {
              id: '1',
              name: 'John Doe',
              email: 'john.doe@example.com'
            }
          };
          
          setDocument(mockDocument);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load document information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [documentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!note.content || !note.findings || !note.recommendations) {
      setError('Please fill all required fields');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Save the diagnostic note via API
      await apiClient.saveDiagnosticNote(note);
      
      setSuccess(true);
      
      // After success, redirect back after a short delay
      setTimeout(() => {
        router.push('/dashboard/doctor');
      }, 1500);
      
    } catch (err) {
      console.error('Error saving diagnostic note:', err);
      setError('Failed to save your comments');
    } finally {
      setSaving(false);
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
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Document
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Diagnostic Notes Form */}
        <Card title="Medical Assessment" subtitle="Add your diagnostic comments and recommendations">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Medical Comments */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Medical Comments
              </label>
              <textarea 
                id="content"
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your overall assessment of the document..."
                value={note.content}
                onChange={(e) => setNote({...note, content: e.target.value})}
                required
              />
            </div>
            
            {/* Medical Findings */}
            <div>
              <label htmlFor="findings" className="block text-sm font-medium text-gray-700 mb-1">
                Findings
              </label>
              <textarea 
                id="findings"
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Document key findings from the medical report..."
                value={note.findings}
                onChange={(e) => setNote({...note, findings: e.target.value})}
                required
              />
            </div>
            
            {/* Recommendations */}
            <div>
              <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700 mb-1">
                Recommendations
              </label>
              <textarea 
                id="recommendations"
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your medical recommendations for the patient..."
                value={note.recommendations}
                onChange={(e) => setNote({...note, recommendations: e.target.value})}
                required
              />
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="text-red-700">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex">
                  <div className="text-green-700">
                    <p className="text-sm">
                      Your comments have been saved successfully! Redirecting...
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/doctor')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving || success}
                loading={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Comments'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}