'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  ChevronRight,
  Filter,
  Flame,
  MapPin,
  Search,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/data';
import type { Team, Player, Match } from '@/types';

interface TeamTheme {
  primary: string;
  secondary: string;
  glow: string;
  gradient: string;
  borderGlow: string;
  shieldGradient: string;
  metallicText: string;
}

const TEAM_THEMES: Record<string, TeamTheme> = {
  'rcb': {
    primary: '#E01E37',
    secondary: '#FFB703',
    glow: 'rgba(224, 30, 55, 0.4)',
    gradient: 'from-[#42040c] via-[#12080a] to-[#05070f]',
    borderGlow: 'hover:border-red-500/60',
    shieldGradient: 'from-amber-400 via-rose-500 to-red-800',
    metallicText: 'bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600',
  },
  'mi': {
    primary: '#004BA0',
    secondary: '#D1AB3E',
    glow: 'rgba(0, 75, 160, 0.4)',
    gradient: 'from-[#031d44] via-[#050e1f] to-[#05070f]',
    borderGlow: 'hover:border-blue-500/60',
    shieldGradient: 'from-blue-400 via-indigo-500 to-blue-900',
    metallicText: 'bg-gradient-to-br from-amber-100 via-amber-300 to-yellow-500',
  },
  'dc': {
    primary: '#0047AB',
    secondary: '#DC143C',
    glow: 'rgba(220, 20, 60, 0.4)',
    gradient: 'from-[#170a2c] via-[#0b0c1c] to-[#05070f]',
    borderGlow: 'hover:border-indigo-500/60',
    shieldGradient: 'from-red-500 via-blue-600 to-slate-900',
    metallicText: 'bg-gradient-to-br from-slate-100 via-red-200 to-rose-400',
  },
  'gg': {
    primary: '#F36F21',
    secondary: '#00A896',
    glow: 'rgba(243, 111, 33, 0.4)',
    gradient: 'from-[#3a1a05] via-[#170e0a] to-[#05070f]',
    borderGlow: 'hover:border-orange-500/60',
    shieldGradient: 'from-orange-400 via-amber-500 to-teal-800',
    metallicText: 'bg-gradient-to-br from-orange-100 via-amber-300 to-yellow-500',
  },
  'upw': {
    primary: '#6A1B9A',
    secondary: '#FFD600',
    glow: 'rgba(106, 27, 154, 0.4)',
    gradient: 'from-[#2e0854] via-[#130624] to-[#05070f]',
    borderGlow: 'hover:border-purple-500/60',
    shieldGradient: 'from-purple-500 via-fuchsia-600 to-yellow-600',
    metallicText: 'bg-gradient-to-br from-yellow-100 via-yellow-300 to-amber-500',
  },
};

const getTeamTheme = (shortName?: string, name?: string): TeamTheme => {
  const key = (shortName || name || '').toLowerCase().replace(/[^a-z]/g, '');
  if (key.includes('rcb') || key.includes('bangalore') || key.includes('bengaluru')) return TEAM_THEMES['rcb'];
  if (key.includes('mi') || key.includes('mumbai')) return TEAM_THEMES['mi'];
  if (key.includes('dc') || key.includes('delhi')) return TEAM_THEMES['dc'];
  if (key.includes('gg') || key.includes('gujarat')) return TEAM_THEMES['gg'];
  if (key.includes('upw') || key.includes('up') || key.includes('warrior')) return TEAM_THEMES['upw'];
  return {
    primary: '#EC4899',
    secondary: '#A855F7',
    glow: 'rgba(236, 72, 153, 0.4)',
    gradient: 'from-[#2c0827] via-[#120718] to-[#05070f]',
    borderGlow: 'hover:border-pink-500/60',
    shieldGradient: 'from-pink-400 via-rose-500 to-purple-800',
    metallicText: 'bg-gradient-to-br from-pink-100 via-rose-300 to-amber-300',
  };
};

