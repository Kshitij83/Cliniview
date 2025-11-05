'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Stethoscope, Brain, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react';

/**
 * Home page component
 * Landing page that redirects authenticated users to their dashboard
 * Shows marketing content for unauthenticated users
 */
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect to appropriate dashboard based on user role
      switch (user.role) {
        case 'patient':
          router.push('/dashboard/patient');
          break;
        case 'doctor':
          router.push('/dashboard/doctor');
          break;

        case 'admin':
          router.push('/dashboard/admin');
          break;
        default:
          router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
      <div className="text-center mb-12">
        <div className="mx-auto h-20 w-20 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4">
          <Stethoscope className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          <span className="text-indigo-600">CliniView</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Simple Online Hospital Platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        {/* Patient Card */}
        <div 
          onClick={() => router.push('/auth/login?role=patient')}
          className="bg-white rounded-xl shadow-lg p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-blue-500"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Sign in as Patient</h2>
          <p className="text-gray-600 text-center mb-6">
            Upload medical documents and access doctor's prescriptions
          </p>
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium">
            Continue as Patient
          </button>
        </div>

        {/* Doctor Card */}
        <div 
          onClick={() => router.push('/auth/login?role=doctor')}
          className="bg-white rounded-xl shadow-lg p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-green-500"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Stethoscope className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Sign in as Doctor</h2>
          <p className="text-gray-600 text-center mb-6">
            View patient reports and add prescriptions
          </p>
          <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium">
            Continue as Doctor
          </button>
        </div>
      </div>
      
      <footer className="mt-16 text-center text-gray-600">
        <p>&copy; 2024 CliniView. All rights reserved.</p>
      </footer>
    </div>
  );
}