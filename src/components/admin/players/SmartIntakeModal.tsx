'use client';

import React, { useState, useEffect } from 'react';
import type { Player, Team } from '@/types';
import { X, RefreshCw, Sparkles, User, Shield, DollarSign, Check, Award, MapPin, Ruler, Activity } from 'lucide-react';
import { IPL_2027_TEAMS } from '@/lib/admin/ipl2027Teams';
import PlayerMonogramAvatar from '@/components/admin/players/PlayerMonogramAvatar';

interface SmartIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlayer: Player | null;
  onSaved: (player: Player) => void;
  teams: Team[];
}

export default function SmartIntakeModal({
  isOpen,
  onClose,
  editingPlayer,
  onSaved,
  teams,
}: SmartIntakeModalProps) {
  const [cricbuzzInput, setCricbuzzInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeSuccess, setScrapeSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<any>({
    name: '',
    role: 'Batsman',
    teamId: '1',
    team: 'Royal Challengers Bengaluru',
    teamShortName: 'RCB',
    league: 'ipl',
    nationality: 'India',
    birthPlace: '',
    teams: '',
    battingStyle: 'Right-handed bat',
    bowlingStyle: 'Right-arm medium',
    jerseyNumber: '',
    age: 26,
    dateOfBirth: '',
    isCaptain: false,
    squadStatus: 'Retained',
    cricbuzzUrl: '',
    transferFee: '₹14.00 Cr',
    transferNotes: '',
    stats: {
      matches: 0,
      runs: 0,
      wickets: 0,
      average: 0,
      strikeRate: 0,
      highest: 0,
      fifties: 0,
      hundreds: 0,
      fours: 0,
      sixes: 0,
      economy: 0,
      bestBowling: '',
    },
    careerStats: { batting: {}, bowling: {} },
    iccRankings: [],
  });

  useEffect(() => {
    if (editingPlayer) {
      setFormData({
        ...editingPlayer,
        birthPlace: (editingPlayer as any).birthPlace || '',
        teams: (editingPlayer as any).teams || '',
        squadStatus: editingPlayer.squadStatus || 'Retained',
        transferFee: (editingPlayer as any).transferFee || '',
        transferNotes: (editingPlayer as any).transferNotes || '',
        iccRankings: (editingPlayer as any).iccRankings || [],
        stats: {
          matches: editingPlayer.stats?.matches || 0,
          runs: editingPlayer.stats?.runs || 0,
          wickets: editingPlayer.stats?.wickets || 0,
          average: editingPlayer.stats?.average || 0,
          strikeRate: editingPlayer.stats?.strikeRate || 0,
          highest: editingPlayer.stats?.highest || 0,
          fifties: editingPlayer.stats?.fifties || 0,
          hundreds: editingPlayer.stats?.hundreds || 0,
          fours: editingPlayer.stats?.fours || 0,
          sixes: editingPlayer.stats?.sixes || 0,
          economy: editingPlayer.stats?.economy || 0,
          bestBowling: editingPlayer.stats?.bestBowling || '',
        },
      });
      const initialCricbuzz =
        editingPlayer.cricbuzzUrl ||
        ((editingPlayer as any).cricbuzzId ? `https://www.cricbuzz.com/profiles/${(editingPlayer as any).cricbuzzId}` : '') ||
        editingPlayer.name ||
        '';
      setCricbuzzInput(initialCricbuzz);
    } else {
      setFormData({
        name: '',
        role: 'Batsman',
        teamId: '1',
        team: 'Royal Challengers Bengaluru',
        teamShortName: 'RCB',
        league: 'ipl',
        nationality: 'India',
        birthPlace: '',
        teams: '',
        battingStyle: 'Right-handed bat',
        bowlingStyle: 'Right-arm medium',
        jerseyNumber: '',
        age: 26,
        dateOfBirth: '',
        isCaptain: false,
        squadStatus: 'Retained',
        cricbuzzUrl: '',
        transferFee: '₹14.00 Cr',
        transferNotes: '',
        stats: {
          matches: 0,
          runs: 0,
          wickets: 0,
          average: 0,
          strikeRate: 0,
          highest: 0,
          fifties: 0,
          hundreds: 0,
          fours: 0,
          sixes: 0,
          economy: 0,
          bestBowling: '',
        },
        careerStats: { batting: {}, bowling: {} },
        iccRankings: [],
      });
      setCricbuzzInput('');
    }
    setScrapeError(null);
    setScrapeSuccess(null);
    setSaveError(null);
  }, [editingPlayer, isOpen]);

  if (!isOpen) return null;

  // 1-Click Cricbuzz Scraping Handler
  const handleScrapeCricbuzz = async () => {
    const cleanInput =
      cricbuzzInput.trim() ||
      formData.name?.trim() ||
      editingPlayer?.name?.trim() ||
      '';

    if (!cleanInput) {
      setScrapeError('Please enter a Cricbuzz profile URL, ID, or player name.');
      return;
    }

    if (!cricbuzzInput.trim()) {
      setCricbuzzInput(cleanInput);
    }

    setIsScraping(true);
    setScrapeError(null);
    setScrapeSuccess(null);

    try {
      const res = await fetch('/api/admin/scrape-cricbuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cleanInput,
          cricbuzzUrl: cleanInput,
          targetInput: cleanInput,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Player profile not found on Cricbuzz.');
      }

      const bio = data.bio || {};
      const career = data.data || {};
      const iplBat = career.batting?.IPL || {};
      const iplBowl = career.bowling?.IPL || {};

      setFormData((prev: any) => ({
        ...prev,
        name: bio.name || prev.name,
        role: bio.role || prev.role,
        battingStyle: bio.battingStyle || prev.battingStyle,
        bowlingStyle: bio.bowlingStyle || prev.bowlingStyle,
        dateOfBirth: bio.dateOfBirth || prev.dateOfBirth,
        age: bio.age ? parseInt(String(bio.age), 10) : prev.age,
        nationality: bio.nationality || prev.nationality,
        birthPlace: bio.birthPlace || prev.birthPlace,
        teams: bio.teams || prev.teams,
        cricbuzzUrl: data.sourceUrl || prev.cricbuzzUrl,
        cricbuzzId: data.profileId || prev.cricbuzzId,
        careerStats: career,
        iccRankings: career.iccRankings || prev.iccRankings || [],
        stats: {
          ...prev.stats,
          runs: iplBat.Runs ? parseInt(String(iplBat.Runs), 10) : prev.stats?.runs || 0,
          wickets: iplBowl.Wkts ? parseInt(String(iplBowl.Wkts), 10) : prev.stats?.wickets || 0,
          average: iplBat.Avg ? parseFloat(String(iplBat.Avg)) : prev.stats?.average || 0,
          strikeRate: iplBat.SR ? parseFloat(String(iplBat.SR)) : prev.stats?.strikeRate || 0,
          matches: iplBat.Mat ? parseInt(String(iplBat.Mat), 10) : prev.stats?.matches || 0,
          highest: iplBat.HS ? parseInt(String(iplBat.HS), 10) : prev.stats?.highest || 0,
          fifties: iplBat['50'] ? parseInt(String(iplBat['50']), 10) : prev.stats?.fifties || 0,
          hundreds: iplBat['100'] ? parseInt(String(iplBat['100']), 10) : prev.stats?.hundreds || 0,
          fours: iplBat['4s'] ? parseInt(String(iplBat['4s']), 10) : prev.stats?.fours || 0,
          sixes: iplBat['6s'] ? parseInt(String(iplBat['6s']), 10) : prev.stats?.sixes || 0,
          economy: iplBowl.Econ ? parseFloat(String(iplBowl.Econ)) : prev.stats?.economy || 0,
          bestBowling: iplBowl.BBI || iplBowl.BBM || prev.stats?.bestBowling || '',
        },
      }));

      setScrapeSuccess(
        `✓ Verified: ${bio.name || 'player'} (${bio.birthPlace || 'Delhi'} · ${iplBat.Runs || 0} Runs · ${iplBowl.Wkts || 0} Wkts)`
      );
    } catch (err: any) {
      setScrapeError(err.message || 'Scraping failed.');
    } finally {
      setIsScraping(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setSaveError('Player name is required.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const targetTeam = IPL_2027_TEAMS.find((t) => t.id === formData.teamId) ||
        teams.find((t) => String(t.id) === String(formData.teamId));

      const payload: Player = {
        id: editingPlayer?.id || String(Date.now()),
        name: formData.name.trim(),
        role: formData.role || 'Batsman',
        teamId: formData.teamId || '',
        team: targetTeam?.name || formData.team || 'Auction Standby',
        teamShortName: targetTeam?.shortName || formData.teamShortName || 'Pool',
        league: 'ipl',
        nationality: formData.nationality || 'India',
        birthPlace: formData.birthPlace || '',
        teams: formData.teams || '',
        battingStyle: formData.battingStyle || 'Right-handed bat',
        bowlingStyle: formData.bowlingStyle || 'Right-arm medium',
        jerseyNumber: formData.jerseyNumber || '',
        age: formData.age || 25,
        dateOfBirth: formData.dateOfBirth || '',
        isCaptain: Boolean(formData.isCaptain),
        squadStatus: formData.squadStatus || 'Retained',
        cricbuzzUrl: formData.cricbuzzUrl || '',
        cricbuzzId: formData.cricbuzzId || '',
        stats: formData.stats || { runs: 0, wickets: 0, average: 0, strikeRate: 0 },
        careerStats: formData.careerStats || { batting: {}, bowling: {} },
        iccRankings: formData.iccRankings || [],
        ...(formData.transferFee ? { transferFee: formData.transferFee } : {}),
        ...(formData.transferNotes ? { transferNotes: formData.transferNotes } : {}),
      };

      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const res = await fetch('/api/players', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to save player');
      }

      onSaved(payload);
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Error saving player');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-5 bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <PlayerMonogramAvatar
                name={formData.name || 'IPL'}
                teamShortName={formData.teamShortName}
                teamId={formData.teamId}
                team={formData.team}
                jerseyNumber={formData.jerseyNumber}
                size="sm"
              />
              <div>
                <h3 className="text-base font-black text-white">
                  {editingPlayer ? `Edit Squad Record: ${editingPlayer.name}` : 'Smart Player Intake (IPL 2027)'}
                </h3>
                <p className="text-xs text-white/50">
                  {editingPlayer ? 'Review & update identity, contract, and career stats' : '1-Click auto-fill from Cricbuzz or manual squad entry'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* 1-Click Cricbuzz Scraper Bar */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/30 space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                1-Click Cricbuzz Auto-Sync
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cricbuzzInput}
                  onChange={(e) => setCricbuzzInput(e.target.value)}
                  placeholder="Paste Cricbuzz URL or type player name (e.g., Virat Kohli)..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-sky-500/30 text-xs text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
                />
                <button
                  type="button"
                  onClick={handleScrapeCricbuzz}
                  disabled={isScraping}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-sky-950/50 disabled:opacity-50 transition-all shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
                  {isScraping ? 'Fetching...' : 'Fetch'}
                </button>
              </div>
              {scrapeSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-300">
                  {scrapeSuccess}
                </div>
              )}
              {scrapeError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-400">
                  {scrapeError}
                </div>
              )}
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Player Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Jasprit Bumrah"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Primary Cricket Role</label>
                <select
                  value={formData.role || 'Batsman'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-[#f2d39a]"
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket-Keeper">Wicket-Keeper</option>
                  <option value="Mentor & Legend">Mentor & Legend</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Franchise Assignment</label>
                <select
                  value={formData.teamId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const selTeam = IPL_2027_TEAMS.find((t) => t.id === val);
                    const isPool = !val || val === 'pool' || val === 'STANDBY_2027';
                    setFormData({
                      ...formData,
                      teamId: isPool ? '' : val,
                      team: selTeam?.name || '2027 Auction Standby',
                      teamShortName: selTeam?.shortName || 'Pool',
                      squadStatus: isPool
                        ? 'Released'
                        : (formData.squadStatus === 'Released' ? 'Retained' : formData.squadStatus || 'Retained'),
                    });
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-[#f2d39a]"
                >
                  <option value="">-- Auction Pool 2027 (Unassigned) --</option>
                  {IPL_2027_TEAMS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.shortName}) · {t.remainingPurse}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">2027 Squad Status</label>
                <select
                  value={formData.squadStatus || 'Retained'}
                  onChange={(e) => setFormData({ ...formData, squadStatus: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-[#f2d39a]"
                >
                  <option value="Retained">Retained</option>
                  <option value="Traded">Traded (Player Swap / Cash)</option>
                  <option value="Released">Released to Auction Pool</option>
                  <option value="Active Squad">Active Squad</option>
                  <option value="Mentor">Retired / Franchise Mentor</option>
                  <option value="Withdrawn">Withdrawn / Injured</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Contract Valuation / Fee</label>
                <input
                  type="text"
                  value={formData.transferFee || ''}
                  onChange={(e) => setFormData({ ...formData, transferFee: e.target.value })}
                  placeholder="e.g. ₹18.00 Cr, ₹21.00 Cr, ₹50 Lakh"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Jersey Number</label>
                <input
                  type="text"
                  value={formData.jerseyNumber || ''}
                  onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                  placeholder="e.g. 18, 45, 7"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality || ''}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="e.g. India, Australia, England"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Date of Birth (Born)</label>
                <input
                  type="text"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  placeholder="e.g. 1988-11-05"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Birth Place</label>
                <input
                  type="text"
                  value={formData.birthPlace || ''}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                  placeholder="e.g. Delhi, Mumbai, Ahmedabad"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Batting Style</label>
                <input
                  type="text"
                  value={formData.battingStyle || ''}
                  onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
                  placeholder="e.g. Right Handed Bat, Left Handed Bat"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Bowling Style</label>
                <input
                  type="text"
                  value={formData.bowlingStyle || ''}
                  onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
                  placeholder="e.g. Right-arm medium, Right-arm offbreak"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
                />
              </div>
            </div>

            {/* Teams */}
            <div>
              <label className="block text-xs font-bold text-white/70 mb-1">Domestic & International Teams</label>
              <input
                type="text"
                value={formData.teams || ''}
                onChange={(e) => setFormData({ ...formData, teams: e.target.value })}
                placeholder="e.g. India, Delhi, India Red, India U19, Royal Challengers Bengaluru..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
              />
            </div>

            {/* CAREER & SEASON STATS SECTION (Explicitly Requested) */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#f2d39a]" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    IPL & Career Statistics Panel
                  </h4>
                </div>
                <span className="text-[10px] text-white/50">Auto-filled via 1-Click Fetch or manual entry</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">IPL Runs</label>
                  <input
                    type="number"
                    value={formData.stats?.runs ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, runs: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-[#f2d39a] font-black focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">IPL Wickets</label>
                  <input
                    type="number"
                    value={formData.stats?.wickets ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, wickets: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-[#a8e9ef] font-black focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">Batting Average</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stats?.average ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, average: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-emerald-400 font-bold focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">Strike Rate (SR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stats?.strikeRate ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, strikeRate: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-sky-400 font-bold focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">Matches Played</label>
                  <input
                    type="number"
                    value={formData.stats?.matches ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, matches: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">Highest Score</label>
                  <input
                    type="number"
                    value={formData.stats?.highest ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, highest: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">Fifties (50s)</label>
                  <input
                    type="number"
                    value={formData.stats?.fifties ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, fifties: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">Hundreds (100s)</label>
                  <input
                    type="number"
                    value={formData.stats?.hundreds ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, hundreds: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-amber-400 font-bold focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">Fours (4s)</label>
                  <input
                    type="number"
                    value={formData.stats?.fours ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, fours: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">Sixes (6s)</label>
                  <input
                    type="number"
                    value={formData.stats?.sixes ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, sixes: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">Bowling Economy</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stats?.economy ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, economy: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 mb-1">Best Bowling (BBI)</label>
                  <input
                    type="text"
                    value={formData.stats?.bestBowling || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: { ...formData.stats, bestBowling: e.target.value },
                      })
                    }
                    placeholder="e.g. 5/10, 4/21"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:border-[#f2d39a]"
                  />
                </div>
              </div>
            </div>

            {/* Notes / Trade Info */}
            <div>
              <label className="block text-xs font-bold text-white/70 mb-1">2027 Acquisition & Trade Notes</label>
              <textarea
                rows={2}
                value={formData.transferNotes || ''}
                onChange={(e) => setFormData({ ...formData, transferNotes: e.target.value })}
                placeholder="e.g. Blockbuster Trade: MI ➔ PBKS (₹18.00 Cr player swap with Arshdeep Singh)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
              />
            </div>

            {saveError && (
              <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold">
                {saveError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-lg shadow-teal-950/50 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Squad Record
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
