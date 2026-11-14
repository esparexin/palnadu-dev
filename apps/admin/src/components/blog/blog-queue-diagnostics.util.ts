import type { BlogTopic } from '@palnadu/types';

export type QueueItemBadgeVariant =
  | 'completed'
  | 'in_flight'
  | 'queued'
  | 'retry_scheduled'
  | 'retry_ready'
  | 'failed_recoverable'
  | 'failed_permanent';

export interface QueueErrorAnalysis {
  category: string;
  isRecoverable: boolean;
  sanitizedMessage: string;
}

export interface QueueItemDiagnostic {
  badgeLabel: string;
  badgeVariant: QueueItemBadgeVariant;
  badgeClassName: string;
  retryTimingText: string | null;
  errorAnalysis: QueueErrorAnalysis | null;
  canManuallyGenerate: boolean;
  buttonLabel: string;
}

export function sanitizeQueueErrorMessage(rawError?: string | null): string {
  if (!rawError) return '';
  return rawError
    .replace(/AIza[0-9A-Za-z-_]{20,}/g, '[REDACTED_KEY]')
    .replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyQueueError(lastError?: string | null): QueueErrorAnalysis | null {
  if (!lastError) return null;
  const sanitized = sanitizeQueueErrorMessage(lastError);
  const lower = sanitized.toLowerCase();

  if (
    lower.includes('model_overloaded') ||
    lower.includes('503') ||
    lower.includes('high demand') ||
    lower.includes('spikes in demand') ||
    lower.includes('temporarily unavailable')
  ) {
    return {
      category: 'Model Demand (503)',
      isRecoverable: true,
      sanitizedMessage: sanitized,
    };
  }

  if (
    lower.includes('model unavailable') ||
    lower.includes('model not found') ||
    lower.includes('not supported') ||
    lower.includes('404')
  ) {
    return {
      category: 'Model Config (404)',
      isRecoverable: true,
      sanitizedMessage: sanitized,
    };
  }

  if (lower.includes('quota_exceeded') || lower.includes('429') || lower.includes('rate limit')) {
    return {
      category: 'Rate Limit (429)',
      isRecoverable: true,
      sanitizedMessage: sanitized,
    };
  }

  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('aborted') ||
    lower.includes('fetch failed') ||
    lower.includes('econn') ||
    lower.includes('enotfound')
  ) {
    return {
      category: 'Network / Timeout',
      isRecoverable: true,
      sanitizedMessage: sanitized,
    };
  }

  if (
    lower.includes('validation:') ||
    lower.includes('validation_failed') ||
    lower.includes('internal_links') ||
    lower.includes('content_originality') ||
    lower.includes('no_category')
  ) {
    return {
      category: 'Content Validation',
      isRecoverable: false,
      sanitizedMessage: sanitized,
    };
  }

  if (
    lower.includes('invalid_api_key') ||
    lower.includes('permission_denied') ||
    lower.includes('model access denied')
  ) {
    return {
      category: 'Auth / Permission',
      isRecoverable: false,
      sanitizedMessage: sanitized,
    };
  }

  return {
    category: 'Generation Failure',
    isRecoverable: false,
    sanitizedMessage: sanitized,
  };
}

export function formatRetryCountdown(
  nextRetryAt?: string | null,
  nowMs = Date.now(),
): { text: string; isPast: boolean } | null {
  if (!nextRetryAt) return null;
  const targetMs = new Date(nextRetryAt).getTime();
  if (Number.isNaN(targetMs) || targetMs <= 0) return null;

  if (targetMs <= nowMs) {
    return { text: 'Retry ready for next cycle', isPast: true };
  }

  const diffMs = targetMs - nowMs;
  const diffMinutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)));

  if (diffMinutes < 60) {
    return { text: `Retry in ${diffMinutes}m`, isPast: false };
  }

  const hours = Math.floor(diffMinutes / 60);
  const remainingMins = diffMinutes % 60;
  return {
    text: remainingMins > 0 ? `Retry in ${hours}h ${remainingMins}m` : `Retry in ${hours}h`,
    isPast: false,
  };
}

export function getQueueItemDiagnostic(
  item: BlogTopic,
  nowMs = Date.now(),
): QueueItemDiagnostic {
  const isCompleted = item.status === 'COMPLETED';
  const isClaimed = item.status === 'CLAIMED';
  const isFailed = item.status === 'FAILED';
  const errorAnalysis = classifyQueueError(item.lastError);
  const retryTiming = formatRetryCountdown(item.nextRetryAt, nowMs);

  if (isCompleted) {
    return {
      badgeLabel: 'Published',
      badgeVariant: 'completed',
      badgeClassName: 'bg-palnadu-teal/10 text-palnadu-teal-dark border-palnadu-teal/30',
      retryTimingText: null,
      errorAnalysis: null,
      canManuallyGenerate: false,
      buttonLabel: 'Published',
    };
  }

  if (isClaimed) {
    return {
      badgeLabel: 'In-Flight',
      badgeVariant: 'in_flight',
      badgeClassName: 'bg-palnadu-blue/10 text-palnadu-blue border-palnadu-blue/30',
      retryTimingText: null,
      errorAnalysis,
      canManuallyGenerate: false,
      buttonLabel: 'Generating',
    };
  }

  if (isFailed) {
    const isRecoverable = errorAnalysis?.isRecoverable ?? false;
    return {
      badgeLabel: isRecoverable ? 'Failed (Recoverable)' : 'Failed (Permanent)',
      badgeVariant: isRecoverable ? 'failed_recoverable' : 'failed_permanent',
      badgeClassName: isRecoverable
        ? 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/30'
        : 'bg-palnadu-error/10 text-palnadu-error border-palnadu-error/30',
      retryTimingText: retryTiming?.text ?? null,
      errorAnalysis,
      canManuallyGenerate: true,
      buttonLabel: 'Retry Now',
    };
  }

  const hasRetriedOrFailed = item.attempts > 0 || Boolean(item.lastError);
  if (hasRetriedOrFailed) {
    const isPast = retryTiming?.isPast ?? true;
    return {
      badgeLabel: isPast ? 'Retry Ready' : 'Retry Scheduled',
      badgeVariant: isPast ? 'retry_ready' : 'retry_scheduled',
      badgeClassName: isPast
        ? 'bg-palnadu-light-blue text-palnadu-blue border-palnadu-blue/30'
        : 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/30',
      retryTimingText: retryTiming?.text ?? null,
      errorAnalysis,
      canManuallyGenerate: true,
      buttonLabel: 'Retry Now',
    };
  }

  return {
    badgeLabel: 'Pending',
    badgeVariant: 'queued',
    badgeClassName: 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border',
    retryTimingText: null,
    errorAnalysis: null,
    canManuallyGenerate: true,
    buttonLabel: 'Generate',
  };
}
