import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { ContentResearchService } from './content-research.service';
import { defaultStrategy, SeoStrategy } from './seo-strategy';
import { ImageSourcingService } from './image-sourcing.service';
import { ContentSimilarityService } from './content-similarity.service';
import { SeoValidationService } from './seo-validation.service';
import { TopicDiscoveryService } from './topic-discovery.service';
import { DiscoveredTopic } from './seo-sources';
import { canonicalizeTopic, SearchIntent, toTopicKey } from './topic-identity';
import { PublishStatus, TopicStatus, BlogLanguage } from '@prisma/client';

export interface GenerationResult {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: PublishStatus;
  wordCount: number;
  imagesCount: number;
  url: string;
  topicKey: string;
}

/** A topic offered to the queue, before dedup is applied. */
export interface QueueCandidate {
  categorySlug: string;
  topic: string;
  targetLocation?: string;
  searchIntent?: SearchIntent;
  primaryKeyword?: string;
  keywords?: string[];
  referenceSources?: string[];
  source: 'curated-rotation' | 'matrix' | 'discovery' | 'manual';
  /** Language to generate in. Defaults to English; the per-cycle bilingual
   *  allocator (not yet enabled) will set this per quota. */
  language?: BlogLanguage;
}

/** A queue row leased by one worker for the duration of a generation attempt. */
export type ClaimedTopic = {
  id: string;
  topicKey: string;
  topic: string;
  categorySlug: string;
  targetLocation: string | null;
  referenceSources: string[];
  status: TopicStatus;
  language: BlogLanguage;
};

/** Why a candidate topic was not turned into a post. */
export type RejectionReason =
  | 'already_generated'
  | 'similar_to_existing'
  | 'validation_failed'
  | 'generation_failed'
  | 'no_category';

export interface RejectedTopic {
  topicKey: string;
  topic: string;
  reason: RejectionReason;
  detail: string;
}

@Injectable()
export class BlogAutomationService {
  private readonly logger = new Logger(BlogAutomationService.name);

  // Strategic topic rotation queue across all primary categories
  private readonly topicQueue = [
    {
      categorySlug: 'startups',
      topic: 'How to Build a SaaS Product in Guntur and Scale Nationally',
      targetLocation: 'Guntur and Palnadu, Andhra Pradesh',
    },
    {
      categorySlug: 'website-development',
      topic: 'Next.js vs Traditional PHP: Why Modern Businesses Are Upgrading in 2026',
      targetLocation: 'Andhra Pradesh',
    },
    {
      categorySlug: 'app-development',
      topic: 'Android and iOS App Development for Retail and Wholesale Businesses in Guntur',
      targetLocation: 'Guntur and Vijayawada',
    },
    {
      categorySlug: 'school-websites',
      topic: 'How Digital Admissions and Fee Portals Save 20+ Hours for Schools in Palnadu',
      targetLocation: 'Narasaraopet and Palnadu District',
    },
    {
      categorySlug: 'local-seo-business',
      topic: 'How to Get Your Guntur and Palnadu Business Found on Google (Local SEO Playbook)',
      targetLocation: 'Palnadu and Guntur',
    },
    {
      categorySlug: 'website-development',
      topic: 'Affordable Website Development for Small Businesses in Palnadu Without Hidden Costs',
      targetLocation: 'Palnadu District',
    },
    {
      categorySlug: 'app-development',
      topic: 'Progressive Web Apps vs Native Apps: Which Delivers Highest ROI for Regional Traders?',
      targetLocation: 'Chilakaluripet and Guntur',
    },
    {
      categorySlug: 'startups',
      topic: 'From Idea to MVP: A Step-by-Step Technical Guide for Andhra Pradesh Entrepreneurs',
      targetLocation: 'Andhra Pradesh',
    },
    // ── Location + Service + Customer/Industry Master Formula Queue ──
    {
      categorySlug: 'school-websites',
      topic: 'How School Management Software and Digital Fee Portals Save 20+ Hours in Narasaraopet',
      targetLocation: 'Narasaraopet and Palnadu District',
    },
    {
      categorySlug: 'website-development',
      topic: 'Why Retail Shops and Wholesale Traders in Chilakaluripet Need Custom Billing and POS Software',
      targetLocation: 'Chilakaluripet and NH-16 Corridor',
    },
    {
      categorySlug: 'app-development',
      topic: 'Building Mobile Apps and Online Storefronts for Wholesale Rice and Cotton Merchants in Sattenapalli',
      targetLocation: 'Sattenapalli and Palnadu',
    },
    {
      categorySlug: 'website-development',
      topic: 'How Hospital and Clinic Management Software Streamlines Patient Appointments in Guntur',
      targetLocation: 'Guntur and Coastal Andhra',
    },
    {
      categorySlug: 'local-seo-business',
      topic: 'Affordable Business Websites and Local Google Maps SEO for Growing Enterprises in Vinukonda',
      targetLocation: 'Vinukonda and Palnadu',
    },
    {
      categorySlug: 'website-development',
      topic: 'Weighbridge, Gate Pass, and Logistics Dispatch Software for Industrial Enterprises in Macherla',
      targetLocation: 'Macherla and Nagarjuna Sagar',
    },
    {
      categorySlug: 'startups',
      topic: 'From Idea to Scalable Web Platform: Tech Stack Guide for Startups in Tenali and Mangalagiri',
      targetLocation: 'Tenali, Mangalagiri, and Guntur',
    },
    {
      categorySlug: 'website-development',
      topic: 'Why Medical Shops and Pharmacies in Palnadu Are Upgrading to Cloud Billing Software in 2026',
      targetLocation: 'Palnadu and Narasaraopet',
    },
  ];

