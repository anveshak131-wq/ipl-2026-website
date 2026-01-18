'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';

export default function WPLNewsPage() {
  const router = useRouter();
  const { setCurrentLeague } = useLeague();

  useEffect(() => {
    // Set league to WPL
    setCurrentLeague('wpl');
    // Redirect to main news page which handles league-aware filtering
    router.replace('/news');
  }, [router, setCurrentLeague]);

  return null;
}
