import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma.module';
import { BlogAutomationService } from './blog-automation.service';
import { ContentResearchService } from './content-research.service';
import { ImageSourcingService } from './image-sourcing.service';
import { FreeKeywordResearchService } from './free-keyword-research.service';
import { AutomationController } from './automation.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  controllers: [AutomationController],
  providers: [
    BlogAutomationService,
    ContentResearchService,
    ImageSourcingService,
    FreeKeywordResearchService,
  ],
  exports: [
    BlogAutomationService,
    ContentResearchService,
    ImageSourcingService,
    FreeKeywordResearchService,
  ],
})
export class AutomationModule {}
