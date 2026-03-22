'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import FlagImage from '@/components/ui/FlagImage';
import { calculateAge, formatDateMonthDDYYYY } from '@/lib/dateUtils';
import { calculateOverallPerformance } from '@/lib/playerPerformance';
import { usePlayerUpdates } from '@/hooks/usePlayerUpdates';
import {
  Activity,
  BarChart3,
  Calendar,
  Hash,
  Star,
  Trophy,
  User,
  X,
  Zap,
} from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);
  const [teamColorsState, setTeamColorsState] = useState<{ primary: string; secondary: string } | null>(teamColors || null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(player);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (player) setCurrentPlayer(player);
  }, [player]);

  const shownPlayer = player || currentPlayer;

  // Real-time player updates (admin edits)
  usePlayerUpdates(async (playerId: string) => {
    if (!shownPlayer) return;
    if (playerId && shownPlayer.id !== playerId) return;

    try {
      const allPlayers = await api.getPlayers(undefined, shownPlayer.league);
      const updated = allPlayers.find((p) => p.id === shownPlayer.id);
      if (updated) setCurrentPlayer(updated);
    } catch (error) {
      console.error('Error refreshing player data in modal:', error);
    }
  }, [shownPlayer?.id, shownPlayer?.league]);

  useEffect(() => {
    if (teamColors) {
      setTeamColorsState(teamColors);
      return;
    }

    if (teamData?.colors) {
      setTeamColorsState(teamData.colors);
      return;
    }

    if (!shownPlayer?.teamId) return;

    api
      .getTeams(shownPlayer.league)
      .then((teams) => {
        const matched = teams.find((t) => String(t.id) === String(shownPlayer.teamId));
        if (matched?.colors) setTeamColorsState(matched.colors);
      })
      .catch((error) => console.error('Error fetching team colors:', error));
  }, [shownPlayer?.teamId, shownPlayer?.league, teamColors, teamData]);

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

  const defaultColors = { primary: '#7C3AED', secondary: '#22C55E' };
  const colors = teamColorsState || defaultColors;
  const primary = normalizeHexColor(colors.primary, defaultColors.primary);
  const secondary = normalizeHexColor(colors.secondary, defaultColors.secondary);

  const derivedAge = useMemo(() => {
    if (!shownPlayer) return undefined;
    if (shownPlayer.dateOfBirth) {
      const calculated = calculateAge(shownPlayer.dateOfBirth);
      return calculated > 0 ? calculated : undefined;
    }
    return typeof shownPlayer.age === 'number' && shownPlayer.age > 0 ? shownPlayer.age : undefined;
  }, [shownPlayer]);

  const dobLabel = useMemo(() => {
    if (!shownPlayer?.dateOfBirth) return '—';
    const formatted = formatDateMonthDDYYYY(shownPlayer.dateOfBirth);
    return formatted || shownPlayer.dateOfBirth;
  }, [shownPlayer?.dateOfBirth]);

  const overallPerformance = useMemo(
    () => (shownPlayer ? calculateOverallPerformance(shownPlayer) : null),
    [shownPlayer],
  );

  const transferInfo = useMemo(() => {
    if (!shownPlayer?.transferInfo || typeof shownPlayer.transferInfo !== 'object') return null;
    return shownPlayer.transferInfo as any;
  }, [shownPlayer?.transferInfo]);

  const stats = shownPlayer?.stats || null;

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && shownPlayer ? (
        <motion.div
          className="fixed inset-0 z-[9999] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${shownPlayer.name} player details`}
        >
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div className="relative min-h-full flex items-start sm:items-center justify-center p-4 sm:p-6">
            <motion.div
              className="relative w-full max-w-5xl my-10 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-[0_25px_90px_rgba(0,0,0,0.65)]"
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
                  background: `radial-gradient(980px circle at 15% 0%, ${hexToRgba(primary, 0.22)}, transparent 55%), radial-gradient(780px circle at 88% 45%, ${hexToRgba(secondary, 0.16)}, transparent 50%)`,
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

                <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/60 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                        style={{ boxShadow: `0 22px 55px ${hexToRgba(primary, 0.18)}` }}
                      >
                        {shownPlayer.photoUrl ? (
                          <Image
                            src={shownPlayer.photoUrl}
                            alt={shownPlayer.name}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-2xl font-black text-white">
                            {getInitials(shownPlayer.name)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                          {shownPlayer.name}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                            <span className="h-2 w-2 rounded-full" style={{ background: primary }} />
                            {teamData?.shortName || shownPlayer.teamId}
                          </span>
                          {teamData?.name ? (
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                              {teamData.name}
                            </span>
                          ) : null}
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                            {shownPlayer.role}
                          </span>
                          {shownPlayer.allrounderType ? (
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                              {shownPlayer.allrounderType}
                            </span>
                          ) : null}
                          {shownPlayer.isCaptain ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                              <Star className="h-3.5 w-3.5" />
                              Captain
                            </span>
                          ) : null}
                          {shownPlayer.jerseyNumber > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                              <Hash className="h-3.5 w-3.5" />
                              {shownPlayer.jerseyNumber}
                            </span>
                          ) : null}
                          {shownPlayer.nationality ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75">
                              <FlagImage nationality={shownPlayer.nationality} size="sm" />
                              {shownPlayer.nationality}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: 'Matches', value: displayValue(stats?.matches), icon: <Calendar className="w-4 h-4" /> },
                        { label: 'Runs', value: displayValue(stats?.runs), icon: <BarChart3 className="w-4 h-4" /> },
                        { label: 'Wickets', value: displayValue(stats?.wickets), icon: <Trophy className="w-4 h-4" /> },
                        { label: 'SR', value: displayValue(stats?.strikeRate), icon: <Activity className="w-4 h-4" /> },
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
                        <MetricCard label="Nationality" value={displayValue(shownPlayer.nationality)} />
                        <MetricCard label="League" value={displayValue(shownPlayer.league)} />
                        <MetricCard label="Team ID" value={displayValue(shownPlayer.teamId)} />
                        <MetricCard label="Player ID" value={displayValue(shownPlayer.id)} />
                        <MetricCard label="Squad Status" value={displayValue(shownPlayer.squadStatus)} />
                        <MetricCard label="Active" value={shownPlayer.isActiveInSquad === false ? 'No' : 'Yes'} />
                      </div>
                    </Section>

                    <div className="lg:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Section title="Playing Style" icon={<Activity className="h-4 w-4" />}>
                        <div className="grid grid-cols-2 gap-3">
                          <MetricCard label="Batting" value={displayValue(shownPlayer.battingStyle)} />
                          <MetricCard label="Bowling" value={displayValue(shownPlayer.bowlingStyle)} />
                          <MetricCard label="Role" value={displayValue(shownPlayer.role)} />
                          <MetricCard label="All-rounder" value={displayValue(shownPlayer.allrounderType)} />
                        </div>
                      </Section>

                      {overallPerformance ? (
                        <Section title="Overall Performance" icon={<Zap className="h-4 w-4" />}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-white/55">{overallPerformance.summary}</div>
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
                          {overallPerformance.breakdown?.length ? (
                            <div className="mt-4 space-y-2">
                              {overallPerformance.breakdown.slice(0, 8).map((item) => (
                                <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                                  <span className="text-white/60">{item.label}</span>
                                  <span className="text-white/80 font-semibold">{displayValue(item.value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </Section>
                      ) : null}
                    </div>
                  </div>

                  {stats && (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Section title="Batting Stats" icon={<BarChart3 className="h-4 w-4" />}>
                        <div className="grid grid-cols-2 gap-3">
                          <MetricCard label="Runs" value={displayValue(stats.runs)} />
                          <MetricCard label="Avg" value={displayValue(stats.average)} />
                          <MetricCard label="SR" value={displayValue(stats.strikeRate)} />
                          <MetricCard label="HS" value={displayValue(stats.highest)} />
                          <MetricCard label="4s" value={displayValue(stats.fours)} />
                          <MetricCard label="6s" value={displayValue(stats.sixes)} />
                          <MetricCard label="50s" value={displayValue(stats.fifties)} />
                          <MetricCard label="100s" value={displayValue(stats.hundreds)} />
                        </div>
                      </Section>

                      <Section title="Bowling Stats" icon={<Trophy className="h-4 w-4" />}>
                        <div className="grid grid-cols-2 gap-3">
                          <MetricCard label="Wickets" value={displayValue(stats.wickets)} />
                          <MetricCard label="Econ" value={displayValue(stats.economy)} />
                          <MetricCard label="Best" value={displayValue(stats.bestBowling)} hint="Wickets/Runs" />
                          <MetricCard label="Bowling Avg" value={displayValue(stats.bowlingAverage)} />
                          <MetricCard label="Matches" value={displayValue(stats.matches)} />
                          <MetricCard label="Team" value={displayValue(teamData?.shortName)} />
                        </div>
                      </Section>
                    </div>
                  )}

                  {(transferInfo ||
                    shownPlayer.squadExitReason ||
                    shownPlayer.squadExitDate ||
                    shownPlayer.seasonTeamHistory?.length) && (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Section title="Auction / Transfer" icon={<Zap className="h-4 w-4" />}>
                        {transferInfo ? (
                          <div className="grid grid-cols-2 gap-3">
                            {'acquiredVia' in transferInfo ? (
                              <MetricCard label="Acquired Via" value={displayValue(transferInfo.acquiredVia)} />
                            ) : null}
                            {'lastAuctionYear' in transferInfo ? (
                              <MetricCard label="Auction Year" value={displayValue(transferInfo.lastAuctionYear)} />
                            ) : null}
                            {'transferFee' in transferInfo ? (
                              <MetricCard label="Fee" value={displayValue(transferInfo.transferFee)} />
                            ) : null}
                            {'transferable' in transferInfo ? (
                              <MetricCard label="Transferable" value={transferInfo.transferable ? 'Yes' : 'No'} />
                            ) : null}
                            {'notes' in transferInfo ? (
                              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Notes</div>
                                <div className="mt-1 text-sm text-white/80 whitespace-pre-wrap">
                                  {displayValue(transferInfo.notes)}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-sm text-white/60">No auction/transfer data available.</div>
                        )}
                      </Section>

                      <Section title="Team History" icon={<Trophy className="h-4 w-4" />}>
                        <div className="grid grid-cols-2 gap-3">
                          <MetricCard label="Exit Reason" value={displayValue(shownPlayer.squadExitReason)} />
                          <MetricCard label="Exit Date" value={displayValue(shownPlayer.squadExitDate)} />
                        </div>
                        {shownPlayer.seasonTeamHistory?.length ? (
                          <div className="mt-4 space-y-2">
                            {shownPlayer.seasonTeamHistory.slice(0, 6).map((entry) => (
                              <div
                                key={`${entry.recordedAt}-${entry.teamId}-${entry.season}`}
                                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                              >
                                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-white">
                                  <span>
                                    Season {entry.season} • Team {entry.teamId}
                                  </span>
                                  <span className="text-white/70 text-xs">{displayValue(entry.recordedAt)}</span>
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-white/70">
                                  <span>Matches: <span className="text-white/90 font-semibold">{displayValue(entry.matches)}</span></span>
                                  <span>Runs: <span className="text-white/90 font-semibold">{displayValue(entry.runs)}</span></span>
                                  <span>Wkts: <span className="text-white/90 font-semibold">{displayValue(entry.wickets)}</span></span>
                                </div>
                                {entry.exitReason ? (
                                  <div className="mt-1 text-xs text-white/60">Exit: {entry.exitReason}</div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-4 text-sm text-white/60">No season history recorded.</div>
                        )}
                      </Section>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
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
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
