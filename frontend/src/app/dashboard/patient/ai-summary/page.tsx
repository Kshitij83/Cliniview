'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AIHealthChatbot from '@/components/chatbot/AIHealthChatbot';

/**
 * AI Health Summary page with Chatbot Interface
 * Provides comprehensive health analysis through AI conversation
 */
export default function AIHealthSummaryPage() {
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI Health Summary</h1>
          <p className="text-gray-600 mt-1">
            Chat with your AI health assistant for personalized insights and medical guidance.
          </p>
        </div>

        {/* Chatbot Container */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-0">
          <AIHealthChatbot />
        </div>
      </div>
    </DashboardLayout>
  );
}
