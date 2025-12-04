import TeamDetailClient from '@/app/teams/[teamId]/TeamDetailClient';

// Generate static params for WPL teams
export async function generateStaticParams() {
  // Generate both numeric IDs (11, 12, 13...) and team prefix versions (team11, team12, team13...)
  // to support both URL formats: /wpl/teams/11 and /wpl/teams/team11
  // WPL teams typically use IDs 11-15, but we'll generate a wider range for flexibility
  const defaultWPLTeams = [];
  for (let i = 11; i <= 15; i++) {
    defaultWPLTeams.push({ teamId: String(i) });      // Numeric format: /wpl/teams/11, /wpl/teams/12, etc.
    defaultWPLTeams.push({ teamId: `team${i}` });     // Team prefix format: /wpl/teams/team11, /wpl/teams/team12, etc.
  }
  return defaultWPLTeams;
}

export default function WPLTeamDetailPage({ params }: { params: { teamId: string } }) {
  // All data fetching happens client-side in TeamDetailClient
  // This provides static pre-rendered pages for WPL teams
  return <TeamDetailClient teamId={params.teamId} league="wpl" />;
}

