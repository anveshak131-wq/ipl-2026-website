# IPL Statistics System - Complete Guide

## Overview

This document explains how IPL statistics work in the system, including batting stats, bowling stats, Orange Cap, Purple Cap, and other performance metrics.

---

## 1. Batting Statistics

### Core Batting Metrics

#### **Runs**
- **Definition**: Total runs scored by a batsman across all matches
- **Usage**: Primary metric for Orange Cap calculation
- **Storage**: `player.stats.runs` (number)

#### **Matches**
- **Definition**: Total number of matches played
- **Usage**: Used for calculating averages and per-match statistics
- **Storage**: `player.stats.matches` (number)

#### **Batting Average**
- **Formula**: `Runs / (Innings - Not Outs)`
- **Calculation**:
  ```typescript
  const dismissals = battingInnings - notOuts;
  const battingAverage = dismissals > 0 ? runs / dismissals : 0;
  ```
- **Storage**: `player.stats.average` (number)
- **Note**: If a player has no dismissals, average is 0 or undefined

#### **Strike Rate**
- **Formula**: `(Runs × 100) / Balls Faced`
- **Calculation**:
  ```typescript
  const strikeRate = ballsFaced > 0 ? (runs * 100) / ballsFaced : 0;
  ```
- **Storage**: `player.stats.strikeRate` (number)
- **Usage**: Measures scoring rate (higher is better, typically 130+ is good in T20)

#### **Highest Score**
- **Definition**: Highest individual score in a single innings
- **Storage**: `player.stats.highest` (number)

#### **Boundaries**
- **Fours**: `player.stats.fours` (number)
- **Sixes**: `player.stats.sixes` (number)
- **Total Boundaries**: `fours + sixes`

#### **Milestones**
- **Fifties**: Number of 50+ scores (`player.stats.fifties`)
- **Hundreds**: Number of 100+ scores (`player.stats.hundreds`)

#### **Additional Batting Stats**
- **Batting Innings**: `player.stats.battingInnings` (number)
- **Not Outs**: `player.stats.notOuts` (number)
- **Balls Faced**: `player.stats.ballsFaced` (number)

---

## 2. Bowling Statistics

### Core Bowling Metrics

#### **Wickets**
- **Definition**: Total wickets taken across all matches
- **Usage**: Primary metric for Purple Cap calculation
- **Storage**: `player.stats.wickets` (number)

#### **Runs Conceded**
- **Definition**: Total runs given away by the bowler
- **Storage**: `player.stats.runsConceded` (number)

#### **Balls Bowled**
- **Definition**: Total number of balls bowled
- **Storage**: `player.stats.balls` (number)
- **Note**: Can be converted to overs (balls / 6)

#### **Bowling Average**
- **Formula**: `Runs Conceded / Wickets`
- **Calculation**:
  ```typescript
  const bowlingAverage = wickets > 0 ? runsConceded / wickets : 0;
  ```
- **Storage**: `player.stats.bowlingAverage` (number)
- **Note**: Lower is better (typically < 25 is excellent in T20)

#### **Economy Rate**
- **Formula**: `(Runs Conceded × 6) / Balls Bowled`
- **Calculation**:
  ```typescript
  const overs = balls / 6;
  const economy = overs > 0 ? (runsConceded * 6) / balls : 0;
  ```
- **Storage**: `player.stats.economy` (number)
- **Usage**: Measures runs per over (lower is better, typically < 8 is good in T20)

#### **Bowling Strike Rate**
- **Formula**: `Balls Bowled / Wickets`
- **Calculation**:
  ```typescript
  const bowlingStrikeRate = wickets > 0 ? balls / wickets : 0;
  ```
- **Storage**: `player.stats.bowlingStrikeRate` (number)
- **Note**: Lower is better (typically < 20 is excellent)

#### **Best Bowling**
- **Definition**: Best bowling figures in a single match
- **Format**: "wickets/runs" (e.g., "4/21", "3/45")
- **Storage**: `player.stats.bestBowling` (string)

#### **Additional Bowling Stats**
- **Bowling Innings**: `player.stats.bowlingInnings` (number)
- **Maidens**: `player.stats.maidens` (number) - Overs with 0 runs
- **Five Wickets**: `player.stats.fiveWickets` (number) - Number of 5-wicket hauls

---

## 3. Orange Cap (Top Run Scorer)

### Definition
The **Orange Cap** is awarded to the batsman who scores the most runs during the IPL season. The leading run-scorer wears the Orange Cap during matches, and the final award goes to the top run-scorer at the end of the tournament.

### Calculation Logic

```typescript
// Sort players by runs (descending)
const topRunScorers = players
  .sort((a, b) => b.stats.runs - a.stats.runs)
  .slice(0, 50); // Top 50
```

