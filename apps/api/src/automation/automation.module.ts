import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma.module';
import { BlogAutomationService } from './blog-automation.service';
import { ContentResearchService } from './content-research.service';
import { ImageSourcingService } from './image-sourcing.service';
import { FreeKeywordResearchService } from './free-keyword-research.service';
import { TopicDiscoveryService } from './topic-discovery.service';
import { ContentSimilarityService } from './content-similarity.service';
import { SeoValidationService } from './seo-validation.service';
import { AutomationController } from './automation.controller';

// Reference sources. Credential-gated adapters are always registered so the
// admin UI can report their status; each reports itself unavailable until its
// credentials are provisioned.
import {
  GoogleAutocompleteSource,
  GoogleTrendsSource,
  PageSpeedInsightsSource,
  GoogleSearchConsoleSource,
  GoogleKeywordPlannerSource,
  SemrushSource,
  AhrefsSource,
  AnswerThePublicSource,
  ScreamingFrogSource,
  ReferenceSource,
  REFERENCE_SOURCES,
} from './seo-sources';

// Re-exported so existing import sites keep working.
export { REFERENCE_SOURCES };

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
    TopicDiscoveryService,
    ContentSimilarityService,
    SeoValidationService,

    GoogleAutocompleteSource,
    GoogleTrendsSource,
    PageSpeedInsightsSource,
    GoogleSearchConsoleSource,
    GoogleKeywordPlannerSource,
    SemrushSource,
    AhrefsSource,
    AnswerThePublicSource,
    ScreamingFrogSource,
    {
      provide: REFERENCE_SOURCES,
      inject: [
        GoogleAutocompleteSource,
        GoogleTrendsSource,
        PageSpeedInsightsSource,
        GoogleSearchConsoleSource,
        GoogleKeywordPlannerSource,
        SemrushSource,
        AhrefsSource,
        AnswerThePublicSource,
        ScreamingFrogSource,
      ],
      useFactory: (...sources: ReferenceSource[]): ReferenceSource[] => sources,
    },
  ],
  exports: [
    BlogAutomationService,
    ContentResearchService,
    ImageSourcingService,
    FreeKeywordResearchService,
    TopicDiscoveryService,
    ContentSimilarityService,
    SeoValidationService,
    REFERENCE_SOURCES,
  ],
})
export class AutomationModule {}