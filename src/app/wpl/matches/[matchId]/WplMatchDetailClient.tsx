'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, ArrowLeft, Trophy, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function WplMatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.matchId ? String(params.matchId) : '';

  const [match, setMatch] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMatch() {
      setLoading(true);
      try {
        let schedule: any[] = [];
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('sportsup99_wpl_matches_v1');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) schedule = parsed;
          }
        }

        if (schedule.length === 0) {
          const res = await fetch('/api/matches?league=wpl&_t=' + Date.now());
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) schedule = data;
          }
        }

        const found = schedule.find(
          (m: any) =>
            String(m.id).toLowerCase() === matchId.toLowerCase() ||
            String(m.matchNumber) === matchId ||
            `wpl-2027-m${String(m.matchNumber).padStart(2, '0')}` === matchId.toLowerCase()
        );

        if (found) {
          setMatch(found);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    loadMatch();
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-slate-400 text-sm">Loading match fixture from official schedule...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 gap-4">
        <div className="text-xl font-bold text-white">Match Not Found</div>
        <p className="text-sm text-slate-400">
          Fixture &quot;{matchId}&quot; is not registered in the official WPL schedule.
        </p>
        <Link
          href="/wpl/matches"
          className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Schedule
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/wpl/matches"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-pink-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Fixtures
        </Link>

        {/* Hero Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-pink-950/70 border border-pink-500/20 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 font-bold text-xs">
                Match #{match.matchNumber}
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                {match.stage} • TATA WPL 2027
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase">
              {match.status}
            </span>
          </div>

          {/* Teams Encounter */}
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-4">
            <div className="text-center md:text-left space-y-1">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Home Team</div>
              <div className="text-2xl font-black text-white">{match.homeTeam}</div>
              <div className="text-xs text-pink-400 font-bold">{match.homeShort}</div>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <span className="w-12 h-12 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 font-extrabold text-sm mb-2">
                VS
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-amber-300 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {match.time} IST
              </div>
            </div>

            <div className="text-center md:text-right space-y-1">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Away Team</div>
              <div className="text-2xl font-black text-white">{match.awayTeam}</div>
              <div className="text-xs text-cyan-400 font-bold">{match.awayShort}</div>
            </div>
          </div>

          {/* Logistics Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-400" />
              <span>{match.dayOfWeek}, {match.displayDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{match.venue}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official BCCI WPL Fixture</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
