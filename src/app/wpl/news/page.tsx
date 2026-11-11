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
    // Redirect to main news hub with explicit WPL 2027 filter
    router.replace('/news?league=wpl');
  }, [router, setCurrentLeague]);

  return null;
}
