'use client';

import { Sparkles } from 'lucide-react';
import type { News, Player, Team } from '@/types';
import {
  DEFAULT_NEWS_FALLBACK_IMAGE,
  formatNewsDate,
  getArticleReadTime,
  getNewsImageSrc,
} from '@/lib/news2027';
import {
  getCategoryMeta,
  getLeagueMeta,
  parseArticleBlocks,
  resolveTeamRef,
} from './newsTheme';

interface NewsArticleBodyProps {
  article: News & { videoUrl?: string };
  teams?: Team[];
  players?: Player[];
  onTeamClick?: (teamId: string) => void;
}

export default function NewsArticleBody({
  article,
  teams = [],
  players = [],
  onTeamClick,
}: NewsArticleBodyProps) {
  const category = getCategoryMeta(article.category);
  const league = getLeagueMeta(article.league);
  const readTime = getArticleReadTime(article.content);
  const blocks = parseArticleBlocks(article.content);

  const resolvedTeams = (article.linkedTeamIds || [])
    .map((id) => resolveTeamRef(id, teams))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const resolvedPlayers = (article.linkedPlayerIds || [])
    .map((pid) => players.find((p) => String(p.id) === String(pid)))
    .filter((p): p is Player => Boolean(p));

  return (
    <div className="space-y-6">
      {/* Hero Cover Visual */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
        <img
          src={getNewsImageSrc(article)}
          alt={article.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = DEFAULT_NEWS_FALLBACK_IMAGE;
          }}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${league.pillClass}`}
          >
            {league.label}
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${category.badgeClass}`}
          >
            {category.label}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/80 border border-white/15 text-slate-200 backdrop-blur-md">
            {formatNewsDate(article.publishedAt || article.createdAt)} • {readTime} min read
          </span>
        </div>
      </div>

      {/* Headline + Lead Summary */}
      <header className="space-y-3">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
          {article.title}
        </h1>
        {article.summary && (
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium border-l-2 border-amber-400/70 pl-4">
            {article.summary}
          </p>
        )}
      </header>

      {/* Optional Video Embed */}
      {article.videoUrl && (
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-black">
          <video controls className="w-full max-h-[420px]" src={article.videoUrl} />
        </div>
      )}

      {/* Structured Article Body */}
      <div className="space-y-5">
        {blocks.map((block, index) => {
          if (block.type === 'section') {
            return (
              <div
                key={index}
                className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.08] via-slate-900/80 to-slate-950/90 p-5 sm:p-6 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-300">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{block.heading}</span>
                </div>
                <ul className="space-y-2.5">
                  {block.bullets.map((bullet, bIdx) => {
                    const colonIdx = bullet.indexOf(':');
                    const hasLabel = colonIdx > 0 && colonIdx < 36;
                    const label = hasLabel ? bullet.slice(0, colonIdx) : null;
                    const rest = hasLabel ? bullet.slice(colonIdx + 1).trim() : bullet;
                    return (
                      <li
                        key={bIdx}
                        className="flex items-start gap-2.5 text-sm sm:text-[15px] text-slate-200 leading-relaxed"
                      >
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>
                          {label && (
                            <strong className="font-bold text-white">{label}: </strong>
                          )}
                          {rest}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          }

          return (
            <p
              key={index}
              className="text-[15px] sm:text-base text-slate-200 leading-relaxed"
            >
              {block.text}
            </p>
          );
        })}
      </div>

      {/* Linked Teams & Players */}
      {(resolvedTeams.length > 0 || resolvedPlayers.length > 0) && (
        <div className="pt-5 border-t border-white/10 space-y-4">
          {resolvedTeams.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Franchises Mentioned
              </p>
              <div className="flex flex-wrap gap-2">
                {resolvedTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => onTeamClick?.(team.id)}
                    className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors ${
                      onTeamClick
                        ? 'hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-white cursor-pointer'
                        : 'cursor-default'
                    }`}
                  >
                    <img
                      src={team.logo}
                      alt={team.shortName}
                      className="w-4 h-4 object-contain"
                    />
                    <span>{team.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {resolvedPlayers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Players Tagged
              </p>
              <div className="flex flex-wrap gap-2">
                {resolvedPlayers.map((player) => (
                  <span
                    key={player.id}
                    className="inline-flex items-center rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200"
                  >
                    {player.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
