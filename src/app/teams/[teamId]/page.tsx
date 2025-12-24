import TeamDetailClient from './TeamDetailClient';
import { api } from '@/lib/data';

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

export default function TeamDetailPage({ params }: { params: { teamId: string } }) {
  // All data fetching happens client-side in TeamDetailClient
  // This provides static pre-rendered pages for all teams
  return <TeamDetailClient teamId={params.teamId} />;
}
