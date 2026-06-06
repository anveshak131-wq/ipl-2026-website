'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Scale, Users } from 'lucide-react';
import type { Player, Team } from '@/types';

interface TeamAggregate {
  team: Team | null;
  totalRuns: number;
  totalWickets: number;
  totalMatches: number;
  avgRunsPerMatch: number;
  avgStrikeRate: number;
}

type TeamSortKey = 'runs' | 'wickets' | 'strikeRate' | 'runsPerMatch';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function computeTeamAggregate(teamId: string, players: Player[], teams: Team[]): TeamAggregate {
  const team = teams.find((t) => t.id === teamId) || null;
  const teamPlayers = players.filter((p) => p.teamId === teamId);

  if (!teamPlayers.length) {
    return {
      team,
      totalRuns: 0,
      totalWickets: 0,
      totalMatches: 0,
      avgRunsPerMatch: 0,
      avgStrikeRate: 0,
    };
  }

  const totalRuns = teamPlayers.reduce((sum, p) => sum + safeNumber(p.stats?.runs), 0);
  const totalWickets = teamPlayers.reduce((sum, p) => sum + safeNumber(p.stats?.wickets), 0);
  const totalMatches = teamPlayers.reduce((sum, p) => sum + safeNumber(p.stats?.matches), 0);
  const avgStrikeRate =
    teamPlayers.reduce((sum, p) => sum + safeNumber(p.stats?.strikeRate), 0) / teamPlayers.length;
  const avgRunsPerMatch = totalMatches > 0 ? totalRuns / totalMatches : 0;

  return {
    team,
    totalRuns,
    totalWickets,
    totalMatches,
    avgRunsPerMatch,
    avgStrikeRate,
  };
}

interface TeamStatsSectionProps {
  players: Player[];
  teams: Team[];
  publishedTeamAggregates?: TeamAggregate[];
  defaultTeams?: {
    team1Id?: string;
    team2Id?: string;
  };
}

