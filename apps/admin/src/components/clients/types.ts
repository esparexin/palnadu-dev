export interface ClientFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
}

export const initialFormData: ClientFormData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  notes: '',
};
