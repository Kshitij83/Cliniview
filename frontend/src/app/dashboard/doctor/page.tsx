'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import { setTokenInStorage } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  FileText, 
  User,
  MessageCircle
} from 'lucide-react';

/**
 * Doctor dashboard page
 * Displays all patient medical records for review
 */
interface Document {
  _id: string;
  patientId: {
    _id: string;
    user: {
      name: string;
      email: string;
    };
  };
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}

export default function DoctorDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if there's a token in the URL (from OAuth redirect)
    const token = searchParams?.get('token');
    if (token) {
      console.log("Found token in URL, saving to storage");
      setTokenInStorage(token);
      
      // Remove the token from URL using replace state
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    fetchAllDocuments();
  }, []);

  const fetchAllDocuments = async () => {
    setLoading(true);
    try {
      const docs = await apiClient.getAllDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load patient documents');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewDocument = (documentId: string) => {
    router.push(`/dashboard/doctor/documents/${documentId}`);
  };

  // Get unique patients from documents
  const uniquePatients = Array.from(
    new Map(
      documents
        .filter(doc => doc.patientId?.user)
        .map(doc => [doc.patientId._id, doc.patientId])
    ).values()
  );

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
            title="Total Patients"
            value={uniquePatients.length}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Medical Documents"
            value={documents.length}
            icon={FileText}
            color="green"
          />
        </div>

        {/* All Patient Medical Records */}
        <Card
          title="Patient Medical Records"
          subtitle="All medical documents uploaded by patients"
        >
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{doc.title}</h4>
                    <p className="text-sm text-gray-600">{doc.description || 'No description'}</p>
                    <p className="text-xs text-gray-500">
                      Patient: {doc.patientId?.user?.name || 'Unknown'} • Uploaded: {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDocument(doc._id)}
                  >
                    View & Add Comments
                  </Button>
                </div>
              </div>
            ))}
            
            {documents.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Patient Documents</h3>
                <p className="text-gray-500">Patient medical records will appear here once uploaded</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
