import type {
  PageViewEventData,
  ContactChannelClickEventData,
  FormStartEventData,
  FormSubmitAttemptEventData,
  FormSubmitFailureEventData,
  GenerateLeadEventData,
  ConsultationRequestEventData,
  ServiceEngagementEventData,
  BlogEngagementEventData,
} from '@palnadu/types';
import { pushAnalyticsEvent } from './core';

export function trackPageView(data: PageViewEventData): void {
  pushAnalyticsEvent('page_view', data);
}

export function trackContactChannelClick(data: ContactChannelClickEventData): void {
  pushAnalyticsEvent('contact_channel_click', data);
}

export function trackFormStart(data: FormStartEventData): void {
  pushAnalyticsEvent('form_start', data);
}

export function trackFormSubmitAttempt(data: FormSubmitAttemptEventData): void {
  pushAnalyticsEvent('form_submit_attempt', data);
}

export function trackFormSubmitFailure(data: FormSubmitFailureEventData): void {
  pushAnalyticsEvent('form_submit_failure', data);
}

export function trackGenerateLead(data: GenerateLeadEventData): void {
  pushAnalyticsEvent('generate_lead', data);
}

export function trackConsultationRequest(data: ConsultationRequestEventData): void {
  pushAnalyticsEvent('consultation_request', data);
}

export function trackServiceEngagement(data: ServiceEngagementEventData): void {
  pushAnalyticsEvent('service_engagement', data);
}

export function trackBlogEngagement(data: BlogEngagementEventData): void {
  pushAnalyticsEvent('blog_engagement', data);
}

