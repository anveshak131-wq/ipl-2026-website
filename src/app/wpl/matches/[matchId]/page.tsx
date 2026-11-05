import React, { Suspense } from 'react';
import WplMatchDetailClient from './WplMatchDetailClient';

export async function generateStaticParams() {
  const paths: { matchId: string }[] = [];
  for (let i = 1; i <= 25; i++) {
    paths.push({ matchId: String(i) });
    paths.push({ matchId: `wpl-2027-m${String(i).padStart(2, '0')}` });
  }
  return paths;
}

export default function WplMatchDetailPage({
  params
}: {
  params: { matchId: string };
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading match...</div>}>
      <WplMatchDetailClient params={{ matchId: params?.matchId || '1' }} />
    </Suspense>
  );
}
