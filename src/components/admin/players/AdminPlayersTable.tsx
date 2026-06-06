'use client';

import { useMemo, useState } from 'react';
import {
  Table2,
  User,
  Hash,
  Award,
  Users,
  Calendar,
  TrendingUp,
  Target,
  BarChart3,
  Activity,
  Zap,
  Edit2,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
  SortAsc,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Shield,
} from 'lucide-react';
import type { Player, Team } from '@/types';
import FlagImage from '@/components/ui/FlagImage';
import { CustomEmoji } from '@/components/emoji/Emoji';
import {
  formatPlayerDob,
  formatStatNumber,
  getBattingAverage,
  getBattingStrikeRate,
  getBowlingAverageDisplay,
  getPlayerPerformanceMeta,
  getRoleDisplay,
  isPlayerInactive,
  resolveTeam,
} from '@/lib/admin/playerAdminUtils';

const PAGE_SIZE = 25;

interface AdminPlayersTableProps {
  players: Player[];
  teams: Team[];
  currentLeague: string;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string, name: string) => void;
  onView: (player: Player) => void;
  getSelectedTeamLabel: () => string;
}

interface ColumnDef {
  id: string;
  label: string;
  defaultVisible: boolean;
  iplOnly?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { id: 'jersey', label: 'Jersey', defaultVisible: true },
  { id: 'role', label: 'Role', defaultVisible: true },
  { id: 'team', label: 'Team', defaultVisible: true },
  { id: 'age', label: 'Age', defaultVisible: true },
  { id: 'dob', label: 'DOB', defaultVisible: true },
  { id: 'grade', label: 'Grade', defaultVisible: true },
  { id: 'matches', label: 'Mat', defaultVisible: true, iplOnly: true },
  { id: 'runs', label: 'Runs', defaultVisible: true, iplOnly: true },
  { id: 'wickets', label: 'Wkts', defaultVisible: true, iplOnly: true },
  { id: 'batAvg', label: 'Bat Avg', defaultVisible: true, iplOnly: true },
  { id: 'bowlAvg', label: 'Bowl Avg', defaultVisible: false, iplOnly: true },
  { id: 'sr', label: 'SR', defaultVisible: true, iplOnly: true },
  { id: 'boundaries', label: '4s/6s', defaultVisible: false, iplOnly: true },
  { id: 'milestones', label: '50s/100s', defaultVisible: false, iplOnly: true },
  { id: 'bbm', label: 'BBM', defaultVisible: false, iplOnly: true },
];

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: string;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
}) {
  if (sortField !== field) {
    return <SortAsc className="h-4 w-4 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" />;
  }
  return sortDirection === 'asc' ? (
    <ChevronUp className="h-4 w-4 text-[#f2d39a]" />
  ) : (
    <ChevronDown className="h-4 w-4 text-[#f2d39a]" />
  );
}

