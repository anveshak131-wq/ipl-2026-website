'use client';

import React from 'react';
import type { Player, Team } from '@/types';
import FlagImage from '@/components/ui/FlagImage';
import { CustomEmoji } from '@/components/emoji/Emoji';
import { Eye, Edit2, Trash2, Plane, Star, ExternalLink, RefreshCw } from 'lucide-react';
import { getRoleDisplay, getBattingAverage, getBattingStrikeRate } from '@/lib/admin/playerAdminUtils';
import { resolveIpl2027Team } from '@/lib/admin/ipl2027Teams';

interface Player2027CardProps {
  player: Player;
  teams: Team[];
  onView: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string, name: string) => void;
  onContextMenu?: (e: React.MouseEvent, player: Player) => void;
}

function Player2027CardComponent({
  player,
  teams,
  onView,
  onEdit,
  onDelete,
  onContextMenu,
}: Player2027CardProps) {
  const metaTeam = resolveIpl2027Team(player.teamShortName || player.teamId || player.team);
  const team = teams.find((t) => String(t.id) === String(player.teamId)) || (metaTeam ? {
    id: metaTeam.id,
    name: metaTeam.name,
    shortName: metaTeam.shortName,
    colors: { primary: metaTeam.primaryColor, secondary: metaTeam.secondaryColor },
  } as Team : undefined);

  const role = getRoleDisplay(player);
  const isOverseas = player.nationality && player.nationality.toLowerCase() !== 'india';
  const status = (player.squadStatus || 'Retained').toLowerCase();
  const transferFee = (player as any).transferFee || (player as any).auction?.fee;
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

  const runs = (player as any).careerStats?.batting?.IPL?.Runs || player.stats?.runs || 0;
  const wickets = (player as any).careerStats?.bowling?.IPL?.Wkts || player.stats?.wickets || 0;
  const avg = (player as any).careerStats?.batting?.IPL?.Avg || getBattingAverage(player);
  const sr = (player as any).careerStats?.batting?.IPL?.SR || getBattingStrikeRate(player);

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
          backgroundImage: team
            ? `linear-gradient(to right, ${team.colors.primary}, ${team.colors.secondary || '#1e293b'})`
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
              <div
                className="h-14 w-14 overflow-hidden rounded-2xl border border-white/15 bg-slate-800 shadow-md flex items-center justify-center"
                style={{ borderColor: team?.colors.primary }}
              >
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt={player.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-lg font-black text-white">
                    {player.name.charAt(0)}
                  </span>
                )}
              </div>
              {player.isCaptain && (
                <div
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-yellow-400 bg-yellow-500 text-[10px] font-black text-slate-950 shadow"
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
                  className="text-[10px] font-black px-2 py-0.5 rounded-md text-white"
                  style={{ backgroundColor: team?.colors.primary || '#475569' }}
                >
                  {team?.shortName || 'Pool'}
                </span>
                <span className="text-xs text-white/60 truncate">
                  {team?.name || '2027 Auction Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* Role Pill */}
          <div className="mb-3">
            <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold border ${role.badgeClass}`}>
              {role.label}
            </span>
          </div>

          {/* Transfer Notes / Story if present */}
          {transferNotes && (
            <div className="mb-3 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-[11px] text-white/60 line-clamp-2">
              {transferNotes}
            </div>
          )}

          {/* 4-KPIs Cricket Stats */}
          <div className="grid grid-cols-4 gap-1.5 border-t border-white/10 pt-2.5 text-center">
            <div className="rounded-lg bg-white/[0.03] p-1.5">
              <p className="text-xs font-black text-[#f2d39a]">{runs}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">Runs</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-1.5">
              <p className="text-xs font-black text-[#a8e9ef]">{wickets}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">Wkts</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-1.5">
              <p className="text-xs font-black text-[#9cf2c8]">{avg}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">Avg</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-1.5">
              <p className="text-xs font-black text-white/80">{sr}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">SR</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-3.5 flex gap-2 border-t border-white/10 pt-2.5">
          <button
            type="button"
            onClick={() => onView(player)}
            className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#f2d39a] text-xs font-bold flex items-center justify-center gap-1 border border-white/10 transition-all hover:border-[#f2d39a]/40"
            title="View 2027 Player Dossier"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Dossier</span>
          </button>
          <button
            type="button"
            onClick={() => onEdit(player)}
            className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold flex items-center justify-center border border-white/10 transition-all hover:border-teal-500/40"
            title="Edit Player Details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(player.id, player.name)}
            className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-red-400 text-xs font-bold flex items-center justify-center border border-white/10 transition-all hover:border-red-500/40"
            title="Delete / Release Player"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

export const Player2027Card = React.memo(Player2027CardComponent);
