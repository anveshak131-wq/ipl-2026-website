import { League } from '@/contexts/LeagueContext';

/**
 * League-aware API helper
 * Routes requests to the correct league-specific API endpoints
 */

export const leagueApi = {
  /**
   * Get the correct API endpoint prefix based on league
   */
  getEndpointPrefix: (league: League): string => {
    return league === 'ipl' ? '/api/ipl' : '/api/wpl';
  },

  /**
   * Fetch teams for the current league
   */
  getTeams: async (league: League) => {
    const prefix = league === 'ipl' ? '/api/ipl-teams' : '/api/wpl-teams';
    const response = await fetch(prefix);
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  },

  /**
   * Fetch matches for the current league
   */
  getMatches: async (league: League) => {
    const prefix = league === 'ipl' ? '/api/ipl-matches' : '/api/wpl-matches';
    const response = await fetch(prefix);
    if (!response.ok) throw new Error('Failed to fetch matches');
    return response.json();
  },

  /**
   * Fetch players for the current league
   */
  getPlayers: async (league: League) => {
    const prefix = league === 'ipl' ? '/api/ipl-players' : '/api/wpl-players';
    const response = await fetch(prefix);
    if (!response.ok) throw new Error('Failed to fetch players');
    return response.json();
  },

  /**
   * Fetch points table for the current league
   */
  getPointsTable: async (league: League) => {
    const prefix = league === 'ipl' ? '/api/ipl-points-table' : '/api/wpl-points-table';
    const response = await fetch(prefix);
    if (!response.ok) throw new Error('Failed to fetch points table');
    return response.json();
  },

  /**
   * Generic league-aware fetch with authentication
   */
  fetch: async (league: League, endpoint: string, options?: RequestInit) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
    const headers = {
      ...options?.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(endpoint, { ...options, headers });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json();
  },
};
