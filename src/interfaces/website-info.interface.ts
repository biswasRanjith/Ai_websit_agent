export interface ContactInfo {
  email?: string[];
  phone?: string[];
  address?: string[];
}

export interface AboutInfo {
  title?: string;
  mainHeading?: string;
  description?: string;
}

export interface PrivacyAnalysis {
  dataCollection: string[];
  dataSharing: string[];
  userRights: string[];
  securityMeasures: string[];
  compliance: string[];
}

export interface AIAnalysisResult {
  summary: string;
  keyFindings: string[];
  privacyScore: number;
  securityScore: number;
  complianceScore: number;
  recommendations: string[];
  risks: string[];
  dataUsageSummary: string;
  userRightsSummary: string;
}

export interface WebsiteInfo {
  companyName: string;
  mainUrl: string;
  privacyPolicyUrl?: string;
  trustCenterUrl?: string;
  termsOfServiceUrl?: string;
  contactInfo: ContactInfo;
  aboutInfo: AboutInfo;
  privacySummary: string;
  trustSummary: string;
  dataCollection: string[];
  dataSharing: string[];
  userRights: string[];
  securityMeasures: string[];
  compliance: string[];
  aiAnalysis?: AIAnalysisResult;
  lastUpdated: Date;
}

export interface AnalysisOptions {
  useAI?: boolean;
  headless?: boolean;
  timeout?: number;
  maxRetries?: number;
  userAgent?: string;
}

export interface AnalysisRequest {
  url: string;
  options?: AnalysisOptions;
}

export interface AnalysisResponse {
  success: boolean;
  data?: WebsiteInfo;
  error?: string;
  processingTime?: number;
}

export interface BatchAnalysisRequest {
  urls: string[];
  options?: AnalysisOptions;
  outputFormat?: 'markdown' | 'json' | 'html';
  outputPath?: string;
}

export interface BatchAnalysisResponse {
  total: number;
  successful: number;
  failed: number;
  results: AnalysisResponse[];
  summary: {
    averagePrivacyScore?: number;
    averageSecurityScore?: number;
    averageComplianceScore?: number;
    topCompanies: string[];
  };
}
