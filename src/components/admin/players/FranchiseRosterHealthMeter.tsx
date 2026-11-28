'use client';

import React, { useMemo } from 'react';
import type { Player } from '@/types';
import {
  Shield,
  Plane,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Briefcase,
  Layers,
  Activity,
} from 'lucide-react';
import {
  computeFranchiseRosterHealth,
  resolveIpl2027Team,
  isPlayerOverseas,
  IPL_2027_TEAMS,
  IPL_2027_BASE_PURSE_CR,
  IPL_2027_SQUAD_MAX,
  IPL_2027_OVERSEAS_MAX,
} from '@/lib/admin/ipl2027Teams';

interface FranchiseRosterHealthMeterProps {
  selectedTeamId: string;
  players: Player[];
  onOpenStandbyPool?: () => void;
  onOpenSignModal?: () => void;
}

export default function FranchiseRosterHealthMeter({
  selectedTeamId,
  players,
  onOpenStandbyPool,
  onOpenSignModal,
}: FranchiseRosterHealthMeterProps) {
  // If viewing a specific team
  const isSpecificTeam = selectedTeamId !== 'all' && selectedTeamId !== 'pool';
  const isPool = selectedTeamId === 'pool';

  const health = useMemo(() => {
    if (!isSpecificTeam) return null;
    return computeFranchiseRosterHealth(selectedTeamId, players);
  }, [isSpecificTeam, selectedTeamId, players]);

  // Pool Statistics
  const poolStats = useMemo(() => {
    if (!isPool) return null;
    const poolList = players.filter((p) => {
      const isTeamPool =
        p.teamId === 'pool' ||
        p.teamId === 'STANDBY_2027' ||
        (p.team || '').toLowerCase().includes('standby') ||
        (p.team || '').toLowerCase().includes('auction pool') ||
        (p.team || '').toLowerCase().includes('unassigned');
      const isReleased = (p.squadStatus || '').toLowerCase().includes('release');
      return isTeamPool || isReleased;
    });

    const overseas = poolList.filter((p) => isPlayerOverseas(p.nationality)).length;
    const indian = poolList.length - overseas;

    let batters = 0;
    let keepers = 0;
    let allRounders = 0;
    let bowlers = 0;

    poolList.forEach((p) => {
      const r = (p.role || '').toUpperCase();
      if (r.includes('KEEPER') || r.includes('WK')) keepers++;
      else if (r.includes('ALLROUNDER') || r.includes('ALL-ROUNDER') || r.includes('ALL ROUNDER')) allRounders++;
      else if (r.includes('BOWLER') || r.includes('BOWL')) bowlers++;
      else batters++;
    });

    return {
      total: poolList.length,
      overseas,
      indian,
      roles: { batters, keepers, allRounders, bowlers },
    };
  }, [isPool, players]);

  // League-wide Statistics for 'all'
  const leagueStats = useMemo(() => {
    if (selectedTeamId !== 'all') return null;
    const contracted = players.filter((p) => {
      const isPool =
        p.teamId === 'pool' ||
        p.teamId === 'STANDBY_2027' ||
        (p.team || '').toLowerCase().includes('standby') ||
        (p.squadStatus || '').toLowerCase().includes('release');
      return !isPool;
    });

    const overseas = contracted.filter((p) => isPlayerOverseas(p.nationality)).length;
    const standbys = players.length - contracted.length;

    let batters = 0;
    let keepers = 0;
    let allRounders = 0;
    let bowlers = 0;

    contracted.forEach((p) => {
      const r = (p.role || '').toUpperCase();
      if (r.includes('KEEPER') || r.includes('WK')) keepers++;
      else if (r.includes('ALLROUNDER') || r.includes('ALL-ROUNDER') || r.includes('ALL ROUNDER')) allRounders++;
      else if (r.includes('BOWLER') || r.includes('BOWL')) bowlers++;
      else batters++;
    });

    const total = contracted.length || 1;
    return {
      totalContracted: contracted.length,
      totalOverseas: overseas,
      overseasPct: Math.round((overseas / total) * 100),
      standbys,
      roles: {
        batters: { count: batters, pct: Math.round((batters / total) * 100) },
        keepers: { count: keepers, pct: Math.round((keepers / total) * 100) },
        allRounders: { count: allRounders, pct: Math.round((allRounders / total) * 100) },
        bowlers: { count: bowlers, pct: Math.round((bowlers / total) * 100) },
      },
    };
  }, [selectedTeamId, players]);

  // 1. SPECIFIC FRANCHISE HEALTH VIEW
  if (isSpecificTeam && health) {
    const {
      team,
      squadCount,
      squadMax,
      squadOpenSlots,
      squadStatus,
      overseasCount,
      overseasMax,
      overseasOpenSlots,
      overseasStatus,
      formattedRemainingPurse,
      formattedSpentPurse,
      spentPurseCr,
      remainingPurseCr,
      totalPurseCr,
      roles,
      injuredCount,
      injuredPlayers,
    } = health;

    const squadPercent = Math.min(100, Math.round((squadCount / squadMax) * 100));
    const purseSpentPercent = Math.min(100, Math.round((spentPurseCr / totalPurseCr) * 100));

    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-md space-y-4 animate-fade-in relative overflow-hidden">
        {/* Ambient Franchise Glow */}
        <div
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: team.primaryColor || '#f2d39a' }}
        />

        {/* Top Banner: Team Identity + Quick Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg border border-white/20"
              style={{ backgroundColor: team.primaryColor || '#dc2626' }}
            >
              {team.shortName}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {team.name}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                  IPL 2027 Ledger
                </span>
              </div>
              <p className="text-xs text-white/50">
                Official Roster Health & Dynamic Auction Purse Compliance
              </p>
            </div>
          </div>

          {/* Quick Actions (e.g. Sign from Standby Pool) */}
          <div className="flex items-center gap-2">
            {squadOpenSlots > 0 && onOpenSignModal && (
              <button
                type="button"
                onClick={onOpenSignModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shadow"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Sign from Standby Pool</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-semibold text-white/70">
              <Shield className="w-3.5 h-3.5 text-[#f2d39a]" />
              <span>Base Cap: ₹130.00 Cr</span>
            </div>
          </div>
        </div>

        {/* 4-Card Tactical Compliance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Squad Cap Gauge (Max 25, Min 18) */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#f2d39a]" />
                Squad Cap Gauge
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  squadStatus === 'full'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : squadStatus === 'below_min'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {squadStatus === 'full'
                  ? 'Squad Full'
                  : squadStatus === 'below_min'
                  ? 'Below Min 18'
                  : 'BCCI Compliant'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-white">
                {squadCount}
                <span className="text-sm font-bold text-white/40"> / {squadMax} Max</span>
              </div>
              <span className="text-xs font-bold text-[#f2d39a]">
                {squadOpenSlots === 0 ? '0 Open' : `${squadOpenSlots} Open Slots`}
              </span>
            </div>

            {/* Gauge Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    squadStatus === 'full'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      : squadStatus === 'below_min'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${squadPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-white/40">
                <span>Min: 18</span>
                <span>Max: 25 players</span>
              </div>
            </div>
          </div>

          {/* 2. Overseas Slots Tracker (Max 8) */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-sky-400" />
                Overseas Slot Tracker
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  overseasStatus === 'exceeded'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                    : overseasStatus === 'full'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                }`}
              >
                {overseasStatus === 'exceeded'
                  ? 'Cap Exceeded!'
                  : overseasStatus === 'full'
                  ? 'Quota Maxed'
                  : 'Slots Available'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-white">
                ✈️ {overseasCount}
                <span className="text-sm font-bold text-white/40"> / {overseasMax} Max</span>
              </div>
              <span className="text-xs font-bold text-sky-300">
                {overseasOpenSlots === 0 ? '0 Open' : `${overseasOpenSlots} Open Slots`}
              </span>
            </div>

            {/* 8-Segment Tick Tracker */}
            <div className="space-y-1">
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const isFilled = idx < overseasCount;
                  const isOverflow = idx >= 8;
                  return (
                    <div
                      key={idx}
                      className={`h-2 rounded-sm transition-all ${
                        isOverflow
                          ? 'bg-red-500'
                          : isFilled
                          ? 'bg-gradient-to-r from-sky-400 to-blue-500 shadow-sm shadow-sky-500/40'
                          : 'bg-white/10'
                      }`}
                      title={isFilled ? `Overseas slot ${idx + 1} filled` : `Overseas slot ${idx + 1} open`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-white/40">
                <span>BCCI Hard Limit</span>
                <span>Max 8 Overseas</span>
              </div>
            </div>
          </div>

          {/* 3. Dynamic Purse Spent vs Remaining */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Dynamic Auction Purse
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Calculated
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-[#f2d39a]">
                {formattedRemainingPurse}
              </div>
              <span className="text-xs font-bold text-white/50">Purse Left</span>
            </div>

            {/* Purse Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-[#f2d39a] rounded-full transition-all duration-500"
                  style={{ width: `${purseSpentPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-white/40">
                <span>Committed: {formattedSpentPurse}</span>
                <span>Cap: ₹130 Cr</span>
              </div>
            </div>
          </div>

          {/* 4. Squad Composition Overview */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                Roster Depth
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                4 Departments
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 text-center py-1">
              <div>
                <div className="text-xs font-black text-emerald-400">{roles.batters.count}</div>
                <div className="text-[9px] font-bold text-white/40 uppercase">Bat</div>
              </div>
              <div>
                <div className="text-xs font-black text-amber-400">{roles.keepers.count}</div>
                <div className="text-[9px] font-bold text-white/40 uppercase">WK</div>
              </div>
              <div>
                <div className="text-xs font-black text-cyan-400">{roles.allRounders.count}</div>
                <div className="text-[9px] font-bold text-white/40 uppercase">AR</div>
              </div>
              <div>
                <div className="text-xs font-black text-rose-400">{roles.bowlers.count}</div>
                <div className="text-[9px] font-bold text-white/40 uppercase">Bowl</div>
              </div>
            </div>

            <div className="text-[10px] font-semibold text-white/50 text-right">
              Balance: {roles.allRounders.count + roles.bowlers.count >= 12 ? 'Bowling Heavy' : 'Batting Heavy'}
            </div>
          </div>
        </div>

        {/* Role Balance Segmented Visual Strip */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs">
            <span className="font-extrabold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#f2d39a]" />
              Tactical Role Balance Strip
            </span>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
              <span className="text-emerald-400">
                ■ Batters {roles.batters.percentage}% ({roles.batters.count})
              </span>
              <span className="text-amber-400">
                ■ WKs {roles.keepers.percentage}% ({roles.keepers.count})
              </span>
              <span className="text-cyan-400">
                ■ All-Rounders {roles.allRounders.percentage}% ({roles.allRounders.count})
              </span>
              <span className="text-rose-400">
                ■ Bowlers {roles.bowlers.percentage}% ({roles.bowlers.count})
              </span>
            </div>
          </div>

          {/* Segmented Horizontal Bar */}
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
            {roles.batters.percentage > 0 && (
              <div
                className="h-full bg-emerald-500 transition-all hover:opacity-90"
                style={{ width: `${roles.batters.percentage}%` }}
                title={`Batters: ${roles.batters.count} (${roles.batters.percentage}%)`}
              />
            )}
            {roles.keepers.percentage > 0 && (
              <div
                className="h-full bg-amber-500 transition-all hover:opacity-90"
                style={{ width: `${roles.keepers.percentage}%` }}
                title={`Wicketkeepers: ${roles.keepers.count} (${roles.keepers.percentage}%)`}
              />
            )}
            {roles.allRounders.percentage > 0 && (
              <div
                className="h-full bg-cyan-500 transition-all hover:opacity-90"
                style={{ width: `${roles.allRounders.percentage}%` }}
                title={`All-Rounders: ${roles.allRounders.count} (${roles.allRounders.percentage}%)`}
              />
            )}
            {roles.bowlers.percentage > 0 && (
              <div
                className="h-full bg-rose-500 transition-all hover:opacity-90"
                style={{ width: `${roles.bowlers.percentage}%` }}
                title={`Bowlers: ${roles.bowlers.count} (${roles.bowlers.percentage}%)`}
              />
            )}
          </div>
        </div>

        {/* Conditional Alert: Injured / Ruled-Out Players (BCCI RAPP Clause) */}
        {injuredCount > 0 && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black text-rose-300">
                  🏥 {injuredCount} Injury Replacement Vacanc{injuredCount > 1 ? 'ies' : 'y'} Unlocked (BCCI RAPP Clause)
                </div>
                <div className="text-[11px] text-white/70 mt-0.5">
                  {injuredPlayers.map((p) => p.name).join(', ')} marked as Withdrawn / Injured.
                  Franchise is eligible to sign replacement talent from the Registered Available Player Pool (RAPP).
                </div>
              </div>
            </div>

            {onOpenStandbyPool && (
              <button
                type="button"
                onClick={onOpenStandbyPool}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow"
              >
                <span>Find Replacement in Standby Pool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. STANDBY POOL (RAPP) OVERVIEW
  if (isPool && poolStats) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-950 p-5 shadow-2xl space-y-4 animate-fade-in relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                BCCI RAPP Regulated
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                Registered Available Player Pool (RAPP)
              </h3>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Official pool of unsold auction players and released talent eligible for mid-season injury replacement contracts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-black text-red-300">
              {poolStats.total} Standby Players Available
            </span>
          </div>
        </div>

        {/* 3 Metrics for Pool */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3.5">
            <div className="text-[11px] font-bold text-white/50 uppercase">Talent Pool Total</div>
            <div className="text-2xl font-black text-white mt-1">{poolStats.total} Players</div>
            <div className="text-[10px] text-white/40 mt-1">Available for immediate franchise signing</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3.5">
            <div className="text-[11px] font-bold text-white/50 uppercase">Nationality Distribution</div>
            <div className="text-2xl font-black text-sky-400 mt-1">
              {poolStats.indian} Indian · {poolStats.overseas} Overseas
            </div>
            <div className="text-[10px] text-white/40 mt-1">Subject to franchise 8-overseas cap</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3.5">
            <div className="text-[11px] font-bold text-white/50 uppercase">Available Roles</div>
            <div className="flex items-center gap-2.5 mt-1 text-xs font-black">
              <span className="text-emerald-400">{poolStats.roles.batters} Bat</span>
              <span className="text-amber-400">{poolStats.roles.keepers} WK</span>
              <span className="text-cyan-400">{poolStats.roles.allRounders} AR</span>
              <span className="text-rose-400">{poolStats.roles.bowlers} Bowl</span>
            </div>
            <div className="text-[10px] text-white/40 mt-1">Ready for emergency tactical deployment</div>
          </div>
        </div>

        {/* BCCI Rule Guidance Card */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-white/70 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#f2d39a] shrink-0" />
          <span>
            <strong>BCCI Signing Regulation:</strong> Replacement contracts can be executed up to Match 12. Contract fee must meet or exceed auction base price and cannot surpass the replaced player's salary cap.
          </span>
        </div>
      </div>
    );
  }

  // 3. LEAGUE-WIDE OVERVIEW (selectedTeamId === 'all')
  if (leagueStats) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-xl space-y-3 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#f2d39a] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#f2d39a]" />
              IPL 2027 Macro League Roster Health
            </span>
            <span className="text-[11px] text-white/50">· 10 Franchises Cap Compliance</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-white/70">
            <span>Contracted: <strong className="text-white">{leagueStats.totalContracted}</strong></span>
            <span>Overseas: <strong className="text-sky-400">{leagueStats.totalOverseas} ({leagueStats.overseasPct}%)</strong></span>
            <span>Standby: <strong className="text-red-400">{leagueStats.standbys}</strong></span>
          </div>
        </div>

        {/* League Role Balance Strip */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-white/60">Macro Tactical Balance:</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">■ Batters {leagueStats.roles.batters.pct}% ({leagueStats.roles.batters.count})</span>
              <span className="text-amber-400">■ WKs {leagueStats.roles.keepers.pct}% ({leagueStats.roles.keepers.count})</span>
              <span className="text-cyan-400">■ ARs {leagueStats.roles.allRounders.pct}% ({leagueStats.roles.allRounders.count})</span>
              <span className="text-rose-400">■ Bowlers {leagueStats.roles.bowlers.pct}% ({leagueStats.roles.bowlers.count})</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: `${leagueStats.roles.batters.pct}%` }} />
            <div className="h-full bg-amber-500" style={{ width: `${leagueStats.roles.keepers.pct}%` }} />
            <div className="h-full bg-cyan-500" style={{ width: `${leagueStats.roles.allRounders.pct}%` }} />
            <div className="h-full bg-rose-500" style={{ width: `${leagueStats.roles.bowlers.pct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
