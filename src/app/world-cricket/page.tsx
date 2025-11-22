'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';

interface CricketDataTeamInfo {
  name?: string;
  shortname?: string;
  img?: string;
}

interface CricketDataMatch {
  id: string | null;
  name: string;
  status: string;
  score: string;
  teams: string[];
  teamInfo?: CricketDataTeamInfo[];
  venue?: string;
  dateTimeGMT?: string;
  matchType?: string;
  team1ScoreText?: string;
  team2ScoreText?: string;
  seriesName?: string;
}

type WorldCricketTab = 'live' | 'upcoming' | 'recent' | 'all';

interface GroupedMatches {
  live: CricketDataMatch[];
  upcoming: CricketDataMatch[];
  recent: CricketDataMatch[];
}

function classifyMatches(matches: CricketDataMatch[]): GroupedMatches {
  const now = new Date();
  const grouped: GroupedMatches = { live: [], upcoming: [], recent: [] };

  matches.forEach((m) => {
    const status = (m.status || '').toLowerCase();
    const isFinished =
      status.includes('won') ||
      status.includes('lost') ||
      status.includes('tied') ||
      status.includes('tie') ||
      status.includes('draw') ||
      status.includes('no result') ||
      status.includes('abandoned') ||
      status.includes('washout') ||
      status.includes('result');

    const hasLiveFlag =
      status.includes('live') ||
      status.includes('in progress') ||
      status.includes('innings') ||
      (status.includes('day') && !isFinished);

    let dt: Date | null = null;
    if (m.dateTimeGMT) {
      const parsed = new Date(m.dateTimeGMT);
      if (!Number.isNaN(parsed.getTime())) {
        dt = parsed;
      }
    }

    let isLive = hasLiveFlag;
    if (!isLive && dt) {
      const start = dt.getTime();
      const preWindow = start - 60 * 60 * 1000; // 1 hour before
      const postWindow = start + 8 * 60 * 60 * 1000; // up to 8 hours after
      const nowMs = now.getTime();
      if (nowMs >= preWindow && nowMs <= postWindow && !isFinished) {
        isLive = true;
      }
    }

    if (isLive) {
      grouped.live.push(m);
    } else if (dt && dt.getTime() > now.getTime()) {
      grouped.upcoming.push(m);
    } else {
      grouped.recent.push(m);
    }
  });

  return grouped;
}

