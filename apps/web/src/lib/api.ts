const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

// Public API calls
export const api = {
  leads: {
    create: (data: unknown) =>
      apiClient('/api/leads', { method: 'POST', body: JSON.stringify(data) }),
  },
  services: {
    list: () => apiClient('/api/services'),
    getBySlug: (slug: string) => apiClient(`/api/services/${slug}`),
  },
  caseStudies: {
    list: () => apiClient('/api/case-studies'),
    getBySlug: (slug: string) => apiClient(`/api/case-studies/${slug}`),
  },
  blog: {
    list: (params?: Record<string, string>) =>
      apiClient('/api/blog', { params }),
    getBySlug: (slug: string) => apiClient(`/api/blog/${slug}`),
  },
};
