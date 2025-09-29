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

export default function AIHealthSummaryPage() {
  const [aiSummary, setAiSummary] = useState<AIHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [historicalSummaries, setHistoricalSummaries] = useState<AIHealthSummary[]>([]);

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockSummary: AIHealthSummary = {
      id: '1',
      patientId: 'patient-1',
      summary: 'Your recent health data shows stable blood pressure and cholesterol levels. Your medication adherence is excellent, and your lifestyle modifications are showing positive results. Continue with your current treatment plan and maintain regular exercise routine.',
      riskFactors: [
        'Family history of diabetes',
        'Sedentary lifestyle (improving)',
        'Previous high cholesterol',
        'Age-related cardiovascular risk'
      ],
      recommendations: [
        'Continue current blood pressure medication as prescribed',
        'Increase physical activity to 150 minutes per week',
        'Schedule follow-up appointment in 3 months',
        'Monitor blood sugar levels monthly',
        'Maintain low-sodium diet',
        'Consider stress management techniques'
      ],
      generatedAt: '2024-01-15T09:00:00Z',
      confidence: 0.87,
    };

    const mockHistorical: AIHealthSummary[] = [
      {
        id: '2',
        patientId: 'patient-1',
        summary: 'Previous analysis showed elevated cholesterol levels requiring medication adjustment. Blood pressure was well-controlled with current treatment.',
        riskFactors: ['High cholesterol', 'Family history of diabetes'],
        recommendations: ['Start statin therapy', 'Dietary modifications'],
        generatedAt: '2023-12-15T10:00:00Z',
        confidence: 0.82,
      },
      {
        id: '3',
        patientId: 'patient-1',
        summary: 'Initial assessment indicated need for lifestyle modifications and regular monitoring of cardiovascular health markers.',
        riskFactors: ['Family history of diabetes', 'Sedentary lifestyle'],
        recommendations: ['Begin exercise program', 'Dietary counseling'],
        generatedAt: '2023-11-01T14:30:00Z',
        confidence: 0.79,
      },
    ];

    setTimeout(() => {
      setAiSummary(mockSummary);
      setHistoricalSummaries(mockHistorical);
      setLoading(false);
    }, 1000);
  }, []);

  const generateNewSummary = async () => {
    setGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const newSummary: AIHealthSummary = {
        id: Math.random().toString(36).substr(2, 9),
        patientId: 'patient-1',
        summary: 'Updated analysis based on latest medical data shows continued improvement in your health metrics. Your blood pressure remains stable, and cholesterol levels are within target range. Your medication adherence and lifestyle changes are contributing to positive health outcomes.',
        riskFactors: [
          'Family history of diabetes (monitored)',
          'Previous high cholesterol (controlled)',
          'Age-related cardiovascular risk (managed)'
        ],
        recommendations: [
          'Continue current medication regimen',
          'Maintain regular exercise routine',
          'Schedule next appointment in 2 months',
          'Continue monitoring blood pressure weekly',
          'Keep dietary modifications in place'
        ],
        generatedAt: new Date().toISOString(),
        confidence: 0.91,
      };
      
      setAiSummary(newSummary);
      setGenerating(false);
    }, 3000);
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

            {/* Health Metrics */}
            <Card title="Health Metrics Overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-red-900">120/80</h3>
                  <p className="text-red-700">Blood Pressure</p>
                  <span className="text-xs text-green-600">✓ Normal</span>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-blue-900">180</h3>
                  <p className="text-blue-700">Cholesterol</p>
                  <span className="text-xs text-green-600">✓ Good</span>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-green-900">5.2</h3>
                  <p className="text-green-700">HbA1c</p>
                  <span className="text-xs text-green-600">✓ Controlled</span>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-purple-900">85%</h3>
                  <p className="text-purple-700">Health Score</p>
                  <span className="text-xs text-green-600">↑ Improving</span>
                </div>
              </div>
            </Card>

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

        {/* AI Insights */}
        <Card title="AI Insights & Trends">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Positive Trends</h4>
              </div>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Blood pressure consistently within normal range</li>
                <li>• Improved medication adherence</li>
                <li>• Increased physical activity levels</li>
                <li>• Better dietary compliance</li>
              </ul>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">Areas to Monitor</h4>
              </div>
              <ul className="space-y-1 text-sm text-yellow-800">
                <li>• Continue monitoring cholesterol levels</li>
                <li>• Maintain regular exercise routine</li>
                <li>• Schedule follow-up appointments</li>
                <li>• Monitor stress levels</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
