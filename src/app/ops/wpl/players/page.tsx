'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, RefreshCw, Trash2, Edit2, Shield,
  ExternalLink, Sparkles, User, Check, X
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

export default function WplPlayersCleanOpsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('14');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [cricbuzzUrlInput, setCricbuzzUrlInput] = useState<string>('');
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeSuccess, setScrapeSuccess] = useState<string | null>(null);

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

  const activeTeam = useMemo(() => {
    return WPL_TEAMS.find((t) => t.id === selectedTeamId) || WPL_TEAMS[0];
  }, [selectedTeamId]);

  const teamPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesTeam = p.teamId === selectedTeamId || p.team === activeTeam.short || p.team === activeTeam.name;
      if (!matchesTeam) return false;

      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || p.role.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [players, selectedTeamId, activeTeam, searchQuery, roleFilter]);

  const handleOpenAddPlayer = () => {
    setEditingPlayer(null);
    setCricbuzzUrlInput('');
    setScrapeError(null);
    setScrapeSuccess(null);
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
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const handleFetchCricbuzzData = async () => {
    const rawUrl = cricbuzzUrlInput.trim();
    if (!rawUrl) {
      setScrapeError('Please enter a valid Cricbuzz profile URL or ID');
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

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to scrape player profile');
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

      setScrapeSuccess(`✓ Auto-filled ${bio.name || 'player'}: DOB, Age, Nationality, Role, Styles, and Stats extracted!`);
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

    const payload: Player = {
      id: editingPlayer?.id || `wpl_${activeTeam.id}_${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: formData.name,
      teamId: activeTeam.id,
      team: activeTeam.name,
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
      await fetch(`/api/players?id=${playerId}&league=wpl`, { method: 'DELETE' });
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    } catch (e) {
      alert('Failed to delete player');
    }
  };

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
              Squad Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select a franchise and add players individually via their Cricbuzz profile URL.
            </p>
          </div>

          <button
            onClick={handleOpenAddPlayer}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Player to {activeTeam.short}
          </button>
        </div>

        {/* Team Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {WPL_TEAMS.map((team) => {
            const isSelected = team.id === selectedTeamId;
            const count = players.filter((p) => p.teamId === team.id || p.team === team.short || p.team === team.name).length;

            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? `bg-gradient-to-br ${team.color} ${team.border} ring-2 ring-emerald-500/50 shadow-xl`
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{team.short}</div>
                  <div className="text-sm font-extrabold text-white mt-0.5 truncate">{team.name}</div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${team.badge}`}>
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
              placeholder={`Search ${activeTeam.short} players...`}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {['ALL', 'Batter', 'All-rounder', 'Bowler', 'Wicketkeeper'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  roleFilter === role
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
                }`}
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
              Click below to paste a Cricbuzz profile URL and add a player to this squad.
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
            {teamPlayers.map((player) => (
              <div
                key={player.id}
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-base font-extrabold text-emerald-400">
                        {player.jerseyNumber && player.jerseyNumber !== 'N/A' ? `#${player.jerseyNumber}` : player.name[0]}
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
                          <span className="text-[11px] text-slate-400">{player.age ? `${player.age} yrs` : '—'}</span>
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

                  {/* Stats Highlights */}
                  {player.careerStats?.batting && Object.keys(player.careerStats.batting).length > 0 && (
                    <div className="mt-2.5 text-[10px] text-slate-400 flex items-center justify-between px-1">
                      <span>Career Highlight:</span>
                      <span className="text-emerald-400 font-semibold">
                        {player.careerStats.batting['WPL']?.Runs || player.careerStats.batting['T20I']?.Runs || 0} runs · {player.careerStats.bowling?.['WPL']?.Wkts || player.careerStats.bowling?.['T20I']?.Wkts || 0} wkts
                      </span>
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
                      title="Edit Player"
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
            ))}
          </div>
        )}

        {/* SINGLE PLAYER INTAKE MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    {editingPlayer ? `Edit ${editingPlayer.name}` : `Add Player to ${activeTeam.name}`}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Paste a Cricbuzz profile URL to auto-fill personal records, playing styles, and career stats.
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
                      placeholder="Paste Cricbuzz URL (e.g. https://www.cricbuzz.com/profiles/8734/ellyse-perry) or ID (8734)..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleFetchCricbuzzData}
                      disabled={isScraping}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md whitespace-nowrap"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
                      {isScraping ? 'Fetching...' : 'Fetch All'}
                    </button>
                  </div>
                  {scrapeSuccess && <p className="text-xs text-emerald-300 font-semibold">{scrapeSuccess}</p>}
                  {scrapeError && <p className="text-xs text-red-400 font-semibold">{scrapeError}</p>}
                </div>

                {/* Extracted Form Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold">Player Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ellyse Perry"
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
                      placeholder="e.g. 35"
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
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/80">
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
                  Save Player to {activeTeam.short}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
