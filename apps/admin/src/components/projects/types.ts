export interface ProjectFormData {
  name: string;
  clientId: string;
  description: string;
  status: string;
  startDate: string;
  expectedCompletion: string;
  technology: string;
  budget: string;
}

export const initialFormData: ProjectFormData = {
  name: '',
  clientId: '',
  description: '',
  status: 'ACTIVE',
  startDate: '',
  expectedCompletion: '',
  technology: 'Next.js, TypeScript, MongoDB',
  budget: '',
};

export const statusColors: Record<string, string> = {
  PLANNING: 'bg-palnadu-blue/10 text-palnadu-blue border-palnadu-blue/20',
  ACTIVE: 'bg-palnadu-teal/10 text-palnadu-teal border-palnadu-teal/20',
  ON_HOLD: 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/20',
  COMPLETED: 'bg-palnadu-secondary/10 text-palnadu-secondary border-palnadu-border',
  CANCELLED: 'bg-palnadu-error/10 text-palnadu-error border-palnadu-error/20',
};
