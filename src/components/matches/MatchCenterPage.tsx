'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Lock, Trophy, Users, AlertTriangle, CloudRain, Info } from 'lucide-react';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useLeague } from '@/contexts/LeagueContext';
import { api } from '@/lib/data';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import { getMatchNumberDisplay } from '@/lib/matchNumberUtils';
import { getMatchAdvisory } from '@/lib/matchAdvisory';
import { getPlaying11VisibilityMessage, isPlaying11VisibleNow } from '@/lib/playing11Utils';
import { formatMatchTime } from '@/lib/timeUtils';
import { League, Match, Player } from '@/types';

interface MatchCenterPageProps {
  backHref?: string;
  preferredLeague?: League;
}

interface ScorecardInnings {
  inningsNumber?: number;
  battingTeamId?: string;
  totalRuns?: number;
  totalWickets?: number;
  totalOvers?: number | string;
  batting?: Array<{
    name?: string;
    runs?: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    strikeRate?: number;
    dismissal?: {
      details?: string;
    };
  }>;
  bowling?: Array<{
    name?: string;
    overs?: number;
    balls?: number;
    maidens?: number;
    runs?: number;
    wickets?: number;
    economyRate?: number;
  }>;
}

interface PublishedScorecard {
  id: string;
  draft?: boolean;
  publishedAt?: string;
  matchInfo?: {
    toss?: {
      winner?: string;
      decision?: string;
    };
  };
  result?: {
    winner?: string;
    margin?: string;
  };
  innings?: ScorecardInnings[];
}

const sectionAnimation = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function getMatchYear(dateString: string | undefined | null): number | null {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) return parsed.getFullYear();
  const match = String(dateString).match(/(20\d{2}|19\d{2})/);
  return match ? parseInt(match[1], 10) : null;
}

async function fetchPublishedScorecard(matchId: string, league?: League): Promise<PublishedScorecard | null> {
  try {
    const query = new URLSearchParams({ matchId });
    if (league) {
      query.set('league', league);
    }
    const response = await fetch(`/api/scorecards?${query.toString()}`);
    if (!response.ok) {
      return null;
    }

    const scorecards = await response.json();
    if (!Array.isArray(scorecards)) {
      return null;
    }

    return scorecards.find((card: PublishedScorecard) => card?.draft === false) || null;
  } catch {
    return null;
  }
}

