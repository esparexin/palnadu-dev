import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createLeadSchema,
  loginSchema,
  createServiceSchema,
} from '../dist/index.js';

describe('Validation Schemas Audit', () => {
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

    it('should trim inputs and accept clean values', () => {
      const lead = {
        name: '  John Smith  ',
        email: '  JOHN.SMITH@EXAMPLE.COM  ',
        problemDescription: '  We lose track of orders between our WhatsApp and store.  ',
      };

      const result = createLeadSchema.safeParse(lead);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.name, 'John Smith');
        assert.equal(result.data.email, 'john.smith@example.com');
        assert.equal(result.data.projectStage, 'JUST_AN_IDEA');
        assert.equal(result.data.requiredHelp, 'NOT_SURE');
      }
    });

    it('should reject invalid email formats', () => {
      const invalid = {
        name: 'Bad Email',
        email: 'not-an-email',
        problemDescription: 'Testing invalid email parsing',
      };

      const result = createLeadSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.path.includes('email')));
      }
    });

    it('should reject invalid phone numbers if provided', () => {
      const invalid = {
        name: 'Bad Phone',
        email: 'valid@example.com',
        phone: 'invalid-letters-123',
        problemDescription: 'Testing invalid phone parsing',
      };

      const result = createLeadSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });

    it('should allow empty phone number since it is optional', () => {
      const valid = {
        name: 'No Phone',
        email: 'valid@example.com',
        phone: '',
        problemDescription: 'Testing empty phone number handling',
      };

      const result = createLeadSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it('should reject problem description shorter than 10 characters', () => {
      const invalid = {
        name: 'Short Problem',
        email: 'short@example.com',
        problemDescription: 'Too short',
      };

      const result = createLeadSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid admin credentials and normalize email', () => {
      const result = loginSchema.safeParse({
        email: ' ADMIN@palnadu.dev ',
        password: 'securePassword123!',
      });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.email, 'admin@palnadu.dev');
      }
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
