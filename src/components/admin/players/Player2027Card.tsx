'use client';

import React from 'react';
import type { Player } from '@/types';
import FlagImage from '@/components/ui/FlagImage';
import {
  Eye,
  Edit2,
  Trash2,
  Plane,
} from 'lucide-react';
import { resolveIpl2027Team } from '@/lib/admin/ipl2027Teams';
import PlayerMonogramAvatar from '@/components/admin/players/PlayerMonogramAvatar';

export interface Player2027CardProps {
  player: Player;
  onView: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete?: (player: Player) => void;
  onContextMenu?: (e: React.MouseEvent, player: Player) => void;
}

export const Player2027Card = React.memo(function Player2027Card({
  player,
  onView,
  onEdit,
  onDelete,
  onContextMenu,
}: Player2027CardProps) {
  const metaTeam = resolveIpl2027Team(player.teamShortName || player.teamId || player.team);
  const nat = (player.nationality || 'India').toLowerCase().trim();
  const isOverseas = nat !== '' && !['india', 'ind', 'indian'].includes(nat);
  const status = (player.squadStatus || 'Retained').toLowerCase();
  const transferFee = (player as any).transferFee || '';
  const transferNotes = (player as any).transferNotes || '';

  // Status Badge Rendering
  const getStatusBadge = () => {
    if (status.includes('mentor')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
          👑 CSK Mentor 2027
        </span>
      );
    }
    if (status.includes('traded') || transferNotes.toLowerCase().includes('trade')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
          🔄 Traded {transferFee ? `· ${transferFee}` : ''}
        </span>
      );
    }
    if (status.includes('release') || String(player.teamId || '').trim() === '' || player.team === 'Auction Pool 2027') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
          🔴 2027 Auction Pool
        </span>
      );
    }
    if (status.includes('withdrawn') || status.includes('injur')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-700/60 text-slate-400 border border-slate-600/40">
          🏥 Withdrawn (Knee)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
        🟢 Retained {transferFee ? `· ${transferFee}` : ''}
      </span>
    );
  };

  const isBowler = String(player.role || '').toLowerCase().includes('bowl');
  const runs = (player as any).careerStats?.batting?.IPL?.Runs || player.stats?.runs || 0;
  const wickets = (player as any).careerStats?.bowling?.IPL?.Wkts || player.stats?.wickets || 0;
  const avg = (player as any).careerStats?.batting?.IPL?.Avg || player.stats?.average || player.stats?.battingAverage || 0;
  const sr = (player as any).careerStats?.batting?.IPL?.SR || player.stats?.strikeRate || player.stats?.battingStrikeRate || 0;
  const econ = (player as any).careerStats?.bowling?.IPL?.Econ || player.stats?.economy || 0;

  return (
    <article
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 360px',
      }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:bg-slate-800/60"
      onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
    >
      {/* Team Gradient Top Accent */}
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r"
        style={{
          backgroundImage: metaTeam
            ? `linear-gradient(to right, ${metaTeam.primaryColor}, ${metaTeam.secondaryColor || '#1e293b'})`
            : undefined,
        }}
      />

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          {/* Status Row */}
          <div className="mb-3 flex items-center justify-between gap-2">
            {getStatusBadge()}
            {player.jerseyNumber && (
              <span className="text-xs font-black text-white/40 tracking-wider">
                #{player.jerseyNumber}
              </span>
            )}
          </div>

          {/* Header Info */}
          <div className="mb-3 flex items-start gap-3">
            <div className="relative shrink-0">
              <PlayerMonogramAvatar
                name={player.name}
                teamShortName={metaTeam?.shortName || player.teamShortName}
                teamId={player.teamId}
                team={player.team}
                jerseyNumber={player.jerseyNumber}
                size="md"
              />
              {player.isCaptain && (
                <div
                  className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full border border-yellow-400 bg-yellow-500 text-[10px] font-black text-slate-950 shadow z-20"
                  title="Team Captain"
                >
                  C
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3
                onClick={() => onView(player)}
                className="cursor-pointer truncate text-base font-bold text-white transition-colors group-hover:text-[#f2d39a]"
                title={player.name}
              >
                {player.name}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-white/50">
                {player.nationality && <FlagImage nationality={player.nationality} size="sm" />}
                <span className="truncate max-w-[90px]">{player.nationality || 'India'}</span>
                {isOverseas && (
                  <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.2 bg-sky-500/20 text-sky-300 text-[9px] font-bold">
                    <Plane className="w-2.5 h-2.5" /> OS
                  </span>
                )}
                {player.age && <span className="text-[11px] text-white/40">· {player.age}y</span>}
              </div>

              {/* Franchise Strip */}
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-md text-white shadow"
                  style={{ backgroundColor: metaTeam?.primaryColor || '#475569' }}
                >
                  {metaTeam?.shortName || player.teamShortName || 'Pool'}
                </span>
                <span className="text-xs font-medium text-white/70 truncate">
                  {metaTeam?.name || player.team || 'Auction Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* Cricket Role Tag */}
          <div className="mb-3 flex items-center gap-1.5">
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/80 border border-white/5">
              {player.role || 'Batsman'}
            </span>
          </div>

          {/* Key Stats Grid */}
          <div className="mb-4 grid grid-cols-4 gap-1.5 rounded-xl border border-white/5 bg-slate-950/60 p-2 text-center">
            <div>
              <div className="text-sm font-black text-[#f2d39a]">{runs}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">Runs</div>
            </div>
            <div>
              <div className="text-sm font-black text-[#a8e9ef]">{wickets}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">Wkts</div>
            </div>
            <div>
              <div className="text-sm font-black text-emerald-400">
                {isBowler && Number(wickets) > 0 && Number(econ) > 0
                  ? Number(econ).toFixed(1)
                  : avg && avg !== '—'
                  ? Number(avg).toFixed(1)
                  : '—'}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">
                {isBowler && Number(wickets) > 0 && Number(econ) > 0 ? 'Econ' : 'Avg'}
              </div>
            </div>
            <div>
              <div className="text-sm font-black text-sky-400">
                {sr && sr !== '—' ? Number(sr).toFixed(1) : '—'}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">SR</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={() => onView(player)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-white/90 hover:bg-slate-700 hover:text-white transition-colors border border-white/5"
            title="Open comprehensive Dossier"
          >
            <Eye className="w-3.5 h-3.5 text-[#f2d39a]" />
            <span>Dossier</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(player)}
            className="flex items-center justify-center p-2 rounded-xl bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white transition-colors border border-teal-500/20"
            title="Edit player info and stats"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(player)}
              className="flex items-center justify-center p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
              title="Release/Remove player"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
});
