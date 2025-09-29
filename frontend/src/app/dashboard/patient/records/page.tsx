'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  User,
  Stethoscope,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { MedicalDocument } from '@/types';

export default function MedicalRecordsPage() {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockDocuments: MedicalDocument[] = [
      {
        id: '1',
        patientId: 'patient-1',
        type: 'prescription',
        title: 'Blood Pressure Medication',
        description: 'Prescribed by Dr. Smith for hypertension management',
        fileUrl: '/documents/prescription-1.pdf',
        fileName: 'prescription-1.pdf',
        fileSize: 1024000,
        uploadedAt: '2024-01-15T10:30:00Z',
        doctorId: 'doctor-1',
      },
      {
        id: '2',
        patientId: 'patient-1',
        type: 'lab_report',
        title: 'Blood Test Results',
        description: 'Complete blood count and lipid panel',
        fileUrl: '/documents/lab-report-1.pdf',
        fileName: 'lab-report-1.pdf',
        fileSize: 2048000,
        uploadedAt: '2024-01-10T14:20:00Z',
      },
      {
        id: '3',
        patientId: 'patient-1',
        type: 'medical_history',
        title: 'Annual Physical Exam',
        description: 'Comprehensive health assessment and screening',
        fileUrl: '/documents/physical-exam-2024.pdf',
        fileName: 'physical-exam-2024.pdf',
        fileSize: 1536000,
        uploadedAt: '2024-01-05T09:15:00Z',
        doctorId: 'doctor-2',
      },
      {
        id: '4',
        patientId: 'patient-1',
        type: 'lab_report',
        title: 'Diabetes Screening',
        description: 'HbA1c and glucose tolerance test results',
        fileUrl: '/documents/diabetes-screening.pdf',
        fileName: 'diabetes-screening.pdf',
        fileSize: 1280000,
        uploadedAt: '2023-12-20T11:45:00Z',
      },
      {
        id: '5',
        patientId: 'patient-1',
        type: 'prescription',
        title: 'Cholesterol Medication',
        description: 'Statin therapy for cholesterol management',
        fileUrl: '/documents/cholesterol-rx.pdf',
        fileName: 'cholesterol-rx.pdf',
        fileSize: 896000,
        uploadedAt: '2023-12-15T16:30:00Z',
        doctorId: 'doctor-1',
      },
    ];

    setTimeout(() => {
      setDocuments(mockDocuments);
      setLoading(false);
    }, 1000);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'prescription':
        return <Stethoscope className="w-5 h-5 text-green-600" />;
      case 'lab_report':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'medical_history':
        return <User className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prescription':
        return 'bg-green-100 text-green-800';
      case 'lab_report':
        return 'bg-blue-100 text-blue-800';
      case 'medical_history':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || doc.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600 mt-1">
            View and manage your medical documents and health records.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="prescription">Prescriptions</option>
                <option value="lab_report">Lab Reports</option>
                <option value="medical_history">Medical History</option>
                <option value="other">Other</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="type-asc">Type A-Z</option>
                <option value="type-desc">Type Z-A</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getTypeIcon(doc.type)}
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(doc.type)}`}>
                      {doc.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {doc.title}
              </h3>
              
              {doc.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {doc.description}
                </p>
              )}

              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(doc.uploadedAt)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>{formatFileSize(doc.fileSize)}</span>
                </div>
                {doc.doctorId && (
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4" />
                    <span>Prescribed by doctor</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You haven\'t uploaded any medical documents yet.'
                }
              </p>
              <Button>
                Upload Document
              </Button>
            </div>
          </Card>
        )}

        {/* Summary Stats */}
        <Card title="Document Summary">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-blue-900">{documents.length}</h3>
              <p className="text-blue-700">Total Documents</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Stethoscope className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-green-900">
                {documents.filter(d => d.type === 'prescription').length}
              </h3>
              <p className="text-green-700">Prescriptions</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-purple-900">
                {documents.filter(d => d.type === 'lab_report').length}
              </h3>
              <p className="text-purple-700">Lab Reports</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <User className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-yellow-900">
                {documents.filter(d => d.type === 'medical_history').length}
              </h3>
              <p className="text-yellow-700">Medical History</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
