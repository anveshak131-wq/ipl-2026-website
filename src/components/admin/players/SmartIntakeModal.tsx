'use client';

import React, { useState, useEffect } from 'react';
import type { Player, Team } from '@/types';
import { X, RefreshCw, Sparkles, User, Shield, DollarSign, Check, Award, MapPin, Ruler } from 'lucide-react';
import { IPL_2027_TEAMS } from '@/lib/admin/ipl2027Teams';

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
    height: '',
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
    stats: { matches: 0, runs: 0, wickets: 0, average: 0, strikeRate: 0 },
    careerStats: { batting: {}, bowling: {} },
    iccRankings: [],
  });

  useEffect(() => {
    if (editingPlayer) {
      setFormData({
        ...editingPlayer,
        birthPlace: (editingPlayer as any).birthPlace || '',
        height: (editingPlayer as any).height || '',
        teams: (editingPlayer as any).teams || '',
        squadStatus: editingPlayer.squadStatus || 'Retained',
        transferFee: (editingPlayer as any).transferFee || '',
        transferNotes: (editingPlayer as any).transferNotes || '',
        iccRankings: (editingPlayer as any).iccRankings || [],
      });
      setCricbuzzInput(editingPlayer.cricbuzzUrl || '');
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
        height: '',
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
        stats: { matches: 0, runs: 0, wickets: 0, average: 0, strikeRate: 0 },
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
    if (!cricbuzzInput.trim()) {
      setScrapeError('Please enter a Cricbuzz profile URL, ID, or player name.');
      return;
    }

    setIsScraping(true);
    setScrapeError(null);
    setScrapeSuccess(null);

    try {
      const cleanInput = cricbuzzInput.trim();
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

      setFormData((prev) => ({
        ...prev,
        name: bio.name || prev.name,
        role: bio.role || prev.role,
        battingStyle: bio.battingStyle || prev.battingStyle,
        bowlingStyle: bio.bowlingStyle || prev.bowlingStyle,
        dateOfBirth: bio.dateOfBirth || prev.dateOfBirth,
        age: bio.age ? parseInt(String(bio.age), 10) : prev.age,
        nationality: bio.nationality || prev.nationality,
        birthPlace: bio.birthPlace || (prev as any).birthPlace,
        height: bio.height || (prev as any).height,
        teams: bio.teams || (prev as any).teams,
        photoUrl: bio.imageUrl || prev.photoUrl,
        cricbuzzUrl: data.sourceUrl || prev.cricbuzzUrl,
        cricbuzzId: data.profileId || prev.cricbuzzId,
        careerStats: career,
        iccRankings: career.iccRankings || (prev as any).iccRankings || [],
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
        },
      }));

      setScrapeSuccess(`✓ Verified stats & bio fetched: ${bio.name || 'player'} (${bio.birthPlace || 'Birthplace synced'}, ${bio.height || 'Height synced'})`);
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
        birthPlace: (formData as any).birthPlace || '',
        height: (formData as any).height || '',
        teams: (formData as any).teams || '',
        battingStyle: formData.battingStyle || 'Right-handed bat',
        bowlingStyle: formData.bowlingStyle || 'Right-arm medium',
        jerseyNumber: formData.jerseyNumber || '',
        age: formData.age || 25,
        dateOfBirth: formData.dateOfBirth || '',
        isCaptain: Boolean(formData.isCaptain),
        squadStatus: formData.squadStatus || 'Retained',
        photoUrl: formData.photoUrl || '',
        cricbuzzUrl: formData.cricbuzzUrl || '',
        cricbuzzId: formData.cricbuzzId || '',
        stats: formData.stats || { runs: 0, wickets: 0, average: 0, strikeRate: 0 },
        careerStats: formData.careerStats || { batting: {}, bowling: {} },
        iccRankings: (formData as any).iccRankings || [],
        ...((formData as any).transferFee ? { transferFee: (formData as any).transferFee } : {}),
        ...((formData as any).transferNotes ? { transferNotes: (formData as any).transferNotes } : {}),
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
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#f2d39a] to-amber-600 flex items-center justify-center text-slate-950 shadow">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {editingPlayer ? 'Edit Squad Record' : 'Smart Player Intake (IPL 2027)'}
                </h3>
                <p className="text-xs text-white/50">
                  {editingPlayer ? `Updating ${editingPlayer.name}` : '1-Click auto-fill from Cricbuzz or manual assignment'}
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
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
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
                    const selTeam = IPL_2027_TEAMS.find((t) => t.id === e.target.value);
                    setFormData({
                      ...formData,
                      teamId: e.target.value,
                      team: selTeam?.name || '2027 Auction Standby',
                      teamShortName: selTeam?.shortName || 'Pool',
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
                  onChange={(e) => setFormData({ ...formData, squadStatus: e.target.value as any })}
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
                  value={(formData as any).transferFee || ''}
                  onChange={(e) => setFormData({ ...formData, transferFee: e.target.value } as any)}
                  placeholder="e.g. ₹18.00 Cr, ₹21.00 Cr, ₹50 Lakh"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Jersey Number</label>
                <input
                  type="text"
                  value={formData.jerseyNumber || ''}
                  onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value as any })}
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
                  value={(formData as any).birthPlace || ''}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value } as any)}
                  placeholder="e.g. Delhi, Mumbai, Ahmedabad"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Height</label>
                <input
                  type="text"
                  value={(formData as any).height || ''}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value } as any)}
                  placeholder="e.g. 5 ft 9 in (175 cm)"
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
                value={(formData as any).teams || ''}
                onChange={(e) => setFormData({ ...formData, teams: e.target.value } as any)}
                placeholder="e.g. India, Delhi, India Red, India U19, Royal Challengers Bengaluru..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f2d39a]"
              />
            </div>

            {/* Notes / Trade Info */}
            <div>
              <label className="block text-xs font-bold text-white/70 mb-1">2027 Acquisition & Trade Notes</label>
              <textarea
                rows={2}
                value={(formData as any).transferNotes || ''}
                onChange={(e) => setFormData({ ...formData, transferNotes: e.target.value } as any)}
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
