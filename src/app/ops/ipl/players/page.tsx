'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import type { Player, Team } from '@/types';
import {
  Search,
  Plus,
  RefreshCw,
  LayoutGrid,
  Table2,
  Users,
  Shield,
  Download,
  Filter,
  Sparkles,
  Plane,
  X,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import Franchise2027Bar from '@/components/admin/players/Franchise2027Bar';
import { Player2027Card } from '@/components/admin/players/Player2027Card';
import Player2027Drawer from '@/components/admin/players/Player2027Drawer';
import SmartIntakeModal from '@/components/admin/players/SmartIntakeModal';
import PitchFormationView from '@/components/admin/players/PitchFormationView';
import Player2027DenseTable from '@/components/admin/players/Player2027DenseTable';
import PlayerExportBar from '@/components/admin/players/PlayerExportBar';
import { IPL_2027_TEAMS, resolveIpl2027Team } from '@/lib/admin/ipl2027Teams';

export default function Ipl2027OpsPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View & Filter States
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'pitch'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showExportStudio, setShowExportStudio] = useState<boolean>(false);

  // Modals & Drawer States
  const [drawerPlayer, setDrawerPlayer] = useState<Player | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [, startTransition] = useTransition();

  // 150ms Search Debounce to guarantee 0ms keystroke latency
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(searchQuery);
      });
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Players & Teams
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [playersRes, teamsRes] = await Promise.all([
        fetch(`/api/players?league=ipl&_t=${Date.now()}`, { cache: 'no-store' }),
        fetch('/api/teams?league=ipl', { cache: 'no-store' }),
      ]);

      if (playersRes.ok) {
        const pData = await playersRes.json();
        if (Array.isArray(pData)) setPlayers(pData);
      }
      if (teamsRes.ok) {
        const tData = await teamsRes.json();
        if (Array.isArray(tData)) setTeams(tData);
      }
    } catch (err) {
      console.error('Failed to load IPL 2027 squad data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Team player count index for Franchise bar
  const { playersCountByTeam, poolCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let pool = 0;

    for (const p of players) {
      const status = (p.squadStatus || '').toLowerCase();
      const metaTeam = resolveIpl2027Team(p.teamShortName || p.teamId || p.team);

      if (status.includes('release') || !p.teamId || p.team === 'Auction Pool 2027') {
        pool++;
      }

      if (metaTeam) {
        counts[metaTeam.id] = (counts[metaTeam.id] || 0) + 1;
        counts[metaTeam.shortName] = (counts[metaTeam.shortName] || 0) + 1;
      }
    }
    return { playersCountByTeam: counts, poolCount: pool };
  }, [players]);

  // High-performance memoized filter pipeline
  const filteredPlayers = useMemo(() => {
    const searchLower = debouncedSearch.trim().toLowerCase();

    return players.filter((p) => {
      const status = (p.squadStatus || 'Retained').toLowerCase();
      const metaTeam = resolveIpl2027Team(p.teamShortName || p.teamId || p.team);

      // Franchise Scope
      if (selectedTeamId === 'pool') {
        if (!status.includes('release') && p.teamId && p.team !== 'Auction Pool 2027') {
          return false;
        }
      } else if (selectedTeamId !== 'all') {
        if (!metaTeam) return false;
        if (metaTeam.id !== selectedTeamId && metaTeam.shortName !== selectedTeamId) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter === 'RETAINED') {
        if (!status.includes('retain')) return false;
      } else if (statusFilter === 'TRADED') {
        if (!status.includes('trade')) return false;
      } else if (statusFilter === 'RELEASED') {
        if (!status.includes('release') && p.teamId && p.team !== 'Auction Pool 2027') return false;
      } else if (statusFilter === 'OVERSEAS') {
        if (!p.nationality || p.nationality.toLowerCase() === 'india') return false;
      }

      // Role Filter
      if (roleFilter !== 'ALL') {
        if ((p.role || '').toLowerCase() !== roleFilter.toLowerCase()) return false;
      }

      // Search Filter
      if (searchLower) {
        const nameMatch = p.name.toLowerCase().includes(searchLower);
        const natMatch = (p.nationality || '').toLowerCase().includes(searchLower);
        const teamMatch = (p.team || p.teamShortName || '').toLowerCase().includes(searchLower);
        const jerseyMatch = String(p.jerseyNumber || '') === searchLower;
        if (!nameMatch && !natMatch && !teamMatch && !jerseyMatch) return false;
      }

      return true;
    });
  }, [players, selectedTeamId, statusFilter, roleFilter, debouncedSearch]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setModalOpen(true);
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name} from squad records?`)) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const res = await fetch(`/api/players?id=${id}&league=ipl`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });

      if (res.ok) {
        setPlayers((prev) => prev.filter((p) => String(p.id) !== String(id)));
        if (drawerPlayer && String(drawerPlayer.id) === String(id)) {
          setDrawerPlayer(null);
        }
      } else {
        alert('Failed to delete player from database');
      }
    } catch (e: any) {
      alert('Error deleting player: ' + e.message);
    }
  };

  const handlePlayerSaved = (saved: Player) => {
    setPlayers((prev) => {
      const idx = prev.findIndex((p) => String(p.id) === String(saved.id));
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = saved;
        return clone;
      }
      return [saved, ...prev];
    });
    if (drawerPlayer && String(drawerPlayer.id) === String(saved.id)) {
      setDrawerPlayer(saved);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-8 space-y-6">
      {/* Hero Header */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-96 bg-gradient-to-l from-[#f2d39a]/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#f2d39a]">
              <Shield className="w-4 h-4 text-[#f2d39a]" />
              IPL 2027 Operations Desk & Auction War Room
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mt-1">
              Squad Management Hub
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-2xl">
              Official 2027 franchise rosters, retention slabs, blockbuster trades, and 1-click Cricbuzz intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowExportStudio((v) => !v)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                showExportStudio
                  ? 'bg-sky-600 text-white border-sky-400 shadow-lg shadow-sky-950/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-sky-300 border-sky-500/40'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Roster ({filteredPlayers.length})</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Refresh database"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>1-Click Add Player</span>
            </button>
          </div>
        </div>

        {/* Export Studio Tray */}
        {showExportStudio && (
          <div className="mt-6 pt-6 border-t border-white/10 animate-fade-in">
            <PlayerExportBar players={filteredPlayers} league="IPL" teams={teams} />
          </div>
        )}
      </div>

      {/* Franchise Selector Bar (10 Teams + All + Pool) */}
      <Franchise2027Bar
        selectedTeamId={selectedTeamId}
        onSelectTeam={(teamId) => setSelectedTeamId(teamId)}
        playersCountByTeam={playersCountByTeam}
        totalPlayersCount={players.length}
        poolPlayersCount={poolCount}
      />

      {/* Control & Filter Strip */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Instant search by player name, jersey #, country, or franchise..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#f2d39a] text-slate-950 shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-[#f2d39a] text-slate-950 shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Dense Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pitch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'pitch'
                  ? 'bg-[#f2d39a] text-slate-950 shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pitch XI</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40 mr-1">
              2027 Status:
            </span>
            {[
              { id: 'ALL', label: 'All Statuses' },
              { id: 'RETAINED', label: '🟢 Retained (184)' },
              { id: 'TRADED', label: '🔄 Traded' },
              { id: 'RELEASED', label: '🔴 2027 Auction Pool' },
              { id: 'OVERSEAS', label: '✈️ Overseas' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === f.id
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-slate-950/60 text-white/50 hover:text-white border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Role Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40 mr-1">
              Role:
            </span>
            {['ALL', 'Batsman', 'All-Rounder', 'Bowler', 'Wicket-Keeper'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === r
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950/60 text-white/50 hover:text-white border border-transparent'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Players Content */}
      {isLoading ? (
        <div className="p-20 text-center text-white/50">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#f2d39a]" />
          <p className="text-sm font-bold text-white">Loading IPL 2027 Squad Intelligence...</p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="p-16 rounded-3xl border border-dashed border-white/10 bg-slate-900/30 text-center space-y-3">
          <Users className="w-10 h-10 text-white/30 mx-auto" />
          <h3 className="text-base font-bold text-white">No squad records match your criteria</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Try adjusting your search keywords, role selection, or franchise filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedTeamId('all');
              setStatusFilter('ALL');
              setRoleFilter('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#f2d39a] text-xs font-bold inline-flex items-center gap-1.5"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <Player2027DenseTable
          players={filteredPlayers}
          teams={teams}
          onView={(p) => setDrawerPlayer(p)}
          onEdit={(p) => handleOpenEdit(p)}
          onDelete={(id, name) => handleDeletePlayer(id, name)}
        />
      ) : viewMode === 'pitch' ? (
        <PitchFormationView
          players={filteredPlayers}
          selectedTeamId={selectedTeamId}
          onViewPlayer={(p) => setDrawerPlayer(p)}
        />
      ) : (
        /* Scout Cards Grid with CSS content-visibility */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <Player2027Card
              key={player.id}
              player={player}
              teams={teams}
              onView={(p) => setDrawerPlayer(p)}
              onEdit={(p) => handleOpenEdit(p)}
              onDelete={(id, name) => handleDeletePlayer(id, name)}
            />
          ))}
        </div>
      )}

      {/* Slide-Over Player Dossier Drawer */}
      <Player2027Drawer
        player={drawerPlayer}
        onClose={() => setDrawerPlayer(null)}
        onEdit={(p) => {
          setDrawerPlayer(null);
          handleOpenEdit(p);
        }}
        onStatsUpdated={(updated) => handlePlayerSaved(updated)}
      />

      {/* 1-Click Cricbuzz Smart Intake Modal */}
      <SmartIntakeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingPlayer={editingPlayer}
        onSaved={(saved) => handlePlayerSaved(saved)}
        teams={teams}
      />
    </div>
  );
}
