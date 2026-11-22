'use client';

import React from 'react';
import { IPL_2027_TEAMS, IPL2027TeamMeta } from '@/lib/admin/ipl2027Teams';
import { Shield, Sparkles, Check, Users } from 'lucide-react';

interface Franchise2027BarProps {
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
  playersCountByTeam?: Record<string, number>;
  totalPlayersCount?: number;
  poolPlayersCount?: number;
  totalCount?: number;
}

export default function Franchise2027Bar({
  selectedTeamId,
  onSelectTeam,
  playersCountByTeam = {},
  totalPlayersCount,
  poolPlayersCount = 0,
  totalCount,
}: Franchise2027BarProps) {
  const displayTotal = totalPlayersCount ?? totalCount ?? 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-white/60 px-1">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#f2d39a]">
          <Shield className="w-3.5 h-3.5 text-[#f2d39a]" />
          Franchise Roster & Auction Purse Ledgers (IPL 2027)
        </span>
        <span className="text-[11px] text-white/40">
          Salary Cap: ₹157.00 Cr / team · Auction: Dec 16, 2026
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2.5">
        {/* All Players Tab */}
        <button
          type="button"
          onClick={() => onSelectTeam('all')}
          className={`p-3 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
            selectedTeamId === 'all'
              ? 'bg-gradient-to-br from-[#f2d39a]/20 via-slate-900 to-slate-950 border-[#f2d39a] ring-2 ring-[#f2d39a]/40 shadow-xl'
              : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-800/60'
          }`}
        >
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#f2d39a]">
              League-Wide
            </div>
            <div className="text-xs font-black text-white mt-0.5 truncate">All Players</div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#f2d39a]/20 text-[#f2d39a]">
              {displayTotal} Squad
            </span>
            {selectedTeamId === 'all' && <Check className="w-3.5 h-3.5 text-[#f2d39a]" />}
          </div>
        </button>

        {/* 2027 Auction Pool Tab */}
        <button
          type="button"
          onClick={() => onSelectTeam('pool')}
          className={`p-3 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
            selectedTeamId === 'pool'
              ? 'bg-gradient-to-br from-red-600/30 via-slate-900 to-slate-950 border-red-500 ring-2 ring-red-500/40 shadow-xl'
              : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-800/60'
          }`}
        >
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-400">
              Auction Standby
            </div>
            <div className="text-xs font-black text-white mt-0.5 truncate">Released Pool</div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300">
              {poolPlayersCount} Unassigned
            </span>
            {selectedTeamId === 'pool' && <Check className="w-3.5 h-3.5 text-red-400" />}
          </div>
        </button>

        {/* 10 Official IPL Franchises */}
        {IPL_2027_TEAMS.map((team) => {
          const isSelected = selectedTeamId === team.id || selectedTeamId === team.shortName;
          const count = playersCountByTeam?.[team.id] || playersCountByTeam?.[team.shortName] || 0;

          return (
            <button
              key={team.id}
              type="button"
              onClick={() => onSelectTeam(team.id)}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? `bg-gradient-to-br ${team.color} ${team.border} ring-2 ring-white/40 shadow-xl`
                  : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-800/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/70">
                    {team.shortName}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400">
                    {team.remainingPurse}
                  </span>
                </div>
                <div className="text-xs font-extrabold text-white mt-0.5 truncate">
                  {team.shortName}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${team.badge}`}>
                  {count > 0 ? count : team.retainedCount} Players
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
