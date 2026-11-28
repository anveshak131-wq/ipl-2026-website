'use client';

import React, { useState, useMemo } from 'react';
import type { Player } from '@/types';
import {
  Shield,
  Sparkles,
  Plane,
  Zap,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Users,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import {
  resolveIpl2027Team,
  IPL_2027_TEAMS,
  isPlayerOverseas,
  IPL2027TeamMeta,
} from '@/lib/admin/ipl2027Teams';
import PlayerMonogramAvatar from '@/components/admin/players/PlayerMonogramAvatar';
import FlagImage from '@/components/ui/FlagImage';

interface PitchFormationViewProps {
  players: Player[];
  selectedTeamId: string;
  onViewPlayer: (player: Player) => void;
  onSelectTeam?: (teamId: string) => void;
}

export default function PitchFormationView({
  players,
  selectedTeamId,
  onViewPlayer,
  onSelectTeam,
}: PitchFormationViewProps) {
  const isAll = selectedTeamId === 'all';
  const isPool = selectedTeamId === 'pool';
  const metaTeam = resolveIpl2027Team(selectedTeamId);

  // Tactical Impact Player Setup: 'batting' (Finisher/Pinch Hitter) vs 'bowling' (Death Pacer/Spinner)
  const [tacticalMode, setTacticalMode] = useState<'batting' | 'bowling'>('bowling');
  // State for manual swap modal/selector
  const [swappingSlotIndex, setSwappingSlotIndex] = useState<number | null>(null);
  const [customSlotPlayerIds, setCustomSlotPlayerIds] = useState<Record<number, string>>({});

  // 1. ALL PLAYERS SELECTION SCREEN
  if (isAll) {
    return (
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6 animate-fade-in">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#f2d39a]/10 text-[#f2d39a] border border-[#f2d39a]/20">
            <Sparkles className="w-3.5 h-3.5" />
            Tactical Pitch Simulator
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Select an IPL Franchise to Simulate Playing XI
          </h2>
          <p className="text-xs sm:text-sm text-white/60">
            Pick a franchise to view its projected 11 positions, official BCCI 4-Overseas Cap compliance, and 12th-man Impact Player strategies.
          </p>
        </div>

        {/* 10 Franchises Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-4xl mx-auto pt-2">
          {IPL_2027_TEAMS.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => onSelectTeam && onSelectTeam(team.id)}
              className="group p-4 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-800/80 hover:border-white/30 transition-all text-left flex flex-col justify-between shadow-lg hover:-translate-y-1 relative overflow-hidden"
            >
              <div
                className="absolute right-0 top-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none transition-all group-hover:opacity-30"
                style={{ backgroundColor: team.primaryColor || '#dc2626' }}
              />

              <div className="flex items-center justify-between mb-3">
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-black text-white shadow"
                  style={{ backgroundColor: team.primaryColor || '#475569' }}
                >
                  {team.shortName}
                </span>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>

              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#f2d39a] transition-colors line-clamp-1">
                  {team.name}
                </div>
                <div className="text-[10px] text-white/50 mt-1">
                  Project Playing XI & Subs
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Active squad players for current view
  const squadPlayers = useMemo(() => {
    return players.filter((p) => {
      if (isPool) {
        return (
          p.teamId === 'pool' ||
          p.teamId === 'STANDBY_2027' ||
          (p.team || '').toLowerCase().includes('standby') ||
          (p.squadStatus || '').toLowerCase().includes('release')
        );
      }
      const isTeam =
        String(p.teamId) === String(selectedTeamId) ||
        (p.teamShortName && p.teamShortName.toUpperCase() === metaTeam?.shortName) ||
        (p.team && metaTeam && p.team.toLowerCase().includes(metaTeam.name.toLowerCase()));
      const isReleased = (p.squadStatus || '').toLowerCase().includes('release');
      return isTeam && !isReleased;
    });
  }, [players, selectedTeamId, isPool, metaTeam]);

  // Department Pools
  const { batsmen, keepers, allrounders, bowlers } = useMemo(() => {
    const bat: Player[] = [];
    const wk: Player[] = [];
    const ar: Player[] = [];
    const bowl: Player[] = [];

    squadPlayers.forEach((p) => {
      const r = (p.role || '').toUpperCase();
      if (r.includes('KEEPER') || r.includes('WK')) wk.push(p);
      else if (r.includes('ALLROUNDER') || r.includes('ALL-ROUNDER') || r.includes('ALL ROUNDER')) ar.push(p);
      else if (r.includes('BOWLER') || r.includes('BOWL')) bowl.push(p);
      else bat.push(p);
    });

    return { batsmen: bat, keepers: wk, allrounders: ar, bowlers: bowl };
  }, [squadPlayers]);

  // Build projected 11 enforcing BCCI 4-Overseas Cap
  const { playing11, benchPlayers, xiOverseasCount, isOverseasCompliant } = useMemo(() => {
    const usedIds = new Set<string>();
    const xi: Array<{ pos: string; label: string; department: string; player?: Player }> = [];
    let currentOverseas = 0;

    // Slot Blueprint
    const blueprint = [
      { pos: '1', label: 'Opener (Bat)', department: 'BAT' },
      { pos: '2', label: 'Opener (Bat)', department: 'BAT' },
      { pos: '3', label: 'Top Order (Bat)', department: 'BAT' },
      { pos: '4', label: 'Anchor / Middle', department: 'BAT' },
      { pos: '5', label: 'Wicket-Keeper (WK)', department: 'WK' },
      { pos: '6', label: 'Power Finisher (AR)', department: 'AR' },
      { pos: '7', label: 'Spin / Pace Allrounder', department: 'AR' },
      { pos: '8', label: 'Lead Spinner / Pacer', department: 'BOWL' },
      { pos: '9', label: 'Fast Bowler', department: 'BOWL' },
      { pos: '10', label: 'Strike Quick', department: 'BOWL' },
      { pos: '11', label: 'Death Specialist', department: 'BOWL' },
    ];

    // Helper: Pick candidate respecting manual swap, role department, and 4-overseas limit
    const pickForSlot = (idx: number, department: string): Player | undefined => {
      // 1. Check if user manually customized this slot
      if (customSlotPlayerIds[idx]) {
        const customPlayer = squadPlayers.find((p) => p.id === customSlotPlayerIds[idx]);
        if (customPlayer) {
          usedIds.add(customPlayer.id);
          if (isPlayerOverseas(customPlayer.nationality)) currentOverseas++;
          return customPlayer;
        }
      }

      // 2. Select primary role pool
      let primaryPool: Player[] = [];
      let backupPool: Player[] = [];

      if (department === 'WK') {
        primaryPool = keepers;
        backupPool = [...batsmen, ...allrounders];
      } else if (department === 'AR') {
        primaryPool = allrounders;
        backupPool = [...batsmen, ...bowlers];
      } else if (department === 'BOWL') {
        primaryPool = bowlers;
        backupPool = [...allrounders];
      } else {
        primaryPool = batsmen;
        backupPool = [...allrounders, ...keepers];
      }

      // If overseas cap reached (>=4), must pick domestic Indian
      if (currentOverseas >= 4) {
        const domesticPrimary = primaryPool.find((p) => !usedIds.has(p.id) && !isPlayerOverseas(p.nationality));
        if (domesticPrimary) {
          usedIds.add(domesticPrimary.id);
          return domesticPrimary;
        }
        const domesticBackup = backupPool.find((p) => !usedIds.has(p.id) && !isPlayerOverseas(p.nationality));
        if (domesticBackup) {
          usedIds.add(domesticBackup.id);
          return domesticBackup;
        }
      }

      // Otherwise pick best available from primary
      const candidate = primaryPool.find((p) => !usedIds.has(p.id)) || backupPool.find((p) => !usedIds.has(p.id));
      if (candidate) {
        usedIds.add(candidate.id);
        if (isPlayerOverseas(candidate.nationality)) {
          currentOverseas++;
        }
        return candidate;
      }

      // Fallback to any remaining player in squad
      const anyRemaining = squadPlayers.find((p) => !usedIds.has(p.id));
      if (anyRemaining) {
        usedIds.add(anyRemaining.id);
        if (isPlayerOverseas(anyRemaining.nationality)) {
          currentOverseas++;
        }
        return anyRemaining;
      }

      return undefined;
    };

    blueprint.forEach((slot, idx) => {
      const selected = pickForSlot(idx, slot.department);
      xi.push({ ...slot, player: selected });
    });

    const bench = squadPlayers.filter((p) => !usedIds.has(p.id));
    return {
      playing11: xi,
      benchPlayers: bench,
      xiOverseasCount: currentOverseas,
      isOverseasCompliant: currentOverseas <= 4,
    };
  }, [squadPlayers, batsmen, keepers, allrounders, bowlers, customSlotPlayerIds]);

  // Impact Player (12th Man) Selection (Under BCCI Rules)
  // If XI has 4 overseas, Impact Player MUST be Indian domestic!
  const impactPlayer = useMemo(() => {
    const eligibleBench = xiOverseasCount >= 4
      ? benchPlayers.filter((p) => !isPlayerOverseas(p.nationality))
      : benchPlayers;

    if (eligibleBench.length === 0) return benchPlayers[0] || null;

    if (tacticalMode === 'bowling') {
      return (
        eligibleBench.find((p) => (p.role || '').toLowerCase().includes('bowl')) ||
        eligibleBench.find((p) => (p.role || '').toLowerCase().includes('all')) ||
        eligibleBench[0]
      );
    } else {
      return (
        eligibleBench.find((p) => (p.role || '').toLowerCase().includes('bat')) ||
        eligibleBench.find((p) => (p.role || '').toLowerCase().includes('all')) ||
        eligibleBench.find((p) => (p.role || '').toLowerCase().includes('keeper')) ||
        eligibleBench[0]
      );
    }
  }, [benchPlayers, xiOverseasCount, tacticalMode]);

  // Slot Renderer
  const renderSlot = (slot: { pos: string; label: string; player?: Player }, slotIndex: number, colorClass: string) => {
    const isOverseas = slot.player ? isPlayerOverseas(slot.player.nationality) : false;

    return (
      <div
        key={slot.pos}
        className={`group p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between relative overflow-hidden ${
          slot.player
            ? 'bg-slate-900/80 border-white/10 hover:border-[#f2d39a] hover:-translate-y-1 shadow-lg'
            : 'border-dashed border-white/10 bg-slate-950/40'
        }`}
      >
        {/* Top Position Tag + Swap Trigger */}
        <div className="w-full flex items-center justify-between text-[10px] font-black">
          <span className={colorClass}>#{slot.pos} · {slot.label}</span>
          {slot.player && benchPlayers.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSwappingSlotIndex(slotIndex);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80 transition-all"
              title="Swap with bench player"
            >
              <ArrowRightLeft className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Player Avatar */}
        <div
          onClick={() => slot.player && onViewPlayer(slot.player)}
          className="my-2 cursor-pointer transition-transform hover:scale-105"
        >
          {slot.player ? (
            <PlayerMonogramAvatar
              name={slot.player.name}
              teamShortName={metaTeam?.shortName}
              size="sm"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/30 text-xs">
              +
            </div>
          )}
        </div>

        {/* Player Name & Badges */}
        <div
          onClick={() => slot.player && onViewPlayer(slot.player)}
          className="w-full cursor-pointer"
        >
          <div className="text-xs sm:text-sm font-black text-white truncate max-w-full hover:text-[#f2d39a] transition-colors">
            {slot.player ? slot.player.name : 'Slot Open'}
          </div>

          {slot.player && (
            <div className="text-[10px] text-white/60 mt-0.5 truncate flex items-center justify-center gap-1.5">
              <span>{slot.player.role}</span>
              {isOverseas && (
                <span className="text-sky-300 font-bold bg-sky-500/20 px-1 py-0.2 rounded text-[9px]">
                  ✈️ OS
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl relative overflow-hidden space-y-6">
      {/* Pitch Header & BCCI Overseas Compliance Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow"
              style={{ backgroundColor: metaTeam?.primaryColor || '#dc2626' }}
            >
              {metaTeam?.shortName || (isPool ? 'RAPP' : 'IPL')}
            </span>
            <h3 className="text-lg font-black text-white tracking-tight">
              {metaTeam?.name || (isPool ? '2027 Auction Standby Pool' : 'Franchise')} · Projected Playing XI
            </h3>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Tactical cricket pitch formation strictly enforcing BCCI 4-Overseas Cap and official Impact Player rules
          </p>
        </div>

        {/* BCCI Playing XI Overseas Compliance Chip */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isOverseasCompliant
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>✈️ {xiOverseasCount} / 4 Overseas in XI</span>
            {isOverseasCompliant ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 ml-1" />
            )}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/80">
            <span>🇮🇳 {11 - xiOverseasCount} / 7 Domestic</span>
          </div>
        </div>
      </div>

      {/* Main Pitch Formation */}
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Top Order Row (1-3) */}
        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
            🏏 Top Order (1 - 3)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {playing11.slice(0, 3).map((slot, idx) => renderSlot(slot, idx, 'text-[#f2d39a]'))}
          </div>
        </div>

        {/* Middle Order & All-Rounders Row (4-7) */}
        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-950/60 px-3 py-1 rounded-full border border-sky-500/30">
            ⚡ Middle Order & All-Rounders (4 - 7)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {playing11.slice(3, 7).map((slot, idx) => renderSlot(slot, idx + 3, 'text-[#a8e9ef]'))}
          </div>
        </div>

        {/* Bowling Unit Row (8-11) */}
        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
            🎯 Bowling Unit & Pace Attack (8 - 11)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {playing11.slice(7, 11).map((slot, idx) => renderSlot(slot, idx + 7, 'text-amber-300'))}
          </div>
        </div>

        {/* 12th MAN: OFFICIAL BCCI IMPACT PLAYER MODULE */}
        <div className="rounded-2xl border border-[#f2d39a]/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#f2d39a]/20 text-[#f2d39a]">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#f2d39a]">
                  BCCI Official Impact Player (12th Man)
                </h4>
                <p className="text-[11px] text-white/50">
                  Tactical substitute activated mid-innings based on match situation
                </p>
              </div>
            </div>

            {/* Tactical Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-white/10">
              <button
                type="button"
                onClick={() => setTacticalMode('bowling')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                  tacticalMode === 'bowling'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                🎯 Bowling Setup (Death Pacer)
              </button>
              <button
                type="button"
                onClick={() => setTacticalMode('batting')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                  tacticalMode === 'batting'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                🏏 Batting Setup (Finisher)
              </button>
            </div>
          </div>

          {/* Impact Player Display Card */}
          {impactPlayer ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-white/10">
              <div
                onClick={() => onViewPlayer(impactPlayer)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <PlayerMonogramAvatar
                  name={impactPlayer.name}
                  teamShortName={metaTeam?.shortName}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white group-hover:text-[#f2d39a] transition-colors">
                      {impactPlayer.name}
                    </span>
                    {impactPlayer.nationality && (
                      <FlagImage nationality={impactPlayer.nationality} size="sm" />
                    )}
                    {isPlayerOverseas(impactPlayer.nationality) ? (
                      <span className="text-[9px] font-bold text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded border border-sky-500/30">
                        ✈️ Overseas Impact
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        🇮🇳 Domestic Impact
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/60 mt-0.5">
                    {impactPlayer.role} · #{impactPlayer.jerseyNumber || '—'} · {tacticalMode === 'bowling' ? 'Pace/Spin Enforcer' : 'Power Surge Finisher'}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-white/50 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 max-w-xs">
                {xiOverseasCount >= 4 ? (
                  <span>
                    ℹ️ <strong>BCCI Rule:</strong> Starting XI has 4 Overseas players; Impact Sub <strong>must</strong> be Indian.
                  </span>
                ) : (
                  <span>
                    ℹ️ <strong>BCCI Rule:</strong> 1 Overseas slot vacant; Overseas Impact Player eligible.
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-white/40">
              No bench players available for Impact Player assignment.
            </div>
          )}
        </div>

        {/* Bench Depth Tray */}
        {benchPlayers.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white/70">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-white/50" />
                Remaining Bench Depth ({benchPlayers.length} Players)
              </span>
              <span className="text-[11px] text-white/40">Click any bench player to view dossier or swap into XI</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {benchPlayers.map((bp) => {
                const isOS = isPlayerOverseas(bp.nationality);
                return (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => onViewPlayer(bp)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/30 text-white text-xs font-bold transition-all hover:-translate-y-0.5"
                  >
                    <PlayerMonogramAvatar
                      name={bp.name}
                      teamShortName={metaTeam?.shortName}
                      size="xs"
                    />
                    <span>{bp.name}</span>
                    <span className="text-[10px] text-white/40 font-normal">({bp.role})</span>
                    {isOS && <span className="text-[9px] text-sky-400">✈️</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Manual Slot Swap Modal */}
      {swappingSlotIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="text-sm font-black text-white">
                Swap Position #{playing11[swappingSlotIndex].pos} ({playing11[swappingSlotIndex].label})
              </div>
              <button
                type="button"
                onClick={() => setSwappingSlotIndex(null)}
                className="text-white/50 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/60">
              Select a player from the bench to take this slot in the tactical Playing XI:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {benchPlayers.map((benchPlayer) => {
                const isOS = isPlayerOverseas(benchPlayer.nationality);
                return (
                  <button
                    key={benchPlayer.id}
                    type="button"
                    onClick={() => {
                      setCustomSlotPlayerIds((prev) => ({
                        ...prev,
                        [swappingSlotIndex]: benchPlayer.id,
                      }));
                      setSwappingSlotIndex(null);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-left transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <PlayerMonogramAvatar
                        name={benchPlayer.name}
                        teamShortName={metaTeam?.shortName}
                        size="xs"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{benchPlayer.name}</div>
                        <div className="text-[10px] text-white/50">{benchPlayer.role}</div>
                      </div>
                    </div>
                    {isOS && <span className="text-[10px] text-sky-400 font-bold">✈️ Overseas</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
