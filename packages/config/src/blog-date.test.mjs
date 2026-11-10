import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PALNADU_TIMEZONE,
  PALNADU_TIMEZONE_OFFSET,
  resolveDateLocaleTag,
  parseBlogDate,
  toIsoBlogDate,
  formatBlogDate,
  describeBlogDateStatus,
} from './blog-date.ts';

describe('blog-date SSOT configuration', () => {
  it('anchors timezone to Asia/Kolkata with +05:30 offset', () => {
    assert.equal(PALNADU_TIMEZONE, 'Asia/Kolkata');
    assert.equal(PALNADU_TIMEZONE_OFFSET, '+05:30');
  });

  it('resolves date locale tags correctly', () => {
    assert.equal(resolveDateLocaleTag(), 'en-US');
    assert.equal(resolveDateLocaleTag('en'), 'en-US');
    assert.equal(resolveDateLocaleTag('en-US'), 'en-US');
    assert.equal(resolveDateLocaleTag('te'), 'te-IN');
    assert.equal(resolveDateLocaleTag('te-IN'), 'te-IN');
    assert.equal(resolveDateLocaleTag('en-IN'), 'en-IN');
  });

  it('safely parses date inputs and rejects invalid values', () => {
    const valid = new Date('2026-11-10T12:00:00.000Z');
    assert.equal(parseBlogDate(valid)?.getTime(), valid.getTime());
    assert.equal(parseBlogDate('2026-11-10T12:00:00.000Z')?.toISOString(), valid.toISOString());
    assert.equal(parseBlogDate(null), null);
    assert.equal(parseBlogDate(undefined), null);
    assert.equal(parseBlogDate(''), null);
    assert.equal(parseBlogDate('not-a-date'), null);
  });

  it('converts valid inputs to ISO 8601 strings', () => {
    assert.equal(
      toIsoBlogDate('2026-11-10T19:30:00.000Z'),
      '2026-11-10T19:30:00.000Z',
    );
    assert.equal(toIsoBlogDate(null), undefined);
    assert.equal(toIsoBlogDate('invalid'), undefined);
  });

  it('formats dates consistently in Asia/Kolkata across UTC day boundaries', () => {
    // 2026-11-10 19:30 UTC is 2026-11-11 01:00 AM IST (+05:30)
    const timestamp = '2026-11-10T19:30:00.000Z';
    const formattedShort = formatBlogDate(timestamp, 'en');
    assert.equal(formattedShort, 'Nov 11, 2026');

    const formattedLong = formatBlogDate(timestamp, 'en', { monthFormat: 'long' });
    assert.equal(formattedLong, 'November 11, 2026');

    const formattedWithTime = formatBlogDate(timestamp, 'en', { includeTime: true });
    assert.match(formattedWithTime, /Nov 11, 2026/);
    assert.match(formattedWithTime, /01:00\s*(AM|am)/i);
  });

  it('supports Telugu date formatting in Asia/Kolkata', () => {
    const timestamp = '2026-11-10T19:30:00.000Z';
    const formattedTe = formatBlogDate(timestamp, 'te');
    assert.ok(formattedTe.length > 0);
    assert.match(formattedTe, /2026/);
    assert.match(formattedTe, /11/);
  });

  it('returns empty string for missing or invalid dates', () => {
    assert.equal(formatBlogDate(null), '');
    assert.equal(formatBlogDate(undefined), '');
    assert.equal(formatBlogDate(''), '');
    assert.equal(formatBlogDate('not-a-valid-date'), '');
  });

  it('correctly labels status and date targets in describeBlogDateStatus', () => {
    const published = describeBlogDateStatus({
      status: 'PUBLISHED',
      publishDate: '2026-11-10T19:30:00.000Z',
      createdAt: '2026-10-01T10:00:00.000Z',
    });
    assert.equal(published.label, 'Published');
    assert.equal(published.date, 'Nov 11, 2026');
    assert.equal(published.iso, '2026-11-10T19:30:00.000Z');

    const draft = describeBlogDateStatus({
      status: 'DRAFT',
      publishDate: null,
      createdAt: '2026-10-01T10:00:00.000Z',
    });
    assert.equal(draft.label, 'Draft');
    assert.equal(draft.date, 'Oct 1, 2026');
    assert.equal(draft.iso, '2026-10-01T10:00:00.000Z');

    const archived = describeBlogDateStatus({
      status: 'ARCHIVED',
      publishDate: '2026-09-15T00:00:00.000Z',
      createdAt: '2026-09-01T00:00:00.000Z',
    });
    assert.equal(archived.label, 'Archived');
    assert.equal(archived.date, 'Sep 15, 2026');
  });
});
