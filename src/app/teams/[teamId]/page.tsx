import TeamDetailClient from './TeamDetailClient';

// Generate static params for all teams from default teams
export async function generateStaticParams() {
  // Generate both numeric IDs (1, 2, 3...) and team prefix versions (team1, team2, team3...)
  // to support both URL formats: /teams/3 and /teams/team3
  const defaultTeams = [];
  for (let i = 1; i <= 10; i++) {
    defaultTeams.push({ teamId: String(i) });      // Numeric format: /teams/1, /teams/2, etc.
    defaultTeams.push({ teamId: `team${i}` });     // Team prefix format: /teams/team1, /teams/team2, etc.
  }
  return defaultTeams;
}

export default function TeamDetailPage({ params }: { params: { teamId: string } }) {
  // All data fetching happens client-side in TeamDetailClient
  // This provides static pre-rendered pages for all 10 teams
  return <TeamDetailClient teamId={params.teamId} />;
}
