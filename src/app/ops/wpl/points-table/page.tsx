"use client";

import React, { useMemo } from "react";
import { Trophy, ShieldCheck, Activity, Award } from "lucide-react";
import { calculateWplStandings } from "@/lib/standings-engine";
import { WPL_TEAMS } from "../matches/page";

export default function WplPointsTablePage() {
  const completedResults = useMemo(() => [], []);
  const standings = useMemo(() => {
    return calculateWplStandings(WPL_TEAMS, completedResults);
  }, [completedResults]);

  // Total league matches completed across all franchises
  const totalMatchesPlayed = useMemo(() => {
    return standings.reduce((acc, t) => acc + t.played, 0) / 2;
  }, [standings]);

  const isSeasonStarted = totalMatchesPlayed > 0;
  const isLeagueStageFinished = totalMatchesPlayed >= 20;

  // Determine official tournament status badge based on league progress
  const getTeamStatus = (rank: number, played: number) => {
    if (!isSeasonStarted || played === 0) {
      return { label: "—", className: "text-neutral-500 font-mono" };
    }

    if (isLeagueStageFinished) {
      if (rank === 1) {
        return {
          label: "Final",
          className: "text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-full font-bold",
        };
      }
      if (rank <= 3) {
        return {
          label: "Eliminator",
          className: "text-[10px] bg-purple-400/20 text-purple-300 border border-purple-400/30 px-2.5 py-1 rounded-full font-bold",
        };
      }
      return {
        label: "Eliminated",
        className: "text-[10px] bg-neutral-800 text-neutral-400 border border-white/10 px-2.5 py-1 rounded-full font-medium",
      };
    }

    // Mid-season state
    return {
      label: "In Contention",
      className: "text-[10px] text-neutral-400 font-mono",
    };
  };

  return (
    <div className="min-h-screen bg-[#07080E] text-neutral-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono uppercase text-purple-400 font-bold">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>WPL 2027 Tournament Standings</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
              Points Table & Net Run Rate Hub
            </h1>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>BCCI Rule 16.10 Enforced</span>
          </div>
        </header>

        {/* Tournament Rules / Qualification Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111322] border border-amber-500/20 p-5 rounded-2xl">
            <div className="text-xs font-mono text-amber-400 font-bold uppercase">Rank 1 Pathway</div>
            <div className="text-lg font-bold text-white mt-1">Direct Entry to Final</div>
            <p className="text-xs text-neutral-400 mt-1">Conferred upon completion of Match 20</p>
          </div>
          <div className="bg-[#111322] border border-purple-500/20 p-5 rounded-2xl">
            <div className="text-xs font-mono text-purple-400 font-bold uppercase">Rank 2 & 3 Pathway</div>
            <div className="text-lg font-bold text-white mt-1">Eliminator Qualification</div>
            <p className="text-xs text-neutral-400 mt-1">Conferred upon completion of Match 20</p>
          </div>
          <div className="bg-[#111322] border border-white/10 p-5 rounded-2xl">
            <div className="text-xs font-mono text-neutral-400 font-bold uppercase">Tiebreaker Protocol</div>
            <div className="text-lg font-bold text-white mt-1">Pts &gt; Wins &gt; NRR &gt; H2H</div>
            <p className="text-xs text-neutral-400 mt-1">All-out innings counted as 20.0 overs</p>
          </div>
        </div>

        {/* Official Standings Table */}
        <div className="rounded-2xl border border-white/10 bg-[#0E101D]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono uppercase text-neutral-400">
                <th className="py-4 px-5">Pos</th>
                <th className="py-4 px-5">Franchise</th>
                <th className="py-4 px-5 text-center">Played</th>
                <th className="py-4 px-5 text-center">Won</th>
                <th className="py-4 px-5 text-center">Lost</th>
                <th className="py-4 px-5 text-center">NR</th>
                <th className="py-4 px-5 text-right">Pts</th>
                <th className="py-4 px-5 text-right">NRR</th>
                <th className="py-4 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {standings.map((team) => {
                const status = getTeamStatus(team.rank, team.played);

                return (
                  <tr key={team.teamId} className="hover:bg-white/5 transition">
                    <td className="py-4 px-5 font-mono font-bold">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs bg-white/5 text-neutral-400">
                        {team.rank}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-white">
                      {team.teamName} <span className="text-xs text-neutral-400 font-normal">({team.shortName})</span>
                    </td>
                    <td className="py-4 px-5 text-center font-mono">{team.played}</td>
                    <td className="py-4 px-5 text-center font-mono text-emerald-400 font-semibold">{team.won}</td>
                    <td className="py-4 px-5 text-center font-mono text-rose-400 font-semibold">{team.lost}</td>
                    <td className="py-4 px-5 text-center font-mono text-neutral-400">{team.tiedOrNoResult}</td>
                    <td className="py-4 px-5 text-right font-mono font-black text-white text-base">{team.points}</td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-neutral-300">
                      {team.nrr > 0 ? "+" + team.nrr.toFixed(3) : team.nrr.toFixed(3)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span className={status.className}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
