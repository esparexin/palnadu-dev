// ─── Enums ────────────────────────────────────────────────────

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  DISCOVERY = 'DISCOVERY',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
  NOT_QUALIFIED = 'NOT_QUALIFIED',
  ON_HOLD = 'ON_HOLD',
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PublishStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  DEVELOPER = 'DEVELOPER',
}

export enum ProjectStage {
  JUST_AN_IDEA = 'JUST_AN_IDEA',
  EXISTING_BUSINESS = 'EXISTING_BUSINESS',
  EXISTING_PRODUCT = 'EXISTING_PRODUCT',
  EXISTING_WEBSITE = 'EXISTING_WEBSITE',
  MANUAL_PROCESS = 'MANUAL_PROCESS',
  NEED_TECHNICAL_HELP = 'NEED_TECHNICAL_HELP',
  OTHER = 'OTHER',
}

export enum RequiredHelp {
  IDEA_VALIDATION = 'IDEA_VALIDATION',
  WEB_APPLICATION = 'WEB_APPLICATION',
  MOBILE_APPLICATION = 'MOBILE_APPLICATION',
  CUSTOM_SOFTWARE = 'CUSTOM_SOFTWARE',
  AUTOMATION = 'AUTOMATION',
  TECHNICAL_CONSULTING = 'TECHNICAL_CONSULTING',
  MVP_DEVELOPMENT = 'MVP_DEVELOPMENT',
  NOT_SURE = 'NOT_SURE',
}

// ─── API Response ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Entities ─────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  problemDescription: string;
  currentSituation?: string;
  projectStage: ProjectStage;
  requiredHelp: RequiredHelp;
  budget?: string;
  additionalInfo?: string;
  status: LeadStatus;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  expectedCompletion?: string;
  technology?: string[];
  budget?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  icon?: string;
  heroImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  faqs?: FAQ[];
  status: PublishStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  clientId?: string;
  problem: string;
  solution: string;
  technology: string[];
  result: string;
  images?: string[];
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export type BlogLanguage = 'en' | 'te';

export interface BlogPostTranslation {
  id: string;
  slug: string;
  language: BlogLanguage;
  title: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  categoryId?: string;
  category?: BlogCategory;
  authorId: string;
  author?: User;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  publishDate?: string;
  status: PublishStatus;
  language: BlogLanguage;
  topicKey?: string;
  translationGroupId?: string;
  translations?: BlogPostTranslation[];
  createdAt: string;
  updatedAt: string;
}


export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type TopicStatus = 'PENDING' | 'CLAIMED' | 'COMPLETED' | 'FAILED';

export interface BlogTopic {
  id: string;
  topicKey: string;
  topic: string;
  language: BlogLanguage;
  categorySlug: string;
  targetLocation?: string | null;
  searchIntent?: string | null;
  primaryKeyword?: string | null;
  keywords: string[];
  referenceSources: string[];
  status: TopicStatus;
  attempts: number;
  lastError?: string | null;
  nextRetryAt?: string | null;
  claimedAt?: string | null;
  claimedBy?: string | null;
  postId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationReferenceSource {
  source: string;
  availability: 'ready' | 'unconfigured' | 'error';
  note?: string;
}

export interface AutomationStatistics {
  totalPosts: number;
  draftPosts: number;
  publishedPosts: number;
  archivedPosts: number;
  queuePending: number;
  queueCompleted: number;
  queueInFlight: number;
  queueFailed: number;
}

export interface AutomationCoverage {
  topicsCovered: number;
  keywordsCovered: number;
  intentsCovered: Record<string, number>;
}

export interface AutomationStatus {
  engineStatus: string;
  schedule: string;
  autoPublishEnabled: boolean;
  referenceSources: AutomationReferenceSource[];
  statistics: AutomationStatistics;
  coverage: AutomationCoverage;
  upcomingQueue: BlogTopic[];
}

export interface BilingualQuota {
  te: number;
  en: number;
}

export interface BilingualConfig {
  enabled: boolean;
  quota: BilingualQuota;
}

export interface BilingualStatus extends BilingualConfig {
  pending: {
    te: number;
    en: number;
  };
}

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  problemDescription: string;
  currentSituation?: string;
  projectStage: ProjectStage;
  requiredHelp: RequiredHelp;
  budget?: string;
  additionalInfo?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
