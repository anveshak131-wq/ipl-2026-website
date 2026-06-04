'use client';

import { useEffect } from 'react';
import { installAdminCsrfFetch, setAdminCsrfToken } from '@/lib/admin/csrf';

export default function AdminSessionBootstrap() {
  useEffect(() => {
    let cancelled = false;
    installAdminCsrfFetch();

    const syncSession = async () => {
      try {
        const response = await fetch('/api/admin/session', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok || cancelled) return;

        const data = await response.json();
        if (!data.success || !data.token) return;

        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('authToken', data.token);
        setAdminCsrfToken(data.csrfToken);
      } catch {
        // Session bootstrap is best-effort; middleware still protects the route.
      }
    };

    syncSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
