'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Team, Player } from '@/types';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import { isPlaceholderTeam } from '@/lib/playoffUtils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Trophy,
  Sparkles,
  ArrowRight,
  Search,
  LayoutGrid,
  List,
  ShieldCheck,
  ChevronRight,
  Users,
  Crown,
  MapPin,
} from 'lucide-react';

const WPL_THEMES: Record<
  string,
  {
    accent: string;
    secondary: string;
    glow: string;
    border: string;
    badge: string;
    championships: string[];
    captain: string;
    logo: string;
  }
> = {
  rcb: {
    accent: '#DC2626',
    secondary: '#F59E0B',
    glow: 'rgba(220, 38, 38, 0.25)',
    border: 'border-red-500/30 hover:border-red-400/60',
    badge: 'bg-red-500/15 text-red-300 border-red-500/35',
    championships: ['2024', '2026'],
    captain: 'Smriti Mandhana',
    logo: '/logos/wpl_rcb_logo_modern.svg',
  },
  mi: {
    accent: '#2563EB',
    secondary: '#EAB308',
    glow: 'rgba(37, 99, 235, 0.25)',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/35',
    championships: ['2023', '2025'],
    captain: 'Harmanpreet Kaur',
    logo: '/logos/wpl_mi_logo_modern.svg',
  },
  dc: {
    accent: '#0284C7',
    secondary: '#DC2626',
    glow: 'rgba(2, 132, 199, 0.25)',
    border: 'border-sky-500/30 hover:border-sky-400/60',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    championships: [],
    captain: 'Meg Lanning',
    logo: '/logos/wpl_dc_logo_modern.svg',
  },
  gg: {
    accent: '#EA580C',
    secondary: '#F59E0B',
    glow: 'rgba(234, 88, 12, 0.25)',
    border: 'border-orange-500/30 hover:border-orange-400/60',
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/35',
    championships: [],
    captain: 'Ashleigh Gardner',
    logo: '/logos/wpl_gg_logo_modern.svg',
  },
  upw: {
    accent: '#6D28D9',
    secondary: '#F59E0B',
    glow: 'rgba(109, 40, 217, 0.28)',
    border: 'border-indigo-500/30 hover:border-amber-400/50',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
    championships: [],
    captain: 'Alyssa Healy',
    logo: '/logos/wpl_upw_logo_modern.svg',
  },
};

const DEFAULT_THEME = {
  accent: '#38BDF8',
  secondary: '#F59E0B',
  glow: 'rgba(56, 189, 248, 0.22)',
  border: 'border-slate-700/60 hover:border-cyan-400/50',
  badge: 'bg-slate-800 text-slate-300 border-slate-700',
  championships: [] as string[],
  captain: 'Team Captain',
  logo: '/logos/tba_logo.svg',
};

type WplTeamRecord = Team & {
  venue?: string;
  captain?: string;
  coach?: string;
  homeVenue?: string;
};

