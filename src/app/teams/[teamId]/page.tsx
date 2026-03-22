import TeamDetailClient from './TeamDetailClient';
import type { Metadata } from 'next';
import { api, mockTeams } from '@/lib/data';

// Generate static params for all teams using shortNames (RCB, MI, CSK, etc.)
export async function generateStaticParams() {
  try {
    // Fetch teams to get their shortNames
    const teams = await api.getTeams('ipl');
    
    // Generate routes with shortNames (RCB, MI, CSK, etc.)
    const params = teams.map(team => ({
      teamId: team.shortName.toLowerCase() // RCB, MI, CSK, etc.
    }));
    
    // Also support legacy numeric and team prefix formats for backward compatibility
    for (let i = 1; i <= 10; i++) {
      params.push({ teamId: String(i) });      // Numeric format: /teams/1, /teams/2, etc.
      params.push({ teamId: `team${i}` });     // Team prefix format: /teams/team1, /teams/team2, etc.
    }
    
    return params;
  } catch (error) {
    console.error('Error generating static params:', error);
    // Fallback to default teams if API fails
    const defaultShortNames = ['rcb', 'mi', 'csk', 'kkr', 'dc', 'srh', 'rr', 'pbks', 'gt', 'lsg'];
    return defaultShortNames.map(name => ({ teamId: name }));
  }
}

export async function generateMetadata(
  { params }: { params: { teamId: string } },
): Promise<Metadata> {
  const slug = String(params.teamId || '').toLowerCase();

  const teams = (mockTeams || []).filter((t) => t.league === 'ipl');
  const team =
    teams.find((t) => t.shortName?.toLowerCase() === slug) ||
    teams.find((t) => String(t.id) === slug || `team${String(t.id)}`.toLowerCase() === slug);

  if (team) {
    const title = `${team.name} (${team.shortName}) | SportsUP18`;
    const description =
      team.description ||
      `Explore ${team.name} squad, fixtures, stats, and updates for IPL 2026 on SportsUP18.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: team.logo ? [team.logo] : undefined,
      },
    };
  }

  const fallbackTitle = `Team ${slug.toUpperCase()} | SportsUP18`;
  return {
    title: fallbackTitle,
    description: `Explore team squad, fixtures, stats, and updates for IPL 2026 on SportsUP18.`,
    openGraph: {
      title: fallbackTitle,
      description: `Explore team squad, fixtures, stats, and updates for IPL 2026 on SportsUP18.`,
    },
  };
}

export default function TeamDetailPage({ params }: { params: { teamId: string } }) {
  // All data fetching happens client-side in TeamDetailClient
  // This provides static pre-rendered pages for all teams
  return <TeamDetailClient teamId={params.teamId} league="ipl" />;
}
