import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIAnalysisResult } from '@/interfaces/website-info.interface';

@Injectable()
export class AIAnalysisService {
  private readonly logger = new Logger(AIAnalysisService.name);
  private openai: OpenAI | null = null;

  constructor(private configService: ConfigService) {
    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    const apiKey = this.configService.get('openai.apiKey');
    if (!apiKey) {
      this.logger.warn('OpenAI API key not found. AI analysis will be disabled.');
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey,
      });
      this.logger.log('OpenAI client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI client:', error);
    }
  }

  async analyzeContent(content: string, contentType: 'privacy_policy' | 'trust_center' | 'general' = 'general'): Promise<AIAnalysisResult | null> {
    if (!this.openai) {
      this.logger.warn('OpenAI client not available. Skipping AI analysis.');
      return null;
    }

    try {
      this.logger.log(`Starting AI analysis of ${contentType} content`);
      
      const model = this.configService.get('openai.model');
      const maxTokens = this.configService.get('openai.maxTokens');
      const temperature = this.configService.get('openai.temperature');

      const prompt = this.buildAnalysisPrompt(content, contentType);
      
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a privacy and security expert analyzing website content. Provide objective, professional analysis in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature,
      });

      const resultText = response.choices[0]?.message?.content;
      if (!resultText) {
        throw new Error('No response from OpenAI');
      }

      const analysisResult = this.parseAIResponse(resultText);
      this.logger.log('AI analysis completed successfully');
      
      return analysisResult;
    } catch (error) {
      this.logger.error('AI analysis failed:', error);
      return null;
    }
  }

  private buildAnalysisPrompt(content: string, contentType: string): string {
    const truncatedContent = content.substring(0, 4000); // Limit content length
    
    if (contentType === 'privacy_policy') {
      return `
Analyze this privacy policy content and provide a comprehensive assessment:

${truncatedContent}

Please provide a JSON response with the following structure:
{
  "summary": "A concise summary (2-3 sentences)",
  "keyFindings": ["Key finding 1", "Key finding 2", "Key finding 3", "Key finding 4", "Key finding 5"],
  "privacyScore": 8,
  "securityScore": 7,
  "complianceScore": 9,
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "dataUsageSummary": "Summary of how data is used (2-3 sentences)",
  "userRightsSummary": "Summary of user rights (2-3 sentences)"
}

Scores should be integers from 1-10, where 10 is excellent. Be objective and professional in your analysis.
      `;
    } else if (contentType === 'trust_center') {
      return `
Analyze this trust center content and provide insights:

${truncatedContent}

Please provide a JSON response with the following structure:
{
  "summary": "A concise summary (2-3 sentences)",
  "keyFindings": ["Key finding 1", "Key finding 2", "Key finding 3"],
  "privacyScore": 7,
  "securityScore": 8,
  "complianceScore": 7,
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "risks": ["Risk 1", "Risk 2"],
  "dataUsageSummary": "Summary of data usage (1-2 sentences)",
  "userRightsSummary": "Summary of user rights (1-2 sentences)"
}

Scores should be integers from 1-10, where 10 is excellent. Focus on security and trust aspects.
      `;
    } else {
      return `
Analyze this general website content and provide insights:

${truncatedContent}

Please provide a JSON response with the following structure:
{
  "summary": "A concise summary (2-3 sentences)",
  "keyFindings": ["Key finding 1", "Key finding 2", "Key finding 3"],
  "privacyScore": 6,
  "securityScore": 6,
  "complianceScore": 6,
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "risks": ["Risk 1", "Risk 2"],
  "dataUsageSummary": "Summary of data usage (1-2 sentences)",
  "userRightsSummary": "Summary of user rights (1-2 sentences)"
}

Scores should be integers from 1-10, where 10 is excellent. Provide general insights about privacy and security.
      `;
    }
  }

  private parseAIResponse(responseText: string): AIAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the response
      return {
        summary: parsed.summary || 'No summary provided',
        keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
        privacyScore: this.normalizeScore(parsed.privacyScore),
        securityScore: this.normalizeScore(parsed.securityScore),
        complianceScore: this.normalizeScore(parsed.complianceScore),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        dataUsageSummary: parsed.dataUsageSummary || 'No data usage information provided',
        userRightsSummary: parsed.userRightsSummary || 'No user rights information provided',
      };
    } catch (error) {
      this.logger.error('Failed to parse AI response:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  private normalizeScore(score: any): number {
    const num = parseInt(score, 10);
    if (isNaN(num) || num < 1 || num > 10) {
      return 5; // Default to middle score if invalid
    }
    return num;
  }

  async analyzePrivacyPolicy(content: string): Promise<AIAnalysisResult | null> {
    return this.analyzeContent(content, 'privacy_policy');
  }

  async analyzeTrustCenter(content: string): Promise<AIAnalysisResult | null> {
    return this.analyzeContent(content, 'trust_center');
  }

  async analyzeGeneralContent(content: string): Promise<AIAnalysisResult | null> {
    return this.analyzeContent(content, 'general');
  }

  isAvailable(): boolean {
    return this.openai !== null;
  }
}
