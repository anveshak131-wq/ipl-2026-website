import { mockTeams, mockPlayers } from '@/lib/data';
import { Team, Player } from '@/types';
import TeamDetailClient from './TeamDetailClient';

// Generate static params for all teams
export async function generateStaticParams() {
  return mockTeams.map((team) => ({
    teamId: team.id,
  }));
}

export default async function TeamDetailPage({ params }: { params: { teamId: string } }) {
  const team = mockTeams.find(t => t.id === params.teamId);
  
  if (!team) {
    return (
      <div className="min-h-screen text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Team Not Found</h1>
        <p className="text-gray-400">This team does not exist.</p>
      </div>
    );
  }

  const teamWithPlayers = {
    ...team,
    players: mockPlayers.filter(player => player.teamId === team.id)
  };

  return <TeamDetailClient team={teamWithPlayers} />;
}
