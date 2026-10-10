"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PlayerSummary, SelectedPlayer } from "@/types/match";
import { validateWplTeamLineup } from "@/lib/wpl-lineup-rules";

const SAMPLE_SQUAD_TEAM_A: PlayerSummary[] = [
  { id: "p1", name: "Smriti Mandhana", role: "BATTER", isOverseas: false },
  { id: "p2", name: "Ellyse Perry", role: "ALL_ROUNDER", isOverseas: true },
  { id: "p3", name: "Richa Ghosh", role: "WICKET_KEEPER", isOverseas: false },
  { id: "p4", name: "Sophie Devine", role: "ALL_ROUNDER", isOverseas: true },
  { id: "p5", name: "Renuka Singh Thakur", role: "BOWLER", isOverseas: false },
  { id: "p6", name: "Shreyanka Patil", role: "ALL_ROUNDER", isOverseas: false },
  { id: "p7", name: "Georgia Wareham", role: "BOWLER", isOverseas: true },
  { id: "p8", name: "Asha Sobhana", role: "BOWLER", isOverseas: false },
  { id: "p9", name: "Kanika Ahuja", role: "ALL_ROUNDER", isOverseas: false },
  { id: "p10", name: "Ekta Bisht", role: "BOWLER", isOverseas: false },
  { id: "p11", name: "Sabbhineni Meghana", role: "BATTER", isOverseas: false },
  { id: "p12", name: "Disha Kasat", role: "BATTER", isOverseas: false },
  { id: "p13", name: "Simran Bahadur", role: "ALL_ROUNDER", isOverseas: false },
  { id: "p14", name: "Kate Cross", role: "BOWLER", isOverseas: true },
  { id: "p15", name: "Tara Norris", role: "BOWLER", isOverseas: true, isAssociateNation: true },
];

const SAMPLE_SQUAD_TEAM_B: PlayerSummary[] = [
  { id: "pb1", name: "Harmanpreet Kaur", role: "BATTER", isOverseas: false },
  { id: "pb2", name: "Nat Sciver-Brunt", role: "ALL_ROUNDER", isOverseas: true },
  { id: "pb3", name: "Yastika Bhatia", role: "WICKET_KEEPER", isOverseas: false },
  { id: "pb4", name: "Hayley Matthews", role: "ALL_ROUNDER", isOverseas: true },
  { id: "pb5", name: "Amelia Kerr", role: "ALL_ROUNDER", isOverseas: true },
  { id: "pb6", name: "Pooja Vastrakar", role: "ALL_ROUNDER", isOverseas: false },
  { id: "pb7", name: "Saika Ishaque", role: "BOWLER", isOverseas: false },
  { id: "pb8", name: "Amanjot Kaur", role: "ALL_ROUNDER", isOverseas: false },
  { id: "pb9", name: "Issy Wong", role: "BOWLER", isOverseas: true },
  { id: "pb10", name: "Jintimani Kalita", role: "ALL_ROUNDER", isOverseas: false },
  { id: "pb11", name: "Humaira Kazi", role: "BATTER", isOverseas: false },
  { id: "pb12", name: "Sajeevan Sajana", role: "ALL_ROUNDER", isOverseas: false },
  { id: "pb13", name: "Amandeep Kaur", role: "BOWLER", isOverseas: false },
  { id: "pb14", name: "Fatima Jaffer", role: "BOWLER", isOverseas: false },
  { id: "pb15", name: "Chloe Tryon", role: "ALL_ROUNDER", isOverseas: true },
];

