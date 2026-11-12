'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar'
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Trophy,
  Filter,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

export interface WplMatch {
  id: string;
  matchNumber: number;
  dayNumber?: number;
  dayOfWeek: string;
  date: string;
  displayDate: string;
  time: string;
  homeTeam: string;
  homeTeamId: string;
  homeShort: string;
  awayTeam: string;
  awayTeamId: string;
  awayShort: string;
  venue: string;
  stage: 'League' | 'Eliminator' | 'Final';
  status: 'upcoming' | 'live' | 'completed' | 'abandoned';
  result?: string;
  league: 'wpl';
}

const STORAGE_KEY = 'sportsup99_wpl_matches_v1';

const TEAM_METAS: Record<string, { short: string; color: string; border: string; bg: string }> = {
  'Royal Challengers Bengaluru': { short: 'RCB', color: '#EF4444', border: 'border-red-500/40', bg: 'bg-red-500/10' },
  'Mumbai Indians': { short: 'MI', color: '#3B82F6', border: 'border-blue-500/40', bg: 'bg-blue-500/10' },
  'Delhi Capitals': { short: 'DC', color: '#0EA5E9', border: 'border-sky-500/40', bg: 'bg-sky-500/10' },
  'Gujarat Giants': { short: 'GG', color: '#F97316', border: 'border-orange-500/40', bg: 'bg-orange-500/10' },
  'UP Warriorz': { short: 'UPW', color: '#A855F7', border: 'border-purple-500/40', bg: 'bg-purple-500/10' },
  'TBD': { short: 'TBD', color: '#94A3B8', border: 'border-slate-700', bg: 'bg-slate-800' }
};

function getTeamMeta(teamName: string) {
  for (const [key, meta] of Object.entries(TEAM_METAS)) {
    if ((teamName || '').toLowerCase().includes(key.toLowerCase())) return meta;
  }
  return TEAM_METAS['TBD'];
}

