'use client';

import React, { useState, useMemo } from 'react';
import type { Player, Team } from '@/types';
import FlagImage from '@/components/ui/FlagImage';
import { Table2, ChevronUp, ChevronDown, Eye, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveIpl2027Team } from '@/lib/admin/ipl2027Teams';
import PlayerMonogramAvatar from '@/components/admin/players/PlayerMonogramAvatar';

interface Player2027DenseTableProps {
  players: Player[];
  teams: Team[];
  onView: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string, name: string) => void;
}

const PAGE_SIZE = 25;

export default function Player2027DenseTable({
  players,
  teams,
  onView,
  onEdit,
  onDelete,
}: Player2027DenseTableProps) {
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const sortedPlayers = useMemo(() => {
    const list = [...players];
    list.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortField === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortField === 'runs') {
        aVal = Number((a as any).careerStats?.batting?.IPL?.Runs || a.stats?.runs || 0);
        bVal = Number((b as any).careerStats?.batting?.IPL?.Runs || b.stats?.runs || 0);
      } else if (sortField === 'wickets') {
        aVal = Number((a as any).careerStats?.bowling?.IPL?.Wkts || a.stats?.wickets || 0);
        bVal = Number((b as any).careerStats?.bowling?.IPL?.Wkts || b.stats?.wickets || 0);
      } else if (sortField === 'team') {
        aVal = (a.teamShortName || a.team || '').toLowerCase();
        bVal = (b.teamShortName || b.team || '').toLowerCase();
      } else if (sortField === 'role') {
        aVal = (a.role || '').toLowerCase();
        bVal = (b.role || '').toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [players, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedPlayers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagePlayers = sortedPlayers.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl overflow-hidden">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-white/10 bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#f2d39a]">
            <Table2 className="w-3.5 h-3.5" />
            Squad Register & Dense Matrix (IPL 2027)
          </div>
          <h3 className="text-base font-black text-white mt-0.5">
            {players.length} Players Registered
          </h3>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-slate-900/40 text-white/50 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">#</th>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                Player Name {sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th
                onClick={() => handleSort('team')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                Franchise
              </th>
              <th
                onClick={() => handleSort('role')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                Role
              </th>
              <th className="py-3 px-4">2027 Status</th>
              <th
                onClick={() => handleSort('runs')}
                className="py-3 px-4 text-center cursor-pointer hover:text-white"
              >
                Runs {sortField === 'runs' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th
                onClick={() => handleSort('wickets')}
                className="py-3 px-4 text-center cursor-pointer hover:text-white"
              >
                Wkts {sortField === 'wickets' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-semibold text-white">
            {pagePlayers.map((player, idx) => {
              const metaTeam = resolveIpl2027Team(player.teamShortName || player.teamId || player.team);
              const runs = (player as any).careerStats?.batting?.IPL?.Runs || player.stats?.runs || 0;
              const wickets = (player as any).careerStats?.bowling?.IPL?.Wkts || player.stats?.wickets || 0;
              const status = player.squadStatus || 'Retained';
              const transferFee = (player as any).transferFee || '';

              return (
                <tr key={player.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-4 text-white/40 font-mono">
                    {player.jerseyNumber ? `#${player.jerseyNumber}` : startIndex + idx + 1}
                  </td>
                  <td className="py-3 px-4 font-bold text-white hover:text-[#f2d39a] cursor-pointer" onClick={() => onView(player)}>
                    <div className="flex items-center gap-2.5">
                      <PlayerMonogramAvatar
                        name={player.name}
                        teamShortName={metaTeam?.shortName}
                        teamId={player.teamId}
                        size="sm"
                      />
                      {player.nationality && <FlagImage nationality={player.nationality} size="sm" />}
                      <span>{player.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-black text-white"
                      style={{ backgroundColor: metaTeam?.primaryColor || '#475569' }}
                    >
                      {metaTeam?.shortName || player.teamShortName || 'Pool'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white/70">{player.role}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {status} {transferFee ? `(${transferFee})` : ''}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-black text-[#f2d39a]">{runs}</td>
                  <td className="py-3 px-4 text-center font-black text-[#a8e9ef]">{wickets}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(player)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#f2d39a]"
                        title="View Dossier"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(player)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300"
                        title="Edit Player"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(player.id, player.name)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-red-400"
                        title="Delete Player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
