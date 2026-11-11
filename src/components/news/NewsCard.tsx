'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Bookmark, Calendar, Check, Clock, Share2 } from 'lucide-react';
import type { News, Team } from '@/types';
import {
  DEFAULT_NEWS_FALLBACK_IMAGE,
  formatNewsDate,
  getArticleReadTime,
  getNewsImageSrc,
} from '@/lib/news2027';
import { getCategoryMeta, getLeagueMeta, resolveTeamRef } from './newsTheme';
import type { NewsViewMode } from './NewsCommandBar';

interface NewsCardProps {
  article: News;
  teams: Team[];
  index: number;
  viewMode: NewsViewMode;
  isBookmarked: boolean;
  onToggleBookmark: (articleId: string) => void;
  onOpenArticle: (articleId: string) => void;
}

export default function NewsCard({
  article,
  teams,
  index,
  viewMode,
  isBookmarked,
  onToggleBookmark,
  onOpenArticle,
}: NewsCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const category = getCategoryMeta(article.category);
  const league = getLeagueMeta(article.league);
  const readTime = getArticleReadTime(article.content);
  const resolvedTeams = (article.linkedTeamIds || [])
    .map((id) => resolveTeamRef(id, teams))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .slice(0, 3);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/news/${article.id}`
        : `/news/${article.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Ignore clipboard failures in restricted frames
    }
  };

  if (viewMode === 'editorial') {
    return (
      <motion.article
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
        onClick={() => onOpenArticle(article.id)}
        className="group cursor-pointer rounded-2xl border border-white/12 bg-slate-950/85 hover:bg-slate-900/95 hover:border-amber-400/40 transition-all p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-lg"
      >
        <div className="relative w-full sm:w-64 md:w-72 aspect-[16/9] sm:aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/10">
          <img
            src={getNewsImageSrc(article)}
            alt={article.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_NEWS_FALLBACK_IMAGE;
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span
            className={`absolute top-2.5 left-2.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${league.pillClass}`}
          >
            {league.label}
          </span>
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${category.badgeClass}`}
                >
                  {category.label}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatNewsDate(article.publishedAt || article.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  {readTime} min read
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Share story link"
                  onClick={handleShare}
                  className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Save story'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(article.id);
                  }}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isBookmarked
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug group-hover:text-amber-300 transition-colors">
              {article.title}
            </h3>

            {article.summary && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
                {article.summary}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
            {resolvedTeams.length > 0 ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex -space-x-1.5">
                  {resolvedTeams.map((team) => (
                    <div
                      key={team.id}
                      title={team.name}
                      className="h-6 w-6 rounded-full border border-white/20 bg-slate-900 p-0.5 flex items-center justify-center"
                    >
                      <img src={team.logo} alt={team.shortName} className="h-full w-full object-contain" />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-slate-400 truncate">
                  {resolvedTeams.map((t) => t.shortName).join(' • ')}
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-semibold text-slate-500">Season 2027 Desk</span>
            )}

            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 group-hover:translate-x-1 transition-transform shrink-0">
              Read story
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      onClick={() => onOpenArticle(article.id)}
      className="group cursor-pointer rounded-2xl border border-white/12 bg-slate-950/85 hover:bg-slate-900/95 hover:border-amber-400/45 transition-all overflow-hidden flex flex-col shadow-xl shadow-black/40"
    >
      {/* Top 16:9 Editorial Artwork */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
        <img
          src={getNewsImageSrc(article)}
          alt={article.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = DEFAULT_NEWS_FALLBACK_IMAGE;
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/25" />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${league.pillClass}`}
          >
            {league.label}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Share story link"
              onClick={handleShare}
              className="p-1.5 rounded-lg border border-white/15 bg-slate-950/80 backdrop-blur-md text-slate-200 hover:text-white hover:bg-white/15 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Save story'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(article.id);
              }}
              className={`p-1.5 rounded-lg border backdrop-blur-md transition-colors ${
                isBookmarked
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'border-white/15 bg-slate-950/80 text-slate-200 hover:text-white hover:bg-white/15'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-400">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${category.badgeClass}`}
            >
              {category.label}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              {readTime} min read
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
            {article.title}
          </h3>

          {article.summary && (
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2">
              {article.summary}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {resolvedTeams.length > 0 ? (
              <>
                <div className="flex -space-x-1.5 shrink-0">
                  {resolvedTeams.map((team) => (
                    <div
                      key={team.id}
                      title={team.name}
                      className="h-6 w-6 rounded-full border border-white/20 bg-slate-900 p-0.5 flex items-center justify-center"
                    >
                      <img src={team.logo} alt={team.shortName} className="h-full w-full object-contain" />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-slate-400 truncate">
                  {formatNewsDate(article.publishedAt || article.createdAt)}
                </span>
              </>
            ) : (
              <span className="text-[11px] font-semibold text-slate-400 truncate">
                {formatNewsDate(article.publishedAt || article.createdAt)}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 group-hover:translate-x-1 transition-transform shrink-0">
            Read
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}
