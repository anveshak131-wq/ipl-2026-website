// API Response Type Definitions

import { Team, Player, Match, News, Content, Admin } from './index';

// Generic API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Teams API
export type TeamsResponse = ApiResponse<Team[]>;

// Players API
export type PlayersResponse = ApiResponse<Player[]>;

// Matches API
export type MatchesResponse = ApiResponse<Match[]>;

// News API
export type NewsResponse = ApiResponse<News[]>;

// Content API
export type ContentResponse = ApiResponse<Content[]>;

// Admin API
export type AdminLoginResponse = ApiResponse<{
  token: string;
  admin: Admin;
}>;

export type AdminAuthResponse = ApiResponse<{
  authenticated: boolean;
  admin?: Admin;
}>;

// Settings API
export type SettingsResponse = ApiResponse<{
  publishedStats?: unknown;
  statsConfig?: unknown;
  [key: string]: unknown;
}>;

// Live Score API
export interface LiveScoreState {
  currentInnings: 1 | 2;
  currentOver: number;
  currentBall: number;
  battingTeam: 'team1' | 'team2';
  bowlingTeam: 'team1' | 'team2';
  score: {
    team1: { runs: number; wickets: number; overs: number };
    team2: { runs: number; wickets: number; overs: number };
  };
  ballHistory: BallEntry[];
  currentBatter?: string;
  currentBowler?: string;
  matchState?: Match['matchState'];
}

export interface BallEntry {
  over: number;
  ball: number;
  runs: number;
  isWicket: boolean;
  wicketType?: string;
  batterId?: string;
  bowlerId?: string;
  timestamp: number;
}

export type LiveScoreResponse = ApiResponse<LiveScoreState>;

// Error Response
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
}

// Bulk Operations
export type BulkOperationResponse = ApiResponse<{
  success: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}>;

