'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Search, Trophy, Filter } from 'lucide-react';
import { normalizeWplMatchItem } from '@/lib/data';

export default function WplPublicMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [venueFilter, setVenueFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  useEffect(() => {
    async function loadSchedules() {
      setLoading(true);
      try {
        // 1. Check admin matches storage cache
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('sportsup99_wpl_matches_v1');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMatches(parsed.map(normalizeWplMatchItem));
              setLoading(false);
            }
          }
        }

        // 2. Fetch live matches from admin API
        const res = await fetch('/api/matches?league=wpl&_t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const normalized = data.map(normalizeWplMatchItem);
            setMatches(normalized);
            if (typeof window !== 'undefined') {
              try { localStorage.setItem('sportsup99_wpl_matches_v1', JSON.stringify(normalized)); } catch (e) {}
            }
          }
        }
      } catch (err) {
        console.error('Error loading schedule:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSchedules();
  }, []);

  const filteredMatches = matches.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (m.homeTeam || '').toLowerCase().includes(q) ||
      (m.awayTeam || '').toLowerCase().includes(q) ||
      (m.venue || '').toLowerCase().includes(q) ||
      (m.displayDate || '').toLowerCase().includes(q) ||
      String(m.matchNumber).includes(q);

    const matchVenue =
      venueFilter === 'ALL' ||
      (venueFilter === 'VADODARA' && (m.venue || '').toLowerCase().includes('vadod')) ||
      (venueFilter === 'MUMBAI' && (m.venue || '').toLowerCase().includes('mumbai'));

    const matchStage =
      stageFilter === 'ALL' || (m.stage || 'League').toUpperCase() === stageFilter;

    return matchSearch && matchVenue && matchStage;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-pink-950/60 border border-pink-500/20 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold mb-3">
            <Trophy className="w-3.5 h-3.5" />
            TATA WPL 2027 OFFICIAL FIXTURES
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            WPL 2027 Match Schedule
          </h1>
          <p className="text-sm md:text-base text-slate-300 mt-2 max-w-3xl">
            Live tournament schedule synchronized directly from official BCCI/WPL squad operations desk. 22 T20 matches across Vadodara and Mumbai (CCI).
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by team (RCB, MI, GG, UPW, DC), date, or venue..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'VADODARA', 'MUMBAI'] as const).map((vf) => (
              <button
                key={vf}
                type="button"
                onClick={() => setVenueFilter(vf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  venueFilter === vf
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {vf === 'ALL' ? 'All Venues' : vf === 'VADODARA' ? 'Vadodara' : 'Mumbai - CCI'}
              </button>
            ))}

            {(['ALL', 'LEAGUE', 'ELIMINATOR', 'FINAL'] as const).map((sf) => (
              <button
                key={sf}
                type="button"
                onClick={() => setStageFilter(sf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  stageFilter === sf
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sf === 'ALL' ? 'All Stages' : sf}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule List */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading live schedule...</div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No matching fixtures found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-pink-500/40 transition-all flex flex-col justify-between gap-4 shadow-lg"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300 font-bold text-xs">
                      Match #{match.matchNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {match.dayOfWeek}, {match.displayDate}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    match.stage === 'Final'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : match.stage === 'Eliminator'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {match.stage}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex-1 text-center font-bold text-base text-white">
                    {match.homeTeam}
                  </div>
                  <div className="px-3 text-xs font-extrabold text-pink-400">VS</div>
                  <div className="flex-1 text-center font-bold text-base text-white">
                    {match.awayTeam}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1.5 text-cyan-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {match.venue}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-amber-300 font-semibold">
                    <Clock className="w-3 h-3" />
                    {match.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
