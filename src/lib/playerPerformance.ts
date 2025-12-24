/**
 * Player Performance Calculation Utilities
 * Based on cricket statistics best practices and industry standards
 */

import { Player } from '@/types';

export interface OverallPerformance {
  rating: number; // Overall rating out of 100
  breakdown: {
    label: string;
    value: number | string;
    weight: number;
  }[];
  summary: string;
}

/**
 * Calculate overall performance for Batsmen and Wicket-keepers
 * Uses: Batting Average, Strike Rate, Boundary Percentage, Consistency (50s/100s)
 */
export function calculateBatterPerformance(player: Player): OverallPerformance {
  const stats = player.stats || {};
  
  // Extract values
  const runs = stats.runs || 0;
  const matches = stats.matches || 0;
  const battingInnings = stats.battingInnings || 0;
  const notOuts = stats.notOuts || 0;
  const ballsFaced = stats.ballsFaced || 0;
  const fours = stats.fours || 0;
  const sixes = stats.sixes || 0;
  const fifties = stats.fifties || 0;
  const hundreds = stats.hundreds || 0;
  const highest = stats.highest || 0;
  
  // Get average (prefer explicit, then calculate)
  let battingAvg = 0;
  if (stats.battingAverage && stats.battingAverage !== '0' && stats.battingAverage !== '-') {
    battingAvg = parseFloat(stats.battingAverage) || 0;
  } else if (stats.average) {
    battingAvg = stats.average;
  } else if (battingInnings > 0 && notOuts >= 0) {
    const dismissals = battingInnings - notOuts;
    if (dismissals > 0) {
      battingAvg = runs / dismissals;
    }
  }
  
  // Get strike rate (prefer explicit, then calculate)
  let strikeRate = 0;
  if (stats.battingStrikeRate && stats.battingStrikeRate !== '0' && stats.battingStrikeRate !== '-') {
    strikeRate = parseFloat(stats.battingStrikeRate) || 0;
  } else if (stats.strikeRate) {
    strikeRate = stats.strikeRate;
  } else if (ballsFaced > 0) {
    strikeRate = (runs * 100) / ballsFaced;
  }
  
  // Calculate metrics
  const boundaries = fours + sixes;
  const boundaryPercentage = runs > 0 ? (boundaries * 4 / runs) * 100 : 0; // Approximate boundary contribution
  const runsPerMatch = matches > 0 ? runs / matches : 0;
  
  // Milestones calculation - give more weight to 50s and 100s
  const totalMilestones = fifties + hundreds;
  const milestonesPerMatch = matches > 0 ? totalMilestones / matches : 0;
  // Weighted: 100s count as 2x, 50s count as 1x
  const weightedMilestones = (fifties * 1) + (hundreds * 2);
  const weightedMilestonesPerMatch = matches > 0 ? weightedMilestones / matches : 0;
  
  // Normalize and weight components (out of 100)
  // Batting Average: 0-50 = 0-25 points, 50+ = 25 points
  const avgScore = Math.max(0, Math.min(25, (battingAvg / 50) * 25));
  
  // Strike Rate: 100-150 = 0-20 points, 150+ = 20 points
  // Ensure no negative values if strike rate is below 100
  const srScore = Math.max(0, Math.min(20, ((strikeRate - 100) / 50) * 20));
  
  // Boundary Percentage: 0-50% = 0-15 points
  const boundaryScore = Math.max(0, Math.min(15, (boundaryPercentage / 50) * 15));
  
  // Milestones (50s and 100s): Increased weight - 0-2 per match = 0-25 points
  // This gives significant importance to consistency and big scores
  const milestonesScore = Math.max(0, Math.min(25, (weightedMilestonesPerMatch / 2) * 25));
  
  // Separate scores for 50s and 100s to show individual contribution
  // Based on Virat Kohli's stats: 50 fifties in 237 matches = 0.211 per match
  // Scale: 0-0.25 per match = 0-12 points (Kohli's 0.211 = ~10.1 points)
  const fiftiesPerMatch = matches > 0 ? fifties / matches : 0;
  const fiftiesScore = Math.max(0, Math.min(12, (fiftiesPerMatch / 0.25) * 12));
  
  // Based on Virat Kohli's stats: 7 hundreds in 237 matches = 0.0295 per match
  // Scale: 0-0.05 per match = 0-13 points (Kohli's 0.0295 = ~7.7 points)
  const hundredsPerMatch = matches > 0 ? hundreds / matches : 0;
  const hundredsScore = Math.max(0, Math.min(13, (hundredsPerMatch / 0.05) * 13));
  
  // Runs per match: 0-50 = 0-10 points
  // Virat Kohli: 7263 runs / 237 matches = 30.65 runs/match (baseline)
  const rpmScore = Math.max(0, Math.min(10, (runsPerMatch / 50) * 10));
  
  // Total Runs: Based on Virat Kohli's 7263 runs as reference
  // Scale: 0-8000 runs = 0-10 points (Kohli's 7263 = ~9.1 points)
  const totalRunsScore = Math.max(0, Math.min(10, (runs / 8000) * 10));
  
  // Highest Score Bonus: 0-200 = 0-5 points
  const highestScore = Math.max(0, Math.min(5, (highest / 200) * 5));
  
  const totalRating = Math.max(0, avgScore + srScore + boundaryScore + milestonesScore + rpmScore + totalRunsScore + highestScore);
  
  // Generate summary based on rating
  let summary = 'Emerging Talent';
  if (totalRating >= 80) summary = 'Elite Performer';
  else if (totalRating >= 65) summary = 'Excellent Batter';
  else if (totalRating >= 50) summary = 'Very Good';
  else if (totalRating >= 35) summary = 'Good';
  else if (totalRating >= 20) summary = 'Average';
  else if (totalRating > 0) summary = 'Developing';
  else summary = 'No matches played';

  return {
    rating: Math.min(Math.round(totalRating * 10) / 10, 100), // Cap at 100
    breakdown: [
      { label: 'Total Runs', value: runs > 0 ? runs.toLocaleString() : '-', weight: totalRunsScore },
      { label: 'Batting Avg', value: battingAvg > 0 ? battingAvg.toFixed(2) : '-', weight: avgScore },
      { label: 'Strike Rate', value: strikeRate > 0 ? strikeRate.toFixed(1) : '-', weight: srScore },
      { label: '50s', value: fifties > 0 ? `${fifties} fifties` : '-', weight: fiftiesScore },
      { label: '100s', value: hundreds > 0 ? `${hundreds} hundreds` : '-', weight: hundredsScore },
      { label: 'Milestones Total', value: `${fifties} 50s, ${hundreds} 100s`, weight: milestonesScore - fiftiesScore - hundredsScore },
      { label: 'Runs/Match', value: runsPerMatch > 0 ? runsPerMatch.toFixed(1) : '-', weight: rpmScore },
      { label: 'Boundary Impact', value: boundaries > 0 ? `${boundaries} (${fours} 4s, ${sixes} 6s)` : '-', weight: boundaryScore },
      { label: 'Highest Score', value: highest > 0 ? highest.toString() : '-', weight: highestScore },
    ],
    summary
  };
}

