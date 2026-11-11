'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, Check, Share2 } from 'lucide-react';
import type { News, Team } from '@/types';
import { api } from '@/lib/data';
import { NEWS_2027_ARTICLES } from '@/lib/news2027';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NewsArticleBody from '@/components/news/NewsArticleBody';
import NewsCard from '@/components/news/NewsCard';

const BOOKMARKS_KEY = 'sportsup99_news_2027_bookmarks';

export default function NewsDetailClient({ newsId }: { newsId: string }) {
  const router = useRouter();
  const [article, setArticle] = useState<(News & { videoUrl?: string }) | null>(null);
  const [allArticles, setAllArticles] = useState<News[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setBookmarkedIds(new Set(parsed));
      }
    } catch {
      // Ignore storage failures
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [newsList, teamsList] = await Promise.all([
          api.getNews().catch(() => NEWS_2027_ARTICLES),
          api.getTeams().catch(() => []),
        ]);
        if (!active) return;

        const pool = newsList.length > 0 ? newsList : NEWS_2027_ARTICLES;
        const found =
          pool.find((item) => item.id === newsId) ||
          NEWS_2027_ARTICLES.find((item) => item.id === newsId) ||
          (newsId === '1' ? pool[0] : newsId === '2' ? pool[1] : null);

        setArticle(found || null);
        setAllArticles(pool);
        setTeams(teamsList);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [newsId]);

  const relatedArticles = useMemo(() => {
    if (!article) return allArticles.slice(0, 3);
    return allArticles
      .filter((item) => item.id !== article.id)
      .sort((a, b) => {
        const aScore = (a.league === article.league ? 2 : 0) + (a.category === article.category ? 1 : 0);
        const bScore = (b.league === article.league ? 2 : 0) + (b.category === article.category ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, 3);
  }, [allArticles, article]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Ignore storage failures
      }
      return next;
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative flex flex-col">
      <AuroraBackground />
      <Navbar />

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-xs sm:text-sm font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to 2027 News Hub</span>
          </Link>

          {article && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleBookmark(article.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors ${
                  bookmarkedIds.has(article.id)
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'border-white/15 bg-white/[0.04] text-slate-200 hover:bg-white/10'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${bookmarkedIds.has(article.id) ? 'fill-current' : ''}`}
                />
                <span>{bookmarkedIds.has(article.id) ? 'Saved' : 'Save Story'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-200 hover:bg-white/10 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : article ? (
          <>
            <article className="rounded-3xl border border-white/12 bg-slate-950/85 p-5 sm:p-8 lg:p-10 shadow-2xl">
              <NewsArticleBody
                article={article}
                teams={teams}
                onTeamClick={(teamId) => router.push(`/news?team=${teamId}`)}
              />
            </article>

            {relatedArticles.length > 0 && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    More 2027 Season Dispatches
                  </h2>
                  <Link
                    href="/news"
                    className="text-xs sm:text-sm font-bold text-amber-300 hover:text-amber-200"
                  >
                    View all stories →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedArticles.map((rel, idx) => (
                    <NewsCard
                      key={rel.id}
                      article={rel}
                      teams={teams}
                      index={idx}
                      viewMode="grid"
                      isBookmarked={bookmarkedIds.has(rel.id)}
                      onToggleBookmark={toggleBookmark}
                      onOpenArticle={(id) => router.push(`/news/${id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-white/15 bg-slate-950/80 p-12 text-center space-y-4">
            <h1 className="text-2xl font-black text-white">Article Not Found</h1>
            <p className="text-sm text-slate-400">
              Explore the latest IPL 2027 and WPL Season 5 dispatches in the newsroom hub.
            </p>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 transition-colors"
            >
              Browse 2027 News
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
