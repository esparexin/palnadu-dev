import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createLeadSchema,
  loginSchema,
  createServiceSchema,
} from '../dist/index.js';

describe('Validation Schemas', () => {
  describe('createLeadSchema', () => {
    it('should validate a complete valid lead submission', () => {
      const validLead = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+91 9876543210',
        company: 'Innovate LLC',
        problemDescription: 'Our manual warehouse inventory tracking is causing delays.',
        currentSituation: 'Using Excel spreadsheets updated once per week.',
        projectStage: 'EXISTING_BUSINESS',
        requiredHelp: 'CUSTOM_SOFTWARE',
        budget: '$10k-$20k',
        additionalInfo: 'Looking to start in Q2.',
      };

      const result = createLeadSchema.safeParse(validLead);
      assert.equal(result.success, true);
    });

    it('should allow "NOT_SURE" for requiredHelp (problem-first philosophy)', () => {
      const lead = {
        name: 'John Smith',
        email: 'john@example.com',
        problemDescription: 'We lose track of orders between our WhatsApp and store.',
        projectStage: 'JUST_AN_IDEA',
        requiredHelp: 'NOT_SURE',
      };

      const result = createLeadSchema.safeParse(lead);
      assert.equal(result.success, true);
    });

    it('should reject invalid email', () => {
      const invalid = {
        name: 'Bad Email',
        email: 'not-an-email',
        problemDescription: 'Testing invalid email parsing',
        projectStage: 'JUST_AN_IDEA',
        requiredHelp: 'IDEA_VALIDATION',
      };

      const result = createLeadSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.path.includes('email')));
      }
    });

    it('should reject problem description that is too short', () => {
      const invalid = {
        name: 'Short',
        email: 'short@example.com',
        problemDescription: 'Too short',
        projectStage: 'JUST_AN_IDEA',
        requiredHelp: 'IDEA_VALIDATION',
      };

      const result = createLeadSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid admin credentials', () => {
      const result = loginSchema.safeParse({
        email: 'admin@palnadu.dev',
        password: 'securePassword123!',
      });
      assert.equal(result.success, true);
    });

    it('should reject short password (< 8 chars)', () => {
      const result = loginSchema.safeParse({
        email: 'admin@palnadu.dev',
        password: 'short',
      });
      assert.equal(result.success, false);
    });
  });

  describe('createServiceSchema', () => {
    it('should require lowercase hyphenated slug', () => {
      const invalidSlug = {
        title: 'Web Dev',
        slug: 'Web Dev Invalid!',
        shortDescription: 'Short description of service',
        content: 'Longer content explaining this service in detail.',
      };
      const result = createServiceSchema.safeParse(invalidSlug);
      assert.equal(result.success, false);
    });

    it('should accept valid service schema', () => {
      const valid = {
        title: 'Web Development',
        slug: 'web-development',
        shortDescription: 'Custom web development for startups and businesses.',
        content: 'Full comprehensive content explaining the service in depth.',
        status: 'PUBLISHED',
        order: 1,
      };
      const result = createServiceSchema.safeParse(valid);
      assert.equal(result.success, true);
    });
  });
});
