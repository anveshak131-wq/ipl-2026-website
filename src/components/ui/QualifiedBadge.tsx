import React from 'react';

interface QualifiedBadgeProps {
  qualified?: boolean;
  eliminated?: boolean;
  size?: 'sm' | 'md';
  season?: number;
  showSeason?: boolean;
}

const BADGE_STYLES = {
  qualified: {
    label: 'Qualified',
    className: 'bg-emerald-600/90 text-white border border-emerald-500/40',
    icon: (
      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  eliminated: {
    label: 'Eliminated',
    className: 'bg-rose-600/90 text-white border border-rose-500/40',
    icon: (
      <>
        <path d="M18 6L6 18" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 6l12 12" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
} as const;

export default function QualifiedBadge({
  qualified = false,
  eliminated = false,
  size = 'sm',
  season,
  showSeason = false,
}: QualifiedBadgeProps) {
  const status = qualified ? 'qualified' : eliminated ? 'eliminated' : null;
  const base = 'inline-flex items-center gap-2 rounded-full px-2 py-0.5 font-semibold';
  const cls = size === 'sm' ? 'text-xs' : 'text-sm';
  if (!status) return null;

  const badge = BADGE_STYLES[status];
  const seasonLabel = showSeason && season ? ` - Season ${season}` : '';

  return (
    <span
      className={`${base} ${cls} ${badge.className}`}
      aria-label={`${badge.label}${seasonLabel}`}
      title={`${badge.label}${seasonLabel}`}
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        {badge.icon}
      </svg>
      <span>
        {badge.label}
        {showSeason && season ? <span className="ml-1 text-white/85">{`- Season ${season}`}</span> : null}
      </span>
    </span>
  );
}
