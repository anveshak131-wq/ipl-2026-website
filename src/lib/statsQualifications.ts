/**
 * Statistics Qualification Criteria
 * 
 * Based on cricket statistics best practices and IPL/WPL standards,
 * these minimum requirements ensure meaningful and fair leaderboards.
 * 
 * Research findings:
 * - Small sample sizes (few matches) can lead to misleading statistics
 * - Players with 2-3 good matches might top charts but not be truly best
 * - Industry standard: Minimum 5-7 matches (35-50% of season) for meaningful stats
 * - IPL teams play 14 matches in regular season
 * - WPL teams play fewer matches, so thresholds are adjusted
 */

export interface QualificationCriteria {
  // Minimum matches played
  minMatches: number;
  // Minimum runs scored (for batting stats)
  minRuns?: number;
  // Minimum wickets taken (for bowling stats)
  minWickets?: number;
  // Minimum innings batted (optional, for more strict qualification)
  minInnings?: number;
  // Minimum overs bowled (optional, for more strict qualification)
  minOvers?: number;
}

/**
 * Qualification criteria for different statistics
 */
export const STATS_QUALIFICATIONS = {
  // Orange Cap - Top Run Scorers
  // Standard: No official minimum, but we use 5 matches for meaningful stats
  orangeCap: {
    minMatches: 5,
    minRuns: 0, // No minimum runs, just matches
  } as QualificationCriteria,

  // Purple Cap - Top Wicket Takers
  // Standard: No official minimum, but we use 5 matches for meaningful stats
  purpleCap: {
    minMatches: 5,
    minWickets: 1, // Must have at least 1 wicket
  } as QualificationCriteria,

  // Best Strike Rates
  // Standard: Minimum 300 runs (IPL standard) + minimum matches
  bestStrikeRate: {
    minMatches: 5,
    minRuns: 300, // IPL standard: 300 runs minimum
  } as QualificationCriteria,

  // Best Economy Rates
  // Standard: Minimum 20 wickets (IPL standard) + minimum matches
  bestEconomy: {
    minMatches: 5,
    minWickets: 20, // IPL standard: 20 wickets minimum
    minOvers: 30, // Approximately 5 matches worth of bowling (6 overs per match)
  } as QualificationCriteria,

  // For WPL (fewer matches, adjusted thresholds)
  wpl: {
    orangeCap: {
      minMatches: 4, // WPL has fewer matches
      minRuns: 0,
    } as QualificationCriteria,
    purpleCap: {
      minMatches: 4,
      minWickets: 1,
    } as QualificationCriteria,
    bestStrikeRate: {
      minMatches: 4,
      minRuns: 200, // Lower threshold for WPL
    } as QualificationCriteria,
    bestEconomy: {
      minMatches: 4,
      minWickets: 15, // Lower threshold for WPL
      minOvers: 20, // Approximately 4 matches worth of bowling
    } as QualificationCriteria,
  },
} as const;

/**
 * Check if a player qualifies for a specific statistic
 */
export function qualifiesForStat(
  player: { stats: { matches: number; runs?: number; wickets?: number; balls?: number } },
  criteria: QualificationCriteria,
  league: 'ipl' | 'wpl' = 'ipl'
): boolean {
  const { minMatches, minRuns, minWickets, minOvers } = criteria;
  const { matches, runs = 0, wickets = 0, balls = 0 } = player.stats;

  // Check minimum matches
  if (matches < minMatches) {
    return false;
  }

  // Check minimum runs (for batting stats)
  if (minRuns !== undefined && runs < minRuns) {
    return false;
  }

  // Check minimum wickets (for bowling stats)
  if (minWickets !== undefined && wickets < minWickets) {
    return false;
  }

  // Check minimum overs (for bowling stats)
  if (minOvers !== undefined) {
    const overs = balls / 6;
    if (overs < minOvers) {
      return false;
    }
  }

  return true;
}

/**
 * Get qualification criteria for a specific stat and league
 */
export function getQualificationCriteria(
  statType: 'orangeCap' | 'purpleCap' | 'bestStrikeRate' | 'bestEconomy',
  league: 'ipl' | 'wpl' = 'ipl'
): QualificationCriteria {
  if (league === 'wpl') {
    return STATS_QUALIFICATIONS.wpl[statType];
  }
  return STATS_QUALIFICATIONS[statType];
}

/**
 * Get human-readable qualification description
 */
export function getQualificationDescription(
  statType: 'orangeCap' | 'purpleCap' | 'bestStrikeRate' | 'bestEconomy',
  league: 'ipl' | 'wpl' = 'ipl'
): string {
  const criteria = getQualificationCriteria(statType, league);
  const parts: string[] = [];

  if (criteria.minMatches) {
    parts.push(`Minimum ${criteria.minMatches} matches`);
  }
  if (criteria.minRuns) {
    parts.push(`Minimum ${criteria.minRuns} runs`);
  }
  if (criteria.minWickets) {
    parts.push(`Minimum ${criteria.minWickets} wickets`);
  }
  if (criteria.minOvers) {
    parts.push(`Minimum ${criteria.minOvers} overs bowled`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No qualification requirements';
}
