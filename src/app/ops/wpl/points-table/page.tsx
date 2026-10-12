'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Edit, 
  Save, 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  TrendingUp,
  Download
} from 'lucide-react';
import { api } from '@/lib/data';

interface WplTableRow {
  teamId: string;
  name: string;
  shortName: string;
  logo: string;
  played: number;
  won: number;
  lost: number;
  noResult: number;
  netRunRate: number;
  points: number;
  status: 'none' | 'final' | 'eliminator' | 'eliminated';
  accent: string;
}

const DEFAULT_WPL_TEAMS: WplTableRow[] = [
  { teamId: '12', name: 'Royal Challengers Bengaluru', shortName: 'RCB-W', logo: '/logos/wpl_rcb_logo_animated.svg', played: 0, won: 0, lost: 0, noResult: 0, netRunRate: 0.000, points: 0, status: 'none', accent: '#C8102E' },
  { teamId: '11', name: 'Mumbai Indians', shortName: 'MI-W', logo: '/logos/wpl_mi_logo_animated.svg', played: 0, won: 0, lost: 0, noResult: 0, netRunRate: 0.000, points: 0, status: 'none', accent: '#004BA0' },
  { teamId: '13', name: 'Delhi Capitals', shortName: 'DC-W', logo: '/logos/wpl_dc_logo_animated.svg', played: 0, won: 0, lost: 0, noResult: 0, netRunRate: 0.000, points: 0, status: 'none', accent: '#004BA0' },
  { teamId: '14', name: 'Gujarat Giants', shortName: 'GG', logo: '/logos/wpl_gg_logo_animated.svg', played: 0, won: 0, lost: 0, noResult: 0, netRunRate: 0.000, points: 0, status: 'none', accent: '#F97316' },
  { teamId: '15', name: 'UP Warriorz', shortName: 'UPW', logo: '/logos/wpl_upw_logo_animated.svg', played: 0, won: 0, lost: 0, noResult: 0, netRunRate: 0.000, points: 0, status: 'none', accent: '#EAB308' },
];

const STORAGE_KEY = 'wpl_points_table_admin_v2027';

