// Core type definitions for IPL 2026 website

export interface Trophy {
  year: number;
  name: string;
}

export interface Team {
  id: string;
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
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
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
}

export interface Match {
  id: string;
  date: string;
  time: string;
  venue: string;
  team1: Team;
  team2: Team;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  result?: string;
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
}

export interface News {
  id: string;
  title: string;
  summary?: string;
  content: string;
  image?: string;
  imageUrl?: string;
  publishedAt?: string;
  createdAt?: string;
  isImportant?: boolean;
  category?: 'match' | 'team' | 'player' | 'general';
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
