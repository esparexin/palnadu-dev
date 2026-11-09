const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  timeoutMs?: number;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export async function adminApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, timeoutMs = 15000, ...fetchOptions } = options;
  const token = getToken();

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (fetchOptions.signal) {
    fetchOptions.signal.addEventListener('abort', () => controller.abort());
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...fetchOptions.headers,
      },
      ...fetchOptions,
      signal: controller.signal,
    });
  } catch (networkErr: any) {
    if (controller.signal.aborted && networkErr?.name === 'AbortError') {
      throw new Error(`Request to ${endpoint} timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw new Error(
      'Unable to connect to the backend server. Please check your internet connection or verify the API is running.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const serverMessage = errorData.message || errorData.error;

    if (response.status === 401) {
      if (endpoint.includes('/auth/login')) {
        throw new Error(
          serverMessage || 'Invalid email or password. Please verify your credentials and try again.',
        );
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session=expired';
        }
      }
      throw new Error(
        serverMessage || 'Your session has expired. Please sign in again to continue.',
      );
    }

    if (response.status === 403) {
      throw new Error(
        serverMessage || 'Access denied: You do not have sufficient permissions to perform this action.',
      );
    }

    if (response.status === 404) {
      throw new Error(
        serverMessage || 'The requested record or resource was not found.',
      );
    }

    if (response.status === 400) {
      throw new Error(
        serverMessage || 'Invalid request. Please check your input parameters and try again.',
      );
    }

    if (response.status >= 500) {
      throw new Error(
        serverMessage || 'A server error occurred. Please try again or contact the technical administrator.',
      );
    }

    throw new Error(
      serverMessage || `Request failed with status code ${response.status}.`,
    );
  }

  return response.json();
}

export { API_URL };