export default function WplPointsTableAdminPage() {
  const [rows, setRows] = useState<WplTableRow[]>(DEFAULT_WPL_TEAMS);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WplTableRow>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Load persisted standings
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRows(parsed);
        }
      }
    } catch (e) {
      console.warn('Error loading points table from storage', e);
    }
  }, []);

  const saveToStorage = (updatedRows: WplTableRow[]) => {
    setRows(updatedRows);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRows));
      setFeedbackMessage('Standings saved successfully!');
      setTimeout(() => setFeedbackMessage(''), 3000);
    } catch (e) {
      console.error('Failed to save points table to storage', e);
    }
  };

  // Sort by Points DESC, then Net Run Rate DESC, then Wins DESC
  const sortedStandings = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
      return b.won - a.won;
    });
  }, [rows]);

  const handleStartEdit = (row: WplTableRow) => {
    setEditingTeamId(row.teamId);
    setEditForm({ ...row });
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setEditForm({});
  };

  const handleFieldChange = (field: keyof WplTableRow, value: any) => {
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-compute points when won or noResult changes
      if (field === 'won' || field === 'noResult') {
        const w = field === 'won' ? Number(value) || 0 : Number(prev.won) || 0;
        const nr = field === 'noResult' ? Number(value) || 0 : Number(prev.noResult) || 0;
        updated.points = (w * 2) + nr;
      }
      return updated;
    });
  };

  const handleSaveRow = (teamId: string) => {
    const updated = rows.map(r => {
      if (r.teamId === teamId) {
        return {
          ...r,
          played: Number(editForm.played) || 0,
          won: Number(editForm.won) || 0,
          lost: Number(editForm.lost) || 0,
          noResult: Number(editForm.noResult) || 0,
          netRunRate: parseFloat(Number(editForm.netRunRate || 0).toFixed(3)),
          points: Number(editForm.points) || 0,
          status: (editForm.status || 'none') as WplTableRow['status'],
        };
      }
      return r;
    });

    saveToStorage(updated);
    setEditingTeamId(null);
    setEditForm({});
  };

  const handleResetToDefault = () => {
    if (confirm('Reset WPL Points Table to 0 for all teams? This cannot be undone.')) {
      saveToStorage(DEFAULT_WPL_TEAMS);
    }
  };

  const getStatusBadge = (status: WplTableRow['status'], rank: number) => {
    if (status === 'final') {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">Q - Final</span>;
    }
    if (status === 'eliminator') {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">Q - Eliminator</span>;
    }
    if (status === 'eliminated') {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">Eliminated</span>;
    }

    // Default indicators according to WPL official qualification hierarchy
    if (rank === 1) {
      return <span className="text-[11px] font-bold text-amber-400/70">Top Spot (Final)</span>;
    }
    if (rank === 2 || rank === 3) {
      return <span className="text-[11px] font-bold text-purple-400/70">Top 3 (Eliminator)</span>;
    }
    return <span className="text-[11px] text-[var(--wpl-text-muted)]">—</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--wpl-card-border,rgba(255,255,255,0.1))]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30">
              WPL 2027 STANDINGS OPS
            </span>
            <span className="text-xs text-[var(--wpl-text-muted)]">Official Double Round-Robin Standings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--wpl-text-title)] flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-500 dark:text-amber-400" /> WPL Points Table Admin
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {feedbackMessage && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> {feedbackMessage}
            </span>
          )}
          <button
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl border border-[var(--wpl-card-border)] bg-[var(--wpl-card-bg)] hover:bg-[var(--wpl-hover-bg)] text-xs font-semibold text-rose-400 transition-all flex items-center gap-2 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="p-4 rounded-2xl border border-[var(--wpl-card-border)] bg-[var(--wpl-card-bg)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-[var(--wpl-text-title)]">WPL Tournament Format & Progression Rules:</div>
            <p className="text-[var(--wpl-text-muted)]">
              5 Teams play 8 league matches each (double round-robin). <strong>Rank 1 qualifies directly to the Final</strong>. <strong>Ranks 2 & 3 play the Eliminator</strong>. Teams 4 & 5 are eliminated.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[11px]">2 Pts / Win</span>
          <span className="px-2.5 py-1 rounded bg-slate-500/10 text-slate-300 border border-slate-500/30 font-bold text-[11px]">1 Pt / NR</span>
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="rounded-2xl border border-[var(--wpl-card-border)] bg-[var(--wpl-card-bg)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--wpl-card-border)] bg-[var(--wpl-hover-bg)] text-[11px] font-black uppercase tracking-wider text-[var(--wpl-text-muted)]">
                <th className="py-3.5 px-4 text-center w-12">Pos</th>
                <th className="py-3.5 px-4 min-w-[200px]">Team</th>
                <th className="py-3.5 px-3 text-center">P</th>
                <th className="py-3.5 px-3 text-center">W</th>
                <th className="py-3.5 px-3 text-center">L</th>
                <th className="py-3.5 px-3 text-center">NR</th>
                <th className="py-3.5 px-3 text-center">NRR</th>
                <th className="py-3.5 px-3 text-center font-black text-amber-400">PTS</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--wpl-card-border)]">
              {sortedStandings.map((row, index) => {
                const rank = index + 1;
                const isEditing = editingTeamId === row.teamId;

                return (
                  <tr 
                    key={row.teamId}
                    className={`transition-colors ${
                      isEditing 
                        ? 'bg-pink-500/10' 
                        : 'hover:bg-[var(--wpl-hover-bg)]'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-4 text-center font-black">
                      <span className={`w-7 h-7 inline-flex items-center justify-center rounded-lg text-xs ${
                        rank === 1 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : rank <= 3 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                            : 'text-[var(--wpl-text-muted)]'
                      }`}>
                        {rank}
                      </span>
                    </td>

                    {/* Team Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: row.accent || '#333' }}
                        >
                          {row.shortName.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--wpl-text-title)] flex items-center gap-2">
                            {row.name}
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[var(--wpl-hover-bg)] border border-[var(--wpl-card-border)]">
                              {row.shortName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stats Fields (Static or Editable) */}
                    {isEditing ? (
                      <>
                        <td className="py-4 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="8"
                            value={editForm.played ?? row.played}
                            onChange={(e) => handleFieldChange('played', e.target.value)}
                            className="w-14 px-2 py-1 text-center rounded border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)] text-xs font-bold"
                          />
                        </td>
                        <td className="py-4 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="8"
                            value={editForm.won ?? row.won}
                            onChange={(e) => handleFieldChange('won', e.target.value)}
                            className="w-14 px-2 py-1 text-center rounded border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)] text-xs font-bold text-emerald-400"
                          />
                        </td>
                        <td className="py-4 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="8"
                            value={editForm.lost ?? row.lost}
                            onChange={(e) => handleFieldChange('lost', e.target.value)}
                            className="w-14 px-2 py-1 text-center rounded border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)] text-xs font-bold text-rose-400"
                          />
                        </td>
                        <td className="py-4 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="8"
                            value={editForm.noResult ?? row.noResult}
                            onChange={(e) => handleFieldChange('noResult', e.target.value)}
                            className="w-14 px-2 py-1 text-center rounded border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)] text-xs font-bold"
                          />
                        </td>
                        <td className="py-4 px-2 text-center">
                          <input
                            type="number"
                            step="0.001"
                            value={editForm.netRunRate ?? row.netRunRate}
                            onChange={(e) => handleFieldChange('netRunRate', e.target.value)}
                            className="w-20 px-2 py-1 text-center rounded border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)] text-xs font-bold font-mono"
                          />
                        </td>
                        <td className="py-4 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={editForm.points ?? row.points}
                            onChange={(e) => handleFieldChange('points', e.target.value)}
                            className="w-14 px-2 py-1 text-center rounded border border-amber-500/50 bg-[var(--wpl-input-bg)] text-amber-400 text-xs font-black"
                          />
                        </td>
                        <td className="py-4 px-2 text-center">
                          <select
                            value={editForm.status ?? row.status}
                            onChange={(e) => handleFieldChange('status', e.target.value)}
                            className="px-2 py-1 rounded text-xs border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)] font-bold"
                          >
                            <option value="none">Normal</option>
                            <option value="final">Q - Final</option>
                            <option value="eliminator">Q - Eliminator</option>
                            <option value="eliminated">Eliminated</option>
                          </select>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-3 text-center font-bold text-[var(--wpl-text-title)]">{row.played}</td>
                        <td className="py-4 px-3 text-center font-bold text-emerald-500 dark:text-emerald-400">{row.won}</td>
                        <td className="py-4 px-3 text-center font-bold text-rose-500 dark:text-rose-400">{row.lost}</td>
                        <td className="py-4 px-3 text-center text-[var(--wpl-text-muted)]">{row.noResult}</td>
                        <td className="py-4 px-3 text-center font-mono font-semibold">
                          <span className={row.netRunRate > 0 ? 'text-emerald-400' : row.netRunRate < 0 ? 'text-rose-400' : 'text-slate-400'}>
                            {row.netRunRate > 0 ? `+${row.netRunRate.toFixed(3)}` : row.netRunRate.toFixed(3)}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center font-black text-amber-400 text-base">{row.points}</td>
                        <td className="py-4 px-4 text-center">{getStatusBadge(row.status, rank)}</td>
                      </>
                    )}

                    {/* Actions */}
                    <td className="py-4 px-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSaveRow(row.teamId)}
                            title="Save Row"
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            title="Cancel"
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-slate-300 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(row)}
                          title="Edit Row"
                          className="px-3 py-1.5 rounded-lg border border-[var(--wpl-card-border)] bg-[var(--wpl-card-bg)] hover:bg-[var(--wpl-hover-bg)] text-xs font-bold text-pink-500 hover:text-pink-400 flex items-center gap-1.5 mx-auto transition-colors shadow-sm"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
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
