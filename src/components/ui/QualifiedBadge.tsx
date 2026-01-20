import React from 'react';

interface QualifiedBadgeProps {
  qualified?: boolean;
  size?: 'sm' | 'md';
}

export default function QualifiedBadge({ qualified = false, size = 'sm' }: QualifiedBadgeProps) {
  const base = 'inline-flex items-center gap-2 rounded-full px-2 py-0.5 font-semibold';
  const cls = size === 'sm' ? 'text-xs' : 'text-sm';
  if (!qualified) return null;
  return (
    <span className={`${base} ${cls} bg-emerald-600/90 text-white border border-emerald-500/40`}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Qualified</span>
    </span>
  );
}
