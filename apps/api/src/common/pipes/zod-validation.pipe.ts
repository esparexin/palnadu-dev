import { PipeTransform, ArgumentMetadata, BadRequestException, Injectable } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata?: ArgumentMetadata) {
    const parseResult = this.schema.safeParse(value);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((issue) => (issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
        .join(', ');
      throw new BadRequestException(errorMsg);
    }
    return parseResult.data;
  }
}
