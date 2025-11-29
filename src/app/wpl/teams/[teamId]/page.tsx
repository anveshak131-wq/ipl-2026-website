import TeamDetailClient from '@/app/teams/[teamId]/TeamDetailClient';

// Generate static params for WPL teams
export async function generateStaticParams() {
  // WPL teams will be dynamically fetched, but we can pre-generate common IDs
  const defaultWPLTeams = [
    { teamId: 'team11' },
    { teamId: 'team12' },
    { teamId: 'team13' },
    { teamId: 'team14' },
    { teamId: 'team15' }
  ];
  return defaultWPLTeams;
}

export default function WPLTeamDetailPage({ params }: { params: { teamId: string } }) {
  // All data fetching happens client-side in TeamDetailClient
  // This provides static pre-rendered pages for WPL teams
  return <TeamDetailClient teamId={params.teamId} league="wpl" />;
}

