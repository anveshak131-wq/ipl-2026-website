// Core type definitions for IPL 2026 website

export type League = 'ipl' | 'wpl';

export interface Trophy {
  year: number;
  name: string;
}

export interface Team {
  id: string;
  league: League; // IPL or WPL
  name: string;
  shortName: string;
  logo: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
  };
  players: Player[];
  trophies?: Trophy[];
  homeGrounds?: string[];
}

export interface Player {
  id: string;
  league: League; // IPL or WPL
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  allrounderType?: 'Batting All-rounder' | 'Bowling All-rounder'; // Only for All-rounder role
  teamId: string;
  age: number;
  dateOfBirth?: string; // Format: YYYY-MM-DD, if provided age auto-increments
  nationality: string;
  jerseyNumber: number;
  isCaptain: boolean;
  bowlingStyle: string;
  battingStyle: string;
  stats: {
    matches: number;
    runs: number;
    wickets: number;
    average: number; // Batting average
    bowlingAverage?: number; // Bowling average (runs conceded per wicket)
    strikeRate: number;
    economy: number;
    highest: number;
    fours: number;
    sixes: number;
    fifties: number;
    hundreds: number;
    bestBowling: string; // Format: "wickets/runs" e.g., "4/21", "3/45"
  };
  // Transfer and auction metadata (optional)
  transferInfo?: {
    // Year the player was last purchased at auction (e.g., 2026)
    lastAuctionYear?: number;
    // How the player was acquired: 'auction', 'trade', 'swap', 'retention', 'transfer'
    acquiredVia?: 'auction' | 'trade' | 'swap' | 'retention' | 'transfer';
    // Whether the player is eligible to be traded/transferred for the upcoming season
    transferable?: boolean;
    // Optional transfer fee (cash deal) in lakhs or base currency units
    transferFee?: number;
    // Free-form notes (e.g., "Confirmed trade to CSK on 2025-12-10")
    notes?: string;
  };
}

export type PlayoffType = 'qualifier1' | 'eliminator' | 'qualifier2' | 'final' | null;

export interface Match {
  id: string;
  league: League; // IPL or WPL
  date: string;
  time: string;
  venue: string;
  team1: Team;
  team2: Team;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  result?: string;
  resultType?: 'win' | 'loss' | 'tie' | 'no-result' | 'abandoned';
  points?: {
    team1: number;
    team2: number;
  };
  netRunRate?: {
    team1: number;
    team2: number;
  };
  impactPlayer?: {
    team1?: {
      original: string;
      impact: string;
      substitutedAt: number;
    };
    team2?: {
      original: string;
      impact: string;
      substitutedAt: number;
    };
  };
  matchNumber?: string; // Auto-generated based on date and time ordering (e.g., "IPL-001", "WPL-001")
  playoffType?: PlayoffType; // Type of playoff match (null for regular matches)
  playing11?: {
    team1: string[]; // Array of player IDs for team 1
    team2: string[]; // Array of player IDs for team 2
    setAt?: string; // ISO timestamp when playing11 was set (used to track when it became visible to users)
  };
  score?: {
    team1: {
      runs: number;
      wickets: number;
      overs: number;
    };
    team2: {
      runs: number;
      wickets: number;
      overs: number;
    };
  };
  matchState?: {
    currentState: 'pre-match' | 'toss' | 'innings-1' | 'break' | 'innings-2' | 'complete';
    toss?: {
      winner: 'team1' | 'team2';
      decision: 'bat' | 'bowl';
      timestamp: number;
    };
    innings1?: {
      battingTeam: 'team1' | 'team2';
      target?: number;
      completed: boolean;
      completedAt?: number;
    };
    innings2?: {
      battingTeam: 'team1' | 'team2';
      target: number;
      completed: boolean;
      completedAt?: number;
    };
    completedAt?: number;
    lockedStates: string[];
  };
}

export interface News {
  id: string;
  league?: League | 'both'; // Optional: can be IPL, WPL, or both (for cross-league news)
  title: string;
  summary?: string;
  content: string;
  image?: string;
  imageUrl?: string;
  publishedAt?: string;
  createdAt?: string;
  isImportant?: boolean;
  category?: 'match' | 'team' | 'player' | 'general' | 'breaking' | 'inspiration' | 'behind-the-scenes';
  linkedTeamIds?: string[];
  linkedMatchId?: string;
  linkedPlayerIds?: string[];
}

export interface Highlight {
  id: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  matchId: string;
  description: string;
}

export interface Admin {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
}

export interface Content {
  id: string;
  type: 'banner' | 'highlight' | 'news';
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishAt?: string;
  unpublishAt?: string;
  isImportant?: boolean;
  // Optional structured news fields
  summary?: string;
  category?: 'match' | 'team' | 'player' | 'general';
  linkedTeamIds?: string[];
  linkedMatchId?: string;
  linkedPlayerIds?: string[];
}

export interface CoachingStaff {
  teamId: string;
  headCoach?: string;
  mentor?: string;
  battingCoach?: string;
  bowlingCoach?: string;
  fieldingCoach?: string;
  physiotherapist?: string;
  teamManager?: string;
}

export interface KeyPlayers {
  teamId: string;
  powerHitterIds?: string[];
  anchorIds?: string[];
  finisherIds?: string[];
  strikeBowlerIds?: string[];
  deathSpecialistIds?: string[];
  allRoundXFactorIds?: string[];
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  league: League;
  predictedWinner: 'team1' | 'team2';
  playerPredictions?: {
    topScorer?: string; // Player ID
    mostWickets?: string; // Player ID
    playerOfMatch?: string; // Player ID
  };
  createdAt: string;
  updatedAt: string;
  accuracy?: {
    matchWinner: boolean;
    topScorer: boolean;
    mostWickets: boolean;
    playerOfMatch: boolean;
    points: number; // Total points earned (0-30)
    calculatedAt?: string;
  };
}

export interface Poll {
  id: string;
  matchId: string;
  league: League;
  question: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  createdAt: string;
  createdBy?: string; // User ID or 'admin'
  isActive: boolean;
}

export interface PredictionStats {
  userId: string;
  totalPredictions: number;
  completedPredictions: number;
  accuracy: {
    matchWinner: number; // Percentage
    topScorer: number;
    mostWickets: number;
    playerOfMatch: number;
    overall: number; // Overall accuracy percentage
  };
  totalPoints: number;
  averagePoints: number;
  rank?: number; // Global rank
  wins: number; // Perfect predictions (30 points)
}