/**
 * Calculate overall performance for Bowlers
 * Uses: Bowling Average, Economy Rate, Bowling Strike Rate, Wickets per Match
 */
export function calculateBowlerPerformance(player: Player): OverallPerformance {
  const stats = player.stats || {};
  
  // Extract values
  const matches = stats.matches || 0;
  const wickets = stats.wickets || 0;
  const runsConceded = stats.runsConceded || 0;
  const balls = stats.balls || 0;
  const overs = balls / 6;
  
  // Get bowling average (prefer explicit, then calculate)
  let bowlingAvg = 0;
  if (stats.bowlingAverage && stats.bowlingAverage !== '0' && stats.bowlingAverage !== '-') {
    bowlingAvg = parseFloat(stats.bowlingAverage) || 0;
  } else if (stats.bowlingAverage !== undefined) {
    bowlingAvg = stats.bowlingAverage;
  } else if (wickets > 0) {
    bowlingAvg = runsConceded / wickets;
  }
  
  // Get economy (prefer explicit, then calculate)
  let economy = 0;
  if (stats.economy && stats.economy !== '0' && stats.economy !== '-') {
    economy = parseFloat(stats.economy) || 0;
  } else if (stats.economy !== undefined) {
    economy = stats.economy;
  } else if (overs > 0) {
    economy = runsConceded / overs;
  }
  
  // Get bowling strike rate (prefer explicit, then calculate)
  let bowlingSR = 0;
  if (stats.bowlingStrikeRate && stats.bowlingStrikeRate !== '0' && stats.bowlingStrikeRate !== '-') {
    bowlingSR = parseFloat(stats.bowlingStrikeRate) || 0;
  } else if (stats.bowlingStrikeRate !== undefined) {
    bowlingSR = stats.bowlingStrikeRate;
  } else if (wickets > 0) {
    bowlingSR = balls / wickets;
  }
  
  // Calculate metrics
  const wicketsPerMatch = matches > 0 ? wickets / matches : 0;
  const runsPerWicket = wickets > 0 ? runsConceded / wickets : 0;
  
  // Normalize and weight components (out of 100)
  // Lower bowling average is better: 15-25 = 30 points, <15 = 30 points, >35 = 0 points
  const avgScore = bowlingAvg > 0 && bowlingAvg <= 25 
    ? Math.max(0, 30 - ((bowlingAvg - 15) / 10) * 15)
    : bowlingAvg > 0 && bowlingAvg <= 15 ? 30 : 0;
  
  // Lower economy is better: 6-8 = 25 points, <6 = 25 points, >10 = 0 points
  const economyScore = economy > 0 && economy <= 8
    ? Math.max(0, 25 - ((economy - 6) / 2) * 12.5)
    : economy > 0 && economy <= 6 ? 25 : 0;
  
  // Lower strike rate is better: 15-25 = 25 points, <15 = 25 points, >35 = 0 points
  const srScore = bowlingSR > 0 && bowlingSR <= 25
    ? Math.max(0, 25 - ((bowlingSR - 15) / 10) * 12.5)
    : bowlingSR > 0 && bowlingSR <= 15 ? 25 : 0;
  
  // Wickets per match: 1-2 = 20 points, >2 = 20 points
  const wpmScore = Math.max(0, Math.min(20, (wicketsPerMatch / 2) * 20));
  
  const totalRating = Math.max(0, avgScore + economyScore + srScore + wpmScore);
  
  // Generate summary based on rating
  let summary = 'Emerging Talent';
  if (totalRating >= 80) summary = 'Elite Bowler';
  else if (totalRating >= 65) summary = 'Excellent';
  else if (totalRating >= 50) summary = 'Very Good';
  else if (totalRating >= 35) summary = 'Good';
  else if (totalRating >= 20) summary = 'Average';
  else if (totalRating > 0) summary = 'Developing';
  else summary = 'No matches played';
  
  return {
    rating: Math.min(Math.round(totalRating * 10) / 10, 100), // Cap at 100
    breakdown: [
      { label: 'Bowling Avg', value: bowlingAvg > 0 ? bowlingAvg.toFixed(2) : '-', weight: avgScore },
      { label: 'Economy', value: economy > 0 ? economy.toFixed(2) : '-', weight: economyScore },
      { label: 'Bowling SR', value: bowlingSR > 0 ? bowlingSR.toFixed(1) : '-', weight: srScore },
      { label: 'Wickets/Match', value: wicketsPerMatch > 0 ? wicketsPerMatch.toFixed(2) : '-', weight: wpmScore },
      { label: 'Total Wickets', value: wickets > 0 ? wickets.toString() : '-', weight: Math.min(10, (wickets / 50) * 10) },
    ],
    summary
  };
}

