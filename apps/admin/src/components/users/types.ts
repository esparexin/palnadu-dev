import type { UserRole } from '@palnadu/types';

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const initialFormData: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'DEVELOPER' as UserRole,
};

export const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-palnadu-error/10 text-palnadu-error border-palnadu-error/20',
  ADMIN: 'bg-palnadu-blue/10 text-palnadu-blue border-palnadu-blue/20',
  EDITOR: 'bg-palnadu-light-blue text-palnadu-blue border-palnadu-blue/20',
  PROJECT_MANAGER: 'bg-palnadu-teal/10 text-palnadu-teal border-palnadu-teal/20',
  DEVELOPER: 'bg-palnadu-off-white text-palnadu-dark border-palnadu-border',
};
