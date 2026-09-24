import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { ContentResearchService } from './content-research.service';
import { ImageSourcingService } from './image-sourcing.service';
import { PublishStatus } from '@prisma/client';

export interface GenerationResult {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: PublishStatus;
  wordCount: number;
  imagesCount: number;
  url: string;
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
   * Identifies queue items that haven't been generated in the database yet.
   * If predefined items are completed, dynamically generates new candidate topics
   * so the automation never stalls or repeats existing articles.
   */
  async getPendingQueueItems() {
    const existingPosts = await this.prisma.blogPost.findMany({
      select: { title: true, slug: true },
    });
    const existingSlugs = new Set(existingPosts.map((p) => p.slug));
    const existingTitles = new Set(existingPosts.map((p) => p.title.toLowerCase().trim()));

    const baseQueue = this.topicQueue.map((item) => {
      const slug = item.topic
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const isGenerated = existingSlugs.has(slug) || existingTitles.has(item.topic.toLowerCase().trim());
      return {
        ...item,
        slug,
        isGenerated,
        status: isGenerated ? ('COMPLETED' as const) : ('PENDING' as const),
      };
    });

    const pending = baseQueue.filter((item) => !item.isGenerated);

    // If static queue is exhausted or low, dynamically generate next batch candidates
    if (pending.length < 10) {
      for (const s of this.dynamicServices) {
        for (const loc of this.dynamicLocations) {
          const topic = `How ${s.service} Modernizes Growing Businesses in ${loc}`;
          const slug = topic
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

          if (!existingSlugs.has(slug) && !existingTitles.has(topic.toLowerCase().trim())) {
            baseQueue.push({
              categorySlug: s.category,
              topic,
              targetLocation: `${loc}, Andhra Pradesh`,
              slug,
              isGenerated: false,
              status: 'PENDING' as const,
            });
          }
        }
      }
    }

    return baseQueue;
  }

  /**
   * Returns the next pending topic in the rotation queue
   */
  async getNextPendingTopic() {
    const queueStatus = await this.getPendingQueueItems();
    return queueStatus.find((item) => !item.isGenerated) || queueStatus[0];
  }

  /**
   * Daily Automated Cron Job: Runs at 05:00 AM IST
   * Automatically executes the 5-post daily batch
   */
  @Cron('0 23 * * *') // 23:00 UTC = 05:00 IST
  async handleDailyCron() {
    this.logger.log('Starting automated daily blog generation batch (5 articles)...');
    try {
      const results = await this.generateBatch(5);
      this.logger.log(`Daily blog automation batch completed successfully. Generated ${results.length} articles.`);
    } catch (err) {
      this.logger.error(`Daily blog automation cron failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Generates a batch of distinct articles across rotating categories,
   * prioritizing pending ungenerated topics first.
   */
  async generateBatch(count = 5, forcePublish = false): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];
    const queueStatus = await this.getPendingQueueItems();
    const pendingItems = queueStatus.filter((item) => !item.isGenerated);

    // Only generate pending (ungenerated) items — never re-run already-generated posts
    const queue = pendingItems.slice(0, count);

    if (queue.length === 0) {
      this.logger.log('All topics in queue have been generated. No new articles to create.');
      return results;
    }

    for (const item of queue) {
      try {
        const generated = await this.generateSingleArticle(item.topic, item.categorySlug, item.targetLocation, forcePublish);
        results.push(generated);
      } catch (err) {
        this.logger.error(`Failed generating article for "${item.topic}": ${err instanceof Error ? err.message : err}`);
      }
    }

    return results;
  }

  /**
   * Generates, verifies, sources images, and saves an article to the database
   */
  async generateSingleArticle(
    topic: string,
    categorySlug: string,
    targetLocation?: string,
    forcePublish = false,
  ): Promise<GenerationResult> {
    this.logger.log(`Generating automated article for: "${topic}" [${categorySlug}]`);

    // 1. Get or create category
    let category = await this.prisma.blogCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      category = await this.prisma.blogCategory.findFirst();
    }

    // 2. Get author (default admin)
    const author = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (!author) {
      throw new Error('No admin author found in database for blog generation.');
    }

    // 3. Generate article text and SEO metadata
    const draft = await this.researchService.generateArticle(topic, categorySlug, targetLocation);

    // 4. Source 3 to 4 licensed images
    const images = await this.imageService.sourceImagesForArticle(topic, categorySlug, 4);
    const coverImage = images[0]?.url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80';

    // 5. Inject inline images with attribution into the markdown body
    let enrichedContent = draft.content;
    if (images.length > 1) {
      const inlineImg1 = images[1];
      const inlineImg2 = images[2];

      const img1Markdown = `\n\n![${inlineImg1.alt}](${inlineImg1.url})\nCaption: ${inlineImg1.caption} (${inlineImg1.licenseType})\n\n`;
      const img2Markdown = inlineImg2
        ? `\n\n![${inlineImg2.alt}](${inlineImg2.url})\nCaption: ${inlineImg2.caption} (${inlineImg2.licenseType})\n\n`
        : '';

      // Inject after Section 2 and Section 4
      const parts = enrichedContent.split('## 3. ');
      if (parts.length === 2) {
        enrichedContent = `${parts[0]}${img1Markdown}## 3. ${parts[1]}`;
      }

      const parts2 = enrichedContent.split('## 5. ');
      if (parts2.length === 2 && img2Markdown) {
        enrichedContent = `${parts2[0]}${img2Markdown}## 5. ${parts2[1]}`;
      }
    }

    // Sanitize any remaining asterisks (**bold** or *italic*) to maintain clean editorial typography
    enrichedContent = enrichedContent
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/\*\*/g, '');

