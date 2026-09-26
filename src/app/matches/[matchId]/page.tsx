import MatchCenterPage from '@/components/matches/MatchCenterPage';
import { getStaticMatchRouteParams } from '@/lib/staticMatchRouteParams';
import { Suspense } from 'react';

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticMatchRouteParams();
}

export default function MatchDetailPage() {
  return (
    <Suspense fallback={null}>
      <MatchCenterPage backHref="/matches" />
    </Suspense>
  );
}