const getInitials = (name: string): string => {
  if (!name) return 'WPL';
  const clean = name.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getTeamVariations = (team: any, paramId: string): string[] => {
  const set = new Set<string>();
  const add = (val: any) => {
    if (!val) return;
    const s = String(val).toLowerCase().trim();
    if (!s) return;
    set.add(s);
    set.add(s.replace(/^team/i, ''));
    set.add(s.replace(/-w$/i, ''));
    set.add(`${s}-w`);
  };

  add(paramId);
  if (team) {
    add(team.id);
    add(team.shortName);
    add(team.name);
  }
  return Array.from(set);
};

async function fetchWithTimeout<T>(promise: Promise<T>, ms = 2000, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export default function EnhancedWPLTeamPage({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSquadExpanded, setIsSquadExpanded] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'all' | 'batsman' | 'all-rounder' | 'bowler' | 'wicketkeeper'>('all');
  const [activeTab, setActiveTab] = useState<'squad' | 'fixtures'>('squad');

  // Priority 1: Load Core Team + Players fast
  useEffect(() => {
    let isMounted = true;
    async function loadCoreData() {
      setLoading(true);
      try {
        const [teamsData, playersData] = await Promise.all([
          fetchWithTimeout(api.getTeams('wpl'), 2000, []),
          fetchWithTimeout(api.getPlayers(undefined, 'wpl'), 2000, [])
        ]);

        if (!isMounted) return;
        setAllTeams(teamsData);

        const targetVariants = getTeamVariations(null, teamId);
        const found = teamsData.find((t: Team) => {
          const tVars = getTeamVariations(t, '');
          return targetVariants.some(v => tVars.includes(v));
        });

        if (found) {
          setTeam(found);
          const fullVariants = getTeamVariations(found, teamId);

          const squad = playersData.filter((p: Player) => {
            const pTeamId = String(p.teamId || '').toLowerCase().trim();
            const pTeamNum = pTeamId.replace(/^team/i, '');
            return fullVariants.some(v => v === pTeamId || v === pTeamNum);
          });
          setPlayers(squad);
        }
      } catch (err) {
        console.error('Core data load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCoreData();
    return () => { isMounted = false; };
  }, [teamId]);

  // Priority 2: Lazy load Matches in background
  useEffect(() => {
    if (!team || matches.length > 0) return;
    let isMounted = true;

    async function loadMatches() {
      setMatchesLoading(true);
      try {
        const matchesData = await fetchWithTimeout(api.getMatches('wpl'), 2500, []);
        if (!isMounted) return;

        const fullVariants = getTeamVariations(team, teamId);
        const teamMatches = matchesData.filter((m: Match) => {
          const t1 = typeof m.team1 === 'object' ? String((m.team1 as any)?.id) : String(m.team1 || '');
          const t2 = typeof m.team2 === 'object' ? String((m.team2 as any)?.id) : String(m.team2 || '');
          return fullVariants.some(v => v === t1.toLowerCase() || v === t2.toLowerCase());
        });
        setMatches(teamMatches);
      } catch (e) {
        console.warn('Match lazy-load failed:', e);
      } finally {
        if (isMounted) setMatchesLoading(false);
      }
    }

    loadMatches();
    return () => { isMounted = false; };
  }, [team, teamId, matches.length]);

  const theme = useMemo(() => getTeamTheme(team?.shortName, team?.name), [team]);

  const getRoleBadgeStyle = (p: Player) => {
    const priority = getRolePriority(p);
    switch (priority) {
      case 1:
        return { label: 'Batter', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30 ring-rose-500/20' };
      case 2:
        return { label: 'Wicket-Keeper', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 ring-cyan-500/20' };
      case 3:
        return { label: 'Batting All-Rounder', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-emerald-500/20' };
      case 4:
        return { label: 'Bowling All-Rounder', bg: 'bg-teal-500/10 text-teal-400 border-teal-500/30 ring-teal-500/20' };
      case 5:
        return { label: 'All-Rounder', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-emerald-500/20' };
      case 6:
        return { label: 'Bowler', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30 ring-purple-500/20' };
      default:
        return { label: p.role || 'Player', bg: 'bg-gray-500/10 text-gray-400 border-gray-500/30 ring-gray-500/20' };
    }
  };


  const getRolePriority = (p: Player) => {
    const role = (p.role || '').toLowerCase();
    const arType = (p.allrounderType || '').toLowerCase();
    if (role.includes('bat') && !role.includes('all')) return 1; // Batters
    if (role.includes('keeper') || role.includes('wk')) return 2; // Wicketkeepers
    if (role.includes('all') || role.includes('rounder')) {
      if (arType.includes('bat')) return 3; // Batting All-rounder
      if (arType.includes('bowl')) return 4; // Bowling All-rounder
      return 5; // General All-rounder
    }
    if (role.includes('bowl')) return 6; // Bowlers
    return 7;
  };

  const filteredSquad = useMemo(() => {
    const list = players.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const role = (p.role || '').toLowerCase();
      let roleMatch = true;
      if (selectedRole === 'batsman') roleMatch = role.includes('bat') && !role.includes('all');
      else if (selectedRole === 'bowler') roleMatch = role.includes('bowl') && !role.includes('all');
      else if (selectedRole === 'all-rounder') roleMatch = role.includes('all') || role.includes('rounder');
      else if (selectedRole === 'wicketkeeper') roleMatch = role.includes('keeper') || role.includes('wk');
      return nameMatch && roleMatch;
    });

    return list.sort((a, b) => {
      const pA = getRolePriority(a);
      const pB = getRolePriority(b);
      if (pA !== pB) return pA - pB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [players, searchQuery, selectedRole]);

  const isFiltering = searchQuery.trim().length > 0 || selectedRole !== 'all';
  const visibleSquad = (isSquadExpanded || isFiltering) 
    ? filteredSquad 
    : filteredSquad.slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070f] text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 animate-pulse space-y-8">
          <div className="h-6 w-48 bg-white/10 rounded-lg" />
          <div className="h-64 rounded-3xl bg-white/[0.05] border border-white/10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/[0.04] border border-white/5" />
            ))}
          </div>
        </div>
        
      <Footer />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#05070f] text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-32 text-center">
          <Shield className="w-16 h-16 mx-auto text-pink-500 mb-6 opacity-70" />
          <h2 className="text-3xl font-black">Franchise Portal Unavailable</h2>
          <p className="mt-2 text-sm text-gray-400">Could not locate team records for "{teamId}".</p>
          <Link
            href="/wpl/teams"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Return to WPL Teams
          </Link>
        </div>
        
      <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col selection:bg-pink-500 selection:text-white">
      <Navbar />

      <main className="flex-1 pb-24 relative overflow-hidden">
        {/* Dynamic Top Ambient Aura */}
        <div 
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full blur-[150px] opacity-25"
          style={{ background: `radial-gradient(circle, ${theme.primary}, ${theme.secondary}, transparent 70%)` }}
        />

        {/* Top Breadcrumb & Switcher */}
        <div className="relative z-10 border-b border-white/[0.08] bg-black/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Link href="/wpl" className="hover:text-white transition-colors">WPL</Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <Link href="/wpl/teams" className="hover:text-white transition-colors">Franchises</Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-pink-400 font-bold">{team.shortName || team.name}</span>
            </div>

            {/* Quick Franchise Navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {allTeams.map((t) => {
                const isCurrent = t.id === team.id || t.shortName === team.shortName;
                const tTheme = getTeamTheme(t.shortName, t.name);
                return (
                  <Link
                    key={t.id}
                    href={`/wpl/teams/${(t.shortName || t.id).toLowerCase()}`}
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: tTheme.primary }} />
                    {t.shortName || t.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className={`relative pt-12 pb-14 border-b border-white/[0.08] bg-gradient-to-b ${theme.gradient}`}>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_300px] gap-8 items-center">
              
              {/* Franchise Crest Frame */}
              <div className="flex justify-center">
                <div 
                  className="relative w-44 h-44 rounded-3xl p-6 flex items-center justify-center bg-black/60 border border-white/15 backdrop-blur-2xl shadow-2xl"
                  style={{ boxShadow: `0 20px 60px -15px ${theme.glow}` }}
                >
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
                    />
                  ) : (
                    <Shield className="w-20 h-20 text-white/50" />
                  )}
                  <div 
                    className="absolute -bottom-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-950 shadow-md"
                    style={{ backgroundColor: theme.secondary }}
                  >
                    WPL 2027
                  </div>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-3.5 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 text-xs font-bold uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5" style={{ color: theme.secondary }} />
                  <span>Championship Roster</span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
                  {team.name}
                </h1>

                <p className="text-gray-300 text-sm max-w-xl leading-relaxed mx-auto lg:mx-0">
                  {team.description || `${team.name} confirmed squad for the Women's Premier League 2027 season.`}
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
                  {team.homeVenue && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-medium text-gray-300">
                      <MapPin className="w-3.5 h-3.5 text-pink-400" />
                      <span>{team.homeVenue}</span>
                    </div>
                  )}
                  {team.captain && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-medium text-gray-300">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>Captain: <strong className="text-white">{team.captain}</strong></span>
                    </div>
                  )}
                  {team.coach && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-medium text-gray-300">
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Coach: <strong className="text-white">{team.coach}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Squad</span>
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-3xl font-black text-white">{players.length}</span>
                  <span className="block text-[11px] text-gray-400 mt-0.5">Athletes</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Window</span>
                    <Calendar className="w-4 h-4 text-pink-400" />
                  </div>
                  <span className="text-xl font-black text-white">2027</span>
                  <span className="block text-[10px] text-pink-400 font-bold mt-1">Jan 9 – Feb 5</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl col-span-2">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Championship Record</span>
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-base font-black text-amber-300">
                    {team.shortName?.toLowerCase() === 'rcb-w' || team.shortName?.toLowerCase() === 'rcb' ? '1 WPL Championship (2026)' :
                     team.shortName?.toLowerCase() === 'mi-w' || team.shortName?.toLowerCase() === 'mi' ? '1 WPL Championship (2023)' :
                     'Contender for 2027 Title'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Tab & Controls */}
        <section className="sticky top-16 z-30 bg-[#05070f]/90 backdrop-blur-xl border-b border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="inline-flex p-1 rounded-xl bg-white/[0.06] border border-white/10 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('squad')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'squad'
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Squad Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'matches'
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Matches & Results</span>
              </button>
            </div>

            {/* Quick Search Input */}
            {activeTab === 'squad' && (
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search player name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            )}
          </div>
        </section>

        {/* Content Area */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {activeTab === 'squad' ? (
            <div>
              {/* Role Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: 'All Squad' },
                    { id: 'batter', label: 'Batters' },
                    { id: 'all-rounder', label: 'All-Rounders' },
                    { id: 'wicket-keeper', label: 'WK-Keepers' },
                    { id: 'bowler', label: 'Bowlers' }
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedRole === role.id
                          ? 'bg-pink-600 text-white shadow-lg'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-gray-400 font-medium">
                  Showing <strong className="text-white">{visibleSquad.length}</strong> of {filteredSquad.length} Players
                </div>
              </div>

              {/* Squad Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {visibleSquad.map((player) => {
                  const initials = (player.name || '')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  const s = player.stats || ({} as any);
                  const runs = s.runs || 0;
                  const wickets = s.wickets || 0;
                  const matchesCount = s.matches || 0;

                  return (
                    <div
                      key={player.id || player.name}
                      onClick={() => setSelectedPlayer(player)}
                      className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-pink-500/50 p-5 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-black border border-white/20 shadow-inner"
                            style={{
                              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                              color: '#fff'
                            }}
                          >
                            {initials}
                          </div>
                          {player.isCaptain && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                              Captain
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-white group-hover:text-pink-400 transition-colors">
                          {player.name}
                        </h3>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">
                          {player.role || 'Player'}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-black/40 py-2 border border-white/5">
                          <span className="block text-xs font-black text-white">{runs}</span>
                          <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Runs</span>
                        </div>
                        <div className="rounded-lg bg-black/40 py-2 border border-white/5">
                          <span className="block text-xs font-black text-white">{wickets}</span>
                          <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Wkts</span>
                        </div>
                        <div className="rounded-lg bg-black/40 py-2 border border-white/5">
                          <span className="block text-xs font-black text-white">{matchesCount}</span>
                          <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Mat</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Squad Expand / Collapse Toggle Button */}
              {!isFiltering && filteredSquad.length > 4 && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsSquadExpanded(!isSquadExpanded)}
                    className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 hover:border-pink-500/50 text-white font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl hover:scale-105 active:scale-95"
                  >
                    <span className="bg-gradient-to-r from-pink-400 to-amber-300 bg-clip-text text-transparent group-hover:from-white transition-all">
                      {isSquadExpanded 
                        ? 'Collapse Squad' 
                        : `View Full Squad (${filteredSquad.length} Players)`}
                    </span>
                    <ChevronRight 
                      className={`w-4 h-4 text-pink-400 transition-transform duration-300 ${isSquadExpanded ? '-rotate-90' : 'rotate-90'}`} 
                    />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {matchesLoading ? (
                <div className="text-center py-20 text-gray-400">Loading fixture archive...</div>
              ) : matches.length === 0 ? (
                <div className="text-center py-24 rounded-3xl border border-white/10 bg-white/[0.02]">
                  <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                  <h3 className="text-lg font-bold text-white">2027 Schedule Pending</h3>
                  <p className="text-xs text-gray-400 mt-1">Official fixtures for Jan 9 – Feb 5, 2027 will appear once released.</p>
                </div>
              ) : (
                <div className="grid gap-3.5">
                  {matches.map((m) => {
                    const opponent = typeof m.team1 === 'object' && (m.team1 as any)?.name === team.name 
                      ? (typeof m.team2 === 'object' ? (m.team2 as any)?.name : m.team2) 
                      : (typeof m.team1 === 'object' ? (m.team1 as any)?.name : m.team1);

                    return (
                      <div
                        key={m.id}
                        className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/[0.03] gap-4"
                      >
                        <div className="space-y-1 text-center sm:text-left">
                          <div className="text-xs font-bold text-pink-400 uppercase">
                            {m.venue || 'TBA'} • {new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-lg font-black text-white">
                            vs {opponent}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-gray-300">
                            {m.status?.toUpperCase() || 'SCHEDULED'}
                          </span>
                          {m.result && (
                            <span className="text-xs text-amber-300 font-semibold">
                              {m.result}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* PUBLIC PLAYER DETAIL MODAL (CRICBUZZ STANDARD) */}
      {selectedPlayer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedPlayer(null)}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0f1d] border border-white/15 p-6 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Dismiss */}
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-white/10">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 via-black/70 to-black/95 border border-white/20 shrink-0 flex flex-col items-center justify-center shadow-xl">
                {/* Ambient Dynamic Role/Theme Glow */}
                <div 
                  className="absolute inset-0 opacity-40 blur-lg pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${theme.primary}, transparent)` }}
                />

                {/* Metallic Tech Ring Motif */}
                <div className="absolute inset-1 rounded-xl border border-dashed border-white/15 pointer-events-none" />

                {/* Jersey Number or Initials */}
                <span className="relative z-10 text-3xl font-black tracking-tight text-white drop-shadow-md">
                  {selectedPlayer.jerseyNumber ? `#${selectedPlayer.jerseyNumber}` : getInitials(selectedPlayer.name)}
                </span>

                <span className="relative z-10 text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                  {selectedPlayer.role ? selectedPlayer.role.slice(0, 10) : 'Player'}
                </span>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-2xl font-black text-white">{selectedPlayer.name}</h3>
                  {selectedPlayer.isCaptain && (
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                      Captain
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  {(() => {
                    const badge = getRoleBadgeStyle(selectedPlayer);
                    return (
                      <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider border ring-1 ${badge.bg}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                  {selectedPlayer.nationality && (
                    <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-semibold text-gray-300">
                      {selectedPlayer.nationality}
                    </span>
                  )}
                  {selectedPlayer.dateOfBirth && (
                    <span className="text-xs text-gray-400">
                      DOB: {selectedPlayer.dateOfBirth} ({selectedPlayer.age ? `${selectedPlayer.age} yrs` : ''})
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 pt-1">
                  Batting: <span className="text-gray-200">{selectedPlayer.battingStyle || 'Right Handed'}</span> • Bowling: <span className="text-gray-200">{selectedPlayer.bowlingStyle || 'None'}</span>
                </p>
              </div>
            </div>

            {/* BATTING CAREER SUMMARY */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400">Batting Career Summary</h4>
                </div>
                <span className="text-[11px] font-bold text-gray-400 uppercase">WPL Tournament</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-center text-xs">
                  <thead className="bg-white/5 text-gray-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Format</th>
                      <th className="py-2.5 px-2">M</th>
                      <th className="py-2.5 px-2">Inn</th>
                      <th className="py-2.5 px-2">NO</th>
                      <th className="py-2.5 px-2">Runs</th>
                      <th className="py-2.5 px-2">Balls</th>
                      <th className="py-2.5 px-2">HS</th>
                      <th className="py-2.5 px-2">Avg</th>
                      <th className="py-2.5 px-2">SR</th>
                      <th className="py-2.5 px-2">4s</th>
                      <th className="py-2.5 px-2">6s</th>
                      <th className="py-2.5 px-2">50s</th>
                      <th className="py-2.5 px-2">100s</th>
                      <th className="py-2.5 px-2">Ducks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-semibold text-gray-200">
                    {(() => {
                      const s = selectedPlayer.stats || ({} as any);
                      const m = s.matches || 0;
                      const inn = s.battingInnings || 0;
                      const no = s.notOuts || 0;
                      const runs = s.runs || 0;
                      const bf = s.ballsFaced || 0;
                      const hs = s.highest || 0;
                      const hsDisplay = s.highestNotOut ? `${hs}*` : `${hs}`;
                      const dismissals = Math.max(0, inn - no);
                      const avg = s.average ? Number(s.average).toFixed(2) : (dismissals > 0 && runs > 0 ? (runs / dismissals).toFixed(2) : (runs > 0 ? runs.toFixed(2) : '-'));
                      const sr = s.strikeRate ? Number(s.strikeRate).toFixed(2) : (bf > 0 && runs > 0 ? ((runs * 100) / bf).toFixed(2) : '-');
                      return (
                        <tr className="hover:bg-white/[0.04]">
                          <td className="py-3 px-3 text-left font-black text-white">WPL</td>
                          <td className="py-3 px-2">{m}</td>
                          <td className="py-3 px-2">{inn}</td>
                          <td className="py-3 px-2">{no}</td>
                          <td className="py-3 px-2 font-black text-emerald-400">{runs}</td>
                          <td className="py-3 px-2">{bf}</td>
                          <td className="py-3 px-2 font-bold">{hsDisplay}</td>
                          <td className="py-3 px-2 font-bold text-cyan-400">{avg}</td>
                          <td className="py-3 px-2 font-bold text-amber-400">{sr}</td>
                          <td className="py-3 px-2">{s.fours || 0}</td>
                          <td className="py-3 px-2">{s.sixes || 0}</td>
                          <td className="py-3 px-2">{s.fifties || 0}</td>
                          <td className="py-3 px-2">{s.hundreds || 0}</td>
                          <td className="py-3 px-2 text-rose-400">{s.ducks ?? 0}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BOWLING CAREER SUMMARY */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-400" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-teal-400">Bowling Career Summary</h4>
                </div>
                <span className="text-[11px] font-bold text-gray-400 uppercase">WPL Tournament</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-center text-xs">
                  <thead className="bg-white/5 text-gray-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Format</th>
                      <th className="py-2.5 px-2">M</th>
                      <th className="py-2.5 px-2">Inn</th>
                      <th className="py-2.5 px-2">Balls</th>
                      <th className="py-2.5 px-2">Runs</th>
                      <th className="py-2.5 px-2">Maidens</th>
                      <th className="py-2.5 px-2">Wkts</th>
                      <th className="py-2.5 px-2">Avg</th>
                      <th className="py-2.5 px-2">Eco</th>
                      <th className="py-2.5 px-2">SR</th>
                      <th className="py-2.5 px-2">BBI</th>
                      <th className="py-2.5 px-2">4w</th>
                      <th className="py-2.5 px-2">5w</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-semibold text-gray-200">
                    {(() => {
                      const s = selectedPlayer.stats || ({} as any);
                      const m = s.matches || 0;
                      const inn = s.bowlingInnings || 0;
                      const oversRaw = parseFloat(s.balls || '0') || 0;
                      const fullOvers = Math.floor(oversRaw);
                      const remBalls = Math.round((oversRaw - fullOvers) * 10);
                      const totalBalls = fullOvers * 6 + remBalls;
                      const runsConceded = s.runsConceded || 0;
                      const wkts = s.wickets || 0;
                      const econ = s.economy ? Number(s.economy).toFixed(2) : (totalBalls > 0 ? ((runsConceded * 6) / totalBalls).toFixed(2) : '-');
                      const bAvg = s.bowlingAverage ? Number(s.bowlingAverage).toFixed(2) : (wkts > 0 && runsConceded > 0 ? (runsConceded / wkts).toFixed(2) : '-');
                      const bSR = s.bowlingStrikeRate ? Number(s.bowlingStrikeRate).toFixed(1) : (wkts > 0 && totalBalls > 0 ? (totalBalls / wkts).toFixed(1) : '-');
                      return (
                        <tr className="hover:bg-white/[0.04]">
                          <td className="py-3 px-3 text-left font-black text-white">WPL</td>
                          <td className="py-3 px-2">{m}</td>
                          <td className="py-3 px-2">{inn}</td>
                          <td className="py-3 px-2">{totalBalls > 0 ? totalBalls : (s.balls || 0)}</td>
                          <td className="py-3 px-2">{runsConceded}</td>
                          <td className="py-3 px-2">{s.maidens || 0}</td>
                          <td className="py-3 px-2 font-black text-teal-400">{wkts}</td>
                          <td className="py-3 px-2 font-bold text-purple-400">{bAvg}</td>
                          <td className="py-3 px-2 font-bold text-amber-400">{econ}</td>
                          <td className="py-3 px-2 font-bold text-rose-400">{bSR}</td>
                          <td className="py-3 px-2">{s.bestBowling || '-/-'}</td>
                          <td className="py-3 px-2">{s.fourWickets || 0}</td>
                          <td className="py-3 px-2">{s.fiveWickets || 0}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FIELDING / KEEPING */}
            {(() => {
              const s = selectedPlayer.stats || ({} as any);
              if (s.catches || s.stumpings) {
                return (
                  <div className="mt-5 p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-6 justify-center text-xs">
                    <span className="text-gray-400">Fielding:</span>
                    <span><strong className="text-white">{s.catches || 0}</strong> Catches</span>
                    <span><strong className="text-white">{s.stumpings || 0}</strong> Stumpings</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      
      {/* PUBLIC PLAYER DETAIL MODAL (CRICBUZZ STANDARD) */}
      {selectedPlayer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPlayer(null)}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0f1d] border border-white/15 p-6 sm:p-8 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Dismiss */}
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-white/10">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 via-black/70 to-black/95 border border-white/20 shrink-0 flex flex-col items-center justify-center shadow-xl">
                {/* Ambient Dynamic Role/Theme Glow */}
                <div 
                  className="absolute inset-0 opacity-40 blur-lg pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${theme.primary}, transparent)` }}
                />

                {/* Metallic Tech Ring Motif */}
                <div className="absolute inset-1 rounded-xl border border-dashed border-white/15 pointer-events-none" />

                {/* Jersey Number or Initials */}
                <span className="relative z-10 text-3xl font-black tracking-tight text-white drop-shadow-md">
                  {selectedPlayer.jerseyNumber ? `#${selectedPlayer.jerseyNumber}` : getInitials(selectedPlayer.name)}
                </span>

                <span className="relative z-10 text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                  {selectedPlayer.role ? selectedPlayer.role.slice(0, 10) : 'Player'}
                </span>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-2xl font-black text-white">{selectedPlayer.name}</h3>
                  {selectedPlayer.isCaptain && (
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                      Captain
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  {(() => {
                    const badge = getRoleBadgeStyle(selectedPlayer);
                    return (
                      <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider border ring-1 ${badge.bg}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                  {selectedPlayer.nationality && (
                    <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-semibold text-gray-300">
                      {selectedPlayer.nationality}
                    </span>
                  )}
                  {selectedPlayer.dateOfBirth && (
                    <span className="text-xs text-gray-400">
                      DOB: {selectedPlayer.dateOfBirth} ({selectedPlayer.age ? `${selectedPlayer.age} yrs` : ''})
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 pt-1">
                  Batting: <span className="text-gray-200">{selectedPlayer.battingStyle || 'Right Handed'}</span> • Bowling: <span className="text-gray-200">{selectedPlayer.bowlingStyle || 'None'}</span>
                </p>
              </div>
            </div>

            {/* BATTING CAREER SUMMARY */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400">Batting Career Summary</h4>
                </div>
                <span className="text-[11px] font-bold text-gray-400 uppercase">WPL Tournament</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-center text-xs">
                  <thead className="bg-white/5 text-gray-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Format</th>
                      <th className="py-2.5 px-2">M</th>
                      <th className="py-2.5 px-2">Inn</th>
                      <th className="py-2.5 px-2">NO</th>
                      <th className="py-2.5 px-2">Runs</th>
                      <th className="py-2.5 px-2">Balls</th>
                      <th className="py-2.5 px-2">HS</th>
                      <th className="py-2.5 px-2">Avg</th>
                      <th className="py-2.5 px-2">SR</th>
                      <th className="py-2.5 px-2">4s</th>
                      <th className="py-2.5 px-2">6s</th>
                      <th className="py-2.5 px-2">50s</th>
                      <th className="py-2.5 px-2">100s</th>
                      <th className="py-2.5 px-2">Ducks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-semibold text-gray-200">
                    {(() => {
                      const s = selectedPlayer.stats || ({} as any);
                      const m = s.matches || 0;
                      const inn = s.battingInnings || 0;
                      const no = s.notOuts || 0;
                      const runs = s.runs || 0;
                      const bf = s.ballsFaced || 0;
                      const hs = s.highest || 0;
                      const hsDisplay = s.highestNotOut ? `${hs}*` : `${hs}`;
                      const dismissals = Math.max(0, inn - no);
                      const avg = s.average ? Number(s.average).toFixed(2) : (dismissals > 0 && runs > 0 ? (runs / dismissals).toFixed(2) : (runs > 0 ? runs.toFixed(2) : '-'));
                      const sr = s.strikeRate ? Number(s.strikeRate).toFixed(2) : (bf > 0 && runs > 0 ? ((runs * 100) / bf).toFixed(2) : '-');
                      return (
                        <tr className="hover:bg-white/[0.04]">
                          <td className="py-3 px-3 text-left font-black text-white">WPL</td>
                          <td className="py-3 px-2">{m}</td>
                          <td className="py-3 px-2">{inn}</td>
                          <td className="py-3 px-2">{no}</td>
                          <td className="py-3 px-2 font-black text-emerald-400">{runs}</td>
                          <td className="py-3 px-2">{bf}</td>
                          <td className="py-3 px-2 font-bold">{hsDisplay}</td>
                          <td className="py-3 px-2 font-bold text-cyan-400">{avg}</td>
                          <td className="py-3 px-2 font-bold text-amber-400">{sr}</td>
                          <td className="py-3 px-2">{s.fours || 0}</td>
                          <td className="py-3 px-2">{s.sixes || 0}</td>
                          <td className="py-3 px-2">{s.fifties || 0}</td>
                          <td className="py-3 px-2">{s.hundreds || 0}</td>
                          <td className="py-3 px-2 text-rose-400">{s.ducks ?? 0}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BOWLING CAREER SUMMARY */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-400" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-teal-400">Bowling Career Summary</h4>
                </div>
                <span className="text-[11px] font-bold text-gray-400 uppercase">WPL Tournament</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-center text-xs">
                  <thead className="bg-white/5 text-gray-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Format</th>
                      <th className="py-2.5 px-2">M</th>
                      <th className="py-2.5 px-2">Inn</th>
                      <th className="py-2.5 px-2">Balls</th>
                      <th className="py-2.5 px-2">Runs</th>
                      <th className="py-2.5 px-2">Maidens</th>
                      <th className="py-2.5 px-2">Wkts</th>
                      <th className="py-2.5 px-2">Avg</th>
                      <th className="py-2.5 px-2">Eco</th>
                      <th className="py-2.5 px-2">SR</th>
                      <th className="py-2.5 px-2">BBI</th>
                      <th className="py-2.5 px-2">4w</th>
                      <th className="py-2.5 px-2">5w</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-semibold text-gray-200">
                    {(() => {
                      const s = selectedPlayer.stats || ({} as any);
                      const m = s.matches || 0;
                      const inn = s.bowlingInnings || 0;
                      const oversRaw = parseFloat(s.balls || '0') || 0;
                      const fullOvers = Math.floor(oversRaw);
                      const remBalls = Math.round((oversRaw - fullOvers) * 10);
                      const totalBalls = fullOvers * 6 + remBalls;
                      const runsConceded = s.runsConceded || 0;
                      const wkts = s.wickets || 0;
                      const econ = s.economy ? Number(s.economy).toFixed(2) : (totalBalls > 0 ? ((runsConceded * 6) / totalBalls).toFixed(2) : '-');
                      const bAvg = s.bowlingAverage ? Number(s.bowlingAverage).toFixed(2) : (wkts > 0 && runsConceded > 0 ? (runsConceded / wkts).toFixed(2) : '-');
                      const bSR = s.bowlingStrikeRate ? Number(s.bowlingStrikeRate).toFixed(1) : (wkts > 0 && totalBalls > 0 ? (totalBalls / wkts).toFixed(1) : '-');
                      return (
                        <tr className="hover:bg-white/[0.04]">
                          <td className="py-3 px-3 text-left font-black text-white">WPL</td>
                          <td className="py-3 px-2">{m}</td>
                          <td className="py-3 px-2">{inn}</td>
                          <td className="py-3 px-2">{totalBalls > 0 ? totalBalls : (s.balls || 0)}</td>
                          <td className="py-3 px-2">{runsConceded}</td>
                          <td className="py-3 px-2">{s.maidens || 0}</td>
                          <td className="py-3 px-2 font-black text-teal-400">{wkts}</td>
                          <td className="py-3 px-2 font-bold text-purple-400">{bAvg}</td>
                          <td className="py-3 px-2 font-bold text-amber-400">{econ}</td>
                          <td className="py-3 px-2 font-bold text-rose-400">{bSR}</td>
                          <td className="py-3 px-2">{s.bestBowling || '-/-'}</td>
                          <td className="py-3 px-2">{s.fourWickets || 0}</td>
                          <td className="py-3 px-2">{s.fiveWickets || 0}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FIELDING / KEEPING */}
            {(() => {
              const s = selectedPlayer.stats || ({} as any);
              if (s.catches || s.stumpings) {
                return (
                  <div className="mt-5 p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-6 justify-center text-xs">
                    <span className="text-gray-400">Fielding:</span>
                    <span><strong className="text-white">{s.catches || 0}</strong> Catches</span>
                    <span><strong className="text-white">{s.stumpings || 0}</strong> Stumpings</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
