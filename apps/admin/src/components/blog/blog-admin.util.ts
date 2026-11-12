import { PublishStatus, type BlogPost } from '@palnadu/types';
import type { BlogFormData } from './types';

/** Safely extracts the authenticated role string from serialized `admin_user` JSON. */
export function parseAdminUserRole(rawUserJson: string | null): string | null {
  if (!rawUserJson) return null;
  try {
    const parsed = JSON.parse(rawUserJson) as { role?: unknown } | null;
    return typeof parsed?.role === 'string' && parsed.role.length > 0 ? parsed.role : null;
  } catch {
    return null;
  }
}

/** Reads the active admin user role from localStorage in browser contexts. */
export function readStoredAdminRole(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return parseAdminUserRole(localStorage.getItem('admin_user'));
  } catch {
    return null;
  }
}

/** Matches backend `@Roles('SUPER_ADMIN', 'ADMIN')` on delete, settings, and bilingual toggles. */
export function canManageBlogAdminControls(role: string | null | undefined): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

/** Returns a status-accurate toast message when creating or updating an article. */
export function getBlogSaveSuccessMessage(
  isEditing: boolean,
  status: BlogFormData['status'],
): string {
  if (isEditing) return 'Article updated successfully';
  if (status === 'PUBLISHED') return 'Article published successfully';
  if (status === 'ARCHIVED') return 'Article archived successfully';
  return 'Draft saved successfully';
}

/** Computes rollback status/count deltas for an optimistic `quickPublish` failure. */
export function getQuickPublishRollback(previousPost: Pick<BlogPost, 'status' | 'publishDate'>): {
  status: PublishStatus;
  publishDate: string | undefined;
  wasDraft: boolean;
} {
  return {
    status: previousPost.status,
    publishDate: previousPost.publishDate,
    wasDraft: previousPost.status === PublishStatus.DRAFT,
  };
}

