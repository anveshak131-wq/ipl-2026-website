'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/data';
import type { Player, Team } from '@/types';
import ModernPlayersPanel from '../players/ModernPlayersPanel';

interface TeamPlayersTabProps {
  teamId: string;
  teamName: string;
  initialPlayers?: Player[];
}

export default function TeamPlayersTab({ teamId, teamName, initialPlayers = [] }: TeamPlayersTabProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isLoading, setIsLoading] = useState(!initialPlayers.length);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!initialPlayers.length) {
          const [playersData, teamsData] = await Promise.all([
            api.getPlayers(),
            api.getTeams()
          ]);
          setPlayers(playersData.filter(p => p.teamId === teamId));
          setTeams(teamsData);
        } else {
          const teamsData = await api.getTeams();
          setTeams(teamsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [teamId, initialPlayers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          {teamName} Squad {new Date().getFullYear()}
        </h2>
        <p className="text-slate-400">
          Meet the players representing {teamName} in the current season
        </p>
      </div>
      
      <ModernPlayersPanel 
        initialPlayers={players} 
        teams={teams}
      />
    </div>
  );
}
