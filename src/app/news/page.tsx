import type { Metadata } from 'next';
import UnifiedNewsView from '@/components/news/UnifiedNewsView';

export const metadata: Metadata = {
  title: 'Cricket News Hub - Latest IPL 2027 & WPL Season 5 Intelligence | SportsUP18',
  description:
    'The unified 2027 cricket newsroom combining verified coverage across the IPL Goa mini-auction, franchise retentions, and WPL Season 5 title race.',
};

export default function CommonNewsPage() {
  return <UnifiedNewsView pageContext="common" initialLeagueScope="all" />;
}
