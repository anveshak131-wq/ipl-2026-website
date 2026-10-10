'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WPLOpsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/ops/wpl/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#07080E] flex items-center justify-center text-neutral-400 font-mono text-sm">
      Routing to WPL Dashboard...
    </div>
  );
}
