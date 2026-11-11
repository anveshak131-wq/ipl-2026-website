'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Globe,
  LayoutGrid,
  List,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { hexToRgba, sanitizeNoPinkHex } from '@/lib/teamColors';
import {
  getInitials,
  getPlayerLeagueStats,
  getRoleMeta,
  isOverseasPlayer,
  safeText,
} from './playerHelpers';
import PlayerProfileModal from './PlayerProfileModal';

export interface SquadRosterSectionProps {
  players: any[];
  league: 'ipl' | 'wpl';
  teamName: string;
  teamShortName: string;
  primaryColor?: string;
  secondaryColor?: string;
  captainNameFallback?: string;
  showSpotlight?: boolean;
  keyPlayersConfig?: {
    powerHitterIds?: string[];
    anchorIds?: string[];
    finisherIds?: string[];
    strikeBowlerIds?: string[];
    deathSpecialistIds?: string[];
    allRoundXFactorIds?: string[];
  };
  externalSearchQuery?: string;
  onExternalSearchChange?: (q: string) => void;
}

type RoleFilter = 'all' | 'batter' | 'all-rounder' | 'wicketkeeper' | 'bowler';
type SortOption = 'featured' | 'runs' | 'wickets' | 'matches' | 'name';

export default function SquadRosterSection({
  players,
  league,
  teamName,
  teamShortName,
  primaryColor = '#1D4ED8',
  secondaryColor = '#F59E0B',
  captainNameFallback = '',
  showSpotlight = true,
  keyPlayersConfig,
  externalSearchQuery,
  onExternalSearchChange,
}: SquadRosterSectionProps) {
  const safePrimary = sanitizeNoPinkHex(primaryColor, '#1D4ED8');
  const safeSecondary = sanitizeNoPinkHex(secondaryColor, '#F59E0B');

  const [internalSearch, setInternalSearch] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearch;
  const setSearchQuery = onExternalSearchChange || setInternalSearch;

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [onlyOverseas, setOnlyOverseas] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [spotlightPlayer, setSpotlightPlayer] = useState<any | null>(null);
  const [modalPlayerIndex, setModalPlayerIndex] = useState<number | null>(null);

  const getKeyRoleBadges = (player: any): string[] => {
    if (!keyPlayersConfig || !player?.id) return [];
    const pid = String(player.id);
    const tags: string[] = [];
    if (keyPlayersConfig.powerHitterIds?.includes(pid)) tags.push('Power Hitter');
    if (keyPlayersConfig.anchorIds?.includes(pid)) tags.push('Anchor');
    if (keyPlayersConfig.finisherIds?.includes(pid)) tags.push('Finisher');
    if (keyPlayersConfig.strikeBowlerIds?.includes(pid)) tags.push('Strike Bowler');
    if (keyPlayersConfig.deathSpecialistIds?.includes(pid)) tags.push('Death Specialist');
    if (keyPlayersConfig.allRoundXFactorIds?.includes(pid)) tags.push('X-Factor');
    return tags;
  };

  // Pick initial spotlight (Captain first, then fallback captain name, then first player)
  useEffect(() => {
    if (!players || players.length === 0) {
      setSpotlightPlayer(null);
      return;
    }
    const stillExists =
      spotlightPlayer &&
      players.find(
        (p) =>
          (p.id && p.id === spotlightPlayer.id) ||
          (p.name && spotlightPlayer.name && p.name.toLowerCase() === spotlightPlayer.name.toLowerCase())
      );
    if (stillExists) {
      setSpotlightPlayer(stillExists);
      return;
    }
    const cap =
      players.find((p) => p.isCaptain) ||
      (captainNameFallback
        ? players.find((p) => p.name?.toLowerCase().includes(captainNameFallback.toLowerCase()))
        : undefined);
    setSpotlightPlayer(cap || players[0]);
  }, [players, captainNameFallback]);

  const roleCounts = useMemo(() => {
    const counts = { all: players.length, batter: 0, 'all-rounder': 0, wicketkeeper: 0, bowler: 0 };
    for (const p of players) {
      const cat = getRoleMeta(p.role).category;
      counts[cat] += 1;
    }
    return counts;
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = players.filter((p) => {
      if (roleFilter !== 'all' && getRoleMeta(p.role).category !== roleFilter) return false;
      if (onlyOverseas && !isOverseasPlayer(p.nationality)) return false;
      if (q) {
        const hay = `${p.name || ''} ${p.role || ''} ${p.nationality || ''} ${p.jerseyNumber || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'featured') {
      return [...list].sort((a, b) => {
        if (a.isCaptain && !b.isCaptain) return -1;
        if (!a.isCaptain && b.isCaptain) return 1;
        return 0;
      });
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
      const sa = getPlayerLeagueStats(a, league);
      const sb = getPlayerLeagueStats(b, league);
      if (sortBy === 'runs') return sb.runs - sa.runs;
      if (sortBy === 'wickets') return sb.wickets - sa.wickets;
      return sb.matches - sa.matches;
    });
  }, [players, roleFilter, onlyOverseas, searchQuery, sortBy, league]);

  const activeModalPlayer =
    modalPlayerIndex !== null && modalPlayerIndex >= 0 && modalPlayerIndex < filteredPlayers.length
      ? filteredPlayers[modalPlayerIndex]
      : null;

  const openModalForPlayer = (player: any) => {
    setSpotlightPlayer(player);
    const idx = filteredPlayers.findIndex(
      (p) => (p.id && p.id === player.id) || p.name === player.name
    );
    setModalPlayerIndex(idx >= 0 ? idx : 0);
  };

  const cycleSpotlight = (dir: -1 | 1) => {
    if (!players.length) return;
    const currentIdx = players.findIndex(
      (p) => (p.id && spotlightPlayer?.id && p.id === spotlightPlayer.id) || p.name === spotlightPlayer?.name
    );
    const nextIdx = (Math.max(0, currentIdx) + dir + players.length) % players.length;
    setSpotlightPlayer(players[nextIdx]);
  };

  const roleTabs: { id: RoleFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All Squad', count: roleCounts.all },
    { id: 'batter', label: 'Batters', count: roleCounts.batter },
    { id: 'all-rounder', label: 'All-Rounders', count: roleCounts['all-rounder'] },
    { id: 'wicketkeeper', label: 'WK-Keepers', count: roleCounts.wicketkeeper },
    { id: 'bowler', label: 'Bowlers', count: roleCounts.bowler },
  ];

  const overseasTotal = useMemo(
    () => players.filter((p) => isOverseasPlayer(p.nationality)).length,
    [players]
  );

  return (
    <div className="space-y-8">
      {/* ====================================================================
          FEATURED SPOTLIGHT PANEL (Non-overlapping, smooth spring switcher)
         ==================================================================== */}
      {showSpotlight && spotlightPlayer && (
        <div
          className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-[#0F172A]/95 via-[#0A1022]/95 to-[#060914] p-6 sm:p-8 shadow-2xl"
          style={{
            boxShadow: `0 24px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px ${hexToRgba(safePrimary, 0.25)}`,
          }}
        >
          {/* Ambient radial glow */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] opacity-25 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${safePrimary}, ${safeSecondary})` }}
          />

          <AnimatePresence mode="wait">
            {(() => {
              const hero = spotlightPlayer;
              const stats = getPlayerLeagueStats(hero, league);
              const roleMeta = getRoleMeta(hero.role);
              const overseas = isOverseasPlayer(hero.nationality);
              const initials = getInitials(hero.name);
              const heroKeyTags = getKeyRoleBadges(hero);

              return (
                <motion.div
                  key={String(hero.id || hero.name)}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-7"
                >
                  {/* Left: Identity */}
                  <div className="space-y-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-cyan-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Featured Athlete
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border ${roleMeta.badgeClass}`}>
                        {roleMeta.label}
                      </span>
                      {hero.isCaptain && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm">
                          <Crown className="w-3 h-3" />
                          Captain
                        </span>
                      )}
                      {overseas && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-sky-500/15 border border-sky-400/30 text-sky-300">
                          <Globe className="w-3 h-3" />
                          Overseas
                        </span>
                      )}
                      {heroKeyTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white/[0.06] border border-white/10 text-amber-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div>
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight truncate">
                        {hero.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1.5">
                        {safeText(hero.nationality, 'India')} • {safeText(hero.battingStyle, 'Right-hand bat')}
                        {hero.bowlingStyle && hero.bowlingStyle !== 'None' ? ` • ${hero.bowlingStyle}` : ''}
                        {hero.age ? ` • ${hero.age} yrs` : ''}
                      </p>
                    </div>

                    {/* Action row */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => openModalForPlayer(hero)}
                        className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 hover:brightness-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                      >
                        <span>View Full Profile</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {players.length > 1 && (
                        <div className="inline-flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => cycleSpotlight(-1)}
                            aria-label="Previous featured athlete"
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="px-2 text-[11px] font-bold text-slate-400">
                            Browse Squad
                          </span>
                          <button
                            type="button"
                            onClick={() => cycleSpotlight(1)}
                            aria-label="Next featured athlete"
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Crest & Telemetry Grid */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 shrink-0">
                    <div
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 flex items-center justify-center shadow-xl"
                      style={{
                        borderColor: hexToRgba(safeSecondary, 0.5),
                        background: `linear-gradient(145deg, ${hexToRgba(safePrimary, 0.3)}, #050814)`,
                      }}
                    >
                      {hero.image ? (
                        <img
                          src={hero.image}
                          alt={hero.name}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="text-center">
                          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            {initials}
                          </span>
                          <span className="block text-[10px] font-bold text-cyan-300 uppercase tracking-widest mt-1">
                            {roleMeta.short}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 min-w-[230px]">
                      <div className="p-3 rounded-2xl bg-black/45 border border-white/10">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                          Runs
                        </span>
                        <span className="text-2xl font-black text-white tabular-nums mt-0.5 block">
                          {stats.runs}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/45 border border-white/10">
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider block">
                          Wickets
                        </span>
                        <span className="text-2xl font-black text-white tabular-nums mt-0.5 block">
                          {stats.wickets}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/45 border border-white/10">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                          {roleMeta.category === 'bowler' ? 'Economy' : 'Strike Rate'}
                        </span>
                        <span className="text-xl font-black text-white tabular-nums mt-0.5 block">
                          {roleMeta.category === 'bowler' ? stats.economy : stats.strikeRate}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/45 border border-white/10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          Caps
                        </span>
                        <span className="text-xl font-black text-white tabular-nums mt-0.5 block">
                          {stats.matches || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      )}

      {/* ====================================================================
          COMMAND BAR: Role Filters, Search, Sort & Layout Switch
         ==================================================================== */}
      <div className="rounded-2xl border border-white/10 bg-[#0A0F1F]/90 backdrop-blur-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Role Filter Pills with Spring Motion */}
          <div className="flex flex-wrap items-center gap-1.5">
            {roleTabs.map((tab) => {
              const isActive = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoleFilter(tab.id)}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors ${
                    isActive ? 'text-slate-950' : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId={`squad-role-pill-${league}-${teamShortName}`}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-300 shadow-lg shadow-amber-500/20"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        isActive ? 'bg-slate-950/15 text-slate-950' : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Search + Overseas + Sort + Grid/Table */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search athlete, nation..."
                className="w-full sm:w-52 pl-9 pr-8 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {overseasTotal > 0 && (
              <button
                type="button"
                onClick={() => setOnlyOverseas((v) => !v)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 transition-all ${
                  onlyOverseas
                    ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                    : 'bg-black/35 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Overseas ({overseasTotal})</span>
              </button>
            )}

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/35 border border-white/10 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort players"
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="featured" className="bg-[#0A0F1F]">Sort: Squad Order</option>
                <option value="runs" className="bg-[#0A0F1F]">Sort: Most Runs</option>
                <option value="wickets" className="bg-[#0A0F1F]">Sort: Most Wickets</option>
                <option value="matches" className="bg-[#0A0F1F]">Sort: Most Matches</option>
                <option value="name" className="bg-[#0A0F1F]">Sort: A–Z</option>
              </select>
            </div>

            <div className="inline-flex items-center p-1 rounded-xl bg-black/40 border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Card grid view"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white/15 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="Statistics table view"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white/15 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-2 border-t border-white/[0.06]">
          <span>
            Showing <strong className="text-white">{filteredPlayers.length}</strong> of{' '}
            <strong className="text-white">{players.length}</strong> Official Squad Athletes
          </span>
          <span className="hidden sm:inline text-slate-500">
            Select any athlete for multi-format statistics
          </span>
        </div>
      </div>

      {/* ====================================================================
          EMPTY STATE
         ==================================================================== */}
      {filteredPlayers.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-3xl bg-[#0A0F1F]/70 border border-white/10">
          <User className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-200">No players match your active filters</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setOnlyOverseas(false);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-105 transition-all"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ==================================================================
           GRID VIEW — Clean, Non-Colliding Asymmetric Player Panels
           ================================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlayers.map((player, idx) => {
            const roleMeta = getRoleMeta(player.role);
            const stats = getPlayerLeagueStats(player, league);
            const overseas = isOverseasPlayer(player.nationality);
            const initials = getInitials(player.name);
            const keyTags = getKeyRoleBadges(player);
            const isSpotlighted =
              spotlightPlayer &&
              ((spotlightPlayer.id && spotlightPlayer.id === player.id) ||
                spotlightPlayer.name === player.name);

            const fee =
              player.auction?.fee &&
              (typeof player.auction.fee === 'string' || typeof player.auction.fee === 'number')
                ? String(player.auction.fee)
                : null;

            // Role-smart 3 metrics
            const statTriplet =
              roleMeta.category === 'bowler'
                ? [
                    { label: 'Caps', value: stats.matches || 0, colorClass: 'text-white' },
                    { label: 'Wkts', value: stats.wickets, colorClass: 'text-cyan-400' },
                    { label: 'Econ', value: stats.economy, colorClass: 'text-emerald-400' },
                  ]
                : roleMeta.category === 'all-rounder'
                ? [
                    { label: 'Runs', value: stats.runs, colorClass: 'text-amber-300' },
                    { label: 'Wkts', value: stats.wickets, colorClass: 'text-cyan-400' },
                    { label: 'Caps', value: stats.matches || 0, colorClass: 'text-white' },
                  ]
                : [
                    { label: 'Caps', value: stats.matches || 0, colorClass: 'text-white' },
                    { label: 'Runs', value: stats.runs, colorClass: 'text-amber-300' },
                    { label: 'SR', value: stats.strikeRate, colorClass: 'text-emerald-400' },
                  ];

            return (
              <motion.article
                key={String(player.id || player.name || idx)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.025, 0.2) }}
                whileHover={{ y: -4 }}
                onClick={() => openModalForPlayer(player)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 cursor-pointer transition-colors duration-200 bg-[#0B1021]/95 hover:bg-[#101730] ${
                  isSpotlighted
                    ? 'border-cyan-400/70 ring-1 ring-cyan-400/40 shadow-xl shadow-cyan-950/30'
                    : 'border-white/10 hover:border-white/25 shadow-lg shadow-black/40'
                }`}
              >
                {/* Crisp Top Gradient Accent Line */}
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${roleMeta.topBarClass} opacity-80`} />

                <div className="space-y-4">
                  {/* Top Badge Bar (Clean Flex Wrap - Zero Overlap) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${roleMeta.badgeClass}`}>
                      {roleMeta.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {player.isCaptain && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase">
                          <Crown className="w-2.5 h-2.5" />
                          Cap
                        </span>
                      )}
                      {overseas && (
                        <span
                          title={String(player.nationality || 'Overseas')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[10px] font-bold uppercase"
                        >
                          <Globe className="w-2.5 h-2.5" />
                          Intl
                        </span>
                      )}
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {player.jerseyNumber && Number(player.jerseyNumber) > 0
                          ? `#${player.jerseyNumber}`
                          : `#${String(idx + 1).padStart(2, '0')}`}
                      </span>
                    </div>
                  </div>

                  {/* Identity Row */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center font-black text-base text-white border overflow-hidden shadow-inner transition-colors"
                      style={{
                        borderColor: isSpotlighted ? '#22D3EE' : hexToRgba(safePrimary, 0.35),
                        background: `linear-gradient(145deg, ${hexToRgba(safePrimary, 0.25)}, #060914)`,
                      }}
                    >
                      {player.image ? (
                        <img
                          src={player.image}
                          alt={player.name}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-base text-white truncate group-hover:text-amber-300 transition-colors">
                        {player.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {safeText(player.nationality, 'India')} • {safeText(player.battingStyle, 'Right-hand bat')}
                      </p>
                      {player.bowlingStyle && player.bowlingStyle !== 'None' && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {player.bowlingStyle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Optional Key Role Tags */}
                  {keyTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {keyTags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] font-bold text-cyan-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Balanced 3-Stat Telemetry Strip */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/45 border border-white/[0.06] text-center tabular-nums">
                    {statTriplet.map((st) => (
                      <div key={st.label}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {st.label}
                        </span>
                        <span className={`text-sm font-black mt-0.5 block ${st.colorClass}`}>
                          {st.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="mt-4 pt-3 border-t border-white/[0.07] flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 font-medium truncate">
                    {fee ? (
                      <>
                        Fee: <strong className="text-emerald-400">{fee}</strong>
                      </>
                    ) : (
                      <>
                        Best: <strong className="text-slate-200">{stats.highest !== '—' ? stats.highest : stats.bestBowling}</strong>
                      </>
                    )}
                  </span>

                  <span className="inline-flex items-center gap-1 font-extrabold text-cyan-300 group-hover:text-amber-300 transition-colors shrink-0">
                    <span>Player Profile</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        /* ==================================================================
           PRO TABLE VIEW
           ================================================================== */
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1021]/95 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums min-w-[760px]">
              <thead className="bg-white/[0.04] border-b border-white/10 text-[10px] uppercase font-black tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Athlete</th>
                  <th className="py-3.5 px-3">Role</th>
                  <th className="py-3.5 px-3">Nation</th>
                  <th className="py-3.5 px-2 text-center">Caps</th>
                  <th className="py-3.5 px-2 text-center text-amber-300">Runs</th>
                  <th className="py-3.5 px-2 text-center">Avg</th>
                  <th className="py-3.5 px-2 text-center">SR</th>
                  <th className="py-3.5 px-2 text-center text-cyan-300">Wkts</th>
                  <th className="py-3.5 px-2 text-center">Econ</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-200">
                {filteredPlayers.map((player, idx) => {
                  const roleMeta = getRoleMeta(player.role);
                  const stats = getPlayerLeagueStats(player, league);
                  const overseas = isOverseasPlayer(player.nationality);

                  return (
                    <tr
                      key={String(player.id || player.name || idx)}
                      onClick={() => openModalForPlayer(player)}
                      className="hover:bg-white/[0.04] cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                        <span className="text-[11px] font-mono text-slate-500 w-7">
                          {player.jerseyNumber && Number(player.jerseyNumber) > 0
                            ? `#${player.jerseyNumber}`
                            : `${idx + 1}.`}
                        </span>
                        <span className="group-hover:text-amber-300 transition-colors">
                          {player.name}
                        </span>
                        {player.isCaptain && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleMeta.badgeClass}`}>
                          {roleMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          {overseas && <Globe className="w-3 h-3 text-sky-400" />}
                          {safeText(player.nationality, 'India')}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center">{stats.matches || '—'}</td>
                      <td className="py-3.5 px-2 text-center font-black text-amber-300">{stats.runs}</td>
                      <td className="py-3.5 px-2 text-center">{stats.average}</td>
                      <td className="py-3.5 px-2 text-center">{stats.strikeRate}</td>
                      <td className="py-3.5 px-2 text-center font-black text-cyan-300">{stats.wickets}</td>
                      <td className="py-3.5 px-2 text-center">{stats.economy}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-cyan-300 group-hover:text-amber-300">
                        Profile →
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          NEUTRAL ATHLETE PROFILE MODAL
         ==================================================================== */}
      <PlayerProfileModal
        player={activeModalPlayer}
        isOpen={Boolean(activeModalPlayer)}
        onClose={() => setModalPlayerIndex(null)}
        league={league}
        teamName={teamName}
        teamShortName={teamShortName}
        primaryColor={safePrimary}
        secondaryColor={safeSecondary}
        roleBadges={activeModalPlayer ? getKeyRoleBadges(activeModalPlayer) : []}
        hasPrev={modalPlayerIndex !== null && modalPlayerIndex > 0}
        hasNext={modalPlayerIndex !== null && modalPlayerIndex < filteredPlayers.length - 1}
        onPrev={() =>
          setModalPlayerIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))
        }
        onNext={() =>
          setModalPlayerIndex((prev) =>
            prev !== null && prev < filteredPlayers.length - 1 ? prev + 1 : prev
          )
        }
      />
    </div>
  );
}
