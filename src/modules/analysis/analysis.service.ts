import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebsiteAnalysisService } from '../website-analysis/website-analysis.service';
import { AIAnalysisService } from '../ai-analysis/ai-analysis.service';
import { ReportGenerationService } from '../report-generation/report-generation.service';
import { 
  WebsiteInfo, 
  AnalysisOptions, 
  AnalysisResponse, 
  BatchAnalysisRequest, 
  BatchAnalysisResponse 
} from '@/interfaces/website-info.interface';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private configService: ConfigService,
    private websiteAnalysisService: WebsiteAnalysisService,
    private aiAnalysisService: AIAnalysisService,
    private reportGenerationService: ReportGenerationService,
  ) {}

  async analyzeWebsite(url: string, options: AnalysisOptions = {}): Promise<AnalysisResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting analysis of ${url}`);
      
      // Perform basic website analysis
      const websiteInfo = await this.websiteAnalysisService.analyzeWebsite(url, options);
      
      // Perform AI analysis if enabled
      if (options.useAI !== false && this.aiAnalysisService.isAvailable()) {
        this.logger.log('Performing AI analysis...');
        
        // Analyze privacy policy if found
        if (websiteInfo.privacyPolicyUrl) {
          const privacyContent = await this.websiteAnalysisService['fetchPageContent'](websiteInfo.privacyPolicyUrl, options);
          if (privacyContent) {
            const aiResult = await this.aiAnalysisService.analyzePrivacyPolicy(privacyContent);
            if (aiResult) {
              websiteInfo.aiAnalysis = aiResult;
            }
          }
        }
        
        // Analyze trust center if found and no privacy policy analysis
        if (!websiteInfo.aiAnalysis && websiteInfo.trustCenterUrl) {
          const trustContent = await this.websiteAnalysisService['fetchPageContent'](websiteInfo.trustCenterUrl, options);
          if (trustContent) {
            const aiResult = await this.aiAnalysisService.analyzeTrustCenter(trustContent);
            if (aiResult) {
              websiteInfo.aiAnalysis = aiResult;
            }
          }
        }
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: websiteInfo,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`Analysis failed for ${url}:`, error);
      
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  async analyzeBatch(request: BatchAnalysisRequest): Promise<BatchAnalysisResponse> {
    const { urls, options = {}, outputFormat = 'markdown', outputPath } = request;
    
    this.logger.log(`Starting batch analysis of ${urls.length} URLs`);
    
    const results: AnalysisResponse[] = [];
    const successfulAnalyses: WebsiteInfo[] = [];
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      this.logger.log(`Processing ${i + 1}/${urls.length}: ${url}`);
      
      try {
        const result = await this.analyzeWebsite(url, options);
        results.push(result);
        
        if (result.success && result.data) {
          successfulAnalyses.push(result.data);
          
          // Generate individual report if output path is specified
          if (outputPath) {
            try {
              await this.reportGenerationService.generateReport(
                result.data,
                outputFormat,
                outputPath
              );
            } catch (reportError) {
              this.logger.warn(`Failed to generate report for ${url}:`, reportError);
            }
          }
        }
        
        // Add delay between requests to be respectful
        if (i < urls.length - 1) {
          const delay = this.configService.get('scraping.delayBetweenRequests');
          await this.delay(delay);
        }
      } catch (error) {
        this.logger.error(`Failed to analyze ${url}:`, error);
        results.push({
          success: false,
          error: error.message,
        });
      }
    }
    
    // Generate summary
    const summary = this.generateBatchSummary(successfulAnalyses);
    
    return {
      total: urls.length,
      successful: successfulAnalyses.length,
      failed: urls.length - successfulAnalyses.length,
      results,
      summary,
    };
  }

  async generateReport(
    websiteInfo: WebsiteInfo,
    format: 'markdown' | 'json' | 'html' = 'markdown',
    outputPath?: string
  ): Promise<string> {
    return this.reportGenerationService.generateReport(websiteInfo, format, outputPath);
  }

  private generateBatchSummary(analyses: WebsiteInfo[]): {
    averagePrivacyScore?: number;
    averageSecurityScore?: number;
    averageComplianceScore?: number;
    topCompanies: string[];
  } {
    const summary: {
      averagePrivacyScore?: number;
      averageSecurityScore?: number;
      averageComplianceScore?: number;
      topCompanies: string[];
    } = {
      topCompanies: analyses.map(a => a.companyName).slice(0, 5),
    };
    
    // Calculate average scores if AI analysis is available
    const aiAnalyses = analyses.filter(a => a.aiAnalysis);
    if (aiAnalyses.length > 0) {
      const totalPrivacy = aiAnalyses.reduce((sum, a) => sum + (a.aiAnalysis?.privacyScore || 0), 0);
      const totalSecurity = aiAnalyses.reduce((sum, a) => sum + (a.aiAnalysis?.securityScore || 0), 0);
      const totalCompliance = aiAnalyses.reduce((sum, a) => sum + (a.aiAnalysis?.complianceScore || 0), 0);
      
      summary.averagePrivacyScore = Math.round((totalPrivacy / aiAnalyses.length) * 10) / 10;
      summary.averageSecurityScore = Math.round((totalSecurity / aiAnalyses.length) * 10) / 10;
      summary.averageComplianceScore = Math.round((totalCompliance / aiAnalyses.length) * 10) / 10;
    }
    
    return summary;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAnalysisStatus(): {
    aiAvailable: boolean;
    browserAvailable: boolean;
    config: any;
  } {
    return {
      aiAvailable: this.aiAnalysisService.isAvailable(),
      browserAvailable: true, // Assuming browser is always available if service is running
      config: {
        enableAI: this.configService.get('analysis.enableAI'),
        defaultOutputFormat: this.configService.get('analysis.defaultOutputFormat'),
        timeout: this.configService.get('scraping.timeout'),
        maxRetries: this.configService.get('scraping.maxRetries'),
      },
    };
  }
}