const OFFICIAL_WPL_2027_SCHEDULE: WplMatch[] = [
  { id: 'wpl-2027-m01', matchNumber: 1, dayNumber: 1, dayOfWeek: 'Thu', date: '2027-01-14', displayDate: '14 Jan 2027', time: '7:30 PM', homeTeam: 'Royal Challengers Bengaluru', homeTeamId: '14', homeShort: 'RCB', awayTeam: 'Mumbai Indians', awayTeamId: '13', awayShort: 'MI', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m02', matchNumber: 2, dayNumber: 2, dayOfWeek: 'Fri', date: '2027-01-15', displayDate: '15 Jan 2027', time: '7:30 PM', homeTeam: 'Gujarat Giants', homeTeamId: '12', homeShort: 'GG', awayTeam: 'UP Warriorz', awayTeamId: '15', awayShort: 'UPW', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m03', matchNumber: 3, dayNumber: 3, dayOfWeek: 'Sat', date: '2027-01-16', displayDate: '16 Jan 2027', time: '7:30 PM', homeTeam: 'Delhi Capitals', homeTeamId: '11', homeShort: 'DC', awayTeam: 'Royal Challengers Bengaluru', awayTeamId: '14', awayShort: 'RCB', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m04', matchNumber: 4, dayNumber: 4, dayOfWeek: 'Sun', date: '2027-01-17', displayDate: '17 Jan 2027', time: '7:30 PM', homeTeam: 'UP Warriorz', homeTeamId: '15', homeShort: 'UPW', awayTeam: 'Mumbai Indians', awayTeamId: '13', awayShort: 'MI', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m05', matchNumber: 5, dayNumber: 5, dayOfWeek: 'Mon', date: '2027-01-18', displayDate: '18 Jan 2027', time: '7:30 PM', homeTeam: 'Gujarat Giants', homeTeamId: '12', homeShort: 'GG', awayTeam: 'Delhi Capitals', awayTeamId: '11', awayShort: 'DC', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m06', matchNumber: 6, dayNumber: 6, dayOfWeek: 'Tue', date: '2027-01-19', displayDate: '19 Jan 2027', time: '7:30 PM', homeTeam: 'Royal Challengers Bengaluru', homeTeamId: '14', homeShort: 'RCB', awayTeam: 'UP Warriorz', awayTeamId: '15', awayShort: 'UPW', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m07', matchNumber: 7, dayNumber: 7, dayOfWeek: 'Wed', date: '2027-01-20', displayDate: '20 Jan 2027', time: '7:30 PM', homeTeam: 'Gujarat Giants', homeTeamId: '12', homeShort: 'GG', awayTeam: 'Mumbai Indians', awayTeamId: '13', awayShort: 'MI', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m08', matchNumber: 8, dayNumber: 8, dayOfWeek: 'Thu', date: '2027-01-21', displayDate: '21 Jan 2027', time: '7:30 PM', homeTeam: 'UP Warriorz', homeTeamId: '15', homeShort: 'UPW', awayTeam: 'Delhi Capitals', awayTeamId: '11', awayShort: 'DC', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m09', matchNumber: 9, dayNumber: 9, dayOfWeek: 'Fri', date: '2027-01-22', displayDate: '22 Jan 2027', time: '7:30 PM', homeTeam: 'Gujarat Giants', homeTeamId: '12', homeShort: 'GG', awayTeam: 'Royal Challengers Bengaluru', awayTeamId: '14', awayShort: 'RCB', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m10', matchNumber: 10, dayNumber: 10, dayOfWeek: 'Sat', date: '2027-01-23', displayDate: '23 Jan 2027', time: '7:30 PM', homeTeam: 'Delhi Capitals', homeTeamId: '11', homeShort: 'DC', awayTeam: 'Mumbai Indians', awayTeamId: '13', awayShort: 'MI', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m11', matchNumber: 11, dayNumber: 11, dayOfWeek: 'Sun', date: '2027-01-24', displayDate: '24 Jan 2027', time: '7:30 PM', homeTeam: 'UP Warriorz', homeTeamId: '15', homeShort: 'UPW', awayTeam: 'Gujarat Giants', awayTeamId: '12', awayShort: 'GG', venue: 'Vadodara', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m12', matchNumber: 12, dayNumber: 13, dayOfWeek: 'Tue', date: '2027-01-26', displayDate: '26 Jan 2027', time: '7:30 PM', homeTeam: 'Mumbai Indians', homeTeamId: '13', homeShort: 'MI', awayTeam: 'Royal Challengers Bengaluru', awayTeamId: '14', awayShort: 'RCB', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m13', matchNumber: 13, dayNumber: 14, dayOfWeek: 'Wed', date: '2027-01-27', displayDate: '27 Jan 2027', time: '7:30 PM', homeTeam: 'Delhi Capitals', homeTeamId: '11', homeShort: 'DC', awayTeam: 'Gujarat Giants', awayTeamId: '12', awayShort: 'GG', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m14', matchNumber: 14, dayNumber: 15, dayOfWeek: 'Thu', date: '2027-01-28', displayDate: '28 Jan 2027', time: '7:30 PM', homeTeam: 'Mumbai Indians', homeTeamId: '13', homeShort: 'MI', awayTeam: 'UP Warriorz', awayTeamId: '15', awayShort: 'UPW', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m15', matchNumber: 15, dayNumber: 16, dayOfWeek: 'Fri', date: '2027-01-29', displayDate: '29 Jan 2027', time: '7:30 PM', homeTeam: 'Royal Challengers Bengaluru', homeTeamId: '14', homeShort: 'RCB', awayTeam: 'Delhi Capitals', awayTeamId: '11', awayShort: 'DC', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m16', matchNumber: 16, dayNumber: 17, dayOfWeek: 'Sat', date: '2027-01-30', displayDate: '30 Jan 2027', time: '7:30 PM', homeTeam: 'Mumbai Indians', homeTeamId: '13', homeShort: 'MI', awayTeam: 'Gujarat Giants', awayTeamId: '12', awayShort: 'GG', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m17', matchNumber: 17, dayNumber: 18, dayOfWeek: 'Sun', date: '2027-01-31', displayDate: '31 Jan 2027', time: '7:30 PM', homeTeam: 'UP Warriorz', homeTeamId: '15', homeShort: 'UPW', awayTeam: 'Royal Challengers Bengaluru', awayTeamId: '14', awayShort: 'RCB', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m18', matchNumber: 18, dayNumber: 19, dayOfWeek: 'Mon', date: '2027-02-01', displayDate: '01 Feb 2027', time: '7:30 PM', homeTeam: 'Mumbai Indians', homeTeamId: '13', homeShort: 'MI', awayTeam: 'Delhi Capitals', awayTeamId: '11', awayShort: 'DC', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m19', matchNumber: 19, dayNumber: 20, dayOfWeek: 'Tue', date: '2027-02-02', displayDate: '02 Feb 2027', time: '7:30 PM', homeTeam: 'Royal Challengers Bengaluru', homeTeamId: '14', homeShort: 'RCB', awayTeam: 'Gujarat Giants', awayTeamId: '12', awayShort: 'GG', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m20', matchNumber: 20, dayNumber: 21, dayOfWeek: 'Wed', date: '2027-02-03', displayDate: '03 Feb 2027', time: '7:30 PM', homeTeam: 'Delhi Capitals', homeTeamId: '11', homeShort: 'DC', awayTeam: 'UP Warriorz', awayTeamId: '15', awayShort: 'UPW', venue: 'Mumbai - CCI', stage: 'League', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m21', matchNumber: 21, dayNumber: 23, dayOfWeek: 'Fri', date: '2027-02-05', displayDate: '05 Feb 2027', time: '7:30 PM', homeTeam: 'TBD (Eliminator Team 1)', homeTeamId: 'tbd', homeShort: 'TBD', awayTeam: 'TBD (Eliminator Team 2)', awayTeamId: 'tbd', awayShort: 'TBD', venue: 'Mumbai - CCI', stage: 'Eliminator', status: 'upcoming', league: 'wpl' },
  { id: 'wpl-2027-m22', matchNumber: 22, dayNumber: 25, dayOfWeek: 'Sun', date: '2027-02-07', displayDate: '07 Feb 2027', time: '7:30 PM', homeTeam: 'Table Topper (TBD)', homeTeamId: 'tbd', homeShort: 'TBD', awayTeam: 'Eliminator Winner (TBD)', awayTeamId: 'tbd', awayShort: 'TBD', venue: 'Mumbai - CCI', stage: 'Final', status: 'upcoming', league: 'wpl' }
];

