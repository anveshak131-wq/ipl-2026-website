import TeamDetailClient from './TeamDetailClient';

// Generate static params for all teams from default teams
export async function generateStaticParams() {
  // Default teams that will always exist
  const defaultTeams = [
    { teamId: 'team1' },
    { teamId: 'team2' },
    { teamId: 'team3' },
    { teamId: 'team4' },
    { teamId: 'team5' },
    { teamId: 'team6' },
    { teamId: 'team7' },
    { teamId: 'team8' },
    { teamId: 'team9' },
    { teamId: 'team10' }
  ];
  return defaultTeams;
}

export default function TeamDetailPage({ params }: { params: { teamId: string } }) {
  // All data fetching happens client-side in TeamDetailClient
  // This provides static pre-rendered pages for all 10 teams
  return <TeamDetailClient teamId={params.teamId} />;
}
