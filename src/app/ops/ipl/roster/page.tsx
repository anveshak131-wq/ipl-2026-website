'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, Upload, Plus, Trash2, Edit3, Search, RefreshCw, CheckCircle2, AlertCircle, Award } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  teamId: string;
  team?: string;
  role: string;
  nationality: string;
  battingStyle?: string;
  bowlingStyle?: string;
  isCaptain?: boolean;
  isKeeper?: boolean;
  league: string;
  stats?: Record<string, any>;
  bowlingStats?: Record<string, any>;
}

const IPL_TEAMS = [
  { id: '1', name: 'Chennai Super Kings', short: 'CSK', color: 'bg-amber-500', logo: '/logos/csk.png' },
  { id: '2', name: 'Mumbai Indians', short: 'MI', color: 'bg-blue-600', logo: '/logos/mi.png' },
  { id: '3', name: 'Royal Challengers Bengaluru', short: 'RCB', color: 'bg-red-600', logo: '/logos/rcb.png' },
  { id: '4', name: 'Kolkata Knight Riders', short: 'KKR', color: 'bg-purple-700', logo: '/logos/kkr.png' },
  { id: '5', name: 'Delhi Capitals', short: 'DC', color: 'bg-blue-700', logo: '/logos/dc.png' },
  { id: '6', name: 'Punjab Kings', short: 'PBKS', color: 'bg-red-500', logo: '/logos/pbks.png' },
  { id: '7', name: 'Rajasthan Royals', short: 'RR', color: 'bg-pink-600', logo: '/logos/rr.png' },
  { id: '8', name: 'Sunrisers Hyderabad', short: 'SRH', color: 'bg-orange-600', logo: '/logos/srh.png' },
  { id: '9', name: 'Gujarat Titans', short: 'GT', color: 'bg-teal-700', logo: '/logos/gt.png' },
  { id: '10', name: 'Lucknow Super Giants', short: 'LSG', color: 'bg-sky-500', logo: '/logos/lsg.png' },
];

