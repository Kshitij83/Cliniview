'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import { setTokenInStorage } from '@/lib/auth';
import { 
  Users, 
  FileText, 
  User,
  Stethoscope,
  MessageCircle
} from 'lucide-react';

// Simplified types
interface Patient {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  phone: string;
}

interface Document {
  id: string;
  patientId: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
  hasComments: boolean;
}

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
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

    // Mock data - in real app, fetch from API
    const mockPatients: Patient[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@email.com',
        dateOfBirth: '1985-03-15',
        phone: '+1 (555) 123-4567',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        dateOfBirth: '1990-07-22',
        phone: '+1 (555) 234-5678',
      },
    ];

    const mockDocuments: Document[] = [
      {
        id: '1',
        patientId: '1',
        title: 'Blood Test Results',
        description: 'Complete blood count and lipid panel',
        fileUrl: '/documents/lab-report-1.pdf',
        fileName: 'lab-report-1.pdf',
        createdAt: new Date().toISOString(),
        hasComments: true
      },
      {
        id: '2',
        patientId: '2',
        title: 'X-Ray Report',
        description: 'Chest X-ray showing mild pneumonia',
        fileUrl: '/documents/xray.pdf',
        fileName: 'xray.pdf',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        hasComments: false
      },
    ];

    setTimeout(() => {
      setPatients(mockPatients);
      setRecentDocuments(mockDocuments);
      setLoading(false);
    }, 500);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewPatientRecords = (patientId: string) => {
    router.push(`/dashboard/doctor/patients/${patientId}`);
  };

  const handleViewDocument = (documentId: string) => {
    router.push(`/dashboard/doctor/documents/${documentId}`);
  };

  const handleAddComments = (documentId: string) => {
    router.push(`/dashboard/doctor/documents/${documentId}/comments`);
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
            title="Total Patients"
            value={patients.length}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Medical Documents"
            value={recentDocuments.length}
            icon={FileText}
            color="green"
          />
        </div>

        {/* My Patients */}
        <Card
          title="My Patients"
          subtitle="Patients whose documents you can review"
        >
          <div className="space-y-4">
            {patients.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{patient.name}</h4>
                    <p className="text-sm text-gray-600">{patient.email}</p>
                    <p className="text-xs text-gray-500">
                      DOB: {formatDate(patient.dateOfBirth)} • Phone: {patient.phone}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewPatientRecords(patient.id)}
                >
                  View Records
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Patient Documents */}
        <Card
          title="Recent Patient Documents"
          subtitle="Medical reports uploaded by patients"
        >
          <div className="space-y-4">
            {recentDocuments.map((doc) => {
              const patient = patients.find(p => p.id === doc.patientId);
              return (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center">
                        {doc.title}
                        {doc.hasComments && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Commented
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                      <p className="text-xs text-gray-500">
                        Patient: {patient?.name} • Uploaded: {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDocument(doc.id)}
                    >
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddComments(doc.id)}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {doc.hasComments ? 'Edit Comment' : 'Add Comment'}
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {recentDocuments.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No patient documents available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Users className="w-6 h-6 mb-2" />
              View All Patients
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Stethoscope className="w-6 h-6 mb-2" />
              Add Medical Comments
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
