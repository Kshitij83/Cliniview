import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI Model types supported for health summaries
 */
export type AIModel = 'gpt-5-nano-2025-08-07' | 'gpt-5-mini-2025-08-07' | 'gemini-2.5-flash';

/**
 * Patient context data for AI analysis
 */
export interface PatientContext {
  patientId: string;
  medicalReports: any[];
  prescriptions: any[];
  symptomChecks: any[];
  patientProfile: any;
  timeframe: string;
}

/**
 * AI Health Summary response structure
 */
export interface AIHealthSummaryResponse {
  summary: string;
  keyInsights: string[];
  riskFactors: string[];
  recommendations: string[];
  healthTrends: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  modelUsed: AIModel;
  conversationId: string;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: AIModel;
  context?: PatientContext;
}

/**
 * AI Service for Health Summary and Chat
 */
export class AIHealthService {
  private openai: OpenAI;
  private googleAI: GoogleGenerativeAI;
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  constructor() {
    // Initialize OpenAI
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Google Generative AI
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY is required');
    }
    this.googleAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
  }

  /**
   * Generate comprehensive health summary with AI
   */
  async generateHealthSummary(
    context: PatientContext, 
    model: AIModel = 'gpt-5-mini-2025-08-07'
  ): Promise<AIHealthSummaryResponse> {
    const conversationId = uuidv4();
    
    try {
      const prompt = this.buildHealthSummaryPrompt(context);
      let response: string;

      if (model.startsWith('gpt-')) {
        response = await this.callOpenAI(prompt, model);
      } else if (model.startsWith('gemini-')) {
        response = await this.callGemini(prompt, model);
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }

      const parsedResponse = this.parseHealthSummaryResponse(response);
      
      // Store system message in conversation history
      this.addToConversation(conversationId, {
        id: uuidv4(),
        role: 'system',
        content: 'Health summary generated successfully',
        timestamp: new Date(),
        model,
        context
      });

      return {
        ...parsedResponse,
        modelUsed: model,
        conversationId,
        confidence: this.calculateConfidence(context, parsedResponse)
      };

    } catch (error: any) {
      console.error(`Error generating health summary with ${model}:`, error);
      throw new Error(`Failed to generate health summary: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Chat with AI about health using conversation context
   */
  async chatWithAI(
    message: string,
    conversationId: string,
    context: PatientContext,
    model: AIModel = 'gpt-5-mini-2025-08-07'
  ): Promise<{ response: string; messageId: string }> {
    try {
      // Add user message to conversation
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        model,
        context
      };
      this.addToConversation(conversationId, userMessage);

      // Build chat prompt with conversation history
      const prompt = this.buildChatPrompt(message, conversationId, context);
      
      let response: string;
      if (model.startsWith('gpt-')) {
        response = await this.callOpenAI(prompt, model);
      } else if (model.startsWith('gemini-')) {
        response = await this.callGemini(prompt, model);
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }

      // Add AI response to conversation
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        model
      };
      this.addToConversation(conversationId, assistantMessage);

      return {
        response,
        messageId: assistantMessage.id
      };

    } catch (error: any) {
      console.error(`Error in AI chat with ${model}:`, error);
      throw new Error(`Failed to process chat message: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string, model: AIModel): Promise<string> {
    try {
      // GPT-5 models have different parameter requirements
      const isGPT5 = model.startsWith('gpt-5');
      
      const requestBody: any = {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI health assistant specializing in medical analysis and patient care. Provide accurate, helpful, and empathetic health insights while always recommending professional medical consultation for serious concerns.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      if (isGPT5) {
        // GPT-5 models use max_completion_tokens and only support default temperature (1)
        requestBody.max_completion_tokens = parseInt(process.env.AI_MAX_TOKENS || '4096');
        // Don't set temperature or top_p for GPT-5 models - they use defaults
      } else {
        // Older models use max_tokens and support custom temperature
        requestBody.max_tokens = parseInt(process.env.AI_MAX_TOKENS || '4096');
        requestBody.temperature = 0.3;
        requestBody.top_p = 0.9;
      }

      const completion = await this.openai.chat.completions.create(requestBody);

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API call failed: ${error?.status || 'Unknown'} ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Call Google Gemini API
   */
  private async callGemini(prompt: string, model: AIModel): Promise<string> {
    try {
      const genModel = this.googleAI.getGenerativeModel({ 
        model: model,
        generationConfig: {
          maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || '4096'),
          temperature: 0.3,
          topP: 0.9
        }
      });

      const systemPrompt = 'You are an AI health assistant specializing in medical analysis and patient care. Provide accurate, helpful, and empathetic health insights while always recommending professional medical consultation for serious concerns.';
      
      const fullPrompt = `${systemPrompt}\n\nUser Query: ${prompt}`;
      
      const result = await genModel.generateContent(fullPrompt);
      const response = await result.response;
      
      return response.text() || 'No response generated';
    } catch (error: any) {
      console.error('Google Gemini API error:', error);
      throw new Error(`Gemini API call failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Build comprehensive health summary prompt
   */
  private buildHealthSummaryPrompt(context: PatientContext): string {
    return `
# Medical Health Summary Analysis

## Patient Context (Past ${context.timeframe})

### Medical Reports (${context.medicalReports.length} documents):
${context.medicalReports.map(report => 
  `- ${report.title || 'Medical Report'}: ${report.description || 'No description'} (${new Date(report.createdAt).toLocaleDateString()})`
).join('\n')}

### Doctor Prescriptions/Notes (${context.prescriptions.length} entries):
${context.prescriptions.map(prescription => 
  `- ${prescription.comments || prescription.diagnosis || 'Medical Note'} (${new Date(prescription.createdAt).toLocaleDateString()})`
).join('\n')}

### Recent Symptom Analyses (${context.symptomChecks.length} analyses):
${context.symptomChecks.map(check => 
  `- Symptoms: ${check.symptoms.join(', ')} | AI Response: ${check.aiResponse} | Severity: ${check.severity} (${new Date(check.createdAt).toLocaleDateString()})`
).join('\n')}

### Patient Profile:
- Age: ${context.patientProfile.age || 'Not specified'}
- Gender: ${context.patientProfile.gender || 'Not specified'}  
- Medical History: ${context.patientProfile.medicalHistory || 'None provided'}

## Analysis Request

Please provide a comprehensive health summary in the following JSON format:

{
  "summary": "A detailed 2-3 paragraph analysis of the patient's overall health status",
  "keyInsights": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "riskFactors": ["Risk factor 1", "Risk factor 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "healthTrends": ["Trend 1", "Trend 2"],
  "urgencyLevel": "low|medium|high|critical"
}

Focus on:
1. Patterns in symptoms and medical reports
2. Progression or improvement in health conditions
3. Preventive care recommendations
4. When to seek immediate medical attention
5. Lifestyle modifications

Be empathetic, accurate, and always encourage professional medical consultation when appropriate.
`;
  }

  /**
   * Build chat prompt with conversation context
   */
  private buildChatPrompt(message: string, conversationId: string, context: PatientContext): string {
    const history = this.conversationHistory.get(conversationId) || [];
    const recentMessages = history.slice(-5); // Last 5 messages for context

    return `
# Medical Health Chat Assistant

## Patient Medical Context:
- Medical Reports: ${context.medicalReports.length} documents
- Prescriptions: ${context.prescriptions.length} entries  
- Recent Symptom Checks: ${context.symptomChecks.length} analyses
- Patient Profile: Age ${context.patientProfile.age || 'unknown'}, ${context.patientProfile.gender || 'unknown gender'}

## Recent Conversation:
${recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

## Current Question:
${message}

Please provide a helpful, medically-informed response. Always encourage consulting healthcare professionals for specific medical advice.
`;
  }

  /**
   * Parse AI response into structured format
   */
  private parseHealthSummaryResponse(response: string): Omit<AIHealthSummaryResponse, 'modelUsed' | 'conversationId' | 'confidence'> {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || response,
          keyInsights: parsed.keyInsights || [],
          riskFactors: parsed.riskFactors || [],
          recommendations: parsed.recommendations || [],
          healthTrends: parsed.healthTrends || [],
          urgencyLevel: parsed.urgencyLevel || 'low'
        };
      }
      
      // Fallback parsing if JSON not found
      return {
        summary: response,
        keyInsights: [],
        riskFactors: [],
        recommendations: [],
        healthTrends: [],
        urgencyLevel: 'low'
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        summary: response,
        keyInsights: [],
        riskFactors: [],
        recommendations: [],
        healthTrends: [],
        urgencyLevel: 'low'
      };
    }
  }

  /**
   * Calculate confidence based on available data
   */
  private calculateConfidence(context: PatientContext, response: any): number {
    let confidence = 0.5; // Base confidence
    
    // More data = higher confidence
    if (context.medicalReports.length > 0) confidence += 0.2;
    if (context.prescriptions.length > 0) confidence += 0.2;
    if (context.symptomChecks.length > 0) confidence += 0.1;
    
    // Structured response = higher confidence
    if (response.keyInsights.length > 0) confidence += 0.1;
    if (response.recommendations.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Add message to conversation history
   */
  private addToConversation(conversationId: string, message: ChatMessage): void {
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    
    const history = this.conversationHistory.get(conversationId)!;
    history.push(message);
    
    // Keep only last 20 messages to manage memory
    if (history.length > 20) {
      this.conversationHistory.set(conversationId, history.slice(-20));
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): ChatMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }
}

export default new AIHealthService();