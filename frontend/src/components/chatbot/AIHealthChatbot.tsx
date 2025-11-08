'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  RefreshCw, 
  Settings, 
  Brain,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Heart,
  Activity
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

/**
 * AI Model selection interface
 */
interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  features: string[];
}

/**
 * Chat message interface
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  isTyping?: boolean;
}

/**
 * Health summary data interface
 */
interface HealthSummaryData {
  summary: string;
  keyInsights: string[];
  riskFactors: string[];
  recommendations: string[];
  healthTrends: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  modelUsed: string;
  conversationId: string;
  contextSummary?: {
    reportsCount: number;
    prescriptionsCount: number;
    symptomChecksCount: number;
    timeframe: string;
  };
}

/**
 * Context summary interface
 */
interface ContextSummary {
  reportsCount: number;
  prescriptionsCount: number;
  symptomChecksCount: number;
  lastActivity: string | null;
  hasRecentActivity: boolean;
  isValidForAnalysis: boolean;
  validationMessage?: string;
  totalDataPoints: number;
}

/**
 * AI Health Chatbot Component
 * Inspired by HorizonAI's chat interface with medical context
 */
export default function AIHealthChatbot() {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingInitialSummary, setIsGeneratingInitialSummary] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-5-mini-2025-08-07');
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [contextSummary, setContextSummary] = useState<ContextSummary | null>(null);
  const [conversationId, setConversationId] = useState<string>('');
  const [healthSummary, setHealthSummary] = useState<HealthSummaryData | null>(null);
  const [dailyUsage, setDailyUsage] = useState({ used: 0, limit: 10 });
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chatbot
  useEffect(() => {
    initializeChatbot();
  }, []);

  /**
   * Initialize the chatbot with models and context
   */
  const initializeChatbot = async () => {
    try {
      // Load available models
      const modelsResponse = await apiClient.getAvailableModels();
      if (modelsResponse) {
        setAvailableModels(modelsResponse.data.models);
        setSelectedModel(modelsResponse.data.defaultModel);
        setDailyUsage({ used: 0, limit: modelsResponse.data.dailyLimit });
      }

      // Load context summary
      const contextResponse = await apiClient.getContextSummary();
      if (contextResponse) {
        setContextSummary(contextResponse.data);
      }

      // Generate conversation ID
      setConversationId(`health-chat-${Date.now()}`);

    } catch (error) {
      console.error('Failed to initialize chatbot:', error);
      toast.error('Failed to initialize AI assistant');
    }
  };

  /**
   * Generate initial health summary
   */
  const generateInitialSummary = async () => {
    if (!contextSummary?.isValidForAnalysis) {
      toast.error(contextSummary?.validationMessage || 'Insufficient data for analysis');
      return;
    }

    setIsGeneratingInitialSummary(true);
    
    try {
      const summaryData = await apiClient.generateHealthSummary(selectedModel);
      setHealthSummary(summaryData.data);
      setConversationId(summaryData.data.conversationId);
        
      // Add welcome message with summary
      const welcomeMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: formatInitialSummaryMessage(summaryData.data),
        timestamp: new Date(),
        model: selectedModel
      };
      
      setMessages([welcomeMessage]);
      toast.success('Health summary generated successfully!');

    } catch (error: any) {
      console.error('Error generating summary:', error);
      toast.error(error.message || 'Failed to generate health summary');
    } finally {
      setIsGeneratingInitialSummary(false);
    }
  };

  /**
   * Format initial summary message
   */
  const formatInitialSummaryMessage = (summary: HealthSummaryData): string => {
    return `# 🏥 Your AI Health Summary

## 📋 Analysis Overview
${summary.summary}

## ✨ Key Insights
${summary.keyInsights.map(insight => `• ${insight}`).join('\\n')}

## ⚠️ Risk Factors
${summary.riskFactors.length > 0 
  ? summary.riskFactors.map(risk => `• ${risk}`).join('\\n')
  : '• No significant risk factors identified'}

## 💡 Recommendations  
${summary.recommendations.map(rec => `• ${rec}`).join('\\n')}

## 📈 Health Trends
${summary.healthTrends.length > 0
  ? summary.healthTrends.map(trend => `• ${trend}`).join('\\n')
  : '• Insufficient data for trend analysis'}

---

**Urgency Level:** ${summary.urgencyLevel.toUpperCase()} | **Confidence:** ${Math.round(summary.confidence * 100)}%
**Data Sources:** ${summary.contextSummary?.reportsCount || 0} reports, ${summary.contextSummary?.prescriptionsCount || 0} prescriptions, ${summary.contextSummary?.symptomChecksCount || 0} symptom checks

💬 **Ask me anything about your health analysis or get personalized advice!**
`;
  };

  /**
   * Send message to AI
   */
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    if (dailyUsage.used >= dailyUsage.limit) {
      toast.error(`Daily limit reached (${dailyUsage.limit} interactions per day)`);
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const chatData = await apiClient.chatWithAI(
        inputValue.trim(),
        conversationId,
        selectedModel
      );
        
      // Remove typing indicator and add AI response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== 'typing');
        return [...filtered, {
          id: chatData.data.messageId,
          role: 'assistant',
          content: chatData.data.response,
          timestamp: new Date(chatData.data.timestamp),
          model: selectedModel
        }];
      });

      setDailyUsage(prev => ({ ...prev, used: prev.used + 1 }));

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      
      // Remove typing indicator on error
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Get urgency level styling
   */
  const getUrgencyLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  /**
   * Get model badge color
   */
  const getModelBadgeColor = (provider: string) => {
    switch (provider) {
      case 'OpenAI': return 'bg-green-100 text-green-800';
      case 'Google': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header with Context Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Health Assistant</h2>
              <p className="text-blue-100">Personalized health insights powered by AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Usage: {dailyUsage.used}/{dailyUsage.limit}</span>
            <Button
              onClick={() => setShowModelSelector(!showModelSelector)}
              size="sm"
              className="bg-white/20 hover:bg-white/30"
            >
              <Settings className="w-4 h-4 mr-1" />
              {selectedModel.includes('gpt') ? 'GPT' : 'Gemini'}
            </Button>
          </div>
        </div>
        
        {/* Context Summary Bar */}
        {contextSummary && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4" />
                  <span>{contextSummary.reportsCount} Reports</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{contextSummary.prescriptionsCount} Prescriptions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{contextSummary.symptomChecksCount} Symptom Checks</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {contextSummary.isValidForAnalysis ? (
                  <span className="flex items-center space-x-1 text-green-200">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ready for Analysis</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-yellow-200">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Limited Data</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Model Selector Dropdown */}
      {showModelSelector && (
        <div className="border-b bg-white p-4">
          <h3 className="font-semibold mb-3">Select AI Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availableModels.map((model) => (
              <div
                key={model.id}
                onClick={() => {
                  setSelectedModel(model.id);
                  setShowModelSelector(false);
                }}
                className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedModel === model.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{model.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${getModelBadgeColor(model.provider)}`}>
                    {model.provider}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                <div className="flex flex-wrap gap-1">
                  {model.features.slice(0, 2).map((feature, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
        {messages.length === 0 && !healthSummary && (
          <Card className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Sparkles className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Welcome to your AI Health Assistant!</h3>
              <p className="text-gray-600 mb-6">
                I can analyze your medical data and provide personalized health insights.
              </p>
              
              {contextSummary?.isValidForAnalysis ? (
                <Button 
                  onClick={generateInitialSummary}
                  disabled={isGeneratingInitialSummary}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {isGeneratingInitialSummary ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Your Health Data...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Health Summary
                    </>
                  )}
                </Button>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800 mb-2">
                    {contextSummary?.validationMessage}
                  </p>
                  <p className="text-xs text-yellow-700">
                    Upload medical reports, visit a doctor, or use the symptom checker to get started.
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Chat Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-3 max-w-4xl ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
              }`}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm border'
                  }`}
                >
                  {message.isTyping ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">AI is thinking...</span>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                
                {/* Timestamp and Model */}
                <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.model && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {message.model.includes('gpt') ? 'GPT' : 'Gemini'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t bg-white p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your health analysis, symptoms, or get personalized advice..."
              disabled={isLoading || !contextSummary?.isValidForAnalysis}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading || !contextSummary?.isValidForAnalysis}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Quick Suggestions */}
        {messages.length > 0 && !isLoading && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              'Explain my risk factors',
              'What lifestyle changes should I make?',
              'When should I see a doctor?',
              'Are there any concerning trends?'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputValue(suggestion)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}