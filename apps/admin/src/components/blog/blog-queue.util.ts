/**
 * Formats a persisted queue topic failure message for inline Admin diagnostics.
 */
export function formatQueueTopicError(lastError?: string | null): string | null {
  if (typeof lastError !== 'string') return null;
  const normalized = lastError.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

/**
 * Extracts a safe, non-empty error message from a failed automation request.
 */
export function extractAutomationErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message.trim();
  }
  if (typeof err === 'string' && err.trim().length > 0) {
    return err.trim();
  }
  return fallback;
}

