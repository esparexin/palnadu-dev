import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canManageBlogAdminControls,
  getBlogSaveSuccessMessage,
  getQuickPublishRollback,
  parseAdminUserRole,
} from './blog-admin.util.ts';

describe('Admin Blog RBAC & State Helpers', () => {
  it('parses valid admin user role JSON and rejects malformed or missing values', () => {
    assert.equal(parseAdminUserRole(JSON.stringify({ role: 'SUPER_ADMIN' })), 'SUPER_ADMIN');
    assert.equal(parseAdminUserRole(JSON.stringify({ role: 'EDITOR' })), 'EDITOR');
    assert.equal(parseAdminUserRole(JSON.stringify({ role: '' })), null);
    assert.equal(parseAdminUserRole(JSON.stringify({ role: 123 })), null);
    assert.equal(parseAdminUserRole('{invalid-json'), null);
    assert.equal(parseAdminUserRole(null), null);
  });

  it('allows delete and automation settings only for SUPER_ADMIN and ADMIN', () => {
    assert.equal(canManageBlogAdminControls('SUPER_ADMIN'), true);
    assert.equal(canManageBlogAdminControls('ADMIN'), true);
    assert.equal(canManageBlogAdminControls('EDITOR'), false);
    assert.equal(canManageBlogAdminControls(null), false);
    assert.equal(canManageBlogAdminControls(undefined), false);
  });

  it('returns status-accurate toast messages on create vs edit', () => {
    assert.equal(getBlogSaveSuccessMessage(true, 'DRAFT'), 'Article updated successfully');
    assert.equal(getBlogSaveSuccessMessage(true, 'PUBLISHED'), 'Article updated successfully');
    assert.equal(getBlogSaveSuccessMessage(false, 'PUBLISHED'), 'Article published successfully');
    assert.equal(getBlogSaveSuccessMessage(false, 'ARCHIVED'), 'Article archived successfully');
    assert.equal(getBlogSaveSuccessMessage(false, 'DRAFT'), 'Draft saved successfully');
  });

  it('preserves prior status and publishDate during quickPublish rollback', () => {
    const draftRollback = getQuickPublishRollback({
      status: 'DRAFT',
      publishDate: undefined,
    });
    assert.deepEqual(draftRollback, {
      status: 'DRAFT',
      publishDate: undefined,
      wasDraft: true,
    });

    const archivedRollback = getQuickPublishRollback({
      status: 'ARCHIVED',
      publishDate: '2026-01-15T10:00:00.000Z',
    });
    assert.deepEqual(archivedRollback, {
      status: 'ARCHIVED',
      publishDate: '2026-01-15T10:00:00.000Z',
      wasDraft: false,
    });
  });
});

