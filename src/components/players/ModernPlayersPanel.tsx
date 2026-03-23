'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Users, Sword, Shield, Hand, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { teamColors, fadeIn, staggerContainer, inputStyle } from '@/styles/theme';
import PlayerCardModal from '../teams/PlayerCardModal';
import { applyReliability, computeRoleRawScore } from '@/lib/playerRanking';
import { calculateAge } from '@/lib/dateUtils';

interface Player {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  role: string;
  league?: string;
  age?: number;
  dateOfBirth?: string;
  nationality?: string;
  jerseyNumber?: number;
  isCaptain?: boolean;
  battingStyle?: string;
  bowlingStyle?: string;
  allrounderType?: string;
  transferInfo?: unknown;
  isActiveInSquad?: boolean;
  squadStatus?: string;
  squadExitReason?: string;
  squadExitDate?: string;
  matches: number;
  runs: number;
  wickets: number;
  battingAverage: number;
  bowlingAverage: number;
  strikeRate: number;
  economy: number;
  bestBowling: string;
  highestScore: string;
  image?: string;
  fifties?: number;
  hundreds?: number;
  fours?: number;
  sixes?: number;
  // Keep the full KV stats object for end-user popups (extended bowling/batting stats).
  stats?: {
    matches?: number;
    battingInnings?: number;
    notOuts?: number;
    runs?: number;
    ballsFaced?: number;
    highest?: number | string;
    fours?: number;
    sixes?: number;
    fifties?: number;
    hundreds?: number;
    average?: number | string;
    battingAverage?: number | string;
    strikeRate?: number | string;
    battingStrikeRate?: number | string;
    bowlingInnings?: number;
    balls?: number;
    maidens?: number;
    wickets?: number;
    runsConceded?: number;
    bowlingAverage?: number | string;
    bowlingStrikeRate?: number | string;
    economy?: number | string;
    bestBowling?: string;
    fiveWickets?: number;
  };
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
}

interface ModernPlayersPanelProps {
  initialPlayers?: any[];
  teams: Team[];
  showHeader?: boolean;
  showTeamFilter?: boolean;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  defaultTeamId?: string;
  accentColor?: string;
  accentColorSecondary?: string;
}

function toNumber(value: any): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function resolveTeamId(teamRef: any, teams: Team[]): string {
  const raw = String(teamRef ?? '').trim();
  if (!raw) return '';

  const withoutPrefix = raw.replace(/^team/i, '');
  if (/^\d+$/.test(withoutPrefix)) return withoutPrefix;

  const lower = raw.toLowerCase();
  const match = teams.find((t) => {
    const short = String(t.shortName || '').toLowerCase();
    const name = String(t.name || '').toLowerCase();
    return (
      short === lower ||
      short.replace('-w', '') === lower ||
      name === lower
    );
  });

  if (match) return String(match.id);
  return withoutPrefix.toLowerCase();
}

function resolveTeamName(teamId: string, teams: Team[], fallback?: string): string {
  const match = teams.find((t) => String(t.id) === String(teamId));
  return match?.name || fallback || (teamId ? `Team ${teamId}` : 'Team');
}

function normalizeHexColor(raw: string | undefined, fallback: string): string {
  const value = String(raw || '').trim();
  if (!value) return fallback;

  const withHash = value.startsWith('#') ? value : `#${value}`;
  const shortMatch = withHash.match(/^#([0-9a-fA-F]{3})$/);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  const longMatch = withHash.match(/^#([0-9a-fA-F]{6})$/);
  if (longMatch) return withHash.toUpperCase();

  return fallback;
}

function hexToRgba(raw: string, alpha: number): string {
  const hex = normalizeHexColor(raw, '#7C3AED');
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeRole(role: string): string {
  const raw = String(role || '').trim();
  if (!raw) return 'Player';
  const lower = raw.toLowerCase().replace(/\s+/g, '-');
  if (lower.includes('wicket')) return 'Wicket-keeper';
  if (lower.includes('keeper')) return 'Wicket-keeper';
  if (lower.includes('all')) return 'All-rounder';
  if (lower.includes('bowl')) return 'Bowler';
  if (lower.includes('bat')) return 'Batsman';
  return raw;
}

function roleSortRank(role: string): number {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'Batsman':
      return 0;
    case 'Wicket-keeper':
      return 1;
    case 'All-rounder':
      return 2;
    case 'Bowler':
      return 3;
    default:
      return 9;
  }
}

function toFiniteNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(num) ? num : undefined;
}

