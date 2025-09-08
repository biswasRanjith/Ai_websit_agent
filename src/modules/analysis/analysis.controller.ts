import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { 
  AnalysisRequestDto, 
  AnalysisResponseDto, 
  BatchAnalysisRequestDto 
} from '@/dto/analysis.dto';

@ApiTags('Website Analysis')
@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(private readonly analysisService: AnalysisService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ 
    summary: 'Analyze a single website',
    description: 'Analyzes a website for privacy policies, trust centers, and other security information'
  })
  @ApiBody({ type: AnalysisRequestDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Analysis completed successfully',
    type: AnalysisResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request data' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async analyzeWebsite(@Body() request: AnalysisRequestDto): Promise<AnalysisResponseDto> {
    const normalizedUrl = this.normalizeUrlOrCompany(request.url);
    this.logger.log(`Analyze request: input="${request.url}" normalized="${normalizedUrl}"`);
    const result = await this.analysisService.analyzeWebsite(normalizedUrl, request.options);
    return result;
  }

  @Post('analyze/batch')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ 
    summary: 'Analyze multiple websites',
    description: 'Analyzes multiple websites in batch mode with configurable options'
  })
  @ApiBody({ type: BatchAnalysisRequestDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Batch analysis completed successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request data' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async analyzeBatch(@Body() request: BatchAnalysisRequestDto) {
    return this.analysisService.analyzeBatch(request);
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get analysis service status',
    description: 'Returns the current status of the analysis service and its components'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service status retrieved successfully' 
  })
  getStatus() {
    return this.analysisService.getAnalysisStatus();
  }

  @Post('report')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ 
    summary: 'Generate report from analysis data',
    description: 'Generates a report in the specified format from analysis data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Report generated successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request data' 
  })
  async generateReport(@Body() request: {
    websiteInfo: any;
    format?: 'markdown' | 'json' | 'html';
    outputPath?: string;
  }) {
    const { websiteInfo, format = 'markdown', outputPath } = request;
    return this.analysisService.generateReport(websiteInfo, format, outputPath);
  }

  private normalizeUrlOrCompany(input: string): string {
    if (!input) return input;
    const trimmed = input.trim();

    // If already has protocol, assume it's a URL
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    // If it looks like a domain (has a dot), prefix https
    if (trimmed.includes('.')) {
      return `https://${trimmed}`;
    }

    // Otherwise treat as company name -> guess main site
    const sanitized = trimmed.toLowerCase().replace(/\s+/g, '');
    return `https://www.${sanitized}.com`;
  }
}
