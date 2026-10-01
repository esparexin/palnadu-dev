import { Injectable, Logger } from '@nestjs/common';
import {
  validate as runValidationGate,
  ValidationInput,
  ValidationOutcome,
} from './seo-validation-rules';

/**
 * Thin Nest wrapper around the pure publishing gate.
 *
 * The rules live in seo-validation-rules.ts with no framework imports so they
 * can be tested without booting the DI container.
 */
@Injectable()
export class SeoValidationService {
  private readonly logger = new Logger(SeoValidationService.name);

  validate(input: ValidationInput): ValidationOutcome {
    const outcome = runValidationGate(input);
    if (!outcome.passed) {
      this.logger.warn(
        `validation rejected topicKey="${input.topicKey}": ${outcome.failures
          .map((f) => f.name)
          .join(', ')}`,
      );
    }
    return outcome;
  }
}