### Display Criteria
- **Primary Sort**: Total runs (descending)
- **Secondary Metrics**: Strike rate, average, matches
- **Minimum Qualification**: 
  - **IPL**: Minimum 3 matches played (out of 14 total per team)
  - **WPL**: Minimum 4 matches played
  - *Rationale: Prevents misleading stats from small sample sizes. Players with 1-2 good matches might have high runs but not be truly consistent performers. Note: IPL teams play 14 matches total per season, so requiring all 14 would be too restrictive.*
- **Leader Highlighting**: Top player gets special styling (gold/purple gradient)

### Current Implementation
- **Location**: `/stats` page (public) and `/ipl-admin-2026/stats` (admin)
- **Display**: Shows top 10 or top 50 (user selectable)
- **Additional Info**: 
  - Strike rate
  - Batting average
  - Matches played
  - Form indicator (Hot/Consistent/Cooling)
  - Contextual insights

### Form Classification
```typescript
function getBattingFormLabel(player: Player): 'Hot' | 'Consistent' | 'Cooling' {
  const runsPerMatch = matches > 0 ? runs / matches : 0;
  
  if (runsPerMatch >= 45 && strikeRate >= 140) return 'Hot';
  if (runsPerMatch >= 30 && strikeRate >= 125) return 'Consistent';
  return 'Cooling';
}
```

---

## 4. Purple Cap (Top Wicket Taker)

### Definition
The **Purple Cap** is awarded to the bowler who takes the most wickets during the IPL season. The leading wicket-taker wears the Purple Cap during matches, and the final award goes to the top wicket-taker at the end of the tournament.

### Calculation Logic

```typescript
// Filter players with wickets, sort by wickets (descending)
const topWicketTakers = players
  .filter((p) => p.stats.wickets > 0)
  .sort((a, b) => b.stats.wickets - a.stats.wickets)
  .slice(0, 50); // Top 50
```

### Display Criteria
- **Primary Sort**: Total wickets (descending)
- **Secondary Metrics**: Economy rate, bowling average, best bowling
- **Minimum Qualification**: 
  - **IPL**: Minimum 3 matches played + at least 1 wicket (out of 14 total per team)
  - **WPL**: Minimum 4 matches played + at least 1 wicket
  - *Rationale: Ensures bowlers have meaningful participation. Prevents players who bowled in 1-2 matches from topping charts. Note: IPL teams play 14 matches total per season, so requiring all 14 would be too restrictive.*
- **Leader Highlighting**: Top player gets special styling (emerald/teal gradient)

### Current Implementation
- **Location**: `/stats` page (public) and `/ipl-admin-2026/stats` (admin)
- **Display**: Shows top 10 or top 50 (user selectable)
- **Additional Info**:
  - Economy rate
  - Bowling average
  - Best bowling figures
  - Matches played
  - Form indicator (Hot/Consistent/Cooling)

### Form Classification
```typescript
function getBowlingFormLabel(player: Player): 'Hot' | 'Consistent' | 'Cooling' {
  const wicketsPerMatch = matches > 0 ? wickets / matches : 0;
  
  if (wicketsPerMatch >= 2 || (economy > 0 && economy <= 7)) return 'Hot';
  if (wicketsPerMatch >= 1.2 || (economy > 0 && economy <= 8.5)) return 'Consistent';
  return 'Cooling';
}
```

---

## 5. Other IPL Statistics

### Best Strike Rates

#### Criteria
- **Minimum Qualification**: 
  - **IPL**: Minimum 3 matches + 300 runs in the tournament (out of 14 total per team)
  - **WPL**: Minimum 4 matches + 200 runs in the tournament
- **Sort**: Strike rate (descending)
- **Purpose**: Identify the most aggressive/effective batsmen
- **Rationale**: 300 runs (IPL) / 200 runs (WPL) ensures meaningful contribution. Minimum matches prevent players with 1-2 explosive innings from dominating. Note: IPL teams play 14 matches total per season, so requiring all 14 would be too restrictive.

```typescript
const bestStrikeRates = players
  .filter((p) => p.stats.matches >= 5 && p.stats.runs >= 300)
  .sort((a, b) => b.stats.strikeRate - a.stats.strikeRate)
  .slice(0, 50);
```

### Best Economy Rates

#### Criteria
- **Minimum Qualification**: 
  - **IPL**: Minimum 3 matches + 20 wickets + 18 overs bowled (out of 14 total per team)
  - **WPL**: Minimum 4 matches + 15 wickets + 20 overs bowled
- **Sort**: Economy rate (ascending - lower is better)
- **Purpose**: Identify the most economical bowlers
- **Rationale**: Multiple criteria ensure meaningful sample size. A bowler with 2-3 good overs might have great economy but not be representative. Note: IPL teams play 14 matches total per season, so requiring all 14 would be too restrictive.

