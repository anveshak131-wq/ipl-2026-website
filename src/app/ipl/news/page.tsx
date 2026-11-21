import type { Metadata } from 'next';
import UnifiedNewsView from '@/components/news/UnifiedNewsView';

export const metadata: Metadata = {
  title: 'IPL News - Latest IPL 2026 & 2027 Stories, Trades, Mini-Auction & Team Intel | SportsUP18',
  description:
    'Dedicated IPL newsroom covering IPL Season 20, Goa mini-auction updates, player retentions, trades, dugout moves, and verified tournament reporting.',
};

export default function IplNewsPage() {
  return <UnifiedNewsView pageContext="ipl" initialLeagueScope="ipl" lockedLeague="ipl" />;
}
