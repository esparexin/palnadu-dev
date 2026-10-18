'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@palnadu/validation';
import { api } from '@/lib/api';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('session') === 'expired') {
        setError('Your session has expired. Please sign in again to continue.');
      }
    }

    api.settings.branding
      .get()
      .then((res) => {
        if (res.success && res.data?.headerLogo?.url) {
          setCustomLogoUrl(res.data.headerLogo.url);
        }
      })
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError(null);
      const response = await api.auth.login(data);
      const { user, accessToken } = response.data;
      localStorage.setItem('admin_token', accessToken);
      localStorage.setItem('admin_user', JSON.stringify(user));
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-palnadu-off-white px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="mb-1">
            <BrandLogo customLogoUrl={customLogoUrl} size="lg" />
          </div>
          <p className="text-xs text-palnadu-secondary">Sign in to the admin dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl border border-palnadu-border bg-white p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-palnadu-dark">
              Email
            </label>
            <input
              id="email"
              type="email"
              aria-invalid={Boolean(errors.email)}
              className="flex h-9 w-full rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-body placeholder:text-palnadu-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
              placeholder="admin@palnadu.dev"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-palnadu-error font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-palnadu-dark">
              Password
            </label>
            <input
              id="password"
              type="password"
              aria-invalid={Boolean(errors.password)}
              className="flex h-9 w-full rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-body placeholder:text-palnadu-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-palnadu-error font-medium">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div role="alert" className="rounded-md border border-palnadu-error/30 bg-palnadu-error/5 p-3 text-xs text-palnadu-error font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-palnadu-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-palnadu-dark-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-palnadu-secondary">
          Protected area • Palnadu.dev Internal System
        </p>
      </div>
    </div>
  );
}
