'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, RefreshCw, Trash2, Edit2, Shield,
  ExternalLink, Sparkles, User, Check, X, ChevronDown, ChevronUp, BarChart2, RotateCcw
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  role: string;
  allrounderType?: string;
  teamId: string;
  team: string;
  league: string;
  isCaptain?: boolean;
  nationality: string;
  battingStyle: string;
  bowlingStyle: string;
  jerseyNumber?: string;
  age?: number | string;
  dateOfBirth?: string;
  squadStatus?: string;
  cricbuzzId?: string;
  cricbuzzUrl?: string;
  careerStats?: {
    batting?: Record<string, any>;
    bowling?: Record<string, any>;
  };
  auction?: {
    fee?: string;
    type?: string;
  };
}

const WPL_TEAMS = [
  { id: '14', slug: 'rcb-w', name: 'Royal Challengers Bengaluru', short: 'RCB-W', color: 'from-red-600/30 via-red-950/40 to-slate-950', border: 'border-red-500/40', badge: 'bg-red-500/20 text-red-300' },
  { id: '13', slug: 'mi-w', name: 'Mumbai Indians', short: 'MI-W', color: 'from-blue-600/30 via-blue-950/40 to-slate-950', border: 'border-blue-500/40', badge: 'bg-blue-500/20 text-blue-300' },
  { id: '11', slug: 'dc-w', name: 'Delhi Capitals', short: 'DC-W', color: 'from-indigo-600/30 via-indigo-950/40 to-slate-950', border: 'border-indigo-500/40', badge: 'bg-indigo-500/20 text-indigo-300' },
  { id: '12', slug: 'gg', name: 'Gujarat Giants', short: 'GG', color: 'from-amber-600/30 via-amber-950/40 to-slate-950', border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300' },
  { id: '15', slug: 'upw', name: 'UP Warriorz', short: 'UPW', color: 'from-yellow-500/30 via-purple-950/40 to-slate-950', border: 'border-yellow-500/40', badge: 'bg-yellow-500/20 text-yellow-300' }
];

function playerMatchesTeam(player: Player, team: typeof WPL_TEAMS[0]): boolean {
  const pId = String(player.id || '').toLowerCase();
  const pTeamId = String(player.teamId || '').toLowerCase().trim();
  const pTeam = String(player.team || '').toLowerCase().trim();

  if (team.slug === 'rcb-w' && (pId.includes('wpl_rcb') || pId.includes('wpl-rcb'))) return true;
  if (team.slug === 'mi-w' && (pId.includes('wpl_mi') || pId.includes('wpl-mi'))) return true;
  if (team.slug === 'dc-w' && (pId.includes('wpl_dc') || pId.includes('wpl-dc'))) return true;
  if (team.slug === 'gg' && (pId.includes('wpl_gg') || pId.includes('wpl-gg'))) return true;
  if (team.slug === 'upw' && (pId.includes('wpl_upw') || pId.includes('wpl-upw'))) return true;

  if (pTeamId === team.id || pTeamId === team.slug) return true;
  if (pTeam === team.name.toLowerCase() || pTeam === team.short.toLowerCase()) return true;

  return false;
}

export default function WplPlayersCleanOpsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('14');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealigning, setIsRealigning] = useState<boolean>(false);
  const [expandedStatsPlayerId, setExpandedStatsPlayerId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [cricbuzzUrlInput, setCricbuzzUrlInput] = useState<string>('');
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeSuccess, setScrapeSuccess] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'stats'>('profile');

  // Form State
  const [formData, setFormData] = useState<Partial<Player>>({
    name: '',
    role: 'All-rounder',
    allrounderType: 'Batting Allrounder',
    teamId: '14',
    team: 'Royal Challengers Bengaluru',
    league: 'wpl',
    nationality: 'India',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium-fast',
    jerseyNumber: 'N/A',
    age: 25,
    dateOfBirth: '',
    squadStatus: 'Active Squad',
    cricbuzzUrl: '',
    auction: { fee: '₹50 Lakh' },
    careerStats: { batting: {}, bowling: {} }
  });

  const loadPlayers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/players?league=wpl');
      if (res.ok) {
        const data = await res.json();
        setPlayers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load squad records', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleRealignSquads = async () => {
    if (!confirm('This will synchronize all 5 WPL franchise squads to their authentic official rosters. Continue?')) return;
    setIsRealigning(true);
    try {
      const res = await fetch('/api/players?league=wpl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'realign', league: 'wpl' })
      });
      const payload = await res.json();
      if (payload.success && Array.isArray(payload.players)) {
        setPlayers(payload.players);
        alert('✓ Squads successfully re-aligned to official franchise rosters!');
      } else {
        await loadPlayers();
      }
    } catch (e: any) {
      alert('Error realigning squads: ' + e.message);
    } finally {
      setIsRealigning(false);
    }
  };

  const activeTeam = useMemo(() => {
    return WPL_TEAMS.find((t) => t.id === selectedTeamId) || WPL_TEAMS[0];
  }, [selectedTeamId]);

  const teamPlayers = useMemo(() => {
    return players.filter((p) => {
      const belongs = playerMatchesTeam(p, activeTeam);
      if (!belongs) return false;

      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || p.role.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [players, activeTeam, searchQuery, roleFilter]);

  const handleOpenAddPlayer = () => {
    setEditingPlayer(null);
    setCricbuzzUrlInput('');
    setScrapeError(null);
    setScrapeSuccess(null);
    setActiveModalTab('profile');
    setFormData({
      name: '',
      role: 'All-rounder',
      allrounderType: 'Batting Allrounder',
      teamId: activeTeam.id,
      team: activeTeam.name,
      league: 'wpl',
      nationality: 'India',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium-fast',
      jerseyNumber: 'N/A',
      age: 25,
      dateOfBirth: '',
      squadStatus: 'Active Squad',
      cricbuzzUrl: '',
      auction: { fee: '₹50 Lakh' },
      careerStats: { batting: {}, bowling: {} }
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Player) => {
    setEditingPlayer(p);
    setCricbuzzUrlInput(p.cricbuzzUrl || '');
    setScrapeError(null);
    setScrapeSuccess(null);
    setActiveModalTab('profile');
    setFormData({
      ...p,
      teamId: p.teamId || activeTeam.id,
      team: p.team || activeTeam.name
    });
    setIsModalOpen(true);
  };

  const handleFetchCricbuzzData = async () => {
    const rawUrl = cricbuzzUrlInput.trim();
    if (!rawUrl) {
      setScrapeError('Please enter a valid Cricbuzz profile URL, ID, or player name');
      return;
    }

    setIsScraping(true);
    setScrapeError(null);
    setScrapeSuccess(null);

    try {
      const res = await fetch('/api/admin/scrape-cricbuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl })
      });

      const text = await res.text();
      let payload: any = {};
      try {
        payload = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('Invalid response from scraper');
      }

      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Scrape failed');
      }

      const bio = payload.bio || {};
      const stats = payload.data || { batting: {}, bowling: {} };

      setFormData((prev) => ({
        ...prev,
        cricbuzzUrl: payload.sourceUrl || rawUrl,
        cricbuzzId: payload.profileId || prev.cricbuzzId || '',
        name: bio.name || prev.name || '',
        dateOfBirth: bio.dateOfBirth || prev.dateOfBirth || '',
        age: bio.age ? Number(bio.age) : (prev.age || 25),
        nationality: bio.nationality || prev.nationality || 'India',
        role: bio.role || prev.role || 'All-rounder',
        allrounderType: bio.allrounderType || prev.allrounderType || 'Batting Allrounder',
        battingStyle: bio.battingStyle || prev.battingStyle || 'Right-hand bat',
        bowlingStyle: bio.bowlingStyle || prev.bowlingStyle || 'Right-arm medium-fast',
        careerStats: { batting: stats.batting || {}, bowling: stats.bowling || {} }
      }));

      const batCount = Object.keys(stats.batting || {}).length;
      const bowlCount = Object.keys(stats.bowling || {}).length;
      setScrapeSuccess(`✓ Successfully fetched ${bio.name || 'player'}: ${bio.nationality}, ${bio.role}, DOB: ${bio.dateOfBirth || '—'}, Stats (${batCount} Batting, ${bowlCount} Bowling formats)!`);
    } catch (err: any) {
      setScrapeError(err.message || 'Error communicating with Cricbuzz scraper');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSavePlayer = async () => {
    if (!formData.name) {
      alert('Player name is required. Please paste a Cricbuzz URL or enter a name.');
      return;
    }

    const assignedTeam = WPL_TEAMS.find((t) => t.id === formData.teamId || t.slug === formData.teamId) || activeTeam;

    const payload: Player = {
      id: editingPlayer?.id || (`wpl_${assignedTeam.slug.replace('-w', '')}_${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`),
      name: formData.name,
      teamId: assignedTeam.id,
      team: assignedTeam.name,
      league: 'wpl',
      role: formData.role || 'All-rounder',
      allrounderType: formData.allrounderType || (formData.role === 'All-rounder' ? 'Batting Allrounder' : undefined),
      nationality: formData.nationality || 'India',
      battingStyle: formData.battingStyle || 'Right-hand bat',
      bowlingStyle: formData.bowlingStyle || 'Right-arm medium-fast',
      jerseyNumber: formData.jerseyNumber || 'N/A',
      age: formData.age ? Number(formData.age) : 25,
      dateOfBirth: formData.dateOfBirth || '',
      squadStatus: formData.squadStatus || 'Active Squad',
      cricbuzzUrl: formData.cricbuzzUrl || '',
      cricbuzzId: formData.cricbuzzId || '',
      auction: formData.auction || { fee: '₹50 Lakh' },
      careerStats: formData.careerStats || { batting: {}, bowling: {} }
    };

    try {
      const res = await fetch('/api/players?league=wpl', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save player to server database');

      setPlayers((prev) => {
        const filtered = prev.filter((p) => p.id !== payload.id);
        return [...filtered, payload];
      });

      setIsModalOpen(false);
    } catch (e: any) {
      alert(e.message || 'Error saving player');
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to remove this player from the squad?')) return;

    try {
      await fetch('/api/players?id=' + playerId + '&league=wpl', { method: 'DELETE' });
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    } catch (e) {
      alert('Failed to delete player');
    }
  };

  // Get list of all available formats across batting and bowling
  const availableFormats = useMemo(() => {
    const batFmts = Object.keys(formData.careerStats?.batting || {});
    const bowlFmts = Object.keys(formData.careerStats?.bowling || {});
    const combined = Array.from(new Set(['Test', 'ODI', 'T20I', 'WPL', ...batFmts, ...bowlFmts]));
    return combined;
  }, [formData.careerStats]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Shield className="w-4 h-4" /> WPL Operations Desk
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-1">
              Squad & Player Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage squads and fetch player records dynamically from verified Cricbuzz profiles.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={handleRealignSquads}
              disabled={isRealigning}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all disabled:opacity-50"
              title="Fix and re-align all 5 franchise squads to official team rosters"
            >
              <RotateCcw className={'w-3.5 h-3.5 ' + (isRealigning ? 'animate-spin' : '')} />
              {isRealigning ? 'Re-aligning...' : 'Re-align Official Squads'}
            </button>
            <button
              onClick={handleOpenAddPlayer}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Player to {activeTeam.short}
            </button>
          </div>
        </div>

        {/* Team Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {WPL_TEAMS.map((team) => {
            const isSelected = team.id === selectedTeamId;
            const count = players.filter((p) => playerMatchesTeam(p, team)).length;

            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={'p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ' +
                  (isSelected
                    ? ('bg-gradient-to-br ' + team.color + ' ' + team.border + ' ring-2 ring-emerald-500/50 shadow-xl')
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700')
                }
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{team.short}</div>
                  <div className="text-sm font-extrabold text-white mt-0.5 truncate">{team.name}</div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={'text-[10px] font-bold px-2 py-0.5 rounded-md ' + team.badge}>
                    {count} Players
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Search & Role Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={'Search ' + activeTeam.short + ' players...'}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {['ALL', 'Batter', 'All-rounder', 'Bowler', 'Wicketkeeper'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ' +
                  (roleFilter === role
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent')
                }
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Squad Cards Grid */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
            Loading {activeTeam.short} Squad...
          </div>
        ) : teamPlayers.length === 0 ? (
          <div className="p-16 rounded-3xl bg-slate-900/30 border border-dashed border-slate-800 text-center">
            <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-300">No players assigned to {activeTeam.name}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click below or use "Re-align Official Squads" to populate this roster.
            </p>
            <button
              onClick={handleOpenAddPlayer}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Player to {activeTeam.short}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamPlayers.map((player) => {
              const isStatsExpanded = expandedStatsPlayerId === player.id;
              const batStats = player.careerStats?.batting || {};
              const bowlStats = player.careerStats?.bowling || {};
              const hasStats = Object.keys(batStats).length > 0 || Object.keys(bowlStats).length > 0;
              const cardFormats = Array.from(new Set(['Test', 'ODI', 'T20I', 'WPL', ...Object.keys(batStats), ...Object.keys(bowlStats)]));

              return (
                <div
                  key={player.id}
                  className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-base font-extrabold text-emerald-400">
                          {player.jerseyNumber && player.jerseyNumber !== 'N/A' ? ('#' + player.jerseyNumber) : player.name[0]}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                            {player.name}
                            {player.isCaptain && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black">C</span>
                            )}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-semibold text-slate-400">{player.nationality}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-[11px] text-slate-400">{player.age ? (player.age + ' yrs') : '—'}</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {player.role}
                      </span>
                    </div>

                    {/* Playing Styles */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Batting</span>
                        <span className="text-slate-300 font-medium truncate block">{player.battingStyle || 'Right-hand bat'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Bowling</span>
                        <span className="text-slate-300 font-medium truncate block">{player.bowlingStyle || '—'}</span>
                      </div>
                    </div>

                    {/* Stats Highlights Header */}
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setExpandedStatsPlayerId(isStatsExpanded ? null : player.id)}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>{hasStats ? 'Career Stats Table' : 'No stats recorded'}</span>
                        {isStatsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <span className="text-[10px] text-slate-400 font-medium">
                        {(batStats['WPL']?.Runs || batStats['T20I']?.Runs || 0) + ' runs · ' + (bowlStats['WPL']?.Wkts || bowlStats['T20I']?.Wkts || 0) + ' wkts'}
                      </span>
                    </div>

                    {/* Expanded Stats Drawer */}
                    {isStatsExpanded && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] space-y-3">
                        <div>
                          <div className="font-bold text-cyan-400 mb-1">🏏 Batting Career Summary</div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="text-slate-500 border-b border-slate-800">
                                  <th className="py-1">Fmt</th>
                                  <th className="py-1 text-center">Mat</th>
                                  <th className="py-1 text-center">Inn</th>
                                  <th className="py-1 text-center">Runs</th>
                                  <th className="py-1 text-center">HS</th>
                                  <th className="py-1 text-center">Avg</th>
                                  <th className="py-1 text-center">SR</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-900">
                                {cardFormats.map((fmt) => {
                                  const row = batStats[fmt] || {};
                                  if (!row.Mat && !row.M && !row.Runs && !row.R) return null;
                                  return (
                                    <tr key={fmt} className="text-slate-300">
                                      <td className="py-1 font-bold text-white">{fmt}</td>
                                      <td className="py-1 text-center">{row.Mat || row.M || '—'}</td>
                                      <td className="py-1 text-center">{row.Inn || '—'}</td>
                                      <td className="py-1 text-center text-emerald-400 font-semibold">{row.Runs || row.R || '—'}</td>
                                      <td className="py-1 text-center">{row.HS || '—'}</td>
                                      <td className="py-1 text-center">{row.Avg || '—'}</td>
                                      <td className="py-1 text-center">{row.SR || '—'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-cyan-400 mb-1">🎯 Bowling Career Summary</div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="text-slate-500 border-b border-slate-800">
                                  <th className="py-1">Fmt</th>
                                  <th className="py-1 text-center">Mat</th>
                                  <th className="py-1 text-center">Balls</th>
                                  <th className="py-1 text-center">Wkts</th>
                                  <th className="py-1 text-center">BBI</th>
                                  <th className="py-1 text-center">Econ</th>
                                  <th className="py-1 text-center">Avg</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-900">
                                {cardFormats.map((fmt) => {
                                  const row = bowlStats[fmt] || {};
                                  if (!row.Mat && !row.M && !row.Wkts && !row.W) return null;
                                  return (
                                    <tr key={fmt} className="text-slate-300">
                                      <td className="py-1 font-bold text-white">{fmt}</td>
                                      <td className="py-1 text-center">{row.Mat || row.M || '—'}</td>
                                      <td className="py-1 text-center">{row.Balls || row.B || '—'}</td>
                                      <td className="py-1 text-center text-cyan-400 font-semibold">{row.Wkts || row.W || '—'}</td>
                                      <td className="py-1 text-center">{row.BBI || '—'}</td>
                                      <td className="py-1 text-center">{row.Econ || '—'}</td>
                                      <td className="py-1 text-center">{row.Avg || '—'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    {player.cricbuzzUrl ? (
                      <a
                        href={player.cricbuzzUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Cricbuzz
                      </a>
                    ) : <span />}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(player)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Player & Stats"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-400 transition-colors"
                        title="Remove from Squad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SINGLE PLAYER INTAKE MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    {editingPlayer ? ('Edit ' + editingPlayer.name) : ('Add Player to ' + activeTeam.name)}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Paste a Cricbuzz profile URL, ID, or search by player name to auto-fill bio and stats.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* 1-Click Cricbuzz Auto-Fill Toolbar */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-cyan-950/60 border border-emerald-500/30 space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> 1-Click Cricbuzz Auto-Fill
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cricbuzzUrlInput}
                      onChange={(e) => setCricbuzzUrlInput(e.target.value)}
                      placeholder="Paste Cricbuzz URL (e.g. https://www.cricbuzz.com/profiles/10012/smriti-mandhana) or type player name..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleFetchCricbuzzData}
                      disabled={isScraping}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md whitespace-nowrap"
                    >
                      <RefreshCw className={'w-3.5 h-3.5 ' + (isScraping ? 'animate-spin' : '')} />
                      {isScraping ? 'Fetching...' : 'Fetch All'}
                    </button>
                  </div>
                  {scrapeSuccess && <p className="text-xs text-emerald-300 font-semibold">{scrapeSuccess}</p>}
                  {scrapeError && <p className="text-xs text-red-400 font-semibold">{scrapeError}</p>}
                </div>

                {/* Modal View Tabs: Personal Profile vs Career Stats */}
                <div className="flex border-b border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('profile')}
                    className={'px-4 py-2 text-xs font-bold border-b-2 transition-all ' +
                      (activeModalTab === 'profile'
                        ? 'border-emerald-400 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-white')
                    }
                  >
                    1. Personal & Playing Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('stats')}
                    className={'px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ' +
                      (activeModalTab === 'stats'
                        ? 'border-emerald-400 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-white')
                    }
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>2. Career Statistics ({Object.keys(formData.careerStats?.batting || {}).length + Object.keys(formData.careerStats?.bowling || {}).length} Formats)</span>
                  </button>
                </div>

                {/* Tab 1: Personal Profile Fields */}
                {activeModalTab === 'profile' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 font-semibold">Assign Team *</label>
                      <select
                        value={formData.teamId || activeTeam.id}
                        onChange={(e) => {
                          const chosen = WPL_TEAMS.find((t) => t.id === e.target.value || t.slug === e.target.value) || activeTeam;
                          setFormData({ ...formData, teamId: chosen.id, team: chosen.name });
                        }}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      >
                        {WPL_TEAMS.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.short})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-semibold">Player Name *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Player Name"
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-semibold">Nationality</label>
                      <input
                        type="text"
                        value={formData.nationality || ''}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        placeholder="e.g. Australia"
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-semibold">Role</label>
                      <select
                        value={formData.role || 'All-rounder'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      >
                        <option value="Batter">Batter</option>
                        <option value="All-rounder">All-rounder</option>
                        <option value="Bowler">Bowler</option>
                        <option value="Wicketkeeper">Wicketkeeper</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-semibold">All-Rounder Type</label>
                      <select
                        value={formData.allrounderType || 'Batting Allrounder'}
                        onChange={(e) => setFormData({ ...formData, allrounderType: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      >
                        <option value="Batting Allrounder">Batting Allrounder</option>
                        <option value="Bowling Allrounder">Bowling Allrounder</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-semibold">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth || ''}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-semibold">Age</label>
                      <input
                        type="number"
                        value={formData.age !== undefined && formData.age !== null ? formData.age : ''}
                        onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || '' })}
                        placeholder="e.g. 30"
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-semibold">Batting Style</label>
                      <select
                        value={formData.battingStyle || 'Right-hand bat'}
                        onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      >
                        <option value="Right-hand bat">Right-hand bat</option>
                        <option value="Left-hand bat">Left-hand bat</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-semibold">Bowling Style</label>
                      <input
                        type="text"
                        value={formData.bowlingStyle || ''}
                        onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
                        placeholder="e.g. Right-arm fast-medium"
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-semibold">Jersey Number</label>
                      <input
                        type="text"
                        value={formData.jerseyNumber || 'N/A'}
                        onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                        placeholder="e.g. 8"
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-semibold">Contract / Auction Fee</label>
                      <input
                        type="text"
                        value={formData.auction?.fee || '₹50 Lakh'}
                        onChange={(e) => setFormData({ ...formData, auction: { ...formData.auction, fee: e.target.value } })}
                        placeholder="e.g. ₹2.00 Cr"
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Career Stats Tables (Batting & Bowling) */}
                {activeModalTab === 'stats' && (
                  <div className="space-y-6">
                    {/* Batting Career Summary */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          <span>🏏</span> BATTING CAREER SUMMARY
                        </h4>
                        <span className="text-[10px] text-slate-500">Auto-extracted from Cricbuzz</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                              <th className="py-2 px-2">Format</th>
                              <th className="py-2 px-2 text-center">Mat</th>
                              <th className="py-2 px-2 text-center">Inn</th>
                              <th className="py-2 px-2 text-center">NO</th>
                              <th className="py-2 px-2 text-center">Runs</th>
                              <th className="py-2 px-2 text-center">HS</th>
                              <th className="py-2 px-2 text-center">Avg</th>
                              <th className="py-2 px-2 text-center">BF</th>
                              <th className="py-2 px-2 text-center">SR</th>
                              <th className="py-2 px-2 text-center">100</th>
                              <th className="py-2 px-2 text-center">50</th>
                              <th className="py-2 px-2 text-center">4s</th>
                              <th className="py-2 px-2 text-center">6s</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {availableFormats.map((fmt) => {
                              const row = formData.careerStats?.batting?.[fmt] || {};
                              if (!row.Mat && !row.M && !row.Runs && !row.R) return null;
                              return (
                                <tr key={fmt} className="hover:bg-slate-900/50 text-slate-200">
                                  <td className="py-2 px-2 font-bold text-white">{fmt}</td>
                                  <td className="py-2 px-2 text-center">{row.Mat || row.M || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.Inn || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.NO || '—'}</td>
                                  <td className="py-2 px-2 text-center font-bold text-emerald-400">{row.Runs || row.R || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.HS || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.Avg || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.BF || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.SR || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row['100'] || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row['50'] || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row['4s'] || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row['6s'] || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bowling Career Summary */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          <span>🎯</span> BOWLING CAREER SUMMARY
                        </h4>
                        <span className="text-[10px] text-slate-500">Auto-extracted from Cricbuzz</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                              <th className="py-2 px-2">Format</th>
                              <th className="py-2 px-2 text-center">Mat</th>
                              <th className="py-2 px-2 text-center">Inn</th>
                              <th className="py-2 px-2 text-center">Balls</th>
                              <th className="py-2 px-2 text-center">Runs</th>
                              <th className="py-2 px-2 text-center">Wkts</th>
                              <th className="py-2 px-2 text-center">BBI</th>
                              <th className="py-2 px-2 text-center">Econ</th>
                              <th className="py-2 px-2 text-center">Avg</th>
                              <th className="py-2 px-2 text-center">SR</th>
                              <th className="py-2 px-2 text-center">5W</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {availableFormats.map((fmt) => {
                              const row = formData.careerStats?.bowling?.[fmt] || {};
                              if (!row.Mat && !row.M && !row.Wkts && !row.W) return null;
                              return (
                                <tr key={fmt} className="hover:bg-slate-900/50 text-slate-200">
                                  <td className="py-2 px-2 font-bold text-white">{fmt}</td>
                                  <td className="py-2 px-2 text-center">{row.Mat || row.M || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.Inn || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.Balls || row.B || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.Runs || row.R || '—'}</td>
                                  <td className="py-2 px-2 text-center font-bold text-cyan-400">{row.Wkts || row.W || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.BBI || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.Econ || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.Avg || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row.SR || '—'}</td>
                                  <td className="py-2 px-2 text-center">{row['5W'] || row['5w'] || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="text-xs text-slate-400">
                  {Object.keys(formData.careerStats?.batting || {}).length > 0 && (
                    <span className="text-emerald-400 font-semibold">✓ Career Stats tables attached</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePlayer}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                  >
                    Save Player
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
