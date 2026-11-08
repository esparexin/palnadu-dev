export interface BlogFormData {
  title: string;
  slug: string;
  language: 'en' | 'te';
  translationGroupId?: string;
  categoryId?: string;
  excerpt: string;
  content: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export const initialFormData: BlogFormData = {
  title: '',
  slug: '',
  language: 'en',
  translationGroupId: undefined,
  categoryId: undefined,
  excerpt: '',
  content: '',
  coverImage: '',
  seoTitle: '',
  seoDescription: '',
  ogImage: '',
  status: 'DRAFT',
};

export interface KeywordResult {
  keyword: string;
  intent: 'transactional' | 'local' | 'informational';
  relevanceScore: number;
  source: string;
}

export interface CategoryOption {
  id: string;
  slug: string;
  name: string;
}
