import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlogService } from '../dist/blog/blog.service.js';
import { PublishStatus, BlogLanguage } from '@prisma/client';
import {
  formatBlogDate,
  toIsoBlogDate,
  describeBlogDateStatus,
  PALNADU_TIMEZONE,
} from '../../../packages/config/dist/blog-date.js';

describe('Phase 3 Auto-Blogging Date, Timezone & Admin Consistency', () => {
  describe('Sorting Consistency Between Admin and Public', () => {
    it('findAllAdmin orders by publishDate desc followed by createdAt desc', async () => {
      let capturedArgs = null;
      const mockPrisma = {
        blogPost: {
          findMany: async (args) => {
            capturedArgs = args;
            return [];
          },
          count: async () => 0,
        },
      };

      const service = new BlogService(mockPrisma);
      await service.findAllAdmin({ page: 1, limit: 10 });

      assert.ok(capturedArgs, 'findMany was called');
      assert.deepEqual(capturedArgs.orderBy, [
        { publishDate: 'desc' },
        { createdAt: 'desc' },
      ]);
    });

    it('findPublished orders by publishDate desc followed by createdAt desc', async () => {
      let capturedArgs = null;
      const mockPrisma = {
        blogPost: {
          findMany: async (args) => {
            capturedArgs = args;
            return [];
          },
          count: async () => 0,
        },
      };

      const service = new BlogService(mockPrisma);
      await service.findPublished({ page: 1, limit: 10 });

      assert.ok(capturedArgs, 'findMany was called');
      assert.deepEqual(capturedArgs.orderBy, [
        { publishDate: 'desc' },
        { createdAt: 'desc' },
      ]);
    });
  });

  describe('Publication Date Transitions in BlogService', () => {
    it('sets publishDate when creating post with status PUBLISHED and no publishDate', async () => {
      let createData = null;
      const mockPrisma = {
        blogPost: {
          findUnique: async () => null,
          create: async (args) => {
            createData = args.data;
            return { id: 'post-1', ...args.data };
          },
        },
      };

      const service = new BlogService(mockPrisma);
      await service.create({
        slug: 'test-published',
        title: 'Test Published',
        content: 'Content',
        status: PublishStatus.PUBLISHED,
        author: { connect: { id: 'user-1' } },
      });

      assert.ok(createData.publishDate instanceof Date);
    });

    it('leaves publishDate undefined when creating DRAFT post', async () => {
      let createData = null;
      const mockPrisma = {
        blogPost: {
          findUnique: async () => null,
          create: async (args) => {
            createData = args.data;
            return { id: 'post-2', ...args.data };
          },
        },
      };

      const service = new BlogService(mockPrisma);
      await service.create({
        slug: 'test-draft',
        title: 'Test Draft',
        content: 'Content',
        status: PublishStatus.DRAFT,
        author: { connect: { id: 'user-1' } },
      });

      assert.equal(createData.publishDate, undefined);
    });

    it('preserves explicitly provided publishDate on creation', async () => {
      const explicitDate = new Date('2026-05-01T10:00:00.000Z');
      let createData = null;
      const mockPrisma = {
        blogPost: {
          findUnique: async () => null,
          create: async (args) => {
            createData = args.data;
            return { id: 'post-3', ...args.data };
          },
        },
      };

      const service = new BlogService(mockPrisma);
      await service.create({
        slug: 'test-explicit',
        title: 'Test Explicit',
        content: 'Content',
        status: PublishStatus.PUBLISHED,
        publishDate: explicitDate,
        author: { connect: { id: 'user-1' } },
      });

      assert.equal(createData.publishDate, explicitDate);
    });

    it('auto-sets publishDate when updating DRAFT to PUBLISHED without date', async () => {
      let updateData = null;
      const existingDraft = {
        id: 'post-draft-1',
        slug: 'test-draft-update',
        language: BlogLanguage.en,
        status: PublishStatus.DRAFT,
        publishDate: null,
      };

      const mockPrisma = {
        blogPost: {
          findUnique: async () => existingDraft,
          update: async (args) => {
            updateData = args.data;
            return { ...existingDraft, ...args.data };
          },
        },
      };

      const service = new BlogService(mockPrisma);
      await service.update('post-draft-1', {
        status: PublishStatus.PUBLISHED,
      });

      assert.ok(updateData.publishDate instanceof Date);
    });

    it('preserves existing publishDate when re-updating an already published post', async () => {
      const originalDate = new Date('2026-04-10T12:00:00.000Z');
      let updateData = null;
      const existingPublished = {
        id: 'post-pub-1',
        slug: 'test-pub-update',
        language: BlogLanguage.en,
        status: PublishStatus.PUBLISHED,
        publishDate: originalDate,
      };

      const mockPrisma = {
        blogPost: {
          findUnique: async () => existingPublished,
          update: async (args) => {
            updateData = args.data;
            return { ...existingPublished, ...args.data };
          },
        },
      };

      const service = new BlogService(mockPrisma);
      await service.update('post-pub-1', {
        title: 'Updated Title Only',
      });

      assert.equal(updateData.publishDate, undefined);
    });
  });

  describe('Timezone & Hydration Consistency via @palnadu/config', () => {
    it('uses Asia/Kolkata timezone standard', () => {
      assert.equal(PALNADU_TIMEZONE, 'Asia/Kolkata');
    });

    it('formats dates consistently in IST across midnight boundary', () => {
      // 2026-11-10 20:00:00 UTC = 2026-11-11 01:30:00 AM IST
      const utcDate = '2026-11-10T20:00:00.000Z';
      const formatted = formatBlogDate(utcDate, 'en');
      assert.equal(formatted, 'Nov 11, 2026');

      const iso = toIsoBlogDate(utcDate);
      assert.equal(iso, '2026-11-10T20:00:00.000Z');
    });

    it('distinguishes draft and published status dates', () => {
      const published = describeBlogDateStatus({
        status: 'PUBLISHED',
        publishDate: '2026-11-10T20:00:00.000Z',
        createdAt: '2026-10-01T00:00:00.000Z',
      });
      assert.equal(published.label, 'Published');
      assert.equal(published.date, 'Nov 11, 2026');

      const draft = describeBlogDateStatus({
        status: 'DRAFT',
        publishDate: null,
        createdAt: '2026-10-01T00:00:00.000Z',
      });
      assert.equal(draft.label, 'Draft');
      assert.equal(draft.date, 'Oct 1, 2026');
    });
  });
});
