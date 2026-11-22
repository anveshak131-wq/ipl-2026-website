'use client';

import React from 'react';
import type { Player, Team } from '@/types';
import { Shield, Sparkles, User, Award } from 'lucide-react';
import { resolveIpl2027Team } from '@/lib/admin/ipl2027Teams';
import PlayerMonogramAvatar from '@/components/admin/players/PlayerMonogramAvatar';

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
  const batsmen = players.filter((p) => (p.role as string)?.toLowerCase().includes('bat'));
  const allrounders = players.filter((p) => (p.role as string)?.toLowerCase().includes('all'));
  const keepers = players.filter((p) => (p.role as string)?.toLowerCase().includes('keeper') || (p.role as string)?.toLowerCase().includes('wk'));
  const bowlers = players.filter((p) => (p.role as string)?.toLowerCase().includes('bowl'));

  // Build projected 11
  const playing11: { pos: string; label: string; player?: Player }[] = [
    { pos: '1', label: 'Opener (Bat)', player: batsmen[0] },
    { pos: '2', label: 'Opener (Bat)', player: batsmen[1] },
    { pos: '3', label: 'Top Order (Bat)', player: batsmen[2] },
    { pos: '4', label: 'Anchor / Middle (Bat)', player: batsmen[3] },
    { pos: '5', label: 'Wicket-Keeper (WK)', player: keepers[0] || batsmen[4] },
    { pos: '6', label: 'Power Finisher (AR)', player: allrounders[0] || batsmen[5] },
    { pos: '7', label: 'Spin / Pace Allrounder', player: allrounders[1] },
    { pos: '8', label: 'Lead Spinner / Pacer', player: bowlers[0] || allrounders[2] },
    { pos: '9', label: 'Fast Bowler', player: bowlers[1] },
    { pos: '10', label: 'Strike Quick', player: bowlers[2] },
    { pos: '11', label: 'Death Specialist', player: bowlers[3] },
  ];

  const renderSlot = (slot: { pos: string; label: string; player?: Player }, colorClass: string) => (
    <div
      onClick={() => slot.player && onViewPlayer(slot.player)}
      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
        slot.player
          ? 'bg-slate-900/80 border-white/10 hover:border-[#f2d39a] hover:-translate-y-1 shadow-lg'
          : 'border-dashed border-white/10 bg-slate-950/40'
      }`}
    >
      <div className={`text-[10px] font-black ${colorClass}`}>#{slot.pos} · {slot.label}</div>
      {slot.player ? (
        <div className="my-2">
          <PlayerMonogramAvatar
            name={slot.player.name}
            teamShortName={metaTeam?.shortName}
            size="sm"
          />
        </div>
      ) : (
        <div className="h-8 w-8 my-2 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/30 text-xs">
          +
        </div>
      )}
      <div className="text-sm font-black text-white truncate max-w-full">
        {slot.player ? slot.player.name : 'Slot Open'}
      </div>
      {slot.player && (
        <div className="text-[10px] text-white/50 mt-0.5 truncate max-w-full">
          {slot.player.role} · #{slot.player.jerseyNumber || '—'}
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
      {/* Tactical Turf Background */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#f2d39a]" />
              {metaTeam?.name || 'Franchise'} · Projected Playing XI (IPL 2027)
            </h3>
            <p className="text-xs text-white/50">
              Tactical cricket pitch formation based on official retentions & acquired balance
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Squad Pool: {players.length} Players</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          {/* Top Order Row (1-3) */}
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              🏏 Top Order (1 - 3)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {playing11.slice(0, 3).map((slot, idx) => (
                <React.Fragment key={idx}>{renderSlot(slot, 'text-[#f2d39a]')}</React.Fragment>
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
                <React.Fragment key={idx}>{renderSlot(slot, 'text-[#a8e9ef]')}</React.Fragment>
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
                <React.Fragment key={idx}>{renderSlot(slot, 'text-amber-300')}</React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
