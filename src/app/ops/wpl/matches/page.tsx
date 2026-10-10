"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Zap,
  CheckSquare,
  Square,
  CheckCheck,
  FolderOpen,
} from "lucide-react";
import { WplMatch, TeamRef, VenueRef, MatchStage } from "@/types/match";
import { generateWpl2027SeasonDraft } from "@/lib/round-robin-engine";
import { calculateWplStandings, MatchResultPayload } from "@/lib/standings-engine";

export const WPL_TEAMS: TeamRef[] = [
  { id: "rcb", name: "Royal Challengers Bengaluru", short: "RCB", accent: "#E21D24", badgeBg: "bg-red-500/20 text-red-400 border-red-500/30" },
  { id: "mi", name: "Mumbai Indians", short: "MI", accent: "#004BA0", badgeBg: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "dc", name: "Delhi Capitals", short: "DC", accent: "#2563EB", badgeBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { id: "gg", name: "Gujarat Giants", short: "GG", accent: "#F97316", badgeBg: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "upw", name: "UP Warriorz", short: "UPW", accent: "#EAB308", badgeBg: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
];

export const WPL_VENUES: VenueRef[] = [
  { id: "v-bengaluru", name: "M. Chinnaswamy Stadium", city: "Bengaluru" },
  { id: "v-delhi", name: "Arun Jaitley Stadium", city: "Delhi" },
  { id: "v-mumbai", name: "DY Patil Stadium", city: "Navi Mumbai" },
  { id: "v-vadodara", name: "Kotambi Stadium", city: "Vadodara" },
];

const STORAGE_KEY = "wpl_matches_fixtures_v2027";

export default function WplMatchesManagementPage() {
  // Empty by default — 2026 matches removed, awaiting official 2027 BCCI release
  const [matches, setMatches] = useState<WplMatch[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMatches(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load matches from storage", e);
    }
    setIsLoaded(true);
  }, []);

  const saveMatches = (updated: WplMatch[]) => {
    setMatches(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save matches", e);
    }
  };

  const [completedResults] = useState<MatchResultPayload[]>([]);
  const [stageFilter, setStageFilter] = useState<"ALL" | "LEAGUE" | "PLAYOFFS" | "STANDINGS">("ALL");

  // Selection & Batch Action State
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<WplMatch | null>(null);

  const [overrideModalMatch, setOverrideModalMatch] = useState<WplMatch | null>(null);
  const [selectedTeamA, setSelectedTeamA] = useState("");
  const [selectedTeamB, setSelectedTeamB] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const teamMap = useMemo(() => new Map(WPL_TEAMS.map((t) => [t.id, t])), []);
  const venueMap = useMemo(() => new Map(WPL_VENUES.map((v) => [v.id, v])), []);

  const standings = useMemo(() => {
    return calculateWplStandings(WPL_TEAMS, completedResults);
  }, [completedResults]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (stageFilter === "LEAGUE") return m.stage === "LEAGUE";
      if (stageFilter === "PLAYOFFS") return m.stage === "ELIMINATOR" || m.stage === "FINAL";
      return true;
    });
  }, [matches, stageFilter]);

  // Bulk Selection Handlers
  const handleToggleSelectMatch = (id: string) => {
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedMatchIds.size === filteredMatches.length && filteredMatches.length > 0) {
      setSelectedMatchIds(new Set());
    } else {
      setSelectedMatchIds(new Set(filteredMatches.map((m) => m.id)));
    }
  };

  // Batch delete selected matches
  const handleBatchDelete = () => {
    if (selectedMatchIds.size === 0) return;
    const confirmMsg = "Permanently delete " + selectedMatchIds.size + " selected fixture(s)?";
    if (!window.confirm(confirmMsg)) return;

    const remaining = matches.filter((m) => !selectedMatchIds.has(m.id));
    saveMatches(remaining);
    setSelectedMatchIds(new Set());
  };

  // Purge all matches (wipe entire slate)
  const handlePurgeAllMatches = () => {
    if (matches.length === 0) return;
    if (!window.confirm("Are you sure you want to delete ALL " + matches.length + " matches? This action cannot be undone.")) return;
    saveMatches([]);
    setSelectedMatchIds(new Set());
  };

  // Single delete
  const handleDeleteSingleMatch = (id: string, matchNum: number) => {
    if (!window.confirm("Delete Match #" + matchNum + "?")) return;
    const remaining = matches.filter((m) => m.id !== id);
    saveMatches(remaining);
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Admin load official 2027 draft generator
  const handleGenerate2027Draft = () => {
    if (matches.length > 0 && !window.confirm("Existing fixtures will be replaced by the 2027 schedule matrix. Continue?")) {
      return;
    }
    const draft = generateWpl2027SeasonDraft(WPL_TEAMS, WPL_VENUES);
    saveMatches(draft);
    setSelectedMatchIds(new Set());
  };

  // Manual fixture creation / editing
  const handleSaveManualMatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const matchNumber = Number(formData.get("matchNumber")) || (matches.length + 1);
    const stage = formData.get("stage") as MatchStage;
    const teamAId = (formData.get("teamAId") as string) || null;
    const teamBId = (formData.get("teamBId") as string) || null;
    const venueId = (formData.get("venueId") as string) || WPL_VENUES[0].id;
    const date = formData.get("date") as string;
    const time = (formData.get("time") as string) || "19:30";

    const scheduledStartTime = date ? new Date(date + "T" + time + ":00+05:30").toISOString() : new Date().toISOString();
    const isPlayoff = stage === "ELIMINATOR" || stage === "FINAL";

    if (editingMatch) {
      const updated = matches.map((m) =>
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
      );
      saveMatches(updated);
    } else {
      const newMatch: WplMatch = {
        id: "wpl-2027-m" + String(matchNumber).padStart(2, "0"),
        matchNumber,
        stage,
        teamAId,
        teamBId,
        venueId,
        scheduledStartTime,
        status: "SCHEDULED",
        isResolved: !isPlayoff || Boolean(teamAId && teamBId),
        lineupStatus: "PENDING",
        placeholderA:
          stage === "ELIMINATOR"
            ? { label: "Rank 2 (Points Table)", sourceType: "POINTS_TABLE_RANK", sourceRank: 2 }
            : stage === "FINAL"
            ? { label: "Rank 1 (Points Table)", sourceType: "POINTS_TABLE_RANK", sourceRank: 1 }
            : undefined,
        placeholderB:
          stage === "ELIMINATOR"
            ? { label: "Rank 3 (Points Table)", sourceType: "POINTS_TABLE_RANK", sourceRank: 3 }
            : stage === "FINAL"
            ? { label: "Winner of Eliminator", sourceType: "MATCH_WINNER", sourceMatchNumber: 21 }
            : undefined,
      };
      const updated = [...matches, newMatch].sort((a, b) => a.matchNumber - b.matchNumber);
      saveMatches(updated);
    }

    setIsManualModalOpen(false);
    setEditingMatch(null);
  };

  const handleSavePlayoffOverride = () => {
    if (!overrideModalMatch || !selectedTeamA || !selectedTeamB) return;
    const updated = matches.map((m) => {
      if (m.id === overrideModalMatch.id) {
        return {
          ...m,
          teamAId: selectedTeamA,
          teamBId: selectedTeamB,
          isResolved: true,
          isManualOverride: true,
          overrideNote: overrideReason || "Manual Seed Assignment",
          status: "READY_FOR_TOSS" as const,
        };
      }
      return m;
    });
    saveMatches(updated);
    setOverrideModalMatch(null);
  };

  return (
    <div className="relative min-h-screen bg-[#07080E] text-neutral-100 p-6 md:p-10 font-sans selection:bg-purple-500/30">
      <div className="pointer-events-none fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-600/15 via-indigo-600/10 to-transparent blur-[120px]" />
      <div className="pointer-events-none fixed top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-cyan-600/10 via-pink-600/10 to-transparent blur-[140px]" />

      <div className="relative mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                WPL Operations &bull; Season 2027 Console
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              Fixtures & Operations Hub
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {matches.length > 0 && (
              <button
                onClick={handlePurgeAllMatches}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Matches ({matches.length})</span>
              </button>
            )}

            <button
              onClick={handleGenerate2027Draft}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load 2027 Double Round-Robin Matrix</span>
            </button>

            <button
              onClick={() => {
                setEditingMatch(null);
                setIsManualModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-lg shadow-purple-500/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add 2027 Fixture</span>
            </button>
          </div>
        </header>

        {/* Filter & Batch Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md w-fit">
              {(["ALL", "LEAGUE", "PLAYOFFS", "STANDINGS"] as const).map((stage) => (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stage)}
                  className={"relative px-4 py-1.5 rounded-lg text-xs font-semibold transition " + (stageFilter === stage ? "text-white" : "text-neutral-400 hover:text-neutral-200")}
                >
                  {stageFilter === stage && (
                    <motion.div
                      layoutId="filterPillMatches"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600/80 to-purple-600/80 border border-purple-400/30 shadow-md"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">
                    {stage === "ALL"
                      ? "All (" + matches.length + ")"
                      : stage === "LEAGUE"
                      ? "League"
                      : stage === "PLAYOFFS"
                      ? "Playoffs"
                      : "Standings"}
                  </span>
                </button>
              ))}
            </div>

            {stageFilter !== "STANDINGS" && filteredMatches.length > 0 && (
              <button
                onClick={handleSelectAllVisible}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 transition cursor-pointer"
              >
                {selectedMatchIds.size === filteredMatches.length ? (
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>
                  {selectedMatchIds.size === filteredMatches.length ? "Deselect All" : "Select All"}
                </span>
              </button>
            )}
          </div>

          {selectedMatchIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-3 p-2 px-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs shadow-lg"
            >
              <span className="font-bold">{selectedMatchIds.size} Selected</span>
              <button
                onClick={handleBatchDelete}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-md shadow-rose-600/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
              <button
                onClick={() => setSelectedMatchIds(new Set())}
                className="text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>

        {/* Content Section */}
        {stageFilter === "STANDINGS" ? (
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
                      {team.nrr > 0 ? "+" + team.nrr.toFixed(3) : team.nrr.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredMatches.length === 0 ? (
          /* Empty Slate State */
          <div className="flex flex-col items-center justify-center p-16 rounded-3xl border border-dashed border-white/10 bg-[#0E101D]/50 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No 2027 Fixtures Loaded</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                2026 matches have been purged. When BCCI releases the official 2027 schedule, click &quot;Add 2027 Fixture&quot; to enter matches manually or load the draft matrix.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => {
                  setEditingMatch(null);
                  setIsManualModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-neutral-200 transition cursor-pointer"
              >
                + Add First 2027 Match
              </button>
              <button
                onClick={handleGenerate2027Draft}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 transition cursor-pointer"
              >
                Load 22-Match Matrix
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {filteredMatches.map((match) => {
                const teamA = match.teamAId ? teamMap.get(match.teamAId) : null;
                const teamB = match.teamBId ? teamMap.get(match.teamBId) : null;
                const venue = venueMap.get(match.venueId);
                const isPlayoff = match.stage === "ELIMINATOR" || match.stage === "FINAL";
                const isSelected = selectedMatchIds.has(match.id);

                return (
                  <motion.div
                    key={match.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className={"relative rounded-2xl border transition-all backdrop-blur-xl " + (isSelected ? "border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10 " : isPlayoff ? "bg-gradient-to-r from-purple-950/20 via-[#111322] to-[#0D0F1B] border-purple-500/30 " : "bg-[#0E101D]/70 border-white/10 hover:border-white/20 ")}
                  >
                    <div className="p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start md:items-center space-x-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectMatch(match.id)}
                          className="mt-1 md:mt-0 p-1 text-neutral-400 hover:text-white transition cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-cyan-400" />
                          ) : (
                            <Square className="w-5 h-5 text-neutral-600" />
                          )}
                        </button>

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
                            {new Date(match.scheduledStartTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST &bull; {venue?.name || "TBA"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <span className="font-bold text-sm text-white">
                            {teamA ? teamA.name : <span className="text-purple-300/70 italic">{match.placeholderA?.label || "TBA"}</span>}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-neutral-500 uppercase">VS</span>
                        <div>
                          <span className="font-bold text-sm text-white">
                            {teamB ? teamB.name : <span className="text-purple-300/70 italic">{match.placeholderB?.label || "TBA"}</span>}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {isPlayoff && (
                          <button
                            onClick={() => {
                              setOverrideModalMatch(match);
                              setSelectedTeamA(match.teamAId || "");
                              setSelectedTeamB(match.teamBId || "");
                              setOverrideReason(match.overrideNote || "");
                            }}
                            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>{match.isResolved ? "Edit Seed" : "Fail-Safe Assign"}</span>
                          </button>
                        )}

                        <Link
                          href={"/ops/wpl/fixtures/" + match.id + "/lineups"}
                          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-neutral-200 text-black transition shadow-sm"
                        >
                          <span>Toss & Lineups</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteSingleMatch(match.id, match.matchNumber)}
                          className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                          title="Delete Match"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Manual Fixture Entry Modal for Admins */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsManualModalOpen(false)} />
            <form
              onSubmit={handleSaveManualMatch}
              className="relative w-full max-w-lg rounded-3xl bg-[#111322] border border-white/10 p-6 md:p-8 text-neutral-100 z-10 space-y-4"
            >
              <h3 className="text-lg font-bold">Add / Schedule WPL 2027 Fixture</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Match Number</label>
                  <input
                    name="matchNumber"
                    type="number"
                    defaultValue={matches.length + 1}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Stage</label>
                  <select name="stage" className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
                    <option value="LEAGUE" className="bg-[#111322]">League Match</option>
                    <option value="ELIMINATOR" className="bg-[#111322]">Eliminator</option>
                    <option value="FINAL" className="bg-[#111322]">Final</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Team A</label>
                  <select name="teamAId" className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
                    <option value="">Select Team</option>
                    {WPL_TEAMS.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#111322]">{t.name} ({t.short})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Team B</label>
                  <select name="teamBId" className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
                    <option value="">Select Team</option>
                    {WPL_TEAMS.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#111322]">{t.name} ({t.short})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Venue</label>
                  <select name="venueId" className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
                    {WPL_VENUES.map((v) => (
                      <option key={v.id} value={v.id} className="bg-[#111322]">{v.name} ({v.city})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue="2027-02-12"
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Time (IST)</label>
                <input
                  name="time"
                  type="time"
                  defaultValue="19:30"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer"
                >
                  Save Fixture
                </button>
              </div>
            </form>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Seed Modal */}
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
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlayoffOverride}
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer"
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