function getFranchiseTheme(team: Team) {
  const key = (team.shortName || team.id || team.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (key.includes('rcb') || key.includes('bangalore') || key.includes('bengaluru')) return WPL_THEMES.rcb;
  if (key.includes('mi') || key.includes('mumbai')) return WPL_THEMES.mi;
  if (key.includes('dc') || key.includes('delhi')) return WPL_THEMES.dc;
  if (key.includes('gg') || key.includes('gujarat')) return WPL_THEMES.gg;
  if (key.includes('upw') || key.includes('warrior')) return WPL_THEMES.upw;
  return DEFAULT_THEME;
}

const CANONICAL_WPL_TEAMS: WplTeamRecord[] = [
  {
    id: 'rcb-w',
    league: 'wpl',
    name: 'Royal Challengers Bengaluru (WPL)',
    shortName: 'RCB-W',
    logo: '/logos/wpl_rcb_logo_modern.svg',
    venue: 'M. Chinnaswamy Stadium, Bengaluru',
    captain: 'Smriti Mandhana',
    players: [],
    trophies: [{ year: 2024, type: 'championship', league: 'wpl' }, { year: 2026, type: 'championship', league: 'wpl' }] as any,
  } as unknown as WplTeamRecord,
  {
    id: 'mi-w',
    league: 'wpl',
    name: 'Mumbai Indians (WPL)',
    shortName: 'MI-W',
    logo: '/logos/wpl_mi_logo_modern.svg',
    venue: 'Wankhede Stadium, Mumbai',
    captain: 'Harmanpreet Kaur',
    players: [],
    trophies: [{ year: 2023, type: 'championship', league: 'wpl' }, { year: 2025, type: 'championship', league: 'wpl' }] as any,
  } as unknown as WplTeamRecord,
  {
    id: 'dc-w',
    league: 'wpl',
    name: 'Delhi Capitals (WPL)',
    shortName: 'DC-W',
    logo: '/logos/wpl_dc_logo_modern.svg',
    venue: 'Arun Jaitley Stadium, Delhi',
    captain: 'Meg Lanning',
    players: [],
    trophies: [],
  } as unknown as WplTeamRecord,
  {
    id: 'gg',
    league: 'wpl',
    name: 'Gujarat Giants',
    shortName: 'GG',
    logo: '/logos/wpl_gg_logo_modern.svg',
    venue: 'Narendra Modi Stadium, Ahmedabad',
    captain: 'Ashleigh Gardner',
    players: [],
    trophies: [],
  } as unknown as WplTeamRecord,
  {
    id: 'upw',
    league: 'wpl',
    name: 'UP Warriorz',
    shortName: 'UPW',
    logo: '/logos/wpl_upw_logo_modern.svg',
    venue: 'BRSABV Ekana Cricket Stadium, Lucknow',
    captain: 'Alyssa Healy',
    players: [],
    trophies: [],
  } as unknown as WplTeamRecord,
];

function getFranchiseKey(str?: string): 'rcb' | 'mi' | 'dc' | 'gg' | 'upw' | null {
  const s = String(str || '').toLowerCase().trim();
  if (s.includes('rcb') || s.includes('bangalore') || s.includes('bengaluru') || s === '14') return 'rcb';
  if (s.includes('mi') || s.includes('mumbai') || s === '13') return 'mi';
  if (s.includes('dc') || s.includes('delhi') || s === '11') return 'dc';
  if (s.includes('gg') || s.includes('gujarat') || s === '12') return 'gg';
  if (s.includes('upw') || s.includes('up') || s.includes('warrior') || s === '15') return 'upw';
  return null;
}

function isPlayerInWplTeam(p: any, teamParamId: string, teamObj?: any): boolean {
  const targetKey =
    getFranchiseKey(teamParamId) ||
    (teamObj ? getFranchiseKey(teamObj.id || teamObj.shortName || teamObj.name) : null);
  if (!targetKey) return false;

  const pId = String(p.id || '').toLowerCase();
  const pTeamId = String(p.teamId || '').toLowerCase();
  const pTeam = String(p.team || '').toLowerCase();

  if (pId.startsWith(`wpl_${targetKey}`) || pId.startsWith(`wpl-${targetKey}`)) return true;
  if (targetKey === 'upw' && (pId.startsWith('wpl_up') || pId.startsWith('wpl-up'))) return true;

  const franchiseIdMap: Record<string, string> = { rcb: '14', mi: '13', dc: '11', gg: '12', upw: '15' };
  if (pTeamId === franchiseIdMap[targetKey]) return true;

  if (targetKey === 'rcb' && (pTeam.includes('rcb') || pTeam.includes('bengaluru') || pTeam.includes('bangalore'))) return true;
  if (targetKey === 'mi' && (pTeam.includes('mumbai') || pTeam.includes('mi'))) return true;
  if (targetKey === 'dc' && (pTeam.includes('delhi') || pTeam.includes('capitals') || pTeam.includes('dc'))) return true;
  if (targetKey === 'gg' && (pTeam.includes('gujarat') || pTeam.includes('giants') || pTeam.includes('gg'))) return true;
  if (targetKey === 'upw' && (pTeam.includes('up') || pTeam.includes('warrior'))) return true;

  return false;
}

function WPLTeamsContent() {
  const searchParams = useSearchParams();
  const { currentLeague, setCurrentLeague } = useLeague();

  const [teams, setTeams] = useState<WplTeamRecord[]>(CANONICAL_WPL_TEAMS);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [titleFilter, setTitleFilter] = useState<'all' | 'champions' | 'contenders'>('all');

  useEffect(() => {
    if (currentLeague !== 'wpl') {
      setCurrentLeague('wpl');
    }
  }, [currentLeague, setCurrentLeague]);

  useEffect(() => {
    (async () => {
      try {
        let cachedPlayers: Player[] = [];
        if (typeof window !== 'undefined') {
          try {
            const raw =
              localStorage.getItem('sportsup99_wpl_players_v2') ||
              localStorage.getItem('sportsup99_wpl_players_v1');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) cachedPlayers = parsed;
            }
          } catch {}
        }

        const [teamsData, playersData] = await Promise.all([
          api.getTeams('wpl').catch(() => []),
          api.getPlayers(undefined, 'wpl').catch(() => []),
        ]);

        const validApiTeams = (teamsData || []).filter((t: Team) => !isPlaceholderTeam(t));
        const mergedMap = new Map<string, WplTeamRecord>();
        CANONICAL_WPL_TEAMS.forEach((ct) => mergedMap.set(ct.id, ct));

        validApiTeams.forEach((at: WplTeamRecord) => {
          const key = (at.shortName || at.name || '').toLowerCase();
          let targetId = at.id;
          if (key.includes('rcb') || key.includes('bangalore') || key.includes('bengaluru')) targetId = 'rcb-w';
          else if (key.includes('mi') || key.includes('mumbai')) targetId = 'mi-w';
          else if (key.includes('dc') || key.includes('delhi')) targetId = 'dc-w';
          else if (key.includes('gg') || key.includes('gujarat')) targetId = 'gg';
          else if (key.includes('up') || key.includes('warrior')) targetId = 'upw';

          const existing = mergedMap.get(targetId);
          if (existing) {
            mergedMap.set(targetId, {
              ...existing,
              ...at,
              id: targetId,
              logo: existing.logo,
            });
          }
        });

        const mergedPlayersMap = new Map<string, any>();
        (playersData || []).forEach((p: any) => {
          const clean = { ...p };
          delete clean.cricbuzzUrl;
          delete clean.cricbuzzId;
          const k = String(clean.id || clean.name || '').trim().toLowerCase();
          mergedPlayersMap.set(k, clean);
        });
        cachedPlayers.forEach((lp: any) => {
          const clean = { ...lp };
          delete clean.cricbuzzUrl;
          delete clean.cricbuzzId;
          const k = String(clean.id || clean.name || '').trim().toLowerCase();
          const existing = mergedPlayersMap.get(k);
          mergedPlayersMap.set(k, existing ? { ...existing, ...clean } : clean);
        });

        setTeams(Array.from(mergedMap.values()));
        setPlayers(Array.from(mergedPlayersMap.values()));
      } catch (err) {
        console.error('Failed to load WPL teams:', err);
        setTeams(CANONICAL_WPL_TEAMS);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const playersByTeam = useMemo(() => {
    const map = new Map<string, Player[]>();
    for (const team of teams) {
      const roster = players.filter((p) => isPlayerInWplTeam(p, team.id, team));
      map.set(String(team.id).toLowerCase(), roster);
      const fKey = getFranchiseKey(team.id || team.shortName);
      if (fKey) map.set(fKey, roster);
    }
    return map;
  }, [players, teams]);

  const uniqueVenues = useMemo(() => {
    const set = new Set<string>();
    teams.forEach((t) => {
      if (t.venue) set.add(t.venue);
    });
    return Array.from(set);
  }, [teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const theme = getFranchiseTheme(team);
      const matchSearch =
        team.name.toLowerCase().includes(search.toLowerCase()) ||
        team.shortName.toLowerCase().includes(search.toLowerCase()) ||
        (team.venue && team.venue.toLowerCase().includes(search.toLowerCase()));
      const matchVenue = selectedVenue === 'all' || team.venue === selectedVenue;
      const isChamp = theme.championships.length > 0;
      const matchTitle =
        titleFilter === 'all' ||
        (titleFilter === 'champions' && isChamp) ||
        (titleFilter === 'contenders' && !isChamp);
      return matchSearch && matchVenue && matchTitle;
    });
  }, [teams, search, selectedVenue, titleFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            Loading 2027 WPL Franchises…
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col relative selection:bg-cyan-400 selection:text-slate-950 overflow-x-clip">
      <Navbar />

      {/* Atmospheric Stadium Lighting (ZERO PINK) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-[620px] h-[440px] bg-cyan-500/[0.06] blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-[560px] h-[460px] bg-indigo-500/[0.06] blur-[150px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[780px] h-[320px] bg-amber-500/[0.04] blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <main className="relative z-10 flex-1 pb-28">
        {/* Hero Header */}
        <section className="pt-12 pb-10 border-b border-white/[0.08] bg-gradient-to-b from-[#0C1326]/90 to-[#050814]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
            >
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>WPL Season 5 • Jan 14 – Feb 7, 2027</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                  Franchises &{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300">
                    Squads
                  </span>
                </h1>

                <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
                  Explore complete 2027 Women's Premier League rosters, leadership profiles, match schedules, and multi-format player records.
                </p>
              </div>

              {/* Telemetry Summary Strip */}
              <div className="grid grid-cols-3 gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 backdrop-blur-xl">
                <div className="pr-3 border-r border-white/10">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Teams
                  </span>
                  <span className="text-xl font-black text-white tabular-nums">{teams.length}</span>
                </div>
                <div className="pr-3 border-r border-white/10">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                    Athletes
                  </span>
                  <span className="text-xl font-black text-white tabular-nums">{players.length || 56}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    Season
                  </span>
                  <span className="text-xl font-black text-white tabular-nums">2027</span>
                </div>
              </div>
            </motion.div>

            {/* Filter & Control Bar */}
            <div className="pt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Franchises' },
                  { id: 'champions', label: 'Past Champions' },
                  { id: 'contenders', label: '2027 Challengers' },
                ].map((tab) => {
                  const isActive = titleFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTitleFilter(tab.id as any)}
                      className={`relative px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors ${
                        isActive ? 'text-slate-950' : 'text-slate-300 bg-white/[0.04] border border-white/10 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="wpl-teams-filter-pill"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 to-cyan-300 shadow-lg shadow-amber-500/20"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search team, city, or stadium..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-cyan-400/60 transition-colors"
                  />
                </div>

                {uniqueVenues.length > 1 && (
                  <select
                    value={selectedVenue}
                    onChange={(e) => setSelectedVenue(e.target.value)}
                    aria-label="Filter by venue"
                    className="px-3 py-2.5 rounded-xl bg-[#0B1020] border border-white/10 text-slate-300 text-xs font-semibold focus:outline-none focus:border-cyan-400/60"
                  >
                    <option value="all">All Venues</option>
                    {uniqueVenues.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'grid' ? 'bg-white/15 text-amber-300' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Grid View"
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'list' ? 'bg-white/15 text-amber-300' : 'text-slate-400 hover:text-white'
                    }`}
                    title="List View"
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Franchises Grid / List */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          {filteredTeams.length === 0 ? (
            <div className="text-center py-24 rounded-3xl bg-white/[0.02] border border-white/10 max-w-lg mx-auto p-8">
              <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-base font-bold text-white">No franchises match your filter</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedVenue('all');
                  setTitleFilter('all');
                }}
                className="mt-4 px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider"
              >
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team, index) => {
                const theme = getFranchiseTheme(team);
                const teamRoster = playersByTeam.get(String(team.id).toLowerCase()) || [];
                const captainName = team.captain || theme.captain;
                const championships = theme.championships;
                const previewStars = teamRoster.slice(0, 3);

                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ y: -5 }}
                    className="relative group"
                  >
                    <div
                      className={`relative rounded-3xl p-6 sm:p-7 border ${theme.border} bg-[#0A0F1F]/95 overflow-hidden transition-all duration-300 flex flex-col justify-between h-full shadow-xl`}
                      style={{
                        boxShadow: `0 16px 40px -18px rgba(0,0,0,0.85)`,
                      }}
                    >
                      <div
                        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40"
                        style={{ backgroundColor: theme.accent }}
                      />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between gap-3 mb-5">
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider border ${theme.badge}`}>
                            {team.shortName || 'WPL'}
                          </span>

                          {championships.length > 0 ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300 text-[11px] font-bold">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              <span>{championships.length}x Champs ({championships.join(', ')})</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase">
                              2027 Contender
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mb-5">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/45 border border-white/15 p-2.5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                            <Image
                              src={theme.logo}
                              alt={`${team.name} Logo`}
                              width={72}
                              height={72}
                              className="object-contain w-full h-full"
                              priority
                            />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <h2 className="text-xl font-black text-white tracking-tight leading-snug">
                              {team.name}
                            </h2>
                            {captainName && (
                              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate">{captainName}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-white/[0.07] mb-5 text-xs">
                          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              Home Ground
                            </span>
                            <span className="block text-slate-200 font-semibold truncate mt-0.5" title={team.venue || 'TBA'}>
                              {team.venue || 'Official TBA'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              <Users className="w-3 h-3 text-emerald-400" />
                              Active Squad
                            </span>
                            <span className="block text-emerald-300 font-bold mt-0.5 tabular-nums">
                              {teamRoster.length > 0 ? `${teamRoster.length} Athletes` : 'Squad Hub'}
                            </span>
                          </div>
                        </div>

                        {previewStars.length > 0 && (
                          <div className="mb-5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                              Key Roster Names
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {previewStars.map((p: any) => (
                                <span
                                  key={p.id || p.name}
                                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] font-semibold text-slate-200"
                                >
                                  {p.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/wpl/teams/${team.id}`}
                        className="relative z-10 mt-auto w-full py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-gradient-to-r hover:from-amber-400 hover:to-cyan-300 hover:text-slate-950 border border-white/15 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-between transition-all"
                      >
                        <span>Explore Squad & Profiles</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeams.map((team, index) => {
                const theme = getFranchiseTheme(team);
                const captainName = team.captain || theme.captain;
                const championships = theme.championships;
                const teamRoster = playersByTeam.get(String(team.id).toLowerCase()) || [];

                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="p-4 sm:p-5 rounded-2xl bg-[#0A0F1F] border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-black/45 border border-white/10 p-2 flex items-center justify-center shrink-0">
                        <Image
                          src={theme.logo}
                          alt={`${team.name} Logo`}
                          width={44}
                          height={44}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-white">{team.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${theme.badge}`}>
                            {team.shortName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {team.venue || 'Home Stadium TBA'} • Capt: {captainName} • {teamRoster.length} Players
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                      {championships.length > 0 && (
                        <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          {championships.length}x Champs ({championships.join(', ')})
                        </span>
                      )}
                      <Link
                        href={`/wpl/teams/${team.id}`}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all hover:brightness-105"
                      >
                        <span>Explore Squad</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function WPLTeamsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050814] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <WPLTeamsContent />
    </Suspense>
  );
}
