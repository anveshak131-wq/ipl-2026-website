'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Lock, Trophy, Users } from 'lucide-react';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useLeague } from '@/contexts/LeagueContext';
import { api } from '@/lib/data';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import { getMatchNumberDisplay } from '@/lib/matchNumberUtils';
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

async function fetchPublishedScorecard(matchId: string): Promise<PublishedScorecard | null> {
  try {
    const response = await fetch(`/api/scorecards?matchId=${matchId}`);
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
        const leagues: League[] = preferredLeague
          ? [preferredLeague, preferredLeague === 'ipl' ? 'wpl' : 'ipl']
          : ['ipl', 'wpl'];

        const leagueMatchLists = await Promise.all(leagues.map((league) => api.getMatches(league)));
        const allMatches = leagueMatchLists.flat();
        const selectedMatch = allMatches.find((item) => item.id === matchId) || null;

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
          fetchPublishedScorecard(selectedMatch.id),
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
  }, [matchId, preferredLeague, setCurrentLeague]);

  const matchNumber = useMemo(() => {
    if (!match) return 'TBD';
    return getMatchNumberDisplay(match);
  }, [match]);

  const tossMessage = useMemo(() => {
    if (!match) return null;

    if (scorecard?.matchInfo?.toss?.winner && scorecard.matchInfo.toss.decision) {
      return `${scorecard.matchInfo.toss.winner} won the toss and chose to ${scorecard.matchInfo.toss.decision}.`;
    }

    if (match.matchState?.toss?.winner && match.matchState.toss.decision) {
      const tossWinner = match.matchState.toss.winner === 'team1' ? match.team1.name : match.team2.name;
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
    if (!match?.playing11?.team1) return [];
    return match.playing11.team1.map((id) => playerMap.get(id)?.name || id);
  }, [match, playerMap]);

  const team2Playing11 = useMemo(() => {
    if (!match?.playing11?.team2) return [];
    return match.playing11.team2.map((id) => playerMap.get(id)?.name || id);
  }, [match, playerMap]);

  const innings = useMemo(() => {
    if (!scorecard?.innings) return [];
    return [...scorecard.innings].sort((a, b) => (a.inningsNumber || 0) - (b.inningsNumber || 0));
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

  const team1Logo = match.team1.logo && !match.team1.logo.endsWith('.json')
    ? match.team1.logo
    : getAnimatedLogoPath(match.team1.id, match.team1.shortName || '', match.league);
  const team2Logo = match.team2.logo && !match.team2.logo.endsWith('.json')
    ? match.team2.logo
    : getAnimatedLogoPath(match.team2.id, match.team2.shortName || '', match.league);

  return (
    <div className="min-h-screen text-white bg-[#070b17]">
      <Navbar />

      <main className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(75%_75%_at_10%_5%,rgba(45,212,191,0.2),transparent),radial-gradient(65%_65%_at_90%_85%,rgba(245,158,11,0.16),transparent),radial-gradient(50%_50%_at_50%_45%,rgba(99,102,241,0.12),transparent),linear-gradient(168deg,#070b17_0%,#111b2e_45%,#171a33_100%)]" />

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
                {match.league.toUpperCase()} Match Center
              </span>
              <span className="text-xs font-semibold text-amber-200 bg-amber-500/10 border border-amber-300/35 px-3 py-1 rounded-full">
                {matchNumber}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex flex-col items-center text-center gap-2">
                <Image
                  src={team1Logo}
                  alt={`${match.team1.shortName} logo`}
                  width={84}
                  height={84}
                  className="rounded-2xl object-contain"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = getLogoPath(match.team1.id);
                  }}
                />
                <p className="text-lg md:text-xl font-black">{match.team1.shortName}</p>
                <p className="text-xs md:text-sm text-slate-300">{match.team1.name}</p>
                {match.team1Score && <p className="text-sm font-semibold text-cyan-200">{match.team1Score}</p>}
              </div>

              <div className="px-3 py-2 rounded-xl border border-white/20 bg-white/5 text-xs md:text-sm font-black tracking-[0.2em] text-slate-200">
                VS
              </div>

              <div className="flex flex-col items-center text-center gap-2">
                <Image
                  src={team2Logo}
                  alt={`${match.team2.shortName} logo`}
                  width={84}
                  height={84}
                  className="rounded-2xl object-contain"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = getLogoPath(match.team2.id);
                  }}
                />
                <p className="text-lg md:text-xl font-black">{match.team2.shortName}</p>
                <p className="text-xs md:text-sm text-slate-300">{match.team2.name}</p>
                {match.team2Score && <p className="text-sm font-semibold text-cyan-200">{match.team2Score}</p>}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400 text-xs uppercase tracking-wide">Date</p>
                <p className="font-semibold">{new Date(match.date).toDateString()}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400 text-xs uppercase tracking-wide">Time</p>
                <p className="font-semibold">{formatMatchTime(match.time, match.date)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400 text-xs uppercase tracking-wide">Venue</p>
                <p className="font-semibold line-clamp-2">{match.venue}</p>
              </div>
            </div>

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
                  <h3 className="font-bold text-cyan-100 mb-3">{match.team1.name}</h3>
                  <ul className="space-y-2 text-sm">
                    {team1Playing11.map((name) => (
                      <li key={name} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-4">
                  <h3 className="font-bold text-fuchsia-100 mb-3">{match.team2.name}</h3>
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
                  const isTeam1Batting = inning.battingTeamId === match.team1.id;
                  const battingTeam = isTeam1Batting ? match.team1.name : match.team2.name;

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
                                  <td className="text-right py-2">{(batter.strikeRate || 0).toFixed(2)}</td>
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
                                  <td className="text-right py-2">{(bowler.economyRate || 0).toFixed(2)}</td>
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
