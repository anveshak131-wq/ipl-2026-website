'use client';

import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MatchCard from '@/components/matches/MatchCard';
import PublicPlayoffOverview from '@/components/matches/PublicPlayoffOverview';
import Ipl2027SeasonStandby from '@/components/matches/Ipl2027SeasonStandby';
import { Match, Team } from '@/types';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getMatchNumberDisplay } from '@/lib/matchNumberUtils';
import { exportToICal, type CalendarEvent } from '@/lib/admin/exportUtils';
import {
  Calendar,
  History,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Download,
  Trophy,
  Zap,
  Flame,
  Layers,
} from 'lucide-react';

type MatchesViewMode = '2027_kickoff' | '2026_fixtures' | 'playoffs';

export default function MatchesPage() {
  const MATCH_DURATION_MINUTES = 240;

  const { currentLeague, setCurrentLeague } = useLeague();
  const [viewMode, setViewMode] = useState<MatchesViewMode>('2027_kickoff');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed' | 'playoffs'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getMatchYear = (dateString: string): number | null => {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) return parsed.getFullYear();
    const match = dateString.match(/(20\d{2}|19\d{2})/);
    return match ? parseInt(match[1], 10) : null;
  };

  const parseTimeTo24Hour = (timeString: string): { hours: number; minutes: number } | null => {
    const clean = timeString.trim();

    // Supports 24h format: "19:30"
    const hhmmMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmmMatch) {
      const hours = parseInt(hhmmMatch[1], 10);
      const minutes = parseInt(hhmmMatch[2], 10);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return { hours, minutes };
      }
    }

    // Supports 12h format: "7:30 PM"
    const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const meridiem = ampmMatch[3].toUpperCase();

      if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;

      return { hours, minutes };
    }

    return null;
  };

  const getMatchStartDateUTC = (dateString: string, timeString: string): Date | null => {
    try {
      const [yearStr, monthStr, dayStr] = dateString.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      const parsedTime = parseTimeTo24Hour(timeString);

      if (!year || !month || !day || !parsedTime) return null;

      // Match times are stored in IST; convert IST to UTC for calendar standards.
      const istTimestamp = Date.UTC(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 0);
      const utcTimestamp = istTimestamp - 5.5 * 60 * 60 * 1000;
      return new Date(utcTimestamp);
    } catch {
      return null;
    }
  };

  const buildSeasonCalendarEvents = (season: number): CalendarEvent[] => {
    const seasonMatches = matches.filter((match) => getMatchYear(match.date) === season);

    return seasonMatches
      .map((match) => {
        const startDate = getMatchStartDateUTC(match.date, match.time);
        if (!startDate) return null;

        const endDate = new Date(startDate.getTime() + MATCH_DURATION_MINUTES * 60 * 1000);
        const matchNumber = getMatchNumberDisplay(match);
        const leagueLabel = (match.league || currentLeague || 'ipl').toUpperCase();

        const descriptionParts = [
          `${leagueLabel} ${season} fixture`,
          matchNumber && matchNumber !== 'TBD' ? `Match: ${matchNumber}` : undefined,
          `Status: ${match.status.toUpperCase()}`,
          `Venue: ${match.venue}`,
          'Source: SportsUP99',
        ].filter(Boolean);

        return {
          title: `${match.team1.shortName} vs ${match.team2.shortName} • ${leagueLabel} ${season}`,
          description: descriptionParts.join('\n'),
          location: match.venue,
          startDate,
          endDate,
        };
      })
      .filter((event): event is CalendarEvent => event !== null);
  };

  const handleDownloadIcalSeason = (season: number = 2026) => {
    const events = buildSeasonCalendarEvents(season);
    if (events.length === 0) {
      alert(`No matches found for season ${season} to export.`);
      return;
    }

    const leagueCode = (currentLeague || 'ipl').toLowerCase();
    exportToICal(events, `${leagueCode}-${season}-fixtures.ics`);
  };

  const handleAddSeasonToGoogleCalendar = (season: number = 2026) => {
    const events = buildSeasonCalendarEvents(season);
    if (events.length === 0) {
      alert(`No matches found for season ${season} to export.`);
      return;
    }

    const leagueCode = (currentLeague || 'ipl').toLowerCase();
    exportToICal(events, `${leagueCode}-${season}-fixtures.ics`);
    window.open('https://calendar.google.com/calendar/u/0/r/settings/export', '_blank', 'noopener,noreferrer');
    alert('ICS downloaded. In Google Calendar, go to Settings > Import & export > Import and upload the file.');
  };

  const handleDownload2027KeyDates = () => {
    const keyDates: CalendarEvent[] = [
      {
        title: 'IPL 2027 Player Mini-Auction (Goa)',
        description: 'BCCI IPL 2027 Player Mini-Auction at ITC Grand Goa. 184 cricketers retained across 10 franchises; 66 vacancies (21 overseas) to be filled with ₹297.95 Cr purse.',
        location: 'ITC Grand Goa Resort & Spa, Arossim Beach, Goa, India',
        startDate: new Date('2026-12-16T11:00:00+05:30'),
        endDate: new Date('2026-12-16T19:00:00+05:30'),
      },
      {
        title: 'IPL 2027 Opening Match: Defending Champions RCB vs TBD',
        description: 'Projected tournament opener of the 20th Indian Premier League edition hosted by reigning titleholders Royal Challengers Bengaluru at M. Chinnaswamy Stadium.',
        location: 'M. Chinnaswamy Stadium, Bengaluru, Karnataka, India',
        startDate: new Date('2027-03-14T19:30:00+05:30'),
        endDate: new Date('2027-03-14T23:30:00+05:30'),
      },
    ];

    exportToICal(keyDates, 'ipl-2027-milestones.ics');
  };

  // High-fidelity stadium atmosphere (deep midnight obsidian, royal indigo, zero pink)
  const pageOilTheme = {
    base: 'linear-gradient(155deg, #030712 0%, #080E24 45%, #0B1333 75%, #030712 100%)',
    hazeA: 'radial-gradient(82% 70% at 14% 12%, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.08) 55%, transparent 80%)',
    hazeB: 'radial-gradient(75% 66% at 88% 88%, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.08) 55%, transparent 80%)',
    brush: 'linear-gradient(112deg, rgba(59,130,246,0.14), rgba(99,102,241,0.08), rgba(139,92,246,0.04))',
  };

  // Default to IPL for matches page
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/wpl/')) {
      setCurrentLeague('ipl');
    }
  }, [setCurrentLeague]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const [matchesData, teamsData] = await Promise.all([
          api.getMatches('ipl'),
          api.getTeams('ipl'),
        ]);
        setMatches(matchesData);
        setTeams(teamsData);
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const season2026Matches = useMemo(() => {
    return matches.filter((match) => getMatchYear(match.date) === 2026);
  }, [matches]);

  const filtered2026Matches = useMemo(() => {
    return season2026Matches.filter((match) => {
      let matchesStatus = true;
      if (filter === 'playoffs') {
        matchesStatus = Boolean(match.playoffType);
      } else if (filter !== 'all') {
        matchesStatus = match.status === filter;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        match.team1?.name?.toLowerCase().includes(q) ||
        match.team1?.shortName?.toLowerCase().includes(q) ||
        match.team2?.name?.toLowerCase().includes(q) ||
        match.team2?.shortName?.toLowerCase().includes(q) ||
        match.venue?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [filter, searchQuery, season2026Matches]);

  const deferred2026Matches = useDeferredValue(filtered2026Matches);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="relative py-10 sm:py-16 min-h-screen overflow-hidden flex-1">
        {/* Dynamic Stadium Mesh Canvas */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: pageOilTheme.base }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: pageOilTheme.hazeA, mixBlendMode: 'screen' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: pageOilTheme.hazeB, mixBlendMode: 'screen' }} />

        <motion.div
          className="absolute -top-28 left-[-14%] w-[74%] h-[36%] rounded-[120px] blur-3xl opacity-80 pointer-events-none"
          style={{ background: pageOilTheme.brush, transform: 'rotate(-9deg)' }}
          animate={{ x: [0, 10, 0], y: [0, -8, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-24 right-[-10%] w-[70%] h-[34%] rounded-[120px] blur-3xl opacity-70 pointer-events-none"
          style={{ background: pageOilTheme.brush, transform: 'rotate(8deg)' }}
          animate={{ x: [0, -10, 0], y: [0, 8, 0] }}
          transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)',
            mixBlendMode: 'soft-light',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* ── TOP PREMIER MODE SELECTOR ── */}
          <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold ml-1 mr-2 hidden sm:inline-block">
                View Mode:
              </span>

              <div className="inline-flex p-1.5 rounded-2xl bg-black/60 border border-white/10 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('2027_kickoff')}
                  className={`relative px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial cursor-pointer ${
                    viewMode === '2027_kickoff'
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>2027 Kickoff & Countdown</span>
                  <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[9px] bg-amber-400/25 text-amber-300 border border-amber-400/35 font-bold">
                    Upcoming
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('2026_fixtures')}
                  className={`relative px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial cursor-pointer ${
                    viewMode === '2026_fixtures'
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-300" />
                  <span>2026 Fixtures & Results</span>
                  <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[9px] bg-white/15 text-slate-200 font-bold">
                    74 Matches
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('playoffs')}
                  className={`relative px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial cursor-pointer ${
                    viewMode === 'playoffs'
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Playoffs Bracket</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 self-end lg:self-auto pr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {viewMode === '2027_kickoff'
                  ? 'IPL 2027 Pre-Season Active'
                  : viewMode === '2026_fixtures'
                  ? `74 Matches Archived • Defending Champions RCB`
                  : 'Championship Playoff Structure'}
              </span>
            </div>
          </section>

          {/* ── CONDITIONAL VIEWPORT RENDER ── */}
          <AnimatePresence mode="wait">
            {viewMode === '2027_kickoff' && (
              <motion.div
                key="2027_kickoff_view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <Ipl2027SeasonStandby
                  teams={teams}
                  onViewArchive={() => setViewMode('2026_fixtures')}
                  onDownloadKeyDates={handleDownload2027KeyDates}
                />
              </motion.div>
            )}

            {viewMode === '2026_fixtures' && (
              <motion.div
                key="2026_fixtures_view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* 2026 Fixtures Header Banner */}
                <div className="rounded-3xl border border-white/12 bg-black/40 backdrop-blur-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border bg-blue-500/15 border-blue-400/35 text-blue-300">
                      <History className="w-3.5 h-3.5" />
                      <span>IPL 2026 OFFICIAL MATCH ARCHIVE</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewMode('2027_kickoff')}
                      className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>View 2027 Kickoff & Countdown</span>
                    </button>
                  </div>

                  <div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                      IPL 2026{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-violet-300">
                        Matches & Scorecards
                      </span>
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed mt-2">
                      Complete fixture details, venues, toss outcomes, and match centers for all 74 matches of the 2026 Indian Premier League season.
                    </p>
                  </div>

                  {/* Calendar Export Bar */}
                  <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-slate-400">
                      Showing {filtered2026Matches.length} of {season2026Matches.length} matches
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleDownloadIcalSeason(2026)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25 flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export 2026 to iCal</span>
                      </button>

                      <button
                        onClick={() => handleAddSeasonToGoogleCalendar(2026)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors bg-blue-500/15 border-blue-500/35 text-blue-300 hover:bg-blue-500/25 flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Add to Google Calendar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Navigation Bar */}
                <div className="rounded-2xl border border-white/12 bg-black/35 backdrop-blur-xl p-4 sm:p-5 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Status Tabs */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'all', label: `All Matches (${season2026Matches.length})` },
                        { key: 'completed', label: `Completed (${season2026Matches.filter(m => m.status === 'completed').length})` },
                        { key: 'playoffs', label: `Playoffs (4)` },
                        { key: 'upcoming', label: `Upcoming (0)` },
                      ].map((tab) => {
                        const isActive = filter === tab.key;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white border-white/20 shadow-md shadow-indigo-500/25'
                                : 'bg-white/[0.04] text-slate-300 border-white/10 hover:text-white'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Live Search */}
                    <div className="relative sm:w-80">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search team, venue, city..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/12 text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-indigo-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Matches Grid */}
                <AnimatePresence mode="wait">
                  {deferred2026Matches.length > 0 ? (
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={{
                        visible: {
                          transition: {
                            staggerChildren: 0.03,
                          },
                        },
                      }}
                    >
                      {deferred2026Matches.map((match, index) => (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{
                            duration: 0.35,
                            delay: index * 0.02,
                          }}
                        >
                          <MatchCard match={match} index={index} />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center py-16 rounded-3xl bg-black/20 border border-white/10 max-w-md mx-auto p-8 space-y-4">
                      <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
                      <p className="text-base font-bold text-white">No matches match your filter or search query</p>
                      <button
                        onClick={() => {
                          setFilter('all');
                          setSearchQuery('');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {viewMode === 'playoffs' && (
              <motion.div
                key="playoffs_view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <PublicPlayoffOverview
                  league="ipl"
                  season={2026}
                  matches={season2026Matches}
                  teams={teams}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
