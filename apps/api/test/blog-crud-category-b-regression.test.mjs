import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BlogLanguage, PublishStatus } from '@prisma/client';
import { linkTranslationsSchema } from '@palnadu/validation';
import { BlogService } from '../dist/blog/blog.service.js';
import { BlogController } from '../dist/blog/blog.controller.js';
import { ZodValidationPipe } from '../dist/common/pipes/zod-validation.pipe.js';

describe('Category B Regression — Blog CRUD Service, Controller & Validation', () => {
  it('maps P2002 topicKey and slug unique violations in BlogService.create to ConflictException', async () => {
    const topicConflictPrisma = {
      blogPost: {
        findUnique: async () => null,
        create: async () => {
          const err = new Error('Unique constraint failed');
          err.code = 'P2002';
          err.meta = { target: 'blog_posts_topic_key_language_key' };
          throw err;
        },
      },
    };
    const service = new BlogService(topicConflictPrisma);
    await assert.rejects(
      () =>
        service.create({
          topicKey: 'dup-topic-key',
          slug: 'different-slug',
          title: 'Dup Topic',
          content: 'Content body',
          language: BlogLanguage.en,
          author: { connect: { id: 'user-1' } },
        }),
      (err) => err instanceof ConflictException && /topicKey/i.test(err.message),
    );

    const slugConflictPrisma = {
      blogPost: {
        findUnique: async () => null,
        create: async () => {
          const err = new Error('Unique constraint failed');
          err.code = 'P2002';
          err.meta = { target: ['language', 'slug'] };
          throw err;
        },
      },
    };
    const service2 = new BlogService(slugConflictPrisma);
    await assert.rejects(
      () =>
        service2.create({
          topicKey: 'other-topic',
          slug: 'raced-slug',
          title: 'Raced Slug',
          content: 'Content body',
          language: BlogLanguage.te,
          author: { connect: { id: 'user-1' } },
        }),
      (err) => err instanceof ConflictException && /slug/i.test(err.message),
    );
  });

  it('maps P2025 missing record in BlogService.delete to NotFoundException', async () => {
    const mockPrisma = {
      blogPost: {
        delete: async () => {
          const err = new Error('Record to delete does not exist');
          err.code = 'P2025';
          throw err;
        },
      },
    };
    const service = new BlogService(mockPrisma);
    await assert.rejects(
      () => service.delete('507f1f77bcf86cd799439011'),
      (err) => err instanceof NotFoundException && /not found/i.test(err.message),
    );
  });

  it('maps duplicate category slugs in BlogService.createCategory to ConflictException', async () => {
    const existingPrisma = {
      blogCategory: {
        findUnique: async () => ({ id: 'cat-1', name: 'SEO', slug: 'seo' }),
        create: async () => {
          throw new Error('should not reach create');
        },
      },
    };
    await assert.rejects(
      () => new BlogService(existingPrisma).createCategory({ name: 'SEO', slug: 'seo' }),
      (err) => err instanceof ConflictException && /seo/.test(err.message),
    );

    const racePrisma = {
      blogCategory: {
        findUnique: async () => null,
        create: async () => {
          const err = new Error('Unique constraint failed');
          err.code = 'P2002';
          throw err;
        },
      },
    };
    await assert.rejects(
      () => new BlogService(racePrisma).createCategory({ name: 'SEO', slug: 'seo' }),
      ConflictException,
    );
  });

  it('includes author & category on BlogService.update and allows clearing translationGroupId', async () => {
    const capturedCalls = [];
    const existing = {
      id: 'post-1',
      slug: 'post-one',
      topicKey: 'post-one',
      language: BlogLanguage.en,
      status: PublishStatus.DRAFT,
      publishDate: null,
      translationGroupId: 'tg_initial',
    };
    const mockPrisma = {
      blogPost: {
        findUnique: async () => existing,
        findMany: async () => [],
        update: async (args) => {
          capturedCalls.push(args);
          return { ...existing, ...args.data };
        },
      },
    };
    const service = new BlogService(mockPrisma);

    await service.update('post-1', { translationGroupId: null });
    await service.update('post-1', { translationGroupId: '' });
    await service.update('post-1', { title: 'Updated Title Only' });

    assert.equal(capturedCalls[0].data.translationGroupId, null);
    assert.deepEqual(capturedCalls[0].include, {
      author: { select: { id: true, name: true, avatar: true } },
      category: true,
    });
    assert.equal(capturedCalls[1].data.translationGroupId, null);
    assert.equal(capturedCalls[2].data.translationGroupId, undefined);
  });

  it('delegates publishDate transitions cleanly from BlogController without duplicate findOneAdmin', async () => {
    let findOneCalled = false;
    let updatePayload = null;
    const mockService = {
      findOneAdmin: async () => {
        findOneCalled = true;
        return null;
      },
      update: async (_id, data) => {
        updatePayload = data;
        return { id: 'post-1', ...data };
      },
    };
    const controller = new BlogController(mockService);

    await controller.update('post-1', { status: PublishStatus.PUBLISHED });
    assert.equal(findOneCalled, false);
    assert.equal(updatePayload.status, PublishStatus.PUBLISHED);
    assert.equal(updatePayload.publishDate, undefined);

    await controller.update('post-1', { status: PublishStatus.DRAFT, publishDate: null });
    assert.equal(updatePayload.publishDate, null);
  });

  it('validates linkTranslations payloads via ZodValidationPipe(linkTranslationsSchema)', async () => {
    const pipe = new ZodValidationPipe(linkTranslationsSchema);
    assert.throws(() => pipe.transform({ postIds: [] }), BadRequestException);
    assert.throws(() => pipe.transform({ postIds: ['bad-id'] }), BadRequestException);
    assert.throws(
      () =>
        pipe.transform({
          postIds: ['507f1f77bcf86cd799439011'],
          translationGroupId: '   ',
        }),
      BadRequestException,
    );

    let linkedArgs = null;
    const controller = new BlogController({
      linkTranslations: async (postIds, groupId) => {
        linkedArgs = { postIds, groupId };
        return { translationGroupId: groupId ?? 'tg_new', members: [] };
      },
    });
    const parsed = pipe.transform({
      postIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      translationGroupId: ' tg_custom ',
    });
    const res = await controller.linkTranslations(parsed);
    assert.equal(res.success, true);
    assert.deepEqual(linkedArgs, {
      postIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      groupId: 'tg_custom',
    });
  });
});

