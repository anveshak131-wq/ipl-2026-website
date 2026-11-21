'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Bookmark, ExternalLink, Flame, Newspaper, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import type { News, Player, Team } from '@/types';
import { api } from '@/lib/data';
import { getArticleReadTime, NEWS_2027_ARTICLES } from '@/lib/news2027';
import { useLeague } from '@/contexts/LeagueContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import NewsHeroHeader, { type LeagueScope } from '@/components/news/NewsHeroHeader';
import NewsFeaturedSpotlight from '@/components/news/NewsFeaturedSpotlight';
import NewsCommandBar, {
  type NewsCategoryFilter,
  type NewsSortOption,
  type NewsViewMode,
} from '@/components/news/NewsCommandBar';
import NewsCard from '@/components/news/NewsCard';
import NewsModal from '@/components/news/NewsModal';
import NewsSkeleton from '@/components/news/NewsSkeleton';

const BOOKMARKS_STORAGE_KEY = 'sportsup99_news_2027_bookmarks';

function matchesLeagueScope(article: News, scope: LeagueScope): boolean {
  if (scope === 'all') return true;
  const artLeague = article.league || 'ipl';
  return artLeague === scope || artLeague === 'both';
}

export interface UnifiedNewsViewProps {
  pageContext?: 'ipl' | 'wpl' | 'common';
  initialLeagueScope?: LeagueScope;
  lockedLeague?: 'ipl' | 'wpl';
}

