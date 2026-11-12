import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  geminiKeyInputSchema,
  geminiRetryPendingSchema,
  type GeminiKeyInput,
  type GeminiRetryPendingInput,
} from '@palnadu/validation';
import { GeminiKeyStoreService } from './gemini-key-store.service';

@Controller('admin/automation/gemini')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class GeminiSettingsController {
  constructor(private readonly keyStoreService: GeminiKeyStoreService) {}

  /**
   * Retrieves active Gemini key metadata, project identity, and model availability.
   * Never exposes plaintext API keys.
   */
  @Get('status')
  async getStatus() {
    const data = await this.keyStoreService.getActiveKeyStatus();
    return { success: true, data };
  }

  /**
   * Probes candidate Gemini API key and detects Google Cloud project metadata.
   * Does not activate or persist the candidate key.
   */
  @Post('verify')
  async verifyCandidateKey(
    @Body(new ZodValidationPipe(geminiKeyInputSchema))
    body: GeminiKeyInput,
    @Req() req: any,
  ) {
    const actor = req?.user?.email || req?.user?.sub || 'admin';
    const result = await this.keyStoreService.verifyCandidateKey(
      body.apiKey,
      actor,
      body.primaryModel,
    );
    return {
      success: true,
      message: `Gemini key verification completed: ${result.verificationStatus}`,
      data: result,
    };
  }

  /**
   * Atomically activates new Gemini API key after running mandatory verification.
   * Preserves existing key if candidate key fails verification or usability checks.
   */
  @Post('activate')
  async activateKey(
    @Body(new ZodValidationPipe(geminiKeyInputSchema))
    body: GeminiKeyInput,
    @Req() req: any,
  ) {
    const actor = req?.user?.email || req?.user?.sub || 'admin';
    const data = await this.keyStoreService.activateKey(
      body.apiKey,
      actor,
      body.primaryModel,
    );
    return {
      success: true,
      message: 'Gemini API key verified and atomically activated successfully.',
      data,
    };
  }

  /**
   * Retries verification for the currently preserved PENDING_VERIFICATION candidate key.
   */
  @Post('retry-pending')
  async retryPending(
    @Body(new ZodValidationPipe(geminiRetryPendingSchema))
    body: GeminiRetryPendingInput,
    @Req() req: any,
  ) {
    const actor = req?.user?.email || req?.user?.sub || 'admin';
    const data = await this.keyStoreService.retryPendingVerification(
      actor,
      body.primaryModel,
      body.activate,
    );
    return {
      success: true,
      message: data.activated
        ? 'Pending Gemini API key verified and activated successfully.'
        : `Pending candidate retry completed: ${data.verification.verificationStatus}`,
      data,
    };
  }

  /**
   * Returns sanitized audit trail of recent key verifications and activations.
   */
  @Get('audit-log')
  async getAuditLog(@Query('limit') limitStr?: string) {
    const limit = Math.min(Math.max(parseInt(limitStr || '20', 10) || 20, 1), 50);
    const data = await this.keyStoreService.getAuditLog(limit);
    return { success: true, data };
  }
}

