import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AnalysisOptionsDto {
  @ApiProperty({ description: 'Enable AI analysis', default: true })
  @IsOptional()
  @IsBoolean()
  useAI?: boolean = true;

  @ApiProperty({ description: 'Run browser in headless mode', default: true })
  @IsOptional()
  @IsBoolean()
  headless?: boolean = true;

  @ApiProperty({ description: 'Request timeout in seconds', default: 30000 })
  @IsOptional()
  @IsNumber()
  timeout?: number = 30000;

  @ApiProperty({ description: 'Maximum retry attempts', default: 3 })
  @IsOptional()
  @IsNumber()
  maxRetries?: number = 3;

  @ApiProperty({ description: 'Custom user agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: 'Validate data authenticity', default: true })
  @IsOptional()
  @IsBoolean()
  validateData?: boolean = true;
}

export class AnalysisRequestDto {
  @ApiProperty({ description: 'Website URL to analyze' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Analysis options' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AnalysisOptionsDto)
  options?: AnalysisOptionsDto;
}

export class BatchAnalysisRequestDto {
  @ApiProperty({ description: 'Array of URLs to analyze' })
  @IsArray()
  @IsString({ each: true })
  urls: string[];

  @ApiProperty({ description: 'Analysis options' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AnalysisOptionsDto)
  options?: AnalysisOptionsDto;

  @ApiProperty({ description: 'Output format', enum: ['markdown', 'json', 'html'] })
  @IsOptional()
  @IsEnum(['markdown', 'json', 'html'])
  outputFormat?: 'markdown' | 'json' | 'html' = 'markdown';

  @ApiProperty({ description: 'Output directory path' })
  @IsOptional()
  @IsString()
  outputPath?: string;
}

export class ContactInfoDto {
  @ApiProperty({ description: 'Email addresses found' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  email?: string[];

  @ApiProperty({ description: 'Phone numbers found' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phone?: string[];

  @ApiProperty({ description: 'Addresses found' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  address?: string[];
}

export class AboutInfoDto {
  @ApiProperty({ description: 'Page title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Main heading' })
  @IsOptional()
  @IsString()
  mainHeading?: string;

  @ApiProperty({ description: 'Company description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class AIAnalysisResultDto {
  @ApiProperty({ description: 'Analysis summary' })
  @IsString()
  summary: string;

  @ApiProperty({ description: 'Key findings' })
  @IsArray()
  @IsString({ each: true })
  keyFindings: string[];

  @ApiProperty({ description: 'Privacy score (1-10)' })
  @IsNumber()
  privacyScore: number;

  @ApiProperty({ description: 'Security score (1-10)' })
  @IsNumber()
  securityScore: number;

  @ApiProperty({ description: 'Compliance score (1-10)' })
  @IsNumber()
  complianceScore: number;

  @ApiProperty({ description: 'Recommendations' })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @ApiProperty({ description: 'Potential risks' })
  @IsArray()
  @IsString({ each: true })
  risks: string[];

  @ApiProperty({ description: 'Data usage summary' })
  @IsString()
  dataUsageSummary: string;

  @ApiProperty({ description: 'User rights summary' })
  @IsString()
  userRightsSummary: string;
}

export class WebsiteInfoDto {
  @ApiProperty({ description: 'Company name' })
  @IsString()
  companyName: string;

  @ApiProperty({ description: 'Main website URL' })
  @IsString()
  mainUrl: string;

  @ApiProperty({ description: 'Privacy policy URL' })
  @IsOptional()
  @IsString()
  privacyPolicyUrl?: string;

  @ApiProperty({ description: 'Trust center URL' })
  @IsOptional()
  @IsString()
  trustCenterUrl?: string;

  @ApiProperty({ description: 'Terms of service URL' })
  @IsOptional()
  @IsString()
  termsOfServiceUrl?: string;

  @ApiProperty({ description: 'Contact information' })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto;

  @ApiProperty({ description: 'About information' })
  @ValidateNested()
  @Type(() => AboutInfoDto)
  aboutInfo: AboutInfoDto;

  @ApiProperty({ description: 'Privacy analysis summary' })
  @IsString()
  privacySummary: string;

  @ApiProperty({ description: 'Trust center summary' })
  @IsString()
  trustSummary: string;

  @ApiProperty({ description: 'Data collection mentions' })
  @IsArray()
  @IsString({ each: true })
  dataCollection: string[];

  @ApiProperty({ description: 'Data sharing mentions' })
  @IsArray()
  @IsString({ each: true })
  dataSharing: string[];

  @ApiProperty({ description: 'User rights mentions' })
  @IsArray()
  @IsString({ each: true })
  userRights: string[];

  @ApiProperty({ description: 'Security measures mentions' })
  @IsArray()
  @IsString({ each: true })
  securityMeasures: string[];

  @ApiProperty({ description: 'Compliance mentions' })
  @IsArray()
  @IsString({ each: true })
  compliance: string[];

  @ApiProperty({ description: 'AI analysis results' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AIAnalysisResultDto)
  aiAnalysis?: AIAnalysisResultDto;

  @ApiProperty({ description: 'Analysis timestamp' })
  lastUpdated: Date;
}

export class AnalysisResponseDto {
  @ApiProperty({ description: 'Analysis success status' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Website analysis data' })
  @IsOptional()
  @ValidateNested()
  @Type(() => WebsiteInfoDto)
  data?: WebsiteInfoDto;

  @ApiProperty({ description: 'Error message if failed' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  @IsOptional()
  @IsNumber()
  processingTime?: number;
}
