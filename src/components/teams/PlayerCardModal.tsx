'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  Hash,
  Star,
  Trophy,
  User,
  X,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import FlagImage from '@/components/ui/FlagImage';
import { calculateAge, formatDateMonthDDYYYY } from '@/lib/dateUtils';

interface PlayerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: {
    id: string;
    name: string;
    teamId: string;
    teamName: string;
    role: string;
    league?: string;
    age?: number;
    dateOfBirth?: string;
    nationality?: string;
    jerseyNumber?: number;
    isCaptain?: boolean;
    battingStyle?: string;
    bowlingStyle?: string;
    allrounderType?: string;
    transferInfo?: unknown;
    isActiveInSquad?: boolean;
    squadStatus?: string;
    squadExitReason?: string;
    squadExitDate?: string;
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

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-white">
        <span className="text-white/70">{icon}</span>
        {title}
      </div>
      <div className="mt-3">{children}</div>
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

  const primary = useMemo(() => normalizeHexColor(teamPrimary, '#7C3AED'), [teamPrimary]);
  const secondary = useMemo(
    () => normalizeHexColor(teamSecondary || teamPrimary, primary),
    [teamSecondary, teamPrimary, primary],
  );

  const derivedAge = useMemo(() => {
    if (player.dateOfBirth) {
      const calculated = calculateAge(player.dateOfBirth);
      return calculated > 0 ? calculated : undefined;
    }
    return typeof player.age === 'number' && player.age > 0 ? player.age : undefined;
  }, [player.age, player.dateOfBirth]);

  const dobLabel = useMemo(() => {
    if (!player.dateOfBirth) return '—';
    const formatted = formatDateMonthDDYYYY(player.dateOfBirth);
    return formatted || player.dateOfBirth;
  }, [player.dateOfBirth]);

  const transferInfo = useMemo(() => {
    if (!player.transferInfo || typeof player.transferInfo !== 'object') return null;
    return player.transferInfo as any;
  }, [player.transferInfo]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[9999] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={`${player.name} player details`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="fixed inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div className="relative min-h-full flex items-start sm:items-center justify-center p-4 sm:p-6">
            <motion.div
              className="relative w-full max-w-4xl my-10 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-[0_25px_90px_rgba(0,0,0,0.65)]"
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.985 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: `0 25px 90px rgba(0,0,0,0.65), 0 0 0 1px ${hexToRgba(primary, 0.18)}`,
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-85"
                style={{
                  background: `radial-gradient(950px circle at 15% 0%, ${hexToRgba(primary, 0.22)}, transparent 55%), radial-gradient(780px circle at 88% 45%, ${hexToRgba(secondary, 0.16)}, transparent 50%)`,
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
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
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
                        <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                          {player.name}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                            <span className="h-2 w-2 rounded-full" style={{ background: primary }} />
                            {teamShortName || player.teamName}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                            {player.role}
                          </span>
                          {player.isCaptain ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                              <Star className="h-3.5 w-3.5" />
                              Captain
                            </span>
                          ) : null}
                          {player.jerseyNumber && player.jerseyNumber > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                              <Hash className="h-3.5 w-3.5" />
                              {player.jerseyNumber}
                            </span>
                          ) : null}
                          {player.nationality ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                              <FlagImage nationality={player.nationality} size="sm" />
                              {player.nationality}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: 'Matches', value: displayValue(player.matches), icon: <Calendar className="w-4 h-4" /> },
                        { label: 'Runs', value: displayValue(player.runs), icon: <Zap className="w-4 h-4" /> },
                        { label: 'Wickets', value: displayValue(player.wickets), icon: <Trophy className="w-4 h-4" /> },
                        { label: 'SR', value: displayValue(player.strikeRate), icon: <Activity className="w-4 h-4" /> },
                      ].map((item) => (
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

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Section title="Player Details" icon={<User className="h-4 w-4" />}>
                      <div className="grid grid-cols-2 gap-3">
                        <MetricCard label="Age" value={derivedAge ? `${derivedAge}` : '—'} hint={dobLabel !== '—' ? dobLabel : undefined} />
                        <MetricCard label="DOB" value={dobLabel} />
                        <MetricCard label="Nationality" value={displayValue(player.nationality)} />
                        <MetricCard label="League" value={displayValue(player.league)} />
                        <MetricCard label="Batting Style" value={displayValue(player.battingStyle)} />
                        <MetricCard label="Bowling Style" value={displayValue(player.bowlingStyle)} />
                        {player.allrounderType ? <MetricCard label="All-rounder" value={displayValue(player.allrounderType)} /> : null}
                      </div>
                    </Section>

                    <div className="lg:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Section title="Batting Stats" icon={<BarChart3 className="h-4 w-4" />}>
                        <div className="grid grid-cols-2 gap-3">
                          <MetricCard label="Avg" value={displayValue(player.battingAverage)} />
                          <MetricCard label="SR" value={displayValue(player.strikeRate)} />
                          <MetricCard label="HS" value={displayValue(player.highestScore)} />
                          <MetricCard label="Runs" value={displayValue(player.runs)} />
                          <MetricCard label="50s" value={displayValue(player.fifties)} />
                          <MetricCard label="100s" value={displayValue(player.hundreds)} />
                          <MetricCard label="4s" value={displayValue(player.fours)} />
                          <MetricCard label="6s" value={displayValue(player.sixes)} />
                        </div>
                      </Section>

                      <Section title="Bowling Stats" icon={<Trophy className="h-4 w-4" />}>
                        <div className="grid grid-cols-2 gap-3">
                          <MetricCard label="Wickets" value={displayValue(player.wickets)} />
                          <MetricCard label="Avg" value={displayValue(player.bowlingAverage)} />
                          <MetricCard label="Econ" value={displayValue(player.economy)} />
                          <MetricCard label="Best" value={displayValue(player.bestBowling)} hint="Wickets/Runs" />
                        </div>
                      </Section>
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
                    <div className="flex items-center gap-3 text-xs text-white/45">
                      {teamLogo ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                          <Image src={teamLogo} alt="Team logo" width={18} height={18} />
                          <span className="text-white/65">{teamShortName || 'Team'}</span>
                        </span>
                      ) : null}
                      <span>
                        Tip: Use <span className="font-semibold text-white/65">←</span>/<span className="font-semibold text-white/65">→</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
