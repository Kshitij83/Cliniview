'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, removeTokenFromStorage, setTokenInStorage } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const tokenPayload = getCurrentUser();
        if (tokenPayload) {
          // In a real app, you'd fetch user details from the API
          // For now, we'll create a mock user from the token payload
          const mockUser: User = {
            id: tokenPayload.userId,
            email: tokenPayload.email,
            name: tokenPayload.email.split('@')[0],
            role: tokenPayload.role as any,
            createdAt: new Date().toISOString(),
          };
          setUser(mockUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        removeTokenFromStorage();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    try {
      const response:any = await apiClient.login(email, password, role);
      console.log('Login response:', response);
      
      setTokenInStorage(response.token);
      
      const mockUser: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        createdAt: response.user.createdAt,
      };
      
      setUser(mockUser);
      console.log('User set:', mockUser);
      
      // Redirect based on role
      const redirectPath = getRedirectPath(response.user.role);
      console.log('Redirecting to:', redirectPath);
      
      // Try router.push first
      router.push(redirectPath);
      
      // Fallback redirect using window.location if router.push doesn't work
      setTimeout(() => {
        if (window.location.pathname === '/auth/login') {
          console.log('Router.push failed, using window.location');
          window.location.href = redirectPath;
        }
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'patient':
        return '/dashboard/patient';
      case 'doctor':
        return '/dashboard/doctor';
      default:
        return '/dashboard';
    }
  };

  const register = async (userData: any) => {
    try {
      const response:any = await apiClient.register(userData);
      setTokenInStorage(response.token);
      
      const mockUser: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        createdAt: response.user.createdAt,
      };
      
      setUser(mockUser);
      
      // Redirect based on role
      const redirectPath = getRedirectPath(response.user.role);
      router.push(redirectPath);
      
      // Fallback redirect using window.location if router.push doesn't work
      setTimeout(() => {
        if (window.location.pathname === '/auth/register') {
          window.location.href = redirectPath;
        }
      }, 100);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    removeTokenFromStorage();
    setUser(null);
    // Redirect to home page on sign out
    router.push('/');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
