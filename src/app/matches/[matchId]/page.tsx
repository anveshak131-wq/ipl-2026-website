import MatchCenterPage from '@/components/matches/MatchCenterPage';
import { getStaticMatchRouteParams } from '@/lib/staticMatchRouteParams';

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticMatchRouteParams();
}

export default function MatchDetailPage() {
  return <MatchCenterPage backHref="/matches" />;
}