```typescript
const bestEconomyRates = players
  .filter((p) => {
    const matches = p.stats.matches >= 5; // IPL: 5, WPL: 4
    const wickets = p.stats.wickets >= 20; // IPL: 20, WPL: 15
    const overs = (p.stats.balls || 0) / 6 >= 30; // IPL: 30, WPL: 20
    return matches && wickets && overs && p.stats.economy > 0;
  })
  .sort((a, b) => a.stats.economy - b.stats.economy)
  .slice(0, 5);
```

### Team Aggregates

#### Metrics Calculated
- **Total Runs**: Sum of all team players' runs
- **Total Wickets**: Sum of all team players' wickets
- **Total Matches**: Sum of all team players' matches
- **Average Runs Per Match**: `totalRuns / totalMatches`
- **Average Strike Rate**: Average of all team players' strike rates

```typescript
function computeTeamAggregate(teamId: string): TeamAggregate {
  const teamPlayers = players.filter((p) => p.teamId === teamId);
  
  const totalRuns = teamPlayers.reduce((sum, p) => sum + p.stats.runs, 0);
  const totalWickets = teamPlayers.reduce((sum, p) => sum + p.stats.wickets, 0);
  const totalMatches = teamPlayers.reduce((sum, p) => sum + p.stats.matches, 0);
  const avgStrikeRate = teamPlayers.reduce((sum, p) => sum + p.stats.strikeRate, 0) / teamPlayers.length;
  const avgRunsPerMatch = totalMatches > 0 ? totalRuns / totalMatches : 0;
  
  return {
    team,
    totalRuns,
    totalWickets,
    totalMatches,
    avgRunsPerMatch,
    avgStrikeRate,
  };
}
```

---

## 6. Data Structure

### Player Stats Interface

```typescript
interface Player {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  teamId: string;
  stats: {
    // Common
    matches: number;
    
    // Batting
    runs: number;
    average: number; // Batting average
    strikeRate: number;
    highest: number;
    fours: number;
    sixes: number;
    fifties: number;
    hundreds: number;
    battingInnings?: number;
    notOuts?: number;
    ballsFaced?: number;
    battingAverage?: string | number; // Manual override
    battingStrikeRate?: string | number; // Manual override
    
    // Bowling
    wickets: number;
    bowlingAverage?: number;
    economy: number;
    bestBowling: string; // Format: "wickets/runs"
    bowlingInnings?: number;
    balls?: number; // Balls bowled
    maidens?: number;
    runsConceded?: number;
    bowlingStrikeRate?: string | number; // Manual override
    fiveWickets?: number;
  };
}
```

---

## 7. Admin Features

### Stats Publishing System

#### Overview
Admins can publish "snapshots" of statistics to the public `/stats` page. This allows controlled release of statistics at specific points in the season.

#### Published Stats Structure

```typescript
interface PublishedStats {
  description?: string;
  leaders?: {
    topRunScorers?: Player[];
    topWicketTakers?: Player[];
    bestStrikeRates?: Player[];
    bestEconomyRates?: Player[];
  };
  teamAggregates?: TeamAggregate[];
  defaultTeams?: {
    team1Id?: string;
    team2Id?: string;
  };
  insights?: string[];
  lastUpdated?: string;
}
```

#### Publishing Process
1. Admin reviews auto-computed leaderboards
2. Admin can manually edit leaderboard entries
3. Admin publishes snapshot to `/stats` page
4. Public page displays published snapshot (or falls back to computed stats)

### Auto-Computation

The system automatically computes:
- Top run scorers (Orange Cap race)
- Top wicket takers (Purple Cap race)
- Best strike rates (min 300 runs)
- Best economy rates (min 20 wickets)
- Team aggregates
- AI-style insights

### Manual Override

Admins can:
- Manually edit player positions in leaderboards
- Override auto-computed rankings
- Add/remove players from leaderboards
- Set custom descriptions and insights

---

## 8. Public Display

### Stats Page Features

#### Tabs
- **Overview**: Summary and quick stats
- **Batting**: Orange Cap race and best strike rates
- **Bowling**: Purple Cap race and best economy rates
- **Teams**: Team comparison and aggregates
- **Toss & Luck**: Toss analytics (if available)

#### View Options
- **Range**: All season vs Last 5 matches
- **Limit**: Top 10 vs Top 50
- **Filters**: By team, by role, etc.

#### Visual Indicators
- **Form Badges**: Hot, Consistent, Cooling
- **Leader Highlighting**: Special styling for #1 position
- **Contextual Insights**: AI-generated summaries
- **Expandable Details**: Click to see more stats

---

## 9. Real-Time Updates

### Live Score Integration

When balls are entered in live score:
- Player runs are updated in real-time
- Strike rates are recalculated
- Orange Cap leaderboard updates dynamically
- Bowling stats update when wickets fall
- Purple Cap leaderboard updates dynamically

