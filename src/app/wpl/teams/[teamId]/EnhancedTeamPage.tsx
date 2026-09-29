'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  MapPin, 
  Users, 
  Shield, 
  Flame, 
  ArrowLeft, 
  Search, 
  Sparkles, 
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/data';
import type { Team, Player, Match } from '@/types';

// Helper to normalize and cross-match team identifiers (rcb-w, rcb, 12, team12)
const getTeamVariations = (team: any, paramId: string): string[] => {
  const set = new Set<string>();
  const add = (val: any) => {
    if (!val) return;
    const s = String(val).toLowerCase().trim();
    if (!s) return;
    set.add(s);
    set.add(s.replace(/^team/i, ''));
    set.add(s.replace(/-w$/i, ''));
    set.add(`${s}-w`);
  };

  add(paramId);
  if (team) {
    add(team.id);
    add(team.shortName);
    add(team.name);
  }
  return Array.from(set);
};

interface Props {
  teamId: string;
}

export default function EnhancedWPLTeamPage({ teamId }: Props) {
  const [team, setTeam] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'batsman' | 'bowler' | 'all-rounder' | 'wicketkeeper'>('all');
  const [activeTab, setActiveTab] = useState<'squad' | 'schedule' | 'history'>('squad');

  useEffect(() => {
    let isMounted = true;

    async function loadTeamData() {
      setLoading(true);
      try {
        const [teamsData, playersData, matchesData] = await Promise.all([
          api.getTeams('wpl').catch(() => []),
          api.getPlayers(undefined, 'wpl').catch(() => []),
          api.getMatches('wpl').catch(() => [])
        ]);

        if (!isMounted) return;
        setAllTeams(teamsData);

        const targetVariants = getTeamVariations(null, teamId);
        
        // Find matching team
        const found = teamsData.find((t: Team) => {
          const tVars = getTeamVariations(t, '');
          return targetVariants.some(v => tVars.includes(v));
        });

        if (found) {
          setTeam(found);
          const fullVariants = getTeamVariations(found, teamId);

          // Bulletproof player matching
          const squad = playersData.filter((p: Player) => {
            const pTeamId = String(p.teamId || '').toLowerCase().trim();
            const pTeamNum = pTeamId.replace(/^team/i, '');
            return fullVariants.some(v => v === pTeamId || v === pTeamNum);
          });
          setPlayers(squad);

          // Matches matching
          const teamMatches = matchesData.filter((m: Match) => {
            const t1Id = typeof m.team1 === 'object' ? String((m.team1 as any)?.id) : String(m.team1 || '');
            const t2Id = typeof m.team2 === 'object' ? String((m.team2 as any)?.id) : String(m.team2 || '');
            return fullVariants.some(v => v === t1Id.toLowerCase() || v === t2Id.toLowerCase());
          });
          setMatches(teamMatches);
        }
      } catch (err) {
        console.error('Error loading WPL team page:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTeamData();
    return () => { isMounted = false; };
  }, [teamId]);

  // Filtered Squad
  const filteredSquad = useMemo(() => {
    return players.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const role = (p.role || '').toLowerCase();
      let roleMatch = true;
      if (selectedRole === 'batsman') roleMatch = role.includes('bat') && !role.includes('all');
      else if (selectedRole === 'bowler') roleMatch = role.includes('bowl') && !role.includes('all');
      else if (selectedRole === 'all-rounder') roleMatch = role.includes('all') || role.includes('rounder');
      else if (selectedRole === 'wicketkeeper') roleMatch = role.includes('keeper') || role.includes('wk');
      return nameMatch && roleMatch;
    });
  }, [players, searchQuery, selectedRole]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060814] text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin mb-4" />
          <p className="text-gray-400 font-medium">Loading franchise roster...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#060814] text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-28 text-center">
          <Shield className="w-16 h-16 mx-auto text-pink-500 mb-4 opacity-80" />
          <h1 className="text-3xl font-black">Team Not Found</h1>
          <p className="mt-2 text-gray-400">The requested WPL franchise could not be located.</p>
          <Link
            href="/wpl/teams"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to WPL Teams
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060814] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Franchise Hero Banner */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-purple-950/40 via-slate-950/80 to-[#060814] pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mb-6">
              <Link href="/wpl" className="hover:text-pink-400 transition-colors">WPL</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/wpl/teams" className="hover:text-pink-400 transition-colors">Teams</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white font-bold">{team.name}</span>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Team Logo Badge */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white/[0.04] border border-white/10 p-6 flex items-center justify-center shrink-0 shadow-2xl backdrop-blur-xl">
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
                  />
                ) : (
                  <Shield className="w-20 h-20 text-pink-400" />
                )}
                <span className="absolute -bottom-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500 text-white shadow-lg">
                  WPL 2027
                </span>
              </div>

              {/* Team Identity Details */}
              <div className="flex-1 text-center md:text-left space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 text-pink-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> {team.shortName || 'WPL'} Franchise Hub
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  {team.name}
                </h1>

                <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">
                  {team.description || `${team.name} competing in the Women's Premier League 2027 season.`}
                </p>

                {/* Quick Meta Chips */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  {team.homeVenue && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-gray-300">
                      <MapPin className="w-3.5 h-3.5 text-pink-400" />
                      <span>{team.homeVenue}</span>
                    </div>
                  )}
                  {team.captain && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-gray-300">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Captain: <strong>{team.captain}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-gray-300">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Squad: <strong>{players.length} Players</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-10 border-b border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('squad')}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'squad'
                    ? 'border-pink-500 text-pink-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                2027 Squad Roster ({players.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'schedule'
                    ? 'border-pink-500 text-pink-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Fixtures & Results ({matches.length})
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Tab Body */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {activeTab === 'squad' ? (
            <div>
              {/* Search & Role Filters */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                {/* Search Box */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search player by name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>

                {/* Role Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {(['all', 'batsman', 'all-rounder', 'bowler', 'wicketkeeper'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        selectedRole === role
                          ? 'bg-pink-600 text-white shadow-md'
                          : 'bg-white/[0.05] text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Squad Grid */}
              {filteredSquad.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <Users className="w-12 h-12 mx-auto text-gray-500 mb-3" />
                  <h3 className="text-lg font-bold text-white">No players found</h3>
                  <p className="text-sm text-gray-400 mt-1">Try resetting your filters or search query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredSquad.map((player) => (
                    <div
                      key={player.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 hover:border-pink-500/50 hover:shadow-[0_8px_30px_rgba(236,72,153,0.18)] transition-all duration-300"
                    >
                      {/* Player Image / Silhouette */}
                      <div className="relative h-44 w-full rounded-xl bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center overflow-hidden mb-4 border border-white/5">
                        {player.image ? (
                          <img
                            src={player.image}
                            alt={player.name}
                            className="max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <Users className="w-16 h-16 text-white/30 mb-8" />
                        )}
                        {player.country && (
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/60 text-gray-200 border border-white/10 backdrop-blur-md">
                            {player.country}
                          </span>
                        )}
                      </div>

                      {/* Player Meta */}
                      <div className="space-y-1.5">
                        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-pink-400">
                          {player.role || 'Player'}
                        </span>
                        <h4 className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-1">
                          {player.name}
                        </h4>
                      </div>

                      {/* Quick Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
                        <div className="bg-black/30 rounded-lg p-2">
                          <span className="block text-xs font-black text-white">
                            {player.stats?.runs ?? (player as any).runs ?? 0}
                          </span>
                          <span className="block text-[10px] text-gray-400 uppercase">Runs</span>
                        </div>
                        <div className="bg-black/30 rounded-lg p-2">
                          <span className="block text-xs font-black text-white">
                            {player.stats?.wickets ?? (player as any).wickets ?? 0}
                          </span>
                          <span className="block text-[10px] text-gray-400 uppercase">Wkts</span>
                        </div>
                        <div className="bg-black/30 rounded-lg p-2">
                          <span className="block text-xs font-black text-white">
                            {player.stats?.matches ?? (player as any).matches ?? 0}
                          </span>
                          <span className="block text-[10px] text-gray-400 uppercase">Mat</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Fixtures & Results Tab */
            <div className="space-y-4">
              {matches.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <Calendar className="w-12 h-12 mx-auto text-gray-500 mb-3" />
                  <h3 className="text-lg font-bold text-white">No fixtures available</h3>
                  <p className="text-sm text-gray-400 mt-1">2027 season fixtures will appear here once announced by the BCCI.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {matches.map((m) => {
                    const opponent = typeof m.team1 === 'object' && (m.team1 as any)?.name === team.name 
                      ? (typeof m.team2 === 'object' ? (m.team2 as any)?.name : m.team2) 
                      : (typeof m.team1 === 'object' ? (m.team1 as any)?.name : m.team1);

                    return (
                      <div
                        key={m.id}
                        className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/[0.04] gap-4 hover:border-white/20 transition-all"
                      >
                        <div className="space-y-1 text-center sm:text-left">
                          <div className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                            {m.venue || 'Venue TBA'} • {new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-base font-extrabold text-white">
                            vs {opponent}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-gray-300">
                            {m.status?.toUpperCase() || 'SCHEDULED'}
                          </span>
                          {m.result && (
                            <span className="text-xs text-amber-300 font-medium">
                              {m.result}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
