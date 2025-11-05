import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

/**
 * Application metadata for SEO
 */
export const metadata: Metadata = {
  title: 'Healthcare Platform - AI-Powered Centralized Healthcare',
  description: 'A comprehensive healthcare platform with AI-powered features for patients, doctors, and administrators.',
};

/**
 * Root layout component
 * Wraps the entire app with AuthProvider and applies global styles
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}