function getComparableAge(player: Player): number {
  const ageFromField = toFiniteNumber(player.age);
  if (ageFromField && ageFromField > 0) return ageFromField;
  if (player.dateOfBirth) {
    const derived = calculateAge(player.dateOfBirth);
    if (derived && derived > 0) return derived;
  }
  return 999;
}

function getPerformanceScore(player: Player): number {
  const matches = toFiniteNumber(player.stats?.matches ?? player.matches) ?? 0;

  const role = normalizeRole(player.role) as any;
  const stats: any = {
    matches,
    runs: toFiniteNumber(player.stats?.runs ?? player.runs) ?? 0,
    wickets: toFiniteNumber(player.stats?.wickets ?? player.wickets) ?? 0,
    strikeRate: toFiniteNumber(player.stats?.strikeRate ?? player.strikeRate) ?? 0,
    average: toFiniteNumber(player.stats?.average ?? player.battingAverage) ?? 0,
    fifties: toFiniteNumber(player.stats?.fifties ?? player.fifties) ?? 0,
    hundreds: toFiniteNumber(player.stats?.hundreds ?? player.hundreds) ?? 0,
    economy: toFiniteNumber(player.stats?.economy ?? player.economy) ?? 0,
    bowlingAverage: toFiniteNumber(player.stats?.bowlingAverage ?? player.bowlingAverage) ?? 0,
  };

  const raw = computeRoleRawScore({ role, stats } as any);
  return applyReliability(raw, matches);
}

function normalizePlayer(raw: any, teams: Team[]): Player {
  const rawStats = raw?.stats || {};
  const normalizedTeamId = resolveTeamId(raw?.teamId ?? raw?.team?.id ?? raw?.team, teams);

  const highestValue = raw?.highestScore ?? rawStats.highestScore ?? rawStats.highest;
  const normalizedStats: Player['stats'] | undefined =
    rawStats && typeof rawStats === 'object'
      ? {
          matches: toNumber(rawStats.matches),
          battingInnings: toNumber(rawStats.battingInnings),
          notOuts: toNumber(rawStats.notOuts),
          runs: toNumber(rawStats.runs),
          ballsFaced: toNumber(rawStats.ballsFaced),
          highest: rawStats.highest ?? rawStats.highestScore,
          fours: toNumber(rawStats.fours),
          sixes: toNumber(rawStats.sixes),
          fifties: toNumber(rawStats.fifties),
          hundreds: toNumber(rawStats.hundreds),
          average: rawStats.average ?? rawStats.battingAverage,
          battingAverage: rawStats.battingAverage,
          strikeRate: rawStats.strikeRate ?? rawStats.battingStrikeRate,
          battingStrikeRate: rawStats.battingStrikeRate,
          bowlingInnings: toNumber(rawStats.bowlingInnings),
          balls: toNumber(rawStats.balls),
          maidens: toNumber(rawStats.maidens),
          wickets: toNumber(rawStats.wickets),
          runsConceded: toNumber(rawStats.runsConceded),
          bowlingAverage: rawStats.bowlingAverage,
          bowlingStrikeRate: rawStats.bowlingStrikeRate,
          economy: rawStats.economy,
          bestBowling: rawStats.bestBowling ? String(rawStats.bestBowling) : undefined,
          fiveWickets: toNumber(rawStats.fiveWickets),
        }
      : undefined;

  return {
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? 'Unknown'),
    teamId: normalizedTeamId,
    teamName: resolveTeamName(normalizedTeamId, teams, raw?.teamName),
    role: normalizeRole(String(raw?.role ?? 'Player')),
    league: raw?.league ? String(raw.league) : undefined,
    age: toNumber(raw?.age),
    dateOfBirth: raw?.dateOfBirth ? String(raw.dateOfBirth) : undefined,
    nationality: raw?.nationality ? String(raw.nationality) : undefined,
    jerseyNumber: toNumber(raw?.jerseyNumber),
    isCaptain: Boolean(raw?.isCaptain),
    battingStyle: raw?.battingStyle ? String(raw.battingStyle) : undefined,
    bowlingStyle: raw?.bowlingStyle ? String(raw.bowlingStyle) : undefined,
    allrounderType: raw?.allrounderType ? String(raw.allrounderType) : undefined,
    transferInfo: raw?.transferInfo,
    isActiveInSquad: typeof raw?.isActiveInSquad === 'boolean' ? raw.isActiveInSquad : undefined,
    squadStatus: raw?.squadStatus ? String(raw.squadStatus) : undefined,
    squadExitReason: raw?.squadExitReason ? String(raw.squadExitReason) : undefined,
    squadExitDate: raw?.squadExitDate ? String(raw.squadExitDate) : undefined,
    matches: toNumber(raw?.matches ?? rawStats.matches),
    runs: toNumber(raw?.runs ?? rawStats.runs),
    wickets: toNumber(raw?.wickets ?? rawStats.wickets),
    battingAverage: toNumber(raw?.battingAverage ?? rawStats.average ?? rawStats.battingAverage),
    bowlingAverage: toNumber(raw?.bowlingAverage ?? rawStats.bowlingAverage),
    strikeRate: toNumber(raw?.strikeRate ?? rawStats.strikeRate ?? rawStats.battingStrikeRate),
    economy: toNumber(raw?.economy ?? rawStats.economy),
    bestBowling: String(raw?.bestBowling ?? rawStats.bestBowling ?? '-'),
    highestScore: typeof highestValue === 'string' ? highestValue : String(toNumber(highestValue)),
    image: raw?.image || raw?.photoUrl || raw?.photo || undefined,
    fifties: toNumber(raw?.fifties ?? rawStats.fifties),
    hundreds: toNumber(raw?.hundreds ?? rawStats.hundreds),
    fours: toNumber(raw?.fours ?? rawStats.fours),
    sixes: toNumber(raw?.sixes ?? rawStats.sixes),
    stats: normalizedStats,
  };
}

