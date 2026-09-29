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
  const [currentLeague, setCurrentLeagueState] = useState<League>('ipl');
  const [initialized, setInitialized] = useState(false);

  // Initialize league on mount only
  useEffect(() => {
    if (initialized) return;
    
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      let initialLeague: League = 'ipl';
      
        // If on WPL admin/ops pages, always use WPL
        if (pathname.includes('/wpl-admin-2026') || pathname.startsWith('/ops/wpl')) {
          initialLeague = 'wpl';
        }
        // If on IPL admin/ops pages, always use IPL
        else if (pathname.includes('/ipl-admin-2026') || pathname.startsWith('/ops/ipl')) {
          initialLeague = 'ipl';
        }
      // For end-user pages, default to IPL unless explicitly on WPL route
      else if (pathname.startsWith('/wpl/') || pathname === '/wpl') {
        initialLeague = 'wpl';
      }
      
      setCurrentLeagueState(initialLeague);
    }
    setInitialized(true);
  }, [initialized]);

  // Persist to localStorage when league changes (but not on initial load)
  useEffect(() => {
    if (!initialized) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEAGUE_STORAGE_KEY, currentLeague);
    }
  }, [currentLeague, initialized]);

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

