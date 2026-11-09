// ─── Analytics & Telemetry SSOT Contracts ─────────────────────────────

export type AnalyticsConsentState = 'granted' | 'denied';

export interface GoogleConsentSettings {
  analytics_storage: AnalyticsConsentState;
  ad_storage: AnalyticsConsentState;
  ad_user_data: AnalyticsConsentState;
  ad_personalization: AnalyticsConsentState;
  wait_for_update?: number;
}

export interface UtmParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
}

export type ContactChannel = 'whatsapp' | 'phone' | 'email';

export interface PageViewEventData extends UtmParameters {
  page_title: string;
  page_location: string;
  page_path: string;
  page_referrer?: string;
  page_locale?: string;
}

export interface ServiceEngagementEventData {
  service_slug: string;
  service_title: string;
  engagement_type: 'view_detail' | 'view_pricing' | 'cta_click';
  destination_url?: string;
}

export interface BlogEngagementEventData {
  article_slug: string;
  article_title: string;
  category?: string;
  locale?: string;
  scroll_depth_threshold?: 25 | 50 | 75 | 90 | 100;
  read_time_seconds?: number;
}

export interface ContactChannelClickEventData {
  channel: ContactChannel;
  destination: string;
  source_section: string;
  source_page: string;
}

export interface FormStartEventData {
  form_id: string;
  form_name: string;
  source_page: string;
}

export interface FormSubmitAttemptEventData {
  form_id: string;
  form_name: string;
  source_page: string;
  lead_category?: string;
}

export interface FormSubmitFailureEventData {
  form_id: string;
  form_name: string;
  error_message: string;
  error_field?: string;
}

export interface GenerateLeadEventData extends UtmParameters {
  form_id: string;
  lead_id: string;
  lead_category: string;
  project_stage: string;
  has_budget: boolean;
  source_page: string;
}

export interface ConsultationRequestEventData {
  cta_label: string;
  source_section: string;
  source_page: string;
  destination_url: string;
}

export interface LeadStatusUpdatedEventData {
  lead_id: string;
  old_status?: string;
  new_status: string;
  is_conversion: boolean;
}

export interface ClientConvertedEventData {
  client_id: string;
  lead_id: string;
  conversion_timestamp: string;
}

export type AnalyticsEventMap = {
  page_view: PageViewEventData;
  service_engagement: ServiceEngagementEventData;
  blog_engagement: BlogEngagementEventData;
  contact_channel_click: ContactChannelClickEventData;
  form_start: FormStartEventData;
  form_submit_attempt: FormSubmitAttemptEventData;
  form_submit_failure: FormSubmitFailureEventData;
  generate_lead: GenerateLeadEventData;
  consultation_request: ConsultationRequestEventData;
  lead_status_updated: LeadStatusUpdatedEventData;
  client_converted: ClientConvertedEventData;
  utm_attribution_captured: UtmParameters;
  consent_update: GoogleConsentSettings;
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

export type AnalyticsDataLayerPayload<T extends AnalyticsEventName = AnalyticsEventName> = {
  event: T;
} & AnalyticsEventMap[T];