export default function MatchCenterPage({ backHref = '/matches', preferredLeague }: MatchCenterPageProps) {
  const params = useParams<{ matchId: string }>();
  const searchParams = useSearchParams();
  const searchKey = typeof searchParams?.toString === 'function' ? searchParams.toString() : '';
  const matchId = typeof params?.matchId === 'string' ? decodeURIComponent(params.matchId) : '';

  const { setCurrentLeague } = useLeague();

  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [scorecard, setScorecard] = useState<PublishedScorecard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) {
      setError('Invalid match id.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadMatchCenter = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const hintedLeague = searchParams.get('league');
        const hintedDate = searchParams.get('date');
        const hintedTeam1Id = searchParams.get('team1Id');
        const hintedTeam2Id = searchParams.get('team2Id');
        const hintedSeasonRaw = searchParams.get('season');
        const hintedSeason = hintedSeasonRaw ? Number.parseInt(hintedSeasonRaw, 10) : Number.NaN;

        const leagues: League[] = preferredLeague
          ? [preferredLeague, preferredLeague === 'ipl' ? 'wpl' : 'ipl']
          : ['ipl', 'wpl'];

        const leagueMatchLists = await Promise.all(
          leagues.map((league) => api.getMatches(league, { includeAll: true }))
        );
        const allMatches = leagueMatchLists.flat();
        const sameIdMatches = allMatches.filter((item) => String(item.id) === matchId);

        const sortedByScore = (items: Match[]) => {
          return [...items].sort((a, b) => {
              const score = (item: Match) => {
                let value = 0;
                const itemYear = getMatchYear(item.date) || 0;
                value += itemYear;
                if (preferredLeague && item.league === preferredLeague) {
                  value += 10_000;
                }
                if (hintedLeague && item.league === hintedLeague) {
                  value += 8_000;
                }
                if (hintedDate && item.date === hintedDate) {
                  value += 5_000;
                }
                if (Number.isFinite(hintedSeason) && itemYear === hintedSeason) {
                  value += 4_000;
                }

                const itemTeam1 = String(item.team1?.id || '');
                const itemTeam2 = String(item.team2?.id || '');

                if (hintedTeam1Id && hintedTeam2Id) {
                  const exactOrder = itemTeam1 === hintedTeam1Id && itemTeam2 === hintedTeam2Id;
                  const swappedOrder = itemTeam1 === hintedTeam2Id && itemTeam2 === hintedTeam1Id;
                  if (exactOrder) value += 3_000;
                  else if (swappedOrder) value += 1_500;
                }

                return value;
              };

              return score(b) - score(a);
            });
        };

        let selectedMatch: Match | null = sameIdMatches.length > 0 ? sortedByScore(sameIdMatches)[0] : null;

        // Hint-first disambiguation: if URL contains date + team IDs, prefer that exact fixture
        // even when there are duplicate/legacy IDs in storage.
        if (hintedDate && hintedTeam1Id && hintedTeam2Id) {
          const hintedMatches = allMatches.filter((item) => {
            if (hintedLeague && item.league !== hintedLeague) {
              return false;
            }

            if (Number.isFinite(hintedSeason) && getMatchYear(item.date) !== hintedSeason) {
              return false;
            }

            if (item.date !== hintedDate) {
              return false;
            }

            const itemTeam1 = String(item.team1?.id || '');
            const itemTeam2 = String(item.team2?.id || '');
            const exactOrder = itemTeam1 === hintedTeam1Id && itemTeam2 === hintedTeam2Id;
            const swappedOrder = itemTeam1 === hintedTeam2Id && itemTeam2 === hintedTeam1Id;

            return exactOrder || swappedOrder;
          });

          if (hintedMatches.length > 0) {
            selectedMatch = sortedByScore(hintedMatches)[0];
          }
        }

        if (!selectedMatch) {
          if (!cancelled) {
            setMatch(null);
            setPlayers([]);
            setScorecard(null);
            setError('Match not found.');
            setIsLoading(false);
          }
          return;
        }

        const [leaguePlayers, publishedScorecard] = await Promise.all([
          api.getPlayers(undefined, selectedMatch.league),
          fetchPublishedScorecard(selectedMatch.id, selectedMatch.league),
        ]);

        if (cancelled) {
          return;
        }

        setCurrentLeague(selectedMatch.league);
        setMatch(selectedMatch);
        setPlayers(leaguePlayers || []);
        setScorecard(publishedScorecard);
      } catch (loadError) {
        if (!cancelled) {
          setError('Failed to load this match. Please try again.');
          console.error('Match center load error:', loadError);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadMatchCenter();

    return () => {
      cancelled = true;
    };
  }, [matchId, preferredLeague, searchKey, setCurrentLeague]);
  

  const matchNumber = useMemo(() => {
    if (!match) return 'TBD';
    return getMatchNumberDisplay(match);
  }, [match]);

  const advisory = useMemo(() => getMatchAdvisory(match), [match]);
  const advisoryConfig = useMemo(() => {
    if (!advisory) return null;
    switch (advisory.type) {
      case 'abandoned':
        return { icon: AlertTriangle, border: 'rgba(248,113,113,0.45)', bg: 'rgba(248,113,113,0.12)', accent: '#f87171' };
      case 'reduced-overs':
        return { icon: CloudRain, border: 'rgba(96,165,250,0.45)', bg: 'rgba(96,165,250,0.12)', accent: '#60a5fa' };
      case 'no-result':
        return { icon: AlertTriangle, border: 'rgba(251,191,36,0.5)', bg: 'rgba(251,191,36,0.12)', accent: '#fbbf24' };
      default:
        return { icon: Info, border: 'rgba(148,163,184,0.35)', bg: 'rgba(148,163,184,0.1)', accent: '#cbd5f5' };
    }
  }, [advisory]);
  const AdvisoryIcon = advisoryConfig?.icon;

  const tossMessage = useMemo(() => {
    if (!match) return null;

    if (scorecard?.matchInfo?.toss?.winner && scorecard.matchInfo.toss.decision) {
      return `${scorecard.matchInfo.toss.winner} won the toss and chose to ${scorecard.matchInfo.toss.decision}.`;
    }

    if (match.matchState?.toss?.winner && match.matchState.toss.decision) {
      const tossWinner = match.matchState.toss.winner === 'team1'
        ? (match.team1?.name || 'Team 1')
        : (match.team2?.name || 'Team 2');
      return `${tossWinner} won the toss and chose to ${match.matchState.toss.decision}.`;
    }

    return null;
  }, [match, scorecard]);

  const isPlaying11Visible = useMemo(() => {
    if (!match?.playing11) return false;
    return isPlaying11VisibleNow(match.date, match.time, match.playing11.setAt);
  }, [match]);

  const playing11Message = useMemo(() => {
    if (!match) return 'Match yet to start.';
    if (!match.playing11?.setAt) return 'Match yet to start. Playing 11 will appear once admin publishes it.';
    return getPlaying11VisibilityMessage(match.date, match.time);
  }, [match]);

  const playerMap = useMemo(() => {
    return new Map(players.map((player) => [player.id, player]));
  }, [players]);

  const team1Playing11 = useMemo(() => {
    const team1Ids = Array.isArray(match?.playing11?.team1) ? match.playing11!.team1 : [];
    return team1Ids.map((id) => playerMap.get(id)?.name || id);
  }, [match, playerMap]);

  const team2Playing11 = useMemo(() => {
    const team2Ids = Array.isArray(match?.playing11?.team2) ? match.playing11!.team2 : [];
    return team2Ids.map((id) => playerMap.get(id)?.name || id);
  }, [match, playerMap]);

  const innings = useMemo(() => {
    if (!Array.isArray(scorecard?.innings)) return [];
    return scorecard.innings
      .filter((inning): inning is ScorecardInnings => Boolean(inning))
      .sort((a, b) => (a.inningsNumber ?? 0) - (b.inningsNumber ?? 0));
  }, [scorecard]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b17]">
        <Navbar />
        <div className="h-[70vh] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-[#070b17] text-white">
        <Navbar />
        <main className="relative min-h-[70vh] px-4 py-14 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_20%_10%,rgba(56,189,248,0.16),transparent),radial-gradient(65%_65%_at_80%_85%,rgba(245,158,11,0.14),transparent),linear-gradient(165deg,#070b17_0%,#0d1324_45%,#15182e_100%)]" />
          <div className="relative z-10 max-w-3xl mx-auto rounded-3xl border border-white/15 bg-black/30 backdrop-blur-xl p-8 text-center">
            <p className="text-2xl font-black">{error || 'Match not found.'}</p>
            <p className="text-slate-300 mt-3">Please go back and select another fixture.</p>
            <Link
              href={backHref}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-500/10 px-4 py-2.5 font-semibold text-cyan-100 hover:bg-cyan-500/20 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Matches
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const team1Id = match.team1?.id ?? '';
  const team2Id = match.team2?.id ?? '';
  const team1ShortName = match.team1?.shortName || 'TBD';
  const team2ShortName = match.team2?.shortName || 'TBD';
  const team1Name = match.team1?.name || 'Team 1';
  const team2Name = match.team2?.name || 'Team 2';

  const team1Logo = match.team1?.logo && !String(match.team1.logo).endsWith('.json')
    ? String(match.team1.logo)
    : getAnimatedLogoPath(team1Id, team1ShortName, match.league);
  const team2Logo = match.team2?.logo && !String(match.team2.logo).endsWith('.json')
    ? String(match.team2.logo)
    : getAnimatedLogoPath(team2Id, team2ShortName, match.league);

  const pageOilTheme = match.league === 'wpl'
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

  return (
    <div className="min-h-screen text-white bg-[#070b17]">
      <Navbar />

      <main className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        {/* Oil-canvas background */}
        <div className="absolute inset-0" style={{ background: pageOilTheme.base }} />
        <div className="absolute inset-0" style={{ background: pageOilTheme.hazeA, mixBlendMode: 'screen' }} />
        <div className="absolute inset-0" style={{ background: pageOilTheme.hazeB, mixBlendMode: 'screen' }} />

        <motion.div
          className="absolute -top-32 left-[-14%] w-[72%] h-[36%] rounded-[120px] blur-2xl opacity-80"
          style={{ background: pageOilTheme.brush, transform: 'rotate(-8deg)' }}
          animate={{ x: [0, 10, 0], y: [0, -8, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-28 right-[-12%] w-[70%] h-[34%] rounded-[120px] blur-2xl opacity-70"
          style={{ background: pageOilTheme.brush, transform: 'rotate(9deg)' }}
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

        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 42%, transparent 0%, rgba(2,6,23,0.24) 64%, rgba(2,6,23,0.58) 100%)' }}
        />

        <motion.div
          className="absolute -top-24 right-[-12%] h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.24), transparent 70%)' }}
          animate={{ y: [0, -18, 0], x: [0, 12, 0] }}
          transition={{ duration: 11, ease: 'easeInOut', repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-24 left-[-12%] h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18), transparent 70%)' }}
          animate={{ y: [0, 16, 0], x: [0, -10, 0] }}
          transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }}
        />

        <div className="relative z-10 max-w-6xl mx-auto space-y-6">
          <div>
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Matches
            </Link>
          </div>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/30 p-6 md:p-8 backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <span className="inline-flex items-center rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-xs font-bold tracking-[0.18em] text-cyan-100 uppercase">
                {(match.league || '').toUpperCase()} Match Center
              </span>
              <span className="text-xs font-semibold text-amber-200 bg-amber-500/10 border border-amber-300/35 px-3 py-1 rounded-full">
                {matchNumber}
              </span>
            </div>

            {advisory && advisoryConfig && AdvisoryIcon && (
              <div
                className="mb-5 rounded-2xl border px-4 py-3 text-sm"
                style={{ background: advisoryConfig.bg, borderColor: advisoryConfig.border }}
              >
                <div className="flex items-start gap-3">
                  <AdvisoryIcon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: advisoryConfig.accent }} />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: advisoryConfig.accent }}>
                      {advisory.title}
                    </p>
                    {advisory.detail && (
                      <p className="text-sm text-slate-100/80 mt-0.5">
                        {advisory.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex flex-col items-center text-center gap-2">
                <Image
                  src={team1Logo}
                  alt={`${team1ShortName} logo`}
                  width={84}
                  height={84}
                  className="rounded-2xl object-contain"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = getLogoPath(team1Id);
                  }}
                />
                <p className="text-lg md:text-xl font-black">{team1ShortName}</p>
                <p className="text-xs md:text-sm text-slate-300">{team1Name}</p>
                {match.team1Score && <p className="text-sm font-semibold text-cyan-200">{match.team1Score}</p>}
              </div>

              <div className="px-3 py-2 rounded-xl border border-white/20 bg-white/5 text-xs md:text-sm font-black tracking-[0.2em] text-slate-200">
                VS
              </div>

              <div className="flex flex-col items-center text-center gap-2">
                <Image
                  src={team2Logo}
                  alt={`${team2ShortName} logo`}
                  width={84}
                  height={84}
                  className="rounded-2xl object-contain"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = getLogoPath(team2Id);
                  }}
                />
                <p className="text-lg md:text-xl font-black">{team2ShortName}</p>
                <p className="text-xs md:text-sm text-slate-300">{team2Name}</p>
                {match.team2Score && <p className="text-sm font-semibold text-cyan-200">{match.team2Score}</p>}
              </div>
            </div>

            {(() => {
              const hasOversInfo = Boolean(match.reducedOversTo) || Boolean(match.dlsApplied);
              return (
                <div className={`mt-6 grid gap-3 ${hasOversInfo ? 'md:grid-cols-4' : 'md:grid-cols-3'} text-sm`}>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Date</p>
                    <p className="font-semibold">{match.date ? new Date(match.date).toDateString() : 'TBD'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Time</p>
                    <p className="font-semibold">{formatMatchTime(match.time, match.date)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Venue</p>
                    <p className="font-semibold line-clamp-2">{match.venue}</p>
                  </div>
                  {hasOversInfo && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-slate-400 text-xs uppercase tracking-wide">Overs</p>
                      <p className="font-semibold">
                        {match.reducedOversTo ? `${match.reducedOversTo} per side` : '—'}
                      </p>
                      {match.dlsApplied && (
                        <p className="text-xs text-slate-400 mt-1">DLS applied</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {!scorecard && !isPlaying11Visible && !tossMessage && (
              <div className="mt-6 rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-slate-200">
                Match yet to start. Match data will unlock here once admin publishes scorecard, playing 11, and toss updates.
              </div>
            )}
          </motion.section>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/25 p-6 md:p-8 backdrop-blur-xl"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-cyan-200" />
              <h2 className="text-2xl font-black">Toss Winner</h2>
            </div>

            {tossMessage ? (
              <p className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 text-cyan-50 text-sm md:text-base">
                {tossMessage}
              </p>
            ) : (
              <div className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-slate-300 flex items-center gap-2">
                <Lock size={16} />
                Match yet to start. Toss will show once admin allows it.
              </div>
            )}
          </motion.section>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/25 p-6 md:p-8 backdrop-blur-xl"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-amber-200" />
              <h2 className="text-2xl font-black">Playing 11</h2>
            </div>

            {isPlaying11Visible ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 p-4">
                  <h3 className="font-bold text-cyan-100 mb-3">{team1Name}</h3>
                  <ul className="space-y-2 text-sm">
                    {team1Playing11.map((name) => (
                      <li key={name} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-4">
                  <h3 className="font-bold text-fuchsia-100 mb-3">{team2Name}</h3>
                  <ul className="space-y-2 text-sm">
                    {team2Playing11.map((name) => (
                      <li key={name} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-slate-300">
                <p className="flex items-center gap-2 mb-1"><Lock size={16} /> Playing 11 is locked for now.</p>
                <p className="text-sm text-slate-400">{playing11Message}</p>
              </div>
            )}
          </motion.section>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/25 p-6 md:p-8 backdrop-blur-xl"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-emerald-200" />
              <h2 className="text-2xl font-black">Scorecard</h2>
            </div>

            {scorecard ? (
              <div className="space-y-5">
                {scorecard.result?.winner && (
                  <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4">
                    <p className="text-emerald-100 font-semibold">
                      {scorecard.result.winner}
                      {scorecard.result.margin ? ` won by ${scorecard.result.margin}` : ''}
                    </p>
                  </div>
                )}

                {innings.length === 0 && (
                  <div className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-slate-300">
                    Published scorecard does not have innings data yet.
                  </div>
                )}

                {innings.map((inning, index) => {
                  const isTeam1Batting = String(inning.battingTeamId) === String(team1Id);
                  const battingTeam = isTeam1Batting ? team1Name : team2Name;

                  return (
                    <div key={`${inning.inningsNumber || index}-${battingTeam}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <h3 className="text-lg font-bold">{battingTeam} - Innings {inning.inningsNumber || index + 1}</h3>
                        <span className="text-sm text-cyan-100 bg-cyan-500/15 border border-cyan-300/30 px-3 py-1 rounded-full">
                          {inning.totalRuns || 0}/{inning.totalWickets || 0} ({inning.totalOvers || 0} ov)
                        </span>
                      </div>

                      {inning.batting && inning.batting.length > 0 && (
                        <div className="mb-4 overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-slate-400 border-b border-white/10">
                                <th className="text-left py-2 pr-4">Batter</th>
                                <th className="text-right py-2">R</th>
                                <th className="text-right py-2">B</th>
                                <th className="text-right py-2">4s</th>
                                <th className="text-right py-2">6s</th>
                                <th className="text-right py-2">SR</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inning.batting.map((batter, batterIndex) => (
                                <tr key={`${batter.name || 'batter'}-${batterIndex}`} className="border-b border-white/5 last:border-b-0">
                                  <td className="py-2 pr-4">
                                    <p className="font-medium">{batter.name || 'Unknown'}</p>
                                    {batter.dismissal?.details && (
                                      <p className="text-xs text-slate-400">{batter.dismissal.details}</p>
                                    )}
                                  </td>
                                  <td className="text-right py-2">{batter.runs || 0}</td>
                                  <td className="text-right py-2">{batter.balls || 0}</td>
                                  <td className="text-right py-2">{batter.fours || 0}</td>
                                  <td className="text-right py-2">{batter.sixes || 0}</td>
                                  <td className="text-right py-2">{Number(batter.strikeRate || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {inning.bowling && inning.bowling.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-slate-400 border-b border-white/10">
                                <th className="text-left py-2 pr-4">Bowler</th>
                                <th className="text-right py-2">O</th>
                                <th className="text-right py-2">M</th>
                                <th className="text-right py-2">R</th>
                                <th className="text-right py-2">W</th>
                                <th className="text-right py-2">Econ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inning.bowling.map((bowler, bowlerIndex) => (
                                <tr key={`${bowler.name || 'bowler'}-${bowlerIndex}`} className="border-b border-white/5 last:border-b-0">
                                  <td className="py-2 pr-4 font-medium">{bowler.name || 'Unknown'}</td>
                                  <td className="text-right py-2">{bowler.overs || 0}.{bowler.balls || 0}</td>
                                  <td className="text-right py-2">{bowler.maidens || 0}</td>
                                  <td className="text-right py-2">{bowler.runs || 0}</td>
                                  <td className="text-right py-2">{bowler.wickets || 0}</td>
                                  <td className="text-right py-2">{Number(bowler.economyRate || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-slate-300">
                <p className="flex items-center gap-2 mb-1"><Lock size={16} /> Match yet to start.</p>
                <p className="text-sm text-slate-400">Scorecard will appear once admin publishes it.</p>
              </div>
            )}
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