export default function WplPublicMatchesPage() {
  const [matches, setMatches] = useState<WplMatch[]>(OFFICIAL_WPL_2027_SCHEDULE);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [venueFilter, setVenueFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');

  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMatches(parsed);
        }
      }
    } catch (e) {}

    fetch('/api/matches?league=wpl&_t=' + Date.now())
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMatches(data);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, []);

  const resetFilters = () => {
    setSearchQuery('');
    setVenueFilter('ALL');
    setStageFilter('ALL');
    setTeamFilter('ALL');
  };

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

    const matchTeam =
      teamFilter === 'ALL' ||
      (m.homeTeam || '').toLowerCase().includes(teamFilter.toLowerCase()) ||
      (m.awayTeam || '').toLowerCase().includes(teamFilter.toLowerCase()) ||
      (m.homeShort || '').toUpperCase() === teamFilter ||
      (m.awayShort || '').toUpperCase() === teamFilter;

    return matchSearch && matchVenue && matchStage && matchTeam;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-950/60 via-slate-950 to-slate-950 border-b border-slate-800/80 py-10 md:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99, 102, 241,0.15),rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold tracking-wide uppercase">
            <Trophy className="w-3.5 h-3.5" />
            Official Tournament Fixtures
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            TATA WPL 2027 Match Schedule
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm md:text-base">
            22 Matches • Vadodara &amp; Mumbai - CCI • 14 Jan – 07 Feb 2027 • All Evening Fixtures at 7:30 PM IST
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 font-medium">
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              Vadodara: Matches 1–11
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              Mumbai - CCI: Matches 12–20
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300">
              Playoffs: 05 &amp; 07 Feb 2027
            </span>
          </div>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by team (RCB, MI, DC, GG, UPW), date, or venue..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'ALL', label: 'All Venues' },
                { key: 'VADODARA', label: 'Vadodara' },
                { key: 'MUMBAI', label: 'Mumbai - CCI' }
              ].map((vf) => (
                <button
                  key={vf.key}
                  type="button"
                  onClick={() => setVenueFilter(vf.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    venueFilter === vf.key
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {vf.label}
                </button>
              ))}

              {[
                { key: 'ALL', label: 'All Stages' },
                { key: 'LEAGUE', label: 'League' },
                { key: 'ELIMINATOR', label: 'Eliminator' },
                { key: 'FINAL', label: 'Final' }
              ].map((sf) => (
                <button
                  key={sf.key}
                  type="button"
                  onClick={() => setStageFilter(sf.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    stageFilter === sf.key
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {sf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-400" /> Filter Team:
            </span>
            {['ALL', 'RCB', 'MI', 'DC', 'GG', 'UPW'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTeamFilter(t)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  teamFilter === t
                    ? 'bg-white text-slate-950 shadow'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}

            {(searchQuery || venueFilter !== 'ALL' || stageFilter !== 'ALL' || teamFilter !== 'ALL') && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Fixture Cards */}
        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <p className="text-slate-400 text-sm">No matches found matching your selected filters.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((match) => {
              const homeMeta = getTeamMeta(match.homeTeam);
              const awayMeta = getTeamMeta(match.awayTeam);

              return (
                <div
                  key={match.id}
                  className={`rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl overflow-hidden flex flex-col justify-between ${
                    match.stage === 'Final'
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/50 hover:border-amber-400'
                      : match.stage === 'Eliminator'
                      ? 'bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border-purple-500/50 hover:border-purple-400'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-indigo-400">
                        #{match.matchNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          match.stage === 'Final'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : match.stage === 'Eliminator'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {match.stage}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{match.displayDate}</span>
                      <span className="text-slate-500">({match.dayOfWeek})</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white border ${homeMeta.bg} ${homeMeta.border}`}
                          style={{ borderColor: homeMeta.color }}
                        >
                          {match.homeShort || homeMeta.short}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-white leading-tight">
                            {match.homeTeam}
                          </div>
                          <div className="text-[11px] text-slate-400">Home</div>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-center justify-center my-1">
                      <div className="w-full border-t border-slate-800" />
                      <span className="absolute px-2 bg-slate-900 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                        VS
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white border ${awayMeta.bg} ${awayMeta.border}`}
                          style={{ borderColor: awayMeta.color }}
                        >
                          {match.awayShort || awayMeta.short}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-white leading-tight">
                            {match.awayTeam}
                          </div>
                          <div className="text-[11px] text-slate-400">Away</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{match.time} IST</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-cyan-300 font-medium text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{match.venue}</span>
                      </div>
                    </div>

                    <Link
                      href={`/wpl/matches/${match.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white font-semibold flex items-center gap-1 transition-colors"
                    >
                      Match Center
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2027 Women&apos;s Premier League (WPL). All Rights Reserved.</p>
          <p>Official Schedule extracted from BCCI TATA WPL 2027 release.</p>
        </div>
      </footer>
    </div>
  );
}
