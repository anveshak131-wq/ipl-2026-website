'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ExternalLink,
  Share2,
  X,
} from 'lucide-react';
import type { News, Player, Team } from '@/types';
import { api } from '@/lib/data';
import { NEWS_2027_ARTICLES } from '@/lib/news2027';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NewsArticleBody from './NewsArticleBody';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsId: string | null;
  article?: News | null;
  allArticles?: News[];
  teams?: Team[];
  players?: Player[];
  onSelectArticle?: (id: string) => void;
  onFilterByTeam?: (teamId: string) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
}

export default function NewsModal({
  isOpen,
  onClose,
  newsId,
  article: providedArticle,
  allArticles,
  teams = [],
  players = [],
  onSelectArticle,
  onFilterByTeam,
  isBookmarked = false,
  onToggleBookmark,
}: NewsModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [fetchedArticle, setFetchedArticle] = useState<(News & { videoUrl?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const resolvedArticle = providedArticle ?? fetchedArticle;

  useEffect(() => {
    if (!isOpen || !newsId || providedArticle) {
      return;
    }

    let cancelled = false;
    const loadArticle = async () => {
      setIsLoading(true);
      try {
        const list = await api.getNews();
        const found =
          list.find((item) => item.id === newsId) ||
          NEWS_2027_ARTICLES.find((item) => item.id === newsId) ||
          null;
        if (!cancelled) {
          setFetchedArticle(found);
        }
      } catch {
        if (!cancelled) {
          setFetchedArticle(NEWS_2027_ARTICLES.find((item) => item.id === newsId) || null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadArticle();
    return () => {
      cancelled = true;
    };
  }, [isOpen, newsId, providedArticle]);

  // Reset scroll & progress whenever active article changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setReadProgress(0);
  }, [newsId, isOpen]);

  // Prev / Next article indices if navigation list is provided
  const currentIndex =
    allArticles && newsId
      ? allArticles.findIndex((item) => item.id === newsId)
      : -1;
  const prevArticle =
    allArticles && currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    allArticles && currentIndex >= 0 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  // Body scroll lock & Esc / Arrow key navigation
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && prevArticle && onSelectArticle) {
        onSelectArticle(prevArticle.id);
      } else if (e.key === 'ArrowRight' && nextArticle && onSelectArticle) {
        onSelectArticle(nextArticle.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, prevArticle, nextArticle, onSelectArticle]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      setReadProgress(100);
      return;
    }
    setReadProgress(Math.min(100, Math.round((el.scrollTop / maxScroll) * 100)));
  };

  const handleCopyShareLink = async () => {
    if (!resolvedArticle) return;
    const shareUrl = `${window.location.origin}/news/${resolvedArticle.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={resolvedArticle?.title || '2027 Season Dispatch'}
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6"
        >
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-950 shadow-2xl shadow-black"
          >
            {/* Top Sticky Reader Bar + Progress */}
            <div className="relative border-b border-white/10 bg-slate-950/95 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 truncate">
                  Season 2027 Briefing
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {resolvedArticle && onToggleBookmark && (
                  <button
                    type="button"
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Save story'}
                    onClick={() => onToggleBookmark(resolvedArticle.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                      isBookmarked
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'border-white/15 bg-white/[0.04] text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
                  </button>
                )}

                {resolvedArticle && (
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Share</span>
                      </>
                    )}
                  </button>
                )}

                {resolvedArticle && (
                  <Link
                    href={`/news/${resolvedArticle.id}`}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Page</span>
                  </Link>
                )}

                <button
                  type="button"
                  aria-label="Close reader"
                  onClick={onClose}
                  className="p-2 rounded-xl border border-white/15 bg-white/[0.04] text-slate-300 hover:bg-white/15 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scroll Reading Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-fuchsia-500 to-cyan-400 transition-[width] duration-100"
                  style={{ width: `${readProgress}%` }}
                />
              </div>
            </div>

            {/* Scrollable Body */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 sm:py-8"
            >
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : resolvedArticle ? (
                <NewsArticleBody
                  article={resolvedArticle}
                  teams={teams}
                  players={players}
                  onTeamClick={
                    onFilterByTeam
                      ? (teamId) => {
                          onFilterByTeam(teamId);
                          onClose();
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="text-center py-16 space-y-4">
                  <h3 className="text-xl font-bold text-white">Dispatch Not Found</h3>
                  <p className="text-sm text-slate-400">
                    This news item could not be loaded or is no longer active.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Prev / Next Reader Footer */}
            {(prevArticle || nextArticle) && onSelectArticle && (
              <div className="border-t border-white/10 bg-slate-950/95 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                {prevArticle ? (
                  <button
                    type="button"
                    onClick={() => onSelectArticle(prevArticle.id)}
                    className="group flex items-center gap-2 text-left min-w-0 max-w-[46%] text-xs font-semibold text-slate-300 hover:text-amber-300 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="truncate">{prevArticle.title}</span>
                  </button>
                ) : (
                  <span />
                )}

                {nextArticle ? (
                  <button
                    type="button"
                    onClick={() => onSelectArticle(nextArticle.id)}
                    className="group flex items-center justify-end gap-2 text-right min-w-0 max-w-[46%] text-xs font-semibold text-slate-300 hover:text-amber-300 transition-colors"
                  >
                    <span className="truncate">{nextArticle.title}</span>
                    <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <span />
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
