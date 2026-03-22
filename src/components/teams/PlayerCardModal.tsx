'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Calendar, Zap, Trophy, BarChart3, Activity } from 'lucide-react';
import Image from 'next/image';

interface PlayerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: {
    id: string;
    name: string;
    teamName: string;
    role: string;
    matches: number;
    runs: number;
    wickets: number;
    highestScore: string;
    battingAverage: number;
    bowlingAverage: number;
    strikeRate: number;
    economy: number;
    bestBowling: string;
    image?: string;
    fifties?: number;
    hundreds?: number;
    fours?: number;
    sixes?: number;
  };
  teamPrimary: string;
  teamSecondary?: string;
  teamShortName?: string;
  teamLogo?: string;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

function normalizeHexColor(raw: string | undefined, fallback: string): string {
  const value = String(raw || '').trim();
  if (!value) return fallback;

  const withHash = value.startsWith('#') ? value : `#${value}`;
  const shortMatch = withHash.match(/^#([0-9a-fA-F]{3})$/);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  const longMatch = withHash.match(/^#([0-9a-fA-F]{6})$/);
  if (longMatch) return withHash.toUpperCase();

  return fallback;
}

function hexToRgba(raw: string, alpha: number): string {
  const hex = normalizeHexColor(raw, '#7C3AED');
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '—';
  const raw = String(value).trim();
  return raw ? raw : '—';
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-white/45">{hint}</div> : null}
    </div>
  );
}

export default function PlayerCardModal({
  isOpen,
  onClose,
  player,
  teamPrimary,
  teamSecondary,
  teamShortName,
  teamLogo,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: PlayerCardModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onClose, onNext, onPrev]);

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const primary = normalizeHexColor(teamPrimary, '#7C3AED');
  const secondary = normalizeHexColor(teamSecondary || teamPrimary, primary);

  const overview = [
    { label: 'Matches', value: displayValue(player.matches), icon: <Calendar className="w-4 h-4" /> },
    { label: 'Runs', value: displayValue(player.runs), icon: <Zap className="w-4 h-4" /> },
    { label: 'Wickets', value: displayValue(player.wickets), icon: <Trophy className="w-4 h-4" /> },
    { label: 'SR', value: displayValue(player.strikeRate), icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${player.name} quick profile`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-[0_25px_90px_rgba(0,0,0,0.65)]"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: `0 25px 90px rgba(0,0,0,0.65), 0 0 0 1px ${hexToRgba(primary, 0.18)}`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background: `radial-gradient(900px circle at 15% 0%, ${hexToRgba(primary, 0.22)}, transparent 55%), radial-gradient(700px circle at 85% 40%, ${hexToRgba(secondary, 0.16)}, transparent 50%)`,
          }}
        />

        <div className="relative">
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            {hasPrev ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
                className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] text-white/80 transition-colors hover:bg-white/[0.08]"
                aria-label="Previous player"
              >
                <ArrowLeft className="mx-auto h-4 w-4" />
              </button>
            ) : null}
            {hasNext ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] text-white/80 transition-colors hover:bg-white/[0.08]"
                aria-label="Next player"
              >
                <ArrowRight className="mx-auto h-4 w-4" />
              </button>
            ) : null}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] text-white/80 transition-colors hover:bg-white/[0.08]"
              aria-label="Close"
            >
              <X className="mx-auto h-4 w-4" />
            </button>
          </div>

          <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex items-center gap-4">
                <div
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/60 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                  style={{ boxShadow: `0 22px 55px ${hexToRgba(primary, 0.18)}` }}
                >
                  {player.image ? (
                    <Image
                      src={player.image}
                      alt={player.name}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-3xl font-black text-white">
                      {player.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">{player.name}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                      <span className="h-2 w-2 rounded-full" style={{ background: primary }} />
                      {teamShortName || player.teamName}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                      {player.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {overview.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/55">
                        {item.icon}
                        {item.label}
                      </div>
                      <div className="mt-1 text-lg font-black text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <BarChart3 className="h-4 w-4 text-white/70" />
                  Batting
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <MetricCard label="Avg" value={displayValue(player.battingAverage)} />
                  <MetricCard label="SR" value={displayValue(player.strikeRate)} />
                  <MetricCard label="HS" value={displayValue(player.highestScore)} />
                  <MetricCard label="50s" value={displayValue(player.fifties)} />
                  <MetricCard label="100s" value={displayValue(player.hundreds)} />
                  <MetricCard label="4s / 6s" value={`${displayValue(player.fours)} / ${displayValue(player.sixes)}`} />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Trophy className="h-4 w-4 text-white/70" />
                  Bowling
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <MetricCard label="Avg" value={displayValue(player.bowlingAverage)} />
                  <MetricCard label="Econ" value={displayValue(player.economy)} />
                  <MetricCard label="Best" value={displayValue(player.bestBowling)} hint="Wickets/Runs" />
                  <MetricCard label="Role" value={displayValue(player.role)} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.08]"
              >
                Close
              </button>
              <div className="text-xs text-white/45">
                Tip: Use <span className="font-semibold text-white/65">←</span>/<span className="font-semibold text-white/65">→</span> to navigate
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

