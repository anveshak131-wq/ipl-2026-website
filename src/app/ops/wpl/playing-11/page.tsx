'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/data';
import { Player, Team } from '@/types';
import { 
  Users, 
  CheckCircle2, 
  Save, 
  RefreshCw, 
  Calendar,
  UserPlus,
  Trash2,
  ShieldAlert
} from 'lucide-react';

const FIXTURES_STORAGE_KEY = 'wpl_matches_fixtures_v2027';

// Accurate official WPL squads for 2026/2027
const OFFICIAL_WPL_SQUADS: Record<string, Array<{ id: string; name: string; role: string }>> = {
  rcb: [
    { id: 'rcb-1', name: 'Smriti Mandhana', role: 'Batter' },
    { id: 'rcb-2', name: 'Ellyse Perry', role: 'All-Rounder' },
    { id: 'rcb-3', name: 'Richa Ghosh', role: 'Wicket-Keeper' },
    { id: 'rcb-4', name: 'Shreyanka Patil', role: 'All-Rounder' },
    { id: 'rcb-5', name: 'Radha Yadav', role: 'Bowler' },
    { id: 'rcb-6', name: 'Arundhati Reddy', role: 'Bowler' },
    { id: 'rcb-7', name: 'Pooja Vastrakar', role: 'All-Rounder' },
    { id: 'rcb-8', name: 'Georgia Voll', role: 'Batter' },
    { id: 'rcb-9', name: 'Nadine de Klerk', role: 'All-Rounder' },
    { id: 'rcb-10', name: 'Lauren Bell', role: 'Bowler' },
    { id: 'rcb-11', name: 'Sayali Satghare', role: 'All-Rounder' },
    { id: 'rcb-12', name: 'Prema Rawat', role: 'Bowler' },
    { id: 'rcb-13', name: 'Prathyoosha Kumar', role: 'Wicket-Keeper' },
  ],
  gg: [
    { id: 'gg-1', name: 'Ashleigh Gardner', role: 'All-Rounder' },
    { id: 'gg-2', name: 'Beth Mooney', role: 'Wicket-Keeper' },
    { id: 'gg-3', name: 'Sophie Devine', role: 'All-Rounder' },
    { id: 'gg-4', name: 'Renuka Singh', role: 'Bowler' },
    { id: 'gg-5', name: 'Georgia Wareham', role: 'All-Rounder' },
    { id: 'gg-6', name: 'Tanuja Kanwar', role: 'Bowler' },
    { id: 'gg-7', name: 'Yastika Bhatia', role: 'Wicket-Keeper' },
    { id: 'gg-8', name: 'Kim Garth', role: 'All-Rounder' },
    { id: 'gg-9', name: 'Bharti Fulmali', role: 'Batter' },
    { id: 'gg-10', name: 'Kashvee Gautam', role: 'Bowler' },
    { id: 'gg-11', name: 'Rajeshwari Gayakwad', role: 'Bowler' },
    { id: 'gg-12', name: 'Kanika Ahuja', role: 'All-Rounder' },
    { id: 'gg-13', name: 'Anushka Sharma', role: 'Batter' },
    { id: 'gg-14', name: 'Happy Kumari', role: 'Bowler' },
  ],
  mi: [
    { id: 'mi-1', name: 'Harmanpreet Kaur', role: 'Batter' },
    { id: 'mi-2', name: 'Nat Sciver-Brunt', role: 'All-Rounder' },
    { id: 'mi-3', name: 'Hayley Matthews', role: 'All-Rounder' },
    { id: 'mi-4', name: 'Amelia Kerr', role: 'All-Rounder' },
    { id: 'mi-5', name: 'Amanjot Kaur', role: 'All-Rounder' },
    { id: 'mi-6', name: 'Sajeevan Sajana', role: 'All-Rounder' },
    { id: 'mi-7', name: 'Shabnim Ismail', role: 'Bowler' },
    { id: 'mi-8', name: 'Nicola Carey', role: 'All-Rounder' },
    { id: 'mi-9', name: 'Rahila Firdous', role: 'Wicket-Keeper' },
    { id: 'mi-10', name: 'Sanskriti Gupta', role: 'Bowler' },
    { id: 'mi-11', name: 'Vaishnavi Sharma', role: 'Bowler' },
  ],
  dc: [
    { id: 'dc-1', name: 'Meg Lanning', role: 'Batter' },
    { id: 'dc-2', name: 'Shafali Verma', role: 'Batter' },
    { id: 'dc-3', name: 'Jemimah Rodrigues', role: 'Batter' },
    { id: 'dc-4', name: 'Marizanne Kapp', role: 'All-Rounder' },
    { id: 'dc-5', name: 'Annabel Sutherland', role: 'All-Rounder' },
    { id: 'dc-6', name: 'Laura Wolvaardt', role: 'Batter' },
    { id: 'dc-7', name: 'Minnu Mani', role: 'All-Rounder' },
    { id: 'dc-8', name: 'Chinelle Henry', role: 'All-Rounder' },
    { id: 'dc-9', name: 'Lucy Hamilton', role: 'Bowler' },
    { id: 'dc-10', name: 'Mamatha Madiwala', role: 'Wicket-Keeper' },
    { id: 'dc-11', name: 'N Shree Charani', role: 'Bowler' },
  ],
  upw: [
    { id: 'upw-1', name: 'Deepti Sharma', role: 'All-Rounder' },
    { id: 'upw-2', name: 'Sophie Ecclestone', role: 'Bowler' },
    { id: 'upw-3', name: 'Phoebe Litchfield', role: 'Batter' },
    { id: 'upw-4', name: 'Harleen Deol', role: 'Batter' },
    { id: 'upw-5', name: 'Shikha Pandey', role: 'Bowler' },
    { id: 'upw-6', name: 'Tara Norris', role: 'Bowler' },
    { id: 'upw-7', name: 'Shipra Giri', role: 'Wicket-Keeper' },
    { id: 'upw-8', name: 'Simran Shaikh', role: 'Batter' },
    { id: 'upw-9', name: 'Kranti Gaud', role: 'Bowler' },
    { id: 'upw-10', name: 'Pratika Rawal', role: 'Batter' },
  ]
};

