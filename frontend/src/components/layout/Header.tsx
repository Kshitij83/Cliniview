'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, User, Settings, LogOut } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleColor = () => {
    switch (user?.role) {
      case 'patient':
        return 'bg-blue-100 text-blue-600';
      case 'doctor':
        return 'bg-green-100 text-green-600';
      case 'insurance':
        return 'bg-purple-100 text-purple-600';
      case 'admin':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-gray-900">
              {user?.role === 'patient' && 'Patient Dashboard'}
              {user?.role === 'doctor' && 'Doctor Dashboard'}
              {user?.role === 'insurance' && 'Insurance Dashboard'}
              {user?.role === 'admin' && 'Admin Dashboard'}
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <User className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor()}`}>
                  {user?.role}
                </span>
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </button>
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </button>
                <hr className="my-1" />
                <button
                  onClick={logout}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
