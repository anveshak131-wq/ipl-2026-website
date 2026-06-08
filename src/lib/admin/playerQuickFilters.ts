export const PLAYER_QUICK_FILTERS = [
  { id: 'all', label: 'All Players' },
  { id: 'withoutTeam', label: 'Without Team' },
  { id: 'incompleteStats', label: 'Incomplete Stats' },
  { id: 'zeroMatches', label: 'Zero Matches' }
] as const;

export type PlayerQuickFilterId = (typeof PLAYER_QUICK_FILTERS)[number]['id'];
export type PlayerQuickFilterScope = 'players' | 'batting' | 'bowling';

const toNumber = (value: any) => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isMissing = (value: any) => value === undefined || value === null || value === '';
const isMissingText = (value: any) => isMissing(value) || String(value).trim() === '' || String(value).trim() === '-';
const isBattingRole = (role?: string) => ['Batsman', 'Wicket-keeper', 'All-rounder'].includes(role || '');
const isBowlingRole = (role?: string) => ['Bowler', 'All-rounder'].includes(role || '');

export const hasNoTeamAssignment = (player: any) => isMissingText(player?.teamId);

export const hasZeroMatches = (player: any) => toNumber(player?.stats?.matches) === 0;

export const hasIncompleteBattingStats = (player: any) => {
  const stats = player?.stats || {};
  const matches = toNumber(stats.matches);
  const runs = toNumber(stats.runs);
  const innings = toNumber(stats.battingInnings);
  const ballsFaced = toNumber(stats.ballsFaced);
  const fifties = toNumber(stats.fifties);
  const hundreds = toNumber(stats.hundreds);
  const ducks = toNumber(stats.ducks);

  if (matches === 0) return false;
  if (isBattingRole(player?.role) && innings === 0) return true;
  if (runs > 0 && innings === 0) return true;
  if (runs > 0 && ballsFaced === 0) return true;
  if (runs > 0 && ballsFaced > 0 && isMissingText(stats.battingStrikeRate)) return true;
  if (runs > 0 && isMissingText(stats.battingAverage)) return true;
  if ((fifties > 0 || hundreds > 0 || ducks > 0) && innings === 0) return true;

  return false;
};

export const hasIncompleteBowlingStats = (player: any) => {
  const stats = player?.stats || {};
  const matches = toNumber(stats.matches);
  const innings = toNumber(stats.bowlingInnings);
  const balls = toNumber(stats.balls);
  const wickets = toNumber(stats.wickets);
  const runsConceded = toNumber(stats.runsConceded);
  const fourWickets = toNumber(stats.fourWickets);
  const fiveWickets = toNumber(stats.fiveWickets);

  if (matches === 0) return false;
  if (isBowlingRole(player?.role) && innings === 0) return true;
  if (wickets > 0 && innings === 0) return true;
  if ((wickets > 0 || runsConceded > 0) && balls === 0) return true;
  if (runsConceded > 0 && isMissingText(stats.economy)) return true;
  if (wickets > 0 && isMissingText(stats.bowlingAverage)) return true;
  if (wickets > 0 && isMissingText(stats.bowlingStrikeRate)) return true;
  if (wickets > 0 && isMissingText(stats.bestBowling)) return true;
  if ((fourWickets > 0 || fiveWickets > 0) && wickets === 0) return true;

  return false;
};

export const hasIncompletePlayerStats = (player: any) => {
  const stats = player?.stats || {};

  if (hasZeroMatches(player)) return false;
  if (!player?.stats || Object.keys(stats).length === 0) return true;

  return hasIncompleteBattingStats(player) || hasIncompleteBowlingStats(player);
};

export const playerMatchesQuickFilter = (
  player: any,
  quickFilter: PlayerQuickFilterId,
  scope: PlayerQuickFilterScope
) => {
  if (quickFilter === 'all') return true;
  if (quickFilter === 'withoutTeam') return hasNoTeamAssignment(player);
  if (quickFilter === 'zeroMatches') return hasZeroMatches(player);
  if (scope === 'batting') return hasIncompleteBattingStats(player);
  if (scope === 'bowling') return hasIncompleteBowlingStats(player);
  return hasIncompletePlayerStats(player);
};

export const getQuickFilterCounts = (players: any[], scope: PlayerQuickFilterScope) => ({
  all: players.length,
  withoutTeam: players.filter(hasNoTeamAssignment).length,
  incompleteStats: players.filter((player) => playerMatchesQuickFilter(player, 'incompleteStats', scope)).length,
  zeroMatches: players.filter(hasZeroMatches).length
});
