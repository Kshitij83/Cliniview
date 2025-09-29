'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import { 
  FileText, 
  Upload, 
  Brain, 
  Bell, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Simplified types
interface Document {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  hasDoctorComments: boolean;
}

export default function PatientDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockDocuments: Document[] = [
      {
        id: '1',
        title: 'Blood Test Results',
        description: 'Complete blood count',
        fileUrl: '/documents/blood-test.pdf',
        fileName: 'blood-test.pdf',
        fileSize: 1024000,
        createdAt: new Date().toISOString(),
        hasDoctorComments: true
      },
      {
        id: '2',
        title: 'X-Ray Report',
        description: 'Chest X-ray',
        fileUrl: '/documents/xray.pdf',
        fileName: 'xray.pdf',
        fileSize: 2048000,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        hasDoctorComments: false
      },
    ];

    setTimeout(() => {
      setDocuments(mockDocuments);
      setLoading(false);
    }, 500);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleUploadClick = () => {
    router.push('/dashboard/patient/upload');
  };

  const handleSymptomCheckerClick = () => {
    router.push('/dashboard/patient/symptom-checker');
  };

  const handleViewDocument = (documentId: string) => {
    router.push(`/dashboard/patient/documents/${documentId}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Medical Documents"
            value={documents.length}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Documents with Comments"
            value={documents.filter(d => d.hasDoctorComments).length}
            icon={Bell}
            color="purple"
          />
        </div>

        {/* Medical Documents */}
        <Card
          title="Your Medical Documents"
          subtitle="View and manage your uploaded medical reports"
          actions={
            <Button variant="primary" size="sm" onClick={handleUploadClick}>
              <Upload className="w-4 h-4 mr-2" />
              Upload New
            </Button>
          }
        >
          {documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center">
                        {doc.title}
                        {doc.hasDoctorComments && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Has Comments
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.fileSize)} • Uploaded on {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewDocument(doc.id)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">You haven't uploaded any documents yet</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={handleUploadClick}>
                Upload Your First Document
              </Button>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex-col" onClick={handleUploadClick}>
              <Upload className="w-6 h-6 mb-2" />
              Upload Medical Report
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={handleSymptomCheckerClick}>
              <Brain className="w-6 h-6 mb-2" />
              Check Symptoms
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
