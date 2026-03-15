'use client';

import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MatchCard from '@/components/matches/MatchCard';
import { Match } from '@/types';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import GradientText from '@/components/ui/GradientText';
import { getMatchNumberDisplay } from '@/lib/matchNumberUtils';
import { exportToICal, type CalendarEvent } from '@/lib/admin/exportUtils';

export default function MatchesPage() {
  const TARGET_CALENDAR_SEASON = 2026;
  const MATCH_DURATION_MINUTES = 240;

  const { currentLeague, setCurrentLeague } = useLeague();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>(2026);

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
      const utcTimestamp = istTimestamp - (5.5 * 60 * 60 * 1000);
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

  const season2026MatchCount = useMemo(
    () => matches.filter((match) => getMatchYear(match.date) === TARGET_CALENDAR_SEASON).length,
    [matches]
  );

  const handleDownloadIcalSeason = (season: number = TARGET_CALENDAR_SEASON) => {
    const events = buildSeasonCalendarEvents(season);
    if (events.length === 0) {
      alert(`No matches found for season ${season} to export.`);
      return;
    }

    const leagueCode = (currentLeague || 'ipl').toLowerCase();
    exportToICal(events, `${leagueCode}-${season}-fixtures.ics`);
  };

  const handleAddSeasonToGoogleCalendar = (season: number = TARGET_CALENDAR_SEASON) => {
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

  const seasonOptions: Array<number | 'all'> = availableSeasons.length > 0
    ? [...availableSeasons]
    : [2026];
  if (seasonOptions.length > 1 && seasonOptions[0] !== 'all') {
    seasonOptions.unshift('all');
  }

  const seasonLabel = selectedSeason === 'all' ? 'All Seasons' : selectedSeason;
  const subtitleSeason = selectedSeason === 'all'
    ? 'all available seasons'
    : `${seasonLabel} season`;

  const pageOilTheme = currentLeague === 'wpl'
    ? {
        base: 'linear-gradient(155deg, #10071d 0%, #1c0b2d 38%, #142244 72%, #0a172f 100%)',
        hazeA: 'radial-gradient(82% 70% at 14% 12%, rgba(236,72,153,0.26) 0%, rgba(168,85,247,0.1) 55%, transparent 80%)',
        hazeB: 'radial-gradient(75% 66% at 88% 88%, rgba(34,211,238,0.22) 0%, rgba(56,189,248,0.09) 55%, transparent 80%)',
        brush: 'linear-gradient(112deg, rgba(244,114,182,0.18), rgba(147,51,234,0.08), rgba(56,189,248,0.04))',
      }
    : {
        base: 'linear-gradient(155deg, #120a12 0%, #221018 38%, #1a2845 72%, #0d1c33 100%)',
        hazeA: 'radial-gradient(82% 70% at 14% 12%, rgba(251,146,60,0.24) 0%, rgba(236,72,153,0.09) 55%, transparent 80%)',
        hazeB: 'radial-gradient(74% 66% at 88% 88%, rgba(99,102,241,0.2) 0%, rgba(56,189,248,0.08) 55%, transparent 80%)',
        brush: 'linear-gradient(112deg, rgba(245,158,11,0.16), rgba(236,72,153,0.08), rgba(99,102,241,0.04))',
      };

  // Default to IPL for matches page (unless on /wpl/matches)
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/wpl/')) {
      setCurrentLeague('ipl');
    }
  }, [setCurrentLeague]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matchesData = await api.getMatches(currentLeague);
        setMatches(matchesData);
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [currentLeague]); // Re-fetch when league changes

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const matchesStatus = filter === 'all' || match.status === filter;
      const matchYear = getMatchYear(match.date);
      const matchesSeason = selectedSeason === 'all' || matchYear === selectedSeason;
      return matchesStatus && matchesSeason;
    });
  }, [filter, matches, selectedSeason]);

  const deferredMatches = useDeferredValue(filteredMatches);

  useEffect(() => {
    const seasons = Array.from(new Set(
      matches
        .map(match => getMatchYear(match.date))
        .filter((year): year is number => typeof year === 'number' && !Number.isNaN(year))
    )).sort((a, b) => b - a);

    setAvailableSeasons(seasons);

    const preferred = 2026;
    if (seasons.length === 0) {
      setSelectedSeason('all');
      return;
    }

    const defaultSeason = seasons.includes(preferred) ? preferred : seasons[0];

    setSelectedSeason(prev => {
      if (prev === 'all') return defaultSeason;
      return seasons.includes(prev) ? prev : defaultSeason;
    });
  }, [matches]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="relative py-16 min-h-screen overflow-hidden section-match-bg">
        {/* Clean oil-canvas background */}
        <div className="absolute inset-0" style={{ background: pageOilTheme.base }} />
        <div className="absolute inset-0" style={{ background: pageOilTheme.hazeA, mixBlendMode: 'screen' }} />
        <div className="absolute inset-0" style={{ background: pageOilTheme.hazeB, mixBlendMode: 'screen' }} />

        <motion.div
          className="absolute -top-28 left-[-14%] w-[74%] h-[36%] rounded-[120px] blur-2xl opacity-85"
          style={{ background: pageOilTheme.brush, transform: 'rotate(-9deg)' }}
          animate={{ x: [0, 10, 0], y: [0, -8, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-24 right-[-10%] w-[70%] h-[34%] rounded-[120px] blur-2xl opacity-70"
          style={{ background: pageOilTheme.brush, transform: 'rotate(8deg)' }}
          animate={{ x: [0, -10, 0], y: [0, 8, 0] }}
          transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)',
            mixBlendMode: 'soft-light',
          }}
        />

        <motion.div
          className="absolute top-16 right-16 w-20 h-20 rounded-full blur-2xl"
          style={{
            background: currentLeague === 'wpl'
              ? 'radial-gradient(circle, rgba(236,72,153,0.3), rgba(168,85,247,0.08), transparent 75%)'
              : 'radial-gradient(circle, rgba(251,146,60,0.28), rgba(236,72,153,0.08), transparent 75%)',
          }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 42%, transparent 0%, rgba(2,6,23,0.24) 64%, rgba(2,6,23,0.58) 100%)' }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="mb-8 rounded-3xl border border-white/15 bg-black/30 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-6 md:p-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border mb-4"
                 style={currentLeague === 'wpl'
                   ? { background: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.35)', color: '#e9d5ff' }
                   : { background: 'rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.32)', color: '#fde68a' }}>
              <Icon name="cricket" size={14} />
              {currentLeague === 'wpl' ? 'WPL MATCH SCHEDULE' : 'IPL MATCH SCHEDULE'}
            </div>

            <motion.h1
              className="text-4xl md:text-5xl font-black mb-3 tracking-tight"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 55%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {currentLeague === 'wpl' ? (
                <>WPL {seasonLabel} <GradientText gradient="from-fuchsia-300 via-pink-300 to-rose-300" animate>Fixtures</GradientText></>
              ) : (
                <>IPL {seasonLabel} <GradientText gradient="from-amber-300 via-orange-300 to-rose-300" animate>Fixtures</GradientText></>
              )}
            </motion.h1>

            <p className="text-slate-200/90 text-base md:text-lg max-w-3xl leading-relaxed">
              {currentLeague === 'wpl'
                ? `Live scores, upcoming matches, and full fixture details for the ${subtitleSeason} of the WPL.`
                : `Live scores, upcoming matches, and full fixture details for the ${subtitleSeason} of the IPL.`}
            </p>

            <div className="mt-4 inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200">
              Showing {selectedSeason === 'all' ? 'all available seasons' : `${selectedSeason} season`} · {filteredMatches.length} match{filteredMatches.length === 1 ? '' : 'es'}
            </div>
          </motion.div>

          {/* Season + Calendar Actions */}
          <div className="mb-6 rounded-2xl border border-white/12 bg-black/25 backdrop-blur-xl p-4 md:p-5 shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold mr-1">Season</span>
              {seasonOptions.map((season) => {
                const isAll = season === 'all';
                const isActive = selectedSeason === season;
                const label = isAll ? 'All' : season;
                return (
                  <button
                    key={season}
                    onClick={() => setSelectedSeason(season)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 ${
                      isActive ? 'text-white' : 'text-slate-200 hover:text-white'
                    }`}
                    style={isActive ? {
                      background: currentLeague === 'wpl'
                        ? 'linear-gradient(135deg, rgba(168,85,247,0.42), rgba(236,72,153,0.35))'
                        : 'linear-gradient(135deg, rgba(245,158,11,0.42), rgba(236,72,153,0.32))',
                      borderColor: 'rgba(255,255,255,0.3)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                    } : {
                      background: 'rgba(255,255,255,0.06)',
                      borderColor: 'rgba(255,255,255,0.14)',
                    }}
                  >
                    {label} {(!isAll && season === 2026) ? '· Default' : ''}
                  </button>
                );
              })}
            </div>

            <p className="text-slate-400 text-sm mt-2.5">
              Defaulting to 2026 when available. Pick past seasons to browse archived fixtures.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleDownloadIcalSeason(TARGET_CALENDAR_SEASON)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                style={{
                  background: 'rgba(16,185,129,0.16)',
                  borderColor: 'rgba(16,185,129,0.38)',
                  color: '#d1fae5',
                }}
              >
                Add {TARGET_CALENDAR_SEASON} to iCal
              </button>

              <button
                onClick={() => handleAddSeasonToGoogleCalendar(TARGET_CALENDAR_SEASON)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                style={{
                  background: 'rgba(59,130,246,0.16)',
                  borderColor: 'rgba(59,130,246,0.38)',
                  color: '#dbeafe',
                }}
              >
                Add {TARGET_CALENDAR_SEASON} to Google Calendar
              </button>

              <span className="text-xs text-slate-400">
                {season2026MatchCount} match{season2026MatchCount === 1 ? '' : 'es'} in {TARGET_CALENDAR_SEASON}
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-10 rounded-2xl border border-white/12 bg-black/20 backdrop-blur-xl p-3 shadow-[0_12px_30px_rgba(0,0,0,0.26)]">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Matches', icon: 'stats' as const, color: '#94a3b8' },
                { key: 'upcoming', label: 'Upcoming', icon: 'target' as const, color: '#3b82f6' },
                { key: 'live', label: 'Live', icon: 'cricket' as const, color: '#ef4444' },
                { key: 'completed', label: 'Completed', icon: 'trophy' as const, color: '#10b981' }
              ].map((tab) => {
                const isActive = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as 'all' | 'upcoming' | 'live' | 'completed')}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-2 border transition-all duration-200"
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${tab.color}66, ${tab.color}33)`,
                      color: '#ffffff',
                      borderColor: `${tab.color}aa`,
                      boxShadow: `0 6px 18px ${tab.color}35`,
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      color: '#cbd5e1',
                      borderColor: 'rgba(255,255,255,0.12)',
                    }}
                  >
                    <Icon name={tab.icon} size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matches Grid */}
          <AnimatePresence mode="wait">
            {deferredMatches.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                {deferredMatches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  >
                    <MatchCard match={match} index={index} />
                  </motion.div>
                ))}
              </motion.div>
          ) : (
            <div className="text-center py-12 animate-fade-in" style={{ animationDelay: '220ms' }}>
              <div className="relative overflow-hidden rounded-2xl bg-black/25 backdrop-blur-xl border border-white/12 p-8 max-w-md mx-auto">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-300 text-lg font-semibold">
                  No {filter} matches found
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try selecting a different filter
                </p>
              </div>
            </div>
          )}
          </AnimatePresence>

          {/* Pagination */}
          {deferredMatches.length > 0 && (
            <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <button 
                onClick={() => alert('Loading more matches...')} 
                className="group relative overflow-hidden rounded-xl font-semibold text-base px-8 py-3.5 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{
                  background: currentLeague === 'wpl'
                    ? 'linear-gradient(135deg, rgba(168,85,247,0.8), rgba(236,72,153,0.75))'
                    : 'linear-gradient(135deg, rgba(245,158,11,0.82), rgba(236,72,153,0.72))',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  color: '#fff',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                <span className="relative z-10 flex items-center justify-center gap-2">
                  Load More Matches
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