function normalizePlayers(rawPlayers: any, teams: Team[]): Player[] {
  if (!Array.isArray(rawPlayers)) return [];
  return rawPlayers.map((p) => normalizePlayer(p, teams));
}

export default function ModernPlayersPanel({
  initialPlayers = [],
  teams,
  showHeader = true,
  showTeamFilter = true,
  title = 'IPL 2026 Players',
  subtitle = 'Browse, filter, and explore player stats.',
  searchPlaceholder = 'Search players by name, team, or role…',
  defaultTeamId,
  accentColor,
  accentColorSecondary,
}: ModernPlayersPanelProps) {
  // State for players and filtering
  const [players, setPlayers] = useState<Player[]>(() => normalizePlayers(initialPlayers, teams));
  const [selectedTeam, setSelectedTeam] = useState(defaultTeamId || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isLoading, setIsLoading] = useState(!initialPlayers.length);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number>(-1);

  // Fetch players if not provided
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!initialPlayers.length) {
        try {
          const response = await fetch(`/api/players?_${Date.now()}`, { cache: 'no-store' });
          const data = response.ok ? await response.json() : [];
          const normalized = normalizePlayers(data, teams);
          setPlayers(normalized);
        } catch (error) {
          console.error('Error fetching players:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPlayers();
  }, [initialPlayers.length]);

  // Keep players in sync when parent provides players/teams (KV shape -> panel shape)
  useEffect(() => {
    if (initialPlayers.length > 0) {
      const normalized = normalizePlayers(initialPlayers, teams);
      setPlayers(normalized);
      setIsLoading(false);
    }
  }, [initialPlayers, teams]);

  // If teams arrive later, enrich player.teamName
  useEffect(() => {
    if (!teams.length) return;
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        teamName: resolveTeamName(p.teamId, teams, p.teamName),
      })),
    );
  }, [teams]);

  // If the caller passes a defaultTeamId after mount, keep the filter in sync.
  useEffect(() => {
    if (!defaultTeamId) return;
    setSelectedTeam(defaultTeamId);
  }, [defaultTeamId]);

  const openPlayerModal = (player: Player, index: number) => {
    setSelectedPlayer(player);
    setSelectedPlayerIndex(index);
  };

  const closePlayerModal = () => {
    setSelectedPlayer(null);
    setSelectedPlayerIndex(-1);
  };

  const navigatePlayer = (direction: 'prev' | 'next') => {
    if (selectedPlayerIndex === -1) return;
    
    let newIndex = direction === 'next' ? selectedPlayerIndex + 1 : selectedPlayerIndex - 1;
    
    // Wrap around to start/end of list
    if (newIndex >= filteredPlayers.length) newIndex = 0;
    if (newIndex < 0) newIndex = filteredPlayers.length - 1;
    
    setSelectedPlayer(filteredPlayers[newIndex]);
    setSelectedPlayerIndex(newIndex);
  };

  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (selectedTeam !== 'all') {
      result = result.filter((player) => String(player.teamId) === String(selectedTeam));
    }

    if (selectedRole !== 'all') {
      const desired = selectedRole.toLowerCase();
      result = result.filter((player) => player.role?.toLowerCase() === desired);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (player) =>
          player.name.toLowerCase().includes(term) ||
          player.teamName?.toLowerCase().includes(term) ||
          player.role?.toLowerCase().includes(term),
      );
    }

    // End-user sorting:
    // 1) Role group order: Batsman, Wicket-keeper, All-rounder, Bowler
    // 2) Within role: performance DESC, age ASC, name ASC
    result.sort((a, b) => {
      const roleDelta = roleSortRank(a.role) - roleSortRank(b.role);
      if (roleDelta !== 0) return roleDelta;

      const perfDelta = getPerformanceScore(b) - getPerformanceScore(a);
      if (perfDelta !== 0) return perfDelta;

      const ageDelta = getComparableAge(a) - getComparableAge(b);
      if (ageDelta !== 0) return ageDelta;

      return a.name.localeCompare(b.name);
    });
    return result;
  }, [players, searchTerm, selectedTeam, selectedRole]);

  const stats = useMemo(() => {
    const counts = { total: 0, batsmen: 0, bowlers: 0, allRounders: 0, keepers: 0 };
    counts.total = filteredPlayers.length;
    for (const player of filteredPlayers) {
      const role = String(player.role || '').toLowerCase();
      if (role.includes('wicket') || role.includes('keeper')) counts.keepers += 1;
      else if (role.includes('all')) counts.allRounders += 1;
      else if (role.includes('bowl')) counts.bowlers += 1;
      else if (role.includes('bat')) counts.batsmen += 1;
    }
    return counts;
  }, [filteredPlayers]);

  const accentPrimary = normalizeHexColor(accentColor, '#7C3AED');
  const accentSecondary = normalizeHexColor(accentColorSecondary || accentColor, accentPrimary);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <motion.div 
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-xl p-5 md:p-6 shadow-[0_10px_50px_rgba(0,0,0,0.25)]"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background: `radial-gradient(800px circle at 20% 0%, ${hexToRgba(accentPrimary, 0.22)}, transparent 55%), radial-gradient(700px circle at 85% 45%, ${hexToRgba(accentSecondary, 0.16)}, transparent 50%)`,
          }}
        />

        {showHeader && (
          <div className="relative mb-5 flex flex-col gap-1">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm md:text-base text-white/60">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              className={inputStyle + " pl-10"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
            {showTeamFilter && (
              <div className="relative">
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="appearance-none bg-slate-950/40 border border-white/10 text-white pl-3 pr-9 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900"
                  style={{ outlineColor: accentPrimary }}
                >
                  <option value="all">All Teams</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.shortName}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            )}

            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="appearance-none bg-slate-950/40 border border-white/10 text-white pl-3 pr-9 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <option value="all">All Roles</option>
                {['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'].map((role) => (
                  <option key={role} value={role.toLowerCase()}>
                    {role}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: <Users className="w-4 h-4" /> },
            { label: 'Batsmen', value: stats.batsmen, icon: <Sword className="w-4 h-4" /> },
            { label: 'Bowlers', value: stats.bowlers, icon: <Shield className="w-4 h-4" /> },
            { label: 'All-rounders', value: stats.allRounders, icon: <Hand className="w-4 h-4" /> },
            { label: 'Keepers', value: stats.keepers, icon: <Users className="w-4 h-4" /> },
          ].map((stat, index) => (
            <motion.div 
              key={index}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
              variants={fadeIn}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-2 text-white/60 text-xs">
                {stat.icon}
                {stat.label}
              </div>
              <div className="text-lg font-bold mt-1 truncate text-white" title={String(stat.value)}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Players Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {filteredPlayers.map((player, index) => {
          const team = teams.find((t) => String(t.id) === String(player.teamId));
          const teamPrimary = normalizeHexColor(
            team?.colors?.primary,
            team ? (teamColors[team.shortName] || '#7C3AED') : '#7C3AED',
          );
          const teamSecondary = normalizeHexColor(team?.colors?.secondary, teamPrimary);
          
          return (
            <motion.button
              type="button"
              key={player.id}
              variants={fadeIn}
              whileHover={{ y: -4 }}
              className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 text-left shadow-[0_10px_40px_rgba(0,0,0,0.20)] transition-colors hover:bg-white/[0.055]"
              onClick={() => openPlayerModal(player, index)}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background: `radial-gradient(500px circle at 20% 10%, ${hexToRgba(teamPrimary, 0.18)}, transparent 55%), radial-gradient(450px circle at 90% 40%, ${hexToRgba(teamSecondary, 0.12)}, transparent 55%)`,
                }}
              />

              <div className="relative flex items-start gap-4">
                <div className="relative shrink-0">
                  <div
                    className="h-16 w-16 rounded-2xl overflow-hidden border border-white/15 bg-slate-900/60 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                    style={{ boxShadow: `0 18px 40px ${hexToRgba(teamPrimary, 0.15)}` }}
                  >
                    {player.image ? (
                      <Image
                        src={player.image}
                        alt={player.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xl font-black text-white">
                        {player.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div
                    className="absolute -bottom-2 -right-2 rounded-xl px-2 py-0.5 text-[11px] font-semibold border border-white/10 bg-slate-950/60 text-white/80"
                    style={{ boxShadow: `0 10px 25px ${hexToRgba(teamPrimary, 0.12)}` }}
                  >
                    {team?.shortName || 'IPL'}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-bold text-white">
                        {player.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80 bg-white/[0.03]"
                        >
                          {player.role || 'Player'}
                        </span>
                        <span className="text-xs text-white/60 truncate">
                          {player.teamName}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] p-2 text-white/70 transition-transform group-hover:translate-x-0.5">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Matches', value: player.matches || 0 },
                      { label: 'Runs', value: player.runs || 0 },
                      { label: 'Wkts', value: player.wickets || 0 },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2"
                      >
                        <div className="text-[11px] text-white/55">{stat.label}</div>
                        <div className="text-base font-bold text-white">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {filteredPlayers.length === 0 && (
        <motion.div 
          className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700/50"
          variants={fadeIn}
        >
          <div className="text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-medium text-white mb-1">No players found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        </motion.div>
      )}

      {/* Player Modal */}
      <AnimatePresence>
        {selectedPlayer && (() => {
          const team = teams.find((t) => String(t.id) === String(selectedPlayer.teamId));
          const primary = normalizeHexColor(
            team?.colors?.primary,
            team ? (teamColors[team.shortName] || '#7C3AED') : '#7C3AED',
          );
          const secondary = normalizeHexColor(team?.colors?.secondary, primary);

          return (
            <PlayerCardModal
              isOpen={!!selectedPlayer}
              onClose={closePlayerModal}
              player={selectedPlayer}
              teamPrimary={primary}
              teamSecondary={secondary}
              teamShortName={team?.shortName}
              teamLogo={team?.logo}
              onNext={() => navigatePlayer('next')}
              onPrev={() => navigatePlayer('prev')}
              hasNext={selectedPlayerIndex < filteredPlayers.length - 1}
              hasPrev={selectedPlayerIndex > 0}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
