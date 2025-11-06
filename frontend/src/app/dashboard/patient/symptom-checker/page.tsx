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

/**
 * Represents a symptom for checking
 */
interface Symptom {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
}

/**
 * Represents the result of a symptom check
 */
interface SymptomCheckResult {
  id: string;
  symptoms: Symptom[];
  aiResponse: string;
  possibleConditions: string[];
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  createdAt: string;
}

/**
 * List of common symptoms for quick selection
 */
const COMMON_SYMPTOMS = [
  // General Symptoms
  'Headache', 'Fever', 'Chills', 'Fatigue', 'Weakness', 'Dizziness', 
  'Lightheadedness', 'Fainting', 'Sweating', 'Night sweats', 'Malaise',
  'Loss of appetite', 'Weight loss', 'Weight gain', 'Dehydration',
  
  // Respiratory Symptoms
  'Cough', 'Dry cough', 'Productive cough', 'Sore throat', 'Runny nose',
  'Stuffy nose', 'Nasal congestion', 'Sneezing', 'Shortness of breath',
  'Difficulty breathing', 'Wheezing', 'Chest tightness', 'Rapid breathing',
  'Hoarse voice', 'Loss of voice', 'Postnasal drip',
  
  // Digestive Symptoms
  'Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Abdominal pain',
  'Stomach cramps', 'Bloating', 'Gas', 'Heartburn', 'Acid reflux',
  'Loss of taste', 'Loss of smell', 'Difficulty swallowing', 'Indigestion',
  'Blood in stool', 'Black stool', 'Loss of bowel control',
  
  // Pain & Musculoskeletal
  'Chest pain', 'Back pain', 'Lower back pain', 'Neck pain', 'Shoulder pain',
  'Joint pain', 'Muscle pain', 'Muscle aches', 'Muscle cramps', 'Stiffness',
  'Knee pain', 'Hip pain', 'Leg pain', 'Arm pain', 'Numbness', 'Tingling',
  
  // Skin Symptoms
  'Rash', 'Itching', 'Hives', 'Swelling', 'Redness', 'Blisters', 
  'Dry skin', 'Peeling skin', 'Bruising', 'Skin discoloration',
  'Acne', 'Bumps', 'Lesions', 'Sores', 'Ulcers',
  
  // Neurological Symptoms
  'Confusion', 'Memory problems', 'Difficulty concentrating', 'Brain fog',
  'Tremors', 'Seizures', 'Coordination problems', 'Balance problems',
  'Slurred speech', 'Vision changes', 'Blurred vision', 'Double vision',
  'Sensitivity to light', 'Hearing problems', 'Ringing in ears', 'Ear pain',
  
  // Mental Health
  'Anxiety', 'Depression', 'Mood swings', 'Irritability', 'Stress',
  'Panic attacks', 'Restlessness', 'Nervousness', 'Insomnia',
  'Difficulty sleeping', 'Excessive sleeping', 'Nightmares',
  
  // Cardiovascular
  'Palpitations', 'Irregular heartbeat', 'Rapid heartbeat', 'Slow heartbeat',
  'High blood pressure', 'Low blood pressure', 'Poor circulation',
  'Cold hands and feet', 'Leg swelling', 'Ankle swelling',
  
  // Urinary Symptoms
  'Frequent urination', 'Urgent urination', 'Painful urination',
  'Blood in urine', 'Dark urine', 'Cloudy urine', 'Difficulty urinating',
  'Incontinence', 'Reduced urine output',
  
  // Eye Symptoms
  'Red eyes', 'Itchy eyes', 'Watery eyes', 'Dry eyes', 'Eye pain',
  'Eye discharge', 'Swollen eyelids', 'Eye twitching',
  
  // Throat & Mouth
  'Dry mouth', 'Bad breath', 'Tooth pain', 'Gum bleeding', 'Mouth sores',
  'Tongue pain', 'Swollen glands', 'Difficulty chewing',
  
  // Other
  'Hair loss', 'Excessive thirst', 'Excessive hunger', 'Frequent infections',
  'Delayed wound healing', 'Easy bruising', 'Nosebleeds', 'Bleeding gums',
  'Menstrual irregularities', 'Hot flashes', 'Cold intolerance', 'Heat intolerance'
];

/**
 * Symptom Checker page
 * Allows patients to input symptoms and get AI-powered analysis
 */
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
                />
                
                {/* Symptom Suggestions */}
                {showSymptomSuggestions && filteredSymptoms.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredSymptoms.slice(0, 15).map((symptom) => (
                      <button
                        key={symptom}
                        onClick={() => addSymptom(symptom)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900"
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
                              className="ml-1 text-sm border-gray-300 rounded focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
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
                              className="ml-1 text-sm border-gray-300 rounded focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
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
