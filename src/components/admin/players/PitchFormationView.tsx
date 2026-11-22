'use client';

import React from 'react';
import type { Player, Team } from '@/types';
import { Shield, Sparkles, User, Award } from 'lucide-react';
import { resolveIpl2027Team } from '@/lib/admin/ipl2027Teams';

interface PitchFormationViewProps {
  players: Player[];
  selectedTeamId: string;
  onViewPlayer: (player: Player) => void;
}

export default function PitchFormationView({
  players,
  selectedTeamId,
  onViewPlayer,
}: PitchFormationViewProps) {
  const metaTeam = resolveIpl2027Team(selectedTeamId);

  // Group into cricket positions
  const batsmen = players.filter((p) => p.role === 'Batsman');
  const allrounders = players.filter((p) => p.role === 'All-Rounder');
  const keepers = players.filter((p) => p.role === 'Wicket-Keeper');
  const bowlers = players.filter((p) => p.role === 'Bowler');

  // Build projected 11
  const playing11: { pos: string; label: string; player?: Player }[] = [
    { pos: '1', label: 'Opener (Bat)', player: batsmen[0] },
    { pos: '2', label: 'Opener (Bat)', player: batsmen[1] },
    { pos: '3', label: 'Top Order (Bat)', player: batsmen[2] },
    { pos: '4', label: 'Anchor / Middle (Bat)', player: batsmen[3] },
    { pos: '5', label: 'Wicket-Keeper (WK)', player: keepers[0] || batsmen[4] },
    { pos: '6', label: 'Power Finisher (AR)', player: allrounders[0] || batsmen[5] },
    { pos: '7', label: 'Spin / Pace Allrounder', player: allrounders[1] },
    { pos: '8', label: 'Strike Bowler / AR', player: allrounders[2] || bowlers[0] },
    { pos: '9', label: 'Specialist Spinner', player: bowlers[1] },
    { pos: '10', label: 'Pace Spearhead', player: bowlers[2] },
    { pos: '11', label: 'Death Over Pacer', player: bowlers[3] },
  ];

  const impactPlayer = players.find(
    (p) => !playing11.some((slot) => slot.player?.id === p.id)
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl relative overflow-hidden">
      {/* Pitch Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#f2d39a]">
            <Shield className="w-4 h-4 text-[#f2d39a]" />
            Playing XI & Tactical Field Formation (IPL 2027)
          </div>
          <h2 className="text-xl font-black text-white mt-0.5">
            {metaTeam?.name || 'Projected Franchise XI'}
          </h2>
        </div>

        {impactPlayer && (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
              ⚡ Impact Sub
            </span>
            <span
              onClick={() => onViewPlayer(impactPlayer)}
              className="text-xs font-bold text-white hover:text-[#f2d39a] cursor-pointer"
            >
              {impactPlayer.name} ({impactPlayer.role})
            </span>
          </div>
        )}
      </div>

      {/* Field Visual Area */}
      <div className="relative mx-auto max-w-4xl rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-950/50 via-slate-950 to-emerald-950/40 p-6 md:p-10 shadow-inner">
        {/* Pitch Turf Graphic */}
        <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-28 md:w-36 bg-amber-950/20 border-x-2 border-dashed border-emerald-500/20 pointer-events-none rounded-xl" />

        <div className="relative z-10 space-y-6">
          {/* Top Order Row (1-3) */}
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              🏏 Top Order (1 - 3)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {playing11.slice(0, 3).map((slot, idx) => (
                <div
                  key={idx}
                  onClick={() => slot.player && onViewPlayer(slot.player)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    slot.player
                      ? 'bg-slate-900/80 border-white/10 hover:border-[#f2d39a] hover:-translate-y-1 shadow-lg'
                      : 'border-dashed border-white/10 bg-slate-950/40'
                  }`}
                >
                  <div className="text-[10px] font-black text-[#f2d39a]">#{slot.pos} · {slot.label}</div>
                  <div className="text-sm font-black text-white mt-1 truncate">
                    {slot.player ? slot.player.name : 'Slot Open'}
                  </div>
                  {slot.player && (
                    <div className="text-[10px] text-white/50 mt-0.5">
                      {slot.player.role} · #{slot.player.jerseyNumber || '—'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Middle Order & All-Rounders Row (4-7) */}
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-950/60 px-3 py-1 rounded-full border border-sky-500/30">
              ⚡ Middle Order & All-Rounders (4 - 7)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {playing11.slice(3, 7).map((slot, idx) => (
                <div
                  key={idx}
                  onClick={() => slot.player && onViewPlayer(slot.player)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    slot.player
                      ? 'bg-slate-900/80 border-white/10 hover:border-[#f2d39a] hover:-translate-y-1 shadow-lg'
                      : 'border-dashed border-white/10 bg-slate-950/40'
                  }`}
                >
                  <div className="text-[10px] font-black text-[#a8e9ef]">#{slot.pos} · {slot.label}</div>
                  <div className="text-sm font-black text-white mt-1 truncate">
                    {slot.player ? slot.player.name : 'Slot Open'}
                  </div>
                  {slot.player && (
                    <div className="text-[10px] text-white/50 mt-0.5">
                      {slot.player.role} · #{slot.player.jerseyNumber || '—'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bowling Unit Row (8-11) */}
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
              🎯 Bowling Unit & Pace Attack (8 - 11)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {playing11.slice(7, 11).map((slot, idx) => (
                <div
                  key={idx}
                  onClick={() => slot.player && onViewPlayer(slot.player)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    slot.player
                      ? 'bg-slate-900/80 border-white/10 hover:border-[#f2d39a] hover:-translate-y-1 shadow-lg'
                      : 'border-dashed border-white/10 bg-slate-950/40'
                  }`}
                >
                  <div className="text-[10px] font-black text-amber-300">#{slot.pos} · {slot.label}</div>
                  <div className="text-sm font-black text-white mt-1 truncate">
                    {slot.player ? slot.player.name : 'Slot Open'}
                  </div>
                  {slot.player && (
                    <div className="text-[10px] text-white/50 mt-0.5">
                      {slot.player.role} · #{slot.player.jerseyNumber || '—'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
