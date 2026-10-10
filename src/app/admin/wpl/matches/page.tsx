'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldAlert,
  Plus,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  X,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-react';
import { WplMatch, TeamRef, VenueRef, MatchStage } from '@/types/match';
import { generateWpl2027SeasonDraft } from '@/lib/round-robin-engine';
import { calculateWplStandings, MatchResultPayload } from '@/lib/standings-engine';

export const WPL_TEAMS: TeamRef[] = [
  { id: 'rcb', name: 'Royal Challengers Bengaluru', short: 'RCB', accent: '#E21D24', badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { id: 'mi', name: 'Mumbai Indians', short: 'MI', accent: '#004BA0', badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'dc', name: 'Delhi Capitals', short: 'DC', accent: '#2563EB', badgeBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'gg', name: 'Gujarat Giants', short: 'GG', accent: '#F97316', badgeBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'upw', name: 'UP Warriorz', short: 'UPW', accent: '#EAB308', badgeBg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
];

export const WPL_VENUES: VenueRef[] = [
  { id: 'v-bengaluru', name: 'M. Chinnaswamy Stadium', city: 'Bengaluru' },
  { id: 'v-delhi', name: 'Arun Jaitley Stadium', city: 'Delhi' },
  { id: 'v-mumbai', name: 'DY Patil Stadium', city: 'Navi Mumbai' },
  { id: 'v-vadodara', name: 'Kotambi Stadium', city: 'Vadodara' },
];

export default function WplMatchesManagementPage() {
  const [matches, setMatches] = useState<WplMatch[]>(() =>
    generateWpl2027SeasonDraft(WPL_TEAMS, WPL_VENUES)
  );

  const [completedResults, setCompletedResults] = useState<MatchResultPayload[]>([]);
  const [stageFilter, setStageFilter] = useState<'ALL' | 'LEAGUE' | 'PLAYOFFS' | 'STANDINGS'>('ALL');

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<WplMatch | null>(null);

  const [overrideModalMatch, setOverrideModalMatch] = useState<WplMatch | null>(null);
  const [selectedTeamA, setSelectedTeamA] = useState('');
  const [selectedTeamB, setSelectedTeamB] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const teamMap = useMemo(() => new Map(WPL_TEAMS.map((t) => [t.id, t])), []);
  const venueMap = useMemo(() => new Map(WPL_VENUES.map((v) => [v.id, v])), []);

  const standings = useMemo(() => {
    return calculateWplStandings(WPL_TEAMS, completedResults);
  }, [completedResults]);

  const leagueCompletedCount = useMemo(() => {
    return matches.filter((m) => m.stage === 'LEAGUE' && m.status === 'COMPLETED').length;
  }, [matches]);

  const canAutoSeedPlayoffs = leagueCompletedCount === 20;

  const handleApplyAutoSeed = () => {
    const rank1 = standings[0];
    const rank2 = standings[1];
    const rank3 = standings[2];

    setMatches((prev) =>
      prev.map((m) => {
        if (m.stage === 'ELIMINATOR') {
          return {
            ...m,
            teamAId: rank2.teamId,
            teamBId: rank3.teamId,
            isResolved: true,
            status: 'READY_FOR_TOSS',
            overrideNote: `Points Table Qualified: #2 ${rank2.shortName} vs #3 ${rank3.shortName}`,
          };
        }
        if (m.stage === 'FINAL') {
          return {
            ...m,
            teamAId: rank1.teamId,
            overrideNote: `Direct Finalist: #1 ${rank1.shortName}`,
          };
        }
        return m;
      })
    );
  };

  const handleSavePlayoffOverride = () => {
    if (!overrideModalMatch || !selectedTeamA || !selectedTeamB) return;
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === overrideModalMatch.id) {
          return {
            ...m,
            teamAId: selectedTeamA,
            teamBId: selectedTeamB,
            isResolved: true,
            isManualOverride: true,
            overrideNote: overrideReason || 'Manual Seed Assignment',
            status: 'READY_FOR_TOSS',
          };
        }
        return m;
      })
    );
    setOverrideModalMatch(null);
  };

  const handleSaveManualMatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const matchNumber = Number(formData.get('matchNumber'));
    const stage = formData.get('stage') as MatchStage;
    const teamAId = (formData.get('teamAId') as string) || null;
    const teamBId = (formData.get('teamBId') as string) || null;
    const venueId = formData.get('venueId') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;

    const scheduledStartTime = new Date(`${date}T${time}:00+05:30`).toISOString();
    const isPlayoff = stage === 'ELIMINATOR' || stage === 'FINAL';

    if (editingMatch) {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === editingMatch.id
            ? {
                ...m,
                matchNumber,
                stage,
                teamAId,
                teamBId,
                venueId,
                scheduledStartTime,
                isResolved: !isPlayoff || Boolean(teamAId && teamBId),
              }
            : m
        )
      );
    } else {
      const newMatch: WplMatch = {
        id: `wpl-custom-${Date.now()}`,
        matchNumber,
        stage,
        teamAId,
        teamBId,
        venueId,
        scheduledStartTime,
        status: 'SCHEDULED',
        isResolved: !isPlayoff || Boolean(teamAId && teamBId),
        lineupStatus: 'PENDING',
        placeholderA:
          stage === 'ELIMINATOR'
            ? { label: 'Rank 2 (Points Table)', sourceType: 'POINTS_TABLE_RANK', sourceRank: 2 }
            : stage === 'FINAL'
            ? { label: 'Rank 1 (Points Table)', sourceType: 'POINTS_TABLE_RANK', sourceRank: 1 }
            : undefined,
        placeholderB:
          stage === 'ELIMINATOR'
            ? { label: 'Rank 3 (Points Table)', sourceType: 'POINTS_TABLE_RANK', sourceRank: 3 }
            : stage === 'FINAL'
            ? { label: 'Winner of Eliminator', sourceType: 'MATCH_WINNER', sourceMatchNumber: 21 }
            : undefined,
      };
      setMatches((prev) => [...prev, newMatch].sort((a, b) => a.matchNumber - b.matchNumber));
    }

    setIsManualModalOpen(false);
    setEditingMatch(null);
  };

  const filteredMatches = matches.filter((m) => {
    if (stageFilter === 'LEAGUE') return m.stage === 'LEAGUE';
    if (stageFilter === 'PLAYOFFS') return m.stage === 'ELIMINATOR' || m.stage === 'FINAL';
    return true;
  });

  return (
    <div className="relative min-h-screen bg-[#07080E] text-neutral-100 p-6 md:p-10 font-sans selection:bg-purple-500/30">
      <div className="pointer-events-none fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-600/15 via-indigo-600/10 to-transparent blur-[120px]" />
      <div className="pointer-events-none fixed top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-cyan-600/10 via-pink-600/10 to-transparent blur-[140px]" />

      <div className="relative mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6 backdrop-blur-xs">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                WPL Match Operations Hub &bull; 2027 Season
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              Fixtures & Standings Central
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setMatches(generateWpl2027SeasonDraft(WPL_TEAMS, WPL_VENUES))}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Regenerate 22-Match Matrix</span>
            </button>

            <button
              onClick={() => {
                setEditingMatch(null);
                setIsManualModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-lg shadow-purple-500/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Fixture</span>
            </button>
          </div>
        </header>

        {canAutoSeedPlayoffs && (
          <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-white">All 20 League Matches Completed!</h4>
                <p className="text-xs text-neutral-300">
                  Ready to auto-populate Eliminator (#2 {standings[1].shortName} vs #3 {standings[2].shortName}) and Final (#1 {standings[0].shortName}).
                </p>
              </div>
            </div>
            <button
              onClick={handleApplyAutoSeed}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition"
            >
              Apply Playoff Standings
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md w-fit">
            {(['ALL', 'LEAGUE', 'PLAYOFFS', 'STANDINGS'] as const).map((stage) => (
              <button
                key={stage}
                onClick={() => setStageFilter(stage)}
                className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  stageFilter === stage ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {stageFilter === stage && (
                  <motion.div
                    layoutId="filterPill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600/80 to-purple-600/80 border border-purple-400/30 shadow-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">
                  {stage === 'ALL'
                    ? `All Matches (${matches.length})`
                    : stage === 'LEAGUE'
                    ? 'League (20)'
                    : stage === 'PLAYOFFS'
                    ? 'Playoffs (2)'
                    : 'Live Standings'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {stageFilter === 'STANDINGS' ? (
          <div className="rounded-2xl border border-white/10 bg-[#0E101D]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono uppercase text-neutral-400">
                  <th className="py-3 px-4">Pos</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-center">P</th>
                  <th className="py-3 px-4 text-center">W</th>
                  <th className="py-3 px-4 text-center">L</th>
                  <th className="py-3 px-4 text-right">Pts</th>
                  <th className="py-3 px-4 text-right">NRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {standings.map((team) => (
                  <tr key={team.teamId} className="hover:bg-white/5">
                    <td className="py-3 px-4 font-mono font-bold">{team.rank}</td>
                    <td className="py-3 px-4 font-bold text-white">{team.teamName} ({team.shortName})</td>
                    <td className="py-3 px-4 text-center font-mono">{team.played}</td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-400">{team.won}</td>
                    <td className="py-3 px-4 text-center font-mono text-rose-400">{team.lost}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">{team.points}</td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-300">
                      {team.nrr > 0 ? `+${team.nrr.toFixed(3)}` : team.nrr.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {filteredMatches.map((match) => {
                const teamA = match.teamAId ? teamMap.get(match.teamAId) : null;
                const teamB = match.teamBId ? teamMap.get(match.teamBId) : null;
                const venue = venueMap.get(match.venueId);
                const isPlayoff = match.stage === 'ELIMINATOR' || match.stage === 'FINAL';

                return (
                  <motion.div
                    key={match.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className={`relative rounded-2xl border transition-all backdrop-blur-xl ${
                      isPlayoff
                        ? 'bg-gradient-to-r from-purple-950/20 via-[#111322] to-[#0D0F1B] border-purple-500/30'
                        : 'bg-[#0E101D]/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start md:items-center space-x-4">
                        <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl bg-white/5 border border-white/10 font-mono">
                          <span className="text-[10px] text-neutral-400 uppercase">Match</span>
                          <span className="text-lg font-bold text-white">{match.matchNumber}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-neutral-800 text-neutral-300">
                              {match.stage}
                            </span>
                            {match.isManualOverride && (
                              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <ShieldAlert className="w-3 h-3" />
                                <span>Manual Seed</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 font-mono">
                            {new Date(match.scheduledStartTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST &bull; {venue?.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <span className="font-bold text-sm text-white">
                            {teamA ? teamA.name : <span className="text-purple-300/70 italic">{match.placeholderA?.label}</span>}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-neutral-500 uppercase">VS</span>
                        <div>
                          <span className="font-bold text-sm text-white">
                            {teamB ? teamB.name : <span className="text-purple-300/70 italic">{match.placeholderB?.label}</span>}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {isPlayoff && (
                          <button
                            onClick={() => {
                              setOverrideModalMatch(match);
                              setSelectedTeamA(match.teamAId || '');
                              setSelectedTeamB(match.teamBId || '');
                              setOverrideReason(match.overrideNote || '');
                            }}
                            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>{match.isResolved ? 'Edit Seed' : 'Fail-Safe Assign'}</span>
                          </button>
                        )}

                        {match.isResolved ? (
                          <Link
                            href={`/admin/wpl/fixtures/${match.id}/lineups`}
                            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-neutral-200 text-black transition"
                          >
                            <span>Toss & Lineups</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-white/5 px-3 py-2 rounded-xl">
                            Awaiting Teams
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {overrideModalMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setOverrideModalMatch(null)} />
            <div className="relative w-full max-w-lg rounded-3xl bg-[#111322] border border-white/10 p-6 md:p-8 text-neutral-100 z-10">
              <h3 className="text-lg font-bold mb-4">Fail-Safe Playoff Assignment: Match {overrideModalMatch.matchNumber}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Team A Slot</label>
                  <select
                    value={selectedTeamA}
                    onChange={(e) => setSelectedTeamA(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                  >
                    <option value="">Select Team</option>
                    {WPL_TEAMS.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#111322]">{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Team B Slot</label>
                  <select
                    value={selectedTeamB}
                    onChange={(e) => setSelectedTeamB(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                  >
                    <option value="">Select Team</option>
                    {WPL_TEAMS.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#111322]">{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Audit Note</label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. BCCI Tie-breaker Rule"
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setOverrideModalMatch(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlayoffOverride}
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl"
                >
                  Confirm Teams
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
