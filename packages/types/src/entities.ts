import {
  LeadStatus,
  ProjectStatus,
  PublishStatus,
  UserRole,
  ProjectStage,
  RequiredHelp,
} from './enums';

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

export interface FAQ {
  question: string;
  answer: string;
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
