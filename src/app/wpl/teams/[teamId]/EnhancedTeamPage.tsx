'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  MapPin, 
  Users, 
  Shield, 
  Flame, 
  ArrowLeft, 
  Search, 
  Sparkles, 
  Calendar,
  ChevronRight,
  Target,
  Zap,
  Star,
  Award,
  ExternalLink
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/data';
import type { Team, Player, Match } from '@/types';

// Franchise Theme Configurations (Colors, Accents & Glows)
interface TeamTheme {
  primary: string;
  secondary: string;
  glow: string;
  gradient: string;
  borderGlow: string;
}

const TEAM_THEMES: Record<string, TeamTheme> = {
  'rcb': {
    primary: '#E01E37',
    secondary: '#FFB703',
    glow: 'rgba(224, 30, 55, 0.35)',
    gradient: 'from-[#42040c] via-[#12080a] to-[#05070f]',
    borderGlow: 'hover:border-red-500/50'
  },
  'mi': {
    primary: '#004BA0',
    secondary: '#D1AB3E',
    glow: 'rgba(0, 75, 160, 0.35)',
    gradient: 'from-[#031d44] via-[#050e1f] to-[#05070f]',
    borderGlow: 'hover:border-blue-500/50'
  },
  'dc': {
    primary: '#0047AB',
    secondary: '#DC143C',
    glow: 'rgba(220, 20, 60, 0.35)',
    gradient: 'from-[#170a2c] via-[#0b0c1c] to-[#05070f]',
    borderGlow: 'hover:border-indigo-500/50'
  },
  'gg': {
    primary: '#F36F21',
    secondary: '#00A896',
    glow: 'rgba(243, 111, 33, 0.35)',
    gradient: 'from-[#3a1a05] via-[#170e0a] to-[#05070f]',
    borderGlow: 'hover:border-orange-500/50'
  },
  'upw': {
    primary: '#6A1B9A',
    secondary: '#FFD600',
    glow: 'rgba(106, 27, 154, 0.35)',
    gradient: 'from-[#2e0854] via-[#130624] to-[#05070f]',
    borderGlow: 'hover:border-purple-500/50'
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
    glow: 'rgba(236, 72, 153, 0.35)',
    gradient: 'from-[#2c0827] via-[#120718] to-[#05070f]',
    borderGlow: 'hover:border-pink-500/50'
  };
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

export default function EnhancedWPLTeamPage({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'batsman' | 'all-rounder' | 'bowler' | 'wicketkeeper'>('all');
  const [activeTab, setActiveTab] = useState<'squad' | 'fixtures'>('squad');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [teamsData, playersData, matchesData] = await Promise.all([
          api.getTeams('wpl').catch(() => []),
          api.getPlayers(undefined, 'wpl').catch(() => []),
          api.getMatches('wpl').catch(() => [])
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

          const teamMatches = matchesData.filter((m: Match) => {
            const t1 = typeof m.team1 === 'object' ? String((m.team1 as any)?.id) : String(m.team1 || '');
            const t2 = typeof m.team2 === 'object' ? String((m.team2 as any)?.id) : String(m.team2 || '');
            return fullVariants.some(v => v === t1.toLowerCase() || v === t2.toLowerCase());
          });
          setMatches(teamMatches);
        }
      } catch (e) {
        console.error('WPL Team load error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [teamId]);

  const theme = useMemo(() => getTeamTheme(team?.shortName, team?.name), [team]);

  const filteredSquad = useMemo(() => {
    return players.filter(p => {
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
  }, [players, searchQuery, selectedRole]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070f] text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-pink-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="mt-6 text-sm font-semibold tracking-wider uppercase text-gray-400">
            Calibrating Franchise Telemetry...
          </p>
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
          <p className="mt-2 text-sm text-gray-400">We could not match this team identifier to the 2027 roster records.</p>
          <Link
            href="/wpl/teams"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all shadow-lg shadow-pink-600/30"
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
        {/* Dynamic Ambient Glow Field */}
        <div 
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[140px] opacity-25"
          style={{ background: `radial-gradient(circle, ${theme.primary}, ${theme.secondary}, transparent 70%)` }}
        />

        {/* Stadium Topographic Grid Texture */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Top Breadcrumb & Quick Franchise Switcher */}
        <div className="relative z-10 border-b border-white/[0.08] bg-black/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Link href="/wpl" className="hover:text-white transition-colors">WPL</Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <Link href="/wpl/teams" className="hover:text-white transition-colors">Franchises</Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-pink-400 font-bold">{team.shortName || team.name}</span>
            </div>

            {/* Quick Switch Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1.5 hidden sm:inline">
                Jump to:
              </span>
              {allTeams.map((t) => {
                const isCurrent = t.id === team.id || t.shortName === team.shortName;
                const tTheme = getTeamTheme(t.shortName, t.name);
                return (
                  <Link
                    key={t.id}
                    href={`/wpl/teams/${(t.shortName || t.id).toLowerCase()}`}
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                        : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-transparent'
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
        <section className={`relative pt-12 pb-16 border-b border-white/[0.08] bg-gradient-to-b ${theme.gradient}`}>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_320px] gap-8 items-center">
              
              {/* Franchise Crest with Glow Ring */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center"
              >
                <div 
                  className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-3xl p-6 flex items-center justify-center bg-black/60 border border-white/15 backdrop-blur-2xl shadow-2xl group"
                  style={{
                    boxShadow: `0 20px 60px -15px ${theme.glow}`,
                  }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <Shield className="w-24 h-24 text-white/50" />
                  )}
                  <div 
                    className="absolute -bottom-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-950 shadow-md"
                    style={{ backgroundColor: theme.secondary }}
                  >
                    Official Squad
                  </div>
                </div>
              </motion.div>

              {/* Franchise Title & Identity */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-4 text-center lg:text-left"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-xl">
                  <Flame className="w-3.5 h-3.5" style={{ color: theme.secondary }} />
                  <span>Women's Premier League • 2027 Roster</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
                  {team.name}
                </h1>

                <p className="text-gray-300 text-sm sm:text-base max-w-xl leading-relaxed mx-auto lg:mx-0">
                  {team.description || `${team.name} squad, confirmed retentions, and team statistics gearing up for the 2027 championship title race.`}
                </p>

                {/* Badges & Meta Info */}
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
                      <span>Head Coach: <strong className="text-white">{team.coach}</strong></span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Vital Stat Metric Cards */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Total Squad</span>
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-3xl font-black text-white">{players.length}</span>
                  <span className="block text-[11px] text-gray-400 mt-0.5">Players on Deck</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Season</span>
                    <Calendar className="w-4 h-4 text-pink-400" />
                  </div>
                  <span className="text-2xl font-black text-white">2027</span>
                  <span className="block text-[11px] text-pink-400 font-bold mt-1">Jan 9 – Feb 5</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl col-span-2">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Trophies & Titles</span>
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-black text-amber-300">
                      {team.shortName?.toLowerCase() === 'rcb-w' || team.shortName?.toLowerCase() === 'rcb' ? '1 WPL Championship (2026)' :
                       team.shortName?.toLowerCase() === 'mi-w' || team.shortName?.toLowerCase() === 'mi' ? '1 WPL Championship (2023)' :
                       'Chasing 2027 Glory'}
                    </span>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Tab Navigation & Squad Filter Bar */}
        <section className="sticky top-16 z-30 bg-[#05070f]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* View Tab Buttons */}
            <div className="inline-flex p-1 rounded-xl bg-white/[0.06] border border-white/10 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('squad')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'squad'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>2027 Squad Roster ({players.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('fixtures')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'fixtures'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Fixtures & Results ({matches.length})</span>
              </button>
            </div>

            {/* Live Search & Role Selector */}
            {activeTab === 'squad' && (
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search player name..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>

                {/* Role Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {(['all', 'batsman', 'all-rounder', 'bowler', 'wicketkeeper'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all shrink-0 ${
                        selectedRole === r
                          ? 'bg-white text-slate-950 font-black shadow-md'
                          : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      {r === 'all' ? 'All Roles' : r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Squad Grid Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          {activeTab === 'squad' ? (
            <div>
              {filteredSquad.length === 0 ? (
                <div className="text-center py-28 rounded-3xl border border-white/10 bg-white/[0.02]">
                  <Users className="w-14 h-14 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-bold text-white">No players found</h3>
                  <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                    No roster entries match your current search and role filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedRole('all'); }}
                    className="mt-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
                  >
                    Reset Roster Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredSquad.map((player, idx) => {
                    const runs = player.stats?.runs ?? (player as any).runs ?? 0;
                    const wickets = player.stats?.wickets ?? (player as any).wickets ?? 0;
                    const matchesCount = player.stats?.matches ?? (player as any).matches ?? 0;
                    const sr = player.stats?.strikeRate ?? (player as any).strikeRate ?? '-';

                    return (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.4) }}
                        className={`group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${theme.borderGlow}`}
                      >
                        {/* Player Frame / Silhouette */}
                        <div className="relative h-48 w-full rounded-xl bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end justify-center overflow-hidden mb-4 border border-white/5">
                          {player.image ? (
                            <img
                              src={player.image}
                              alt={player.name}
                              className="max-h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <Users className="w-16 h-16 text-white/20 mb-8" />
                          )}

                          {/* Country Badge */}
                          {player.country && (
                            <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 text-gray-200 border border-white/10 backdrop-blur-md">
                              {player.country}
                            </span>
                          )}

                          {/* Captain / Wicketkeeper Indicator */}
                          {player.isCaptain && (
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                              Captain
                            </span>
                          )}
                        </div>

                        {/* Player Meta Details */}
                        <div className="space-y-1">
                          <span 
                            className="inline-block text-[11px] font-black uppercase tracking-widest"
                            style={{ color: theme.secondary }}
                          >
                            {player.role || 'Cricket Professional'}
                          </span>
                          <h4 className="text-base font-extrabold text-white group-hover:text-pink-300 transition-colors line-clamp-1">
                            {player.name}
                          </h4>
                          <p className="text-[11px] text-gray-400 line-clamp-1">
                            {player.battingStyle || player.bowlingStyle || 'Franchise Roster'}
                          </p>
                        </div>

                        {/* Stats Dashboard Grid */}
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
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
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Fixtures & Results Tab */
            <div className="space-y-4 max-w-4xl mx-auto">
              {matches.length === 0 ? (
                <div className="text-center py-28 rounded-3xl border border-white/10 bg-white/[0.02]">
                  <Calendar className="w-14 h-14 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-bold text-white">2027 Fixture Grid Pending</h3>
                  <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                    The BCCI schedule for the confirmed 28-day championship window (Jan 9 – Feb 5, 2027) will sync automatically here once released.
                  </p>
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
                        className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/[0.03] gap-4 hover:border-white/20 transition-all backdrop-blur-xl"
                      >
                        <div className="space-y-1 text-center sm:text-left">
                          <div className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                            {m.venue || 'Venue TBA'} • {new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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

      <Footer />
    </div>
  );
}
