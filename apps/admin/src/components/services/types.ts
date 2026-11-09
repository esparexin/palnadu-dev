export interface ServiceFormData {
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  order: number;
}

export const initialFormData: ServiceFormData = {
  title: '',
  slug: '',
  shortDescription: '',
  content: '',
  status: 'PUBLISHED',
  order: 0,
};
