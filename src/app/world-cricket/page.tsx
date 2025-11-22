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
    const hasLiveFlag =
      status.includes('live') ||
      status.includes('in progress') ||
      status.includes('innings break');

    let dt: Date | null = null;
    if (m.dateTimeGMT) {
      const parsed = new Date(m.dateTimeGMT);
      if (!Number.isNaN(parsed.getTime())) {
        dt = parsed;
      }
    }

    if (hasLiveFlag) {
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
  const [activeTab, setActiveTab] = useState<WorldCricketTab>('live');

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/cricketdata-live');
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
              Browse fixtures, live games, and recent results from international and domestic cricket, powered by
              CricketData. This view complements your IPL live score by giving you a wider world‑cricket radar.
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
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 hover:border-ipl-gold/60 transition-all duration-300 hover:shadow-xl hover:shadow-ipl-gold/25 group"
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

          <p className="text-[10px] text-gray-500 mt-4 max-w-xl">
            Data for this section is provided by CricketData.org via their free eCricScore API (+/‑ 7 days fixtures,
            live games, and recent results). Timings are shown in your local timezone.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
