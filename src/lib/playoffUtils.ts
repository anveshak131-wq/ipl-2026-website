/**
 * Utility functions for playoff matches
 */

import { Team, League } from '@/types';

/**
 * Get TBD (To Be Determined) team placeholder
 * @param league - The league (IPL or WPL)
 * @param position - Position label (e.g., "1st", "2nd", "Winner", "Loser")
 * @returns A placeholder team object
 */
export function getTBDTeam(league: League, position: string = 'TBD'): Team {
  const leagueName = league.toUpperCase();
  return {
    id: `tbd-${league}-${position.toLowerCase().replace(/\s+/g, '-')}`,
    league,
    name: `${position} Place Team`,
    shortName: position === 'TBD' ? 'TBD' : position,
    logo: '',
    description: `Team to be determined based on league standings`,
    colors: {
      primary: league === 'ipl' ? '#004BA0' : '#9C27B0',
      secondary: '#FFFFFF'
    },
    players: [],
    trophies: [],
    homeGrounds: []
  };
}

/**
 * Get playoff match details (fixed dates, times, venues)
 * @param playoffType - Type of playoff match
 * @param league - The league (IPL or WPL)
 * @returns Object with date, time, venue, and team labels
 */
export function getPlayoffMatchDetails(playoffType: PlayoffType, league: League): {
  date: string;
  time: string;
  venue: string;
  team1Label: string;
  team2Label: string;
  title: string;
} | null {
  if (!playoffType) return null;

  // IPL Playoff venues and times (adjust as needed)
  const iplPlayoffs = {
    qualifier1: {
      date: '2026-05-20', // Adjust based on season
      time: '19:30',
      venue: 'Narendra Modi Stadium, Ahmedabad',
      team1Label: '1st Place',
      team2Label: '2nd Place',
      title: 'Qualifier 1'
    },
    eliminator: {
      date: '2026-05-21',
      time: '19:30',
      venue: 'Narendra Modi Stadium, Ahmedabad',
      team1Label: '3rd Place',
      team2Label: '4th Place',
      title: 'Eliminator'
    },
    qualifier2: {
      date: '2026-05-23',
      time: '19:30',
      venue: 'Narendra Modi Stadium, Ahmedabad',
      team1Label: 'Loser of Qualifier 1',
      team2Label: 'Winner of Eliminator',
      title: 'Qualifier 2'
    },
    final: {
      date: '2026-05-25',
      time: '19:30',
      venue: 'Narendra Modi Stadium, Ahmedabad',
      team1Label: 'Winner of Qualifier 1',
      team2Label: 'Winner of Qualifier 2',
      title: 'Final'
    }
  };

  // WPL Playoff venues and times
  const wplPlayoffs = {
    qualifier1: {
      date: '2026-03-15', // Adjust based on season
      time: '19:30',
      venue: 'Dr. DY Patil Sports Academy, Navi Mumbai',
      team1Label: '1st Place',
      team2Label: '2nd Place',
      title: 'Qualifier 1'
    },
    eliminator: {
      date: '2026-03-16',
      time: '19:30',
      venue: 'Dr. DY Patil Sports Academy, Navi Mumbai',
      team1Label: '3rd Place',
      team2Label: '4th Place',
      title: 'Eliminator'
    },
    qualifier2: {
      date: '2026-03-18',
      time: '19:30',
      venue: 'Dr. DY Patil Sports Academy, Navi Mumbai',
      team1Label: 'Loser of Qualifier 1',
      team2Label: 'Winner of Eliminator',
      title: 'Qualifier 2'
    },
    final: {
      date: '2026-03-20',
      time: '19:30',
      venue: 'Dr. DY Patil Sports Academy, Navi Mumbai',
      team1Label: 'Winner of Qualifier 1',
      team2Label: 'Winner of Qualifier 2',
      title: 'Final'
    }
  };

  const playoffs = league === 'ipl' ? iplPlayoffs : wplPlayoffs;
  return playoffs[playoffType] || null;
}

/**
 * Get all playoff types
 */
export function getPlayoffTypes(): { value: PlayoffType; label: string }[] {
  return [
    { value: 'qualifier1', label: 'Qualifier 1' },
    { value: 'eliminator', label: 'Eliminator' },
    { value: 'qualifier2', label: 'Qualifier 2' },
    { value: 'final', label: 'Final' }
  ];
}

