import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { WebsiteAnalysisModule } from '../website-analysis/website-analysis.module';
import { AIAnalysisModule } from '../ai-analysis/ai-analysis.module';
import { ReportGenerationModule } from '../report-generation/report-generation.module';

@Module({
  imports: [
    WebsiteAnalysisModule,
    AIAnalysisModule,
    ReportGenerationModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
