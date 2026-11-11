'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Bookmark, Calendar, Clock, Flame, Sparkles } from 'lucide-react';
import type { News, Team } from '@/types';
import {
  DEFAULT_NEWS_FALLBACK_IMAGE,
  formatNewsDate,
  getArticleReadTime,
  getNewsImageSrc,
} from '@/lib/news2027';
import { getCategoryMeta, getLeagueMeta, resolveTeamRef } from './newsTheme';

interface NewsFeaturedSpotlightProps {
  leadArticle: News;
  secondaryArticles: News[];
  teams: Team[];
  bookmarkedIds: Set<string>;
  onToggleBookmark: (articleId: string) => void;
  onOpenArticle: (articleId: string) => void;
}

export default function NewsFeaturedSpotlight({
  leadArticle,
  secondaryArticles,
  teams,
  bookmarkedIds,
  onToggleBookmark,
  onOpenArticle,
}: NewsFeaturedSpotlightProps) {
  const shouldReduceMotion = useReducedMotion();
  const leadCategory = getCategoryMeta(leadArticle.category);
  const leadLeague = getLeagueMeta(leadArticle.league);
  const leadReadTime = getArticleReadTime(leadArticle.content);
  const leadTeams = (leadArticle.linkedTeamIds || [])
    .map((id) => resolveTeamRef(id, teams))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 4);
  const isLeadSaved = bookmarkedIds.has(leadArticle.id);

  return (
    <section aria-label="Featured 2027 Spotlight" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-400/35 text-amber-300">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Lead 2027 Briefings
            </h2>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Curated Editorial Pick
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Lead Hero Story Card */}
        <motion.article
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => onOpenArticle(leadArticle.id)}
          className="lg:col-span-7 group cursor-pointer rounded-3xl border border-white/15 bg-slate-950/90 overflow-hidden flex flex-col shadow-2xl shadow-black/50 hover:border-amber-400/45 transition-all"
        >
          {/* Upper Artwork Stage */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
            <img
              src={getNewsImageSrc(leadArticle)}
              alt={leadArticle.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_NEWS_FALLBACK_IMAGE;
              }}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

            {/* Top Floating Metadata Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${leadLeague.pillClass}`}
                >
                  {leadLeague.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${leadCategory.badgeClass}`}
                >
                  <Flame className="w-3 h-3" />
                  {leadCategory.label}
                </span>
              </div>

              <button
                type="button"
                aria-label={isLeadSaved ? 'Remove bookmark' : 'Bookmark story'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(leadArticle.id);
                }}
                className={`p-2 rounded-xl border backdrop-blur-md transition-colors ${
                  isLeadSaved
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-950/75 text-slate-200 border-white/15 hover:bg-white/15'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isLeadSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Lower Editorial Panel */}
          <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {formatNewsDate(leadArticle.publishedAt || leadArticle.createdAt)}
                </span>
                <span className="text-slate-600">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  {leadReadTime} min read
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl lg:text-[28px] font-black text-white leading-tight group-hover:text-amber-300 transition-colors">
                {leadArticle.title}
              </h3>

              {leadArticle.summary && (
                <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed line-clamp-3">
                  {leadArticle.summary}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              {leadTeams.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex -space-x-2">
                    {leadTeams.map((team) => (
                      <div
                        key={team.id}
                        title={team.name}
                        className="h-8 w-8 rounded-full border border-white/20 bg-slate-900 p-1 flex items-center justify-center shadow"
                      >
                        <img
                          src={team.logo}
                          alt={team.shortName}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {leadTeams.map((t) => t.shortName).join(' • ')}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-400">2027 Season Dispatch</span>
              )}

              <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-300 group-hover:translate-x-1 transition-transform">
                Read Full Briefing
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </motion.article>

        {/* Secondary Top Storylines Rail */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
          {secondaryArticles.slice(0, 3).map((item, index) => {
            const cat = getCategoryMeta(item.category);
            const league = getLeagueMeta(item.league);
            const readTime = getArticleReadTime(item.content);
            const isSaved = bookmarkedIds.has(item.id);
            return (
              <motion.article
                key={item.id}
                initial={shouldReduceMotion ? false : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * (index + 1), duration: 0.4 }}
                whileHover={shouldReduceMotion ? undefined : { x: 4 }}
                onClick={() => onOpenArticle(item.id)}
                className="group cursor-pointer flex-1 rounded-2xl border border-white/12 bg-slate-950/80 hover:bg-slate-900/90 hover:border-white/25 p-4 transition-all flex items-center gap-4 shadow-lg"
              >
                <div className="relative w-28 sm:w-32 aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/10">
                  <img
                    src={getNewsImageSrc(item)}
                    alt={item.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_NEWS_FALLBACK_IMAGE;
                    }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border truncate ${league.pillClass}`}
                      >
                        {league.label}
                      </span>
                      <span
                        className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border truncate ${cat.badgeClass}`}
                      >
                        {cat.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label={isSaved ? 'Remove bookmark' : 'Bookmark story'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(item.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                        isSaved
                          ? 'text-amber-300 bg-amber-500/15'
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h4 className="text-sm sm:text-[15px] font-bold text-white leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-0.5">
                    <span>{formatNewsDate(item.publishedAt || item.createdAt)}</span>
                    <span className="inline-flex items-center gap-1 text-slate-300 group-hover:text-amber-300">
                      {readTime} min
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
