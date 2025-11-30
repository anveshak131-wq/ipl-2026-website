/**
 * Utility functions for playoff matches
 */

import { Team, League, PlayoffType } from '@/types';

/**
 * Get TBD (To Be Determined) team placeholder
 * @param league - The league (IPL or WPL)
 * @param position - Position label (e.g., "1st Place", "2nd Place", "Winner of Eliminator")
 * @returns A placeholder team object
 */
export function getTBDTeam(league: League, position: string = 'TBD'): Team {
  // For WPL, clarify that these are placeholders from the original 5 teams
  const description = league === 'wpl' 
    ? `Placeholder - Will be replaced with one of the 5 WPL teams based on points table standings after league stage`
    : `Team to be determined based on league standings`;
  
  return {
    id: `tbd-${league}-${position.toLowerCase().replace(/\s+/g, '-')}`,
    league,
    name: `TBD Team`,
    shortName: 'TBD', // Always use "TBD" for placeholder teams
    logo: '/logos/tba_logo.svg', // Use TBA logo for placeholder teams
    description,
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
  // WPL Structure: 2nd vs 3rd in Eliminator, Winner vs 1st in Final
  const wplPlayoffs = {
    qualifier1: {
      date: '2026-03-15', // Adjust based on season - can be edited manually
      time: '19:30', // Can be edited manually
      venue: 'Dr. DY Patil Sports Academy, Navi Mumbai', // Can be edited manually
      team1Label: '1st Place',
      team2Label: '2nd Place',
      title: 'Qualifier 1'
    },
    eliminator: {
      date: '2026-03-16', // Can be edited manually in admin
      time: '19:30', // Can be edited manually in admin
      venue: 'Dr. DY Patil Sports Academy, Navi Mumbai', // Can be edited manually in admin
      team1Label: '2nd Place',
      team2Label: '3rd Place',
      title: 'Eliminator'
    },
    qualifier2: {
      date: '2026-03-18', // Can be edited manually
      time: '19:30', // Can be edited manually
      venue: 'Dr. DY Patil Sports Academy, Navi Mumbai', // Can be edited manually
      team1Label: 'Loser of Qualifier 1',
      team2Label: 'Winner of Eliminator',
      title: 'Qualifier 2'
    },
    final: {
      date: '2026-03-20', // Can be edited manually in admin
      time: '19:30', // Can be edited manually in admin
      venue: 'Dr. DY Patil Sports Academy, Navi Mumbai', // Can be edited manually in admin
      team1Label: '1st Place',
      team2Label: 'Winner of Eliminator',
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

/**
 * Check if a team is a placeholder/TBD team (should not be displayed in team listings)
 * @param team - The team to check
 * @returns true if the team is a placeholder/TBD team
 */
export function isPlaceholderTeam(team: Team): boolean {
  // Check if team ID starts with 'tbd-'
  if (team.id.startsWith('tbd-')) {
    return true;
  }
  
  // Check if team name contains placeholder indicators
  const placeholderIndicators = [
    'Place Team',
    '1st Place',
    '2nd Place',
    '3rd Place',
    '4th Place',
    'Winner of',
    'Loser of',
    'Eliminator',
    'TBD'
  ];
  
  const nameLower = team.name.toLowerCase();
  const shortNameLower = (team.shortName || '').toLowerCase();
  
  return placeholderIndicators.some(indicator => 
    nameLower.includes(indicator.toLowerCase()) || 
    shortNameLower.includes(indicator.toLowerCase())
  );
}

