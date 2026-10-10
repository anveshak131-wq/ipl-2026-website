export type MatchStage = 'LEAGUE' | 'ELIMINATOR' | 'FINAL';
export type MatchStatus = 'SCHEDULED' | 'READY_FOR_TOSS' | 'TOSS_DONE' | 'LIVE' | 'COMPLETED' | 'ABANDONED';

export interface TeamRef {
  id: string;
  name: string;
  short: string;
  accent: string;
  badgeBg: string;
}

export interface VenueRef {
  id: string;
  name: string;
  city: string;
}

export interface PlayoffSlotPlaceholder {
  label: string;
  sourceType: 'POINTS_TABLE_RANK' | 'MATCH_WINNER';
  sourceRank?: 1 | 2 | 3;
  sourceMatchNumber?: number;
}

export interface WplMatch {
  id: string;
  matchNumber: number;
  stage: MatchStage;
  teamAId: string | null;
  teamBId: string | null;
  placeholderA?: PlayoffSlotPlaceholder;
  placeholderB?: PlayoffSlotPlaceholder;
  venueId: string;
  scheduledStartTime: string;
  status: MatchStatus;
  isResolved: boolean;
  isManualOverride?: boolean;
  overrideNote?: string;
  winnerTeamId?: string;
  lineupStatus: 'PENDING' | 'PUBLISHED';
}

export interface PlayerSummary {
  id: string;
  name: string;
  role: 'BATTER' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER';
  isOverseas: boolean;
  isAssociateNation?: boolean;
}

export interface SelectedPlayer {
  playerId: string;
  isCaptain: boolean;
  isWicketKeeper: boolean;
}
