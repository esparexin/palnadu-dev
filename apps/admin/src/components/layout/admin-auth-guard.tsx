'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function parseJwtPayload(token: string): { exp?: number; sub?: string; role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload || !payload.sub) return false;
  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    return false;
  }
  return true;
}

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) {
      setAuthState('unauthorized');
      router.replace('/login');
      return;
    }

    if (!isTokenValid(token)) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setAuthState('unauthorized');
      router.replace('/login?session=expired');
      return;
    }

    setAuthState('authorized');
  }, [router]);

  if (authState !== 'authorized') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen w-full items-center justify-center bg-palnadu-off-white"
      >
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-palnadu-blue" />
          <p className="text-xs font-semibold text-palnadu-secondary">Authenticating...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
