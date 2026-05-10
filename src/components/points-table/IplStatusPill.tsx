import React from 'react';

type IplStatusPillProps = {
  status: 'qualified' | 'eliminated';
  compact?: boolean;
};

const STATUS_STYLES = {
  qualified: {
    label: 'Qualified',
    letter: 'Q',
    outer: 'border-emerald-400/35 bg-emerald-500/12 text-emerald-200',
    inner: 'bg-emerald-300 text-emerald-950',
  },
  eliminated: {
    label: 'Eliminated',
    letter: 'E',
    outer: 'border-rose-400/35 bg-rose-500/12 text-rose-200',
    inner: 'bg-rose-300 text-rose-950',
  },
} as const;

export default function IplStatusPill({ status, compact = false }: IplStatusPillProps) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-black uppercase tracking-[0.22em] ${style.outer} ${
        compact ? 'text-[10px]' : 'text-[11px]'
      }`}
      aria-label={style.label}
      title={style.label}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] tracking-normal ${style.inner}`}
      >
        {style.letter}
      </span>
      {!compact && <span>{style.label}</span>}
    </span>
  );
}
