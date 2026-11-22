'use client';

import React, { useState } from 'react';
import type { Player, Team } from '@/types';
import FlagImage from '@/components/ui/FlagImage';
import { X, RefreshCw, ExternalLink, Edit2, Shield, Award, Calendar, DollarSign, Activity } from 'lucide-react';
import { resolveIpl2027Team } from '@/lib/admin/ipl2027Teams';

interface Player2027DrawerProps {
  player: Player | null;
  onClose: () => void;
  onEdit: (player: Player) => void;
  onStatsUpdated?: (updatedPlayer: Player) => void;
}

export default function Player2027Drawer({
  player,
  onClose,
  onEdit,
  onStatsUpdated,
}: Player2027DrawerProps) {
  const [activeFormat, setActiveFormat] = useState<'IPL' | 'T20I' | 'ODI' | 'Test'>('IPL');
  const [isSyncingCricbuzz, setIsSyncingCricbuzz] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; error?: boolean } | null>(null);

  if (!player) return null;

  const metaTeam = resolveIpl2027Team(player.teamShortName || player.teamId || player.team);
  const batStats = (player as any).careerStats?.batting || {};
  const bowlStats = (player as any).careerStats?.bowling || {};
  const formats: ('IPL' | 'T20I' | 'ODI' | 'Test')[] = ['IPL', 'T20I', 'ODI', 'Test'];

  const transferFee = (player as any).transferFee || (player as any).auction?.fee;
  const transferNotes = (player as any).transferNotes || '';
  const status = (player.squadStatus || 'Retained');

  // Trigger Cricbuzz Scrape Sync
  const handleSyncCricbuzz = async () => {
    setIsSyncingCricbuzz(true);
    setSyncMessage(null);
    try {
      const targetQuery = player.cricbuzzUrl || player.name;
      const res = await fetch('/api/admin/scrape-cricbuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cricbuzzUrl: player.cricbuzzUrl || undefined,
          targetInput: targetQuery,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync with Cricbuzz');
      }

      // Merge and save
      const updatedPlayer: Player = {
        ...player,
        cricbuzzUrl: data.sourceUrl || player.cricbuzzUrl,
        cricbuzzId: data.profileId || player.cricbuzzId,
        careerStats: data.data || player.careerStats,
        stats: {
          ...player.stats,
          runs: data.data?.batting?.IPL?.Runs || player.stats?.runs || 0,
          wickets: data.data?.bowling?.IPL?.Wkts || player.stats?.wickets || 0,
          average: data.data?.batting?.IPL?.Avg || player.stats?.average || 0,
          strikeRate: data.data?.batting?.IPL?.SR || player.stats?.strikeRate || 0,
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

      setSyncMessage({ text: '✓ Successfully synchronized latest stats with Cricbuzz!' });
      if (onStatsUpdated) onStatsUpdated(updatedPlayer);
    } catch (e: any) {
      setSyncMessage({ text: e.message || 'Cricbuzz sync failed', error: true });
    } finally {
      setIsSyncingCricbuzz(false);
    }
  };

  const currentBat = batStats[activeFormat] || batStats[activeFormat.toLowerCase()] || {};
  const currentBowl = bowlStats[activeFormat] || bowlStats[activeFormat.toLowerCase()] || {};

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl h-full bg-slate-950 border-l border-white/10 shadow-2xl overflow-y-auto flex flex-col justify-between"
      >
        <div>
          {/* Header Bar */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/90 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#f2d39a]">
              <Shield className="w-4 h-4 text-[#f2d39a]" />
              IPL 2027 Player Dossier
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Player Hero Section */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div
                className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-[#f2d39a] bg-slate-800 shadow-xl flex items-center justify-center shrink-0"
                style={{ borderColor: metaTeam?.primaryColor }}
              >
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-white">{player.name.charAt(0)}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs font-black text-white shadow"
                    style={{ backgroundColor: metaTeam?.primaryColor || '#475569' }}
                  >
                    {metaTeam?.shortName || player.teamShortName || 'Pool'}
                  </span>
                  <span className="text-xs font-semibold text-white/60">
                    {metaTeam?.name || player.team || 'Auction Standby'}
                  </span>
                  {player.jerseyNumber && (
                    <span className="text-xs font-black text-[#f2d39a]">#{player.jerseyNumber}</span>
                  )}
                </div>

                <h2 className="text-2xl font-black text-white truncate">{player.name}</h2>

                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <div className="flex items-center gap-1.5">
                    {player.nationality && <FlagImage nationality={player.nationality} size="sm" />}
                    <span>{player.nationality || 'India'}</span>
                  </div>
                  {player.age && <span>· Age: {player.age} yrs</span>}
                  {player.role && <span className="text-[#a8e9ef]">· {player.role}</span>}
                </div>
              </div>
            </div>

            {/* 2027 Contract Status Card */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  IPL 2027 Contract Status
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {status}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm text-white/70">Contract Valuation:</span>
                <span className="text-lg font-black text-[#f2d39a]">{transferFee || 'Retained Slab'}</span>
              </div>

              {transferNotes && (
                <p className="text-xs text-white/60 pt-1 border-t border-white/10 italic">
                  {transferNotes}
                </p>
              )}
            </div>
          </div>

          {/* Cricbuzz Career Matrix */}
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-400" />
                  Career Performance Matrix
                </h3>
                <p className="text-xs text-white/50">Verified career stats across all cricket formats</p>
              </div>

              <button
                type="button"
                onClick={handleSyncCricbuzz}
                disabled={isSyncingCricbuzz}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-sky-500/30 transition-all disabled:opacity-50"
                title="Fetch latest verified stats from Cricbuzz"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCricbuzz ? 'animate-spin' : ''}`} />
                {isSyncingCricbuzz ? 'Syncing...' : '1-Click Cricbuzz Sync'}
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

            {/* Format Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              {formats.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setActiveFormat(fmt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFormat === fmt
                      ? 'bg-[#f2d39a] text-slate-950 shadow-md'
                      : 'bg-slate-900 text-white/60 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* Batting Career Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-white/70 uppercase tracking-wider">
                🏏 Batting Statistics ({activeFormat})
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 font-bold">
                      <th className="py-1.5">Mat</th>
                      <th className="py-1.5">Inn</th>
                      <th className="py-1.5 text-[#f2d39a]">Runs</th>
                      <th className="py-1.5">HS</th>
                      <th className="py-1.5 text-emerald-400">Avg</th>
                      <th className="py-1.5 text-sky-400">SR</th>
                      <th className="py-1.5">100s</th>
                      <th className="py-1.5">50s</th>
                      <th className="py-1.5">4s/6s</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-semibold text-white">
                    <tr>
                      <td className="py-2">{currentBat.Mat || currentBat.Matches || currentBat.M || '—'}</td>
                      <td className="py-2">{currentBat.Inn || currentBat.Innings || '—'}</td>
                      <td className="py-2 font-black text-[#f2d39a]">{currentBat.Runs || currentBat.R || player.stats?.runs || '0'}</td>
                      <td className="py-2">{currentBat.HS || currentBat.Highest || '—'}</td>
                      <td className="py-2 text-emerald-400">{currentBat.Avg || currentBat.Average || '0.00'}</td>
                      <td className="py-2 text-sky-400">{currentBat.SR || currentBat.StrikeRate || '0.00'}</td>
                      <td className="py-2">{currentBat['100s'] || currentBat['100'] || '0'}</td>
                      <td className="py-2">{currentBat['50s'] || currentBat['50'] || '0'}</td>
                      <td className="py-2">{currentBat['4s'] || 0}/{currentBat['6s'] || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bowling Career Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-white/70 uppercase tracking-wider">
                🎯 Bowling Statistics ({activeFormat})
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 font-bold">
                      <th className="py-1.5">Mat</th>
                      <th className="py-1.5">Inn</th>
                      <th className="py-1.5 text-[#a8e9ef]">Wkts</th>
                      <th className="py-1.5">BBM</th>
                      <th className="py-1.5 text-emerald-400">Avg</th>
                      <th className="py-1.5 text-amber-400">Econ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-semibold text-white">
                    <tr>
                      <td className="py-2">{currentBowl.Mat || currentBowl.Matches || '—'}</td>
                      <td className="py-2">{currentBowl.Inn || currentBowl.Innings || '—'}</td>
                      <td className="py-2 font-black text-[#a8e9ef]">{currentBowl.Wkts || currentBowl.Wickets || player.stats?.wickets || '0'}</td>
                      <td className="py-2">{currentBowl.BBM || currentBowl.Best || '—'}</td>
                      <td className="py-2 text-emerald-400">{currentBowl.Avg || currentBowl.Average || '—'}</td>
                      <td className="py-2 text-amber-400">{currentBowl.Econ || currentBowl.Economy || '—'}</td>
                    </tr>
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
            onClick={() => onEdit(player)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-950/50 transition-all"
          >
            <Edit2 className="w-4 h-4" />
            Edit Squad Details
          </button>
          {player.cricbuzzUrl && (
            <a
              href={player.cricbuzzUrl}
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
