import { Module } from '@nestjs/common';
import { WebsiteAnalysisService } from './website-analysis.service';

@Module({
  providers: [WebsiteAnalysisService],
  exports: [WebsiteAnalysisService],
})
export class WebsiteAnalysisModule {}