export default function AdminPlayersTable({
  players,
  teams,
  currentLeague,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onView,
  getSelectedTeamLabel,
}: AdminPlayersTableProps) {
  const [page, setPage] = useState(1);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COLUMNS.map((c) => [c.id, c.defaultVisible])),
  );

  const isIpl = currentLeague !== 'wpl';
  const activeColumns = COLUMNS.filter((c) => (!c.iplOnly || isIpl) && visibleColumns[c.id]);

  const maxRuns = useMemo(
    () => Math.max(...players.map((p) => p.stats?.runs || 0), 1),
    [players],
  );

  const totalPages = Math.max(1, Math.ceil(players.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagePlayers = players.slice(pageStart, pageStart + PAGE_SIZE);

  const toggleColumn = (id: string) => {
    setVisibleColumns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isColumnVisible = (id: string) => visibleColumns[id] && (!COLUMNS.find((c) => c.id === id)?.iplOnly || isIpl);

  return (
    <div className="oil-table-shell oil-table-shell--pro relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
      <div className="oil-table-header relative p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="oil-hero-kicker mb-2">
              <Table2 className="h-3.5 w-3.5" />
              Squad register
            </div>
            <h2 className="text-xl font-bold text-white">Players Table</h2>
            <p className="mt-1 text-sm text-white/60">
              Data-dense squad view with sticky identity columns, performance grades, and cricket stats.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="oil-table-stat-pill oil-table-stat-pill--gold">{players.length} players</span>
            <span className="oil-table-stat-pill oil-table-stat-pill--teal">{getSelectedTeamLabel()}</span>
            <span className="oil-table-stat-pill oil-table-stat-pill--cyan">{currentLeague.toUpperCase()} admin</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnPicker((v) => !v)}
                className="oil-row-action-button oil-row-action-button--gold !min-h-0 !py-2 !px-3"
              >
                <Columns3 className="h-4 w-4" />
                Columns
              </button>
              {showColumnPicker && (
                <div className="absolute right-0 top-full z-20 mt-2 min-w-[200px] rounded-xl border border-white/10 bg-[#07110f]/98 p-3 shadow-2xl backdrop-blur-xl">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Toggle columns</p>
                  <div className="space-y-1.5">
                    {COLUMNS.filter((c) => !c.iplOnly || isIpl).map((col) => (
                      <label
                        key={col.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/80 hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.id]}
                          onChange={() => toggleColumn(col.id)}
                          className="rounded border-white/20 bg-white/10 text-[#d7a85b]"
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="oil-table-scroll custom-scrollbar" tabIndex={0}>
        <table className="oil-table oil-data-table oil-data-table--players">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-5 py-4 text-left">#</th>
              <th className="oil-table-sticky-name px-6 py-4 text-left">
                <button type="button" onClick={() => onSort('name')} className="oil-table-sort group">
                  <User className="h-4 w-4" />
                  Player
                  <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </th>
              {isColumnVisible('jersey') && (
                <th className="px-6 py-4 text-left">
                  <span className="oil-table-sort">
                    <Hash className="h-4 w-4" />
                    Jersey
                  </span>
                </th>
              )}
              {isColumnVisible('role') && (
                <th className="px-6 py-4 text-left">
                  <span className="oil-table-sort">
                    <Award className="h-4 w-4" />
                    Role
                  </span>
                </th>
              )}
              {isColumnVisible('team') && (
                <th className="px-6 py-4 text-left">
                  <span className="oil-table-sort">
                    <Users className="h-4 w-4" />
                    Team
                  </span>
                </th>
              )}
              {isColumnVisible('age') && (
                <th className="px-6 py-4 text-left">
                  <button type="button" onClick={() => onSort('age')} className="oil-table-sort group">
                    <Calendar className="h-4 w-4" />
                    Age
                    <SortIcon field="age" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
              )}
              {isColumnVisible('dob') && (
                <th className="px-6 py-4 text-left">
                  <span className="oil-table-sort">
                    <Calendar className="h-4 w-4" />
                    DOB
                  </span>
                </th>
              )}
              {isColumnVisible('grade') && (
                <th className="px-6 py-4 text-left">
                  <span className="oil-table-sort">
                    <Shield className="h-4 w-4" />
                    Grade
                  </span>
                </th>
              )}
              {isColumnVisible('matches') && (
                <th className="px-6 py-4 text-left">
                  <button type="button" onClick={() => onSort('matches')} className="oil-table-sort group">
                    Mat
                    <SortIcon field="matches" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
              )}
              {isColumnVisible('runs') && (
                <th className="px-6 py-4 text-left">
                  <button type="button" onClick={() => onSort('runs')} className="oil-table-sort group">
                    <TrendingUp className="h-4 w-4" />
                    Runs
                    <SortIcon field="runs" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
              )}
              {isColumnVisible('wickets') && (
                <th className="px-6 py-4 text-left">
                  <button type="button" onClick={() => onSort('wickets')} className="oil-table-sort group">
                    <Target className="h-4 w-4" />
                    Wkts
                    <SortIcon field="wickets" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
              )}
              {isColumnVisible('batAvg') && (
                <th className="px-6 py-4 text-left">
                  <button type="button" onClick={() => onSort('battingAverage')} className="oil-table-sort group">
                    <BarChart3 className="h-4 w-4" />
                    Bat Avg
                    <SortIcon field="battingAverage" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
              )}
              {isColumnVisible('bowlAvg') && (
                <th className="px-6 py-4 text-left">
                  <button type="button" onClick={() => onSort('bowlingAverage')} className="oil-table-sort group">
                    <BarChart3 className="h-4 w-4" />
                    Bowl Avg
                    <SortIcon field="bowlingAverage" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
              )}
              {isColumnVisible('sr') && (
                <th className="px-6 py-4 text-left">
                  <span className="oil-table-sort">
                    <Activity className="h-4 w-4" />
                    SR
                  </span>
                </th>
              )}
              {isColumnVisible('boundaries') && (
                <th className="px-6 py-4 text-left">
                  <span className="oil-table-sort">
                    <Zap className="h-4 w-4" />
                    4s/6s
                  </span>
                </th>
              )}
              {isColumnVisible('milestones') && (
                <th className="px-6 py-4 text-left">
                  <span className="oil-table-sort">50s/100s</span>
                </th>
              )}
              {isColumnVisible('bbm') && (
                <th className="px-6 py-4 text-left">
                  <span className="oil-table-sort">BBM</span>
                </th>
              )}
              <th className="oil-table-sticky-action px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pagePlayers.length > 0 ? (
              pagePlayers.map((player, index) => {
                const globalIndex = pageStart + index;
                const team = resolveTeam(player, teams);
                const inactive = isPlayerInactive(player);
                const role = getRoleDisplay(player);
                const perf = getPlayerPerformanceMeta(player, players, currentLeague);
                const runs = player.stats?.runs || 0;
                const runsPct = (runs / maxRuns) * 100;

                return (
                  <tr
                    key={`${player.id}-${player.teamId}-${globalIndex}`}
                    className={`group cursor-pointer ${inactive ? 'opacity-65' : ''}`}
                    onClick={() => onView(player)}
                  >
                    <td className="px-5 py-4">
                      <span className="oil-table-rank">#{globalIndex + 1}</span>
                    </td>
                    <td className="oil-table-sticky-name px-6 py-4">
                      <div className="flex min-w-[220px] items-center gap-3">
                        <div
                          className="oil-table-avatar overflow-hidden"
                          style={{
                            background: team
                              ? `linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`
                              : undefined,
                          }}
                        >
                          {player.photoUrl ? (
                            <img
                              src={player.photoUrl}
                              alt={player.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            player.name?.charAt(0) || '?'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-semibold text-white transition-colors group-hover:text-[#f2d39a]">
                              {player.name}
                            </span>
                            {player.isCaptain && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400"
                                title="Captain"
                              >
                                <CustomEmoji type="star" size={12} /> C
                              </span>
                            )}
                            {inactive && (
                              <span className="rounded-full border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-300">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {player.nationality && (
                              <FlagImage nationality={player.nationality} size="sm" />
                            )}
                            <span className="text-xs text-white/50">{player.nationality || '—'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {isColumnVisible('jersey') && (
                      <td className="px-6 py-4">
                        {player.jerseyNumber > 0 ? (
                          <span className="oil-table-stat-pill oil-table-stat-pill--gold">#{player.jerseyNumber}</span>
                        ) : (
                          <span className="text-xs italic text-white/35">—</span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('role') && (
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${role.badgeClass}`}
                        >
                          {role.label}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('team') && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                            style={{ backgroundColor: team?.colors.primary }}
                          >
                            {team?.shortName || '?'}
                          </div>
                          <span className="max-w-[120px] truncate text-sm font-medium text-white/75">
                            {team?.name || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                    )}
                    {isColumnVisible('age') && (
                      <td className="px-6 py-4">
                        <span className="oil-table-stat-pill">
                          {player.age > 0 ? `${player.age}y` : '—'}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('dob') && (
                      <td className="px-6 py-4 text-sm text-white/70">
                        {formatPlayerDob(player, currentLeague)}
                      </td>
                    )}
                    {isColumnVisible('grade') && (
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <span
                            className="oil-table-stat-pill font-extrabold"
                            style={{ borderColor: `${perf.color}55`, color: perf.color }}
                          >
                            {perf.grade} · {perf.label}
                          </span>
                          <div className="oil-table-progress">
                            <span style={{ width: `${perf.score}%`, backgroundColor: perf.color }} />
                          </div>
                        </div>
                      </td>
                    )}
                    {isColumnVisible('matches') && (
                      <td className="px-6 py-4">
                        <span className="oil-table-stat-pill">{player.stats?.matches || 0}</span>
                      </td>
                    )}
                    {isColumnVisible('runs') && (
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <span className="text-lg font-extrabold text-white group-hover:text-[#f2d39a]">
                            {runs.toLocaleString()}
                          </span>
                          <div className="oil-table-progress">
                            <span
                              className="bg-gradient-to-r from-[#d7a85b] via-[#4cc39a] to-[#4fb6c4]"
                              style={{ width: `${runsPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    )}
                    {isColumnVisible('wickets') && (
                      <td className="px-6 py-4">
                        <span className="oil-table-stat-pill oil-table-stat-pill--cyan">
                          {player.stats?.wickets || 0}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('batAvg') && (
                      <td className="px-6 py-4">
                        <span className="oil-table-stat-pill oil-table-stat-pill--teal">
                          {getBattingAverage(player)}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('bowlAvg') && (
                      <td className="px-6 py-4">
                        <span className="oil-table-stat-pill">{getBowlingAverageDisplay(player)}</span>
                      </td>
                    )}
                    {isColumnVisible('sr') && (
                      <td className="px-6 py-4">
                        <span className="oil-table-stat-pill oil-table-stat-pill--cyan">
                          {getBattingStrikeRate(player)}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('boundaries') && (
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          <span className="oil-table-stat-pill oil-table-stat-pill--cyan text-[11px]">
                            4s {player.stats?.fours || 0}
                          </span>
                          <span className="oil-table-stat-pill oil-table-stat-pill--rose text-[11px]">
                            6s {player.stats?.sixes || 0}
                          </span>
                        </div>
                      </td>
                    )}
                    {isColumnVisible('milestones') && (
                      <td className="px-6 py-4">
                        <span className="oil-table-stat-pill oil-table-stat-pill--gold text-[11px]">
                          {player.stats?.fifties || 0}/{player.stats?.hundreds || 0}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('bbm') && (
                      <td className="px-6 py-4 font-mono text-sm text-white/75">
                        {player.stats?.bestBowling && player.stats.bestBowling !== '-'
                          ? player.stats.bestBowling
                          : '—'}
                      </td>
                    )}
                    <td className="oil-table-sticky-action px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="oil-row-actions">
                        <button
                          type="button"
                          onClick={() => onView(player)}
                          className="oil-row-action-button oil-row-action-button--gold oil-table-action"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(player)}
                          className="oil-row-action-button oil-row-action-button--teal oil-table-action"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(player.id, player.name)}
                          className="oil-row-action-button oil-row-action-button--danger oil-table-action"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={activeColumns.length + 3} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-gray-800/50">
                      <Users className="h-10 w-10 text-gray-500" />
                    </div>
                    <p className="mb-2 text-lg font-semibold text-gray-300">No squad records found</p>
                    <p className="text-sm text-gray-500">
                      Try a different player name, role, team, or cricket skill filter.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {players.length > PAGE_SIZE && (
        <div className="flex flex-col gap-3 border-t border-white/10 bg-[#07110f]/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/55">
            Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, players.length)} of {players.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="oil-row-action-button oil-row-action-button--gold !min-h-0 !py-2 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm font-semibold text-white/80">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="oil-row-action-button oil-row-action-button--gold !min-h-0 !py-2 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
