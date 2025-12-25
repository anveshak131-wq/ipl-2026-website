'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLeague } from './LeagueContext';
import { api } from '@/lib/data';

interface Player {
  id: string;
  name: string;
  role: string;
  age: string;
  jerseyNumber: string;
  teamId: string;
  stats?: {
    matches?: number;
    runs?: number;
    wickets?: number;
    battingAverage?: string;
    bowlingAverage?: string;
    battingStrikeRate?: string;
    economy?: string;
    fifties?: number;
    hundreds?: number;
    fiveWickets?: number;
    bestBowling?: string;
  };
}

interface Team {
  id: string;
  name: string;
  code: string;
  logo?: string;
}

interface AdminDataContextType {
  players: Player[];
  teams: Team[];
  loading: boolean;
  error: string;
  refreshData: () => Promise<void>;
  updatePlayer: (playerId: string, updatedPlayer: Partial<Player>) => Promise<void>;
  lastUpdated: number;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
};

interface AdminDataProviderProps {
  children: ReactNode;
}

export const AdminDataProvider = ({ children }: AdminDataProviderProps) => {
  const { currentLeague } = useLeague();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const playersData = await api.getPlayers(undefined, currentLeague);
      const teamsData = await api.getTeams(currentLeague);
      
      setPlayers(playersData);
      setTeams(teamsData);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Failed to load admin data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [currentLeague]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const updatePlayer = async (playerId: string, updatedPlayer: Partial<Player>) => {
    try {
      // Call API to update player
      await api.updatePlayer(playerId, updatedPlayer);
      
      // Update local state immediately
      setPlayers(prev => prev.map(player => 
        player.id === playerId 
          ? { ...player, ...updatedPlayer }
          : player
      ));
      
      setLastUpdated(Date.now());
      
      // Trigger a full refresh to ensure consistency
      await loadData();
    } catch (error) {
      console.error('Failed to update player:', error);
      setError('Failed to update player');
      throw error;
    }
  };

  useEffect(() => {
    loadData();
  }, [currentLeague]);

  // Listen for custom events for real-time updates
  useEffect(() => {
    const handleDataUpdate = async (event: CustomEvent) => {
      const { type, playerId } = event.detail || {};
      
      // Refresh data for any player-related updates
      if (type === 'player-updated' || type === 'player-created' || type === 'player-deleted') {
        console.log('AdminDataContext: Player update detected for player:', playerId, 'type:', type, 'refreshing data...');
        // Small delay to ensure API has processed the update
        setTimeout(async () => {
          await loadData();
          console.log('AdminDataContext: Data refreshed after update');
        }, 200);
      }
    };

    window.addEventListener('admin-data-updated', handleDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('admin-data-updated', handleDataUpdate as EventListener);
    };
  }, [loadData]);

  const value: AdminDataContextType = {
    players,
    teams,
    loading,
    error,
    refreshData,
    updatePlayer,
    lastUpdated
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};
