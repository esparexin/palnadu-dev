import { Module } from '@nestjs/common';
import { CaseStudiesService } from './case-studies.service';
import { CaseStudiesController } from './case-studies.controller';

@Module({
  controllers: [CaseStudiesController],
  providers: [CaseStudiesService],
  exports: [CaseStudiesService],
})
export class CaseStudiesModule {}
