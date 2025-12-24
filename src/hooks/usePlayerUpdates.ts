'use client';

import { useEffect, useCallback } from 'react';
import { api } from '@/lib/data';

/**
 * Hook to listen for player updates and refresh data automatically
 * This enables real-time updates on end-user pages when admin makes changes
 */
export function usePlayerUpdates(
  onPlayerUpdate: (playerId: string) => Promise<void> | void,
  dependencies: any[] = []
) {
  useEffect(() => {
    const handlePlayerUpdate = async (event: CustomEvent) => {
      const { type, playerId } = event.detail || {};
      
      if (type === 'player-updated' && playerId) {
        console.log('Player update detected:', playerId);
        try {
          await onPlayerUpdate(playerId);
        } catch (error) {
          console.error('Error handling player update:', error);
        }
      } else if (type === 'player-created' || type === 'player-deleted') {
        // For create/delete, refresh all data
        console.log('Player list changed, refreshing data...');
        try {
          await onPlayerUpdate('');
        } catch (error) {
          console.error('Error handling player list change:', error);
        }
      }
    };

    window.addEventListener('admin-data-updated', handlePlayerUpdate as EventListener);
    
    return () => {
      window.removeEventListener('admin-data-updated', handlePlayerUpdate as EventListener);
    };
  }, dependencies);
}

/**
 * Hook to fetch and update a specific player by ID
 */
export function usePlayerData(playerId: string | null) {
  const fetchPlayer = useCallback(async (): Promise<any | null> => {
    if (!playerId) return null;
    
    try {
      const allPlayers = await api.getPlayers();
      return allPlayers.find(p => p.id === playerId) || null;
    } catch (error) {
      console.error('Error fetching player:', error);
      return null;
    }
  }, [playerId]);

  return { fetchPlayer };
}

