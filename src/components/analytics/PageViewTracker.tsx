'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';

const VISITOR_KEY = 'sportsup18_visitor_id';

function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;

    const fallbackTick =
      typeof performance !== 'undefined' ? Math.floor(performance.now() * 1000) : Date.now();
    const generated =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `visitor_${Date.now()}_${fallbackTick}`;

    localStorage.setItem(VISITOR_KEY, generated);
    return generated;
  } catch {
    return 'anonymous';
  }
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentLeague } = useLeague();
  const search = useMemo(() => searchParams?.toString() || '', [searchParams]);

  useEffect(() => {
    if (!pathname) return;

    const payload = JSON.stringify({
      path: search ? `${pathname}?${search}` : pathname,
      league: currentLeague,
      visitorId: getVisitorId(),
      referrer: document.referrer || '',
      timestamp: new Date().toISOString(),
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      const queued = navigator.sendBeacon('/api/analytics', blob);
      if (queued) return;
    }

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Analytics must never interrupt navigation.
    });
  }, [currentLeague, pathname, search]);

  return null;
}
