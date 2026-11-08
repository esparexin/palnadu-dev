import { Injectable, Logger } from '@nestjs/common';
import { ContentResearchService } from '../content-research.service';
import { ContentSimilarityService } from '../content-similarity.service';
import { defaultStrategy, SeoStrategy, VALID_INTENTS } from '../seo-strategy';
import { ImageSourcingService, LicensedImage } from '../image-sourcing.service';
import { SeoValidationService } from '../seo-validation.service';
import { ValidationOutcome } from '../seo-validation-rules';
import { SearchIntent } from '../topic-identity';
import { BlogLanguage } from '@prisma/client';
import { ClaimedTopic } from './types';

export interface ComposedArticle {
  draft: any;
  enrichedContent: string;
  images: LicensedImage[];
  coverImage: string;
  wordCount: number;
  similarity: any;
  similaritySummary: string;
  validation: ValidationOutcome;
  llmProvider: string;
  strategy: SeoStrategy;
}

@Injectable()
export class BlogComposerService {
  private readonly logger = new Logger(BlogComposerService.name);

  constructor(
    private readonly researchService: ContentResearchService,
    private readonly imageService: ImageSourcingService,
    private readonly similarityService: ContentSimilarityService,
    private readonly validationService: SeoValidationService,
  ) {}

  buildStrategy(topicRow: ClaimedTopic): SeoStrategy {
    const strategy: SeoStrategy = defaultStrategy(
      topicRow.topic,
      topicRow.categorySlug,
      topicRow.targetLocation ?? 'Guntur, Andhra Pradesh',
      topicRow.language,
    );
    if (topicRow.primaryKeyword) {
      strategy.primaryKeyword = topicRow.primaryKeyword;
    }
    if (topicRow.keywords && topicRow.keywords.length > 0) {
      strategy.secondaryKeywords = topicRow.keywords;
    }
    if (topicRow.searchIntent && VALID_INTENTS.has(topicRow.searchIntent)) {
      strategy.searchIntent = topicRow.searchIntent as SearchIntent;
    } else if (topicRow.referenceSources?.length) {
      strategy.searchIntent = (strategy.searchIntent ?? 'INFORMATIONAL') as SearchIntent;
    }
    return strategy;
  }

  async composeArticle(
    topicRow: ClaimedTopic,
    categoryExists: boolean,
    existingSlugs: Set<string>,
    existingTitles: Set<string>,
    topicKeyTaken: boolean,
  ): Promise<ComposedArticle> {
    const { topicKey, topic, categorySlug, language } = topicRow;
    const strategy = this.buildStrategy(topicRow);

    const draft = await this.researchService.generateArticle(
      topic,
      categorySlug,
      topicRow.targetLocation ?? undefined,
      strategy,
      language,
    );
    const llmProvider = draft.llmProvider ?? 'unknown';

    const images = await this.imageService.sourceImagesForArticle(topic, categorySlug, 4);
    const coverImage =
      images[0]?.url ||
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80';
    const enrichedContent = this.enrichContent(draft.content, images);
    const wordCount = enrichedContent.split(/\s+/).length;

    const similarity = await this.similarityService.check({
      topic,
      title: draft.title,
      slug: draft.slug,
      primaryKeyword: draft.primaryKeyword,
      secondaryKeywords: draft.secondaryKeywords,
      searchIntent: draft.searchIntent,
      content: enrichedContent,
      language,
    });

    const validation = this.validationService.validate({
      topicKey,
      topic,
      draft,
      categorySlug,
      categoryExists,
      similarity,
      topicKeyTaken,
      existingSlugs,
      existingTitles,
      wordCount,
      language,
    });

    const similaritySummary = similarity.nearest
      ? `${similarity.nearest.score.toFixed(2)} vs ${similarity.nearest.slug} [${similarity.nearest.reasons.join(', ')}]`
      : 'no overlap';

    return {
      draft,
      enrichedContent,
      images,
      coverImage,
      wordCount,
      similarity,
      similaritySummary,
      validation,
      llmProvider,
      strategy,
    };
  }

  enrichContent(rawContent: string, images: LicensedImage[]): string {
    let content = rawContent;

    if (images.length > 1) {
      const img1 = images[1];
      const img2 = images[2];
      const md1 = `\n\n![${img1.alt}](${img1.url})\nCaption: ${img1.caption} (${img1.licenseType})\n\n`;
      const md2 = img2 ? `\n\n![${img2.alt}](${img2.url})\nCaption: ${img2.caption} (${img2.licenseType})\n\n` : '';

      const p1 = content.split('## 3. ');
      if (p1.length === 2) content = `${p1[0]}${md1}## 3. ${p1[1]}`;
      const p2 = content.split('## 5. ');
      if (p2.length === 2 && md2) content = `${p2[0]}${md2}## 5. ${p2[1]}`;
    }

    return content
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/\*\*/g, '');
  }
}
