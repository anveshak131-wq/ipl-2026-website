'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TeamCard from '@/components/teams/TeamCard';
import PlayerModal from '@/components/teams/PlayerModal';
import { Team, Player } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
      
      <main className="relative py-16 section-hero-bg min-h-screen">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-ipl-purple/15 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-ipl-gold/10 rounded-full blur-3xl -z-10" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold">
                🏏 IPL TEAMS
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
              Meet the <span className="bg-gradient-to-r from-ipl-gold to-ipl-purple bg-clip-text text-transparent">Champions</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl">
              Discover the 10 elite teams competing for the IPL 2026 championship with their squads and iconic colors
            </p>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onPlayerClick={handlePlayerClick}
              />
            ))}
          </div>

          {/* TODO: Add team statistics section */}
          <div className="mt-16">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8 md:p-12">
              {/* Animated background */}
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold/10 to-ipl-purple/10" />
              </div>

              {/* Content */}
              <div className="relative text-center">
                <div className="inline-flex items-center space-x-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold">
                    📊 STATISTICS
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                  Team <span className="bg-gradient-to-r from-ipl-gold to-ipl-purple bg-clip-text text-transparent">Performance</span>
                </h2>
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                  Comprehensive statistics and performance metrics for all IPL teams competing in 2026
                </p>
                <button onClick={() => alert('Opening team statistics...')} className="bg-gradient-to-r from-ipl-purple to-ipl-gold hover:from-ipl-gold hover:to-ipl-purple text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 cursor-pointer">
                  View Detailed Stats
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
      />
    </div>
  );
}
