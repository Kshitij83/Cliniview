'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  FileText,
  Upload,
  Brain,
  Stethoscope,
  Users,
  Shield,
  Building2,
  Settings,
  LogOut,
  User,
  Activity,
  CreditCard,
  BarChart3,
  ClipboardList,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getNavigationItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'patient':
        return [
          { name: 'Dashboard', href: '/dashboard/patient', icon: Home },
          { name: 'Medical Records', href: '/dashboard/patient/records', icon: FileText },
          { name: 'Upload Documents', href: '/dashboard/patient/upload', icon: Upload },
          { name: 'AI Health Summary', href: '/dashboard/patient/ai-summary', icon: Brain },
          { name: 'Symptom Checker', href: '/dashboard/patient/symptom-checker', icon: Stethoscope },
        ];
      case 'doctor':
        return [
          { name: 'Dashboard', href: '/dashboard/doctor', icon: Home },
          { name: 'My Patients', href: '/dashboard/doctor/patients', icon: Users },
          { name: 'AI Summaries', href: '/dashboard/doctor/ai-summaries', icon: Brain },
          { name: 'Diagnostic Notes', href: '/dashboard/doctor/notes', icon: ClipboardList },
        ];

      case 'admin':
        return [
          { name: 'Dashboard', href: '/dashboard/admin', icon: Home },
          { name: 'Users', href: '/dashboard/admin/users', icon: Users },
          { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
          { name: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: Activity },
          { name: 'System Settings', href: '/dashboard/admin/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'patient':
        return <User className="w-5 h-5" />;
      case 'doctor':
        return <Stethoscope className="w-5 h-5" />;
      case 'admin':
        return <Shield className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'patient':
        return 'bg-blue-100 text-blue-600';
      case 'doctor':
        return 'bg-green-100 text-green-600';
      case 'admin':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">HealthCare</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <div className="flex items-center space-x-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor()}`}>
                      {getRoleIcon()}
                      <span className="ml-1 capitalize">{user.role}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
