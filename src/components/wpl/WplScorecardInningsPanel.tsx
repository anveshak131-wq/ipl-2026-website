'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, Flame, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import {
  cleanBatters,
  cleanBowlers,
  cleanTeamDisplayName,
  computeInningsSummary,
  getTeamLogoUrl,
  getTeamVisualTheme,
  parsePartnershipStats,
  resolveInningsTeams,
  WplScorecard,
  WplScorecardInnings,
} from '@/lib/wpl/scorecardHelpers';

interface WplScorecardInningsPanelProps {
  scorecard: WplScorecard;
  innings: WplScorecardInnings;
}

export default function WplScorecardInningsPanel({
  scorecard,
  innings,
}: WplScorecardInningsPanelProps) {
  const { battingTeam, bowlingTeam } = resolveInningsTeams(scorecard, innings);
  const batTheme = getTeamVisualTheme(battingTeam);
  const bowlTheme = getTeamVisualTheme(bowlingTeam);
  const summary = computeInningsSummary(innings);
  const batters = cleanBatters(innings.batting);
  const bowlers = cleanBowlers(innings.bowling);
  const fow = (innings.fallOfWickets || []).filter((f) => f && f.player);
  const partnerships = (innings.partnerships || []).filter((p) => p && (p.batsman1 || p.batsman2));

  const topBatterRuns = batters.reduce((max, b) => Math.max(max, b.runsNum), 0);
  const maxPartnershipRuns = partnerships.reduce(
    (max, p) => Math.max(max, parsePartnershipStats(p.totalRuns).runs),
    1
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Innings Header Summary Bar */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 p-4 sm:p-5 backdrop-blur-xl shadow-xl"
        style={{
          backgroundImage: `linear-gradient(125deg, ${batTheme.glowColor} 0%, rgba(15, 23, 42, 0.92) 48%, rgba(7, 11, 24, 0.98) 100%)`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/15 p-1.5 flex items-center justify-center shrink-0">
              <img
                src={getTeamLogoUrl(battingTeam)}
                alt={cleanTeamDisplayName(battingTeam.name)}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
                  Innings {innings.inningsNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${batTheme.badgeClass}`}>
                  {batTheme.code} Batting
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {cleanTeamDisplayName(battingTeam.name)}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div className="text-left sm:text-right">
              <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
                {summary.totalRuns}/{summary.totalWickets}
                <span className="text-sm sm:text-base font-bold text-slate-300 ml-2">
                  ({summary.totalOversLabel} ov)
                </span>
              </div>
              <div className="flex flex-wrap items-center sm:justify-end gap-2 mt-1 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1 font-bold text-sky-300 tabular-nums">
                  <TrendingUp className="w-3.5 h-3.5" />
                  RR {summary.runRate}
                </span>
                <span className="text-white/25">•</span>
                <span className="tabular-nums">
                  {summary.totalFours} fours, {summary.totalSixes} sixes
                </span>
                {summary.powerplayLabel && (
                  <>
                    <span className="text-white/25">•</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/30 text-amber-200 font-semibold">
                      <Zap className="w-3 h-3 text-amber-300" />
                      {summary.powerplayLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batting Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1020]/90 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-black uppercase tracking-wider text-white">Batting Card</h4>
          </div>
          <span className="text-xs font-semibold text-slate-400 tabular-nums">
            {batters.length} batters featured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 pl-4 sm:pl-5 pr-3">Batter</th>
                <th className="py-3 px-3">Dismissal</th>
                <th className="py-3 px-3 text-right">R</th>
                <th className="py-3 px-3 text-right">B</th>
                <th className="py-3 px-3 text-right">4s</th>
                <th className="py-3 px-3 text-right">6s</th>
                <th className="py-3 pl-3 pr-4 sm:pr-5 text-right">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-sm">
              {batters.map((batter, idx) => {
                const isTop = topBatterRuns >= 30 && batter.runsNum === topBatterRuns;
                return (
                  <motion.tr
                    key={`${batter.name}-${idx}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.25) }}
                    className={`transition-colors hover:bg-white/[0.04] ${
                      batter.isNotOut ? 'bg-emerald-500/[0.03]' : ''
                    }`}
                  >
                    <td className="py-3 pl-4 sm:pl-5 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{batter.name}</span>
                        {batter.isCaptain && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            C
                          </span>
                        )}
                        {isTop && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-400/30">
                            <Award className="w-2.5 h-2.5" />
                            Top
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {batter.isNotOut ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                          {batter.dismissalLabel}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">{batter.dismissalLabel}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-white tabular-nums text-base">
                      {batter.runsNum}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {batter.ballsNum}
                    </td>
                    <td className="py-3 px-3 text-right text-sky-300 tabular-nums font-semibold">
                      {batter.foursNum}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-300 tabular-nums font-semibold">
                      {batter.sixesNum}
                    </td>
                    <td
                      className={`py-3 pl-3 pr-4 sm:pr-5 text-right tabular-nums font-bold ${
                        batter.srNum >= 160
                          ? 'text-emerald-300'
                          : batter.srNum >= 125
                          ? 'text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {batter.srNum.toFixed(2)}
                    </td>
                  </motion.tr>
                );
              })}

              {/* Extras & Total */}
              <tr className="bg-slate-900/50 text-xs sm:text-sm">
                <td className="py-3 pl-4 sm:pl-5 pr-3 font-bold text-slate-300">Extras</td>
                <td colSpan={5} className="py-3 px-3 text-slate-400">
                  ({summary.extrasBreakdown})
                </td>
                <td className="py-3 pl-3 pr-4 sm:pr-5 text-right font-black text-white tabular-nums">
                  {summary.extrasTotal}
                </td>
              </tr>
              <tr className="bg-gradient-to-r from-slate-900/95 via-indigo-950/40 to-slate-900/95">
                <td className="py-3.5 pl-4 sm:pl-5 pr-3 font-black uppercase tracking-wider text-xs text-amber-300">
                  Total
                </td>
                <td colSpan={5} className="py-3.5 px-3 text-xs sm:text-sm text-slate-300 tabular-nums">
                  {summary.totalWickets} wickets • {summary.totalOversLabel} overs • RR {summary.runRate}
                </td>
                <td className="py-3.5 pl-3 pr-4 sm:pr-5 text-right text-base sm:text-lg font-black text-white tabular-nums">
                  {summary.totalRuns}/{summary.totalWickets}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bowling Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1020]/90 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-black uppercase tracking-wider text-white">
              Bowling Attack
            </h4>
            <span className={`ml-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${bowlTheme.badgeClass}`}>
              {bowlTheme.code}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-400 tabular-nums">
            {bowlers.length} bowlers used
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[540px]">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 pl-4 sm:pl-5 pr-3">Bowler</th>
                <th className="py-3 px-3 text-right">O</th>
                <th className="py-3 px-3 text-right">M</th>
                <th className="py-3 px-3 text-right">R</th>
                <th className="py-3 px-3 text-right">W</th>
                <th className="py-3 px-3 text-right">Econ</th>
                <th className="py-3 px-3 text-right">WD</th>
                <th className="py-3 pl-3 pr-4 sm:pr-5 text-right">NB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-sm">
              {bowlers.map((bowler, idx) => (
                <motion.tr
                  key={`${bowler.name}-${idx}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.25) }}
                  className="hover:bg-white/[0.04] transition-colors"
                >
                  <td className="py-3 pl-4 sm:pl-5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{bowler.name}</span>
                      {bowler.isCaptain && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          C
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-200 tabular-nums font-semibold">
                    {bowler.oversLabel}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400 tabular-nums">
                    {bowler.maidensNum}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-200 tabular-nums">
                    {bowler.runsNum}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    {bowler.wicketsNum > 0 ? (
                      <span
                        className={`inline-flex items-center justify-center min-w-[26px] px-2 py-0.5 rounded-md font-black ${
                          bowler.wicketsNum >= 3
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                        }`}
                      >
                        {bowler.wicketsNum}
                      </span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td
                    className={`py-3 px-3 text-right tabular-nums font-bold ${
                      bowler.econNum <= 7
                        ? 'text-emerald-300'
                        : bowler.econNum >= 10
                        ? 'text-amber-300'
                        : 'text-slate-200'
                    }`}
                  >
                    {bowler.econNum.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400 tabular-nums">
                    {bowler.widesNum}
                  </td>
                  <td className="py-3 pl-3 pr-4 sm:pr-5 text-right text-slate-400 tabular-nums">
                    {bowler.noBallsNum}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fall of Wickets & Partnerships (rendered when populated in official scorecard) */}
      {(fow.length > 0 || partnerships.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {fow.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0B1020]/90 p-5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Fall of Wickets
                </h4>
                <span className="text-xs font-semibold text-slate-400 tabular-nums">
                  {fow.length} wickets
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {fow.map((item, idx) => (
                  <div
                    key={`${item.player}-${idx}`}
                    className="rounded-xl border border-white/10 bg-slate-900/75 px-3 py-2 text-xs hover:border-sky-400/35 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-300 tabular-nums">{item.score}</span>
                      <span className="text-slate-400 tabular-nums">({item.over} ov)</span>
                    </div>
                    <div className="font-semibold text-slate-200 mt-0.5">{item.player}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {partnerships.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0B1020]/90 p-5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Partnerships
                </h4>
                <span className="text-xs font-semibold text-slate-400 tabular-nums">
                  {partnerships.length} stands
                </span>
              </div>
              <div className="space-y-3">
                {partnerships.map((p, idx) => {
                  const stats = parsePartnershipStats(p.totalRuns);
                  const r1 = parseInt(String(p.batsman1Runs || '0').replace(/\D/g, ''), 10) || 0;
                  const r2 = parseInt(String(p.batsman2Runs || '0').replace(/\D/g, ''), 10) || 0;
                  const sumIndividual = Math.max(r1 + r2, 1);
                  const w1 = (r1 / sumIndividual) * 100;
                  const totalFill = Math.max((stats.runs / maxPartnershipRuns) * 100, 12);

                  return (
                    <div
                      key={`${p.batsman1}-${p.batsman2}-${idx}`}
                      className="rounded-xl border border-white/[0.07] bg-slate-900/60 p-3"
                    >
                      <div className="flex items-center justify-between text-xs gap-2 mb-1.5">
                        <span className="font-semibold text-slate-200 truncate">
                          {p.batsman1}{' '}
                          <span className="text-slate-400 tabular-nums">
                            ({p.batsman1Runs}
                            {p.batsman1Balls ? `/${String(p.batsman1Balls).replace(/O/g, '0')}b` : ''})
                          </span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 font-black tabular-nums shrink-0">
                          {stats.display}
                        </span>
                        <span className="font-semibold text-slate-200 truncate text-right">
                          {p.batsman2}{' '}
                          <span className="text-slate-400 tabular-nums">
                            ({p.batsman2Runs}
                            {p.batsman2Balls ? `/${String(p.batsman2Balls).replace(/O/g, '0')}b` : ''})
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800/90 overflow-hidden">
                        <div
                          className="h-full rounded-full flex overflow-hidden"
                          style={{ width: `${Math.min(totalFill, 100)}%` }}
                        >
                          <div className="h-full bg-sky-400" style={{ width: `${w1}%` }} />
                          <div className="h-full bg-amber-400 flex-1" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
