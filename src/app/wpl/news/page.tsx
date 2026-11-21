import type { Metadata } from 'next';
import UnifiedNewsView from '@/components/news/UnifiedNewsView';

export const metadata: Metadata = {
  title: "WPL News - Latest Women's Premier League 2027 Stories, Fixtures & Squads | SportsUP18",
  description:
    'Official WPL newsroom covering WPL Season 5, Vadodara & Mumbai-CCI venue schedules, Kochi auction signings, and championship title races.',
};

export default function WplNewsPage() {
  return <UnifiedNewsView pageContext="wpl" initialLeagueScope="wpl" lockedLeague="wpl" />;
}