function formatLocalDateTime(dateTimeGMT?: string): string {
  if (!dateTimeGMT) return '';
  const d = new Date(dateTimeGMT);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WorldCricketPage() {
  const [matches, setMatches] = useState<CricketDataMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorldCricketTab>('all');
  const [selectedMatch, setSelectedMatch] = useState<CricketDataMatch | null>(null);
  const [scorecard, setScorecard] = useState<any | null>(null);
  const [isScorecardLoading, setIsScorecardLoading] = useState(false);
  const [scorecardError, setScorecardError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/cricbuzz-matches');
        if (!res.ok) {
          throw new Error(`Failed to load world cricket scores: ${res.status}`);
        }
        const json = await res.json();
        if (cancelled) return;

        const data = Array.isArray(json?.matches) ? json.matches : [];
        setMatches(data as CricketDataMatch[]);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Error loading world cricket scores:', err);
        setError('Could not load global live scores right now. Please try again in a moment.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedMatch?.id) {
      setScorecard(null);
      setScorecardError(null);
      setIsScorecardLoading(false);
      return;
    }

    let cancelled = false;

    const fetchScorecard = async () => {
      setIsScorecardLoading(true);
      setScorecardError(null);
      try {
        const res = await fetch(`/api/cricbuzz-scorecard?matchId=${encodeURIComponent(selectedMatch.id!)}`);
        if (!res.ok) {
          throw new Error(`Failed to load scorecard: ${res.status}`);
        }
        const json = await res.json();
        if (cancelled) return;
        setScorecard(json?.scorecard ?? null);
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading scorecard:', err);
        setScorecardError('Could not load full scorecard for this match.');
      } finally {
        if (!cancelled) {
          setIsScorecardLoading(false);
        }
      }
    };

    fetchScorecard();

    return () => {
      cancelled = true;
    };
  }, [selectedMatch?.id]);

  const grouped = useMemo(() => classifyMatches(matches), [matches]);

  const filteredMatches = useMemo(() => {
    switch (activeTab) {
      case 'live':
        return grouped.live;
      case 'upcoming':
        return grouped.upcoming;
      case 'recent':
        return grouped.recent;
      case 'all':
      default:
        return matches;
    }
  }, [activeTab, grouped.live, grouped.upcoming, grouped.recent, matches]);

  const scoreCards = useMemo(() => {
    if (!scorecard) return [];
    const raw: any = scorecard;
    if (Array.isArray(raw.scoreCard)) return raw.scoreCard;
    if (Array.isArray(raw.scorecard)) return raw.scorecard;
    return [];
  }, [scorecard]);

  const hasAnyMatches = matches.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-ipl-dark">
      <Navbar />

      <main className="relative flex-1 py-12 overflow-hidden">
        <AuroraBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <section className="space-y-3 animate-slide-up">
            <div className="inline-flex items-center space-x-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold flex items-center gap-2">
                <Icon name="cricket" size={16} />
                GLOBAL LIVE CRICKET
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Live & Recent
              <span className="block bg-gradient-to-r from-ipl-blue-light via-ipl-gold to-ipl-purple bg-clip-text text-transparent mt-1">
                Matches Around the World
              </span>
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl">
              Browse fixtures, live games, and recent results from international and domestic cricket. This view
              complements your IPL live score by giving you a wider world‑cricket radar.
            </p>
          </section>

          {/* Tabs */}
          <div className="inline-flex items-center gap-1 bg-black/40 border border-white/10 rounded-full px-1 py-1 text-[11px]">
            {[
              { key: 'live' as WorldCricketTab, label: 'Live now' },
              { key: 'upcoming' as WorldCricketTab, label: 'Upcoming' },
              { key: 'recent' as WorldCricketTab, label: 'Recent results' },
              { key: 'all' as WorldCricketTab, label: 'All (+/- 7 days)' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-ipl-blue-dark to-ipl-purple text-white shadow-sm shadow-ipl-purple/40 border border-ipl-gold/40'
                    : 'bg-transparent text-gray-300 border border-transparent hover:border-white/20 hover:bg-white/5'
                }`}
              >
                {tab.label}
                {tab.key === 'live' && grouped.live.length > 0 && (
                  <span className="ml-1 inline-flex w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto rounded-2xl bg-red-900/30 border border-red-500/50 p-6 text-center text-sm text-red-100">
              <p className="font-semibold mb-1">Could not load world cricket scores.</p>
              <p className="text-red-200/80 mb-2">{error}</p>
              <p className="text-xs text-red-200/70">
                This data comes from a third‑party provider. Please refresh the page or try again later.
              </p>
            </div>
          ) : !hasAnyMatches ? (
            <div className="max-w-md mx-auto rounded-2xl bg-white/5 border border-white/15 p-6 text-center text-sm text-gray-200">
              <p className="font-semibold mb-1">No external matches to show right now.</p>
              <p className="text-gray-400 text-xs">
                We could not find any fixtures in the last or next 7 days from the external feed.
              </p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="max-w-md mx-auto rounded-2xl bg-white/5 border border-white/15 p-6 text-center text-sm text-gray-200">
              <p className="font-semibold mb-1">No matches in this bucket yet.</p>
              <p className="text-gray-400 text-xs">
                Try switching to another tab (for example, Recent or All) to see more matches.
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredMatches.map((m) => {
                const teamA = m.teams?.[0] || m.teamInfo?.[0]?.shortname || m.teamInfo?.[0]?.name || '';
                const teamB = m.teams?.[1] || m.teamInfo?.[1]?.shortname || m.teamInfo?.[1]?.name || '';
                const matchup = teamA && teamB ? `${teamA} vs ${teamB}` : m.name || 'Cricket match';
                const dateLabel = formatLocalDateTime(m.dateTimeGMT);
                const status = m.status || '';
                const score = m.score || '';
                const matchType = m.matchType || '';

                const isLive = (status || '').toLowerCase().includes('live');

                return (
                  <article
                    key={m.id || `${matchup}-${dateLabel}`}
                    onClick={() => setSelectedMatch(m)}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 hover:border-ipl-gold/60 transition-all duration-300 hover:shadow-xl hover:shadow-ipl-gold/25 group cursor-pointer"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-ipl-blue-light/10 via-ipl-gold/10 to-ipl-purple/10" />
                    </div>

                    <div className="relative p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                            {matchType || 'Cricket'}
                          </p>
                          <h2 className="text-sm font-bold text-white line-clamp-2">{matchup}</h2>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isLive
                                ? 'bg-red-500/15 text-red-300 border-red-400/60'
                                : status.toLowerCase().includes('finished') || status.toLowerCase().includes('result')
                                ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/60'
                                : 'bg-slate-500/20 text-slate-200 border-slate-400/50'
                            }`}
                          >
                            {isLive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            )}
                            <span>{status || (isLive ? 'Live' : 'Scheduled')}</span>
                          </span>
                          {dateLabel && (
                            <span className="text-[10px] text-gray-400">{dateLabel}</span>
                          )}
                        </div>
                      </div>

                      {score && (
                        <div className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-[12px] text-ipl-gold font-semibold">
                          {score}
                        </div>
                      )}

                      {m.venue && (
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-ipl-gold" />
                          <span className="line-clamp-1">{m.venue}</span>
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>

      <Footer />

      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedMatch(null)}
          />
          <div className="relative z-10 w-full max-w-xl mx-4 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 border border-white/10 shadow-2xl p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
                  {selectedMatch.matchType || 'Cricket'}
                </p>
                <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                  {(() => {
                    const teamA =
                      selectedMatch.teams?.[0] ||
                      selectedMatch.teamInfo?.[0]?.shortname ||
                      selectedMatch.teamInfo?.[0]?.name ||
                      '';
                    const teamB =
                      selectedMatch.teams?.[1] ||
                      selectedMatch.teamInfo?.[1]?.shortname ||
                      selectedMatch.teamInfo?.[1]?.name ||
                      '';
                    const matchup = teamA && teamB ? `${teamA} vs ${teamB}` : selectedMatch.name;
                    return matchup || 'Cricket match';
                  })()}
                </h2>
                {selectedMatch.dateTimeGMT && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    {formatLocalDateTime(selectedMatch.dateTimeGMT)}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${(() => {
                    const status = (selectedMatch.status || '').toLowerCase();
                    const isLive = status.includes('live') || status.includes('in progress');
                    if (isLive) return 'bg-red-500/15 text-red-300 border-red-400/60';
                    if (status.includes('finished') || status.includes('result'))
                      return 'bg-emerald-500/15 text-emerald-200 border-emerald-400/60';
                    return 'bg-slate-500/20 text-slate-200 border-slate-400/50';
                  })()}`}
                >
                  {(() => {
                    const status = selectedMatch.status || '';
                    return status || 'Scheduled';
                  })()}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/30 text-gray-300 hover:text-white hover:border-ipl-gold/70 hover:bg-white/5 text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Teams pill row */}
            <div className="flex items-center justify-between gap-4 mb-4">
              {['A', 'B'].map((slot, idx) => {
                const info = selectedMatch.teamInfo?.[idx];
                const code = selectedMatch.teams?.[idx];
                const label = info?.shortname || info?.name || code || `Team ${idx + 1}`;
                const initials = (label || 'T')
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 3)
                  .toUpperCase();
                const isFirst = idx === 0;
                return (
                  <div
                    key={slot}
                    className="flex-1 flex items-center gap-3 rounded-2xl bg-slate-900/70 border border-white/10 px-3 py-2"
                  >
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-2xl text-xs font-bold text-white ${
                        isFirst
                          ? 'bg-gradient-to-br from-ipl-blue-light to-ipl-purple'
                          : 'bg-gradient-to-br from-ipl-gold to-ipl-purple'
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{label}</p>
                      {info?.name && info?.shortname && info.name !== info.shortname && (
                        <p className="text-[10px] text-gray-400 truncate">{info.name}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Score & venue */}
            {(selectedMatch.team1ScoreText || selectedMatch.team2ScoreText) ? (
              <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0, 1].map((idx) => {
                  const info = selectedMatch.teamInfo?.[idx];
                  const code = selectedMatch.teams?.[idx];
                  const label = info?.shortname || info?.name || code || `Team ${idx + 1}`;
                  const scoreText = idx === 0 ? selectedMatch.team1ScoreText : selectedMatch.team2ScoreText;
                  if (!label && !scoreText) return null;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl bg-black/40 border border-ipl-gold/40 px-4 py-3 flex flex-col gap-1"
                    >
                      <span className="text-xs font-semibold text-gray-200 truncate">{label}</span>
                      {scoreText ? (
                        <span className="text-sm font-bold text-ipl-gold">{scoreText}</span>
                      ) : (
                        <span className="text-[11px] text-gray-400">No score yet</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              selectedMatch.score && (
                <div className="rounded-2xl bg-black/40 border border-ipl-gold/40 px-4 py-3 mb-3 text-sm text-ipl-gold font-semibold">
                  {selectedMatch.score}
                </div>
              )
            )}

            {selectedMatch.venue && (
              <div className="flex items-center gap-2 text-[11px] text-gray-300 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ipl-gold" />
                <span className="truncate">{selectedMatch.venue}</span>
              </div>
            )}

            {/* Full scorecard (batting & bowling) */}
            <div className="mt-3 space-y-3">
              {isScorecardLoading ? (
                <p className="text-[11px] text-gray-400">Loading full scorecard...</p>
              ) : scorecardError ? (
                <p className="text-[11px] text-red-300">{scorecardError}</p>
              ) : scoreCards.length > 0 ? (
                (() => {
                  const first = scoreCards[0] as any;
                  const batTeam = first?.batTeamDetails || first?.batTeam || {};
                  const bowlTeam = first?.bowlTeamDetails || first?.bowlTeam || {};

                  const batsmen: any[] = Array.isArray(batTeam.batsmenData)
                    ? batTeam.batsmenData
                    : Array.isArray(batTeam.batsmen)
                    ? batTeam.batsmen
                    : Array.isArray(batTeam.players)
                    ? batTeam.players
                    : [];

                  const bowlers: any[] = Array.isArray(bowlTeam.bowlersData)
                    ? bowlTeam.bowlersData
                    : Array.isArray(bowlTeam.bowlers)
                    ? bowlTeam.bowlers
                    : Array.isArray(bowlTeam.players)
                    ? bowlTeam.players
                    : [];

                  const batTeamName = batTeam.batTeamName || batTeam.teamName || '';
                  const bowlTeamName = bowlTeam.bowlTeamName || bowlTeam.teamName || '';

                  const hasBatting = batsmen.length > 0;
                  const hasBowling = bowlers.length > 0;

                  if (!hasBatting && !hasBowling) {
                    return (
                      <p className="text-[11px] text-gray-400">
                        Full scorecard data is not available yet for this match.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {hasBatting && (
                        <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-3">
                          <p className="text-[11px] font-semibold text-gray-200 mb-2">
                            Batting{batTeamName ? `  b7 ${batTeamName}` : ''}
                          </p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-[11px] text-gray-200">
                              <thead className="text-[10px] uppercase tracking-wide text-gray-400 border-b border-white/10">
                                <tr>
                                  <th className="text-left py-1 pr-2">Batter</th>
                                  <th className="text-right py-1 px-2">R(B)</th>
                                  <th className="text-right py-1 px-2">4s</th>
                                  <th className="text-right py-1 px-2">6s</th>
                                  <th className="text-right py-1 pl-2">SR</th>
                                </tr>
                              </thead>
                              <tbody>
                                {batsmen.map((batter, idx) => {
                                  const name =
                                    batter.batName ||
                                    batter.batsmanName ||
                                    batter.name ||
                                    batter.playerName ||
                                    '-';
                                  const runs =
                                    batter.runs ??
                                    batter.runsScored ??
                                    batter.r ??
                                    null;
                                  const balls = batter.balls ?? batter.b ?? null;
                                  const fours =
                                    batter.fours ??
                                    batter['4s'] ??
                                    batter.foursHit ??
                                    null;
                                  const sixes =
                                    batter.sixes ??
                                    batter['6s'] ??
                                    batter.sixesHit ??
                                    null;
                                  const sr =
                                    batter.strikeRate ??
                                    batter.sr ??
                                    null;

                                  const runsBalls =
                                    runs !== null && balls !== null
                                      ? `${runs} (${balls})`
                                      : runs !== null
                                      ? String(runs)
                                      : '';

                                  return (
                                    <tr key={idx} className="border-b border-white/5 last:border-0">
                                      <td className="py-1 pr-2 max-w-[140px] truncate">{name}</td>
                                      <td className="py-1 px-2 text-right">{runsBalls}</td>
                                      <td className="py-1 px-2 text-right">{fours ?? ''}</td>
                                      <td className="py-1 px-2 text-right">{sixes ?? ''}</td>
                                      <td className="py-1 pl-2 text-right">{sr ?? ''}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {hasBowling && (
                        <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-3">
                          <p className="text-[11px] font-semibold text-gray-200 mb-2">
                            Bowling{bowlTeamName ? `  b7 ${bowlTeamName}` : ''}
                          </p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-[11px] text-gray-200">
                              <thead className="text-[10px] uppercase tracking-wide text-gray-400 border-b border-white/10">
                                <tr>
                                  <th className="text-left py-1 pr-2">Bowler</th>
                                  <th className="text-right py-1 px-2">O</th>
                                  <th className="text-right py-1 px-2">M</th>
                                  <th className="text-right py-1 px-2">R</th>
                                  <th className="text-right py-1 px-2">W</th>
                                  <th className="text-right py-1 pl-2">Econ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bowlers.map((bowler, idx) => {
                                  const name =
                                    bowler.bowlName ||
                                    bowler.bowlerName ||
                                    bowler.name ||
                                    bowler.playerName ||
                                    '-';
                                  const overs = bowler.overs ?? bowler.o ?? null;
                                  const maidens = bowler.maidens ?? bowler.m ?? null;
                                  const runs = bowler.runs ?? bowler.r ?? null;
                                  const wickets = bowler.wickets ?? bowler.w ?? null;
                                  const econ = bowler.economy ?? bowler.econ ?? null;

                                  return (
                                    <tr key={idx} className="border-b border-white/5 last:border-0">
                                      <td className="py-1 pr-2 max-w-[140px] truncate">{name}</td>
                                      <td className="py-1 px-2 text-right">{overs ?? ''}</td>
                                      <td className="py-1 px-2 text-right">{maidens ?? ''}</td>
                                      <td className="py-1 px-2 text-right">{runs ?? ''}</td>
                                      <td className="py-1 px-2 text-right">{wickets ?? ''}</td>
                                      <td className="py-1 pl-2 text-right">{econ ?? ''}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : null}
            </div>

            <div className="mt-3 rounded-2xl bg-slate-900/70 border border-white/10 px-4 py-3 text-[11px] text-gray-300">
              <p className="font-semibold text-gray-100 mb-1">Match context</p>
              <p>
                This match comes from the external world‑cricket feed for the last and next few days. Use the tabs at
                the top of the page to switch between live, upcoming, and recent games.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