  constructor(
    private prisma: PrismaService,
    private researchService: ContentResearchService,
    private imageService: ImageSourcingService,
    private similarityService: ContentSimilarityService,
    private validationService: SeoValidationService,
    private discoveryService: TopicDiscoveryService,
  ) {}

  // Dynamic Industry & Regional Matrix to ensure perpetual topic generation
  private readonly dynamicServices = [
    { service: 'Cloud ERP and Billing Software', category: 'website-development' },
    { service: 'E-Commerce Portals and Online Ordering Apps', category: 'app-development' },
    { service: 'Digital Admissions and School Management Platforms', category: 'school-websites' },
    { service: 'Clinic and Diagnostic Lab Management Systems', category: 'website-development' },
    { service: 'Rice Mill Gate-Pass and Inventory Software', category: 'website-development' },
    { service: 'Cotton Ginning Dispatch and Weighbridge Automation', category: 'website-development' },
    { service: 'Mobile Field Sales and Delivery Tracking Apps', category: 'app-development' },
    { service: 'Local Google Maps SEO and Search Authority', category: 'local-seo-business' },
    { service: 'Cold Storage Stock and Dispatch Systems', category: 'website-development' },
    { service: 'Automobile Service and Spare Parts Billing POS', category: 'website-development' },
    { service: 'Real Estate Property Portals and Inflow Systems', category: 'website-development' },
    { service: 'Microfinance and Loan Accounting Software', category: 'startups' },
  ];

  private readonly dynamicLocations = [
    'Narasaraopet',
    'Guntur',
    'Chilakaluripet',
    'Vinukonda',
    'Sattenapalli',
    'Macherla',
    'Piduguralla',
    'Tenali',
    'Mangalagiri',
    'Bapatla',
    'Palnadu District',
    'Andhra Pradesh',
  ];

  /**
   * Normalizes a topic string into its stable identity key.
   *
   * Identity is defined in topic-identity.ts and deliberately excludes
   * LLM-authored title/slug text. `toTopicKey` is a thin alias so call sites
   * read clearly.
   */
  private toTopicKey(topic: string): string {
    return toTopicKey(topic);
  }

