'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TeamCard from '@/components/teams/TeamCard';
import PlayerModal from '@/components/teams/PlayerModal';
import { Team, Player } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import AuroraBackground from '@/components/ui/AuroraBackground';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await api.getTeams();
        const playersData = await api.getPlayers();
        
        // Attach players to their respective teams
        const teamsWithPlayers = teamsData.map(team => ({
          ...team,
          players: playersData.filter(player => player.teamId === team.id)
        }));
        
        setTeams(teamsWithPlayers);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="relative py-16 min-h-screen">
        <AuroraBackground />
        
        {/* Floating Animated Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-ipl-blue-light/10 rounded-full blur-3xl -z-10 animate-float" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-ipl-gold/10 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ipl-purple/10 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 animate-slide-up">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold flex items-center gap-2 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-default">
                <Icon name="cricket" size={16} /> IPL TEAMS
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight hover:scale-[1.02] transition-transform duration-300">
              Meet the <span className="bg-gradient-to-r from-ipl-blue-light via-ipl-gold to-ipl-purple bg-clip-text text-transparent animate-glow">Champions</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl">
              Discover the 10 elite teams competing for the IPL 2026 championship with their squads and iconic colors
            </p>
          </div>

          {/* Teams Grid with staggered animations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teams.map((team, index) => (
              <div
                key={team.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TeamCard
                  team={team}
                  onPlayerClick={handlePlayerClick}
                />
              </div>
            ))}
          </div>

          {/* Team Statistics Section with enhanced animations */}
          <div className="mt-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8 md:p-12 group hover:border-ipl-gold/50 transition-all duration-500">
              {/* Animated background */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold/10 to-ipl-purple/10 animate-gradient" />
              </div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

              {/* Content */}
              <div className="relative text-center">
                <div className="inline-flex items-center space-x-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold flex items-center gap-2 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-default">
                    <Icon name="stats" size={16} /> STATISTICS
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 transform group-hover:scale-105 transition-transform duration-300">
                  Team <span className="bg-gradient-to-r from-ipl-gold to-ipl-purple bg-clip-text text-transparent animate-glow">Performance</span>
                </h2>
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto group-hover:text-gray-200 transition-colors duration-300">
                  Comprehensive statistics and performance metrics for all IPL teams competing in 2026
                </p>
                <button 
                  onClick={() => alert('Opening team statistics...')} 
                  className="group relative overflow-hidden rounded-xl font-bold py-3.5 px-10 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #A855F7 100%)',
                    boxShadow: '0 10px 40px rgba(124, 58, 237, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)',
                    border: '2px solid rgba(124, 58, 237, 0.5)',
                    color: '#fff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(124, 58, 237, 0.6), 0 0 80px rgba(147, 51, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(124, 58, 237, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)';
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  
                  {/* Glow effect */}
                  <div 
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                    style={{
                      background: 'radial-gradient(circle, rgba(124, 58, 237, 0.6), transparent)',
                    }}
                  />
                  
                  <span className="relative z-10 flex items-center gap-2 font-black tracking-tight">
                    View Detailed Stats
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  
                  {/* Pulse animation ring */}
                  <div className="absolute inset-0 rounded-xl border-2 opacity-0 group-hover:opacity-100 animate-ping border-purple-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Player Modal */}
      <PlayerModal
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        teamColors={selectedPlayer ? teams.find(t => t.id === selectedPlayer.teamId)?.colors : undefined}
        teamData={selectedPlayer ? teams.find(t => t.id === selectedPlayer.teamId) : undefined}
      />
    </div>
  );
}
