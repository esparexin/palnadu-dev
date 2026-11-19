import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlogLanguage, PublishStatus, TopicStatus } from '@prisma/client';
import { BlogService } from '../dist/blog/blog.service.js';
import { resolveUniqueManualTopicKey } from '../dist/blog/blog-topic-key.util.js';
import { findAllAdminBlogPosts, findOneAdminBlogPost } from '../dist/blog/blog-query.util.js';

describe('Blog Automation & Admin Blog Root Cause Regression Tests', () => {
  describe('Fix 1: Manual Blog Post TopicKey Disambiguation (Prevents 409 Conflict)', () => {
    it('returns canonical baseKey when no prior post exists with that topicKey in language', async () => {
      const mockPrisma = {
        blogPost: {
          findUnique: async () => null,
        },
      };

      const key = await resolveUniqueManualTopicKey(
        mockPrisma,
        'Web Development Services in Guntur',
        'web-dev-services-guntur',
        BlogLanguage.en,
      );

      assert.equal(key, 'subject-web-dev-guntur-local');
    });

    it('disambiguates topicKey when a post already exists with the same concept in language', async () => {
      const existingKey = 'subject-web-dev-guntur-local';
      const mockPrisma = {
        blogPost: {
          findUnique: async (args) => {
            const requested = args.where.topicKey_language.topicKey;
            if (requested === existingKey) {
              return { id: 'post-existing-1', slug: 'web-dev-services-guntur' };
            }
            return null;
          },
        },
      };

      const key = await resolveUniqueManualTopicKey(
        mockPrisma,
        'Custom Web Development for Businesses in Guntur',
        'custom-web-dev-businesses-guntur',
        BlogLanguage.en,
      );

      assert.notEqual(key, existingKey);
      assert.ok(key.startsWith(existingKey));
      assert.ok(key.includes('custom-web-dev-businesses-guntur'));
    });

    it('handles numeric suffix disambiguation if slug candidate is also taken', async () => {
      const existingKey = 'subject-web-dev-guntur-local';
      const slugClash = `${existingKey}-custom-web-dev-businesses-guntur`;
      const mockPrisma = {
        blogPost: {
          findUnique: async (args) => {
            const requested = args.where.topicKey_language.topicKey;
            if (requested === existingKey || requested === slugClash) {
              return { id: 'post-clash', slug: 'other-slug' };
            }
            return null;
          },
        },
      };

      const key = await resolveUniqueManualTopicKey(
        mockPrisma,
        'Custom Web Development for Businesses in Guntur',
        'custom-web-dev-businesses-guntur',
        BlogLanguage.en,
      );

      assert.equal(key, `${existingKey}-2`);
    });
  });

  describe('Fix 2: 3-Tier Resilient Query Runner (Prevents 500 Error on Draft Listings)', () => {
    it('successfully queries posts with author and category when relations are intact', async () => {
      const mockPrisma = {
        blogPost: {
          findMany: async () => [
            {
              id: 'p1',
              title: 'Healthy Post',
              status: PublishStatus.DRAFT,
              author: { id: 'a1', name: 'Admin' },
              category: { id: 'c1', name: 'Web Dev', slug: 'website-development' },
            },
          ],
        },
      };

      const posts = await findAllAdminBlogPosts(mockPrisma, {
        where: { status: PublishStatus.DRAFT },
        skip: 0,
        limit: 10,
        orderBy: [{ createdAt: 'desc' }],
      });

      assert.equal(posts.length, 1);
      assert.equal(posts[0].author.name, 'Admin');
    });

    it('falls back to category-only query when author relation fails in MongoDB', async () => {
      let callCount = 0;
      const mockPrisma = {
        blogPost: {
          findMany: async (args) => {
            callCount++;
            if (args.include?.author) {
              throw new Error('Null constraint violation on fields: (author)');
            }
            return [
              {
                id: 'p-orphaned-author',
                title: 'Orphaned Author Post',
                status: PublishStatus.DRAFT,
                category: { id: 'c1', name: 'Web Dev', slug: 'website-development' },
              },
            ];
          },
        },
      };

      const posts = await findAllAdminBlogPosts(mockPrisma, {
        where: { status: PublishStatus.DRAFT },
        skip: 0,
        limit: 10,
        orderBy: [{ createdAt: 'desc' }],
      });

      assert.equal(callCount, 2);
      assert.equal(posts.length, 1);
      assert.equal(posts[0].title, 'Orphaned Author Post');
    });

    it('falls back to raw query when both author and category relations fail in MongoDB', async () => {
      let callCount = 0;
      const mockPrisma = {
        blogPost: {
          findMany: async (args) => {
            callCount++;
            if (args.include?.author || args.include?.category) {
              throw new Error('Null constraint violation on relation fields');
            }
            return [
              {
                id: 'p-raw-draft',
                title: 'Legacy Fallback Draft',
                status: PublishStatus.DRAFT,
              },
            ];
          },
        },
      };

      const posts = await findAllAdminBlogPosts(mockPrisma, {
        where: { status: PublishStatus.DRAFT },
        skip: 0,
        limit: 10,
        orderBy: [{ createdAt: 'desc' }],
      });

      assert.equal(callCount, 3);
      assert.equal(posts.length, 1);
      assert.equal(posts[0].id, 'p-raw-draft');
    });

    it('findOneAdminBlogPost gracefully falls back to raw post if relations fail', async () => {
      let callCount = 0;
      const mockPrisma = {
        blogPost: {
          findUnique: async (args) => {
            callCount++;
            if (args.include?.author || args.include?.category) {
              throw new Error('Malformed ObjectID or orphaned relation reference');
            }
            return { id: 'p-single', title: 'Single Draft Post' };
          },
        },
      };

      const post = await findOneAdminBlogPost(mockPrisma, 'p-single');
      assert.equal(callCount, 3);
      assert.equal(post.id, 'p-single');
    });
  });

  describe('Fix 3: Blog Automation Draft Persistence on Quality Warnings (Prevents 400 Bad Request)', () => {
    it('BlogService.findAllAdmin succeeds even if draft items contain relation anomalies', async () => {
      const mockPrisma = {
        blogPost: {
          findMany: async (args) => {
            if (args.include?.author || args.include?.category) {
              throw new Error('Relation error on draft document');
            }
            return [{ id: 'draft-1', title: 'Recovered Draft', status: PublishStatus.DRAFT }];
          },
          count: async () => 1,
        },
      };

      const service = new BlogService(mockPrisma);
      const res = await service.findAllAdmin({ status: PublishStatus.DRAFT, page: 1, limit: 10 });
      assert.equal(res.data.length, 1);
      assert.equal(res.data[0].id, 'draft-1');
      assert.equal(res.meta.total, 1);
    });
  });
});
