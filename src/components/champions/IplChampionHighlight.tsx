'use client';

import Link from 'next/link';
import { ArrowRight, Crown, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { IPL_REIGNING_CHAMPION } from '@/lib/reigningChampion';

type IplChampionHighlightProps = {
  variant?: 'hero' | 'compact' | 'pill';
  align?: 'left' | 'center';
  className?: string;
  showLinks?: boolean;
};

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default function IplChampionHighlight({
  variant = 'compact',
  align = 'left',
  className = '',
  showLinks = true,
}: IplChampionHighlightProps) {
  const isCentered = align === 'center';

  if (variant === 'pill') {
    return (
      <div
        className={joinClasses(
          'inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.22),rgba(234,88,12,0.18),rgba(250,204,21,0.16))] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-amber-100 shadow-[0_10px_30px_rgba(245,158,11,0.18)]',
          className
        )}
      >
        <Crown className="h-3.5 w-3.5 text-amber-300" />
        <span>{IPL_REIGNING_CHAMPION.teamShortName}</span>
        <span className="text-amber-200/70">IPL {IPL_REIGNING_CHAMPION.season} Champions</span>
      </div>
    );
  }

  const containerClasses =
    variant === 'hero'
      ? 'rounded-[30px] border border-amber-300/22 bg-[linear-gradient(145deg,rgba(120,53,15,0.24),rgba(15,23,42,0.86),rgba(76,29,149,0.24))] p-6 md:p-7 shadow-[0_20px_60px_rgba(245,158,11,0.16)]'
      : 'rounded-[26px] border border-amber-300/20 bg-[linear-gradient(145deg,rgba(120,53,15,0.18),rgba(15,23,42,0.78),rgba(76,29,149,0.18))] p-4 md:p-5 shadow-[0_16px_45px_rgba(245,158,11,0.12)]';

  const titleClasses =
    variant === 'hero'
      ? 'mt-4 text-2xl md:text-3xl font-black tracking-tight text-white'
      : 'mt-3 text-lg md:text-xl font-black tracking-tight text-white';

  const summaryClasses =
    variant === 'hero'
      ? 'mt-3 max-w-3xl text-sm md:text-base leading-relaxed text-slate-200'
      : 'mt-2 max-w-3xl text-sm leading-relaxed text-slate-300';

  return (
    <div className={joinClasses('relative overflow-hidden', containerClasses, className)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute left-0 right-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(250,204,21,0.95),rgba(59,130,246,0.85),transparent)]" />
      </div>

      <div
        className={joinClasses(
          'relative z-10 flex flex-col gap-4',
          isCentered && 'items-center text-center'
        )}
      >
        <div
          className={joinClasses(
            'inline-flex items-center gap-2 rounded-full border border-amber-300/28 bg-amber-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-amber-100',
            isCentered && 'justify-center'
          )}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          Reigning Champions
        </div>

        <div className={joinClasses('flex items-start gap-4', isCentered && 'justify-center')}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/28 bg-amber-400/12">
            <Trophy className="h-6 w-6 text-amber-300" />
          </div>

          <div className={joinClasses('min-w-0', isCentered && 'text-center')}>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-300">
              <span>IPL {IPL_REIGNING_CHAMPION.season}</span>
              <span className="text-amber-300">Champions</span>
              <span className="text-slate-500">/</span>
              <span>{IPL_REIGNING_CHAMPION.teamShortName}</span>
            </div>

            <h3 className={titleClasses}>{IPL_REIGNING_CHAMPION.teamName}</h3>

            <p className={summaryClasses}>
              {IPL_REIGNING_CHAMPION.finalSummary} on {IPL_REIGNING_CHAMPION.finalDateLabel}.{' '}
              {IPL_REIGNING_CHAMPION.reignSummary}.
            </p>
          </div>
        </div>

        <div
          className={joinClasses(
            'flex flex-wrap gap-2',
            isCentered && 'justify-center'
          )}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/24 bg-white/5 px-3 py-1.5 text-xs font-semibold text-amber-100">
            <Crown className="h-3.5 w-3.5 text-amber-300" />
            Crowned in 2026
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/22 bg-white/5 px-3 py-1.5 text-xs font-semibold text-sky-100">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-300" />
            Active through 2027
          </span>
        </div>

        {showLinks && (
          <div
            className={joinClasses(
              'flex flex-wrap gap-3 pt-1',
              isCentered && 'justify-center'
            )}
          >
            <Link
              href={IPL_REIGNING_CHAMPION.teamRoute}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300/28 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-100 transition-colors hover:bg-amber-400/16"
            >
              Visit RCB
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={IPL_REIGNING_CHAMPION.pointsTableRoute}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              See Standings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
