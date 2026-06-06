'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Edit2,
  TrendingUp,
  Target,
  Users,
  Shirt,
  Globe,
  Calendar,
  Activity,
  BarChart3,
  Shield,
  History,
} from 'lucide-react';
import ModernDialog from '@/components/admin/ModernDialog';
import FlagImage from '@/components/ui/FlagImage';
import { CustomEmoji } from '@/components/emoji/Emoji';
import type { Player, Team } from '@/types';
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

type DetailTab = 'overview' | 'batting' | 'bowling' | 'squad';

interface AdminPlayerDetailsModalProps {
  isOpen: boolean;
  player: Player | null;
  teams: Team[];
  allPlayers: Player[];
  currentLeague: string;
  onClose: () => void;
  onEdit: (player: Player) => void;
  renderFormBand: (player: Player, size: 'sm' | 'md') => React.ReactNode;
}

const TABS: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Eye className="h-4 w-4" /> },
  { id: 'batting', label: 'Batting', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'bowling', label: 'Bowling', icon: <Target className="h-4 w-4" /> },
  { id: 'squad', label: 'Squad', icon: <Users className="h-4 w-4" /> },
];

function StatCell({ value, highlight }: { value: string | number; highlight?: boolean }) {
  return (
    <td className={`px-4 py-3 text-center text-sm font-semibold ${highlight ? 'text-[#f2d39a]' : 'text-white/85'}`}>
      {value}
    </td>
  );
}

function MiniStatCard({
  label,
  value,
  sub,
  accent = 'gold',
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'gold' | 'teal' | 'cyan' | 'rose';
}) {
  const accentClass =
    accent === 'teal'
      ? 'oil-table-stat-pill--teal'
      : accent === 'cyan'
        ? 'oil-table-stat-pill--cyan'
        : accent === 'rose'
          ? 'oil-table-stat-pill--rose'
          : 'oil-table-stat-pill--gold';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/50">{sub}</p>}
      <div className={`oil-table-stat-pill mt-3 w-fit text-[10px] ${accentClass}`}>{label}</div>
    </div>
  );
}

