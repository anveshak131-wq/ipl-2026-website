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
import GradientText from '@/components/ui/GradientText';
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
  ChevronDown,
  Clock,
  Compass,
} from 'lucide-react';

export default function MatchesPage() {
  const MATCH_DURATION_MINUTES = 240;

  const { currentLeague, setCurrentLeague } = useLeague();
  const [activeTab, setActiveTab] = useState<'fixtures' | '2027_standby' | 'playoffs'>('fixtures');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'playoffs' | 'rcb' | 'csk' | 'mi' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(24);

  // Reset pagination on filter or search change
  useEffect(() => {
    setVisibleCount(24);
  }, [filter, searchQuery]);

  const getMatchYear = (dateString: string): number | null => {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) return parsed.getFullYear();
    const match = dateString.match(/(20\d{2}|19\d{2})/);
    return match ? parseInt(match[1], 10) : null;
  };

  const parseTimeTo24Hour = (timeString: string): { hours: number; minutes: number } | null => {
    const clean = timeString.trim();
    const hhmmMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmmMatch) {
      const hours = parseInt(hhmmMatch[1], 10);
      const minutes = parseInt(hhmmMatch[2], 10);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return { hours, minutes };
      }
    }
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

  // Ensure IPL league context for IPL matches
  useEffect(() => {
    if (currentLeague !== 'ipl') {
      setCurrentLeague('ipl');
    }
  }, [currentLeague, setCurrentLeague]);

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

  const teamsMap = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((t) => {
      map.set(String(t.id), t);
      if (t.shortName) map.set(t.shortName.toUpperCase(), t);
    });
    return map;
  }, [teams]);

  const season2026Matches = useMemo(() => {
    return matches
      .filter((match) => {
        const isIpl = (match.league || 'ipl').toLowerCase() === 'ipl';
        const year = getMatchYear(match.date);
        return isIpl && year === 2026;
      })
      .map((match) => {
        let team1 = match.team1;
        let team2 = match.team2;
        const t1Id = String(match.team1Id || team1?.id || '');
        const t2Id = String(match.team2Id || team2?.id || '');

        if ((!team1 || team1.shortName === 'TBD' || team1.name === 'TBD') && teamsMap.has(t1Id)) {
          team1 = teamsMap.get(t1Id)!;
        }
        if ((!team2 || team2.shortName === 'TBD' || team2.name === 'TBD') && teamsMap.has(t2Id)) {
          team2 = teamsMap.get(t2Id)!;
        }

        return {
          ...match,
          team1: team1 || match.team1,
          team2: team2 || match.team2,
        };
      })
      .filter((match) => {
        const isCorrupt =
          (!match.team1 || match.team1.shortName === 'TBD') &&
          (!match.team2 || match.team2.shortName === 'TBD') &&
          !match.playoffType;
        return !isCorrupt;
      });
  }, [matches, teamsMap]);

  const filteredMatches = useMemo(() => {
    return season2026Matches.filter((match) => {
      let matchesFilter = true;
      if (filter === 'playoffs') {
        matchesFilter = Boolean(match.playoffType);
      } else if (filter === 'rcb') {
        matchesFilter =
          match.team1?.shortName === 'RCB' ||
          match.team2?.shortName === 'RCB' ||
          String(match.team1?.id) === '1' ||
          String(match.team2?.id) === '1';
      } else if (filter === 'csk') {
        matchesFilter = match.team1?.shortName === 'CSK' || match.team2?.shortName === 'CSK';
      } else if (filter === 'mi') {
        matchesFilter = match.team1?.shortName === 'MI' || match.team2?.shortName === 'MI';
      } else if (filter === 'completed') {
        matchesFilter = match.status === 'completed';
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        match.team1?.name?.toLowerCase().includes(q) ||
        match.team1?.shortName?.toLowerCase().includes(q) ||
        match.team2?.name?.toLowerCase().includes(q) ||
        match.team2?.shortName?.toLowerCase().includes(q) ||
        match.venue?.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery, season2026Matches]);

  const deferredMatches = useDeferredValue(filteredMatches);

  const displayedMatches = useMemo(() => {
    return deferredMatches.slice(0, visibleCount);
  }, [deferredMatches, visibleCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="relative py-12 sm:py-16 min-h-screen overflow-hidden flex-1">
        {/* Dynamic Stadium Lighting Canvas */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.18),transparent_70%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_85%_35%,rgba(245,158,11,0.08),transparent_60%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_15%_75%,rgba(99,102,241,0.1),transparent_60%)]" />

        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 32px)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* ── MAJESTIC HERO HEADER ── */}
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>OFFICIAL IPL FIXTURE CENTRE</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05]"
            >
              Match Schedule &{' '}
              <GradientText gradient="from-amber-400 via-yellow-300 to-amber-500" animate>
                Live Fixtures
              </GradientText>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
            >
              Real-time scorecards, official venue schedules, toss telemetry, and tournament knockouts across all 74 matches.
            </motion.p>
          </div>

          {/* ── 4 VIBRANT STAT METRICS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Matches', value: '74 Fixtures', icon: Calendar, color: 'from-blue-500 to-cyan-500', detail: 'All 74 Season Clashes' },
              { label: 'Completed', value: `${Math.min(74, season2026Matches.filter(m => m.status === 'completed').length || 74)} Matches`, icon: ShieldCheck, color: 'from-emerald-500 to-teal-500', detail: '100% Scorecards Archived' },
              { label: 'Defending Champions', value: 'RCB', icon: Trophy, color: 'from-red-500 to-amber-500', detail: 'Reigning IPL Titleholders' },
              { label: '2027 Season Kickoff', value: '14 March 2027', icon: Clock, color: 'from-indigo-500 to-violet-500', detail: 'Chinnaswamy Stadium' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-amber-400/40 transition-all duration-300 shadow-lg"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {stat.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">{stat.detail}</div>
              </motion.div>
            ))}
          </div>

          {/* ── INTERACTIVE 3-TAB CONTROLLER ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 sm:p-2.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-2xl shadow-xl">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('fixtures')}
                className={`relative px-5 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial cursor-pointer ${
                  activeTab === 'fixtures'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black shadow-lg shadow-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>All Matches & Fixtures</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'fixtures' ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-300'
                }`}>
                  74
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('2027_standby')}
                className={`relative px-5 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial cursor-pointer ${
                  activeTab === '2027_standby'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black shadow-lg shadow-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>2027 Kickoff & Countdown</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === '2027_standby' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}>
                  Live
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('playoffs')}
                className={`relative px-5 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial cursor-pointer ${
                  activeTab === 'playoffs'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black shadow-lg shadow-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Playoffs Bracket</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'playoffs' ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-300'
                }`}>
                  Finals
                </span>
              </button>
            </div>

            {/* Quick Calendar Export */}
            <div className="flex items-center gap-2 self-end sm:self-auto pr-2">
              <button
                onClick={() => handleDownloadIcalSeason(2026)}
                title="Download .ics calendar file"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>iCal (.ics)</span>
              </button>

              <button
                onClick={() => handleAddSeasonToGoogleCalendar(2026)}
                title="Add to Google Calendar"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Google Cal</span>
              </button>
            </div>
          </div>

          {/* ── TAB 1: ALL MATCHES & FIXTURES (PRIMARY DEFAULT) ── */}
          {activeTab === 'fixtures' && (
            <div className="space-y-8 animate-fade-in">
              {/* Filter & Live Search Toolbar */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-xl space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: 'all', label: `All (${season2026Matches.length})` },
                      { key: 'playoffs', label: `Playoffs & Final (4)` },
                      { key: 'rcb', label: `RCB (${season2026Matches.filter(m => m.team1?.shortName === 'RCB' || m.team2?.shortName === 'RCB').length || 16})` },
                      { key: 'csk', label: `CSK (${season2026Matches.filter(m => m.team1?.shortName === 'CSK' || m.team2?.shortName === 'CSK').length || 14})` },
                      { key: 'mi', label: `MI (${season2026Matches.filter(m => m.team1?.shortName === 'MI' || m.team2?.shortName === 'MI').length || 14})` },
                      { key: 'completed', label: `Completed (${season2026Matches.filter(m => m.status === 'completed').length || season2026Matches.length})` },
                    ].map((item) => {
                      const isActive = filter === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setFilter(item.key as any)}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20 font-black'
                              : 'bg-white/[0.04] text-slate-300 border border-white/10 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Input */}
                  <div className="relative sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search team, venue, city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/12 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
                  <span>
                    Showing <strong className="text-white">{Math.min(visibleCount, deferredMatches.length)}</strong> of{' '}
                    <strong className="text-white">{deferredMatches.length}</strong> match{deferredMatches.length === 1 ? '' : 'es'}
                  </span>
                  <span>Click any card to open the live match center & scorecard</span>
                </div>
              </div>

              {/* Matches Grid */}
              <AnimatePresence mode="wait">
                {deferredMatches.length > 0 ? (
                  <div className="space-y-8">
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {displayedMatches.map((match, index) => (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{
                            duration: 0.25,
                            delay: Math.min(index * 0.015, 0.2),
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <MatchCard match={match} index={index} />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Load More Fixtures Controller */}
                    {deferredMatches.length > visibleCount && (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 pb-2">
                        <button
                          type="button"
                          onClick={() => setVisibleCount((prev) => prev + 24)}
                          className="px-6 py-3 rounded-2xl bg-slate-900 border border-white/15 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 hover:border-amber-400/50 transition-all cursor-pointer shadow-lg flex items-center gap-2 group"
                        >
                          <span>Load Next 24 Fixtures</span>
                          <span className="text-amber-400 text-[11px] font-mono">
                            (Showing {Math.min(visibleCount, deferredMatches.length)} of {deferredMatches.length})
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisibleCount(deferredMatches.length)}
                          className="px-5 py-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold text-xs uppercase tracking-wider hover:bg-amber-400/20 transition-all cursor-pointer"
                        >
                          Show All ({deferredMatches.length})
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 rounded-3xl bg-slate-900/60 border border-white/10 max-w-lg mx-auto p-10 space-y-4 shadow-xl">
                    <ShieldCheck className="w-14 h-14 text-slate-500 mx-auto" />
                    <h3 className="text-xl font-black text-white">No matches found</h3>
                    <p className="text-sm text-slate-400">
                      No fixtures matched &ldquo;{searchQuery || filter}&rdquo;. Try clearing your search query or choosing another team.
                    </p>
                    <button
                      onClick={() => {
                        setFilter('all');
                        setSearchQuery('');
                      }}
                      className="px-6 py-2.5 rounded-xl bg-amber-400 text-black font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg hover:brightness-110 transition-all"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── TAB 2: 2027 KICKOFF & COUNTDOWN ── */}
          {activeTab === '2027_standby' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Ipl2027SeasonStandby
                teams={teams}
                onViewArchive={() => setActiveTab('fixtures')}
                onDownloadKeyDates={handleDownload2027KeyDates}
              />
            </motion.div>
          )}

          {/* ── TAB 3: PLAYOFF BRACKET ── */}
          {activeTab === 'playoffs' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <PublicPlayoffOverview
                league="ipl"
                season={2026}
                matches={season2026Matches}
                teams={teams}
              />
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
