import type {
  AutomationCoverage,
  AutomationReferenceSource,
  AutomationStatus,
  BilingualStatus,
} from '@palnadu/types';
import { adminApi } from './client';

export interface GeneratePayload {
  topic?: string;
  categorySlug?: string;
  targetLocation?: string;
  forcePublish?: boolean;
  batchCount?: number;
  language?: 'en' | 'te';
}

export const automationApi = {
  status: () => adminApi<{ success: boolean; data: AutomationStatus }>('/api/admin/automation/status'),
  generate: (data?: GeneratePayload) =>
    adminApi<{ success: boolean; message: string; data: any }>('/api/admin/automation/generate', {
      method: 'POST',
      body: JSON.stringify(data || {}),
      timeoutMs: 120000,
    }),
  discover: (limit?: number) =>
    adminApi<{
      success: boolean;
      message: string;
      data: { discovered: number; enqueued: number; rejected: string[] };
    }>('/api/admin/automation/discover', {
      method: 'POST',
      body: JSON.stringify({ limit: limit ?? 40 }),
      timeoutMs: 60000,
    }),
  keywords: (seed?: string, location?: string) =>
    adminApi<{ success: boolean; query: string; location: string; count: number; data: any[] }>(
      `/api/admin/automation/keywords?seed=${encodeURIComponent(seed || '')}&location=${encodeURIComponent(location || '')}`,
    ),
  questions: (seed?: string, location?: string) =>
    adminApi<{ success: boolean; query: string; location: string; count: number; data: any[] }>(
      `/api/admin/automation/questions?seed=${encodeURIComponent(seed || '')}&location=${encodeURIComponent(location || '')}`,
    ),
  getBilingual: () =>
    adminApi<{ success: boolean; data: BilingualStatus }>('/api/admin/automation/bilingual'),
  updateBilingual: (data: { enabled?: boolean; te?: number; en?: number }) =>
    adminApi<{ success: boolean; message: string; data: BilingualStatus }>(
      '/api/admin/automation/bilingual',
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  sources: () =>
    adminApi<{ success: boolean; data: AutomationReferenceSource[] }>('/api/admin/automation/sources'),
  coverage: () =>
    adminApi<{ success: boolean; data: AutomationCoverage }>('/api/admin/automation/coverage'),
  auditLog: (limit?: number) =>
    adminApi<{ success: boolean; data: any[] }>('/api/admin/automation/audit-log', {
      params: limit ? { limit: String(limit) } : undefined,
    }),
  updateSettings: (autoPublish: boolean) =>
    adminApi<{ success: boolean; message: string }>('/api/admin/automation/settings', {
      method: 'PATCH',
      body: JSON.stringify({ autoPublish }),
    }),
  indexNowSubmit: (urls: string[]) =>
    adminApi<{ success: boolean; message: string; data: any }>('/api/admin/automation/indexnow/submit', {
      method: 'POST',
      body: JSON.stringify({ urls }),
    }),
  gscInspect: (url: string) =>
    adminApi<{ success: boolean; message?: string; data: any }>(
      `/api/admin/automation/gsc/inspect?url=${encodeURIComponent(url)}`,
    ),
  gscSubmitSitemap: (sitemapUrl: string) =>
    adminApi<{ success: boolean; message: string }>('/api/admin/automation/gsc/sitemap', {
      method: 'POST',
      body: JSON.stringify({ sitemapUrl }),
    }),
  bingSubmitUrl: (url: string) =>
    adminApi<{ success: boolean; message: string }>('/api/admin/automation/bing/submit', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  pageSpeed: (url: string) =>
    adminApi<{ success: boolean; message?: string; data: any }>(
      `/api/admin/automation/pagespeed?url=${encodeURIComponent(url)}`,
    ),
  crawlerRun: (url?: string) =>
    adminApi<{ success: boolean; message: string; data: any }>('/api/admin/automation/crawler/run', {
      method: 'POST',
      body: JSON.stringify({ url }),
      timeoutMs: 60000,
    }),
  crawlerLatest: () =>
    adminApi<{ success: boolean; data: any }>('/api/admin/automation/crawler/latest'),
  crawlerHistory: (limit?: number) =>
    adminApi<{ success: boolean; count: number; data: any[] }>(
      `/api/admin/automation/crawler/history?limit=${limit || 10}`,
    ),
  geminiStatus: () =>
    adminApi<{ success: boolean; data: any }>('/api/admin/automation/gemini/status'),
  geminiVerify: (apiKey: string, primaryModel?: string) =>
    adminApi<{ success: boolean; message: string; data: any }>(
      '/api/admin/automation/gemini/verify',
      {
        method: 'POST',
        body: JSON.stringify({ apiKey, primaryModel }),
        timeoutMs: 35000,
      },
    ),
  geminiActivate: (apiKey: string, primaryModel?: string) =>
    adminApi<{ success: boolean; message: string; data: any }>(
      '/api/admin/automation/gemini/activate',
      {
        method: 'POST',
        body: JSON.stringify({ apiKey, primaryModel }),
        timeoutMs: 35000,
      },
    ),
  geminiAuditLog: (limit?: number) =>
    adminApi<{ success: boolean; data: any[] }>(
      `/api/admin/automation/gemini/audit-log?limit=${limit || 20}`,
    ),
};
