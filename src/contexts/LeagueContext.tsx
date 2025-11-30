'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { League } from '@/types';

interface LeagueContextType {
  currentLeague: League;
  setCurrentLeague: (league: League) => void;
  isIPL: boolean;
  isWPL: boolean;
  toggleLeague: () => void;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

const LEAGUE_STORAGE_KEY = 'sportsup99_current_league';

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [currentLeague, setCurrentLeagueState] = useState<League>(() => {
    // Always default to IPL for end-user pages
    // Only use stored value if we're on an admin page
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      // If on admin pages, allow stored preference
      if (pathname.includes('/ipl-admin-2026')) {
        const stored = localStorage.getItem(LEAGUE_STORAGE_KEY);
        if (stored === 'ipl' || stored === 'wpl') {
          return stored as League;
        }
      }
      // For end-user pages, always default to IPL
      // Only set to WPL if explicitly on a WPL route
      if (pathname.startsWith('/wpl/') || pathname === '/wpl') {
        return 'wpl';
      }
    }
    return 'ipl';
  });

  // Persist to localStorage when league changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEAGUE_STORAGE_KEY, currentLeague);
    }
  }, [currentLeague]);

  const setCurrentLeague = (league: League) => {
    setCurrentLeagueState(league);
  };

  const toggleLeague = () => {
    setCurrentLeagueState(prev => prev === 'ipl' ? 'wpl' : 'ipl');
  };

  const value: LeagueContextType = {
    currentLeague,
    setCurrentLeague,
    isIPL: currentLeague === 'ipl',
    isWPL: currentLeague === 'wpl',
    toggleLeague,
  };

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
}

