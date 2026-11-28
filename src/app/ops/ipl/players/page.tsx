'use client';

import React, { useState, useEffect, useMemo, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Player, Team } from '@/types';
import {
  Search,
  Plus,
  RefreshCw,
  LayoutGrid,
  Table2,
  Users,
  Shield,
  Download,
  Filter,
  Sparkles,
  Plane,
  X,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import Franchise2027Bar from '@/components/admin/players/Franchise2027Bar';
import { Player2027Card } from '@/components/admin/players/Player2027Card';
import Player2027Drawer from '@/components/admin/players/Player2027Drawer';
import SmartIntakeModal from '@/components/admin/players/SmartIntakeModal';
import PitchFormationView from '@/components/admin/players/PitchFormationView';
import Player2027DenseTable from '@/components/admin/players/Player2027DenseTable';
import PlayerExportBar from '@/components/admin/players/PlayerExportBar';
import PlayersStatsSubNav from '@/components/admin/PlayersStatsSubNav';
import BattingStatsWorkspace from '@/components/admin/player-stats/BattingStatsWorkspace';
import BowlingStatsWorkspace from '@/components/admin/player-stats/BowlingStatsWorkspace';
import { IPL_2027_TEAMS, resolveIpl2027Team } from '@/lib/admin/ipl2027Teams';

// Centralized check for 2027 Unassigned / Standby / Released Pool Players
export function isUnassignedPoolPlayer(p: Player): boolean {
  if (!p) return false;
  const id = String(p.teamId || '').trim().toLowerCase();
  const short = String(p.teamShortName || '').trim().toUpperCase();
  const team = String(p.team || '').trim().toLowerCase();
  const status = String(p.squadStatus || '').trim().toLowerCase();

  return (
    !id ||
    id === 'pool' ||
    id === 'standby_2027' ||
    id === 'unassigned' ||
    short === 'POOL' ||
    team.includes('standby') ||
    team.includes('pool') ||
    team.includes('unassigned') ||
    status.includes('release') ||
    status.includes('draft pool')
  );
}

// Team Sort Rank: RCB Priority #1, followed by rest of IPL franchises, Standby Pool last
function getTeamSortRank(p: Player): number {
  if (isUnassignedPoolPlayer(p)) return 99;

  const short = (p.teamShortName || '').toUpperCase();
  const id = String(p.teamId || '');
  const name = (p.team || '').toLowerCase();

  if (short === 'RCB' || id === '1' || name.includes('bengaluru') || name.includes('bangalore')) return 1;
  if (short === 'CSK' || id === '10' || name.includes('chennai')) return 2;
  if (short === 'MI' || id === '2' || name.includes('mumbai')) return 3;
  if (short === 'KKR' || id === '4' || name.includes('kolkata')) return 4;
  if (short === 'SRH' || id === '3' || name.includes('hyderabad')) return 5;
  if (short === 'DC' || id === '7' || name.includes('delhi')) return 6;
  if (short === 'GT' || id === '4_gt' || name.includes('gujarat')) return 7;
  if (short === 'LSG' || id === '9' || name.includes('lucknow')) return 8;
  if (short === 'PBKS' || id === '5' || name.includes('punjab')) return 9;
  if (short === 'RR' || id === '8' || name.includes('rajasthan')) return 10;
  return 50;
}

// Role Sort Rank: Batters (1), Wicketkeepers (2), Batting All-rounders (3), Bowling All-rounders (4), Bowlers (5)
function getRoleSortRank(p: Player): number {
  const role = (p.role || '').toLowerCase().trim();
  const arType = ((p as any).allRounderType || (p as any).allrounderType || '').toLowerCase().trim();

  // 1. Wicketkeepers
  if (role.includes('keeper') || role.includes('wk')) {
    return 2;
  }
  // 2. All-rounders
  if (role.includes('all') || arType.includes('all')) {
    if (arType.includes('bat') || role.includes('batting all')) {
      return 3; // Batting All-rounder
    }
    return 4; // Bowling All-rounder
  }
  // 3. Batters / Batsmen
  if (role.includes('bat')) {
    return 1;
  }
  // 4. Bowlers
  if (role.includes('bowl')) {
    return 5;
  }
  return 1;
}

function comparePlayersSquadOrder(a: Player, b: Player): number {
  // 1. Primary Sort: Team Order (RCB First, Standby Pool Last)
  const teamA = getTeamSortRank(a);
  const teamB = getTeamSortRank(b);
  if (teamA !== teamB) return teamA - teamB;

  // 2. Secondary Sort: Role Hierarchy (Batters -> WKs -> Batting AR -> Bowling AR -> Bowlers)
  const roleA = getRoleSortRank(a);
  const roleB = getRoleSortRank(b);
  if (roleA !== roleB) return roleA - roleB;

  // 3. Tertiary Sort: Age (High to Low: Senior Veterans -> Young Emerging Talents)
  const ageA = Number(a.age) || 0;
  const ageB = Number(b.age) || 0;
  if (ageB !== ageA) return ageB - ageA;

  // 4. Captain Priority Tie-Breaker
  if (a.isCaptain !== b.isCaptain) return a.isCaptain ? -1 : 1;

  // 5. Stat Performance Tie-Breaker (Runs for Batters/WK/Batting-AR, Wkts for Bowling-AR/Bowlers)
  const runsA = (a as any).careerStats?.batting?.IPL?.Runs || a.stats?.runs || 0;
  const runsB = (b as any).careerStats?.batting?.IPL?.Runs || b.stats?.runs || 0;
  if (roleA <= 3) {
    if (Number(runsB) !== Number(runsA)) return Number(runsB) - Number(runsA);
  } else {
    const wktsA = (a as any).careerStats?.bowling?.IPL?.Wkts || a.stats?.wickets || 0;
    const wktsB = (b as any).careerStats?.bowling?.IPL?.Wkts || b.stats?.wickets || 0;
    if (Number(wktsB) !== Number(wktsA)) return Number(wktsB) - Number(wktsA);
  }

  // 6. Name Alphabetical Tie-Breaker
  return a.name.localeCompare(b.name);
}

// URL Parameter Parsing Helpers
function parseTeamFromParam(param: string | null): string {
  if (!param) return 'all';
  const clean = param.trim().toLowerCase();
  if (clean === 'all') return 'all';
  if (clean === 'pool' || clean === 'standby' || clean === 'unassigned') return 'pool';
  const team = IPL_2027_TEAMS.find(
    (t) => t.id === clean || t.shortName.toLowerCase() === clean || t.name.toLowerCase().includes(clean)
  );
  return team ? team.id : 'all';
}

function parseRoleFromParam(param: string | null): string {
  if (!param) return 'ALL';
  const clean = param.trim().toUpperCase();
  if (clean === 'BATSMAN' || clean === 'BATTER' || clean === 'BATTERS') return 'BATSMAN';
  if (clean === 'BOWLER' || clean === 'BOWLERS') return 'BOWLER';
  if (clean === 'ALLROUNDER' || clean === 'ALL-ROUNDER' || clean === 'ALL_ROUNDER' || clean === 'ALLROUNDERS') return 'ALLROUNDER';
  if (clean === 'KEEPER' || clean === 'KEEPERS' || clean === 'WK' || clean === 'WICKETKEEPER') return 'KEEPER';
  return 'ALL';
}

function parseStatusFromParam(param: string | null): string {
  if (!param) return 'ALL';
  const clean = param.trim().toUpperCase();
  if (clean === 'RETAINED') return 'RETAINED';
  if (clean === 'TRADED') return 'TRADED';
  if (clean === 'RELEASED' || clean === 'POOL' || clean === 'AUCTION') return 'RELEASED';
  if (clean === 'OVERSEAS') return 'OVERSEAS';
  if (clean === 'MENTOR') return 'MENTOR';
  return 'ALL';
}

function parseViewModeFromParam(param: string | null): 'grid' | 'table' | 'pitch' {
  if (!param) return 'grid';
  const clean = param.trim().toLowerCase();
  if (clean === 'table' || clean === 'dense') return 'table';
  if (clean === 'pitch' || clean === 'turf' || clean === 'xi') return 'pitch';
  return 'grid';
}

function Ipl2027OpsPlayersPage() {
  const searchParams = useSearchParams();

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize View & Filter States directly from URL parameters
  const initialTeam = useMemo(() => parseTeamFromParam(searchParams.get('team') || searchParams.get('franchise')), [searchParams]);
  const initialRole = useMemo(() => parseRoleFromParam(searchParams.get('role')), [searchParams]);
  const initialStatus = useMemo(() => parseStatusFromParam(searchParams.get('status')), [searchParams]);
  const initialMode = useMemo(() => parseViewModeFromParam(searchParams.get('mode') || searchParams.get('tab')), [searchParams]);
  const initialSearch = useMemo(() => searchParams.get('q') || searchParams.get('search') || '', [searchParams]);

  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeam);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'pitch'>(initialMode);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [roleFilter, setRoleFilter] = useState<string>(initialRole);
  const [showExportStudio, setShowExportStudio] = useState<boolean>(false);

  // Modals & Drawer States
  const [drawerPlayer, setDrawerPlayer] = useState<Player | null>(null);
  const [hasResolvedInitialPlayer, setHasResolvedInitialPlayer] = useState(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [, startTransition] = useTransition();

  // 150ms Search Debounce to guarantee 0ms keystroke latency
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(searchQuery);
      });
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Players and Teams
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resPlayers, resTeams] = await Promise.all([
        fetch('/api/players?league=ipl&includeInactive=true').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/teams?league=ipl').then((r) => (r.ok ? r.json() : [])),
      ]);

      const rawPlayers = Array.isArray(resPlayers) ? resPlayers : resPlayers?.data || [];
      const rawTeams = Array.isArray(resTeams) ? resTeams : resTeams?.data || [];

      setPlayers(rawPlayers);
      setTeams(rawTeams);
    } catch (e) {
      console.error('Failed to load IPL 2027 players data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-open Player Dossier from URL parameter (e.g. ?player=2 or ?player=1413 or ?player=virat-kohli)
  useEffect(() => {
    if (!hasResolvedInitialPlayer && players.length > 0) {
      const playerParam = searchParams.get('player') || searchParams.get('playerId');
      if (playerParam) {
        const q = playerParam.trim().toLowerCase();
        const found = players.find(
          (p) =>
            String(p.id).toLowerCase() === q ||
            String(p.cricbuzzId || '').toLowerCase() === q ||
            p.name.toLowerCase() === q ||
            p.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === q ||
            p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === q.replace(/[^a-z0-9]/g, '')
        );
        if (found) {
          setDrawerPlayer(found);
        }
      }
      setHasResolvedInitialPlayer(true);
    }
  }, [players, searchParams, hasResolvedInitialPlayer]);

  // Real-time URL Synchronization without page reload
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const params = url.searchParams;

    // Preserve subnav view (e.g. view=players) if present
    const subnavView = searchParams.get('view');
    if (subnavView) {
      params.set('view', subnavView);
    }

    // 1. Franchise
    if (selectedTeamId && selectedTeamId !== 'all') {
      const teamMeta = resolveIpl2027Team(selectedTeamId);
      params.set('team', teamMeta ? teamMeta.shortName.toLowerCase() : selectedTeamId);
    } else {
      params.delete('team');
      params.delete('franchise');
    }

    // 2. Role
    if (roleFilter && roleFilter !== 'ALL') {
      params.set('role', roleFilter.toLowerCase());
    } else {
      params.delete('role');
    }

    // 3. Status
    if (statusFilter && statusFilter !== 'ALL') {
      params.set('status', statusFilter.toLowerCase());
    } else {
      params.delete('status');
    }

    // 4. Mode
    if (viewMode && viewMode !== 'grid') {
      params.set('mode', viewMode);
    } else {
      params.delete('mode');
      params.delete('tab');
    }

    // 5. Search
    if (debouncedSearch && debouncedSearch.trim()) {
      params.set('q', debouncedSearch.trim());
    } else {
      params.delete('q');
      params.delete('search');
    }

    // 6. Player Dossier Deep Link
    if (drawerPlayer) {
      params.set('player', String(drawerPlayer.id));
    } else {
      params.delete('player');
      params.delete('playerId');
    }

    const newQueryString = params.toString();
    const newRelativePathQuery = window.location.pathname + (newQueryString ? `?${newQueryString}` : '');

    if (window.location.search !== (newQueryString ? `?${newQueryString}` : '')) {
      window.history.replaceState(null, '', newRelativePathQuery);
    }
  }, [selectedTeamId, roleFilter, statusFilter, viewMode, debouncedSearch, drawerPlayer, searchParams]);

  // Filter and Sort Pipeline with high-performance useMemo (RCB First, Batters -> WKs -> ARs -> Bowlers)
  const filteredPlayers = useMemo(() => {
    const list = players.filter((player) => {
      // 1. Franchise Selector Filter
      if (selectedTeamId !== 'all') {
        const isPoolSelected = selectedTeamId === 'pool' || selectedTeamId === 'STANDBY_2027';
        if (isPoolSelected) {
          if (!isUnassignedPoolPlayer(player)) return false;
        } else {
          // If a franchise is selected (e.g. RCB), do NOT include unassigned/released players
          if (isUnassignedPoolPlayer(player)) return false;

          const pTeamId = String(player.teamId || '');
          const pTeamShort = (player.teamShortName || '').toUpperCase();
          const targetMeta = resolveIpl2027Team(selectedTeamId);

          const matchesId = pTeamId === selectedTeamId;
          const matchesShort = targetMeta ? pTeamShort === targetMeta.shortName : false;
          const matchesName = targetMeta ? (player.team || '').includes(targetMeta.name) : false;

          if (!matchesId && !matchesShort && !matchesName) return false;
        }
      }

      // 2. Search Query (debounced)
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const nameMatch = player.name.toLowerCase().includes(q);
        const jerseyMatch = String(player.jerseyNumber || '').includes(q);
        const roleMatch = (player.role || '').toLowerCase().includes(q);
        const natMatch = (player.nationality || '').toLowerCase().includes(q);
        const teamMatch = (player.team || '').toLowerCase().includes(q);
        if (!nameMatch && !jerseyMatch && !roleMatch && !natMatch && !teamMatch) {
          return false;
        }
      }

      // 3. Squad Status Filter Chip
      if (statusFilter !== 'ALL') {
        const s = (player.squadStatus || 'Retained').toLowerCase();
        const fee = (player as any).transferFee || '';
        const notes = (player as any).transferNotes || '';

        if (statusFilter === 'RETAINED') {
          if (!s.includes('retained') || isUnassignedPoolPlayer(player)) return false;
        } else if (statusFilter === 'TRADED') {
          if (!s.includes('traded') && !notes.toLowerCase().includes('trade')) return false;
        } else if (statusFilter === 'RELEASED') {
          if (!isUnassignedPoolPlayer(player) && !s.includes('release')) return false;
        } else if (statusFilter === 'OVERSEAS') {
          const nat = (player.nationality || 'India').toLowerCase();
          if (nat === 'india' || nat === 'ind' || nat === 'indian') return false;
        } else if (statusFilter === 'MENTOR') {
          if (!s.includes('mentor')) return false;
        }
      }

      // 4. Role Filter Chip
      if (roleFilter !== 'ALL') {
        const role = (player.role || '').toLowerCase();
        if (roleFilter === 'BATSMAN' && !role.includes('bat')) return false;
        if (roleFilter === 'BOWLER' && !role.includes('bowl')) return false;
        if (roleFilter === 'ALLROUNDER' && !role.includes('all')) return false;
        if (roleFilter === 'KEEPER' && !role.includes('keeper') && !role.includes('wk')) return false;
      }

      return true;
    });

    return [...list].sort(comparePlayersSquadOrder);
  }, [players, selectedTeamId, debouncedSearch, statusFilter, roleFilter]);

  // Franchise counts for fast lookup
  const currentTeamMeta = useMemo(() => {
    return resolveIpl2027Team(selectedTeamId);
  }, [selectedTeamId]);

  const playersCountByTeam = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach((p) => {
      if (isUnassignedPoolPlayer(p)) return;
      if (p.teamId) {
        counts[String(p.teamId)] = (counts[String(p.teamId)] || 0) + 1;
      }
      if (p.teamShortName) {
        counts[p.teamShortName] = (counts[p.teamShortName] || 0) + 1;
      }
      if (p.franchise) {
        counts[p.franchise] = (counts[p.franchise] || 0) + 1;
      }
    });
    return counts;
  }, [players]);

  const poolPlayersCount = useMemo(() => {
    return players.filter(isUnassignedPoolPlayer).length;
  }, [players]);

  // Handler for saving/updating player
  const handlePlayerSaved = (savedPlayer: Player) => {
    setPlayers((prev) => {
      const exists = prev.some((p) => p.id === savedPlayer.id);
      if (exists) {
        return prev.map((p) => (p.id === savedPlayer.id ? savedPlayer : p));
      }
      return [savedPlayer, ...prev];
    });
  };

  // Handler for delete/release player
  const handleDeletePlayer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to release "${name}" to the 2027 Auction Standby Pool?`)) {
      return;
    }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      await fetch(`/api/players?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error('Failed to release player:', e);
    }
  };

  // Handler for opening edit modal
  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingPlayer(null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-8 space-y-6">
      {/* 3-Segment Top Navigation Hub: Players | Batting Stats | Bowling Stats */}
      <PlayersStatsSubNav />

      {/* Top Hero Command Center */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-96 bg-gradient-to-l from-[#f2d39a]/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Shield className="w-3.5 h-3.5" />
                IPL 2027 Season Verified
              </span>
              <span className="text-xs font-bold text-white/50">· 255 Contracted Players</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              IPL 2027 Squad Intelligence & Players Ops
            </h1>
            <p className="text-sm text-white/60 mt-1.5 max-w-2xl">
              Real-time franchise retentions, mega trades, and verified Cricbuzz statistics engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowExportStudio(!showExportStudio)}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 border border-white/10 shadow-lg transition-all"
            >
              <Download className="w-4 h-4 text-[#f2d39a]" />
              <span>Export Dossier</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNew}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-teal-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Player</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Bar Panel */}
      {showExportStudio && (
        <PlayerExportBar
          players={filteredPlayers}
          selectedTeamName={currentTeamMeta?.name || 'All IPL Franchises'}
        />
      )}

      {/* Franchise Selector Bar (10 IPL Teams + All + Standby Pool) */}
      <Franchise2027Bar
        selectedTeamId={selectedTeamId}
        onSelectTeam={(teamId) => setSelectedTeamId(teamId)}
        playersCountByTeam={playersCountByTeam}
        totalPlayersCount={players.length}
        poolPlayersCount={poolPlayersCount}
      />

      {/* Search, Filter Chips & View Mode Controls */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Instant Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Instant search by player name, jersey #, country, or franchise..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Grid, Dense Table, Pitch Formation */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#f2d39a] text-slate-950 shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards ({filteredPlayers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-[#f2d39a] text-slate-950 shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Dense Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('pitch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'pitch'
                  ? 'bg-[#f2d39a] text-slate-950 shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Turf XI</span>
            </button>
          </div>
        </div>

        {/* Quick-Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="text-white/40 mr-1 text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {[
              { id: 'ALL', label: 'All Players' },
              { id: 'RETAINED', label: '🟢 Retained' },
              { id: 'TRADED', label: '🔄 Traded' },
              { id: 'RELEASED', label: '🔴 Auction Pool' },
              { id: 'OVERSEAS', label: '✈️ Overseas' },
              { id: 'MENTOR', label: '👑 Mentors' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === chip.id
                    ? 'bg-white/20 text-white border border-white/30 shadow'
                    : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="text-white/40 mr-1 text-[11px] uppercase tracking-wider">Role:</span>
            {[
              { id: 'ALL', label: 'All Roles' },
              { id: 'BATSMAN', label: '🏏 Batters' },
              { id: 'BOWLER', label: '🎯 Bowlers' },
              { id: 'ALLROUNDER', label: '⚡ All-Rounders' },
              { id: 'KEEPER', label: '🧤 Keepers' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setRoleFilter(chip.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  roleFilter === chip.id
                    ? 'bg-[#f2d39a]/20 text-[#f2d39a] border border-[#f2d39a]/40 shadow'
                    : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-16 text-center">
          <RefreshCw className="w-8 h-8 text-[#f2d39a] animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-white/70">Hydrating IPL 2027 Squad Registry...</p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-16 text-center space-y-3">
          <Users className="w-10 h-10 text-white/30 mx-auto" />
          <h3 className="text-base font-bold text-white">No players found matching your criteria</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Try adjusting your search query, clearing status filters, or selecting a different franchise.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedTeamId('all');
              setStatusFilter('ALL');
              setRoleFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <Player2027DenseTable
          players={filteredPlayers}
          teams={teams}
          onView={(p) => setDrawerPlayer(p)}
          onEdit={(p) => handleOpenEdit(p)}
          onDelete={(id, name) => handleDeletePlayer(id, name)}
        />
      ) : viewMode === 'pitch' ? (
        <PitchFormationView
          players={filteredPlayers}
          selectedTeamId={selectedTeamId}
          onViewPlayer={(p) => setDrawerPlayer(p)}
        />
      ) : (
        /* Scout Cards Grid with CSS content-visibility */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <Player2027Card
              key={player.id}
              player={player}
              onView={(p) => setDrawerPlayer(p)}
              onEdit={(p) => handleOpenEdit(p)}
              onDelete={(p) => handleDeletePlayer(p.id, p.name)}
            />
          ))}
        </div>
      )}

      {/* Slide-Over Player Dossier Drawer */}
      <Player2027Drawer
        player={drawerPlayer}
        onClose={() => setDrawerPlayer(null)}
        onEdit={(p) => {
          setDrawerPlayer(null);
          handleOpenEdit(p);
        }}
        onStatsUpdated={(updated) => handlePlayerSaved(updated)}
      />

      {/* 1-Click Cricbuzz Smart Intake Modal */}
      <SmartIntakeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingPlayer={editingPlayer}
        onSaved={(saved) => handlePlayerSaved(saved)}
        teams={teams}
      />
    </div>
  );
}

function Ipl2027PlayersRouter() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  if (view === 'batting') return <BattingStatsWorkspace />;
  if (view === 'bowling') return <BowlingStatsWorkspace />;
  return <Ipl2027OpsPlayersPage />;
}

export default function Ipl2027OpsPlayersDesk() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          Loading players workspace...
        </div>
      }
    >
      <Ipl2027PlayersRouter />
    </Suspense>
  );
}
