'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import FlagImage from '@/components/ui/FlagImage';
import { X, Calendar, Hash, Star, BarChart3, Trophy, Activity } from 'lucide-react';
import { formatDateMonthDDYYYY, calculateAge } from '@/lib/dateUtils';
import { calculateOverallPerformance } from '@/lib/playerPerformance';
import { usePlayerUpdates } from '@/hooks/usePlayerUpdates';

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  teamColors?: {
    primary: string;
    secondary: string;
  };
  teamData?: Team;
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

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-white/45">{hint}</div> : null}
    </div>
  );
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '—';
  const raw = String(value).trim();
  return raw ? raw : '—';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function PlayerModal({ player, isOpen, onClose, teamColors, teamData }: PlayerModalProps) {
  const [teamColorsState, setTeamColorsState] = useState<{ primary: string; secondary: string } | null>(teamColors || null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(player);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setCurrentPlayer(player);
  }, [player]);

  // Real-time player updates (admin edits)
  usePlayerUpdates(async (playerId: string) => {
    if (!currentPlayer) return;
    if (playerId && currentPlayer.id !== playerId) return;

    try {
      const allPlayers = await api.getPlayers(undefined, currentPlayer.league);
      const updated = allPlayers.find((p) => p.id === currentPlayer.id);
      if (updated) setCurrentPlayer(updated);
    } catch (error) {
      console.error('Error refreshing player data in modal:', error);
    }
  }, [currentPlayer?.id]);

  useEffect(() => {
    if (teamColors) {
      setTeamColorsState(teamColors);
      return;
    }

    if (teamData?.colors) {
      setTeamColorsState(teamData.colors);
      return;
    }

    if (!currentPlayer?.teamId) return;

    api
      .getTeams(currentPlayer.league)
      .then((teams) => {
        const team = teams.find((t) => String(t.id) === String(currentPlayer.teamId));
        if (team?.colors) setTeamColorsState(team.colors);
      })
      .catch((error) => console.error('Error fetching team colors:', error));
  }, [currentPlayer?.teamId, currentPlayer?.league, teamColors, teamData]);

  // Close modal on Escape + lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !currentPlayer) return null;

  const defaultColors = { primary: '#7C3AED', secondary: '#22C55E' };
  const colors = teamColorsState || defaultColors;
  const primary = normalizeHexColor(colors.primary, defaultColors.primary);
  const secondary = normalizeHexColor(colors.secondary, defaultColors.secondary);

  const isWPLPlayer = currentPlayer.league === 'wpl' || teamData?.league === 'wpl';
  const age = currentPlayer.dateOfBirth ? calculateAge(currentPlayer.dateOfBirth) : currentPlayer.age;
  const overallPerformance = calculateOverallPerformance(currentPlayer);

  const headerStats = isWPLPlayer
    ? [
        { label: 'Role', value: currentPlayer.role, icon: <Trophy className="w-4 h-4" /> },
        { label: 'Age', value: `${age}`, icon: <Calendar className="w-4 h-4" /> },
        { label: 'Bat', value: currentPlayer.battingStyle || '—', icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Bowl', value: currentPlayer.bowlingStyle || '—', icon: <Activity className="w-4 h-4" /> },
      ]
    : [
        { label: 'Matches', value: displayValue(currentPlayer.stats?.matches), icon: <Calendar className="w-4 h-4" /> },
        { label: 'Runs', value: displayValue(currentPlayer.stats?.runs), icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Wickets', value: displayValue(currentPlayer.stats?.wickets), icon: <Trophy className="w-4 h-4" /> },
        { label: 'SR', value: displayValue(currentPlayer.stats?.strikeRate), icon: <Activity className="w-4 h-4" /> },
      ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(12px)' }}
      >
        <motion.div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-[0_25px_90px_rgba(0,0,0,0.65)]"
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.985 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`${currentPlayer.name} profile`}
          style={{
            boxShadow: `0 25px 90px rgba(0,0,0,0.65), 0 0 0 1px ${hexToRgba(primary, 0.18)}`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-85"
            style={{
              background: `radial-gradient(900px circle at 18% 0%, ${hexToRgba(primary, 0.22)}, transparent 55%), radial-gradient(700px circle at 85% 45%, ${hexToRgba(secondary, 0.16)}, transparent 50%)`,
            }}
          />

          <div className="relative">
            <div className="absolute right-4 top-4 z-20">
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

            {/* Header */}
            <div className="relative border-b border-white/10 px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="h-20 w-20 shrink-0 rounded-2xl border border-white/15 bg-slate-900/60 flex items-center justify-center text-2xl font-black text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                    style={{ boxShadow: `0 22px 55px ${hexToRgba(primary, 0.18)}` }}
                  >
                    {getInitials(currentPlayer.name)}
                  </div>

                  <div className="min-w-0">
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">{currentPlayer.name}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                        <span className="h-2 w-2 rounded-full" style={{ background: primary }} />
                        {teamData?.shortName || currentPlayer.teamId}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                        {currentPlayer.role}
                      </span>
                      {currentPlayer.isCaptain ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                          <Star className="h-3.5 w-3.5" />
                          Captain
                        </span>
                      ) : null}
                      {currentPlayer.jerseyNumber > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                          <Hash className="h-3.5 w-3.5" />
                          {currentPlayer.jerseyNumber}
                        </span>
                      ) : null}
                      {currentPlayer.nationality ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                          <FlagImage nationality={currentPlayer.nationality} size="sm" />
                          {currentPlayer.nationality}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {headerStats.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/55">
                        {item.icon}
                        {item.label}
                      </div>
                      <div className="mt-1 text-lg font-black text-white truncate" title={item.value}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="relative space-y-6 px-6 py-6 sm:px-8 sm:py-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard
                  label="Age"
                  value={`${age}`}
                  hint={currentPlayer.dateOfBirth ? formatDateMonthDDYYYY(currentPlayer.dateOfBirth) : undefined}
                />
                <MetricCard label="Nationality" value={displayValue(currentPlayer.nationality)} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard label="Batting Style" value={displayValue(currentPlayer.battingStyle)} />
                <MetricCard label="Bowling Style" value={displayValue(currentPlayer.bowlingStyle)} />
              </div>

              {!isWPLPlayer ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <BarChart3 className="h-4 w-4 text-white/70" />
                      Batting
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <MetricCard label="Runs" value={displayValue(currentPlayer.stats?.runs)} />
                      <MetricCard label="Avg" value={displayValue(currentPlayer.stats?.average)} />
                      <MetricCard label="SR" value={displayValue(currentPlayer.stats?.strikeRate)} />
                      <MetricCard label="HS" value={displayValue(currentPlayer.stats?.highest)} />
                      <MetricCard label="4s / 6s" value={`${displayValue(currentPlayer.stats?.fours)} / ${displayValue(currentPlayer.stats?.sixes)}`} />
                      <MetricCard label="50s / 100s" value={`${displayValue(currentPlayer.stats?.fifties)} / ${displayValue(currentPlayer.stats?.hundreds)}`} />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Trophy className="h-4 w-4 text-white/70" />
                      Bowling
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <MetricCard label="Wickets" value={displayValue(currentPlayer.stats?.wickets)} />
                      <MetricCard label="Econ" value={displayValue(currentPlayer.stats?.economy)} />
                      <MetricCard label="Best" value={displayValue(currentPlayer.stats?.bestBowling)} hint="Wickets/Runs" />
                      <MetricCard label="Bowling Avg" value={displayValue(currentPlayer.stats?.bowlingAverage)} />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-white">Overall Performance</div>
                  <div className="text-sm font-black text-white">{overallPerformance.rating.toFixed(1)}/100</div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, overallPerformance.rating))}%`,
                      background: `linear-gradient(90deg, ${primary}, ${secondary})`,
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-white/55">{overallPerformance.summary}</div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.08]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
