'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { News, Highlight, Team, Player, Match } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';

interface ProfileResponse {
  profile?: {
    id: string;
    email: string;
    name?: string;
    displayName?: string;
    favoriteTeamIds?: string[];
    favoritePlayerIds?: string[];
  };
}

interface FeedItem {
  id: string;
  kind: 'news' | 'highlight';
  title: string;
  summary: string;
  imageUrl?: string;
  date: string;
  category?: string;
  score: number;
  news?: News;
  highlight?: Highlight;
}

export default function FeedPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [profileName, setProfileName] = useState<string>('');
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<string[]>([]);
  const [favoritePlayerIds, setFavoritePlayerIds] = useState<string[]>([]);

  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
        : null;

    if (!token) {
      setIsAuthenticated(false);
      setProfileLoading(false);
      return;
    }

    setIsAuthenticated(true);

    const loadProfile = async () => {
      try {
        const res = await fetch('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          setProfileLoading(false);
          return;
        }
        const data = (await res.json()) as ProfileResponse;
        const p = data.profile;
        if (p) {
          setProfileName(p.displayName || p.name || p.email);
          setFavoriteTeamIds(p.favoriteTeamIds || []);
          setFavoritePlayerIds(p.favoritePlayerIds || []);
        }
      } catch (e) {
        console.error('Failed to load profile for feed:', e);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, playersData, matchesData, newsData, highlightsData] = await Promise.all([
          api.getTeams(),
          api.getPlayers(),
          api.getMatches(),
          api.getNews(),
          api.getHighlights(),
        ]);

        setTeams(teamsData);
        setPlayers(playersData);
        setMatches(matchesData);
        setNews(newsData);
        setHighlights(highlightsData);
      } catch (e) {
        console.error('Failed to load feed data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleToggleTeam = (teamId: string) => {
    setFavoriteTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId],
    );
  };

  const handleTogglePlayer = (playerId: string) => {
    setFavoritePlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId],
    );
  };

  const handleSavePreferences = async () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
        : null;

    if (!token) {
      alert('Please sign in to save your preferences.');
      return;
    }

    setSavingPrefs(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: profileName,
          favoriteTeamIds,
          favoritePlayerIds,
        }),
      });

      if (!res.ok) {
        alert('Failed to save preferences');
        return;
      }
    } catch (e) {
      console.error('Failed to save preferences:', e);
      alert('Error saving preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const favoriteTeamsSet = useMemo(() => new Set(favoriteTeamIds), [favoriteTeamIds]);
  const favoritePlayersSet = useMemo(() => new Set(favoritePlayerIds), [favoritePlayerIds]);

  const feedItems: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];

    const scoreNews = (item: News): { score: number; ts: number } => {
      let score = 0;
      const teamIds = (item.linkedTeamIds || []) as string[];
      const playerIds = (item.linkedPlayerIds || []) as string[];

      if (teamIds.some((id) => favoriteTeamsSet.has(id))) {
        score += 5;
      }
      if (playerIds.some((id) => favoritePlayersSet.has(id))) {
        score += 6;
      }

      if (item.category === 'team' && teamIds.some((id) => favoriteTeamsSet.has(id))) {
        score += 2;
      }
      if (item.category === 'player' && playerIds.some((id) => favoritePlayersSet.has(id))) {
        score += 2;
      }

      const ts = new Date((item as any).publishedAt || (item as any).createdAt || '').getTime() || 0;
      return { score, ts };
    };

    const scoreHighlight = (h: Highlight): { score: number; ts: number } => {
      let score = 0;
      const match = matches.find((m) => m.id === h.matchId);
      if (match) {
        if (favoriteTeamsSet.has(match.team1.id) || favoriteTeamsSet.has(match.team2.id)) {
          score += 4;
        }
      }
      const ts = 0; // Highlights lack a timestamp; keep 0 to sort behind recent news when scores tie
      return { score, ts };
    };

    news.forEach((n) => {
      const { score, ts } = scoreNews(n);
      items.push({
        id: n.id,
        kind: 'news',
        title: n.title,
        summary: n.summary || n.content,
        imageUrl: (n as any).image || (n as any).imageUrl,
        date: (n as any).publishedAt || (n as any).createdAt || '',
        category: n.category,
        score,
        news: n,
      });
    });

    highlights.forEach((h) => {
      const { score, ts } = scoreHighlight(h);
      items.push({
        id: h.id,
        kind: 'highlight',
        title: h.title,
        summary: h.description,
        imageUrl: h.thumbnail,
        date: '',
        category: 'highlight',
        score,
        highlight: h,
      });
    });

    items.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ta = new Date(a.date || 0).getTime() || 0;
      const tb = new Date(b.date || 0).getTime() || 0;
      return tb - ta;
    });

    return items;
  }, [news, highlights, matches, favoriteTeamsSet, favoritePlayersSet]);

  const favoriteTeams = teams.filter((t) => favoriteTeamsSet.has(t.id));
  const favoritePlayers = players.filter((p) => favoritePlayersSet.has(p.id));

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

      <main className="relative py-16 min-h-screen overflow-hidden bg-ipl-dark">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold flex items-center gap-2">
                <Icon name="star" size={16} /> FOR YOU
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
              Personalized <span className="bg-gradient-to-r from-ipl-blue-light via-ipl-gold to-ipl-purple bg-clip-text text-transparent">Feed</span>
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl">
              Pick your favorite teams and players to see news and highlights that matter most to you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Preferences */}
            <section className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Icon name="settings" size={16} /> Your preferences
              </h2>

              {isAuthenticated ? (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Display name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/30 transition-all"
                      placeholder="How should we refer to you?"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      Favorite teams
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {teams.map((team) => {
                        const active = favoriteTeamsSet.has(team.id);
                        return (
                          <button
                            key={team.id}
                            type="button"
                            onClick={() => handleToggleTeam(team.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              active
                                ? 'bg-ipl-gold/20 text-ipl-gold border-ipl-gold/60'
                                : 'bg-white/5 text-gray-300 border-white/20 hover:bg-white/10'
                            }`}
                          >
                            {team.shortName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      Favorite players
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {players.map((player) => {
                        const active = favoritePlayersSet.has(player.id);
                        return (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => handleTogglePlayer(player.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              active
                                ? 'bg-ipl-purple/25 text-ipl-purple border-ipl-purple/60'
                                : 'bg-white/5 text-gray-300 border-white/20 hover:bg-white/10'
                            }`}
                          >
                            {player.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    disabled={savingPrefs}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-ipl-gold to-ipl-purple text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingPrefs ? 'Saving…' : 'Save preferences'}
                  </button>

                  {(favoriteTeams.length > 0 || favoritePlayers.length > 0) && (
                    <div className="mt-4 text-xs text-gray-300 space-y-1">
                      {favoriteTeams.length > 0 && (
                        <div>
                          <span className="text-gray-400">Teams you follow: </span>
                          <span className="text-gray-100">
                            {favoriteTeams.map((t) => t.shortName).join(', ')}
                          </span>
                        </div>
                      )}
                      {favoritePlayers.length > 0 && (
                        <div>
                          <span className="text-gray-400">Players you follow: </span>
                          <span className="text-gray-100">
                            {favoritePlayers.map((p) => p.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">
                  Sign in from the live score or chat page to save your favorites and get a fully
                  personalized feed. For now, you&apos;ll see the latest news and highlights.
                </p>
              )}
            </section>

            {/* Right: Feed */}
            <section className="lg:col-span-2 space-y-4">
              {feedItems.length === 0 ? (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center text-gray-300">
                  No content available right now. Check back later once there are more news and
                  highlights.
                </div>
              ) : (
                feedItems.map((item) => (
                  <article
                    key={`${item.kind}-${item.id}`}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-ipl-gold/50 transition-all duration-300 hover:shadow-2xl hover:shadow-ipl-gold/20 transform hover:scale-[1.01] cursor-pointer"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3">
                      <div className="md:col-span-1 h-40 md:h-full overflow-hidden relative">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800/60">
                            <Icon name={item.kind === 'news' ? 'news' : 'trophy'} size={32} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      </div>

                      <div className="md:col-span-2 p-5 md:p-6 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${
                                item.kind === 'news'
                                  ? 'bg-blue-500/15 text-blue-300 border-blue-400/40'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-400/40'
                              }`}
                            >
                              {item.kind === 'news' ? 'NEWS' : 'HIGHLIGHT'}
                            </span>
                            {item.category && (
                              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/20 text-[10px] text-gray-200">
                                {item.category.toUpperCase()}
                              </span>
                            )}
                          </div>
                          {item.date && (
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                          )}
                        </div>

                        <h2 className="text-lg md:text-xl font-bold text-white group-hover:text-ipl-gold transition-colors line-clamp-2">
                          {item.title}
                        </h2>

                        <p className="text-sm text-gray-300 line-clamp-3 flex-1">
                          {item.summary}
                        </p>

                        <div className="flex items-center justify-between pt-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            {(favoriteTeams.length > 0 || favoritePlayers.length > 0) && item.score > 0 && (
                              <>
                                <Icon name="sparkles" size={14} />
                                <span>
                                  Prioritized for you
                                  {item.kind === 'highlight' ? ' (favorite team match)' : ''}
                                </span>
                              </>
                            )}
                          </div>
                          {item.kind === 'news' && item.news && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/20"
                              onClick={() => {
                                window.open(`/news/${item.id}`, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              Read full story
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7h4m0 0v4m0-4L10 14"
                                />
                              </svg>
                            </button>
                          )}
                          {item.kind === 'highlight' && item.highlight && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 border border-emerald-400/40"
                            >
                              Watch highlight
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
