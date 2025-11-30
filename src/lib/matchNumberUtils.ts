/**
 * Utility functions for generating match numbers based on date and time
 */

import { Match } from '@/types';

/**
 * Generate match number for a match based on its position in chronological order
 * @param match - The match to generate a number for
 * @param allMatches - All matches in the same league, sorted by date and time
 * @returns Match number string (e.g., "IPL-001", "WPL-042")
 */
export function generateMatchNumber(match: Match, allMatches: Match[]): string {
  const league = match.league || 'ipl';
  const leaguePrefix = league.toUpperCase();
  
  // Filter matches by the same league
  const leagueMatches = allMatches.filter(m => (m.league || 'ipl') === league);
  
  // Sort matches by date and time
  const sortedMatches = [...leagueMatches].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}:00`).getTime();
    const dateB = new Date(`${b.date}T${b.time}:00`).getTime();
    return dateA - dateB;
  });
  
  // Find the index of the current match in the sorted array
  const matchIndex = sortedMatches.findIndex(m => m.id === match.id);
  
  // If match not found, append it to the end
  const position = matchIndex >= 0 ? matchIndex + 1 : sortedMatches.length + 1;
  
  // Format as "IPL-001", "WPL-042", etc.
  return `${leaguePrefix}-${String(position).padStart(3, '0')}`;
}

/**
 * Recalculate match numbers for all matches in a league
 * This should be called when matches are created, updated, or deleted
 * @param matches - All matches to recalculate numbers for
 * @returns Matches with updated match numbers
 */
export function recalculateMatchNumbers(matches: Match[]): Match[] {
  // Group matches by league
  const iplMatches = matches.filter(m => (m.league || 'ipl') === 'ipl');
  const wplMatches = matches.filter(m => (m.league || 'ipl') === 'wpl');
  
  // Sort each league's matches by date and time
  const sortMatches = (ms: Match[]) => {
    return [...ms].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}:00`).getTime();
      const dateB = new Date(`${b.date}T${b.time}:00`).getTime();
      return dateA - dateB;
    });
  };
  
  const sortedIPL = sortMatches(iplMatches);
  const sortedWPL = sortMatches(wplMatches);
  
  // Assign match numbers
  const updatedMatches = matches.map(match => {
    const league = match.league || 'ipl';
    const sortedLeagueMatches = league === 'ipl' ? sortedIPL : sortedWPL;
    const position = sortedLeagueMatches.findIndex(m => m.id === match.id);
    
    if (position >= 0) {
      const leaguePrefix = league.toUpperCase();
      const matchNumber = `${leaguePrefix}-${String(position + 1).padStart(3, '0')}`;
      return { ...match, matchNumber };
    }
    
    return match;
  });
  
  return updatedMatches;
}

/**
 * Get playoff type display name
 * @param playoffType - The playoff type
 * @returns Formatted playoff type string
 */
function getPlayoffTypeDisplay(playoffType: Match['playoffType']): string {
  if (!playoffType) return '';
  
  const playoffTypeMap: { [key: string]: string } = {
    'qualifier1': 'Qualifier 1',
    'eliminator': 'Eliminator',
    'qualifier2': 'Qualifier 2',
    'final': 'Final'
  };
  
  return playoffTypeMap[playoffType] || '';
}

/**
 * Get match number for display
 * @param match - The match
 * @param allMatches - All matches (optional, for WPL last two matches logic)
 * @returns Formatted match number string with playoff type if applicable
 */
export function getMatchNumberDisplay(match: Match, allMatches?: Match[]): string {
  const matchNumber = match.matchNumber || '';
  const playoffType = getPlayoffTypeDisplay(match.playoffType);
  
  // For WPL, if it's one of the last two matches (Eliminator or Final), show just the playoff type
  if (match.league === 'wpl' && allMatches) {
    const wplMatches = allMatches
      .filter(m => m.league === 'wpl')
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}:00`).getTime();
        const dateB = new Date(`${b.date}T${b.time}:00`).getTime();
        return dateA - dateB;
      });
    
    const matchIndex = wplMatches.findIndex(m => m.id === match.id);
    const totalWPLMatches = wplMatches.length;
    
    // Last two matches should show just "Eliminator" and "Final"
    if (matchIndex >= totalWPLMatches - 2) {
      if (matchIndex === totalWPLMatches - 2) {
        // Second to last match = Eliminator
        return 'Eliminator';
      } else if (matchIndex === totalWPLMatches - 1) {
        // Last match = Final
        return 'Final';
      }
    }
  }
  
  if (playoffType && matchNumber) {
    return `${matchNumber} - ${playoffType}`;
  } else if (playoffType) {
    return playoffType;
  } else if (matchNumber) {
    return matchNumber;
  }
  
  return 'TBD';
}