export default function LineupConsoleClient({ matchId }: { matchId: string }) {
  const [tossWinnerId, setTossWinnerId] = useState<string>("team-a");
  const [tossDecision, setTossDecision] = useState<"BAT" | "BOWL">("BAT");

  const [teamAXI, setTeamAXI] = useState<SelectedPlayer[]>([
    { playerId: "p1", isCaptain: true, isWicketKeeper: false },
    { playerId: "p2", isCaptain: false, isWicketKeeper: false },
    { playerId: "p3", isCaptain: false, isWicketKeeper: true },
    { playerId: "p4", isCaptain: false, isWicketKeeper: false },
    { playerId: "p5", isCaptain: false, isWicketKeeper: false },
    { playerId: "p6", isCaptain: false, isWicketKeeper: false },
    { playerId: "p7", isCaptain: false, isWicketKeeper: false },
    { playerId: "p8", isCaptain: false, isWicketKeeper: false },
    { playerId: "p9", isCaptain: false, isWicketKeeper: false },
    { playerId: "p10", isCaptain: false, isWicketKeeper: false },
    { playerId: "p11", isCaptain: false, isWicketKeeper: false },
  ]);
  const [teamASubs, setTeamASubs] = useState<string[]>(["p12", "p13"]);

  const [teamBXI, setTeamBXI] = useState<SelectedPlayer[]>([
    { playerId: "pb1", isCaptain: true, isWicketKeeper: false },
    { playerId: "pb2", isCaptain: false, isWicketKeeper: false },
    { playerId: "pb3", isCaptain: false, isWicketKeeper: true },
    { playerId: "pb4", isCaptain: false, isWicketKeeper: false },
    { playerId: "pb5", isCaptain: false, isWicketKeeper: false },
    { playerId: "pb6", isCaptain: false, isWicketKeeper: false },
    { playerId: "pb7", isCaptain: false, isWicketKeeper: false },
    { playerId: "pb8", isCaptain: false, isWicketKeeper: false },
    { playerId: "pb10", isCaptain: false, isWicketKeeper: false },
    { playerId: "pb11", isCaptain: false, isWicketKeeper: false },
    { playerId: "pb12", isCaptain: false, isWicketKeeper: false },
  ]);
  const [teamBSubs, setTeamBSubs] = useState<string[]>(["pb13", "pb14"]);

  const [isPublished, setIsPublished] = useState(false);

  const squadMapA = useMemo(() => new Map(SAMPLE_SQUAD_TEAM_A.map((p) => [p.id, p])), []);
  const squadMapB = useMemo(() => new Map(SAMPLE_SQUAD_TEAM_B.map((p) => [p.id, p])), []);

  const valA = useMemo(() => validateWplTeamLineup(teamAXI, teamASubs, squadMapA), [teamAXI, teamASubs, squadMapA]);
  const valB = useMemo(() => validateWplTeamLineup(teamBXI, teamBSubs, squadMapB), [teamBXI, teamBSubs, squadMapB]);

  const canPublish = valA.isValid && valB.isValid;

  const handleTogglePlayer = (teamKey: "A" | "B", playerId: string, target: "XI" | "SUB") => {
    const isA = teamKey === "A";
    const xi = isA ? teamAXI : teamBXI;
    const setXI = isA ? setTeamAXI : setTeamBXI;
    const subs = isA ? teamASubs : teamBSubs;
    const setSubs = isA ? setTeamASubs : setTeamBSubs;

    const inXI = xi.some((p) => p.playerId === playerId);
    const inSubs = subs.includes(playerId);

    if (inXI) {
      setXI(xi.filter((p) => p.playerId !== playerId));
    } else if (inSubs) {
      setSubs(subs.filter((id) => id !== playerId));
    } else {
      if (target === "XI" && xi.length < 11) {
        const squadMap = isA ? squadMapA : squadMapB;
        const p = squadMap.get(playerId);
        setXI([...xi, { playerId, isCaptain: false, isWicketKeeper: p?.role === "WICKET_KEEPER" }]);
      } else if (target === "SUB" && subs.length < 5) {
        setSubs([...subs, playerId]);
      }
    }
  };

  const handleToggleCaptain = (teamKey: "A" | "B", playerId: string) => {
    const setXI = teamKey === "A" ? setTeamAXI : setTeamBXI;
    setXI((prev) => prev.map((p) => ({ ...p, isCaptain: p.playerId === playerId ? !p.isCaptain : false })));
  };

  const handleToggleKeeper = (teamKey: "A" | "B", playerId: string) => {
    const setXI = teamKey === "A" ? setTeamAXI : setTeamBXI;
    setXI((prev) => prev.map((p) => (p.playerId === playerId ? { ...p, isWicketKeeper: !p.isWicketKeeper } : p)));
  };

  return (
    <div className="min-h-screen bg-[#07080E] text-neutral-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/wpl/matches"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                Matchday Scorer Console &bull; {matchId}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold">Toss & Lineup Verification</h1>
            </div>
          </div>

          <button
            onClick={() => {
              if (canPublish) {
                setIsPublished(true);
                alert("Toss result & Official Lineups verified and published!");
              }
            }}
            disabled={!canPublish}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
              canPublish
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-black shadow-emerald-500/20 cursor-pointer"
                : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isPublished ? "Lineups Published & Live" : "Verify & Publish Lineups"}</span>
          </button>
        </div>

        {/* Toss Control Card */}
        <div className="bg-[#111322] border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-neutral-400 font-bold">Official Coin Toss</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Toss Winner</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTossWinnerId("team-a")}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    tossWinnerId === "team-a"
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10"
                  }`}
                >
                  Royal Challengers Bengaluru
                </button>
                <button
                  type="button"
                  onClick={() => setTossWinnerId("team-b")}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    tossWinnerId === "team-b"
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10"
                  }`}
                >
                  Mumbai Indians
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Elected Decision</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTossDecision("BAT")}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    tossDecision === "BAT"
                      ? "border-cyan-500 bg-cyan-500/20 text-white"
                      : "border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10"
                  }`}
                >
                  Elected to Bat First
                </button>
                <button
                  type="button"
                  onClick={() => setTossDecision("BOWL")}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    tossDecision === "BOWL"
                      ? "border-cyan-500 bg-cyan-500/20 text-white"
                      : "border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10"
                  }`}
                >
                  Elected to Bowl First
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Squad Selection Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(["A", "B"] as const).map((key) => {
            const isA = key === "A";
            const squad = isA ? SAMPLE_SQUAD_TEAM_A : SAMPLE_SQUAD_TEAM_B;
            const xi = isA ? teamAXI : teamBXI;
            const subs = isA ? teamASubs : teamBSubs;
            const val = isA ? valA : valB;
            const teamTitle = isA ? "Royal Challengers Bengaluru" : "Mumbai Indians";

            return (
              <div key={key} className="bg-[#111322] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{teamTitle}</h3>
                    <p className="text-xs font-mono text-neutral-400">
                      XI: {val.xiCount}/11 &bull; Subs: {val.subsCount}/5 &bull; Overseas: {val.overseasCount}/4 max (5 w/ Assoc)
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {val.isValid ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        Lineup Valid
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                        Roster Incomplete
                      </span>
                    )}
                  </div>
                </div>

                {val.errors.length > 0 && (
                  <div className="bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl space-y-1">
                    {val.errors.map((err, i) => (
                      <div key={i}>&bull; {err}</div>
                    ))}
                  </div>
                )}

                <div className="divide-y divide-white/5 max-h-[460px] overflow-y-auto pr-1">
                  {squad.map((player) => {
                    const xiEntry = xi.find((p) => p.playerId === player.id);
                    const isSub = subs.includes(player.id);

                    return (
                      <div key={player.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{player.name}</span>
                          <span className="text-[10px] font-mono text-neutral-400">{player.role}</span>
                          {player.isOverseas && (
                            <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-bold">
                              OS
                            </span>
                          )}
                          {player.isAssociateNation && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-bold">
                              ASSOC
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {xiEntry ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleCaptain(key, player.id)}
                                className={`px-2 py-0.5 rounded font-black font-mono text-[10px] ${
                                  xiEntry.isCaptain ? "bg-amber-400 text-black" : "bg-white/5 text-neutral-400"
                                }`}
                              >
                                C
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleKeeper(key, player.id)}
                                className={`px-2 py-0.5 rounded font-black font-mono text-[10px] ${
                                  xiEntry.isWicketKeeper ? "bg-blue-400 text-black" : "bg-white/5 text-neutral-400"
                                }`}
                              >
                                WK
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePlayer(key, player.id, "XI")}
                                className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                              >
                                In XI &times;
                              </button>
                            </>
                          ) : isSub ? (
                            <button
                              type="button"
                              onClick={() => handleTogglePlayer(key, player.id, "SUB")}
                              className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold"
                            >
                              Sub &times;
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTogglePlayer(key, player.id, "XI")}
                                disabled={xi.length >= 11}
                                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 disabled:opacity-30"
                              >
                                + XI
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePlayer(key, player.id, "SUB")}
                                disabled={subs.length >= 5}
                                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 disabled:opacity-30"
                              >
                                + Sub
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
