'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MatchCard from '@/components/matches/MatchCard';
import { Match, Player, Team } from '@/types';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import AuroraBackground from '@/components/ui/AuroraBackground';
import GradientText from '@/components/ui/GradientText';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import { WPLColors } from '@/lib/wplColors';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Bell, 
  Shield, 
  Flame, 
  ArrowRight,
  Filter,
  History
} from 'lucide-react';

const WPL_FRANCHISES = [
  { short: 'RCB-W', name: 'Royal Challengers Bengaluru', color: '#E01E37', border: 'border-red-500/40', href: '/wpl/teams/rcb-w' },
  { short: 'MI-W', name: 'Mumbai Indians', color: '#004BA0', border: 'border-blue-500/40', href: '/wpl/teams/mi-w' },
  { short: 'DC-W', name: 'Delhi Capitals', color: '#0047AB', border: 'border-indigo-500/40', href: '/wpl/teams/dc-w' },
  { short: 'GG', name: 'Gujarat Giants', color: '#F36F21', border: 'border-orange-500/40', href: '/wpl/teams/gg' },
  { short: 'UPW', name: 'UP Warriorz', color: '#6A1B9A', border: 'border-purple-500/40', href: '/wpl/teams/upw' },
];

export default function WPLMatchesPage() {
  const TARGET_CALENDAR_SEASON = 2027;
  const { currentLeague, setCurrentLeague } = useLeague();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const [showArchive, setShowArchive] = useState(false);

  // Countdown to Jan 9, 2027
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2027-01-09T19:30:00+05:30').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const getMatchYear = (dateString: string): number | null => {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) return parsed.getFullYear();
    const match = dateString.match(/(20\d{2}|19\d{2})/);
    return match ? parseInt(match[1], 10) : null;
  };

  useEffect(() => {
    if (currentLeague !== 'wpl') {
      setCurrentLeague('wpl');
    }
  }, [currentLeague, setCurrentLeague]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const [matchesData, playersData] = await Promise.all([
          api.getMatches('wpl').catch(() => []),
          api.getPlayers(undefined, 'wpl').catch(() => [])
        ]);
        setMatches(matchesData);
        setPlayers(playersData);
      } catch (error) {
        console.error('Failed to fetch WPL matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const matches2027 = useMemo(() => {
    return matches.filter((m) => getMatchYear(m.date) === TARGET_CALENDAR_SEASON);
  }, [matches]);

  const matches2026Archive = useMemo(() => {
    return matches.filter((m) => getMatchYear(m.date) === 2026);
  }, [matches]);

  const displayedMatches = useMemo(() => {
    const pool = showArchive ? matches2026Archive : matches2027;
    if (filter === 'all') return pool;
    return pool.filter((m) => m.status === filter);
  }, [showArchive, matches2026Archive, matches2027, filter]);

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col relative selection:bg-pink-500 selection:text-white">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
        <AuroraBackground />
        <WPLFloatingParticles />
      </div>

      <main className="relative z-10 flex-1 pb-24">
        {/* Hero Section */}
        <section className="pt-12 pb-14 border-b border-white/[0.08] bg-gradient-to-b from-purple-950/30 via-[#05070f] to-[#05070f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            
            {/* Season Window Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs sm:text-sm font-black tracking-wider uppercase backdrop-blur-xl"
            >
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>WPL 2027 Season 5 • Jan 9 – Feb 5, 2027</span>
            </motion.div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none">
                Fixtures & <GradientText gradient="from-purple-400 via-pink-400 to-rose-400" animate className="inline-block">Match Hub</GradientText>
              </h1>
              <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Track official match schedules, venues, and clash timings for the 2027 Women's Premier League title race.
              </p>
            </div>

            {/* Countdown Clock to 2027 Opener */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                <Clock className="w-3.5 h-3.5 text-pink-400" />
                <span>Countdown to Season 5 Opener</span>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
                <div className="p-2 sm:p-3 rounded-xl bg-black/50 border border-white/5">
                  <span className="block text-2xl sm:text-3xl font-black text-white">{timeLeft.days}</span>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Days</span>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-black/50 border border-white/5">
                  <span className="block text-2xl sm:text-3xl font-black text-white">{timeLeft.hours}</span>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Hours</span>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-black/50 border border-white/5">
                  <span className="block text-2xl sm:text-3xl font-black text-white">{timeLeft.minutes}</span>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Mins</span>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-black/50 border border-white/5">
                  <span className="block text-2xl sm:text-3xl font-black text-pink-400">{timeLeft.seconds}</span>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Secs</span>
                </div>
              </div>
            </motion.div>

            {/* Franchise Quick Link Strip */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mr-2 hidden sm:inline">
                Franchises:
              </span>
              {WPL_FRANCHISES.map((team) => (
                <Link
                  key={team.short}
                  href={team.href}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08] border ${team.border} transition-all`}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: team.color }} />
                  {team.short}
                </Link>
              ))}
            </div>

          </div>
        </section>

        {/* Schedule Display & Controls */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-8 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowArchive(false)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${
                  !showArchive
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                    : 'text-gray-400 hover:text-white bg-white/[0.04]'
                }`}
              >
                2027 Season ({matches2027.length})
              </button>
              <button
                type="button"
                onClick={() => setShowArchive(true)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  showArchive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-gray-400 hover:text-white bg-white/[0.04]'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>2026 Archive ({matches2026Archive.length})</span>
              </button>
            </div>

            {/* Filter Pills if matches exist */}
            {displayedMatches.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                {(['all', 'upcoming', 'live', 'completed'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilter(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      filter === mode
                        ? 'bg-white text-slate-950 font-black'
                        : 'bg-white/[0.04] text-gray-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active 2027 Pre-Season Announcement Banner */}
          {!showArchive && matches2027.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] p-8 sm:p-14 text-center max-w-3xl mx-auto backdrop-blur-2xl shadow-2xl relative overflow-hidden"
            >
              {/* Radial Accent Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-pink-500/10 blur-3xl pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-pink-400" />
              </div>

              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Official BCCI Window Confirmed
              </span>

              <h2 className="text-2xl sm:text-4xl font-black text-white mt-4 tracking-tight">
                2027 Fixture Grid Announcement Pending
              </h2>

              <p className="text-gray-300 text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
                The Women's Premier League 2027 season will take place across the confirmed 28-day window from <strong>January 9 to February 5, 2027</strong>. Detailed day-by-day fixtures, start times, and venue allocations will synchronize automatically here the moment released by the BCCI.
              </p>

              {/* Tournament Highlights Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-8 border-t border-white/10 text-left">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[11px] uppercase tracking-wider text-pink-400 font-bold block">Tournament Window</span>
                  <span className="text-base font-black text-white mt-0.5 block">Jan 9 – Feb 5, 2027</span>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[11px] uppercase tracking-wider text-purple-400 font-bold block">Franchises</span>
                  <span className="text-base font-black text-white mt-0.5 block">5 Contenders</span>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold block">Squad Rosters</span>
                  <Link href="/wpl/teams" className="text-base font-black text-cyan-300 hover:underline flex items-center gap-1 mt-0.5">
                    View Squads <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/wpl/teams"
                  className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm transition-all shadow-lg shadow-pink-600/30"
                >
                  Explore 2027 Squads
                </Link>
                <button
                  type="button"
                  onClick={() => setShowArchive(true)}
                  className="px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 hover:text-white font-bold text-sm border border-white/10 transition-all flex items-center gap-2"
                >
                  <History className="w-4 h-4" /> View 2026 Match Archive
                </button>
              </div>

            </motion.div>
          ) : (
            /* Match Cards Grid (For 2027 once loaded or 2026 Archive) */
            <div className="space-y-4">
              {showArchive && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold flex items-center gap-2">
                  <History className="w-4 h-4 shrink-0" />
                  <span>Viewing historical results from the 2026 season. Switch back to 2027 Season above anytime.</span>
                </div>
              )}

              {displayedMatches.length === 0 ? (
                <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/10">
                  <p className="text-gray-400 text-sm">No matches found for this filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
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