  /**
   * Returns the queue of topics, reading the durable BlogTopic table.
   *
   * Topics live in the database rather than in memory so a restart, a second
   * worker, or an overlapping cron tick cannot re-run a topic that is already
   * completed or in flight.
   */
  async getPendingQueueItems() {
    // Generated identity is per (topicKey, language): an English post must not
    // mark its Telugu counterpart as done, or translations could never be made.
    const generatedKeys = new Set(
      (await this.prisma.blogPost.findMany({ select: { topicKey: true, language: true } })).map(
        (p) => `${p.topicKey}::${p.language}`,
      ),
    );

    // The curated rotation is a seed, not the source of truth. It is upserted so
    // existing queue rows (and their status) are preserved.
    const seeds: QueueCandidate[] = [
      ...this.topicQueue.map(
        (t): QueueCandidate => ({ ...t, source: 'curated-rotation' }),
      ),
      ...this.matrixCandidates(generatedKeys),
    ];

    for (const seed of seeds) {
      await this.enqueueTopic(seed);
    }

    const rows = await this.prisma.blogTopic.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => {
      const done =
        row.status === TopicStatus.COMPLETED || generatedKeys.has(`${row.topicKey}::${row.language}`);
      return {
        topicKey: row.topicKey,
        topic: row.topic,
        categorySlug: row.categorySlug,
        targetLocation: row.targetLocation,
        searchIntent: (row.searchIntent as SearchIntent) ?? null,
        primaryKeyword: row.primaryKeyword,
        referenceSources: row.referenceSources,
        slug: row.topicKey,
        language: row.language,
        isGenerated: done,
        status: done
          ? ('COMPLETED' as const)
          : row.status === TopicStatus.CLAIMED
            ? ('CLAIMED' as const)
            : row.status === TopicStatus.FAILED
              ? ('FAILED' as const)
              : ('PENDING' as const),
        attempts: row.attempts,
      };
    });
  }

  /**
   * Expands the service x location matrix, filtered by topics already generated
   * or queued so the matrix cannot re-offer a topic that is done.
   */
  private matrixCandidates(generatedKeys: Set<string>): QueueCandidate[] {
    const out: QueueCandidate[] = [];
    const seen = new Set<string>();

    for (const s of this.dynamicServices) {
      for (const loc of this.dynamicLocations) {
        const topic = `How ${s.service} Modernizes Growing Businesses in ${loc}`;
        const topicKey = toTopicKey(topic);
        // Matrix seeds are English; scope the check to the English identity.
        if (generatedKeys.has(`${topicKey}::${BlogLanguage.en}`) || seen.has(topicKey)) continue;
        seen.add(topicKey);
        out.push({
          categorySlug: s.category,
          topic,
          targetLocation: `${loc}, Andhra Pradesh`,
          source: 'matrix',
        });
      }
    }
    return out;
  }

  /**
   * Adds a topic to the durable queue, but ONLY after the topic-level duplicate
   * check. Both a topicKey match and a substantial overlap with an existing
   * article cause the topic to be refused.
   */
  async enqueueTopic(candidate: QueueCandidate): Promise<{ enqueued: boolean; topicKey: string; reason?: string }> {
    const topicKey = toTopicKey(candidate.topic);
    if (!topicKey) return { enqueued: false, topicKey: '', reason: 'empty topic' };
    const language = candidate.language ?? BlogLanguage.en;

    // 1. Exact identity check against the unique index, scoped to language so
    //    a Telugu row never collides with its English counterpart.
    const existing = await this.prisma.blogTopic.findUnique({
      where: { topicKey_language: { topicKey, language } },
    });
    if (existing) return { enqueued: false, topicKey, reason: 'already queued' };

    // 2. Same for anything already published, in the same language.
    const generated = await this.prisma.blogPost.findUnique({
      where: { topicKey_language: { topicKey, language } },
      select: { id: true },
    });
    if (generated) return { enqueued: false, topicKey, reason: 'already generated' };

    // 3. Similarity check: a differently-worded topic covering the same subject
    //    is refused, rather than re-titled into a second article. Scoped to the
    //    candidate language so a Telugu topic is never refused merely because
    //    its English counterpart exists.
    const similarity = await this.similarityService.isLikelyDuplicateTopic(
      candidate.topic,
      new Set(),
      language,
    );
    if (similarity) {
      return { enqueued: false, topicKey, reason: 'overlaps existing content' };
    }

    const canonical = canonicalizeTopic(candidate.topic);

    try {
      await this.prisma.blogTopic.create({
        data: {
          topicKey,
          topic: candidate.topic,
          // Queued language travels with the row from here on: claim,
          // generation, validation and persistence all read it back rather
          // than assuming English.
          language,
          categorySlug: candidate.categorySlug,
          targetLocation: candidate.targetLocation ?? null,
          searchIntent: candidate.searchIntent ?? canonical.intent,
          primaryKeyword: candidate.primaryKeyword ?? canonical.normalizedTopic,
          keywords: candidate.keywords ?? [],
          referenceSources: candidate.referenceSources ?? [],
        },
      });
      return { enqueued: true, topicKey };
    } catch (err: any) {
      // Lost a race against a concurrent enqueue; the unique index did its job.
      if (err?.code === 'P2002') {
        return { enqueued: false, topicKey, reason: 'duplicate topicKey (unique index)' };
      }
      throw err;
    }
  }

  /**
   * Pulls newly discovered search opportunities into the queue.
   * Discovery output is filtered through the same duplicate check as curated
   * topics, so this can never bypass dedup.
   */
  async discoverAndEnqueue(limit = 40): Promise<{ discovered: number; enqueued: number; rejected: string[] }> {
    const candidates = await this.discoveryService.discover(limit);
    let enqueued = 0;
    const rejected: string[] = [];

    for (const c of candidates) {
      const res = await this.enqueueTopic({
        categorySlug: this.inferCategory(c),
        topic: c.phrase,
        targetLocation: c.sources.join(', '),
        searchIntent: c.intent,
        primaryKeyword: c.primaryKeyword,
        keywords: [...c.secondaryKeywords, ...c.longTailKeywords],
        referenceSources: c.sources,
        source: 'discovery',
      });
      if (res.enqueued) enqueued += 1;
      else rejected.push(`${c.phrase}: ${res.reason}`);
    }

    this.logger.log(
      `discovery: ${candidates.length} candidates, ${enqueued} enqueued, ${rejected.length} rejected as duplicates`,
    );
    return { discovered: candidates.length, enqueued, rejected };
  }

  /** Best-effort category mapping for discovered topics. */
  private inferCategory(c: DiscoveredTopic): string {
    const p = `${c.phrase} ${c.primaryKeyword}`.toLowerCase();
    if (/\bseo\b/.test(p)) return 'local-seo-business';
    if (/mobile app|android|ios|app development/.test(p)) return 'app-development';
    if (/school|admission|fee portal/.test(p)) return 'school-websites';
    if (/saas|mvp|startup|idea to/.test(p)) return 'startups';
    return 'website-development';
  }

  /**
   * Atomically claims the next workable topic.
   *
   * A lease (claimedAt/claimedBy) prevents two workers from processing the same
   * row. Expired leases are reclaimable, so a crashed worker does not strand a
   * topic forever.
   */
  private async claimNextTopic(workerId: string, maxAttempts: number): Promise<ClaimedTopic | null> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - 30 * 60 * 1000);

    const candidate = await this.prisma.blogTopic.findFirst({
      where: {
        status: TopicStatus.PENDING,
        attempts: { lt: maxAttempts },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!candidate) return null;

    const claim = await this.prisma.blogTopic.updateMany({
      where: {
        id: candidate.id,
        // Only claim if still pending, so two workers cannot both win.
        status: { in: [TopicStatus.PENDING, TopicStatus.FAILED] },
        OR: [{ claimedAt: null }, { claimedAt: { lt: staleBefore } }],
      },
      data: { status: TopicStatus.CLAIMED, claimedAt: now, claimedBy: workerId },
    });

    if (claim.count === 0) return null; // lost the race
    return { ...candidate, status: TopicStatus.CLAIMED };
  }

  /** Returns a failed topic to the queue for a later retry. Never deletes it. */
  private async releaseTopic(
    topicKey: string,
    language: BlogLanguage,
    error: string,
    nextRetryAt: Date,
  ): Promise<void> {
    const row = await this.prisma.blogTopic.findUnique({
      where: { topicKey_language: { topicKey, language } },
    });
    if (!row) return;

    await this.prisma.blogTopic.update({
      where: { topicKey_language: { topicKey, language } },
      data: {
        // The topic stays in the queue. Only the attempt counter advances, so a
        // transient LLM failure does not permanently remove the topic.
        status: row.attempts + 1 >= this.maxAttempts ? TopicStatus.FAILED : TopicStatus.PENDING,
        lastError: error.slice(0, 500),
        nextRetryAt,
        claimedAt: null,
        claimedBy: null,
      },
    });
  }

  /**
   * Daily cron at 05:00 IST. Discovers new opportunities, tops up the queue, then
   * generates a batch.
   */
  @Cron('0 23 * * *') // 23:00 UTC = 05:00 IST
  async handleDailyCron() {
    const workerId = `cron:${process.pid}`;
    this.logger.log('Starting automated daily blog generation batch (5 articles)...');
    try {
      // Keep the queue stocked from live search signals first.
      try {
        await this.discoverAndEnqueue();
      } catch (err) {
        this.logger.warn(`discovery step failed (non-fatal): ${String(err)}`);
      }

      const { results, rejected } = await this.generateBatch(5, false, workerId);
      this.logger.log(
        `Daily blog automation batch completed. ${results.length} generated, ${rejected.length} rejected.`,
      );
    } catch (err) {
      this.logger.error(`Daily blog automation cron failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Generates a batch of articles.
   *
   * Topics that fail validation or similarity are skipped and the batch moves on
   * to the next unique topic, rather than regenerating the same subject.
   */
  async generateBatch(
    count = 5,
    forcePublish = false,
    workerId = `manual:${process.pid}:${Date.now()}`,
  ): Promise<{ results: GenerationResult[]; rejected: RejectedTopic[] }> {
    const results: GenerationResult[] = [];
    const rejected: RejectedTopic[] = [];

    for (let i = 0; i < count; i++) {
      const topic = await this.claimNextTopic(workerId, this.maxAttempts);
      if (!topic) break;

      const topicKey = topic.topicKey;
      try {
        const generated = await this.generateForTopic(topic, forcePublish, workerId);
        results.push(generated);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        const reason: RejectionReason =
          detail.startsWith('validation:') ? 'validation_failed' : 'generation_failed';
        rejected.push({ topicKey, topic: topic.topic, reason, detail });

        // Retryable failures return to the queue; a permanent rejection (bad
        // content) is parked so we do not burn LLM calls re-testing it forever.
        const permanent = reason === 'validation_failed';
        await this.prisma.blogTopic.update({
          where: { topicKey_language: { topicKey, language: topic.language } },
          data: {
            attempts: { increment: 1 },
            lastError: detail.slice(0, 500),
            status: permanent ? TopicStatus.FAILED : TopicStatus.PENDING,
            nextRetryAt: permanent ? null : new Date(Date.now() + this.retryDelayMs),
            claimedAt: null,
            claimedBy: null,
          },
        });
        this.logger.error(`topicKey="${topicKey}" ${reason}: ${detail}`);

        // Give up on this topic and move on so the batch still makes progress.
        if (permanent) continue;
      }
    }

    return { results, rejected };
  }

  /** Backoff window before a transient failure is retried. */
  private readonly retryDelayMs = 60 * 60 * 1000;

  /** Attempts before a topic is parked as permanently failed. */
  private readonly maxAttempts = 3;

  /**
   * Ad-hoc generation for a topic that is not (yet) in the durable queue.
   * Used by the admin "Generate now" button. Enqueues the topic first so the
   * same duplicate checks apply as for scheduled runs.
   */
  async generateSingleArticle(
    topic: string,
    categorySlug: string,
    targetLocation?: string,
    forcePublish = false,
    language: BlogLanguage = BlogLanguage.en,
  ): Promise<GenerationResult> {
    const enqueued = await this.enqueueTopic({
      categorySlug,
      topic,
      targetLocation,
      source: 'manual',
      language,
    });

    // A refusal is not fatal: the topic may already be queued or already
    // published, in which case the existing row is returned rather than
    // generating a second article for the same subject.
    const topicKey = enqueued.topicKey;
    if (!enqueued.enqueued) {
      if (!topicKey) {
        throw new Error(`Cannot generate an unnamed topic.`);
      }
      this.logger.log(`manual generate for "${topic}" refused (${enqueued.reason}); using existing row if present.`);
      const existing = await this.prisma.blogPost.findUnique({
        where: { topicKey_language: { topicKey, language } },
      });
      if (existing) {
        return {
          id: existing.id,
          title: existing.title,
          slug: existing.slug,
          category: categorySlug,
          status: existing.status,
          wordCount: existing.content.split(/\s+/).length,
          imagesCount: 0,
          url: language === BlogLanguage.te ? `/te/blog/${existing.slug}` : `/blog/${existing.slug}`,
          topicKey,
        };
      }
      // Not queued and not published, but it overlapped something. Refuse.
      throw new Error(`Topic refused: ${enqueued.reason}.`);
    }

    const queued = await this.prisma.blogTopic.findUnique({
      where: { topicKey_language: { topicKey, language } },
    });
    if (!queued) throw new Error(`Topic ${topicKey} could not be queued.`);

    return this.generateForTopic(
      queued,
      forcePublish,
      `manual:${process.pid}:${Date.now()}`,
    );
  }

  /**
   * Full pipeline for one claimed topic:
   *
   *   strategy -> generate -> images -> similarity -> validation -> persist
   *            -> audit log
   *
   * Nothing is written to blog_posts until every blocking check passes, so a
   * rejected attempt never leaves a partial blog behind.
   */
  async generateForTopic(
    topicRow: {
      topicKey: string;
      topic: string;
      categorySlug: string;
      targetLocation: string | null;
      referenceSources: string[];
      language: BlogLanguage;
    },
    forcePublish = false,
    workerId = 'manual',
  ): Promise<GenerationResult> {
    const started = Date.now();
    const { topicKey, topic, categorySlug, language } = topicRow;
    this.logger.log(`Generating ${language} article for topicKey="${topicKey}" [${categorySlug}]`);

    const logFailure = async (reason: string, extra: Record<string, unknown> = {}) => {
      await this.prisma.blogGenerationLog.create({
        data: {
          topicKey,
          topic,
          language,
          primaryKeyword: extra.primaryKeyword as string | undefined,
          secondaryKeywords: (extra.secondaryKeywords as string[] | undefined) ?? [],
          searchIntent: extra.searchIntent as string | undefined,
          referenceSources: topicRow.referenceSources ?? [],
          generatedTitle: extra.generatedTitle as string | undefined,
          generatedSlug: extra.generatedSlug as string | undefined,
          llmProvider: extra.llmProvider as string | undefined,
          validationResult: extra.validationResult as string | undefined,
          similarityResult: extra.similarityResult as string | undefined,
          failureReason: reason.slice(0, 500),
          durationMs: Date.now() - started,
        },
      });
    };

    // 1. SEO strategy. Derived from the discovered keyword signals when present.
    const strategy: SeoStrategy = defaultStrategy(
      topic,
      categorySlug,
      topicRow.targetLocation ?? 'Guntur, Andhra Pradesh',
      language,
    );
    if (topicRow.referenceSources?.length) {
      strategy.searchIntent = (strategy.searchIntent ?? 'INFORMATIONAL') as SearchIntent;
    }

    // 2. Category must exist.
    const category = await this.prisma.blogCategory.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      await logFailure(`no_category:${categorySlug}`, { primaryKeyword: strategy.primaryKeyword, searchIntent: strategy.searchIntent });
      throw new Error(`no_category: no blog category "${categorySlug}".`);
    }

    // 3. Author.
    const author = await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!author) {
      await logFailure('no_author');
      throw new Error('No admin author found in database for blog generation.');
    }

    // 4. Generate, in the queued language. Any throw here leaves the topic
    //    retryable with no row written.
    let draft;
    try {
      draft = await this.researchService.generateArticle(
        topic,
        categorySlug,
        topicRow.targetLocation ?? undefined,
        strategy,
        language,
      );
    } catch (err) {
      await logFailure(`generation_failed: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
    const llmProvider = (draft as any).llmProvider ?? 'unknown';

    // 5. Images and inline enrichment.
    const images = await this.imageService.sourceImagesForArticle(topic, categorySlug, 4);
    const coverImage = images[0]?.url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80';
    const enrichedContent = this.enrichContent(draft.content, images);

    const wordCount = enrichedContent.split(/\s+/).length;

    // 6. Similarity check against everything already on the site. Same-language
    //    overlap is a duplicate; cross-language overlap on the same topicKey is
    //    a translation candidate and must NOT block generation.
    const similarity = await this.similarityService.check(
      {
        topic,
        title: draft.title,
        slug: draft.slug,
        primaryKeyword: draft.primaryKeyword,
        secondaryKeywords: draft.secondaryKeywords,
        searchIntent: draft.searchIntent,
        content: enrichedContent,
        language,
      },
    );

    // 7. Full publishing validation gate. Slug/title collision sets are scoped
    //    to this language: slugs are only unique per locale, and a Telugu title
    //    can never collide with an English one.
    const [existingSlugs, existingTitles, sameTopicSameLang] = await Promise.all([
      this.prisma.blogPost.findMany({ where: { language }, select: { slug: true } }),
      this.prisma.blogPost.findMany({ where: { language }, select: { title: true } }),
      this.prisma.blogPost.findUnique({
        where: { topicKey_language: { topicKey, language } },
        select: { id: true },
      }),
    ]);

    const validation = this.validationService.validate({
      topicKey,
      topic,
      draft,
      categorySlug,
      categoryExists: !!category,
      similarity,
      topicKeyTaken: !!sameTopicSameLang, // + re-checked atomically by the unique index on insert
      existingSlugs: new Set(existingSlugs.map((p) => p.slug)),
      existingTitles: new Set(existingTitles.map((p) => p.title.toLowerCase().trim())),
      wordCount,
    });

    const similaritySummary = similarity.nearest
      ? `${similarity.nearest.score.toFixed(2)} vs ${similarity.nearest.slug} [${similarity.nearest.reasons.join(', ')}]`
      : 'no overlap';

    if (!validation.passed) {
      // Reject and move on to another topic. No post row is created.
      await logFailure('validation_failed', {
        primaryKeyword: draft.primaryKeyword,
        secondaryKeywords: draft.secondaryKeywords,
        searchIntent: draft.searchIntent,
        generatedTitle: draft.title,
        generatedSlug: draft.slug,
        llmProvider,
        validationResult: validation.summary,
        similarityResult: similaritySummary,
      });
      throw new Error(`validation: ${validation.failures.map((f) => f.name).join(', ')}`);
    }

    // 8. Publish decision.
    //
    //    Two hard limits override the auto-publish setting:
    //      - a template-fallback draft is forced to DRAFT. Its body is identical
    //        for every topic, so publishing it unattended is the bulk-generated
    //        pattern Google treats as scaled content abuse.
    //      - an explicit forcePublish from an operator is still honoured for
    //        non-template drafts, so manual publishing stays possible.
    let shouldPublish = forcePublish;
    if (!shouldPublish) {
      const setting = await this.prisma.siteSetting.findUnique({
        where: { key: 'auto_publish_blogs' },
      });
      shouldPublish = setting?.value === true;
    }

    if (validation.forceDraft) {
      if (shouldPublish) {
        this.logger.warn(
          `topicKey="${topicKey}" produced a template-fallback draft; forcing DRAFT despite auto-publish being enabled.`,
        );
      }
      shouldPublish = false;
    }

    const publishStatus: PublishStatus = shouldPublish ? PublishStatus.PUBLISHED : PublishStatus.DRAFT;

    // 9. Persist. The unique index on (topicKey, language) is the final
    //    authority: if anything raced us, this throws rather than creating a
    //    duplicate. Explicit rather than relying on the schema default so the
    //    language of automated posts is visible at the write site.
    let post;
    try {
      post = await this.prisma.blogPost.create({
        data: {
          topicKey,
          topic,
          language,
          title: draft.title,
          slug: draft.slug,
          excerpt: draft.excerpt,
          content: enrichedContent,
          coverImage,
          categoryId: category.id,
          authorId: author.id,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
          canonicalUrl: draft.canonicalUrl,
          ogImage: coverImage,
          status: publishStatus,
          publishDate: shouldPublish ? new Date() : null,
          imageMetadata: images as any,
          faqData: draft.faq as any,
          primaryKeyword: draft.primaryKeyword,
          secondaryKeywords: draft.secondaryKeywords,
          relatedKeywords: draft.relatedKeywords,
          longTailKeywords: draft.longTailKeywords,
          searchIntent: draft.searchIntent,
          tags: draft.tags,
          internalLinks: draft.internalLinks as any,
          externalRefs: draft.externalReferences as any,
          llmProvider,
          referenceSources: topicRow.referenceSources ?? [],
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        // Database-level duplicate protection did its job.
        await logFailure('duplicate_topickey', {
          generatedTitle: draft.title,
          generatedSlug: draft.slug,
          llmProvider,
          validationResult: validation.summary,
          similarityResult: similaritySummary,
        });
        throw new Error(`duplicate_topickey: unique index rejected topicKey "${topicKey}".`);
      }
      throw err;
    }

    // 10. Mark the queue row complete and record the audit trail.
    await this.prisma.blogTopic.update({
      where: { topicKey_language: { topicKey, language } },
      data: { status: TopicStatus.COMPLETED, postId: post.id, claimedAt: null, claimedBy: null },
    });

    await this.prisma.blogGenerationLog.create({
      data: {
        topicKey,
        topic,
        language,
        postId: post.id,
        primaryKeyword: draft.primaryKeyword,
        secondaryKeywords: draft.secondaryKeywords,
        searchIntent: draft.searchIntent,
        referenceSources: topicRow.referenceSources ?? [],
        generatedTitle: draft.title,
        generatedSlug: draft.slug,
        llmProvider,
        validationResult: validation.summary,
        similarityResult: similaritySummary,
        status: publishStatus,
        publishedUrl:
          publishStatus === PublishStatus.PUBLISHED
            ? post.language === BlogLanguage.te
              ? `/te/blog/${post.slug}`
              : `/blog/${post.slug}`
            : null,
        durationMs: Date.now() - started,
      },
    });

    await this.prisma.notification.create({
      data: {
        // A template-fallback draft gets its own alert: an operator should know
        // the LLM failed and this article needs rewriting, not just reviewing.
        title: validation.forceDraft
          ? 'Automated Blog Needs Rewriting (LLM Fallback)'
          : shouldPublish
            ? 'Automated Blog Published'
            : 'New Blog Draft Ready for Review',
        message: validation.forceDraft
          ? `"${post.title}" fell back to the static template because LLM generation did not succeed. ` +
            `It was saved as a DRAFT and must be rewritten before publishing: the template body is ` +
            `identical across topics, which is treated as scaled content abuse.`
          : `"${post.title}" was generated with ${images.length} licensed images and is currently ${publishStatus}.`,
        type: 'BLOG_AUTOMATION',
        read: false,
        data: {
          postId: post.id,
          slug: post.slug,
          status: publishStatus,
          topicKey,
          llmProvider,
          templateFallback: validation.forceDraft,
        },
      },
    });

    this.logger.log(`post created topicKey="${topicKey}" [${publishStatus}] in ${Date.now() - started}ms`);

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      category: category.name,
      status: publishStatus,
      wordCount,
      imagesCount: images.length,
      url: post.language === BlogLanguage.te ? `/te/blog/${post.slug}` : `/blog/${post.slug}`,
      topicKey,
    };
  }

  /** Injects attributed inline images and strips decorative asterisks. */
  private enrichContent(rawContent: string, images: any[]): string {
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

  /** Automation status, queue health, and what the site already covers. */
  async getStatus() {
    const [totalPosts, draftPosts, publishedPosts, archivedPosts, failedTopics, claimedTopics] =
      await Promise.all([
        this.prisma.blogPost.count(),
        this.prisma.blogPost.count({ where: { status: 'DRAFT' } }),
        this.prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.blogPost.count({ where: { status: 'ARCHIVED' } }),
        this.prisma.blogTopic.count({ where: { status: TopicStatus.FAILED } }),
        this.prisma.blogTopic.count({ where: { status: TopicStatus.CLAIMED } }),
      ]);

    const autoPublishSetting = await this.prisma.siteSetting.findUnique({
      where: { key: 'auto_publish_blogs' },
    });

    const queue = await this.getPendingQueueItems();
    const coverage = await this.discoveryService.coverageReport();

    return {
      engineStatus: 'active',
      schedule: 'Daily at 05:00 IST (23:00 UTC)',
      autoPublishEnabled: autoPublishSetting?.value === true,
      referenceSources: await this.discoveryService.sourceStatuses(),
      statistics: {
        totalPosts,
        draftPosts,
        publishedPosts,
        archivedPosts,
        queuePending: queue.filter((q) => q.status === 'PENDING').length,
        queueCompleted: queue.filter((q) => q.status === 'COMPLETED').length,
        queueInFlight: claimedTopics,
        queueFailed: failedTopics,
      },
      // What the site already covers, so gaps are visible rather than guessed.
      coverage: {
        topicsCovered: coverage.topicsCovered.length,
        keywordsCovered: coverage.keywordsCovered.length,
        intentsCovered: coverage.intentsCovered,
      },
      upcomingQueue: queue.slice(0, 50),
    };
  }
}
