'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  FileSpreadsheet,
  History,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  CanonicalWplCode,
  cleanTeamDisplayName,
  computeInningsSummary,
  filterAndSortPublishedWplScorecards,
  filterScorecards,
  formatIndianDate,
  getTeamLogoUrl,
  getTeamVisualTheme,
  normalizeWplTeamCode,
  partitionScorecardsBySeason,
  WPL_FRANCHISE_THEMES,
  WplScorecard,
} from '@/lib/wpl/scorecardHelpers';
import WplScorecardViewer from '@/components/wpl/WplScorecardViewer';
import WplScorecardStandbyBanner from '@/components/wpl/WplScorecardStandbyBanner';

const TEAM_FILTERS: Array<{ id: CanonicalWplCode | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All Teams' },
  { id: 'RCB-W', label: 'RCB-W' },
  { id: 'MI-W', label: 'MI-W' },
  { id: 'DC-W', label: 'DC-W' },
  { id: 'GG', label: 'GG' },
  { id: 'UPW', label: 'UPW' },
];

function WplScorecardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMatchId = searchParams.get('matchId');
  const requestedSeason = searchParams.get('season');
  const { currentLeague, setCurrentLeague } = useLeague();

  const [selectedSeason, setSelectedSeason] = useState<2027 | 2026>(
    requestedSeason === '2026' ? 2026 : 2027
  );
  const [scorecards, setScorecards] = useState<WplScorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<CanonicalWplCode | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  useEffect(() => {
    if (currentLeague !== 'wpl') {
      setCurrentLeague('wpl');
    }
  }, [currentLeague, setCurrentLeague]);

  const loadScorecards = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = isManualRefresh ? '/api/scorecards?league=wpl&nocache=1' : '/api/scorecards?league=wpl';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Unable to load scorecards (${res.status})`);
      }
      const raw = await res.json();
      const items: WplScorecard[] = Array.isArray(raw) ? raw : [];
      const published = filterAndSortPublishedWplScorecards(items);
      setScorecards(published);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load WPL scorecards');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadScorecards(false);
  }, [loadScorecards]);

  const { season2027, season2026 } = useMemo(
    () => partitionScorecardsBySeason(scorecards),
    [scorecards]
  );

  // If deep-linked via ?matchId=... to a 2026 scorecard, honor it cleanly
  useEffect(() => {
    if (!requestedMatchId || scorecards.length === 0) return;
    const in2027 = season2027.some(
      (sc) => String(sc.matchId) === String(requestedMatchId) || String(sc.id) === String(requestedMatchId)
    );
    const in2026 = season2026.some(
      (sc) => String(sc.matchId) === String(requestedMatchId) || String(sc.id) === String(requestedMatchId)
    );
    if (!in2027 && in2026 && requestedSeason !== '2027') {
      setSelectedSeason(2026);
    }
  }, [requestedMatchId, requestedSeason, scorecards.length, season2027, season2026]);

  const activeSeasonScorecards = useMemo(
    () => (selectedSeason === 2027 ? season2027 : season2026),
    [selectedSeason, season2027, season2026]
  );

  const isPreSeasonStandby = !loading && !error && selectedSeason === 2027 && season2027.length === 0;

  const filteredScorecards = useMemo(
    () => filterScorecards(activeSeasonScorecards, teamFilter, searchQuery),
    [activeSeasonScorecards, teamFilter, searchQuery]
  );

  // Sync selected match from query param or default to the first visible scorecard in active season
  useEffect(() => {
    if (activeSeasonScorecards.length === 0) {
      setSelectedMatchId('');
      return;
    }

    if (requestedMatchId) {
      const matchByQuery = activeSeasonScorecards.find(
        (sc) => String(sc.matchId) === String(requestedMatchId) || String(sc.id) === String(requestedMatchId)
      );
      if (matchByQuery) {
        setSelectedMatchId(matchByQuery.matchId);
        return;
      }
    }

    if (filteredScorecards.length > 0) {
      const stillVisible = filteredScorecards.some((sc) => sc.matchId === selectedMatchId);
      if (!stillVisible || !selectedMatchId) {
        setSelectedMatchId(filteredScorecards[0].matchId);
      }
    }
  }, [activeSeasonScorecards, filteredScorecards, requestedMatchId, selectedMatchId]);

  const activeScorecard = useMemo(() => {
    if (activeSeasonScorecards.length === 0) return null;
    return (
      filteredScorecards.find((sc) => sc.matchId === selectedMatchId) ||
      activeSeasonScorecards.find((sc) => sc.matchId === selectedMatchId) ||
      filteredScorecards[0] ||
      activeSeasonScorecards[0] ||
      null
    );
  }, [filteredScorecards, activeSeasonScorecards, selectedMatchId]);

  const handleSeasonChange = (season: 2027 | 2026) => {
    setSelectedSeason(season);
    setTeamFilter('ALL');
    setSearchQuery('');
    setSelectedMatchId('');
    if (season === 2027) {
      router.replace('/wpl/scorecard', { scroll: false });
    } else {
      router.replace('/wpl/scorecard?season=2026', { scroll: false });
    }
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    const seasonParam = selectedSeason === 2026 ? '&season=2026' : '';
    router.replace(`/wpl/scorecard?matchId=${encodeURIComponent(matchId)}${seasonParam}`, {
      scroll: false,
    });
  };

  return (
    <div className="min-h-screen bg-[#060A17] text-white flex flex-col">
      <Navbar />

      {/* Subtle Stadium Ambient Backdrop (indigo / emerald / amber accents) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[540px] h-[540px] rounded-full bg-indigo-600/10 blur-[130px]" />
        <div className="absolute top-1/3 right-1/5 w-[440px] h-[440px] rounded-full bg-amber-500/8 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 w-[480px] h-[480px] rounded-full bg-sky-500/8 blur-[140px]" />
      </div>

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        {/* Top Breadcrumb + Utility Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/wpl"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span>Back to WPL Hub</span>
          </Link>

          <button
            type="button"
            onClick={() => loadScorecards(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-white transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Scorecards'}</span>
          </button>
        </div>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#0D1429]/95 via-[#090E1E]/95 to-[#0C1224]/95 p-6 sm:p-8 shadow-2xl"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-xs font-black uppercase tracking-[0.16em]">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {selectedSeason === 2027 ? 'WPL 2027 • Official Scorecards' : 'WPL 2026 Archive'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
                WPL Match Scorecards
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mt-2">
                {selectedSeason === 2027 && season2027.length === 0
                  ? 'WPL 2027 opens on 14 January 2027. Full 2027 batting cards, bowling figures, fall of wickets, and partnerships will go live here once the tournament begins.'
                  : 'Full innings batting cards, bowling figures, fall of wickets, partnerships, and official match summaries published directly from WPL match records.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedSeason === 2027 && season2027.length === 0 ? 'Kickoff' : 'Published'}
                </div>
                <div className="text-2xl font-black text-amber-300 tabular-nums mt-0.5">
                  {selectedSeason === 2027 && season2027.length === 0
                    ? '14 Jan'
                    : activeSeasonScorecards.length}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedSeason === 2027 && season2027.length === 0 ? '2027 Season' : 'Scorecards'}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedSeason === 2027 ? 'Fixtures' : 'Franchises'}
                </div>
                <div className="text-2xl font-black text-sky-300 tabular-nums mt-0.5">
                  {selectedSeason === 2027 ? 22 : 5}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedSeason === 2027 ? 'Scheduled' : 'WPL Teams'}
                </div>
              </div>
            </div>
          </div>

          {/* Season Switcher */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex p-1 rounded-xl bg-white/[0.05] border border-white/10">
              <button
                type="button"
                onClick={() => handleSeasonChange(2027)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all ${
                  selectedSeason === 2027
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>2027 Season</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                    selectedSeason === 2027
                      ? 'bg-slate-950/15 text-slate-950'
                      : 'bg-sky-500/20 text-sky-200'
                  }`}
                >
                  {season2027.length > 0 ? `${season2027.length} Live` : 'Upcoming'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSeasonChange(2026)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all ${
                  selectedSeason === 2026
                    ? 'bg-white/20 text-white shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <History className="w-3.5 h-3.5 text-amber-300" />
                <span>2026 Archive</span>
                {season2026.length > 0 && (
                  <span className="text-[10px] opacity-80 tabular-nums">({season2026.length})</span>
                )}
              </button>
            </div>

            {selectedSeason === 2026 && (
              <div className="inline-flex items-center gap-2 text-xs text-amber-200">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Archived WPL 2026 matches (Jan 2026)</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Filter & Search Bar (hidden when 2027 pre-season standby banner is active) */}
        {!isPreSeasonStandby && !loading && !error && (
        <div className="rounded-2xl border border-white/10 bg-[#0A1021]/90 p-4 backdrop-blur-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Team Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {TEAM_FILTERS.map((tf) => {
                const isActive = teamFilter === tf.id;
                const theme = tf.id !== 'ALL' ? WPL_FRANCHISE_THEMES[tf.id] : null;
                return (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setTeamFilter(tf.id)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg'
                        : 'bg-white/[0.05] text-slate-200 border-white/10 hover:bg-white/[0.1]'
                    }`}
                  >
                    {theme && (
                      <img src={theme.logo} alt={tf.label} className="w-4 h-4 object-contain" />
                    )}
                    <span>{tf.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team, player, venue..."
                aria-label="Search scorecards"
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Match Selector Strip */}
          {!loading && filteredScorecards.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
                <span className="font-bold uppercase tracking-wider text-slate-300">
                  Select Match Scorecard ({filteredScorecards.length})
                </span>
                <span className="hidden sm:inline">Scroll horizontally to browse fixtures</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {filteredScorecards.map((sc) => {
                  const isSelected = activeScorecard?.matchId === sc.matchId;
                  const t1 = sc.matchInfo.team1;
                  const t2 = sc.matchInfo.team2;
                  const t1Code = normalizeWplTeamCode(t1) || t1.shortName || 'T1';
                  const t2Code = normalizeWplTeamCode(t2) || t2.shortName || 'T2';
                  const t1Theme = getTeamVisualTheme(t1);
                  const dateFmt = formatIndianDate(sc.matchInfo.date);

                  const findScore = (teamId: string | number) => {
                    const matched = (sc.innings || []).find(
                      (i) => String(i.battingTeamId).trim() === String(teamId).trim()
                    );
                    if (!matched) return '—';
                    const sum = computeInningsSummary(matched);
                    return `${sum.totalRuns}/${sum.totalWickets}`;
                  };

                  return (
                    <button
                      key={sc.id || sc.matchId}
                      type="button"
                      onClick={() => handleSelectMatch(sc.matchId)}
                      className={`snap-start shrink-0 w-64 text-left rounded-2xl p-3.5 border transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-indigo-900/75 via-slate-900/95 to-slate-950 border-amber-400/70 shadow-lg'
                          : 'bg-slate-950/75 border-white/10 hover:border-white/25 hover:bg-slate-900/80'
                      }`}
                      style={isSelected ? { boxShadow: `0 0 24px ${t1Theme.glowColor}` } : undefined}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-2">
                        <span
                          className={`px-2 py-0.5 rounded font-black ${
                            isSelected ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-200'
                          }`}
                        >
                          Match {sc.matchId}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {dateFmt.readable}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-white">
                            <img src={getTeamLogoUrl(t1)} alt={t1Code} className="w-4 h-4 object-contain" />
                            {t1Code}
                          </span>
                          <span className="font-black text-slate-100 tabular-nums">{findScore(t1.id)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-white">
                            <img src={getTeamLogoUrl(t2)} alt={t2Code} className="w-4 h-4 object-contain" />
                            {t2Code}
                          </span>
                          <span className="font-black text-slate-100 tabular-nums">{findScore(t2.id)}</span>
                        </div>
                      </div>

                      {sc.result?.winner && (
                        <div className="mt-2.5 pt-2 border-t border-white/[0.08] text-[11px] text-emerald-300 font-semibold truncate">
                          {cleanTeamDisplayName(sc.result.winner)} won by {sc.result.margin}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Main Viewer / Pre-Season Banner / Loading / Error / Empty States */}
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[#0B1020]/90 p-10 text-center space-y-3">
            <div className="w-9 h-9 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-300">Loading official WPL scorecards...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center space-y-3">
            <p className="text-sm font-bold text-red-200">{error}</p>
            <button
              type="button"
              onClick={() => loadScorecards(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black"
            >
              Try Again
            </button>
          </div>
        ) : isPreSeasonStandby ? (
          <WplScorecardStandbyBanner
            archiveCount={season2026.length}
            onOpenArchive={() => handleSeasonChange(2026)}
          />
        ) : activeScorecard ? (
          <WplScorecardViewer scorecard={activeScorecard} />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-[#0B1020]/90 p-10 text-center space-y-3">
            <Trophy className="w-9 h-9 text-amber-300 mx-auto opacity-80" />
            <h2 className="text-lg font-black text-white">No Scorecards Match Your Filter</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              {scorecards.length === 0
                ? 'Official published WPL match scorecards will appear here as soon as they are published.'
                : 'Clear your team filter or search query to view all available published WPL scorecards.'}
            </p>
            {(teamFilter !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setTeamFilter('ALL');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        )}
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

export default function WplScorecardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060A17] flex items-center justify-center text-white text-sm font-bold">
          Loading WPL Scorecards...
        </div>
      }
    >
      <WplScorecardPageContent />
    </Suspense>
  );
}
