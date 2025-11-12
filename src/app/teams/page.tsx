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
      
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              IPL Teams 2026
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-ipl-purple to-ipl-gold mx-auto mb-4" />
            <p className="text-gray-300 text-lg">
              Meet the 10 teams competing for the IPL 2026 championship
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
          <div className="mt-16 text-center">
            <div className="glass-effect rounded-xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">
                Team Statistics
              </h2>
              <p className="text-gray-300 mb-6">
                Comprehensive statistics and performance metrics for all IPL teams
              </p>
              <button className="ipl-button">
                View Detailed Stats
              </button>
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
