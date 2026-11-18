import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';

/**
 * Maps blog automation generation failures to appropriate HTTP status codes
 * without leaking raw API keys, stack traces, or internal database metadata.
 *
 * Status mapping:
 * - 400 BadRequestException: Client input / unresolvable category / validation failures
 * - 409 ConflictException: Concurrency collisions, in-flight topic claim locks
 * - 503 ServiceUnavailableException: Upstream Gemini / LLM provider rate limits, quota, temporary failures
 * - 500 InternalServerErrorException: Unexpected internal errors
 */
export function mapAutomationGenerationError(err: unknown): never {
  if (err instanceof HttpException) {
    throw err;
  }

  const rawMsg = err instanceof Error ? err.message : String(err || 'Failed to generate article.');
  const sanitizedMsg = rawMsg.replace(/AIza[0-9A-Za-z-_]{20,}/g, '[REDACTED_KEY]');

  // Concurrency & in-flight topic claim conflicts -> 409 Conflict
  if (/already claimed by another worker|already claimed|locked|concurrent claim|P2002/i.test(sanitizedMsg)) {
    throw new ConflictException(sanitizedMsg);
  }

  // Upstream Gemini / LLM provider availability, quota, rate limits -> 503 Service Unavailable
  if (
    /LLM generation failed|quota|rate limit|429|503|high demand|temporarily unavailable|RESOURCE_EXHAUSTED|UNCONFIGURED|TEMPORARY_PROVIDER_ERROR/i.test(
      sanitizedMsg,
    )
  ) {
    throw new ServiceUnavailableException(sanitizedMsg);
  }

  // Genuine client input or validation failures -> 400 Bad Request
  if (/validation:|no_category|unnamed topic|invalid/i.test(sanitizedMsg)) {
    throw new BadRequestException(sanitizedMsg);
  }

  // Unexpected internal server failures -> 500 Internal Server Error
  throw new InternalServerErrorException(sanitizedMsg || 'Failed to generate article.');
}
