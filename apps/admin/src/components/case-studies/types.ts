export interface CaseStudyFormData {
  title: string;
  slug: string;
  problem: string;
  solution: string;
  technology: string;
  result: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export const initialFormData: CaseStudyFormData = {
  title: '',
  slug: '',
  problem: '',
  solution: '',
  technology: '',
  result: '',
  status: 'DRAFT',
};
