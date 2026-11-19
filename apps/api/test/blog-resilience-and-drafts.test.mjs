import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { BlogLanguage, PublishStatus } from '@prisma/client';
import { BlogService } from '../dist/blog/blog.service.js';
import { BlogController } from '../dist/blog/blog.controller.js';

describe('Blog Resilience & Draft Publication Lifecycle', () => {
  it('falls back to active admin author when author connect ID does not exist', async () => {
    let capturedCreateData = null;
    const mockPrisma = {
      blogPost: {
        findUnique: async () => null,
        create: async (args) => {
          capturedCreateData = args.data;
          return { id: 'new-post-1', ...args.data };
        },
      },
      user: {
        findUnique: async () => null, // Stale author from session does not exist
        findFirst: async () => ({ id: 'admin-fallback-id' }), // Active admin exists
      },
    };
    const service = new BlogService(mockPrisma);

    const post = await service.create({
      slug: 'valid-slug',
      title: 'Valid Title',
      content: 'This is body content exceeding fifty characters minimum.',
      language: BlogLanguage.en,
      author: { connect: { id: 'stale-user-id' } },
    });

    assert.equal(post.id, 'new-post-1');
    assert.deepEqual(capturedCreateData.author, { connect: { id: 'admin-fallback-id' } });
  });

  it('allows blog creation without author if no users exist in database', async () => {
    let capturedCreateData = null;
    const mockPrisma = {
      blogPost: {
        findUnique: async () => null,
        create: async (args) => {
          capturedCreateData = args.data;
          return { id: 'new-post-2', ...args.data };
        },
      },
      user: {
        findUnique: async () => null,
        findFirst: async () => null, // No admin exists
      },
    };
    const service = new BlogService(mockPrisma);

    const post = await service.create({
      slug: 'valid-slug-2',
      title: 'Valid Title 2',
      content: 'This is body content exceeding fifty characters minimum.',
      language: BlogLanguage.en,
      author: { connect: { id: 'orphaned-id' } },
    });

    assert.equal(post.id, 'new-post-2');
    assert.equal(capturedCreateData.author, undefined);
  });

  it('rejects creation with BadRequestException when category ID is invalid', async () => {
    const mockPrisma = {
      blogPost: { findUnique: async () => null },
      blogCategory: { findUnique: async () => null },
      user: { findUnique: async () => null, findFirst: async () => null },
    };
    const service = new BlogService(mockPrisma);

    await assert.rejects(
      () =>
        service.create({
          slug: 'valid-slug-3',
          title: 'Valid Title 3',
          content: 'This is body content exceeding fifty characters minimum.',
          language: BlogLanguage.en,
          category: { connect: { id: 'non-existent-cat' } },
        }),
      (err) => err instanceof BadRequestException && /non-existent-cat/.test(err.message),
    );
  });

  it('recovers draft blog publication on update when author relation fails in MongoDB', async () => {
    let updateAttempts = 0;
    const existing = {
      id: 'draft-post-1',
      slug: 'my-draft',
      topicKey: 'my-draft',
      language: BlogLanguage.en,
      status: PublishStatus.DRAFT,
      publishDate: null,
      authorId: 'orphaned-author-id',
    };
    const mockPrisma = {
      blogPost: {
        findUnique: async () => existing,
        update: async (args) => {
          updateAttempts++;
          if (args.include?.author) {
            throw new Error('Null constraint violation on the fields: (author)');
          }
          return { ...existing, ...args.data, status: args.data.status };
        },
      },
    };
    const service = new BlogService(mockPrisma);

    const updated = await service.update('draft-post-1', {
      status: PublishStatus.PUBLISHED,
      publishDate: new Date(),
    });

    assert.equal(updated.status, PublishStatus.PUBLISHED);
    assert.equal(updateAttempts, 2); // First failed with author include, second succeeded with category include
  });

  it('recovers findBySlug when author relation fails in MongoDB', async () => {
    let findAttempts = 0;
    const mockPost = {
      id: 'pub-post-1',
      slug: 'pub-slug',
      language: BlogLanguage.en,
      status: PublishStatus.PUBLISHED,
      categoryId: null,
      translationGroupId: null,
    };
    const mockPrisma = {
      blogPost: {
        findFirst: async (args) => {
          findAttempts++;
          if (args.include?.author) {
            throw new Error('Null constraint violation on the fields: (author)');
          }
          return mockPost;
        },
        findMany: async () => [],
      },
    };
    const service = new BlogService(mockPrisma);

    const post = await service.findBySlug('pub-slug', BlogLanguage.en);
    assert.equal(post.id, 'pub-post-1');
    assert.equal(findAttempts, 2);
  });

  it('recovers blog creation when author relation throws Null constraint violation', async () => {
    let createAttempts = 0;
    const mockPrisma = {
      blogPost: {
        findUnique: async () => null,
        create: async (args) => {
          createAttempts++;
          if (args.include?.author) {
            throw new Error('Null constraint violation on the fields: (author)');
          }
          return { id: 'created-resilient', ...args.data };
        },
      },
    };
    const service = new BlogService(mockPrisma);

    const post = await service.create({
      slug: 'resilient-create',
      title: 'Resilient Title',
      content: 'This is body content exceeding fifty characters minimum.',
      language: BlogLanguage.en,
    });

    assert.equal(post.id, 'created-resilient');
    assert.equal(createAttempts, 2);
  });

  it('BlogController.create safely handles req.user with sub, id, or missing', async () => {
    let passedAuthor = null;
    const mockService = {
      create: async (data) => {
        passedAuthor = data.author;
        return { id: 'c-post-1', ...data };
      },
    };
    const controller = new BlogController(mockService);

    await controller.create(
      { title: 'Test 1', slug: 'test-1', content: 'Long enough content for validation pass...' },
      { user: { sub: 'user-sub-123' } },
    );
    assert.deepEqual(passedAuthor, { connect: { id: 'user-sub-123' } });

    await controller.create(
      { title: 'Test 2', slug: 'test-2', content: 'Long enough content for validation pass...' },
      { user: { id: 'user-id-456' } },
    );
    assert.deepEqual(passedAuthor, { connect: { id: 'user-id-456' } });

    await controller.create(
      { title: 'Test 3', slug: 'test-3', content: 'Long enough content for validation pass...' },
      { user: {} },
    );
    assert.equal(passedAuthor, undefined);
  });
});