export default function IplRosterPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [onlyCaptains, setOnlyCaptains] = useState(false);
  const [onlyKeepers, setOnlyKeepers] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/players?league=ipl&_nocache=' + Date.now());
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.players || []);
      setPlayers(list);
      localStorage.setItem('ipl_roster_cache', JSON.stringify(list));
      showStatus('success', `Loaded ${list.length} IPL players.`);
    } catch (err: any) {
      const cached = localStorage.getItem('ipl_roster_cache');
      if (cached) {
        const list = JSON.parse(cached);
        setPlayers(list);
        showStatus('error', `API offline. Restored ${list.length} players from browser cache.`);
      } else {
        showStatus('error', 'Unable to load players from API or cache.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const pTeam = String(p?.teamId || p?.team || '');
      const teamMatch = selectedTeam === 'all' || pTeam === selectedTeam;
      if (!teamMatch) return false;

      if (onlyCaptains && !p?.isCaptain) return false;
      if (onlyKeepers && !p?.isKeeper) return false;

      const q = String(search || '').trim().toLowerCase();
      if (!q) return true;

      const nameMatch = String(p?.name || '').toLowerCase().includes(q);
      const roleMatch = String(p?.role || '').toLowerCase().includes(q);
      const natMatch = String(p?.nationality || '').toLowerCase().includes(q);
      return nameMatch || roleMatch || natMatch;
    });
  }, [players, selectedTeam, search, onlyCaptains, onlyKeepers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this player?')) return;
    try {
      const res = await fetch(`/api/players?id=${id}&league=ipl`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      const updated = players.filter((p) => String(p.id) !== String(id));
      setPlayers(updated);
      localStorage.setItem('ipl_roster_cache', JSON.stringify(updated));
      showStatus('success', 'Player deleted successfully.');
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingPlayer, league: 'ipl' }),
      });
      if (!res.ok) throw new Error('Failed to save');

      const existingIdx = players.findIndex((p) => String(p.id) === String(editingPlayer.id));
      let updated: Player[];
      if (existingIdx >= 0) {
        updated = [...players];
        updated[existingIdx] = editingPlayer;
      } else {
        updated = [editingPlayer, ...players];
      }
      setPlayers(updated);
      localStorage.setItem('ipl_roster_cache', JSON.stringify(updated));
      setEditingPlayer(null);
      showStatus('success', 'Player saved.');
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(players, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipl-roster-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('success', 'Full IPL roster exported.');
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!Array.isArray(imported)) throw new Error('Invalid JSON format');

        setLoading(true);
        const res = await fetch('/api/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bulk: true, players: imported, league: 'ipl' }),
        });
        if (!res.ok) throw new Error('Restore failed');

        setPlayers(imported);
        localStorage.setItem('ipl_roster_cache', JSON.stringify(imported));
        showStatus('success', `Restored ${imported.length} players to vault.`);
      } catch (err: any) {
        showStatus('error', err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const getTeamBadge = (teamId: string) => {
    const team = IPL_TEAMS.find((t) => t.id === String(teamId));
    if (!team) return <span className="px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400">Team {teamId}</span>;
    return (
      <div className="flex items-center gap-1.5">
        <img
          src={team.logo}
          alt={team.short}
          className="w-5 h-5 rounded-full object-contain bg-zinc-900 border border-zinc-700/60 p-0.5"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white shadow-sm ${team.color}`}>
          {team.short}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-bold tracking-tight">IPL 2026 Master Roster</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Official franchises, squad role filters, and one-click JSON vault.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() =>
              setEditingPlayer({
                id: `ipl-custom-${Date.now()}`,
                name: '',
                teamId: '1',
                role: 'Batter',
                nationality: 'India',
                isCaptain: false,
                isKeeper: false,
                league: 'ipl',
                stats: { matches: 0, runs: 0, average: 0, strikeRate: 0, highestScore: 0, hundreds: 0, fifties: 0 },
                bowlingStats: { matches: 0, wickets: 0, bestBowling: '-', economy: 0, average: 0 },
              })
            }
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition"
          >
            <Plus className="h-4 w-4" /> Add Player
          </button>

          <button
            onClick={fetchPlayers}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sync
          </button>

          <button
            onClick={exportBackup}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition"
          >
            <Download className="h-4 w-4" /> Export Vault
          </button>

          <input type="file" ref={fileInputRef} onChange={importBackup} accept=".json" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition"
          >
            <Upload className="h-4 w-4" /> Restore JSON
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-lg mb-6 flex items-center gap-3 text-sm ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
              : 'bg-red-950/80 border border-red-800 text-red-200'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search IPL players by name, role, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100"
          />
        </div>

        <div className="min-w-[220px]">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100"
          >
            <option value="all">All IPL Franchises ({players.length})</option>
            {IPL_TEAMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({players.filter((p) => String(p?.teamId || p?.team) === t.id).length})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyCaptains(!onlyCaptains)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              onlyCaptains
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Captains ({players.filter((p) => p.isCaptain).length})
          </button>

          <button
            type="button"
            onClick={() => setOnlyKeepers(!onlyKeepers)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              onlyKeepers
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/60 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Keepers ({players.filter((p) => p.isKeeper).length})
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Nationality</th>
                <th className="px-4 py-3">Matches</th>
                <th className="px-4 py-3">Runs</th>
                <th className="px-4 py-3">Avg / SR</th>
                <th className="px-4 py-3">Wickets</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading IPL master data...' : 'No players found matching your filters.'}
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => {
                  const runs = player?.stats?.runs ?? '-';
                  const avg = player?.stats?.average ? Number(player.stats.average).toFixed(1) : '-';
                  const sr = player?.stats?.strikeRate ? Number(player.stats.strikeRate).toFixed(1) : '-';
                  const wkts = player?.bowlingStats?.wickets ?? player?.stats?.wickets ?? '-';
                  const mat = player?.stats?.matches ?? player?.bowlingStats?.matches ?? '-';

                  return (
                    <tr key={player.id} className="hover:bg-zinc-800/40 transition">
                      <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                        <span>{player.name}</span>
                        {player.isCaptain && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-1.5 py-0.5 rounded font-bold">
                            C
                          </span>
                        )}
                        {player.isKeeper && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/50 px-1.5 py-0.5 rounded font-bold">
                            WK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{getTeamBadge(String(player?.teamId || player?.team || ''))}</td>
                      <td className="px-4 py-3">{player.role || 'Player'}</td>
                      <td className="px-4 py-3">{player.nationality || 'India'}</td>
                      <td className="px-4 py-3 text-zinc-400">{mat}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-200">{runs}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {avg} / {sr}
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-200">{wkts}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingPlayer(player)}
                            className="p-1.5 hover:bg-zinc-700 text-zinc-300 rounded transition"
                            title="Edit player"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(player.id)}
                            className="p-1.5 hover:bg-red-950 text-red-400 rounded transition"
                            title="Delete player"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingPlayer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h2 className="text-lg font-bold mb-4 text-white">
              {players.some((p) => p.id === editingPlayer.id) ? 'Edit IPL Player' : 'Add New IPL Player'}
            </h2>
            <form onSubmit={handleSavePlayer} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-zinc-400 font-semibold mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-zinc-400 font-semibold mb-1">Team</label>
                  <select
                    value={editingPlayer.teamId}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, teamId: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                  >
                    {IPL_TEAMS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase text-zinc-400 font-semibold mb-1">Role</label>
                  <input
                    type="text"
                    value={editingPlayer.role}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, role: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 py-2 border-y border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={!!editingPlayer.isCaptain}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, isCaptain: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-800"
                  />
                  <span>Team Captain</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={!!editingPlayer.isKeeper}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, isKeeper: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-700 text-blue-500 focus:ring-blue-500 bg-zinc-800"
                  />
                  <span>Wicketkeeper</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs uppercase text-zinc-400 font-semibold mb-1">Career Runs</label>
                  <input
                    type="number"
                    value={editingPlayer.stats?.runs ?? 0}
                    onChange={(e) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        stats: { ...editingPlayer.stats, runs: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-zinc-400 font-semibold mb-1">Wickets</label>
                  <input
                    type="number"
                    value={editingPlayer.bowlingStats?.wickets ?? 0}
                    onChange={(e) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        bowlingStats: { ...editingPlayer.bowlingStats, wickets: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-zinc-400 font-semibold mb-1">Strike Rate</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingPlayer.stats?.strikeRate ?? 0}
                    onChange={(e) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        stats: { ...editingPlayer.stats, strikeRate: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
