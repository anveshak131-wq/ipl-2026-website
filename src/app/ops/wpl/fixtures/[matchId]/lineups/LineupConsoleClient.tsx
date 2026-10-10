"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, CheckCircle2, AlertTriangle, Users, Trophy, Calendar } from "lucide-react";
import { WplMatch } from "@/types/match";

const STORAGE_KEY = "wpl_matches_fixtures_v2027";

export default function LineupConsoleClient({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<WplMatch | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const matches: WplMatch[] = JSON.parse(saved);
        const found = matches.find((m) => m.id === matchId);
        if (found) setMatch(found);
      }
    } catch (e) {
      console.error("Error reading fixtures:", e);
    }
    setIsLoaded(true);
  }, [matchId]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#07080E] flex items-center justify-center text-neutral-400 font-mono text-xs">
        Loading Match Console...
      </div>
    );
  }

  // If match has not been scheduled yet for 2027
  if (!match || !match.teamAId || !match.teamBId) {
    return (
      <div className="min-h-screen bg-[#07080E] text-neutral-100 p-6 md:p-10 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            href="/ops/wpl/matches"
            className="inline-flex items-center space-x-2 text-xs font-mono text-purple-400 hover:text-purple-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Matches & Fixtures</span>
          </Link>

          <div className="p-12 rounded-3xl border border-dashed border-white/10 bg-[#0E101D]/60 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">No Match Scheduled ({matchId})</h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Past season data has been cleared. Official squads and lineups will be configured once the BCCI announces the WPL 2027 schedule and franchises submit their Playing XI.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/ops/wpl/matches"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
              >
                <span>Go to Fixtures Management</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080E] text-neutral-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          href="/ops/wpl/matches"
          className="inline-flex items-center space-x-2 text-xs font-mono text-purple-400 hover:text-purple-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Matches</span>
        </Link>

        <header className="border-b border-white/10 pb-6">
          <div className="text-xs font-mono text-purple-400 uppercase font-semibold">
            Matchday Console &bull; {matchId}
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Toss & Lineup Verification</h1>
        </header>

        <div className="p-8 rounded-2xl bg-[#0E101D] border border-white/10 text-center space-y-3">
          <p className="text-sm font-semibold text-neutral-300">
            Match #{match.matchNumber}: {match.teamAId.toUpperCase()} vs {match.teamBId.toUpperCase()}
          </p>
          <p className="text-xs text-neutral-500">
            Awaiting official toss submission and playing 11 confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}
