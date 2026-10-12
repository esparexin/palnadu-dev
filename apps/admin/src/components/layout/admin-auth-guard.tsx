'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.replace('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
