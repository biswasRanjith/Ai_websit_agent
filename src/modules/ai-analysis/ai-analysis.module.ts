import { Module } from '@nestjs/common';
import { AIAnalysisService } from './ai-analysis.service';

@Module({
  providers: [AIAnalysisService],
  exports: [AIAnalysisService],
})
export class AIAnalysisModule {}
