import MatchCenterPage from '@/components/matches/MatchCenterPage';
import { getStaticMatchRouteParams } from '@/lib/staticMatchRouteParams';
import { Suspense } from 'react';

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticMatchRouteParams();
}

export default function WplMatchDetailPage() {
  return (
    <Suspense fallback={null}>
      <MatchCenterPage backHref="/wpl/matches" preferredLeague="wpl" />
    </Suspense>
  );
}
