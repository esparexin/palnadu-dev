import type { Logger } from '@nestjs/common';
import type { WhatsAppApiClient } from './whatsapp-api.client';
import type { ConversationStepResult } from './whatsapp-conversation.service';
import type { WhatsAppSendResponse } from '@palnadu/types';

export async function dispatchAssistantStepToClient(
  apiClient: WhatsAppApiClient,
  logger: Logger,
  phone: string,
  masked: string,
  inboundWamId: string,
  step: ConversationStepResult,
): Promise<WhatsAppSendResponse> {
  if (step.interactive && typeof apiClient.sendInteractiveMessage === 'function') {
    try {
      return await apiClient.sendInteractiveMessage({
        to: phone,
        interactive: step.interactive,
        replyToWamId: inboundWamId,
      });
    } catch (interactiveErr: unknown) {
      const errDetail = interactiveErr instanceof Error ? interactiveErr.message : String(interactiveErr);
      logger.warn(`Interactive dispatch failed for ${masked}, falling back to text: ${errDetail}`);
    }
  }
  return apiClient.sendTextMessage({
    to: phone,
    text: step.responseText,
    replyToWamId: inboundWamId,
  });
}
