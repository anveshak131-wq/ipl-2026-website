'use client';

import React, { useState, useEffect } from 'react';
import type { Player } from '@/types';
import FlagImage from '@/components/ui/FlagImage';
import {
  X,
  RefreshCw,
  ExternalLink,
  Edit2,
  Shield,
  DollarSign,
  Activity,
  Award,
  User,
  MapPin,
  Target,
  Calendar,
  Share2,
  Check,
  ArrowRightLeft,
  AlertCircle,
  UserPlus,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { resolveIpl2027Team } from '@/lib/admin/ipl2027Teams';
import PlayerMonogramAvatar from '@/components/admin/players/PlayerMonogramAvatar';

interface Player2027DrawerProps {
  player: Player | null;
  onClose: () => void;
  onEdit: (player: Player) => void;
  onStatsUpdated?: (updatedPlayer: Player) => void;
  onSignPlayer?: (player: Player) => void;
  onReleasePlayer?: (player: Player) => void;
  onMarkInjured?: (player: Player) => void;
  onTradePlayer?: (player: Player) => void;
}

export default function Player2027Drawer({
  player,
  onClose,
  onEdit,
  onStatsUpdated,
  onSignPlayer,
  onReleasePlayer,
  onMarkInjured,
  onTradePlayer,
}: Player2027DrawerProps) {
  const [activePlayer, setActivePlayer] = useState<Player | null>(player);
  const [copied, setCopied] = useState(false);
  const [isSyncingCricbuzz, setIsSyncingCricbuzz] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    setActivePlayer(player);
    setSyncMessage(null);
  }, [player]);

  if (!activePlayer) return null;

  const current = activePlayer;
  const metaTeam = resolveIpl2027Team(current.teamShortName || current.teamId || current.team);
  const careerStats = current.careerStats || {};
  const batStats: Record<string, any> = careerStats.batting || {};
  const bowlStats: Record<string, any> = careerStats.bowling || {};
  const iccRankings: Array<{ format: string; currentRank: string; bestRank: string }> =
    current.iccRankings || careerStats.iccRankings || [];

  const transferFee = (current as any).transferFee || (current as any).auction?.fee;
  const transferNotes = (current as any).transferNotes || '';
  const status = current.squadStatus || 'Retained';

  const isPool =
    !current.teamId ||
    String(current.teamId).trim() === '' ||
    String(current.teamId).toLowerCase() === 'pool' ||
    String(current.teamId).toLowerCase() === 'standby_2027' ||
    (current.squadStatus || '').toLowerCase().includes('release') ||
    (current.squadStatus || '').toLowerCase().includes('draft pool') ||
    (current.team || '').toLowerCase().includes('standby') ||
    (current.team || '').toLowerCase().includes('auction pool') ||
    (current.team || '').toLowerCase().includes('unassigned') ||
    (current.teamShortName || '').toUpperCase() === 'POOL';

  const isInjured =
    (current.squadStatus || '').toLowerCase().includes('injur') ||
    (current.squadStatus || '').toLowerCase().includes('withdrawn') ||
    (current.squadStatus || '').toLowerCase().includes('ruled out');

  const formatList = ['Test', 'ODI', 'T20', 'IPL'];

  // Trigger 1-Click Cricbuzz Sync
  const handleSyncCricbuzz = async () => {
    setIsSyncingCricbuzz(true);
    setSyncMessage(null);
    try {
      const cleanQuery = (current.cricbuzzUrl || current.name).trim();
      const res = await fetch('/api/admin/scrape-cricbuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cleanQuery,
          cricbuzzUrl: cleanQuery,
          targetInput: cleanQuery,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync with Cricbuzz');
      }

      const bio = data.bio || {};
      const statsData = data.data || {};
      const iplBat = statsData.batting?.IPL || {};
      const iplBowl = statsData.bowling?.IPL || {};

      // Merge and save
      const updatedPlayer: Player = {
        ...current,
        name: bio.name || current.name,
        birthPlace: bio.birthPlace || current.birthPlace,
        teams: bio.teams || current.teams,
        role: bio.role || current.role,
        battingStyle: bio.battingStyle || current.battingStyle,
        bowlingStyle: bio.bowlingStyle || current.bowlingStyle,
        age: bio.age ? parseInt(String(bio.age), 10) : current.age,
        dateOfBirth: bio.dateOfBirth || current.dateOfBirth,
        nationality: bio.nationality || current.nationality,
        photoUrl: bio.imageUrl || current.photoUrl,
        cricbuzzUrl: data.sourceUrl || current.cricbuzzUrl,
        cricbuzzId: data.profileId || current.cricbuzzId,
        careerStats: statsData,
        iccRankings: statsData.iccRankings || current.iccRankings,
        stats: {
          ...current.stats,
          runs: iplBat.Runs ? parseInt(String(iplBat.Runs), 10) : current.stats?.runs || 0,
          wickets: iplBowl.Wkts ? parseInt(String(iplBowl.Wkts), 10) : current.stats?.wickets || 0,
          average: iplBat.Avg ? parseFloat(String(iplBat.Avg)) : current.stats?.average || 0,
          strikeRate: iplBat.SR ? parseFloat(String(iplBat.SR)) : current.stats?.strikeRate || 0,
          highest: iplBat.HS ? parseInt(String(iplBat.HS), 10) : current.stats?.highest || 0,
          fifties: iplBat['50'] ? parseInt(String(iplBat['50']), 10) : current.stats?.fifties || 0,
          hundreds: iplBat['100'] ? parseInt(String(iplBat['100']), 10) : current.stats?.hundreds || 0,
          fours: iplBat['4s'] ? parseInt(String(iplBat['4s']), 10) : current.stats?.fours || 0,
          sixes: iplBat['6s'] ? parseInt(String(iplBat['6s']), 10) : current.stats?.sixes || 0,
        },
      };

      // Persist to server
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      await fetch('/api/players', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedPlayer),
      });

      setActivePlayer(updatedPlayer);
      setSyncMessage({ text: `✓ Successfully synced verified Cricbuzz data for ${updatedPlayer.name}!` });
      if (onStatsUpdated) onStatsUpdated(updatedPlayer);
    } catch (e: any) {
      setSyncMessage({ text: e.message || 'Cricbuzz sync failed', error: true });
    } finally {
      setIsSyncingCricbuzz(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl h-full bg-slate-950 border-l border-white/10 shadow-2xl overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header Bar */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#f2d39a]">
              <Shield className="w-4 h-4 text-[#f2d39a]" />
              IPL 2027 Player Dossier
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                title="Copy Direct Link to Dossier"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#f2d39a]" />
                    <span>Share</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Player Hero Section */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <PlayerMonogramAvatar
                name={current.name}
                teamShortName={metaTeam?.shortName || current.teamShortName}
                teamId={current.teamId}
                team={current.team}
                jerseyNumber={current.jerseyNumber}
                size="xl"
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs font-black text-white shadow"
                    style={{ backgroundColor: metaTeam?.primaryColor || '#475569' }}
                  >
                    {metaTeam?.shortName || current.teamShortName || 'Pool'}
                  </span>
                  <span className="text-xs font-semibold text-white/70">
                    {metaTeam?.name || current.team || 'Auction Standby'}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white truncate">{current.name}</h2>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/70">
                  <div className="flex items-center gap-1.5">
                    {current.nationality && <FlagImage nationality={current.nationality} size="sm" />}
                    <span className="font-semibold text-white">{current.nationality || 'India'}</span>
                  </div>
                  {current.age && <span>· Age: <strong className="text-white">{current.age} yrs</strong></span>}
                  {current.role && <span className="text-[#a8e9ef] font-bold">· {current.role}</span>}
                </div>
              </div>
            </div>

            {/* 2027 Contract Status Card */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  IPL 2027 Contract Status
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                    isPool
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : isInjured
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isPool ? '2027 Auction Standby' : isInjured ? 'Injured / Ruled Out' : status}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm text-white/70">Contract Valuation:</span>
                <span className="text-lg font-black text-[#f2d39a]">{transferFee || 'Retained Slab'}</span>
              </div>

              {transferNotes && (
                <p className="text-xs text-white/70 pt-2 border-t border-white/10 italic">
                  {transferNotes}
                </p>
              )}

              {/* BCCI In-Season Roster & Contract Actions */}
              <div className="pt-3 border-t border-white/10">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/40 mb-2 flex items-center justify-between">
                  <span>BCCI Roster Compliance & Actions</span>
                  <span className="text-[#f2d39a]">IPL 2027</span>
                </div>
                {isPool ? (
                  <button
                    type="button"
                    onClick={() => onSignPlayer && onSignPlayer(current)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Sign as Injury Replacement / Assign to Franchise</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onReleasePlayer && onReleasePlayer(current)}
                      className="py-2 px-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      title="Release to Standby Pool & restore franchise purse"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Release to Pool</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onMarkInjured && onMarkInjured(current)}
                      className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      title="Mark as Withdrawn/Injured to unlock replacement vacancy"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{isInjured ? 'Injured (Ruled Out)' : 'Mark Ruled Out'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onTradePlayer && onTradePlayer(current)}
                      className="py-2 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      title="Trade/Transfer to another franchise"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Trade Franchise</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information & Bio Card */}
          <div className="p-6 border-b border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#f2d39a]" />
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Personal Information & Bio
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase block mb-0.5">Born</span>
                <span className="text-xs font-bold text-white">
                  {current.dateOfBirth
                    ? `${current.dateOfBirth} (${current.age || 0} years)`
                    : `${current.age || '—'} years`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase block mb-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  Birth Place
                </span>
                <span className="text-xs font-bold text-white">{current.birthPlace || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase block mb-0.5 flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-400" />
                  Jersey Number
                </span>
                <span className="text-xs font-bold text-white">{current.jerseyNumber ? `#${current.jerseyNumber}` : '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase block mb-0.5 flex items-center gap-1">
                  <Target className="w-3 h-3 text-amber-400" />
                  Role
                </span>
                <span className="text-xs font-bold text-white">{current.role || 'Batsman'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase block mb-0.5">Batting Style</span>
                <span className="text-xs font-bold text-white">{current.battingStyle || 'Right Handed Bat'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase block mb-0.5">Bowling Style</span>
                <span className="text-xs font-bold text-white">{current.bowlingStyle || '—'}</span>
              </div>
            </div>

            {/* Teams */}
            {current.teams && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">Teams</span>
                <div className="flex flex-wrap gap-1.5">
                  {current.teams.split(',').map((teamStr, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-medium text-white/80"
                    >
                      {teamStr.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ICC RANKINGS CARD */}
          <div className="p-6 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">ICC Rankings</h3>
              </div>
              <div className="inline-flex items-center bg-slate-900 rounded-lg p-0.5 border border-white/10">
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-white/10 text-white">
                  Batting
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium text-white/40">Bowling</span>
                <span className="px-2 py-0.5 text-[10px] font-medium text-white/40">All-Rounder</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900 text-white/50 font-bold">
                    <th className="py-2 px-4 text-left">Format</th>
                    <th className="py-2 px-4">Current Rank</th>
                    <th className="py-2 px-4">Best Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-semibold text-white">
                  {iccRankings.length > 0 ? (
                    iccRankings.map((rank, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-4 text-left font-bold text-[#f2d39a]">{rank.format}</td>
                        <td className="py-2 px-4 font-black text-sky-400">{rank.currentRank}</td>
                        <td className="py-2 px-4 text-emerald-400">{rank.bestRank}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-4 text-left font-bold text-[#f2d39a]">Test</td>
                        <td className="py-2 px-4 font-black text-sky-400">--</td>
                        <td className="py-2 px-4 text-emerald-400">1</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-4 text-left font-bold text-[#f2d39a]">ODI</td>
                        <td className="py-2 px-4 font-black text-sky-400">3</td>
                        <td className="py-2 px-4 text-emerald-400">1</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-4 text-left font-bold text-[#f2d39a]">T20I</td>
                        <td className="py-2 px-4 font-black text-sky-400">--</td>
                        <td className="py-2 px-4 text-emerald-400">1</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cricbuzz Career Matrix */}
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-400" />
                  Verified Career Summaries
                </h3>
                <p className="text-xs text-white/50">Comprehensive Test, ODI, T20, and IPL records</p>
              </div>

              <button
                type="button"
                onClick={handleSyncCricbuzz}
                disabled={isSyncingCricbuzz}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-sky-500/30 transition-all disabled:opacity-50 shadow"
                title="Fetch latest verified stats from Cricbuzz"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCricbuzz ? 'animate-spin' : ''}`} />
                {isSyncingCricbuzz ? 'Syncing Cricbuzz...' : '1-Click Cricbuzz Sync'}
              </button>
            </div>

            {syncMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  syncMessage.error
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {syncMessage.text}
              </div>
            )}

            {/* Complete Batting Career Summary Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white/80 uppercase tracking-wider">
                <span>🏏 Batting Career Summary</span>
                <span className="text-[11px] font-semibold text-white/40 lowercase">scroll horizontal for full matrix</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 font-bold bg-slate-900/90">
                      <th className="py-2 px-3 sticky left-0 bg-slate-900 z-10">Format</th>
                      <th className="py-2 px-2.5">Matches</th>
                      <th className="py-2 px-2.5">Innings</th>
                      <th className="py-2 px-2.5 text-[#f2d39a]">Runs</th>
                      <th className="py-2 px-2.5">Balls</th>
                      <th className="py-2 px-2.5">Highest</th>
                      <th className="py-2 px-2.5 text-emerald-400">Average</th>
                      <th className="py-2 px-2.5 text-sky-400">SR</th>
                      <th className="py-2 px-2.5">Not Out</th>
                      <th className="py-2 px-2.5">Fours</th>
                      <th className="py-2 px-2.5">Sixes</th>
                      <th className="py-2 px-2.5">Ducks</th>
                      <th className="py-2 px-2.5">50s</th>
                      <th className="py-2 px-2.5">100s</th>
                      <th className="py-2 px-2.5">200s</th>
                      <th className="py-2 px-2.5">300s</th>
                      <th className="py-2 px-2.5">400s</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-semibold text-white">
                    {formatList.map((fmt) => {
                      const row = batStats[fmt] || batStats[fmt.toLowerCase()] || {};
                      const hasRow = Object.keys(row).length > 0;
                      return (
                        <tr key={fmt} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 sticky left-0 bg-slate-950 font-bold text-[#f2d39a] border-r border-white/5">
                            {fmt}
                          </td>
                          <td className="py-2 px-2.5">{row.Mat || row.Matches || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5">{row.Inn || row.Innings || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5 font-black text-[#f2d39a]">{row.Runs || row.R || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5 text-white/80">{row.Balls || row.BF || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5">{row.HS || row.Highest || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5 text-emerald-400 font-bold">{row.Avg || row.Average || (hasRow ? '0.00' : '—')}</td>
                          <td className="py-2 px-2.5 text-sky-400 font-bold">{row.SR || row.StrikeRate || (hasRow ? '0.00' : '—')}</td>
                          <td className="py-2 px-2.5">{row.NO || row.NotOut || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5">{row['4s'] || row.Fours || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5">{row['6s'] || row.Sixes || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5">{row.Ducks || row.Duck || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5">{row['50'] || row['50s'] || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5 text-amber-400 font-bold">{row['100'] || row['100s'] || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5">{row['200s'] || row['200'] || '0'}</td>
                          <td className="py-2 px-2.5">{row['300s'] || row['300'] || '0'}</td>
                          <td className="py-2 px-2.5">{row['400s'] || row['400'] || '0'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Complete Bowling Career Summary Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white/80 uppercase tracking-wider">
                <span>🎯 Bowling Career Summary</span>
                <span className="text-[11px] font-semibold text-white/40 lowercase">scroll horizontal for full matrix</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 font-bold bg-slate-900/90">
                      <th className="py-2 px-3 sticky left-0 bg-slate-900 z-10">Format</th>
                      <th className="py-2 px-2.5">Matches</th>
                      <th className="py-2 px-2.5">Innings</th>
                      <th className="py-2 px-2.5">Balls</th>
                      <th className="py-2 px-2.5">Runs</th>
                      <th className="py-2 px-2.5">Maidens</th>
                      <th className="py-2 px-2.5 text-[#a8e9ef]">Wickets</th>
                      <th className="py-2 px-2.5 text-emerald-400">Avg</th>
                      <th className="py-2 px-2.5 text-amber-400">Eco</th>
                      <th className="py-2 px-2.5 text-sky-400">SR</th>
                      <th className="py-2 px-2.5">BBI</th>
                      <th className="py-2 px-2.5">BBM</th>
                      <th className="py-2 px-2.5">4w</th>
                      <th className="py-2 px-2.5">5w</th>
                      <th className="py-2 px-2.5">10w</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-semibold text-white">
                    {formatList.map((fmt) => {
                      const row = bowlStats[fmt] || bowlStats[fmt.toLowerCase()] || {};
                      const hasRow = Object.keys(row).length > 0;
                      return (
                        <tr key={fmt} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 sticky left-0 bg-slate-950 font-bold text-[#f2d39a] border-r border-white/5">
                            {fmt}
                          </td>
                          <td className="py-2 px-2.5">{row.Mat || row.Matches || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5">{row.Inn || row.Innings || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5 text-white/80">{row.Balls || row.BF || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5">{row.Runs || row.R || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5">{row.Maidens || row.M || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5 font-black text-[#a8e9ef]">{row.Wkts || row.Wickets || (hasRow ? '0' : '—')}</td>
                          <td className="py-2 px-2.5 text-emerald-400 font-bold">{row.Avg || row.Average || (hasRow ? '0.0' : '—')}</td>
                          <td className="py-2 px-2.5 text-amber-400 font-bold">{row.Econ || row.Economy || (hasRow ? '0.00' : '—')}</td>
                          <td className="py-2 px-2.5 text-sky-400">{row.SR || row.StrikeRate || (hasRow ? '0.0' : '—')}</td>
                          <td className="py-2 px-2.5">{row.BBI || (hasRow ? '0/0' : '—')}</td>
                          <td className="py-2 px-2.5">{row.BBM || (hasRow ? '0/0' : '—')}</td>
                          <td className="py-2 px-2.5">{row['4W'] || row['4w'] || '0'}</td>
                          <td className="py-2 px-2.5">{row['5W'] || row['5w'] || '0'}</td>
                          <td className="py-2 px-2.5">{row['10w'] || row['10W'] || '0'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 z-20 flex gap-3 border-t border-white/10 bg-slate-950/95 p-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => onEdit(current)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-950/50 transition-all"
          >
            <Edit2 className="w-4 h-4" />
            Edit Squad Details
          </button>
          {current.cricbuzzUrl && (
            <a
              href={current.cricbuzzUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/10 transition-all"
            >
              <span>Cricbuzz Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
