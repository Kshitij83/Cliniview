'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Stethoscope, Brain, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CliniView</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/auth/login')}
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-indigo-600">CliniView</span>
            <br />
            Online Hospital
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A simple and effective platform for patients to upload medical reports and
            check symptoms, while doctors can review and comment on patients' documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/auth/register')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-medium text-lg flex items-center justify-center"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50 font-medium text-lg"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            CliniView Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Patient Features */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Patients</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Upload medical documents
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Check symptoms and get possible diagnoses
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  View doctor comments on your reports
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Access your medical records anytime
                </li>
              </ul>
            </div>

            {/* Doctor Features */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Doctors</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  View patient medical reports
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Add comments and diagnostic notes to reports
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Track patient document history
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Secure communication with patients
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-indigo-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Register now as a patient or doctor to start using our simple yet powerful online hospital platform.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/auth/register?role=patient')}
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-gray-100 font-medium text-lg"
              >
                Register as Patient
              </button>
              <button
                onClick={() => router.push('/auth/register?role=doctor')}
                className="bg-indigo-100 text-indigo-800 px-8 py-3 rounded-lg hover:bg-indigo-200 font-medium text-lg"
              >
                Register as Doctor
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 CliniView. All rights reserved.</p>
            <p className="mt-2 text-sm">
              Built with Next.js, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}