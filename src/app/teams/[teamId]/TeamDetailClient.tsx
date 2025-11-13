'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PlayerModal from '@/components/teams/PlayerModal';
import { Team, Player } from '@/types';

interface TeamDetailClientProps {
  team: Team;
}

export default function TeamDetailClient({ team }: TeamDetailClientProps) {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamData, setTeamData] = useState<Team>(team);

  useEffect(() => {
    const fetchLiveTeamData = async () => {
      try {
        // Fetch live teams data
        const teamsResponse = await fetch('/api/teams');
        if (teamsResponse.ok) {
          const liveTeams = await teamsResponse.json();
          const liveTeam = liveTeams.find((t: Team) => t.id === team.id);
          if (liveTeam) {
            // Fetch live players data
            const playersResponse = await fetch('/api/players');
            if (playersResponse.ok) {
              const livePlayers = await playersResponse.json();
              const teamWithLivePlayers = {
                ...liveTeam,
                players: livePlayers.filter((p: Player) => p.teamId === liveTeam.id)
              };
              setTeamData(teamWithLivePlayers);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching live data:', error);
        // Keep using initial data if fetch fails
      }
    };

    fetchLiveTeamData();
  }, [team.id]);

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button 
            onClick={() => router.push('/teams')}
            className="mb-8 flex items-center text-gray-300 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Teams
          </button>

          {/* Team Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center mb-6">
              <div className="w-32 h-32 flex items-center justify-center">
                <img 
                  src={teamData.logo} 
                  alt={`${teamData.shortName} logo`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {teamData.name}
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-ipl-purple to-ipl-gold mx-auto mb-4" />
            <p className="text-gray-300 text-lg mb-6">
              {teamData.description}
            </p>
            
            {/* Team Colors */}
            <div className="flex justify-center space-x-4 mb-8">
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full border-2 border-white/30 mx-auto mb-2"
                  style={{ backgroundColor: teamData.colors.primary }}
                />
                <p className="text-gray-400 text-sm">Primary</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full border-2 border-white/30 mx-auto mb-2"
                  style={{ backgroundColor: teamData.colors.secondary }}
                />
                <p className="text-gray-400 text-sm">Secondary</p>
              </div>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-12">
              <div className="glass-effect rounded-lg p-4">
                <p className="text-2xl font-bold text-ipl-gold">
                  {teamData.players?.length || 0}
                </p>
                <p className="text-gray-400 text-sm">Total Players</p>
              </div>
              <div className="glass-effect rounded-lg p-4">
                <p className="text-2xl font-bold text-ipl-gold">
                  {teamData.players?.filter(p => p.isCaptain).length || 0}
                </p>
                <p className="text-gray-400 text-sm">Captains</p>
              </div>
              <div className="glass-effect rounded-lg p-4">
                <p className="text-2xl font-bold text-ipl-gold">
                  {teamData.players?.filter(p => p.nationality !== 'India').length || 0}
                </p>
                <p className="text-gray-400 text-sm">Foreign Players</p>
              </div>
              <div className="glass-effect rounded-lg p-4">
                <p className="text-2xl font-bold text-ipl-gold">
                  {teamData.players?.filter(p => p.role === 'All-rounder').length || 0}
                </p>
                <p className="text-gray-400 text-sm">All-rounders</p>
              </div>
            </div>
          </div>

          {/* Players Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Full Squad
            </h2>
            
            {teamData.players && teamData.players.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamData.players.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => handlePlayerClick(player)}
                    className="ipl-card hover:scale-105 transform transition-all duration-300 cursor-pointer"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-ipl-gold/20 text-ipl-gold rounded-full font-bold">
                            {player.jerseyNumber || '-'}
                          </span>
                          <div>
                            <h3 className="text-white font-semibold text-lg">
                              {player.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {player.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          {player.isCaptain && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                              ⭐ Captain
                            </span>
                          )}
                          {player.nationality !== 'India' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              🌍 Foreign
                            </span>
                          )}
                          {player.role === 'Wicket-keeper' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                              🧤 WK
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Age:</span>
                          <span className="text-white">{player.age}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Nationality:</span>
                          <span className="text-white">{player.nationality}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Batting:</span>
                          <span className="text-white">{player.battingStyle || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bowling:</span>
                          <span className="text-white">{player.bowlingStyle || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-ipl-gold font-bold">{player.stats.matches}</p>
                            <p className="text-gray-400 text-xs">Matches</p>
                          </div>
                          <div>
                            <p className="text-ipl-gold font-bold">{player.stats.runs}</p>
                            <p className="text-gray-400 text-xs">Runs</p>
                          </div>
                          <div>
                            <p className="text-ipl-gold font-bold">{player.stats.wickets}</p>
                            <p className="text-gray-400 text-xs">Wickets</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="glass-effect rounded-xl p-8 max-w-md mx-auto">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    No Players Added Yet
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Players can be added via the Admin Panel
                  </p>
                  <button 
                    onClick={() => router.push('/admin/players')}
                    className="ipl-button"
                  >
                    Go to Admin Panel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Player Modal */}
      <PlayerModal
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
