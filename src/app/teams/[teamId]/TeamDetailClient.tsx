'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PlayerModal from '@/components/teams/PlayerModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuroraBackground from '@/components/ui/AuroraBackground';
import Icon from '@/components/ui/Icon';
import { Team, Player } from '@/types';

interface TeamDetailClientProps {
  teamId: string;
}

export default function TeamDetailClient({ teamId }: TeamDetailClientProps) {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Fetch all teams
        const teamsResponse = await fetch('/api/teams');
        if (teamsResponse.ok) {
          const allTeams = await teamsResponse.json();
          const team = allTeams.find((t: Team) => t.id === teamId);
          
          if (team) {
            // Fetch players
            const playersResponse = await fetch('/api/players');
            if (playersResponse.ok) {
              const allPlayers = await playersResponse.json();
              const teamWithPlayers = {
                ...team,
                players: allPlayers.filter((p: Player) => p.teamId === team.id)
              };
              setTeamData(teamWithPlayers);
            } else {
              setTeamData(team);
            }
          } else {
            setTeamData(null);
          }
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        setTeamData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <AuroraBackground />
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  // Error state - team not found
  if (!teamData) {
    return (
      <div className="min-h-screen">
        <AuroraBackground />
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-white mb-4">Team Not Found</h1>
          <p className="text-gray-400 mb-6">This team does not exist.</p>
          <button
            onClick={() => router.push('/teams')}
            className="px-6 py-2 bg-gradient-to-r from-ipl-blue-dark to-ipl-purple hover:from-ipl-purple hover:to-ipl-gold text-white rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Back to Teams
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <Navbar />
      
      <main className="relative py-16">
        {/* Floating orbs */}
        <div className="absolute top-20 right-10 w-96 h-96 opacity-30 rounded-full blur-3xl animate-float" 
             style={{ 
               backgroundColor: teamData.colors.primary,
               animationDelay: '0s' 
             }} />
        <div className="absolute bottom-20 left-10 w-80 h-80 opacity-20 rounded-full blur-3xl animate-float" 
             style={{ 
               backgroundColor: teamData.colors.secondary,
               animationDelay: '2s' 
             }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button 
            onClick={() => router.push('/teams')}
            className="mb-8 flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 group px-4 py-2 rounded-lg hover:bg-white/10 backdrop-blur-sm animate-slide-up"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold">Back to All Teams</span>
          </button>

          {/* Team Header */}
          <div className="text-center mb-12 animate-fade-in">
            {/* Team Logo */}
            <div className="flex justify-center items-center mb-8">
              <div className="relative group">
                <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center p-4 rounded-3xl border-2 border-white/20 backdrop-blur-sm bg-white/5 transform group-hover:scale-110 transition-all duration-500 group-hover:rotate-3">
                  <img 
                    src={teamData.logo} 
                    alt={`${teamData.shortName} logo`}
                    className="w-full h-full object-contain drop-shadow-2xl animate-float"
                  />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 -z-10 blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 rounded-full"
                     style={{
                       background: `radial-gradient(circle, ${teamData.colors.primary}40, ${teamData.colors.secondary}20)`
                     }} />
              </div>
            </div>

            {/* Team Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-4 hover:scale-105 transition-transform">
              <Icon name="team" size={16} />
              <span className="text-sm font-bold text-white">{teamData.shortName}</span>
            </div>

            {/* Team Name */}
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight hover:scale-105 transition-transform duration-300"
                style={{
                  textShadow: `0 0 40px ${teamData.colors.primary}60`
                }}>
              {teamData.name}
            </h1>
            
            {/* Decorative Line */}
            <div className="h-1 w-32 mx-auto mb-6 rounded-full animate-glow" 
                 style={{
                   background: `linear-gradient(to right, ${teamData.colors.primary}, ${teamData.colors.secondary})`
                 }} />
            
            {/* Description */}
            <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
              {teamData.description}
            </p>
            
            {/* Team Colors */}
            <div className="flex justify-center gap-6 mb-10">
              <div className="group text-center">
                <div className="relative">
                  <div 
                    className="w-16 h-16 rounded-full border-3 border-white/40 mx-auto mb-2 shadow-lg transform group-hover:scale-110 transition-all duration-300 animate-pulse"
                    style={{ 
                      backgroundColor: teamData.colors.primary,
                      boxShadow: `0 0 30px ${teamData.colors.primary}60`
                    }}
                  />
                </div>
                <p className="text-gray-300 text-sm font-semibold">Primary</p>
              </div>
              <div className="group text-center">
                <div className="relative">
                  <div 
                    className="w-16 h-16 rounded-full border-3 border-white/40 mx-auto mb-2 shadow-lg transform group-hover:scale-110 transition-all duration-300 animate-pulse"
                    style={{ 
                      backgroundColor: teamData.colors.secondary,
                      boxShadow: `0 0 30px ${teamData.colors.secondary}60`,
                      animationDelay: '0.5s'
                    }}
                  />
                </div>
                <p className="text-gray-300 text-sm font-semibold">Secondary</p>
              </div>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6 hover:scale-105 transform transition-all duration-300 hover:border-white/40 group">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity"
                     style={{ background: `linear-gradient(to bottom right, ${teamData.colors.primary}, ${teamData.colors.secondary})` }} />
                <p className="text-3xl font-black mb-1" style={{ color: teamData.colors.primary }}>
                  {teamData.players?.length || 0}
                </p>
                <p className="text-gray-400 text-sm font-semibold">Total Players</p>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6 hover:scale-105 transform transition-all duration-300 hover:border-white/40 group">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity"
                     style={{ background: `linear-gradient(to bottom right, ${teamData.colors.primary}, ${teamData.colors.secondary})` }} />
                <p className="text-3xl font-black mb-1" style={{ color: teamData.colors.primary }}>
                  {teamData.players?.filter(p => p.isCaptain).length || 0}
                </p>
                <p className="text-gray-400 text-sm font-semibold">Captains</p>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6 hover:scale-105 transform transition-all duration-300 hover:border-white/40 group">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity"
                     style={{ background: `linear-gradient(to bottom right, ${teamData.colors.primary}, ${teamData.colors.secondary})` }} />
                <p className="text-3xl font-black mb-1" style={{ color: teamData.colors.primary }}>
                  {teamData.players?.filter(p => p.nationality !== 'India').length || 0}
                </p>
                <p className="text-gray-400 text-sm font-semibold">Foreign Players</p>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6 hover:scale-105 transform transition-all duration-300 hover:border-white/40 group">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity"
                     style={{ background: `linear-gradient(to bottom right, ${teamData.colors.primary}, ${teamData.colors.secondary})` }} />
                <p className="text-3xl font-black mb-1" style={{ color: teamData.colors.primary }}>
                  {teamData.players?.filter(p => p.role === 'All-rounder').length || 0}
                </p>
                <p className="text-gray-400 text-sm font-semibold">All-rounders</p>
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
