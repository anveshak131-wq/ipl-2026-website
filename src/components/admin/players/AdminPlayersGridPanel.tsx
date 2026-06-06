'use client';

import { useMemo, useState } from 'react';
import { Users, Edit2, Trash2, Eye, ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';
import type { Player, Team } from '@/types';
import FlagImage from '@/components/ui/FlagImage';
import { CustomEmoji } from '@/components/emoji/Emoji';
import {
  getRoleDisplay,
  getBattingAverage,
  getBattingStrikeRate,
  isPlayerInactive,
  resolveTeam,
} from '@/lib/admin/playerAdminUtils';

interface AdminPlayersGridPanelProps {
  players: Player[];
  teams: Team[];
  currentLeague: string;
  onEdit: (player: Player) => void;
  onDelete: (id: string, name: string) => void;
  onView: (player: Player) => void;
  onContextMenu: (e: React.MouseEvent, player: Player) => void;
  renderFormBand: (player: Player, size: 'sm' | 'md') => React.ReactNode;
  getPerformanceTextColor: (player: Player) => string;
  getPerformanceLabel: (player: Player) => string;
  getPerformanceColor: (player: Player) => string;
  getPerformanceIndicator: (player: Player) => string;
}

export default function AdminPlayersGridPanel({
  players,
  teams,
  currentLeague,
  onEdit,
  onDelete,
  onView,
  onContextMenu,
  renderFormBand,
  getPerformanceTextColor,
  getPerformanceLabel,
  getPerformanceColor,
  getPerformanceIndicator,
}: AdminPlayersGridPanelProps) {
  const [groupByTeam, setGroupByTeam] = useState(false);
  const isIpl = currentLeague !== 'wpl';

  const grouped = useMemo(() => {
    if (!groupByTeam) return [{ teamId: 'all', label: 'All players', players }];
    const map = new Map<string, Player[]>();
    for (const p of players) {
      const key = String(p.teamId || 'unassigned');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).map(([teamId, teamPlayers]) => {
      const team = teams.find((t) => String(t.id) === teamId);
      return {
        teamId,
        label: team?.name || 'Unassigned',
        players: teamPlayers,
      };
    });
  }, [groupByTeam, players, teams]);

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-16">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-gray-800/50">
          <Users className="h-10 w-10 text-gray-500" />
        </div>
        <p className="mb-2 text-lg font-semibold text-gray-300">No squad records found</p>
        <p className="text-sm text-gray-500">Try a different player name, role, team, or cricket skill filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#07110f]/50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <LayoutGrid className="h-4 w-4 text-[#f2d39a]" />
          <span>
            <strong className="text-white">{players.length}</strong> players in grid view
          </span>
        </div>
        <button
          type="button"
          onClick={() => setGroupByTeam((v) => !v)}
          className="oil-row-action-button oil-row-action-button--gold !min-h-0 !py-2 !px-3 text-xs"
        >
          {groupByTeam ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {groupByTeam ? 'Flat grid' : 'Group by team'}
        </button>
      </div>

      {grouped.map((section) => (
        <div key={section.teamId} className="space-y-4">
          {groupByTeam && (
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-lg font-bold text-white">{section.label}</h3>
              <span className="oil-table-stat-pill oil-table-stat-pill--teal">{section.players.length}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {section.players.map((player, idx) => {
              const team = resolveTeam(player, teams);
              const inactive = isPlayerInactive(player);
              const role = getRoleDisplay(player);

              return (
                <article
                  key={`${player.id}-${player.teamId}-${idx}`}
                  className={`oil-stat-card group relative overflow-hidden rounded-2xl border border-white/10 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${inactive ? 'opacity-70' : ''}`}
                  onContextMenu={(e) => onContextMenu(e, player)}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${role.accentClass}`}
                  />

                  <div className="relative z-10">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div
                          className="h-16 w-16 overflow-hidden rounded-2xl border border-white/15 shadow-xl"
                          style={{
                            borderColor: team?.colors.primary,
                            background: team
                              ? `linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`
                              : undefined,
                          }}
                        >
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl font-black text-white">
                              {player.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div
                          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white"
                          style={{ backgroundColor: getPerformanceColor(player) }}
                        >
                          {getPerformanceIndicator(player)}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold text-white transition-colors group-hover:text-[#f2d39a]">
                          {player.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {player.nationality && <FlagImage nationality={player.nationality} size="sm" />}
                          <span className="text-xs text-white/50">{player.nationality}</span>
                          {player.isCaptain && (
                            <span className="inline-flex items-center gap-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
                              <CustomEmoji type="star" size={10} /> C
                            </span>
                          )}
                          {inactive && (
                            <span className="rounded-full border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {team && (
                      <div
                        className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2"
                        style={{ background: `${team.colors.primary}15` }}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: team.colors.primary }}
                        >
                          {team.shortName}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{team.name}</p>
                          <p className="text-[11px] text-white/45">Jersey #{player.jerseyNumber || '—'}</p>
                        </div>
                      </div>
                    )}

                    <span className={`mb-3 inline-flex rounded-xl border px-3 py-1.5 text-xs font-bold ${role.badgeClass}`}>
                      {role.label}
                    </span>

                    <div className="mb-3 rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/45">Form</span>
                        <span className={`text-xs font-bold ${getPerformanceTextColor(player)}`}>
                          {getPerformanceLabel(player)}
                        </span>
                      </div>
                      {renderFormBand(player, 'sm')}
                    </div>

                    {isIpl && (
                      <div className="mb-4 grid grid-cols-4 gap-2 border-t border-white/10 pt-3">
                        {[
                          { label: 'Runs', value: player.stats?.runs || 0, color: 'text-[#f2d39a]' },
                          { label: 'Wkts', value: player.stats?.wickets || 0, color: 'text-[#a8e9ef]' },
                          { label: 'Avg', value: getBattingAverage(player), color: 'text-[#9cf2c8]' },
                          { label: 'SR', value: getBattingStrikeRate(player), color: 'text-white/80' },
                        ].map((stat) => (
                          <div key={stat.label} className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5 text-center">
                            <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-[10px] text-white/40">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => onView(player)}
                        className="oil-row-action-button oil-row-action-button--gold flex-1 !min-h-0 !py-2"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(player)}
                        className="oil-row-action-button oil-row-action-button--teal flex-1 !min-h-0 !py-2"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(player.id, player.name)}
                        className="oil-row-action-button oil-row-action-button--danger flex-1 !min-h-0 !py-2"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
