'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  Calendar,
  Check,
  Clock,
  Coins,
  Copy,
  Flame,
  MapPin,
  Shield,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import {
  cleanBatters,
  cleanBowlers,
  cleanTeamDisplayName,
  computeInningsSummary,
  formatIndianDate,
  getMatchHighlightMetrics,
  getTeamLogoUrl,
  getTeamVisualTheme,
  normalizeWplTeamCode,
  resolveInningsTeams,
  WplScorecard,
} from '@/lib/wpl/scorecardHelpers';
import WplScorecardInningsPanel from './WplScorecardInningsPanel';

interface WplScorecardViewerProps {
  scorecard: WplScorecard;
}

type ViewerTab = 'innings-1' | 'innings-2' | 'overview';

export default function WplScorecardViewer({ scorecard }: WplScorecardViewerProps) {
  const inningsList = scorecard.innings || [];
  const defaultTab: ViewerTab = inningsList.length >= 2 ? 'innings-2' : 'innings-1';
  const [activeTab, setActiveTab] = useState<ViewerTab>(defaultTab);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setActiveTab(inningsList.length >= 2 ? 'innings-2' : 'innings-1');
  }, [scorecard.id, scorecard.matchId, inningsList.length]);

  const inn1 = inningsList[0];
  const inn2 = inningsList[1];
  const inn1Teams = inn1 ? resolveInningsTeams(scorecard, inn1) : null;
  const inn2Teams = inn2 ? resolveInningsTeams(scorecard, inn2) : null;
  const inn1Summary = inn1 ? computeInningsSummary(inn1) : null;
  const inn2Summary = inn2 ? computeInningsSummary(inn2) : null;

  const team1Theme = getTeamVisualTheme(scorecard.matchInfo.team1);
  const team2Theme = getTeamVisualTheme(scorecard.matchInfo.team2);
  const winnerCode = normalizeWplTeamCode(scorecard.result?.winner);
  const dateFmt = formatIndianDate(scorecard.matchInfo.date);
  const highlights = getMatchHighlightMetrics(scorecard);

  const handleCopyLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('matchId', scorecard.matchId);
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  const tabs: Array<{ id: ViewerTab; label: string; sub?: string }> = [];
  if (inn1 && inn1Teams && inn1Summary) {
    tabs.push({
      id: 'innings-1',
      label: `1st Innings • ${normalizeWplTeamCode(inn1Teams.battingTeam) || inn1Teams.battingTeam.shortName || 'Team 1'}`,
      sub: `${inn1Summary.totalRuns}/${inn1Summary.totalWickets} (${inn1Summary.totalOversLabel})`,
    });
  }
  if (inn2 && inn2Teams && inn2Summary) {
    tabs.push({
      id: 'innings-2',
      label: `2nd Innings • ${normalizeWplTeamCode(inn2Teams.battingTeam) || inn2Teams.battingTeam.shortName || 'Team 2'}`,
      sub: `${inn2Summary.totalRuns}/${inn2Summary.totalWickets} (${inn2Summary.totalOversLabel})`,
    });
  }
  if (inn1 && inn2) {
    tabs.push({
      id: 'overview',
      label: 'Match Comparison',
      sub: 'Side-by-side breakdown',
    });
  }

  const activeInnings = activeTab === 'innings-2' ? inn2 : inn1;

  const renderTeamBlock = (
    team: WplScorecard['matchInfo']['team1'],
    summary: ReturnType<typeof computeInningsSummary> | null,
    isWinner: boolean,
    alignRight = false
  ) => {
    const theme = getTeamVisualTheme(team);
    return (
      <div
        className={`flex items-center gap-3.5 sm:gap-4 ${
          alignRight ? 'sm:flex-row-reverse sm:text-right' : ''
        }`}
      >
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950/80 border border-white/15 p-2 flex items-center justify-center shrink-0 shadow-lg"
          style={{ boxShadow: isWinner ? `0 0 28px ${theme.glowColor}` : undefined }}
        >
          <img
            src={getTeamLogoUrl(team)}
            alt={cleanTeamDisplayName(team.name)}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <div
            className={`flex items-center gap-2 flex-wrap ${
              alignRight ? 'sm:justify-end' : ''
            }`}
          >
            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${theme.badgeClass}`}>
              {theme.code}
            </span>
            {isWinner && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/35">
                <Trophy className="w-2.5 h-2.5" />
                Winner
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-xl font-black text-white mt-1 truncate">
            {cleanTeamDisplayName(team.name)}
          </h2>
          {summary ? (
            <div className="mt-1 text-xl sm:text-2xl font-black text-white tabular-nums">
              {summary.totalRuns}/{summary.totalWickets}
              <span className="text-xs sm:text-sm font-bold text-slate-300 ml-2">
                ({summary.totalOversLabel} ov • RR {summary.runRate})
              </span>
            </div>
          ) : (
            <div className="mt-1 text-xs text-slate-400">Scorecard awaited</div>
          )}
        </div>
      </div>
    );
  };

  // Determine summaries matched specifically to team1 and team2 for the top hero card
  const findTeamSummary = (teamId: string | number) => {
    const matched = inningsList.find((inns) => String(inns.battingTeamId).trim() === String(teamId).trim());
    return matched ? computeInningsSummary(matched) : null;
  };
  const team1Summary = findTeamSummary(scorecard.matchInfo.team1.id);
  const team2Summary = findTeamSummary(scorecard.matchInfo.team2.id);

  return (
    <div className="space-y-6">
      {/* Match Broadcast Hero Banner */}
      <motion.section
        key={scorecard.id || scorecard.matchId}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#090F21]/95 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl"
        style={{
          backgroundImage: `radial-gradient(circle at 12% 18%, ${team1Theme.glowColor}, transparent 42%), radial-gradient(circle at 88% 22%, ${team2Theme.glowColor}, transparent 42%)`,
        }}
      >
        {/* Top Metadata Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
            <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black uppercase tracking-wider">
              Match {scorecard.matchId}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 font-semibold text-white">
              <Calendar className="w-3.5 h-3.5 text-sky-300" />
              {dateFmt.readable}
              <span className="text-slate-400">({dateFmt.short})</span>
            </span>
            {scorecard.matchInfo.time && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                {scorecard.matchInfo.time} IST
              </span>
            )}
            {scorecard.matchInfo.venue && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 font-semibold text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                {scorecard.matchInfo.venue}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-slate-200 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-300">Link Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-300" />
                <span>Share Scorecard</span>
              </>
            )}
          </button>
        </div>

        {/* Dual Franchise Scoreboard */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-5 py-6">
          {renderTeamBlock(
            scorecard.matchInfo.team1,
            team1Summary,
            Boolean(winnerCode && winnerCode === team1Theme.code),
            false
          )}

          <div className="flex sm:flex-col items-center justify-center gap-2 px-2">
            <span className="px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 text-xs font-black tracking-[0.2em] text-slate-300">
              VS
            </span>
          </div>

          {renderTeamBlock(
            scorecard.matchInfo.team2,
            team2Summary,
            Boolean(winnerCode && winnerCode === team2Theme.code),
            true
          )}
        </div>

        {/* Result, Man of the Match & Toss Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div className="md:col-span-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                  Official Result
                </div>
                <div className="text-sm sm:text-base font-black text-white">
                  {scorecard.result?.winner
                    ? `${cleanTeamDisplayName(scorecard.result.winner)} won by ${scorecard.result.margin || ''}`.trim()
                    : 'Result updated from official scorecard'}
                </div>
              </div>
            </div>
            {scorecard.matchInfo.toss?.winner && (
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-200 bg-slate-950/50 border border-white/10 px-3 py-1.5 rounded-lg">
                <Coins className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>
                  Toss: <strong>{cleanTeamDisplayName(scorecard.matchInfo.toss.winner)}</strong> elected to{' '}
                  {scorecard.matchInfo.toss.decision || 'bat'}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/35 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
                Player of the Match
              </div>
              <div className="text-sm font-black text-white truncate">
                {scorecard.result?.manOfTheMatch || highlights.bestBatter?.name || 'TBA'}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Match KPI Snapshot Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-white/10 bg-[#0B1020]/85 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Boundaries Hit</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white tabular-nums">
            {highlights.totalFours + highlights.totalSixes}
          </div>
          <div className="mt-1 text-xs text-slate-300 tabular-nums">
            {highlights.totalFours} fours • {highlights.totalSixes} sixes
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B1020]/85 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Top Knock</span>
            <Flame className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-black text-white truncate">
            {highlights.bestBatter ? highlights.bestBatter.name : '—'}
          </div>
          <div className="mt-1 text-xs text-sky-300 font-bold tabular-nums">
            {highlights.bestBatter
              ? `${highlights.bestBatter.runs} (${highlights.bestBatter.balls}) • ${highlights.bestBatter.teamCode}`
              : 'No batting data'}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B1020]/85 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Best Bowling</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-black text-white truncate">
            {highlights.bestBowler ? highlights.bestBowler.name : '—'}
          </div>
          <div className="mt-1 text-xs text-emerald-300 font-bold tabular-nums">
            {highlights.bestBowler
              ? `${highlights.bestBowler.wickets}/${highlights.bestBowler.runs} (${highlights.bestBowler.overs} ov) • ${highlights.bestBowler.teamCode}`
              : 'No bowling data'}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B1020]/85 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Innings Tempo</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-black text-white tabular-nums">
            {inn1Summary ? `${inn1Summary.runRate} RR` : '—'}
            {inn2Summary ? ` vs ${inn2Summary.runRate}` : ''}
          </div>
          <div className="mt-1 text-xs text-slate-300">
            {inn1Summary && inn2Summary
              ? `Aggregate ${inn1Summary.totalRuns + inn2Summary.totalRuns} runs`
              : 'Run rate comparison'}
          </div>
        </div>
      </div>

      {/* Innings / Comparison Tab Selector */}
      <div className="flex flex-wrap gap-2.5 p-1.5 rounded-2xl border border-white/10 bg-[#080D1B]/90 backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 min-w-[180px] rounded-xl px-4 py-3 text-left transition-colors ${
                isActive ? 'text-white' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="wplScorecardActiveTab"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600/80 via-blue-600/75 to-sky-600/75 border border-sky-300/35 shadow-lg"
                />
              )}
              <div className="relative z-10">
                <div className="text-xs sm:text-sm font-black">{tab.label}</div>
                {tab.sub && (
                  <div className="text-[11px] font-semibold opacity-85 tabular-nums mt-0.5">
                    {tab.sub}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && inn1 && inn2 && inn1Teams && inn2Teams && inn1Summary && inn2Summary ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {[
              { innings: inn1, teams: inn1Teams, summary: inn1Summary, label: '1st Innings' },
              { innings: inn2, teams: inn2Teams, summary: inn2Summary, label: '2nd Innings' },
            ].map(({ innings, teams, summary, label }) => {
              const theme = getTeamVisualTheme(teams.battingTeam);
              const topBatters = [...cleanBatters(innings.batting)]
                .sort((a, b) => b.runsNum - a.runsNum)
                .slice(0, 3);
              const topBowlers = [...cleanBowlers(innings.bowling)]
                .sort((a, b) => b.wicketsNum - a.wicketsNum || a.runsNum - b.runsNum)
                .slice(0, 3);

              return (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-[#0B1020]/90 p-5 backdrop-blur-xl space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getTeamLogoUrl(teams.battingTeam)}
                        alt={cleanTeamDisplayName(teams.battingTeam.name)}
                        className="w-10 h-10 object-contain"
                      />
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                          {label}
                        </span>
                        <h4 className="text-base font-black text-white">
                          {cleanTeamDisplayName(teams.battingTeam.name)}
                        </h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white tabular-nums">
                        {summary.totalRuns}/{summary.totalWickets}
                      </div>
                      <div className="text-xs text-slate-400 tabular-nums">
                        {summary.totalOversLabel} ov • RR {summary.runRate}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Fours / Sixes
                      </div>
                      <div className="text-sm font-black text-white mt-0.5 tabular-nums">
                        {summary.totalFours} / {summary.totalSixes}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Extras
                      </div>
                      <div className="text-sm font-black text-white mt-0.5 tabular-nums">
                        {summary.extrasTotal}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Team Code
                      </div>
                      <div className="text-sm font-black text-sky-300 mt-0.5">{theme.code}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        Key Batters
                      </div>
                      <div className="space-y-2">
                        {topBatters.map((b, i) => (
                          <div
                            key={`${b.name}-${i}`}
                            className="flex items-center justify-between text-xs rounded-lg bg-slate-900/70 px-3 py-2 border border-white/[0.06]"
                          >
                            <span className="font-bold text-white truncate pr-2">{b.name}</span>
                            <span className="font-black text-amber-300 tabular-nums shrink-0">
                              {b.runsNum}
                              {b.isNotOut ? '*' : ''} ({b.ballsNum})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        Key Bowlers
                      </div>
                      <div className="space-y-2">
                        {topBowlers.map((bw, i) => (
                          <div
                            key={`${bw.name}-${i}`}
                            className="flex items-center justify-between text-xs rounded-lg bg-slate-900/70 px-3 py-2 border border-white/[0.06]"
                          >
                            <span className="font-bold text-white truncate pr-2">{bw.name}</span>
                            <span className="font-black text-sky-300 tabular-nums shrink-0">
                              {bw.wicketsNum}/{bw.runsNum} ({bw.oversLabel})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : activeInnings ? (
          <WplScorecardInningsPanel
            key={`${scorecard.matchId}-inn-${activeInnings.inningsNumber}`}
            scorecard={scorecard}
            innings={activeInnings}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
