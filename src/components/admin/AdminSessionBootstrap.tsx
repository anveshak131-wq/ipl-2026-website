'use client';

import { useEffect } from 'react';

export default function AdminSessionBootstrap() {
  useEffect(() => {
    let cancelled = false;

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
