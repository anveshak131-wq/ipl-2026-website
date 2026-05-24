// Component Prop Type Definitions

import { Player, Team, KeyPlayers, CoachingStaff, Match } from './index';

// Color variations for team colors
export interface ColorVariations {
  light: string;
  medium: string;
  solid: string;
  glow: string;
  text: string;
  textOnLight: string;
}

// Player Card Props
export interface PlayerCardProps {
  player: Player;
  primaryColor: ColorVariations;
  secondaryColor: ColorVariations;
  onClick: () => void;
  index: number;
  keyPlayers?: KeyPlayers | null;
}

// Key Players Section Props
export interface KeyPlayersSectionProps {
  teamData: Team | null;
  keyPlayers: KeyPlayers | null;
  primaryColor: ColorVariations;
  secondaryColor: ColorVariations;
}

// Stats Tab Props
export interface StatsTabProps {
  teamData: Team | null;
  primaryColor: ColorVariations;
  secondaryColor: ColorVariations;
  batsmen: Player[];
  bowlers: Player[];
  allRounders: Player[];
  wicketkeepers: Player[];
  playerStats?: any[];
  seasonTeamStats?: any | null;
}

// About Tab Props
export interface AboutTabProps {
  teamData: Team | null;
  primaryColor: ColorVariations;
  secondaryColor: ColorVariations;
  coachingStaff: CoachingStaff | null;
}

// Stats Card Props
export interface StatsCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  delay: number;
}

// Player Card 3D Props
export interface PlayerCard3DProps {
  player: Player;
  onClick: () => void;
  index: number;
}

// Live Score State
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
  ballHistory: BallEvent[];
  currentBatter?: string;
  currentBowler?: string;
  matchState?: Match['matchState'];
}

// Ball Event
export interface BallEvent {
  over: number;
  ball: number;
  runs: number;
  isWicket: boolean;
  wicketType?: string;
  batterId?: string;
  bowlerId?: string;
  timestamp: number;
}

// Bulk Edit Values
export interface BulkEditValues {
  [key: string]: string | number | boolean | undefined;
}

// Match Update Data
export interface MatchUpdateData {
  date?: string;
  time?: string;
  venue?: string;
  status?: Match['status'];
  result?: string;
  score?: Match['score'];
  [key: string]: unknown;
}
