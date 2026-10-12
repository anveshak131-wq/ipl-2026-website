'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/data';
import { Match, Player, Team } from '@/types';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ArrowLeft, 
  RefreshCw, 
  ShieldAlert, 
  Crown, 
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';

const FIXTURES_STORAGE_KEY = 'wpl_matches_fixtures_v2027';

export default function WplPlaying11ConfirmationPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Playing 11 selections: string player IDs
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

      // Merge fixtures and standard matches
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
            toss: lf.toss || null,
          });
        }
      });

      setMatches(combinedMatches);
      setPlayers(apiPlayers);
      setTeams(apiTeams);

      if (combinedMatches.length > 0) {
        setSelectedMatchId(String(combinedMatches[0].id));
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

  // Load lineups when match changes
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
        if (prev.length >= 11) {
          alert('Maximum 11 players allowed in Playing XI for Team 1.');
          return prev;
        }
        return [...prev, playerId];
      });
    } else {
      setTeam2Lineup((prev) => {
        if (prev.includes(playerId)) {
          if (team2Captain === playerId) setTeam2Captain('');
          if (team2Keeper === playerId) setTeam2Keeper('');
          return prev.filter((id) => id !== playerId);
        }
        if (prev.length >= 11) {
          alert('Maximum 11 players allowed in Playing XI for Team 2.');
          return prev;
        }
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
    setErrorMessage('');

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
      // 1. Update in local storage matches
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
      } catch (err) {
        console.warn('LocalStorage fixture update skipped', err);
      }

      // 2. Persist to API
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token') || '';
      await fetch(`/api/matches?id=${selectedMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: selectedMatch.id,
          playing11: payload,
          lineupStatus: 'PUBLISHED',
        }),
      }).catch(() => null);

      // 3. Update active state
      setMatches((prev) =>
        prev.map((m) =>
          String(m.id) === String(selectedMatch.id)
            ? { ...m, playing11: payload, lineupStatus: 'PUBLISHED' }
            : m
        )
      );

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      console.error('Failed saving Playing 11:', err);
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed saving lineup');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                WPL 2027 OPS
              </span>
              <span className="text-xs text-slate-400">Pre-Match Verification</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
              <Users className="w-7 h-7 text-amber-400" /> Playing 11 Confirmation
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData()}
              disabled={isLoading}
              className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Matches
            </button>
            <button
              onClick={handleSaveLineup}
              disabled={saveStatus === 'saving' || !selectedMatch}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveStatus === 'saving' ? 'Publishing...' : saveStatus === 'saved' ? 'Confirmed!' : 'Confirm & Publish Playing 11'}
            </button>
          </div>
        </div>

        {/* Match Selection Dropdown */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4">
          <label className="text-sm font-medium text-slate-300 whitespace-nowrap flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-400" /> Select Match:
          </label>
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="w-full md:w-auto flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.matchNumber ? `Match #${m.matchNumber}: ` : ''}
                {m.team1?.name || m.team1?.shortName || 'Team 1'} vs {m.team2?.name || m.team2?.shortName || 'Team 2'} 
                {m.date ? ` (${m.date})` : ''} - [{m.status?.toUpperCase() || 'SCHEDULED'}]
              </option>
            ))}
          </select>
          {selectedMatch?.playing11?.isConfirmed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Lineup Confirmed
            </span>
          )}
        </div>

        {/* Squad Selection Columns */}
        {selectedMatch ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team 1 Squad */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedMatch.team1?.name || 'Team 1'}
                  </h2>
                  <p className="text-xs text-slate-400">Select 11 starters from roster</p>
                </div>
                <div className="text-right">
                  <span className={`text-base font-black px-2.5 py-1 rounded-lg ${
                    team1Lineup.length === 11 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {team1Lineup.length} / 11
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {team1Squad.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-4">No squad players found for {selectedMatch.team1?.name}. Check team rosters.</p>
                ) : (
                  team1Squad.map((player) => {
                    const isSelected = team1Lineup.includes(player.id);
                    const isCap = team1Captain === player.id;
                    const isWk = team1Keeper === player.id;

                    return (
                      <div
                        key={player.id}
                        onClick={() => togglePlayer('team1', player.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-100 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 rounded text-rose-500 focus:ring-0 bg-slate-900 border-slate-700"
                          />
                          <div>
                            <span className="font-semibold text-sm">{player.name}</span>
                            <span className="text-xs text-slate-400 block">{player.role || 'Player'}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setTeam1Captain(isCap ? '' : player.id)}
                              className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                isCap ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                            >
                              (C)
                            </button>
                            <button
                              onClick={() => setTeam1Keeper(isWk ? '' : player.id)}
                              className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                isWk ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                            >
                              (WK)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Team 2 Squad */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedMatch.team2?.name || 'Team 2'}
                  </h2>
                  <p className="text-xs text-slate-400">Select 11 starters from roster</p>
                </div>
                <div className="text-right">
                  <span className={`text-base font-black px-2.5 py-1 rounded-lg ${
                    team2Lineup.length === 11 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {team2Lineup.length} / 11
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {team2Squad.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-4">No squad players found for {selectedMatch.team2?.name}. Check team rosters.</p>
                ) : (
                  team2Squad.map((player) => {
                    const isSelected = team2Lineup.includes(player.id);
                    const isCap = team2Captain === player.id;
                    const isWk = team2Keeper === player.id;

                    return (
                      <div
                        key={player.id}
                        onClick={() => togglePlayer('team2', player.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-100 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 rounded text-rose-500 focus:ring-0 bg-slate-900 border-slate-700"
                          />
                          <div>
                            <span className="font-semibold text-sm">{player.name}</span>
                            <span className="text-xs text-slate-400 block">{player.role || 'Player'}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setTeam2Captain(isCap ? '' : player.id)}
                              className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                isCap ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                            >
                              (C)
                            </button>
                            <button
                              onClick={() => setTeam2Keeper(isWk ? '' : player.id)}
                              className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                isWk ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                            >
                              (WK)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-900/40">
            No matches found. Generate matches in Matches & Fixtures first.
          </div>
        )}
      </div>
    </div>
  );
}