### Data Flow

```
Live Score Entry → Player Stats Update → Leaderboard Recalculation → UI Refresh
```

---

## 10. Best Practices

### Data Entry
1. **Consistency**: Always enter complete data (runs, balls, wickets, etc.)
2. **Validation**: Ensure calculated fields match manual entries
3. **Timeliness**: Update stats promptly after matches
4. **Accuracy**: Double-check milestone counts (fifties, hundreds, five-wickets)

### Calculations
1. **Prefer Calculated**: Let system calculate averages/strike rates from base data
2. **Manual Override**: Only use manual values when necessary
3. **Validation**: Ensure calculated values are reasonable (e.g., strike rate 50-200)

### Display
1. **Qualification**: Apply minimum thresholds for meaningful leaderboards
2. **Context**: Always show supporting metrics (matches, strike rate, etc.)
3. **Updates**: Keep published snapshots current with recent matches

---

## 11. Example Calculations

### Batting Example

**Player**: Virat Kohli
- **Matches**: 15
- **Runs**: 750
- **Innings**: 15
- **Not Outs**: 2
- **Balls Faced**: 500

**Calculations**:
- **Average**: `750 / (15 - 2) = 57.69`
- **Strike Rate**: `(750 × 100) / 500 = 150.0`
- **Runs Per Match**: `750 / 15 = 50.0`

### Bowling Example

**Player**: Jasprit Bumrah
- **Matches**: 15
- **Wickets**: 25
- **Runs Conceded**: 450
- **Balls Bowled**: 360

**Calculations**:
- **Overs**: `360 / 6 = 60`
- **Economy**: `(450 × 6) / 360 = 7.5`
- **Bowling Average**: `450 / 25 = 18.0`
- **Bowling Strike Rate**: `360 / 25 = 14.4`

---

## 12. Future Enhancements

### Potential Additions
1. **Most Valuable Player (MVP)**: Combined batting + bowling impact
2. **Emerging Player Award**: Best young talent (< 25 years)
3. **Fair Play Award**: Team conduct metrics
4. **Powerplay Stats**: Separate stats for powerplay overs
5. **Death Overs Stats**: Separate stats for final 5 overs
6. **Head-to-Head Stats**: Player vs specific teams/bowlers
7. **Venue-Specific Stats**: Performance by stadium
8. **Match-Winning Contributions**: Impact on match results

---

## 13. Qualification Requirements

### Why Minimum Qualifications Matter

**Problem**: Small sample sizes can lead to misleading statistics
- A player who scores 50 runs in 1 match has a strike rate of 200, but it's not representative
- A bowler who bowls 2 overs and takes 1 wicket might have a great economy rate, but it's not meaningful
- Players with 2-3 good matches early in the season might top charts but not be truly best

**Solution**: Minimum match and performance thresholds
- Ensures statistics are based on meaningful participation
- Prevents anomalies from small sample sizes
- Industry-standard approach used in professional cricket

### Qualification Criteria Summary

| Statistic | IPL Requirements | WPL Requirements |
|-----------|------------------|------------------|
| **Orange Cap** | 3 matches (out of 14 total) | 4 matches |
| **Purple Cap** | 3 matches + 1 wicket (out of 14 total) | 4 matches + 1 wicket |
| **Best Strike Rate** | 3 matches + 300 runs (out of 14 total) | 4 matches + 200 runs |
| **Best Economy** | 3 matches + 20 wickets + 18 overs (out of 14 total) | 4 matches + 15 wickets + 20 overs |

### Implementation

The qualification system is implemented in `src/lib/statsQualifications.ts` and automatically applied to all leaderboards. Qualifications are:
- **League-aware**: Different thresholds for IPL vs WPL
- **Configurable**: Easy to adjust based on tournament structure
- **Transparent**: Qualification requirements are displayed to users
- **Automatic**: Applied automatically when computing leaderboards

---

## Summary

The IPL statistics system tracks comprehensive batting and bowling metrics, automatically calculates leaderboards for Orange Cap and Purple Cap races, and provides admin tools for publishing curated statistics to fans. The system supports both real-time updates during matches and manual curation for official publications.

**Key Features**:
- ✅ Automatic Orange Cap calculation (top run scorer)
- ✅ Automatic Purple Cap calculation (top wicket taker)
- ✅ Best strike rates and economy rates
- ✅ Team aggregate statistics
- ✅ Admin publishing system
- ✅ Real-time updates from live scores
- ✅ Form indicators and contextual insights
- ✅ **Minimum match qualifications** (prevents misleading stats from small sample sizes)
- ✅ **League-aware thresholds** (IPL vs WPL)
- ✅ **Transparent qualification display** (users see requirements)

