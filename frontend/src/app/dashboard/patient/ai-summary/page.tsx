'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Calendar,
  Activity,
  Heart,
  Zap,
  Shield,
  Target,
  BarChart3
} from 'lucide-react';
import { AIHealthSummary } from '@/types';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

/**
 * AI Health Summary page
 * Displays AI-generated health analysis for patient
 * Shows risk factors, insights, and recommendations
 */
export default function AIHealthSummaryPage() {
  const [aiSummary, setAiSummary] = useState<AIHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [historicalSummaries, setHistoricalSummaries] = useState<AIHealthSummary[]>([]);

  useEffect(() => {
    fetchAISummary();
  }, []);

  const fetchAISummary = async () => {
    setLoading(true);
    try {
      // TODO: Implement real API call
      // const summary = await apiClient.getAIHealthSummary();
      // setAiSummary(summary);
      
      // For now, set to null to show empty state
      setAiSummary(null);
      setHistoricalSummaries([]);
    } catch (error) {
      console.error('Error fetching AI summary:', error);
      toast.error('Failed to load AI health summary');
    } finally {
      setLoading(false);
    }
  };

  const generateNewSummary = async () => {
    setGenerating(true);
    
    try {
      // TODO: Implement real API call to generate summary
      // const newSummary = await apiClient.generateAIHealthSummary();
      // setAiSummary(newSummary);
      // toast.success('AI Health Summary generated successfully!');
      
      toast.error('AI generation not yet implemented. Coming soon!');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate AI health summary');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="w-5 h-5" />;
    if (confidence >= 0.6) return <AlertTriangle className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Health Summary</h1>
            <p className="text-gray-600 mt-1">
              AI-powered analysis of your health data and personalized recommendations.
            </p>
          </div>
          <Button 
            onClick={generateNewSummary} 
            disabled={generating}
            loading={generating}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'Generate New Summary'}
          </Button>
        </div>

        {aiSummary ? (
          <>
            {/* Current Summary */}
            <Card
              title="Current Health Summary"
              subtitle={`Generated on ${formatDate(aiSummary.generatedAt)}`}
              actions={
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(aiSummary.confidence)}`}>
                    {getConfidenceIcon(aiSummary.confidence)}
                    <span className="ml-1">{Math.round(aiSummary.confidence * 100)}% Confidence</span>
                  </span>
                </div>
              }
            >
              <div className="space-y-6">
                {/* Summary Text */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Brain className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
                      <p className="text-blue-800 leading-relaxed">{aiSummary.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                    Risk Factors
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiSummary.riskFactors.map((risk, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-orange-800 text-sm">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Target className="w-5 h-5 text-green-500 mr-2" />
                    Recommendations
                  </h4>
                  <div className="space-y-3">
                    {aiSummary.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-green-800 text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Health Metrics - Coming Soon */}
            {/* TODO: Add health metrics from ML service integration */}

            {/* Historical Summaries */}
            <Card title="Historical Summaries">
              <div className="space-y-4">
                {historicalSummaries.map((summary) => (
                  <div key={summary.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        Summary from {formatDate(summary.generatedAt)}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(summary.confidence)}`}>
                        {Math.round(summary.confidence * 100)}% Confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{summary.summary}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{summary.riskFactors.length} risk factors</span>
                      <span>{summary.recommendations.length} recommendations</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <Card>
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Summary Available</h3>
              <p className="text-gray-600 mb-4">
                Generate your first AI health summary to get personalized insights and recommendations.
              </p>
              <Button onClick={generateNewSummary} loading={generating}>
                <Brain className="w-4 h-4 mr-2" />
                Generate Summary
              </Button>
            </div>
          </Card>
        )}

        {/* AI Insights - Coming Soon */}
        {/* TODO: Add AI-generated insights once ML service is integrated */}
      </div>
    </DashboardLayout>
  );
}
