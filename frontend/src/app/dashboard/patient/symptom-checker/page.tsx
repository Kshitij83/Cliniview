'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Stethoscope, 
  Plus, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Brain,
  TrendingUp,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Symptom {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
}

interface SymptomCheckResult {
  id: string;
  symptoms: Symptom[];
  aiResponse: string;
  possibleConditions: string[];
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  createdAt: string;
}

const COMMON_SYMPTOMS = [
  'Headache', 'Fever', 'Cough', 'Sore throat', 'Nausea', 'Vomiting',
  'Diarrhea', 'Fatigue', 'Dizziness', 'Chest pain', 'Shortness of breath',
  'Abdominal pain', 'Back pain', 'Joint pain', 'Rash', 'Itching',
  'Swelling', 'Weight loss', 'Weight gain', 'Insomnia', 'Anxiety',
  'Depression', 'Memory problems', 'Vision changes', 'Hearing problems'
];

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [showSymptomSuggestions, setShowSymptomSuggestions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SymptomCheckResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const addSymptom = (symptomName: string) => {
    if (symptoms.some(s => s.name.toLowerCase() === symptomName.toLowerCase())) {
      toast.error('Symptom already added');
      return;
    }

    const newSymptomObj: Symptom = {
      id: Math.random().toString(36).substr(2, 9),
      name: symptomName,
      severity: 'mild',
      duration: '1 day',
    };

    setSymptoms(prev => [...prev, newSymptomObj]);
    setNewSymptom('');
    setShowSymptomSuggestions(false);
    toast.success('Symptom added');
  };

  const removeSymptom = (symptomId: string) => {
    setSymptoms(prev => prev.filter(s => s.id !== symptomId));
    toast.success('Symptom removed');
  };

  const updateSymptom = (symptomId: string, updates: Partial<Symptom>) => {
    setSymptoms(prev => prev.map(s => 
      s.id === symptomId ? { ...s, ...updates } : s
    ));
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      toast.error('Please add at least one symptom');
      return;
    }

    setIsAnalyzing(true);

    // Simulate AI analysis
    setTimeout(() => {
      const mockResult: SymptomCheckResult = {
        id: Math.random().toString(36).substr(2, 9),
        symptoms: [...symptoms],
        aiResponse: `Based on your symptoms (${symptoms.map(s => s.name).join(', ')}), our AI analysis suggests several possible conditions. The most likely scenarios include common viral infections, but some symptoms may warrant further medical evaluation.`,
        possibleConditions: [
          'Viral upper respiratory infection',
          'Seasonal allergies',
          'Stress-related symptoms',
          'Dehydration'
        ],
        severity: symptoms.some(s => s.severity === 'severe') ? 'high' : 
                 symptoms.some(s => s.severity === 'moderate') ? 'medium' : 'low',
        recommendations: [
          'Get adequate rest and stay hydrated',
          'Monitor symptoms for 24-48 hours',
          'Consider over-the-counter pain relief if needed',
          'Contact a healthcare provider if symptoms worsen',
          'Practice good hygiene to prevent spread'
        ],
        createdAt: new Date().toISOString(),
      };

      setResult(mockResult);
      setIsAnalyzing(false);
      toast.success('Analysis complete');
    }, 3000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredSymptoms = COMMON_SYMPTOMS.filter(symptom =>
    symptom.toLowerCase().includes(newSymptom.toLowerCase()) &&
    !symptoms.some(s => s.name.toLowerCase() === symptom.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Symptom Checker</h1>
          <p className="text-gray-600 mt-1">
            Describe your symptoms and get AI-powered health insights and recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Symptom Input */}
          <Card title="Add Your Symptoms">
            <div className="space-y-4">
              {/* Add Symptom Input */}
              <div className="relative">
                <input
                  type="text"
                  value={newSymptom}
                  onChange={(e) => {
                    setNewSymptom(e.target.value);
                    setShowSymptomSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSymptomSuggestions(newSymptom.length > 0)}
                  placeholder="Type a symptom..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                
                {/* Symptom Suggestions */}
                {showSymptomSuggestions && filteredSymptoms.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredSymptoms.slice(0, 10).map((symptom) => (
                      <button
                        key={symptom}
                        onClick={() => addSymptom(symptom)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Button */}
              <Button
                onClick={() => {
                  if (newSymptom.trim()) {
                    addSymptom(newSymptom.trim());
                  }
                }}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Symptom
              </Button>

              {/* Added Symptoms */}
              {symptoms.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Your Symptoms</h4>
                  {symptoms.map((symptom) => (
                    <div key={symptom.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{symptom.name}</h5>
                        <div className="flex items-center space-x-4 mt-1">
                          <div>
                            <label className="text-xs text-gray-600">Severity</label>
                            <select
                              value={symptom.severity}
                              onChange={(e) => updateSymptom(symptom.id, { 
                                severity: e.target.value as any 
                              })}
                              className="ml-1 text-sm border-gray-300 rounded focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value="mild">Mild</option>
                              <option value="moderate">Moderate</option>
                              <option value="severe">Severe</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Duration</label>
                            <select
                              value={symptom.duration}
                              onChange={(e) => updateSymptom(symptom.id, { 
                                duration: e.target.value 
                              })}
                              className="ml-1 text-sm border-gray-300 rounded focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value="1 day">1 day</option>
                              <option value="2-3 days">2-3 days</option>
                              <option value="1 week">1 week</option>
                              <option value="2+ weeks">2+ weeks</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSymptom(symptom.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Analyze Button */}
              {symptoms.length > 0 && (
                <Button
                  onClick={analyzeSymptoms}
                  disabled={isAnalyzing}
                  loading={isAnalyzing}
                  className="w-full"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Symptoms'}
                </Button>
              )}
            </div>
          </Card>

          {/* Results */}
          <Card title="AI Analysis Results">
            {result ? (
              <div className="space-y-6">
                {/* Severity Assessment */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  {getSeverityIcon(result.severity)}
                  <div>
                    <h4 className="font-medium text-gray-900">Severity Assessment</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(result.severity)}`}>
                      {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} Risk
                    </span>
                  </div>
                </div>

                {/* AI Response */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{result.aiResponse}</p>
                </div>

                {/* Possible Conditions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Possible Conditions</h4>
                  <ul className="space-y-1">
                    {result.possibleConditions.map((condition, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <TrendingUp className="w-4 h-4 text-blue-500 mr-2" />
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    Save Results
                  </Button>
                  <Button variant="outline" size="sm">
                    Share with Doctor
                  </Button>
                  <Button size="sm">
                    Book Appointment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
                <p className="text-gray-600">
                  Add your symptoms and click "Analyze Symptoms" to get AI-powered health insights.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Important Notice */}
        <Card>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800">Important Medical Disclaimer</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This AI symptom checker is for informational purposes only and should not replace 
                  professional medical advice, diagnosis, or treatment. Always consult with a qualified 
                  healthcare provider for any medical concerns or emergencies.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