function getTeamKey(raw: any): string {
  const str = String(typeof raw === 'object' ? (raw.id || raw.name || raw.shortName || '') : raw).trim().toLowerCase();
  if (str.includes('rcb') || str.includes('bengaluru') || str.includes('bangalore') || str === '12') return 'rcb';
  if (str.includes('gg') || str.includes('gujarat') || str.includes('giants') || str === '14') return 'gg';
  if (str.includes('mi') || str.includes('mumbai') || str === '11') return 'mi';
  if (str.includes('dc') || str.includes('delhi') || str === '13') return 'dc';
  if (str.includes('up') || str.includes('warrior') || str === '15') return 'upw';
  return str.replace(/[^a-z0-9]/g, '');
}

export default function WplPlaying11ConfirmationPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Custom squad additions and removals stored per team
  const [customPlayers, setCustomPlayers] = useState<Record<string, Array<{ id: string; name: string; role: string }>>>({});
  const [removedPlayerIds, setRemovedPlayerIds] = useState<Record<string, string[]>>({});

  // Quick Add Player input fields
  const [newPlayerName1, setNewPlayerName1] = useState('');
  const [newPlayerRole1, setNewPlayerRole1] = useState('Batter');
  const [newPlayerName2, setNewPlayerName2] = useState('');
  const [newPlayerRole2, setNewPlayerRole2] = useState('Batter');

  // Playing 11 Selections
  const [team1Lineup, setTeam1Lineup] = useState<string[]>([]);
  const [team2Lineup, setTeam2Lineup] = useState<string[]>([]);
  const [team1Captain, setTeam1Captain] = useState<string>('');
  const [team1Keeper, setTeam1Keeper] = useState<string>('');
  const [team2Captain, setTeam2Captain] = useState<string>('');
  const [team2Keeper, setTeam2Keeper] = useState<string>('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiMatches = await api.getMatches('wpl').catch(() => []);
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
      if (combinedMatches.length > 0) {
        setSelectedMatchId((prev) => (prev && combinedMatches.some((m) => String(m.id) === prev) ? prev : String(combinedMatches[0].id)));
      }
    } catch (err) {
      console.error('Failed loading matches for Playing 11:', err);
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

  // Load existing lineup when match changes
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

  const team1Key = useMemo(() => {
    if (!selectedMatch) return '';
    return getTeamKey(selectedMatch.team1?.id || selectedMatch.team1?.name || selectedMatch.team1Id);
  }, [selectedMatch]);

  const team2Key = useMemo(() => {
    if (!selectedMatch) return '';
    return getTeamKey(selectedMatch.team2?.id || selectedMatch.team2?.name || selectedMatch.team2Id);
  }, [selectedMatch]);

  // Team 1 Squad: Official verified squad + admin additions - removals
  const team1Squad = useMemo(() => {
    if (!team1Key) return [];
    const base = OFFICIAL_WPL_SQUADS[team1Key] || [];
    const customs = customPlayers[team1Key] || [];
    const removed = removedPlayerIds[team1Key] || [];
    return [...base, ...customs].filter((p) => !removed.includes(p.id));
  }, [team1Key, customPlayers, removedPlayerIds]);

  // Team 2 Squad: Official verified squad + admin additions - removals
  const team2Squad = useMemo(() => {
    if (!team2Key) return [];
    const base = OFFICIAL_WPL_SQUADS[team2Key] || [];
    const customs = customPlayers[team2Key] || [];
    const removed = removedPlayerIds[team2Key] || [];
    return [...base, ...customs].filter((p) => !removed.includes(p.id));
  }, [team2Key, customPlayers, removedPlayerIds]);

  const togglePlayer = (team: 'team1' | 'team2', playerId: string) => {
    if (team === 'team1') {
      setTeam1Lineup((prev) => {
        if (prev.includes(playerId)) {
          if (team1Captain === playerId) setTeam1Captain('');
          if (team1Keeper === playerId) setTeam1Keeper('');
          return prev.filter((id) => id !== playerId);
        }
        if (prev.length >= 11) {
          alert('Maximum 11 players allowed in Team 1 Playing XI');
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
          alert('Maximum 11 players allowed in Team 2 Playing XI');
          return prev;
        }
        return [...prev, playerId];
      });
    }
  };

  const handleRemoveFromSquad = (teamKey: string, playerId: string) => {
    setRemovedPlayerIds((prev) => ({
      ...prev,
      [teamKey]: [...(prev[teamKey] || []), playerId],
    }));
    setTeam1Lineup((prev) => prev.filter((id) => id !== playerId));
    setTeam2Lineup((prev) => prev.filter((id) => id !== playerId));
  };

  const handleAddPlayer1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName1.trim() || !team1Key) return;
    const newId = `custom-${team1Key}-${Date.now()}`;
    const newObj = {
      id: newId,
      name: newPlayerName1.trim(),
      role: newPlayerRole1,
    };
    setCustomPlayers((prev) => ({
      ...prev,
      [team1Key]: [...(prev[team1Key] || []), newObj],
    }));
    if (team1Lineup.length < 11) {
      setTeam1Lineup((prev) => [...prev, newId]);
    }
    setNewPlayerName1('');
  };

  const handleAddPlayer2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName2.trim() || !team2Key) return;
    const newId = `custom-${team2Key}-${Date.now()}`;
    const newObj = {
      id: newId,
      name: newPlayerName2.trim(),
      role: newPlayerRole2,
    };
    setCustomPlayers((prev) => ({
      ...prev,
      [team2Key]: [...(prev[team2Key] || []), newObj],
    }));
    if (team2Lineup.length < 11) {
      setTeam2Lineup((prev) => [...prev, newId]);
    }
    setNewPlayerName2('');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--wpl-card-border,rgba(255,255,255,0.1))]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30">
              WPL 2027 ROSTER OPS
            </span>
            <span className="text-xs text-[var(--wpl-text-muted)]">Official Squad Match Lineups</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--wpl-text-title)] flex items-center gap-2.5">
            <Users className="w-7 h-7 text-amber-500 dark:text-amber-400" /> Playing 11 Confirmation
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl border border-[var(--wpl-card-border)] bg-[var(--wpl-card-bg)] hover:bg-[var(--wpl-hover-bg)] text-xs font-semibold text-[var(--wpl-text-body)] transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleSaveLineup}
            disabled={saveStatus === 'saving' || !selectedMatch}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-amber-500 hover:from-pink-700 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/20 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            {saveStatus === 'saving' ? 'Publishing...' : saveStatus === 'saved' ? 'Confirmed!' : 'Confirm Lineup'}
          </button>
        </div>
      </div>

      {/* Match Picker Bar */}
      <div className="p-4 rounded-2xl border border-[var(--wpl-card-border)] bg-[var(--wpl-card-bg)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="w-5 h-5 text-pink-500 dark:text-pink-400 shrink-0" />
          <div className="relative flex-1 sm:w-96">
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500"
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
        </div>

        {selectedMatch?.playing11?.isConfirmed && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" /> Lineup Confirmed
          </div>
        )}
      </div>

      {/* Squad Columns */}
      {selectedMatch ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team 1 Squad */}
          <div className="rounded-2xl p-5 border border-[var(--wpl-card-border)] bg-[var(--wpl-card-bg)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--wpl-card-border)]">
              <div>
                <h2 className="text-lg font-black text-[var(--wpl-text-title)]">{selectedMatch.team1?.name || 'Team 1'}</h2>
                <p className="text-xs text-[var(--wpl-text-muted)]">Select 11 starters, captain (C), and wicketkeeper (WK)</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-black border ${
                team1Lineup.length === 11 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}>
                {team1Lineup.length} / 11
              </span>
            </div>

            {/* Quick Add Player Form */}
            <form onSubmit={handleAddPlayer1} className="flex items-center gap-2 pt-1 pb-2">
              <input
                type="text"
                placeholder="+ Add player to squad..."
                value={newPlayerName1}
                onChange={(e) => setNewPlayerName1(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)] focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <select
                value={newPlayerRole1}
                onChange={(e) => setNewPlayerRole1(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)]"
              >
                <option value="Batter">Batter</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicket-Keeper">Wicket-Keeper</option>
              </select>
              <button
                type="submit"
                disabled={!newPlayerName1.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {team1Squad.map((player) => {
                const isSelected = team1Lineup.includes(player.id);
                const isCap = team1Captain === player.id;
                const isWk = team1Keeper === player.id;

                return (
                  <div
                    key={player.id}
                    onClick={() => togglePlayer('team1', player.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-pink-500/15 border-pink-500 text-[var(--wpl-text-title)] shadow-sm'
                        : 'border-[var(--wpl-card-border)] bg-[var(--wpl-hover-bg)] text-[var(--wpl-text-body)] hover:border-pink-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-pink-500 border-pink-500' : 'border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)]'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{player.name}</div>
                        <div className="text-[11px] text-[var(--wpl-text-muted)]">{player.role || 'Player'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {isSelected && (
                        <>
                          <button
                            type="button"
                            onClick={() => setTeam1Captain(isCap ? '' : player.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${
                              isCap ? 'bg-amber-500 text-black border-amber-400' : 'bg-[var(--wpl-card-bg)] text-[var(--wpl-text-muted)] border-[var(--wpl-card-border)] hover:text-[var(--wpl-text-title)]'
                            }`}
                          >
                            (C)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTeam1Keeper(isWk ? '' : player.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${
                              isWk ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-[var(--wpl-card-bg)] text-[var(--wpl-text-muted)] border-[var(--wpl-card-border)] hover:text-[var(--wpl-text-title)]'
                            }`}
                          >
                            (WK)
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromSquad(team1Key, player.id)}
                        title="Remove player"
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team 2 Squad */}
          <div className="rounded-2xl p-5 border border-[var(--wpl-card-border)] bg-[var(--wpl-card-bg)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--wpl-card-border)]">
              <div>
                <h2 className="text-lg font-black text-[var(--wpl-text-title)]">{selectedMatch.team2?.name || 'Team 2'}</h2>
                <p className="text-xs text-[var(--wpl-text-muted)]">Select 11 starters, captain (C), and wicketkeeper (WK)</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-black border ${
                team2Lineup.length === 11 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}>
                {team2Lineup.length} / 11
              </span>
            </div>

            {/* Quick Add Player Form */}
            <form onSubmit={handleAddPlayer2} className="flex items-center gap-2 pt-1 pb-2">
              <input
                type="text"
                placeholder="+ Add player to squad..."
                value={newPlayerName2}
                onChange={(e) => setNewPlayerName2(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)] focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <select
                value={newPlayerRole2}
                onChange={(e) => setNewPlayerRole2(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)]"
              >
                <option value="Batter">Batter</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicket-Keeper">Wicket-Keeper</option>
              </select>
              <button
                type="submit"
                disabled={!newPlayerName2.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {team2Squad.map((player) => {
                const isSelected = team2Lineup.includes(player.id);
                const isCap = team2Captain === player.id;
                const isWk = team2Keeper === player.id;

                return (
                  <div
                    key={player.id}
                    onClick={() => togglePlayer('team2', player.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-pink-500/15 border-pink-500 text-[var(--wpl-text-title)] shadow-sm'
                        : 'border-[var(--wpl-card-border)] bg-[var(--wpl-hover-bg)] text-[var(--wpl-text-body)] hover:border-pink-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-pink-500 border-pink-500' : 'border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)]'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{player.name}</div>
                        <div className="text-[11px] text-[var(--wpl-text-muted)]">{player.role || 'Player'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {isSelected && (
                        <>
                          <button
                            type="button"
                            onClick={() => setTeam2Captain(isCap ? '' : player.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${
                              isCap ? 'bg-amber-500 text-black border-amber-400' : 'bg-[var(--wpl-card-bg)] text-[var(--wpl-text-muted)] border-[var(--wpl-card-border)] hover:text-[var(--wpl-text-title)]'
                            }`}
                          >
                            (C)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTeam2Keeper(isWk ? '' : player.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${
                              isWk ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-[var(--wpl-card-bg)] text-[var(--wpl-text-muted)] border-[var(--wpl-card-border)] hover:text-[var(--wpl-text-title)]'
                            }`}
                          >
                            (WK)
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromSquad(team2Key, player.id)}
                        title="Remove player"
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