    // 6. Check if auto-publish is enabled in settings
    let shouldPublish = forcePublish;
    if (!shouldPublish) {
      const autoPublishSetting = await this.prisma.siteSetting.findUnique({
        where: { key: 'auto_publish_blogs' },
      });
      shouldPublish = autoPublishSetting?.value === true;
    }

    const publishStatus: PublishStatus = shouldPublish ? PublishStatus.PUBLISHED : PublishStatus.DRAFT;

    // 7. Upsert to database
    const post = await this.prisma.blogPost.upsert({
      where: { slug: draft.slug },
      update: {
        title: draft.title,
        excerpt: draft.excerpt,
        content: enrichedContent,
        coverImage: coverImage,
        categoryId: category?.id,
        authorId: author.id,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        canonicalUrl: draft.canonicalUrl,
        ogImage: coverImage,
        status: publishStatus,
        imageMetadata: images as any,
        faqData: draft.faq as any,
      },
      create: {
        title: draft.title,
        slug: draft.slug,
        excerpt: draft.excerpt,
        content: enrichedContent,
        coverImage: coverImage,
        categoryId: category?.id,
        authorId: author.id,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        canonicalUrl: draft.canonicalUrl,
        ogImage: coverImage,
        status: publishStatus,
        publishDate: shouldPublish ? new Date() : null,
        imageMetadata: images as any,
        faqData: draft.faq as any,
      },
    });

    // 8. Create admin notification
    await this.prisma.notification.create({
      data: {
        title: shouldPublish ? 'Automated Blog Published' : 'New Blog Draft Ready for Review',
        message: `"${post.title}" was generated with ${images.length} licensed images and is currently ${publishStatus}.`,
        type: 'BLOG_AUTOMATION',
        read: false,
        data: {
          postId: post.id,
          slug: post.slug,
          status: publishStatus,
        },
      },
    });

    this.logger.log(`Blog successfully saved to DB: "${post.title}" [${publishStatus}]`);

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      category: category?.name || categorySlug,
      status: publishStatus,
      wordCount: enrichedContent.split(/\s+/).length,
      imagesCount: images.length,
      url: `/blog/${post.slug}`,
    };
  }

  /**
   * Returns current automation status and scheduled topic queue
   */
  async getStatus() {
    const totalPosts = await this.prisma.blogPost.count();
    const draftPosts = await this.prisma.blogPost.count({ where: { status: 'DRAFT' } });
    const publishedPosts = await this.prisma.blogPost.count({ where: { status: 'PUBLISHED' } });
    const archivedPosts = await this.prisma.blogPost.count({ where: { status: 'ARCHIVED' } });

    const autoPublishSetting = await this.prisma.siteSetting.findUnique({
      where: { key: 'auto_publish_blogs' },
    });

    const queueStatus = await this.getPendingQueueItems();
    const pendingCount = queueStatus.filter((i) => !i.isGenerated).length;
    const completedCount = queueStatus.filter((i) => i.isGenerated).length;

    return {
      engineStatus: 'active',
      schedule: 'Daily at 05:00 IST (23:00 UTC)',
      autoPublishEnabled: autoPublishSetting?.value === true,
      statistics: {
        totalPosts,
        draftPosts,
        publishedPosts,
        archivedPosts,
        queuePending: pendingCount,
        queueCompleted: completedCount,
      },
      upcomingQueue: queueStatus,
    };
  }
}
