const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  next?: { revalidate?: number; tags?: string[] };
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, next, ...fetchOptions } = options;

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
      ...(next ? { next } : {}),
    });
  } catch (networkErr) {
    throw new Error(
      'Unable to connect to Palnadu.dev services. Please check your internet connection and try again.',
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.error;

    if (response.status === 404) {
      throw new Error(message || 'The requested page or record could not be found.');
    }
    if (response.status === 400) {
      throw new Error(message || 'Invalid request. Please check your submission.');
    }
    if (response.status >= 500) {
      throw new Error(
        message || 'We are experiencing temporary server difficulties. Please try again shortly.',
      );
    }

    throw new Error(message || `Request failed with status code ${response.status}.`);
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
    list: () => apiClient('/api/services', { next: { revalidate: 300 } }),
    getBySlug: (slug: string) => apiClient(`/api/services/${slug}`, { next: { revalidate: 300 } }),
  },
  caseStudies: {
    list: () => apiClient('/api/case-studies', { next: { revalidate: 300 } }),
    getBySlug: (slug: string) => apiClient(`/api/case-studies/${slug}`, { next: { revalidate: 300 } }),
  },
  blog: {
    list: (params?: Record<string, string>) =>
      apiClient('/api/blog', { params, next: { revalidate: 60 } }),
    // `language` scopes the lookup to one locale (`en` for /blog/<slug>,
    // `te` for /te/blog/<slug>). Posts are resolved per language, so a slug
    // in the wrong locale 404s instead of rendering the other language.
    getBySlug: (slug: string, language?: 'en' | 'te') =>
      apiClient(`/api/blog/${slug}`, {
        params: language ? { language } : undefined,
        next: { revalidate: 60 },
      }),
    categories: () => apiClient<{ success: boolean; data: any[] }>('/api/blog/categories', { next: { revalidate: 300 } }),
  },
  settings: {
    branding: () => apiClient<{ success: boolean; data: any }>('/api/settings/branding', { next: { revalidate: 60 } }),
  },
};