/**
 * Calculate overall performance for All-rounders
 * Uses: Combined batting and bowling metrics with All-Rounder Index
 */
export function calculateAllRounderPerformance(player: Player): OverallPerformance {
  const stats = player.stats || {};
  
  // Batting metrics
  const runs = stats.runs || 0;
  const battingInnings = stats.battingInnings || 0;
  const notOuts = stats.notOuts || 0;
  const ballsFaced = stats.ballsFaced || 0;
  
  let battingAvg = 0;
  if (stats.battingAverage && stats.battingAverage !== '0' && stats.battingAverage !== '-') {
    battingAvg = parseFloat(stats.battingAverage) || 0;
  } else if (stats.average) {
    battingAvg = stats.average;
  } else if (battingInnings > 0 && notOuts >= 0) {
    const dismissals = battingInnings - notOuts;
    if (dismissals > 0) {
      battingAvg = runs / dismissals;
    }
  }
  
  let battingSR = 0;
  if (stats.battingStrikeRate && stats.battingStrikeRate !== '0' && stats.battingStrikeRate !== '-') {
    battingSR = parseFloat(stats.battingStrikeRate) || 0;
  } else if (stats.strikeRate) {
    battingSR = stats.strikeRate;
  } else if (ballsFaced > 0) {
    battingSR = (runs * 100) / ballsFaced;
  }
  
  // Bowling metrics
  const wickets = stats.wickets || 0;
  const runsConceded = stats.runsConceded || 0;
  const balls = stats.balls || 0;
  const overs = balls / 6;
  
  let bowlingAvg = 0;
  if (stats.bowlingAverage && stats.bowlingAverage !== '0' && stats.bowlingAverage !== '-') {
    bowlingAvg = parseFloat(stats.bowlingAverage) || 0;
  } else if (stats.bowlingAverage !== undefined) {
    bowlingAvg = stats.bowlingAverage;
  } else if (wickets > 0) {
    bowlingAvg = runsConceded / wickets;
  }
  
  let economy = 0;
  if (stats.economy && stats.economy !== '0' && stats.economy !== '-') {
    economy = parseFloat(stats.economy) || 0;
  } else if (stats.economy !== undefined) {
    economy = stats.economy;
  } else if (overs > 0) {
    economy = runsConceded / overs;
  }
  
  const matches = stats.matches || 0;
  const runsPerMatch = matches > 0 ? runs / matches : 0;
  const wicketsPerMatch = matches > 0 ? wickets / matches : 0;
  
  // All-Rounder Index: Batting Average / Bowling Average (higher is better)
  const allRounderIndex = bowlingAvg > 0 ? battingAvg / bowlingAvg : 0;
  
  // Normalize and weight components (out of 100)
  // Batting contribution (40 points)
  const battingAvgScore = Math.max(0, Math.min(20, (battingAvg / 50) * 20));
  const battingSRScore = Math.max(0, Math.min(20, ((battingSR - 100) / 50) * 20));
  
  // Bowling contribution (40 points)
  const bowlingAvgScore = bowlingAvg > 0 && bowlingAvg <= 25
    ? Math.max(0, 20 - ((bowlingAvg - 15) / 10) * 10)
    : bowlingAvg > 0 && bowlingAvg <= 15 ? 20 : 0;
  const economyScore = economy > 0 && economy <= 8
    ? Math.max(0, 20 - ((economy - 6) / 2) * 10)
    : economy > 0 && economy <= 6 ? 20 : 0;
  
  // All-Rounder Index (20 points): >1.5 = excellent, 1.0-1.5 = good, <1.0 = needs improvement
  const indexScore = allRounderIndex >= 1.5 ? 20 : allRounderIndex >= 1.0 ? 15 : allRounderIndex >= 0.5 ? 10 : 5;
  
  // Adjust weights based on all-rounder type
  let battingWeight = 0.5;
  let bowlingWeight = 0.5;
  
  if (player.allrounderType === 'Batting All-rounder') {
    battingWeight = 0.65;
    bowlingWeight = 0.35;
  } else if (player.allrounderType === 'Bowling All-rounder') {
    battingWeight = 0.35;
    bowlingWeight = 0.65;
  }
  
  // Calculate balanced contribution
  const battingContribution = (battingAvgScore + battingSRScore) * battingWeight;
  const bowlingContribution = (bowlingAvgScore + economyScore) * bowlingWeight;
  
  // Balance bonus (how balanced they are)
  const balanceDiff = Math.abs((battingAvgScore + battingSRScore) - (bowlingAvgScore + economyScore));
  const balanceBonus = Math.max(0, 10 - (balanceDiff / 10)); // Max 10 points for perfect balance
  
  const totalRating = Math.max(0, battingContribution + bowlingContribution + indexScore + balanceBonus);
  
  // Generate summary based on rating and type
  let summary = 'Emerging Talent';
  if (totalRating >= 80) summary = 'Elite All-rounder';
  else if (totalRating >= 65) summary = 'Excellent';
  else if (totalRating >= 50) summary = 'Very Good';
  else if (totalRating >= 35) summary = 'Good';
  else if (totalRating >= 20) summary = 'Average';
  else if (totalRating > 0) summary = 'Developing';
  else summary = 'No matches played';
  
  // Add type to summary if applicable
  if (player.allrounderType) {
    summary = `${summary} (${player.allrounderType})`;
  }
  
  return {
    rating: Math.min(Math.round(totalRating * 10) / 10, 100), // Cap at 100
    breakdown: [
      { label: 'Batting Avg', value: battingAvg > 0 ? battingAvg.toFixed(2) : '-', weight: battingAvgScore * battingWeight },
      { label: 'Batting SR', value: battingSR > 0 ? battingSR.toFixed(1) : '-', weight: battingSRScore * battingWeight },
      { label: 'Bowling Avg', value: bowlingAvg > 0 ? bowlingAvg.toFixed(2) : '-', weight: bowlingAvgScore * bowlingWeight },
      { label: 'Economy', value: economy > 0 ? economy.toFixed(2) : '-', weight: economyScore * bowlingWeight },
      { label: 'All-Rounder Index', value: allRounderIndex > 0 ? allRounderIndex.toFixed(2) : '-', weight: indexScore },
      { label: 'Balance Score', value: balanceBonus > 0 ? balanceBonus.toFixed(1) : '-', weight: balanceBonus },
      { label: 'Runs/Match', value: runsPerMatch > 0 ? runsPerMatch.toFixed(1) : '-', weight: 0 },
      { label: 'Wickets/Match', value: wicketsPerMatch > 0 ? wicketsPerMatch.toFixed(2) : '-', weight: 0 },
    ],
    summary
  };
}

/**
 * Main function to calculate overall performance based on player role
 */
export function calculateOverallPerformance(player: Player): OverallPerformance {
  if (!player || !player.role) {
    return {
      rating: 0,
      breakdown: [],
      summary: 'No performance data available.'
    };
  }
  
  const role = player.role.toLowerCase();
  
  if (role === 'batsman') {
    return calculateBatterPerformance(player);
  } else if (role === 'wicket-keeper') {
    return calculateBatterPerformance(player); // Same calculation as batsman
  } else if (role === 'bowler') {
    return calculateBowlerPerformance(player);
  } else if (role === 'all-rounder') {
    return calculateAllRounderPerformance(player);
  }
  
  // Default fallback
  return {
    rating: 0,
    breakdown: [],
    summary: 'Performance calculation not available for this role.'
  };
}

