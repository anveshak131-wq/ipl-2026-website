'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/data';
import type { Player, Team } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ModernPlayersPanel from '@/components/players/ModernPlayersPanel';

export default function TeamPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersData, teamsData] = await Promise.all([
          api.getPlayers(),
          api.getTeams()
        ]);
        setPlayers(playersData);
        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            IPL 2026 Players
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore the complete roster of players participating in IPL 2026. 
            Filter by team, role, or search for specific players.
          </p>
        </div>

        <ModernPlayersPanel initialPlayers={players} teams={teams} showHeader={false} />
      </main>

      <Footer />
    </div>
  );
}
