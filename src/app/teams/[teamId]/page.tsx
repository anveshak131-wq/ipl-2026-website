import { Team } from '@/types';
import TeamDetailClient from './TeamDetailClient';

// Generate static params for all teams from default teams
export async function generateStaticParams() {
  // Default teams that will always exist
  const defaultTeams = [
    { id: 'team1' },
    { id: 'team2' },
    { id: 'team3' },
    { id: 'team4' },
    { id: 'team5' },
    { id: 'team6' },
    { id: 'team7' },
    { id: 'team8' },
    { id: 'team9' },
    { id: 'team10' }
  ];
  return defaultTeams;
}

export default async function TeamDetailPage({ params }: { params: { teamId: string } }) {
  // Fetch team data server-side initially (will be updated client-side with live data)
  try {
    const teamsResponse = await fetch('http://localhost:3000/api/teams', {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (!teamsResponse.ok) {
      throw new Error('Failed to fetch teams');
    }
    
    const teams: Team[] = await teamsResponse.json();
    const team = teams.find(t => t.id === params.teamId);
    
    if (!team) {
      return (
        <div className="min-h-screen text-center py-20">
          <h1 className="text-2xl font-bold text-white mb-4">Team Not Found</h1>
          <p className="text-gray-400">This team does not exist.</p>
        </div>
      );
    }

    return <TeamDetailClient team={team} />;
  } catch (error) {
    console.error('Error fetching team:', error);
    // Return a default team structure - will be populated client-side
    const defaultTeam: Team = {
      id: params.teamId,
      name: 'Loading...',
      shortName: '',
      logo: '',
      description: '',
      colors: { primary: '#000000', secondary: '#000000' },
      players: []
    };
    return <TeamDetailClient team={defaultTeam} />;
  }
}
