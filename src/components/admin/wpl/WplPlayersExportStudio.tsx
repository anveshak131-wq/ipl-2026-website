'use client';

import React, { useMemo, useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileDown,
  Database,
  Code2,
  FileCode2,
  Filter,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Users,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DEFAULT_WPL_EXPORT_FILTERS,
  WPL_ROLE_CATEGORIES,
  WplBattingHandScope,
  WplBowlingScope,
  WplCaptaincyScope,
  WplExportFilterOptions,
  WplExportFormatId,
  WplExportPlayerInput,
  WplNationalityScope,
  WplRoleCategory,
  WplSortBy,
  WplSquadStatusScope,
  WplStatFormat,
  WplStatsScope,
  WplTeamRef,
  describeFilterScope,
  filterAndNormalizeWplPlayers,
  runWplPlayerExport,
  summarizeWplExportRecords,
} from '@/lib/admin/wplPlayerExport';

interface WplPlayersExportStudioProps {
  players: WplExportPlayerInput[];
  teams: WplTeamRef[];
  activeTeamId: string;
  activeSearchQuery?: string;
  onClose?: () => void;
}

const EXPORT_BUTTONS: Array<{
  id: WplExportFormatId;
  label: string;
  ext: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}> = [
  {
    id: 'pdf',
    label: 'PDF Dossier',
    ext: '.pdf',
    hint: 'Poppins · Branded BG · DD/MM/YYYY · ©',
    icon: FileText,
    accentClass: 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30',
  },
  {
    id: 'excel',
    label: 'Excel Workbook',
    ext: '.xlsx',
    hint: '4 sheets: Roster, Bat, Bowl, Summary',
    icon: FileSpreadsheet,
    accentClass: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'csv',
    label: 'CSV Table',
    ext: '.csv',
    hint: 'UTF-8 BOM spreadsheet',
    icon: FileDown,
    accentClass: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  {
    id: 'json',
    label: 'JSON Database',
    ext: '.json',
    hint: 'Normalized tables + metadata',
    icon: Database,
    accentClass: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'sql',
    label: 'SQL Database',
    ext: '.sql',
    hint: 'CREATE + INSERT relational dump',
    icon: Code2,
    accentClass: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'tsv',
    label: 'TSV Sheet',
    ext: '.tsv',
    hint: 'Tab-separated BI / Sheets feed',
    icon: FileSpreadsheet,
    accentClass: 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
  {
    id: 'markdown',
    label: 'Scouting Doc',
    ext: '.md',
    hint: 'Markdown summary + roster table',
    icon: FileCode2,
    accentClass: 'bg-slate-700/40 hover:bg-slate-700/70 text-slate-200 border-slate-600/60',
  },
];

export default function WplPlayersExportStudio({
  players,
  teams,
  activeTeamId,
  activeSearchQuery = '',
  onClose,
}: WplPlayersExportStudioProps) {
  const [filters, setFilters] = useState<WplExportFilterOptions>(() => ({
    ...DEFAULT_WPL_EXPORT_FILTERS,
    searchQuery: activeSearchQuery,
  }));
  const [multiTeamMode, setMultiTeamMode] = useState(false);
  const [multiRoleMode, setMultiRoleMode] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<WplExportFormatId | null>(null);
  const [lastExportStatus, setLastExportStatus] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const effectiveFilters = useMemo<WplExportFilterOptions>(
    () => ({
      ...filters,
      searchQuery: activeSearchQuery,
    }),
    [filters, activeSearchQuery]
  );

  const activeTeamObj = useMemo(
    () => teams.find((t) => t.id === activeTeamId) || teams[0],
    [teams, activeTeamId]
  );

  const countryOptions = useMemo(() => {
    const unique = new Set<string>();
    players.forEach((p) => {
      const nat = String(p.nationality || '').trim();
      if (nat) unique.add(nat);
    });
    return ['ALL', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [players]);

  const matchedRecords = useMemo(
    () => filterAndNormalizeWplPlayers(players, effectiveFilters, teams),
    [players, effectiveFilters, teams]
  );

  const summary = useMemo(
    () => summarizeWplExportRecords(matchedRecords, teams),
    [matchedRecords, teams]
  );

  const { scopeLabel } = useMemo(
    () => describeFilterScope(effectiveFilters, teams),
    [effectiveFilters, teams]
  );

  const handleSelectTeamPill = (teamId: string | 'ALL') => {
    setLastExportStatus(null);
    if (teamId === 'ALL') {
      setFilters((prev) => ({ ...prev, teamIds: 'ALL' }));
      return;
    }

    setFilters((prev) => {
      if (!multiTeamMode) {
        return { ...prev, teamIds: [teamId] };
      }
      const current = prev.teamIds === 'ALL' ? [] : prev.teamIds;
      const exists = current.includes(teamId);
      const next = exists ? current.filter((id) => id !== teamId) : [...current, teamId];
      return { ...prev, teamIds: next.length === 0 ? 'ALL' : next };
    });
  };

  const handleSelectRolePill = (role: WplRoleCategory | 'ALL') => {
    setLastExportStatus(null);
    if (role === 'ALL') {
      setFilters((prev) => ({ ...prev, roles: 'ALL' }));
      return;
    }

    setFilters((prev) => {
      if (!multiRoleMode) {
        return { ...prev, roles: [role] };
      }
      const current = prev.roles === 'ALL' ? [] : prev.roles;
      const exists = current.includes(role);
      const next = exists ? current.filter((r) => r !== role) : [...current, role];
      return { ...prev, roles: next.length === 0 ? 'ALL' : next };
    });
  };

  const applyQuickPreset = (preset: {
    teamIds: 'ALL' | string[];
    roles: 'ALL' | WplRoleCategory[];
    nationalityScope?: WplNationalityScope;
    statsScope?: WplStatsScope;
  }) => {
    setLastExportStatus(null);
    setFilters((prev) => ({
      ...prev,
      teamIds: preset.teamIds,
      roles: preset.roles,
      nationalityScope: preset.nationalityScope ?? 'ALL',
      statsScope: preset.statsScope ?? 'ALL',
      countryFilter: 'ALL',
      captaincyScope: 'ALL',
      squadStatus: 'ALL',
      battingHand: 'ALL',
      bowlingScope: 'ALL',
    }));
  };

  const handleResetFilters = () => {
    setLastExportStatus(null);
    setExportError(null);
    setMultiTeamMode(false);
    setMultiRoleMode(false);
    setFilters({ ...DEFAULT_WPL_EXPORT_FILTERS, searchQuery: activeSearchQuery });
  };

  const handleExport = async (format: WplExportFormatId) => {
    if (matchedRecords.length === 0) {
      setExportError('No players match the current filter criteria. Loosen one of your filters to export.');
      return;
    }
    setExportError(null);
    setLastExportStatus(null);
    setExportingFormat(format);
    try {
      const result = await runWplPlayerExport({
        format,
        players,
        filters: effectiveFilters,
        teams,
      });
      setLastExportStatus(
        `Exported ${result.playerCount} player${result.playerCount === 1 ? '' : 's'} to ${result.fileName}`
      );
    } catch (err: any) {
      console.error(`WPL export (${format}) failed:`, err);
      setExportError(err?.message || `Failed to generate ${format.toUpperCase()} export.`);
    } finally {
      setExportingFormat(null);
    }
  };

  const isTeamSelected = (teamId: string) =>
    filters.teamIds !== 'ALL' && filters.teamIds.includes(teamId);

  const isRoleSelected = (role: WplRoleCategory) =>
    filters.roles !== 'ALL' && filters.roles.includes(role);

  return (
    <section
      data-testid="wpl-export-studio"
      className="p-5 md:p-6 rounded-3xl bg-slate-900/95 border border-emerald-500/25 shadow-2xl space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" /> Multi-Format Export & Analytics Studio
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-white mt-0.5">
            Export WPL Players, Details & Career Statistics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Filter all 5 squads, specific teams, playing roles, or team × role combinations before exporting to PDF, Excel, CSV, SQL, or JSON.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            {showAdvancedFilters ? 'Hide Extra Filters' : 'More Filters'}
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Export Studio"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1-Click Quick Scope Presets */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          1-Click Quick Scopes
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyQuickPreset({ teamIds: 'ALL', roles: 'ALL' })}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all"
          >
            All WPL Players ({players.length})
          </button>
          {activeTeamObj && (
            <button
              type="button"
              onClick={() => applyQuickPreset({ teamIds: [activeTeamObj.id], roles: 'ALL' })}
              className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-bold transition-all"
            >
              Active Team: {activeTeamObj.short}
            </button>
          )}
          {WPL_ROLE_CATEGORIES.map((role) => (
            <button
              key={`all-${role}`}
              type="button"
              onClick={() => applyQuickPreset({ teamIds: 'ALL', roles: [role] })}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-all"
            >
              All Teams · {role}s
            </button>
          ))}
          {activeTeamObj &&
            WPL_ROLE_CATEGORIES.map((role) => (
              <button
                key={`team-${role}`}
                type="button"
                onClick={() => applyQuickPreset({ teamIds: [activeTeamObj.id], roles: [role] })}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-all"
              >
                {activeTeamObj.short} · {role}s
              </button>
            ))}
        </div>
      </div>

      {/* Primary Team & Role Matrix Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Wise Selector */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Team Scope
            </span>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={multiTeamMode}
                onChange={(e) => setMultiTeamMode(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 accent-emerald-500"
              />
              Multi-team select
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSelectTeamPill('ALL')}
              className={
                'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ' +
                (filters.teamIds === 'ALL'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white')
              }
            >
              All Teams
            </button>
            {teams.map((t) => {
              const selected = isTeamSelected(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTeamPill(t.id)}
                  className={
                    'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ' +
                    (selected
                      ? 'bg-sky-600 text-white border-sky-400 shadow'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white')
                  }
                >
                  {t.short}
                </button>
              );
            })}
          </div>
        </div>

        {/* Role Wise Selector */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-sky-400" /> Role Scope
            </span>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={multiRoleMode}
                onChange={(e) => setMultiRoleMode(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 accent-sky-500"
              />
              Multi-role select
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSelectRolePill('ALL')}
              className={
                'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ' +
                (filters.roles === 'ALL'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white')
              }
            >
              All Roles
            </button>
            {WPL_ROLE_CATEGORIES.map((role) => {
              const selected = isRoleSelected(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSelectRolePill(role)}
                  className={
                    'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ' +
                    (selected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white')
                  }
                >
                  {role}s
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Extended Scouting & Admin Filters */}
      {showAdvancedFilters && (
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400">Player Slot</label>
              <select
                aria-label="Player Slot"
                value={filters.nationalityScope}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    nationalityScope: e.target.value as WplNationalityScope,
                  }))
                }
                className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="ALL">All (IND + Overseas)</option>
                <option value="INDIA">Domestic (India)</option>
                <option value="OVERSEAS">Overseas Only</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400">Country</label>
              <select
                aria-label="Country"
                value={filters.countryFilter}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, countryFilter: e.target.value }))
                }
                className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                {countryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'All Countries' : c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400">Squad Status</label>
              <select
                aria-label="Squad Status"
                value={filters.squadStatus}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    squadStatus: e.target.value as WplSquadStatusScope,
                  }))
                }
                className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active Squad">Active Squad</option>
                <option value="Reserve">Reserve</option>
                <option value="Injured">Injured</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400">Batting Hand</label>
              <select
                aria-label="Batting Hand"
                value={filters.battingHand}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    battingHand: e.target.value as WplBattingHandScope,
                  }))
                }
                className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="ALL">All Batting Hands</option>
                <option value="RIGHT">Right-hand Bat</option>
                <option value="LEFT">Left-hand Bat</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400">Bowling Discipline</label>
              <select
                aria-label="Bowling Discipline"
                value={filters.bowlingScope}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    bowlingScope: e.target.value as WplBowlingScope,
                  }))
                }
                className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="ALL">All Bowling Types</option>
                <option value="PACE">Pace / Fast / Medium</option>
                <option value="SPIN">Spin / Orthodox / Break</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400">Leadership</label>
              <select
                aria-label="Leadership"
                value={filters.captaincyScope}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    captaincyScope: e.target.value as WplCaptaincyScope,
                  }))
                }
                className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="ALL">All Players</option>
                <option value="CAPTAINS_ONLY">Captains Only</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400">Stats Coverage</label>
              <select
                aria-label="Stats Coverage"
                value={filters.statsScope}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    statsScope: e.target.value as WplStatsScope,
                  }))
                }
                className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="ALL">All Records</option>
                <option value="WITH_STATS">With Career Stats Only</option>
                <option value="MISSING_STATS">Missing Stats (Needs Sync)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400">Headline Stat Format</label>
              <select
                aria-label="Headline Stat Format"
                value={filters.formatFocus}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    formatFocus: e.target.value as WplStatFormat,
                  }))
                }
                className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="BEST_T20">Smart Best (WPL -&gt; T20)</option>
                <option value="WPL">WPL Stats</option>
                <option value="T20">T20 / T20I Stats</option>
                <option value="ODI">ODI Stats</option>
                <option value="Test">Test Stats</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400">Sort Rows By</label>
              <select
                aria-label="Sort Rows By"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value as WplSortBy,
                  }))
                }
                className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="TEAM_ROLE_NAME">Team -&gt; Role -&gt; Name</option>
                <option value="NAME_ASC">Player Name (A-Z)</option>
                <option value="RUNS_DESC">Highest Runs ({filters.formatFocus === 'BEST_T20' ? 'Focus' : filters.formatFocus})</option>
                <option value="WKTS_DESC">Most Wickets ({filters.formatFocus === 'BEST_T20' ? 'Focus' : filters.formatFocus})</option>
                <option value="AUCTION_FEE_DESC">Auction Fee (High -&gt; Low)</option>
              </select>
            </div>

            {activeSearchQuery.trim() !== '' && (
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer select-none bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 w-full">
                  <input
                    type="checkbox"
                    checked={Boolean(filters.applySearchQuery)}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, applySearchQuery: e.target.checked }))
                    }
                    className="rounded border-slate-700 bg-slate-950 accent-emerald-500"
                  />
                  <span className="truncate">Apply search &ldquo;{activeSearchQuery}&rdquo;</span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Preview Summary Bar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Export Scope
          </div>
          <div className="text-xs font-semibold text-white">
            {scopeLabel}
          </div>
          {matchedRecords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {matchedRecords.slice(0, 6).map((r) => (
                <span
                  key={r.id}
                  className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                >
                  {r.name} ({r.teamShort})
                </span>
              ))}
              {matchedRecords.length > 6 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-300">
                  +{matchedRecords.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
            <div className="text-[10px] uppercase font-bold text-emerald-300">Matched</div>
            <div className="text-sm font-black text-white" data-testid="export-matched-count">
              {summary.totalPlayers}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Bat / AR / Bowl / WK</div>
            <div className="text-xs font-bold text-slate-100">
              {summary.byRole.Batter} / {summary.byRole['All-rounder']} / {summary.byRole.Bowler} / {summary.byRole['Wicket-keeper']}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">IND / OS · Stats</div>
            <div className="text-xs font-bold text-slate-100">
              {summary.indiaCount} / {summary.overseasCount} · {summary.withStatsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {lastExportStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{lastExportStatus}</span>
        </div>
      )}
      {exportError && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-bold text-red-300">
          {exportError}
        </div>
      )}

      {/* Format Export Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {EXPORT_BUTTONS.map((btn) => {
          const Icon = btn.icon;
          const isBusy = exportingFormat === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              data-testid={`export-btn-${btn.id}`}
              disabled={Boolean(exportingFormat) || matchedRecords.length === 0}
              onClick={() => handleExport(btn.id)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed ${btn.accentClass}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-extrabold text-xs">
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <Icon className="w-4 h-4 shrink-0" />
                  )}
                  <span>{btn.label}</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">{btn.ext}</span>
              </div>
              <span className="text-[10px] opacity-80 leading-snug">{btn.hint}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