export default function AdminPlayerDetailsModal({
  isOpen,
  player,
  teams,
  allPlayers,
  currentLeague,
  onClose,
  onEdit,
  renderFormBand,
}: AdminPlayerDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  if (!player) return null;

  const team = resolveTeam(player, teams);
  const role = getRoleDisplay(player);
  const perf = getPlayerPerformanceMeta(player, allPlayers, currentLeague);
  const inactive = isPlayerInactive(player);
  const stats = player.stats;
  const isIpl = currentLeague !== 'wpl';

  const battingDismissals = (stats.battingInnings || 0) - (stats.notOuts || 0);
  const bowlingOvers = stats.balls ? (stats.balls / 6).toFixed(1) : '—';

  return (
    <ModernDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Player Profile"
      description="Full squad intelligence — batting, bowling, and season context"
      variant="info"
      size="3xl"
      icon={
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
          <Eye className="h-5 w-5 text-white" />
        </div>
      }
      contentClassName="max-h-[75vh] overflow-y-auto custom-scrollbar"
    >
      <div className="space-y-0">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 p-6"
          style={{
            background: team
              ? `linear-gradient(135deg, ${team.colors.primary}22, rgba(7,17,15,0.95) 55%, ${team.colors.secondary}18)`
              : 'linear-gradient(135deg, rgba(7,17,15,0.95), rgba(12,31,27,0.9))',
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_90%_0%,rgba(215,168,91,0.12),transparent_55%)]" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-start">
            <div className="relative shrink-0">
              <div
                className="h-24 w-24 overflow-hidden rounded-2xl border-2 shadow-2xl"
                style={{ borderColor: team?.colors.primary || '#d7a85b' }}
              >
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-2xl font-black text-white"
                    style={{
                      background: `linear-gradient(135deg, ${team?.colors.primary || '#3B82F6'}, ${team?.colors.secondary || '#8B5CF6'})`,
                    }}
                  >
                    {player.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <div
                className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white text-xs font-black text-white shadow-lg"
                style={{ backgroundColor: perf.color }}
              >
                {perf.grade}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">{player.name}</h2>
                {player.isCaptain && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-2.5 py-1 text-xs font-bold text-yellow-400">
                    <CustomEmoji type="star" size={12} /> Captain
                  </span>
                )}
                {inactive && (
                  <span className="rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-300">
                    Inactive squad
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/65">
                {player.nationality && (
                  <span className="inline-flex items-center gap-1.5">
                    <FlagImage nationality={player.nationality} size="sm" />
                    {player.nationality}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {player.age > 0 ? `${player.age} yrs` : 'Age N/A'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Shirt className="h-3.5 w-3.5" />
                  #{player.jerseyNumber || '—'}
                </span>
                {team && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {team.shortName}
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-bold ${role.badgeClass}`}>
                  {role.label}
                </span>
                <span className="oil-table-stat-pill oil-table-stat-pill--gold">
                  {perf.grade} · {perf.label}
                </span>
                <span className="oil-table-stat-pill oil-table-stat-pill--teal">
                  Form {perf.score}/100
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEdit(player)}
              className="oil-row-action-button oil-row-action-button--teal shrink-0 self-start"
            >
              <Edit2 className="h-4 w-4" />
              Edit Player
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-[#07110f]/70 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#d7a85b]/20 text-[#f2d39a] shadow-lg'
                  : 'text-white/55 hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-5"
          >
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <MiniStatCard label="Matches" value={stats.matches || 0} accent="gold" />
                  <MiniStatCard label="Runs" value={stats.runs || 0} accent="teal" />
                  <MiniStatCard label="Wickets" value={stats.wickets || 0} accent="cyan" />
                  <MiniStatCard label="Highest" value={stats.highest || '—'} accent="rose" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/55">
                      <Globe className="h-4 w-4 text-[#f2d39a]" />
                      Playing profile
                    </h3>
                    <dl className="space-y-3 text-sm">
                      {[
                        ['Batting style', player.battingStyle || '—'],
                        ['Bowling style', player.bowlingStyle || '—'],
                        ['Date of birth', formatPlayerDob(player, currentLeague)],
                        ['League', currentLeague.toUpperCase()],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4 border-b border-white/5 pb-2">
                          <dt className="text-white/45">{label}</dt>
                          <dd className="text-right font-semibold text-white">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/55">
                      <Activity className="h-4 w-4 text-[#9cf2c8]" />
                      Performance snapshot
                    </h3>
                    {renderFormBand(player, 'md')}
                  </div>
                </div>

                {isIpl && (
                  <div className="oil-table-shell rounded-2xl overflow-hidden">
                    <div className="oil-table-header px-5 py-4">
                      <h3 className="flex items-center gap-2 font-bold text-white">
                        <BarChart3 className="h-4 w-4 text-[#f2d39a]" />
                        Season summary
                      </h3>
                    </div>
                    <div className="oil-table-scroll">
                      <table className="oil-table oil-player-detail-table w-full">
                        <thead>
                          <tr>
                            {['Mat', 'Runs', 'Avg', 'SR', '4s', '6s', '50s', '100s', 'Wkts', 'Econ'].map((h) => (
                              <th key={h} className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white/50">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <StatCell value={stats.matches || 0} />
                            <StatCell value={stats.runs || 0} highlight />
                            <StatCell value={getBattingAverage(player)} />
                            <StatCell value={getBattingStrikeRate(player)} />
                            <StatCell value={stats.fours || 0} />
                            <StatCell value={stats.sixes || 0} />
                            <StatCell value={stats.fifties || 0} />
                            <StatCell value={stats.hundreds || 0} />
                            <StatCell value={stats.wickets || 0} />
                            <StatCell value={formatStatNumber(stats.economy, 2)} />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'batting' && (
              <div className="space-y-4">
                <div className="oil-table-shell rounded-2xl overflow-hidden">
                  <div className="oil-table-header px-5 py-4">
                    <h3 className="flex items-center gap-2 font-bold text-white">
                      <TrendingUp className="h-4 w-4 text-[#f2d39a]" />
                      Batting record
                    </h3>
                    <p className="mt-1 text-xs text-white/50">Standard cricket batting card layout</p>
                  </div>
                  <div className="oil-table-scroll">
                    <table className="oil-table oil-player-detail-table w-full min-w-[720px]">
                      <thead>
                        <tr>
                          {['Mat', 'Inns', 'NO', 'Runs', 'BF', 'HS', 'Avg', 'SR', '100', '50', '4s', '6s'].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white/50"
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white/[0.02]">
                          <StatCell value={stats.matches || 0} />
                          <StatCell value={stats.battingInnings || 0} />
                          <StatCell value={stats.notOuts || 0} />
                          <StatCell value={stats.runs || 0} highlight />
                          <StatCell value={stats.ballsFaced || 0} />
                          <StatCell value={stats.highest || '—'} highlight />
                          <StatCell value={getBattingAverage(player)} />
                          <StatCell value={getBattingStrikeRate(player)} />
                          <StatCell value={stats.hundreds || 0} />
                          <StatCell value={stats.fifties || 0} />
                          <StatCell value={stats.fours || 0} />
                          <StatCell value={stats.sixes || 0} />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <MiniStatCard
                    label="Dismissals"
                    value={battingDismissals > 0 ? battingDismissals : '—'}
                    sub="Innings − not outs"
                    accent="teal"
                  />
                  <MiniStatCard label="Boundary runs est." value={(stats.fours || 0) * 4 + (stats.sixes || 0) * 6} accent="gold" />
                  <MiniStatCard label="50+ scores" value={(stats.fifties || 0) + (stats.hundreds || 0)} accent="cyan" />
                  <MiniStatCard label="Not outs" value={stats.notOuts || 0} accent="rose" />
                </div>
              </div>
            )}

            {activeTab === 'bowling' && (
              <div className="space-y-4">
                <div className="oil-table-shell rounded-2xl overflow-hidden">
                  <div className="oil-table-header px-5 py-4">
                    <h3 className="flex items-center gap-2 font-bold text-white">
                      <Target className="h-4 w-4 text-[#a8e9ef]" />
                      Bowling record
                    </h3>
                    <p className="mt-1 text-xs text-white/50">Economy, strike rate, and best figures</p>
                  </div>
                  <div className="oil-table-scroll">
                    <table className="oil-table oil-player-detail-table w-full min-w-[800px]">
                      <thead>
                        <tr>
                          {['Mat', 'Inns', 'Overs', 'M', 'Runs', 'Wkts', 'Avg', 'Econ', 'SR', 'BBM', '5w'].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white/50"
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white/[0.02]">
                          <StatCell value={stats.matches || 0} />
                          <StatCell value={stats.bowlingInnings || 0} />
                          <StatCell value={bowlingOvers} />
                          <StatCell value={stats.maidens || 0} />
                          <StatCell value={stats.runsConceded || '—'} />
                          <StatCell value={stats.wickets || 0} highlight />
                          <StatCell value={getBowlingAverageDisplay(player)} />
                          <StatCell value={formatStatNumber(stats.economy, 2)} />
                          <StatCell value={stats.bowlingStrikeRate || '—'} />
                          <StatCell value={stats.bestBowling && stats.bestBowling !== '-' ? stats.bestBowling : '—'} highlight />
                          <StatCell value={stats.fiveWickets || 0} />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <MiniStatCard label="Wickets / match" value={stats.matches ? ((stats.wickets || 0) / stats.matches).toFixed(2) : '—'} accent="cyan" />
                  <MiniStatCard label="Economy" value={formatStatNumber(stats.economy, 2)} accent="teal" />
                  <MiniStatCard label="Best bowling" value={stats.bestBowling || '—'} accent="gold" />
                </div>
              </div>
            )}

            {activeTab === 'squad' && (
              <div className="space-y-4">
                {team ? (
                  <div
                    className="rounded-2xl border border-white/10 p-5"
                    style={{
                      background: `linear-gradient(135deg, ${team.colors.primary}18, rgba(7,17,15,0.9))`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black text-white shadow-xl"
                        style={{ backgroundColor: team.colors.primary }}
                      >
                        {team.shortName}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{team.name}</p>
                        <p className="text-sm text-white/55">{currentLeague.toUpperCase()} franchise</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-white/50">
                    No team assigned
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/55">
                    <Shield className="h-4 w-4" />
                    Squad status
                  </h3>
                  <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {[
                      ['Active in squad', inactive ? 'No' : 'Yes'],
                      ['Squad status', player.squadStatus || (inactive ? 'inactive' : 'active')],
                      ['Exit reason', player.squadExitReason || '—'],
                      ['Exit date', player.squadExitDate || '—'],
                      ['Transferable', player.transferInfo?.transferable ? 'Yes' : 'No'],
                      ['Acquired via', player.transferInfo?.acquiredVia || '—'],
                      ['Last auction year', player.transferInfo?.lastAuctionYear || '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                        <dt className="text-sm text-white/45">{label}</dt>
                        <dd className="text-sm font-semibold capitalize text-white">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {player.seasonTeamHistory && player.seasonTeamHistory.length > 0 && (
                  <div className="oil-table-shell rounded-2xl overflow-hidden">
                    <div className="oil-table-header px-5 py-4">
                      <h3 className="flex items-center gap-2 font-bold text-white">
                        <History className="h-4 w-4" />
                        Season history
                      </h3>
                    </div>
                    <div className="oil-table-scroll">
                      <table className="oil-table oil-player-detail-table w-full">
                        <thead>
                          <tr>
                            {['Season', 'Team', 'Matches', 'Runs', 'Wickets'].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {player.seasonTeamHistory.map((entry) => {
                            const histTeam = teams.find((t) => String(t.id) === String(entry.teamId));
                            return (
                              <tr key={`${entry.season}-${entry.teamId}`}>
                                <td className="px-4 py-3 text-sm font-semibold text-white">{entry.season}</td>
                                <td className="px-4 py-3 text-sm text-white/75">{histTeam?.shortName || entry.teamId}</td>
                                <StatCell value={entry.matches} />
                                <StatCell value={entry.runs ?? '—'} />
                                <StatCell value={entry.wickets ?? '—'} />
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </ModernDialog>
  );
}
