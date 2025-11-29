"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLeague } from '@/contexts/LeagueContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const { currentLeague } = useLeague();

  // Redirect to the appropriate league home page
  useEffect(() => {
    router.push(`/${currentLeague}`);
  }, [currentLeague, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950">
      <LoadingSpinner size="lg" />
    </div>
  );
}
