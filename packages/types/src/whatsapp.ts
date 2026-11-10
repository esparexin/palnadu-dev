export type WhatsAppMessageDirection = 'INBOUND' | 'OUTBOUND';

export type WhatsAppDeliveryStatus = 'RECEIVED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface WhatsAppMessage {
  id: string;
  wamId: string;
  direction: WhatsAppMessageDirection;
  from: string;
  to: string;
  profileName?: string;
  type: string;
  body?: string;
  mediaId?: string;
  mimeType?: string;
  contextWamId?: string;
  status: WhatsAppDeliveryStatus;
  statusTimestamp?: string;
  errorCode?: string;
  errorMessage?: string;
  rawPayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppWebhookVerifyQuery {
  'hub.mode'?: string;
  'hub.challenge'?: string;
  'hub.verify_token'?: string;
}

export interface WhatsAppRawText {
  body: string;
}

export interface WhatsAppRawMedia {
  id: string;
  mime_type?: string;
  sha256?: string;
  caption?: string;
  filename?: string;
}

export interface WhatsAppRawContext {
  from?: string;
  id?: string;
}

export interface WhatsAppRawMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: WhatsAppRawText;
  image?: WhatsAppRawMedia;
  document?: WhatsAppRawMedia;
  audio?: WhatsAppRawMedia;
  video?: WhatsAppRawMedia;
  context?: WhatsAppRawContext;
}

export interface WhatsAppRawStatusError {
  code: number;
  title: string;
  message?: string;
  error_data?: {
    details: string;
  };
}

export interface WhatsAppRawStatus {
  id: string;
  recipient_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  errors?: WhatsAppRawStatusError[];
}

export interface WhatsAppWebhookContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppWebhookMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export interface WhatsAppWebhookValue {
  messaging_product: string;
  metadata: WhatsAppWebhookMetadata;
  contacts?: WhatsAppWebhookContact[];
  messages?: WhatsAppRawMessage[];
  statuses?: WhatsAppRawStatus[];
}

export interface WhatsAppWebhookChange {
  field: string;
  value: WhatsAppWebhookValue;
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

export interface WhatsAppSendTextMessageParams {
  to: string;
  text: string;
  previewUrl?: boolean;
  replyToWamId?: string;
}

export interface WhatsAppSendResponseContact {
  input: string;
  wa_id: string;
}

export interface WhatsAppSendResponseMessage {
  id: string;
  message_status?: string;
}

export interface WhatsAppSendResponse {
  messaging_product: string;
  contacts: WhatsAppSendResponseContact[];
  messages: WhatsAppSendResponseMessage[];
}

export interface WhatsAppApiErrorDetail {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export interface WhatsAppApiErrorResponse {
  error: WhatsAppApiErrorDetail;
}


