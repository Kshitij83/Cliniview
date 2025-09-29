'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadedFile {
  id: string;
  file: File;
  type: 'prescription' | 'lab_report' | 'medical_history' | 'other';
  title: string;
  description: string;
  preview?: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: 'other',
      title: file.name.replace(/\.[^/.]+$/, ''),
      description: '',
      progress: 0,
      status: 'uploading',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((uploadedFile) => {
      simulateUpload(uploadedFile.id);
    });

    toast.success(`${acceptedFiles.length} file(s) added successfully`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          const newProgress = Math.min(file.progress + Math.random() * 30, 100);
          if (newProgress >= 100) {
            clearInterval(interval);
            return { ...file, progress: 100, status: 'completed' as const };
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 200);
  };

  const updateFileDetails = (fileId: string, updates: Partial<UploadedFile>) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, ...updates } : file
    ));
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success('File removed');
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else {
      return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Upload className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Medical Documents</h1>
          <p className="text-gray-600 mt-1">
            Upload your medical records, prescriptions, lab reports, and other health documents.
          </p>
        </div>

        {/* Upload Area */}
        <Card title="Upload Documents">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </h3>
            <p className="text-gray-600 mb-4">
              or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, images (PNG, JPG, JPEG, GIF), and text files up to 10MB
            </p>
          </div>
        </Card>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Card title="Uploaded Files">
            <div className="space-y-4">
              {uploadedFiles.map((uploadedFile) => (
                <div key={uploadedFile.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {/* File Preview/Icon */}
                    <div className="flex-shrink-0">
                      {uploadedFile.preview ? (
                        <img
                          src={uploadedFile.preview}
                          alt={uploadedFile.file.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(uploadedFile.file)}
                        </div>
                      )}
                    </div>

                    {/* File Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {uploadedFile.file.name}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(uploadedFile.status)}
                          <button
                            onClick={() => removeFile(uploadedFile.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>

                      {/* Progress Bar */}
                      {uploadedFile.status === 'uploading' && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadedFile.progress}%` }}
                          ></div>
                        </div>
                      )}

                      {/* File Details Form */}
                      {uploadedFile.status === 'completed' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Document Type
                            </label>
                            <select
                              value={uploadedFile.type}
                              onChange={(e) => updateFileDetails(uploadedFile.id, { 
                                type: e.target.value as any 
                              })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="prescription">Prescription</option>
                              <option value="lab_report">Lab Report</option>
                              <option value="medical_history">Medical History</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={uploadedFile.title}
                              onChange={(e) => updateFileDetails(uploadedFile.id, { 
                                title: e.target.value 
                              })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="Enter document title"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description (Optional)
                            </label>
                            <textarea
                              value={uploadedFile.description}
                              onChange={(e) => updateFileDetails(uploadedFile.id, { 
                                description: e.target.value 
                              })}
                              rows={2}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="Enter document description"
                            />
                          </div>

                          <div className="flex items-center space-x-2 pt-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline">
                Cancel
              </Button>
              <Button>
                Save All Documents
              </Button>
            </div>
          </Card>
        )}

        {/* Upload Guidelines */}
        <Card title="Upload Guidelines">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Supported File Types</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• PDF documents (.pdf)</li>
                  <li>• Images (.png, .jpg, .jpeg, .gif)</li>
                  <li>• Text files (.txt)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">File Requirements</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Maximum file size: 10MB</li>
                  <li>• Clear, readable documents</li>
                  <li>• Original or high-quality scans</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Privacy & Security</h4>
              <p className="text-sm text-blue-800">
                All uploaded documents are encrypted and stored securely. Only authorized healthcare 
                providers and you can access these documents. We comply with HIPAA regulations 
                to protect your health information.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