export default function UnifiedNewsView({
  pageContext = 'common',
  initialLeagueScope = 'all',
  lockedLeague,
}: UnifiedNewsViewProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { setCurrentLeague } = useLeague();

  const [news, setNews] = useState<News[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default scope depends on route context
  const [leagueScope, setLeagueScope] = useState<LeagueScope>(
    lockedLeague || initialLeagueScope
  );
  const [selectedCategory, setSelectedCategory] = useState<NewsCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [sortBy, setSortBy] = useState<NewsSortOption>('latest');
  const [viewMode, setViewMode] = useState<NewsViewMode>('grid');

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ensure currentLeague context matches dedicated route
  useEffect(() => {
    if (pageContext === 'ipl' || lockedLeague === 'ipl') {
      setCurrentLeague('ipl');
      setLeagueScope('ipl');
    } else if (pageContext === 'wpl' || lockedLeague === 'wpl') {
      setCurrentLeague('wpl');
      setLeagueScope('wpl');
    }
  }, [pageContext, lockedLeague, setCurrentLeague]);

  // Hydrate bookmarks from localStorage once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBookmarkedIds(new Set(parsed.map(String)));
        }
      }
    } catch {
      // Ignore storage access restrictions
    }
  }, []);

  // Load 2027 news, teams, and players
  useEffect(() => {
    let active = true;

    const loadAll = async () => {
      try {
        const [newsData, teamsData, playersData] = await Promise.all([
          api.getNews().catch(() => NEWS_2027_ARTICLES),
          api.getTeams().catch(() => []),
          api.getPlayers().catch(() => []),
        ]);
        if (!active) return;

        setNews(newsData.length > 0 ? newsData : NEWS_2027_ARTICLES);
        setTeams(teamsData);
        setPlayers(playersData);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadAll();
    return () => {
      active = false;
    };
  }, []);

  // Sync URL params (?league=wpl|ipl, ?team=RCB|14, ?story=<id>) safely without Suspense requirements
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    // On common page, URL parameter determines league scope
    if (pageContext === 'common' && !lockedLeague) {
      const leagueParam = params.get('league')?.toLowerCase();
      if (leagueParam === 'wpl' || leagueParam === 'ipl') {
        setLeagueScope(leagueParam);
        setCurrentLeague(leagueParam);
      }
    }

    const storyParam = params.get('story') || params.get('newsId') || params.get('article');
    if (storyParam) {
      setSelectedNewsId(storyParam);
      setIsModalOpen(true);
    }

    const teamParam = params.get('team');
    if (teamParam) {
      const normalized = teamParam.trim().toUpperCase();
      if (teams.length > 0) {
        const matched = teams.find(
          (t) =>
            String(t.id) === teamParam.trim() ||
            t.shortName?.toUpperCase() === normalized
        );
        if (matched) {
          setSelectedTeam(String(matched.id));
        }
      } else {
        setSelectedTeam(teamParam.trim());
      }
    }
  }, [teams, pageContext, lockedLeague, setCurrentLeague]);

  const handleLeagueScopeChange = useCallback(
    (nextScope: LeagueScope) => {
      // On dedicated routes, navigating away from the locked league redirects to the target page
      if (pageContext === 'ipl' && nextScope === 'wpl') {
        router.push('/wpl/news');
        return;
      }
      if (pageContext === 'ipl' && nextScope === 'all') {
        router.push('/news');
        return;
      }
      if (pageContext === 'wpl' && nextScope === 'ipl') {
        router.push('/ipl/news');
        return;
      }
      if (pageContext === 'wpl' && nextScope === 'all') {
        router.push('/news');
        return;
      }

      setLeagueScope(nextScope);
      if (nextScope === 'wpl' || nextScope === 'ipl') {
        setCurrentLeague(nextScope);
      }

      // Reset team filter if the selected team belongs to another league
      if (selectedTeam !== 'all' && nextScope !== 'all') {
        const currentTeam = teams.find((t) => String(t.id) === selectedTeam);
        if (currentTeam && (currentTeam.league || 'ipl') !== nextScope) {
          setSelectedTeam('all');
        }
      }

      if (typeof window !== 'undefined' && pageContext === 'common') {
        const url = new URL(window.location.href);
        if (nextScope === 'all') {
          url.searchParams.delete('league');
        } else {
          url.searchParams.set('league', nextScope);
        }
        window.history.replaceState({}, '', `${url.pathname}${url.search}`);
      }
    },
    [pageContext, router, selectedTeam, teams, setCurrentLeague]
  );

  const toggleBookmark = useCallback((articleId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Ignore storage failures
      }
      return next;
    });
  }, []);

  const openArticle = useCallback((articleId: string) => {
    setSelectedNewsId(articleId);
    setIsModalOpen(true);
  }, []);

  const resetAllFilters = useCallback(() => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedTeam('all');
    setSortBy('latest');
  }, []);

  const leagueCounts = useMemo(
    () => ({
      all: news.length,
      ipl: news.filter((item) => matchesLeagueScope(item, 'ipl')).length,
      wpl: news.filter((item) => matchesLeagueScope(item, 'wpl')).length,
    }),
    [news]
  );

  const scopedArticles = useMemo(
    () => news.filter((item) => matchesLeagueScope(item, leagueScope)),
    [news, leagueScope]
  );

  // Teams filtered for the active scope
  const availableTeams = useMemo(() => {
    if (lockedLeague) {
      return teams.filter((t) => (t.league || 'ipl') === lockedLeague);
    }
    if (leagueScope !== 'all') {
      return teams.filter((t) => (t.league || 'ipl') === leagueScope);
    }
    return teams;
  }, [teams, lockedLeague, leagueScope]);

  const filteredNews = useMemo(() => {
    let list = [...scopedArticles];

    if (selectedCategory === 'saved') {
      list = list.filter((item) => bookmarkedIds.has(item.id));
    } else if (selectedCategory !== 'all') {
      list = list.filter((item) => (item.category || 'general') === selectedCategory);
    }

    if (selectedTeam !== 'all') {
      const targetUpper = selectedTeam.toUpperCase();
      const matchedTeam = teams.find(
        (t) =>
          String(t.id) === selectedTeam ||
          t.shortName?.toUpperCase() === targetUpper
      );
      const targetId = matchedTeam ? String(matchedTeam.id) : selectedTeam;
      const targetShort = matchedTeam?.shortName?.toUpperCase();

      list = list.filter((item) => {
        if (!item.linkedTeamIds || item.linkedTeamIds.length === 0) return false;
        return item.linkedTeamIds.some((tid) => {
          const norm = String(tid).trim();
          return (
            norm === targetId ||
            (targetShort && norm.toUpperCase() === targetShort)
          );
        });
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        if (item.title.toLowerCase().includes(q)) return true;
        if (item.summary?.toLowerCase().includes(q)) return true;
        if (item.content.toLowerCase().includes(q)) return true;
        if (item.linkedTeamIds?.length) {
          return item.linkedTeamIds.some((tid) => {
            const t = teams.find((team) => String(team.id) === String(tid));
            return (
              t?.name.toLowerCase().includes(q) ||
              t?.shortName.toLowerCase().includes(q)
            );
          });
        }
        return false;
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'important') {
        if (Boolean(a.isImportant) !== Boolean(b.isImportant)) {
          return a.isImportant ? -1 : 1;
        }
      } else if (sortBy === 'quick') {
        const diff = getArticleReadTime(a.content) - getArticleReadTime(b.content);
        if (diff !== 0) return diff;
      }

      const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime() || 0;
      const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime() || 0;
      return dateB - dateA;
    });

    return list;
  }, [
    scopedArticles,
    selectedCategory,
    selectedTeam,
    searchQuery,
    sortBy,
    bookmarkedIds,
    teams,
  ]);

  const isFilteredView =
    selectedCategory !== 'all' ||
    searchQuery.trim().length > 0 ||
    selectedTeam !== 'all' ||
    sortBy !== 'latest';

  const spotlightData = useMemo(() => {
    if (isFilteredView || filteredNews.length === 0) {
      return { lead: null, secondary: [] as News[], feed: filteredNews };
    }

    const lead = filteredNews.find((item) => item.isImportant) || filteredNews[0];
    const pool = filteredNews.filter((item) => item.id !== lead.id);
    const secondary = [
      ...pool.filter((item) => item.isImportant),
      ...pool.filter((item) => !item.isImportant),
    ].slice(0, 3);

    const hiddenInSpotlight = new Set([lead.id, ...secondary.map((s) => s.id)]);
    const remaining = filteredNews.filter((item) => !hiddenInSpotlight.has(item.id));

    return {
      lead,
      secondary,
      feed: remaining,
    };
  }, [isFilteredView, filteredNews]);

  const activeModalArticle = useMemo(
    () => news.find((item) => item.id === selectedNewsId) || null,
    [news, selectedNewsId]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white relative flex flex-col">
      <AuroraBackground />
      {(pageContext === 'wpl' || leagueScope === 'wpl') && <WPLFloatingParticles />}

      <Navbar />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-8">
        {/* Navigation Breadcrumb / Newsroom Switcher Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] border ${
                pageContext === 'ipl'
                  ? 'bg-blue-500/15 border-blue-400/30 text-amber-300'
                  : pageContext === 'wpl'
                  ? 'bg-indigo-500/15 border-indigo-400/30 text-indigo-200'
                  : 'bg-white/10 border-white/15 text-slate-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {pageContext === 'ipl'
                ? 'IPL Newsroom • Official Dispatch'
                : pageContext === 'wpl'
                ? 'WPL Newsroom • Official Dispatch'
                : 'SportsUP18 • 2027 Cricket News Hub'}
            </span>
          </div>

          {/* Quick Cross-Newsroom Links */}
          <div className="flex items-center gap-2">
            {pageContext !== 'ipl' && (
              <Link
                href="/ipl/news"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-blue-400/30 text-slate-200 hover:text-white font-semibold transition-colors"
              >
                <span>IPL News</span>
                <span className="text-[10px] text-amber-400">({leagueCounts.ipl})</span>
              </Link>
            )}
            {pageContext !== 'wpl' && (
              <Link
                href="/wpl/news"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-indigo-400/30 text-slate-200 hover:text-white font-semibold transition-colors"
              >
                <span>WPL News</span>
                <span className="text-[10px] text-indigo-300">({leagueCounts.wpl})</span>
              </Link>
            )}
            {pageContext !== 'common' && (
              <Link
                href="/news"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-slate-300 hover:text-white font-semibold transition-colors"
              >
                <span>All News</span>
                <span className="text-[10px] text-slate-400">({leagueCounts.all})</span>
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <NewsSkeleton />
        ) : (
          <>
            <NewsHeroHeader
              leagueScope={leagueScope}
              onChangeLeagueScope={handleLeagueScopeChange}
              counts={leagueCounts}
              tickerArticles={scopedArticles}
              onOpenArticle={openArticle}
              pageContext={pageContext}
            />

            {spotlightData.lead && (
              <NewsFeaturedSpotlight
                leadArticle={spotlightData.lead}
                secondaryArticles={spotlightData.secondary}
                teams={availableTeams}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={toggleBookmark}
                onOpenArticle={openArticle}
              />
            )}

            <NewsCommandBar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedTeam={selectedTeam}
              onSelectTeam={setSelectedTeam}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              teams={availableTeams}
              leagueScope={leagueScope}
              savedCount={bookmarkedIds.size}
              totalMatching={filteredNews.length}
              onResetAll={resetAllFilters}
            />

            {/* Main Dispatches Grid / Feed */}
            <section
              aria-label={
                pageContext === 'ipl'
                  ? 'IPL 2026-2027 News Dispatches'
                  : pageContext === 'wpl'
                  ? 'WPL Season 5 News Dispatches'
                  : '2027 News Dispatches'
              }
              className="space-y-5"
            >
              {spotlightData.feed.length > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-slate-200">
                      <Newspaper className="w-4 h-4" />
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      {isFilteredView
                        ? selectedCategory === 'saved'
                          ? 'Saved Reading List'
                          : 'Filtered Stories'
                        : pageContext === 'ipl'
                        ? 'IPL 2026 & 2027 Off-Season Coverage'
                        : pageContext === 'wpl'
                        ? 'WPL Season 5 Dispatches & Build-up'
                        : 'More Season 2027 Coverage'}
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {spotlightData.feed.length}{' '}
                    {spotlightData.feed.length === 1 ? 'story' : 'stories'}
                  </span>
                </div>
              )}

              {spotlightData.feed.length > 0 ? (
                viewMode === 'editorial' ? (
                  <div className="space-y-4">
                    {spotlightData.feed.map((item, idx) => (
                      <NewsCard
                        key={item.id}
                        article={item}
                        teams={availableTeams}
                        index={idx}
                        viewMode="editorial"
                        isBookmarked={bookmarkedIds.has(item.id)}
                        onToggleBookmark={toggleBookmark}
                        onOpenArticle={openArticle}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {spotlightData.feed.map((item, idx) => (
                      <NewsCard
                        key={item.id}
                        article={item}
                        teams={availableTeams}
                        index={idx}
                        viewMode="grid"
                        isBookmarked={bookmarkedIds.has(item.id)}
                        onToggleBookmark={toggleBookmark}
                        onOpenArticle={openArticle}
                      />
                    ))}
                  </div>
                )
              ) : (
                !spotlightData.lead && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-white/12 bg-slate-950/80 p-12 text-center space-y-4"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
                      {selectedCategory === 'saved' ? (
                        <Bookmark className="w-6 h-6" />
                      ) : (
                        <Newspaper className="w-6 h-6" />
                      )}
                    </div>
                    <h3 className="text-xl font-black text-white">
                      {selectedCategory === 'saved'
                        ? 'Your Saved Reading List is Empty'
                        : 'No Matching Stories Found'}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      {selectedCategory === 'saved'
                        ? 'Tap the bookmark icon on any briefing to save it here for quick access.'
                        : 'Try clearing your search terms or adjusting the category filter.'}
                    </p>
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Browse All Stories
                    </button>
                  </motion.div>
                )
              )}
            </section>
          </>
        )}
      </main>

      <Footer />

      {/* Full Modal Reader */}
      {activeModalArticle && (
        <NewsModal
          isOpen={isModalOpen}
          newsId={selectedNewsId}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNewsId(null);
          }}
          article={activeModalArticle}
          allArticles={news}
          teams={teams}
          players={players}
          isBookmarked={bookmarkedIds.has(activeModalArticle.id)}
          onToggleBookmark={toggleBookmark}
          onSelectArticle={(id) => setSelectedNewsId(id)}
        />
      )}
    </div>
  );
}
