'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTokenInStorage } from '@/lib/auth';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get token from query params
        const token = searchParams?.get('token');
        
        if (!token) {
          console.error('No token found in OAuth callback');
          router.push('/auth/login?error=no_token');
          return;
        }
        
        console.log('OAuth token received');
        
        // Save token
        setTokenInStorage(token);
        
        // Redirect to dashboard (token will be processed in AuthContext)
        window.location.href = '/';
      } catch (error) {
        console.error('OAuth callback error:', error);
        router.push('/auth/login?error=oauth_failed');
      }
    };

    handleOAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Signing you in...</h2>
        <p className="text-gray-600">Please wait while we complete the authentication process.</p>
      </div>
    </div>
  );
}