'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Crown,
  Globe,
  Hash,
  Shield,
  Target,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { sanitizeNoPinkHex, hexToRgba } from '@/lib/teamColors';
import { formatDateMonthDDYYYY, calculateAge } from '@/lib/dateUtils';
import {
  extractMultiFormatBattingRows,
  extractMultiFormatBowlingRows,
  getInitials,
  getPlayerLeagueStats,
  getRoleMeta,
  isOverseasPlayer,
  safeText,
} from './playerHelpers';

export interface PlayerProfileModalProps {
  player: any | null;
  isOpen: boolean;
  onClose: () => void;
  league?: 'ipl' | 'wpl';
  teamName?: string;
  teamShortName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  roleBadges?: string[];
}

export default function PlayerProfileModal({
  player,
  isOpen,
  onClose,
  league = 'ipl',
  teamName,
  teamShortName,
  primaryColor = '#1D4ED8',
  secondaryColor = '#F59E0B',
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
  roleBadges = [],
}: PlayerProfileModalProps) {
  const [mounted, setMounted] = useState(false);

  const safePrimary = sanitizeNoPinkHex(primaryColor, '#1D4ED8');
  const safeSecondary = sanitizeNoPinkHex(secondaryColor, '#F59E0B');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
      else if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, hasNext, hasPrev, onNext, onPrev]);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && player && (
        <motion.div
          key="player-profile-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key={String(player.id || player.name)}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#070B18] border border-white/15 shadow-2xl text-slate-100"
            style={{
              boxShadow: `0 25px 70px -15px rgba(0, 0, 0, 0.85), 0 0 40px -10px ${hexToRgba(safePrimary, 0.3)}`,
            }}
          >
            {/* Top accent hairline */}
            <div
              className="h-1.5 w-full rounded-t-3xl"
              style={{
                background: `linear-gradient(90deg, ${safePrimary}, ${safeSecondary}, #22D3EE)`,
              }}
            />

            {/* Header toolbar */}
            <div className="flex items-center justify-between px-5 sm:px-8 pt-5 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>{teamShortName || league.toUpperCase()} Player Profile</span>
              </div>

              <div className="flex items-center gap-2">
                {(hasPrev || hasNext) && (
                  <div className="flex items-center gap-1 mr-2 bg-white/[0.04] border border-white/10 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={onPrev}
                      disabled={!hasPrev}
                      aria-label="Previous player"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onNext}
                      disabled={!hasNext}
                      aria-label="Next player"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close player profile"
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {(() => {
              const roleMeta = getRoleMeta(player.role);
              const initials = getInitials(player.name);
              const overseas = isOverseasPlayer(player.nationality);
              const leagueMetrics = getPlayerLeagueStats(player, league);
              const batRows = extractMultiFormatBattingRows(player, league);
              const bowlRows = extractMultiFormatBowlingRows(player, league);
              const dobDisplay = player.dateOfBirth ? formatDateMonthDDYYYY(player.dateOfBirth) : null;
              const ageDisplay = player.age || (player.dateOfBirth ? calculateAge(player.dateOfBirth) : null);
              const jerseyDisplay =
                player.jerseyNumber && String(player.jerseyNumber) !== 'N/A' && Number(player.jerseyNumber) > 0
                  ? `#${player.jerseyNumber}`
                  : null;
              const auctionFee =
                player.auction?.fee && (typeof player.auction.fee === 'string' || typeof player.auction.fee === 'number')
                  ? String(player.auction.fee)
                  : null;

              return (
                <div className="px-5 sm:px-8 pb-8 pt-2 space-y-6">
                  {/* Athlete Hero Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F172A] via-[#0B1122] to-[#080C19] p-5 sm:p-6">
                    <div
                      className="absolute -right-12 -top-12 w-56 h-56 rounded-full blur-3xl opacity-25 pointer-events-none"
                      style={{ background: safePrimary }}
                    />

                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      {/* Avatar */}
                      <div
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border-2 flex flex-col items-center justify-center relative shadow-xl"
                        style={{
                          borderColor: hexToRgba(safePrimary, 0.55),
                          background: `linear-gradient(145deg, ${hexToRgba(safePrimary, 0.25)}, #060913)`,
                        }}
                      >
                        {player.image ? (
                          <img
                            src={player.image}
                            alt={player.name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <>
                            <span className="text-3xl font-black tracking-tight text-white">
                              {initials}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mt-1">
                              {roleMeta.short}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Identity & Bio Pills */}
                      <div className="flex-1 text-center sm:text-left min-w-0 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border ${roleMeta.badgeClass}`}>
                            {roleMeta.label}
                          </span>
                          {player.isCaptain && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                              <Crown className="w-3 h-3 text-amber-400" />
                              Captain
                            </span>
                          )}
                          {overseas && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-500/15 border border-sky-400/35 text-sky-300 text-[11px] font-bold">
                              <Globe className="w-3 h-3" />
                              Overseas
                            </span>
                          )}
                          {jerseyDisplay && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/[0.06] border border-white/10 text-slate-200 text-[11px] font-mono font-bold">
                              <Hash className="w-3 h-3 text-slate-400" />
                              {jerseyDisplay.slice(1)}
                            </span>
                          )}
                          {roleBadges.map((badge) => (
                            <span
                              key={badge}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-[11px] font-bold"
                            >
                              <Award className="w-3 h-3 text-cyan-400" />
                              {badge}
                            </span>
                          ))}
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                          {player.name}
                        </h2>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-300">
                          {teamName && (
                            <span className="inline-flex items-center gap-1.5 text-slate-200 font-semibold">
                              <Shield className="w-3.5 h-3.5 text-cyan-400" />
                              {teamName}
                            </span>
                          )}
                          <span>
                            Nation: <strong className="text-white">{safeText(player.nationality, 'India')}</strong>
                          </span>
                          {(dobDisplay || ageDisplay) && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {dobDisplay || ''}
                                {ageDisplay ? ` (${ageDisplay} yrs)` : ''}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-300">
                          <span className="px-3 py-1 rounded-xl bg-black/40 border border-white/[0.07]">
                            Bat: <strong className="text-white">{safeText(player.battingStyle, 'Right-hand bat')}</strong>
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-black/40 border border-white/[0.07]">
                            Bowl: <strong className="text-white">{safeText(player.bowlingStyle, '—')}</strong>
                          </span>
                          {auctionFee && (
                            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                              Fee: <strong>{auctionFee}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Snapshot Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Matches
                      </span>
                      <span className="text-2xl font-black text-white tabular-nums mt-1 block">
                        {leagueMetrics.matches || '—'}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                        Runs • HS
                      </span>
                      <span className="text-2xl font-black text-white tabular-nums mt-1 block">
                        {leagueMetrics.runs}{' '}
                        <span className="text-xs font-bold text-slate-400">
                          ({leagueMetrics.highest})
                        </span>
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                        Wickets • Best
                      </span>
                      <span className="text-2xl font-black text-white tabular-nums mt-1 block">
                        {leagueMetrics.wickets}{' '}
                        <span className="text-xs font-bold text-slate-400">
                          ({leagueMetrics.bestBowling})
                        </span>
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                        SR • Economy
                      </span>
                      <span className="text-2xl font-black text-white tabular-nums mt-1 block">
                        {leagueMetrics.strikeRate}
                        <span className="text-xs font-bold text-slate-400 ml-1">
                          / {leagueMetrics.economy}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Batting Career Summary */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Batting Career Summary</span>
                      </h3>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        All-Format Record
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1020]">
                      <table className="w-full text-center text-xs tabular-nums">
                        <thead className="bg-white/[0.04] text-slate-300 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3 text-left">Format</th>
                            <th className="py-2.5 px-2">Mat</th>
                            <th className="py-2.5 px-2">Inn</th>
                            <th className="py-2.5 px-2">NO</th>
                            <th className="py-2.5 px-2">Runs</th>
                            <th className="py-2.5 px-2">HS</th>
                            <th className="py-2.5 px-2">Avg</th>
                            <th className="py-2.5 px-2">BF</th>
                            <th className="py-2.5 px-2">SR</th>
                            <th className="py-2.5 px-2">100</th>
                            <th className="py-2.5 px-2">50</th>
                            <th className="py-2.5 px-2">4s</th>
                            <th className="py-2.5 px-2">6s</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06] font-semibold text-slate-200">
                          {batRows.length > 0 ? (
                            batRows.map((row) => (
                              <tr key={row.format} className="hover:bg-white/[0.03] transition-colors">
                                <td className="py-2.5 px-3 text-left font-black text-white">{row.format}</td>
                                <td className="py-2.5 px-2">{row.mat}</td>
                                <td className="py-2.5 px-2">{row.inn}</td>
                                <td className="py-2.5 px-2">{row.no}</td>
                                <td className="py-2.5 px-2 font-black text-emerald-400">{row.runs}</td>
                                <td className="py-2.5 px-2 font-bold">{row.hs}</td>
                                <td className="py-2.5 px-2 font-bold text-cyan-400">{row.avg}</td>
                                <td className="py-2.5 px-2">{row.bf}</td>
                                <td className="py-2.5 px-2 font-bold text-amber-400">{row.sr}</td>
                                <td className="py-2.5 px-2">{row.hundreds}</td>
                                <td className="py-2.5 px-2">{row.fifties}</td>
                                <td className="py-2.5 px-2">{row.fours}</td>
                                <td className="py-2.5 px-2">{row.sixes}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={13} className="py-5 text-center text-slate-400">
                                Batting career figures are being updated for this player.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bowling Career Summary */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span>Bowling Career Summary</span>
                      </h3>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Multi-Format Splits
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1020]">
                      <table className="w-full text-center text-xs tabular-nums">
                        <thead className="bg-white/[0.04] text-slate-300 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3 text-left">Format</th>
                            <th className="py-2.5 px-2">Mat</th>
                            <th className="py-2.5 px-2">Inn</th>
                            <th className="py-2.5 px-2">Balls</th>
                            <th className="py-2.5 px-2">Runs</th>
                            <th className="py-2.5 px-2">Wkts</th>
                            <th className="py-2.5 px-2">BBI</th>
                            <th className="py-2.5 px-2">Econ</th>
                            <th className="py-2.5 px-2">Avg</th>
                            <th className="py-2.5 px-2">SR</th>
                            <th className="py-2.5 px-2">5W</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06] font-semibold text-slate-200">
                          {bowlRows.length > 0 ? (
                            bowlRows.map((row) => (
                              <tr key={row.format} className="hover:bg-white/[0.03] transition-colors">
                                <td className="py-2.5 px-3 text-left font-black text-white">{row.format}</td>
                                <td className="py-2.5 px-2">{row.mat}</td>
                                <td className="py-2.5 px-2">{row.inn}</td>
                                <td className="py-2.5 px-2">{row.balls}</td>
                                <td className="py-2.5 px-2">{row.runs}</td>
                                <td className="py-2.5 px-2 font-black text-cyan-400">{row.wkts}</td>
                                <td className="py-2.5 px-2">{row.bbi}</td>
                                <td className="py-2.5 px-2 font-bold text-amber-400">{row.econ}</td>
                                <td className="py-2.5 px-2 font-bold text-indigo-300">{row.avg}</td>
                                <td className="py-2.5 px-2 font-bold text-orange-400">{row.sr}</td>
                                <td className="py-2.5 px-2">{row.fiveW}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={11} className="py-5 text-center text-slate-400">
                                No bowling spells recorded for this athlete.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Fielding & Action Footer */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        Official Squad Telemetry
                      </span>
                      {player.stats?.catches ? (
                        <span>
                          Catches: <strong className="text-white">{String(player.stats.catches)}</strong>
                        </span>
                      ) : null}
                      {player.stats?.stumpings ? (
                        <span>
                          Stumpings: <strong className="text-white">{String(player.stats.stumpings)}</strong>
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold transition-all"
                    >
                      Close Profile
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
