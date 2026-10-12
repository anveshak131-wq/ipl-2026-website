'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/data';
import { Match, Player, Team } from '@/types';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RefreshCw, 
  Crown, 
  ShieldCheck,
  Calendar,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const FIXTURES_STORAGE_KEY = 'wpl_matches_fixtures_v2027';

export default function WplPlaying11ConfirmationPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [team1Lineup, setTeam1Lineup] = useState<string[]>([]);
  const [team2Lineup, setTeam2Lineup] = useState<string[]>([]);
  const [team1Captain, setTeam1Captain] = useState<string>('');
  const [team1Keeper, setTeam1Keeper] = useState<string>('');
  const [team2Captain, setTeam2Captain] = useState<string>('');
  const [team2Keeper, setTeam2Keeper] = useState<string>('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [apiMatches, apiPlayers, apiTeams] = await Promise.all([
        api.getMatches('wpl').catch(() => []),
        api.getPlayers(undefined, 'wpl').catch(() => []),
        api.getTeams('wpl').catch(() => []),
      ]);

      let localFixtures: any[] = [];
      try {
        const raw = localStorage.getItem(FIXTURES_STORAGE_KEY);
        if (raw) localFixtures = JSON.parse(raw);
      } catch (e) {
        console.warn('Failed parsing local fixtures', e);
      }

      const combinedMatches = [...apiMatches];
      localFixtures.forEach((lf: any) => {
        if (!combinedMatches.some((m) => String(m.id) === String(lf.id))) {
          combinedMatches.push({
            id: lf.id,
            matchNumber: lf.matchNumber,
            date: lf.scheduledStartTime ? lf.scheduledStartTime.split('T')[0] : '2027',
            time: lf.scheduledStartTime ? lf.scheduledStartTime.split('T')[1]?.slice(0, 5) : '19:30',
            team1: { id: lf.teamAId, name: lf.teamAId?.toUpperCase(), shortName: lf.teamAId?.toUpperCase() },
            team2: { id: lf.teamBId, name: lf.teamBId?.toUpperCase(), shortName: lf.teamBId?.toUpperCase() },
            status: lf.status?.toLowerCase() || 'upcoming',
            league: 'wpl',
            playing11: lf.playing11 || null,
          });
        }
      });

      setMatches(combinedMatches);
      setPlayers(apiPlayers);
      setTeams(apiTeams);

      if (combinedMatches.length > 0) {
        setSelectedMatchId((prev) => (prev && combinedMatches.some((m) => String(m.id) === prev) ? prev : String(combinedMatches[0].id)));
      }
    } catch (err) {
      console.error('Failed loading Playing 11 data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedMatch = useMemo(() => {
    return matches.find((m) => String(m.id) === String(selectedMatchId)) || null;
  }, [matches, selectedMatchId]);

  useEffect(() => {
    if (!selectedMatch) return;
    const p11 = selectedMatch.playing11;
    if (p11) {
      const t1 = Array.isArray(p11.team1) ? p11.team1 : p11.team1?.players || [];
      const t2 = Array.isArray(p11.team2) ? p11.team2 : p11.team2?.players || [];
      setTeam1Lineup(t1);
      setTeam2Lineup(t2);
      setTeam1Captain(p11.team1?.captain || t1[0] || '');
      setTeam1Keeper(p11.team1?.wicketKeeper || '');
      setTeam2Captain(p11.team2?.captain || t2[0] || '');
      setTeam2Keeper(p11.team2?.wicketKeeper || '');
    } else {
      setTeam1Lineup([]);
      setTeam2Lineup([]);
      setTeam1Captain('');
      setTeam1Keeper('');
      setTeam2Captain('');
      setTeam2Keeper('');
    }
  }, [selectedMatch]);

  const normalizeId = (val: any) => String(val || '').toLowerCase().replace(/^(team\s*|wpl-)/, '');

  const team1Squad = useMemo(() => {
    if (!selectedMatch) return [];
    const t1Id = normalizeId(selectedMatch.team1?.id || selectedMatch.team1Id);
    return players.filter((p) => normalizeId(p.teamId) === t1Id || normalizeId((p as any).team) === t1Id);
  }, [players, selectedMatch]);

  const team2Squad = useMemo(() => {
    if (!selectedMatch) return [];
    const t2Id = normalizeId(selectedMatch.team2?.id || selectedMatch.team2Id);
    return players.filter((p) => normalizeId(p.teamId) === t2Id || normalizeId((p as any).team) === t2Id);
  }, [players, selectedMatch]);

  const togglePlayer = (team: 'team1' | 'team2', playerId: string) => {
    if (team === 'team1') {
      setTeam1Lineup((prev) => {
        if (prev.includes(playerId)) {
          if (team1Captain === playerId) setTeam1Captain('');
          if (team1Keeper === playerId) setTeam1Keeper('');
          return prev.filter((id) => id !== playerId);
        }
        if (prev.length >= 11) return prev;
        return [...prev, playerId];
      });
    } else {
      setTeam2Lineup((prev) => {
        if (prev.includes(playerId)) {
          if (team2Captain === playerId) setTeam2Captain('');
          if (team2Keeper === playerId) setTeam2Keeper('');
          return prev.filter((id) => id !== playerId);
        }
        if (prev.length >= 11) return prev;
        return [...prev, playerId];
      });
    }
  };

  const handleSaveLineup = async () => {
    if (!selectedMatch) return;
    if (team1Lineup.length !== 11 || team2Lineup.length !== 11) {
      alert(`Playing XI requires exactly 11 players per team.\nTeam 1: ${team1Lineup.length}/11\nTeam 2: ${team2Lineup.length}/11`);
      return;
    }

    setSaveStatus('saving');
    const payload = {
      team1: {
        players: team1Lineup,
        captain: team1Captain || team1Lineup[0],
        wicketKeeper: team1Keeper || '',
      },
      team2: {
        players: team2Lineup,
        captain: team2Captain || team2Lineup[0],
        wicketKeeper: team2Keeper || '',
      },
      confirmedAt: new Date().toISOString(),
      isConfirmed: true,
    };

    try {
      const raw = localStorage.getItem(FIXTURES_STORAGE_KEY);
      if (raw) {
        const fixtures = JSON.parse(raw);
        const idx = fixtures.findIndex((f: any) => String(f.id) === String(selectedMatch.id));
        if (idx !== -1) {
          fixtures[idx].playing11 = payload;
          fixtures[idx].lineupStatus = 'PUBLISHED';
          localStorage.setItem(FIXTURES_STORAGE_KEY, JSON.stringify(fixtures));
        }
      }

      setMatches((prev) =>
        prev.map((m) =>
          String(m.id) === String(selectedMatch.id)
            ? { ...m, playing11: payload, lineupStatus: 'PUBLISHED' }
            : m
        )
      );

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              WPL 2027 ROSTER OPS
            </span>
            <span className="text-xs text-slate-400">Match Official Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-amber-400" /> Playing 11 Confirmation
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <button
            onClick={handleSaveLineup}
            disabled={saveStatus === 'saving' || !selectedMatch}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            {saveStatus === 'saving' ? 'Publishing...' : saveStatus === 'saved' ? 'Confirmed!' : 'Confirm & Lock Lineup'}
          </button>
        </div>
      </div>

      {/* Match Picker Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Calendar className="w-5 h-5 text-rose-400 shrink-0" />
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="w-full md:w-96 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-slate-200 focus:outline-none focus:border-rose-500"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.matchNumber ? `Match #${m.matchNumber}: ` : ''}
                {m.team1?.name || 'Team 1'} vs {m.team2?.name || 'Team 2'}
                {m.date ? ` (${m.date})` : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedMatch?.playing11?.isConfirmed && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" /> Lineup Confirmed & Locked
          </div>
        )}
      </div>

      {/* Squad Columns */}
      {selectedMatch ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team 1 Column */}
          <div className="rounded-2xl p-5 bg-slate-900/40 border border-slate-800/70 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h2 className="text-lg font-black text-white">{selectedMatch.team1?.name || 'Team 1'}</h2>
                <p className="text-xs text-slate-400">Select starters and assign roles</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-black border ${
                team1Lineup.length === 11 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {team1Lineup.length} / 11 Selected
              </span>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {team1Squad.map((player) => {
                const isSelected = team1Lineup.includes(player.id);
                const isCap = team1Captain === player.id;
                const isWk = team1Keeper === player.id;

                return (
                  <motion.div
                    key={player.id}
                    layout
                    onClick={() => togglePlayer('team1', player.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-100 shadow-md shadow-rose-950/20'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-rose-500 border-rose-500' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{player.name}</div>
                        <div className="text-[11px] text-slate-400">{player.role || 'Player'}</div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setTeam1Captain(isCap ? '' : player.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${
                            isCap ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          (C)
                        </button>
                        <button
                          onClick={() => setTeam1Keeper(isWk ? '' : player.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${
                            isWk ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          (WK)
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Team 2 Column */}
          <div className="rounded-2xl p-5 bg-slate-900/40 border border-slate-800/70 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h2 className="text-lg font-black text-white">{selectedMatch.team2?.name || 'Team 2'}</h2>
                <p className="text-xs text-slate-400">Select starters and assign roles</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-black border ${
                team2Lineup.length === 11 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {team2Lineup.length} / 11 Selected
              </span>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {team2Squad.map((player) => {
                const isSelected = team2Lineup.includes(player.id);
                const isCap = team2Captain === player.id;
                const isWk = team2Keeper === player.id;

                return (
                  <motion.div
                    key={player.id}
                    layout
                    onClick={() => togglePlayer('team2', player.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-100 shadow-md shadow-rose-950/20'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-rose-500 border-rose-500' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{player.name}</div>
                        <div className="text-[11px] text-slate-400">{player.role || 'Player'}</div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setTeam2Captain(isCap ? '' : player.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${
                            isCap ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          (C)
                        </button>
                        <button
                          onClick={() => setTeam2Keeper(isWk ? '' : player.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${
                            isWk ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          (WK)
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
