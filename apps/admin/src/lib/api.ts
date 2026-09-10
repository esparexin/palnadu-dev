const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export async function adminApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  const token = getToken();

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

// Admin API calls
export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      adminApi<{ data: { user: unknown; accessToken: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => adminApi('/api/auth/me'),
  },
  leads: {
    list: (params?: Record<string, string>) => adminApi('/api/admin/leads', { params }),
    get: (id: string) => adminApi(`/api/admin/leads/${id}`),
    update: (id: string, data: unknown) =>
      adminApi(`/api/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => adminApi(`/api/admin/leads/${id}`, { method: 'DELETE' }),
  },
  clients: {
    list: (params?: Record<string, string>) => adminApi('/api/admin/clients', { params }),
    create: (data: unknown) =>
      adminApi('/api/admin/clients', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => adminApi(`/api/admin/clients/${id}`),
    update: (id: string, data: unknown) =>
      adminApi(`/api/admin/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => adminApi(`/api/admin/clients/${id}`, { method: 'DELETE' }),
  },
  projects: {
    list: (params?: Record<string, string>) => adminApi('/api/admin/projects', { params }),
    create: (data: unknown) =>
      adminApi('/api/admin/projects', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => adminApi(`/api/admin/projects/${id}`),
    update: (id: string, data: unknown) =>
      adminApi(`/api/admin/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => adminApi(`/api/admin/projects/${id}`, { method: 'DELETE' }),
  },
  services: {
    list: (params?: Record<string, string>) => adminApi('/api/admin/services', { params }),
    create: (data: unknown) =>
      adminApi('/api/admin/services', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => adminApi(`/api/admin/services/${id}`),
    update: (id: string, data: unknown) =>
      adminApi(`/api/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => adminApi(`/api/admin/services/${id}`, { method: 'DELETE' }),
  },
  caseStudies: {
    list: (params?: Record<string, string>) => adminApi('/api/admin/case-studies', { params }),
    create: (data: unknown) =>
      adminApi('/api/admin/case-studies', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => adminApi(`/api/admin/case-studies/${id}`),
    update: (id: string, data: unknown) =>
      adminApi(`/api/admin/case-studies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => adminApi(`/api/admin/case-studies/${id}`, { method: 'DELETE' }),
  },
  blog: {
    list: (params?: Record<string, string>) => adminApi('/api/admin/blog', { params }),
    create: (data: unknown) =>
      adminApi('/api/admin/blog', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => adminApi(`/api/admin/blog/${id}`),
    update: (id: string, data: unknown) =>
      adminApi(`/api/admin/blog/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => adminApi(`/api/admin/blog/${id}`, { method: 'DELETE' }),
    categories: () => adminApi('/api/blog/categories'),
  },
  media: {
    list: (params?: Record<string, string>) => adminApi('/api/admin/media', { params }),
    upload: async (file: File) => {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_URL}/api/admin/media/upload`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    delete: (id: string) => adminApi(`/api/admin/media/${id}`, { method: 'DELETE' }),
  },
  users: {
    list: () => adminApi('/api/admin/users'),
    create: (data: unknown) =>
      adminApi('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      adminApi(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  dashboard: {
    stats: () => adminApi('/api/admin/dashboard/stats'),
  },
  settings: {
    branding: {
      get: () => adminApi<{ success: boolean; data: any }>('/api/admin/settings/branding'),
      uploadLogo: async (file: File) => {
        const token = getToken();
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_URL}/api/admin/settings/branding/logo`, {
          method: 'POST',
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
          body: formData,
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Logo upload failed');
        }
        return response.json();
      },
      removeLogo: () =>
        adminApi<{ success: boolean; message: string; data: any }>('/api/admin/settings/branding/logo', {
          method: 'DELETE',
        }),
    },
  },
};