export default function TeamStatsSection({
  players,
  teams,
  publishedTeamAggregates,
  defaultTeams,
}: TeamStatsSectionProps) {
  const computedAggregates = useMemo(() => {
    return teams.map((team) => computeTeamAggregate(team.id, players, teams));
  }, [players, teams]);

  const teamAggregates = useMemo(() => {
    const base =
      publishedTeamAggregates && publishedTeamAggregates.length
        ? publishedTeamAggregates
        : computedAggregates;

    return base.map((agg) => {
      const teamId = agg.team?.id;
      const resolved = teamId ? teams.find((t) => t.id === teamId) : null;
      return {
        ...agg,
        team: resolved || agg.team || null,
      };
    });
  }, [computedAggregates, publishedTeamAggregates, teams]);

  const [sortKey, setSortKey] = useState<TeamSortKey>('runs');
  const [selectedTeam1Id, setSelectedTeam1Id] = useState('');
  const [selectedTeam2Id, setSelectedTeam2Id] = useState('');

  useEffect(() => {
    if (!teamAggregates.length) return;

    const teamIds = new Set(teamAggregates.map((t) => t.team?.id).filter(Boolean) as string[]);
    const first = teamAggregates.find((t) => t.team?.id)?.team?.id || '';
    const second =
      teamAggregates.find((t) => t.team?.id && t.team?.id !== first)?.team?.id || first;

    setSelectedTeam1Id((prev) => {
      if (prev && teamIds.has(prev)) return prev;
      const candidate = defaultTeams?.team1Id && teamIds.has(defaultTeams.team1Id) ? defaultTeams.team1Id : '';
      return candidate || first;
    });
    setSelectedTeam2Id((prev) => {
      if (prev && teamIds.has(prev)) return prev;
      const candidate = defaultTeams?.team2Id && teamIds.has(defaultTeams.team2Id) ? defaultTeams.team2Id : '';
      return candidate || second;
    });
  }, [defaultTeams?.team1Id, defaultTeams?.team2Id, teamAggregates]);

  const sortedAggregates = useMemo(() => {
    const getValue = (agg: TeamAggregate) => {
      switch (sortKey) {
        case 'wickets':
          return agg.totalWickets;
        case 'strikeRate':
          return agg.avgStrikeRate;
        case 'runsPerMatch':
          return agg.avgRunsPerMatch;
        case 'runs':
        default:
          return agg.totalRuns;
      }
    };

    const copy = [...teamAggregates];
    copy.sort((a, b) => getValue(b) - getValue(a));
    return copy;
  }, [sortKey, teamAggregates]);

  const selectedTeam1 = useMemo(() => {
    return teamAggregates.find((t) => t.team?.id === selectedTeam1Id) || null;
  }, [selectedTeam1Id, teamAggregates]);

  const selectedTeam2 = useMemo(() => {
    return teamAggregates.find((t) => t.team?.id === selectedTeam2Id) || null;
  }, [selectedTeam2Id, teamAggregates]);

  const hasAnyData = useMemo(() => {
    return teamAggregates.some((t) => t.totalRuns > 0 || t.totalWickets > 0 || t.totalMatches > 0);
  }, [teamAggregates]);

  const compareRows = useMemo(() => {
    const t1 = selectedTeam1;
    const t2 = selectedTeam2;
    if (!t1 || !t2) return [];

    const rows = [
      { key: 'runs', label: 'Total Runs', a: t1.totalRuns, b: t2.totalRuns, fmt: (n: number) => n.toLocaleString() },
      { key: 'wickets', label: 'Total Wickets', a: t1.totalWickets, b: t2.totalWickets, fmt: (n: number) => n.toLocaleString() },
      { key: 'strikeRate', label: 'Avg Strike Rate', a: t1.avgStrikeRate, b: t2.avgStrikeRate, fmt: (n: number) => n.toFixed(1) },
      { key: 'runsPerMatch', label: 'Avg Runs / Match', a: t1.avgRunsPerMatch, b: t2.avgRunsPerMatch, fmt: (n: number) => n.toFixed(1) },
    ];

    return rows.map((r) => {
      const max = Math.max(r.a, r.b, 1);
      return {
        ...r,
        aPct: clamp((r.a / max) * 100, 0, 100),
        bPct: clamp((r.b / max) * 100, 0, 100),
      };
    });
  }, [selectedTeam1, selectedTeam2]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-lg border border-white/[0.15] bg-black/[0.42] p-5 shadow-2xl backdrop-blur-xl md:p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="rounded-md bg-gradient-to-br from-amber-400 to-emerald-500 p-3 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white md:text-3xl">Team Form & Totals</h2>
              <p className="text-sm text-gray-400 mt-1">
                Team totals combine published scorecards with player records when scorecards are still being completed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-xl">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400 mr-1">Sort:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as TeamSortKey)}
              className="rounded-md border border-white/20 bg-black/60 px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
            >
              <option value="runs">Total runs</option>
              <option value="wickets">Total wickets</option>
              <option value="strikeRate">Avg strike rate</option>
              <option value="runsPerMatch">Avg runs / match</option>
            </select>
          </div>
        </div>

        {!hasAnyData ? (
          <div className="rounded-lg border border-white/10 bg-black/30 p-6 text-gray-300">
            <p className="text-sm">
              Team numbers will appear after scorecards or player stats are published.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/30">
            <table className="min-w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-right">Runs</th>
                  <th className="py-3 px-4 text-right">Wickets</th>
                  <th className="py-3 px-4 text-right">Avg Strike Rate</th>
                  <th className="py-3 px-4 text-right">Runs/Match</th>
                </tr>
              </thead>
              <tbody>
                {sortedAggregates.map((agg, idx) => {
                  const team = agg.team;
                  const short = team?.shortName || team?.name?.split(' ').map((w) => w[0]).join('') || 'T';
                  const highlight = idx === 0 ? 'bg-white/5' : '';

                  return (
                    <tr key={team?.id || `${idx}`} className={`border-b border-white/5 last:border-0 ${highlight}`}>
                      <td className="py-3 px-4 font-bold text-gray-200">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-ipl-gold/30 to-ipl-purple/30 text-xs font-black text-white overflow-hidden">
                            {team?.logo ? (
                              <img
                                src={team?.logo}
                                alt={team?.shortName || team?.name || 'Team'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`absolute inset-0 flex items-center justify-center text-white ${team?.logo ? 'hidden' : ''}`}>
                              {short.slice(0, 2)}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">
                              {team?.shortName || team?.name || 'Unknown'}
                            </span>
                            {team?.name ? (
                              <span className="text-[10px] text-gray-400">{team.name}</span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-100">
                        {agg.totalRuns.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-100">
                        {agg.totalWickets.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-100">
                        {agg.avgStrikeRate.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-100">
                        {agg.avgRunsPerMatch.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Team Comparison */}
      {hasAnyData && teamAggregates.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-lg border border-white/[0.15] bg-black/[0.42] p-5 shadow-2xl backdrop-blur-xl md:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-gradient-to-br from-emerald-400 to-cyan-500 p-3 shadow-lg">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white md:text-2xl">Head-to-head comparison</h3>
                <p className="text-xs text-gray-400 mt-1">Compare two teams by scoring rate and wicket-taking output.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={selectedTeam1Id}
                onChange={(e) => setSelectedTeam1Id(e.target.value)}
                className="rounded-md border border-white/20 bg-black/60 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
              >
                {teamAggregates.map((agg) => (
                  <option key={agg.team?.id || agg.team?.name} value={agg.team?.id || ''}>
                    {agg.team?.name || 'Unknown'}
                  </option>
                ))}
              </select>
              <select
                value={selectedTeam2Id}
                onChange={(e) => setSelectedTeam2Id(e.target.value)}
                className="rounded-md border border-white/20 bg-black/60 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
              >
                {teamAggregates.map((agg) => (
                  <option key={agg.team?.id || agg.team?.name} value={agg.team?.id || ''}>
                    {agg.team?.name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedTeam1 && selectedTeam2 ? (
            <div className="space-y-4">
              {compareRows.map((row) => (
                <div key={row.key} className="rounded-lg border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      {row.label}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-gray-200">
                      <span className="font-semibold text-white">
                        {selectedTeam1.team?.shortName || 'Team A'}: {row.fmt(row.a)}
                      </span>
                      <span className="text-gray-500">vs</span>
                      <span className="font-semibold text-white">
                        {selectedTeam2.team?.shortName || 'Team B'}: {row.fmt(row.b)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${row.aPct}%` }}
                      />
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{ width: `${row.bPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Select two teams to see the comparison.</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
