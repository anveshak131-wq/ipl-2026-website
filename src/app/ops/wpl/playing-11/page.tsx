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
  AlertCircle
} from 'lucide-react';

const FIXTURES_STORAGE_KEY = 'wpl_matches_fixtures_v2027';

// Canonical team mappings matching functions/api/players.js
// 11 = MI-W | 12 = RCB-W | 13 = DC-W | 14 = GG | 15 = UPW
const TEAM_ALIAS_MAP: Record<string, string[]> = {
  rcb: ['12', 'rcb', 'rcb-w', 'royal challengers bangalore', 'royal challengers bengaluru'],
  gg: ['14', 'gg', 'gg-w', 'gujarat giants', 'gujarat'],
  mi: ['11', 'mi', 'mi-w', 'mumbai indians'],
  dc: ['13', 'dc', 'dc-w', 'delhi capitals'],
  upw: ['15', 'upw', 'up warriorz', 'up-warriorz']
};

// Verified WPL rosters based on functions/api/players.js corrections
const VERIFIED_WPL_ROSTERS: Record<string, Array<{ name: string; role: string }>> = {
  rcb: [
    { name: 'Smriti Mandhana', role: 'Batter' },
    { name: 'Ellyse Perry', role: 'All-Rounder' },
    { name: 'Richa Ghosh', role: 'Wicket-Keeper' },
    { name: 'Pooja Vastrakar', role: 'All-Rounder' },
    { name: 'Renuka Singh', role: 'Bowler' },
    { name: 'Shreyanka Patil', role: 'All-Rounder' },
    { name: 'Asha Sobhana', role: 'Bowler' },
    { name: 'Georgia Wareham', role: 'All-Rounder' },
    { name: 'Ekta Bisht', role: 'Bowler' },
    { name: 'Disha Kasat', role: 'Batter' },
    { name: 'Subha Satheesh', role: 'Batter' },
    { name: 'Simran Bahadur', role: 'All-Rounder' },
    { name: 'Sophie Molineux', role: 'All-Rounder' },
    { name: 'Indrani Roy', role: 'Wicket-Keeper' },
  ],
  gg: [
    { name: 'Sophie Devine', role: 'All-Rounder' }, // Gujarat Giants per functions/api/players.js
    { name: 'Ashleigh Gardner', role: 'All-Rounder' },
    { name: 'Beth Mooney', role: 'Wicket-Keeper' },
    { name: 'Harleen Deol', role: 'Batter' },
    { name: 'Dayalan Hemalatha', role: 'Batter' },
    { name: 'Laura Wolvaardt', role: 'Batter' },
    { name: 'Devika Vaidya', role: 'All-Rounder' },
    { name: 'Sneh Rana', role: 'All-Rounder' },
    { name: 'Tanuja Kanwar', role: 'Bowler' },
    { name: 'Shabnam Shakil', role: 'Bowler' },
    { name: 'Phoebe Litchfield', role: 'Batter' },
    { name: 'Mannat Kashyap', role: 'Bowler' },
    { name: 'Meghna Singh', role: 'Bowler' },
    { name: 'Sayali Satghare', role: 'All-Rounder' },
  ],
  mi: [
    { name: 'Harmanpreet Kaur', role: 'Batter' },
    { name: 'Alyssa Healy', role: 'Wicket-Keeper' }, // per functions/api/players.js
    { name: 'Nat Sciver-Brunt', role: 'All-Rounder' },
    { name: 'Hayley Matthews', role: 'All-Rounder' },
    { name: 'Yastika Bhatia', role: 'Wicket-Keeper' },
    { name: 'Amelia Kerr', role: 'All-Rounder' },
    { name: 'Saika Ishaque', role: 'Bowler' },
    { name: 'Issy Wong', role: 'Bowler' },
    { name: 'Amanjot Kaur', role: 'All-Rounder' },
    { name: 'Sajeevan Sajana', role: 'All-Rounder' },
    { name: 'Jintimani Kalita', role: 'All-Rounder' },
  ],
  dc: [
    { name: 'Meg Lanning', role: 'Batter' },
    { name: 'Shafali Verma', role: 'Batter' },
    { name: 'Jemimah Rodrigues', role: 'Batter' },
    { name: 'Deepti Sharma', role: 'All-Rounder' }, // per functions/api/players.js
    { name: 'Alice Capsey', role: 'All-Rounder' },
    { name: 'Marizanne Kapp', role: 'All-Rounder' },
    { name: 'Radha Yadav', role: 'Bowler' },
    { name: 'Shikha Pandey', role: 'Bowler' },
    { name: 'Arundhati Reddy', role: 'Bowler' },
    { name: 'Taniya Bhatia', role: 'Wicket-Keeper' },
    { name: 'Jess Jonassen', role: 'All-Rounder' },
  ],
  upw: [
    { name: 'Grace Harris', role: 'All-Rounder' },
    { name: 'Chamari Athapaththu', role: 'All-Rounder' },
    { name: 'Sophie Ecclestone', role: 'Bowler' },
    { name: 'Shweta Sehrawat', role: 'Batter' },
    { name: 'Kiran Navgire', role: 'Batter' },
    { name: 'Rajeshwari Gayakwad', role: 'Bowler' },
    { name: 'Poonam Khemnar', role: 'All-Rounder' },
    { name: 'Saima Thakor', role: 'Bowler' },
    { name: 'Anjali Sarvani', role: 'Bowler' },
    { name: 'Vrinda Dinesh', role: 'Batter' },
  ]
};

function getCanonicalTeamKey(raw: any): string {
  const str = String(raw || '').toLowerCase().trim();
  for (const [key, aliases] of Object.entries(TEAM_ALIAS_MAP)) {
    if (aliases.some((alias) => str === alias || str.includes(alias))) {
      return key;
    }
  }
  return str.replace(/[^a-z0-9]/g, '');
}

export default function WplPlaying11ConfirmationPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Custom added or removed squad players
  const [customPlayers, setCustomPlayers] = useState<Record<string, Array<{ id: string; name: string; role: string; teamId: string }>>>({});
  const [removedPlayerIds, setRemovedPlayerIds] = useState<Record<string, string[]>>({});

  // Form states for adding custom player
  const [newPlayerName1, setNewPlayerName1] = useState('');
  const [newPlayerRole1, setNewPlayerRole1] = useState('Batter');
  const [newPlayerName2, setNewPlayerName2] = useState('');
  const [newPlayerRole2, setNewPlayerRole2] = useState('Batter');

  // Playing 11 IDs
  const [team1Lineup, setTeam1Lineup] = useState<string[]>([]);
  const [team2Lineup, setTeam2Lineup] = useState<string[]>([]);
  const [team1Captain, setTeam1Captain] = useState<string>('');
  const [team1Keeper, setTeam1Keeper] = useState<string>('');
  const [team2Captain, setTeam2Captain] = useState<string>('');
  const [team2Keeper, setTeam2Keeper] = useState<string>('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [apiMatches, apiPlayers] = await Promise.all([
        api.getMatches('wpl').catch(() => []),
        api.getPlayers(undefined, 'wpl', { includeInactive: true }).catch(() => []),
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

  // Load existing lineups when match selection changes
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
    return getCanonicalTeamKey(selectedMatch.team1?.id || selectedMatch.team1?.name || selectedMatch.team1?.shortName);
  }, [selectedMatch]);

  const team2Key = useMemo(() => {
    if (!selectedMatch) return '';
    return getCanonicalTeamKey(selectedMatch.team2?.id || selectedMatch.team2?.name || selectedMatch.team2?.shortName);
  }, [selectedMatch]);

  // Team 1 Squad: strict canonical match + verified roster
  const team1Squad = useMemo(() => {
    if (!team1Key) return [];
    const removed = removedPlayerIds[team1Key] || [];
    
    // Match from API players
    const aliases = TEAM_ALIAS_MAP[team1Key] || [team1Key];
    const matched = players.filter((p) => {
      const rawId = String(p.teamId || (p as any).team || '').toLowerCase().trim();
      return aliases.some((a) => rawId === a || rawId.includes(a));
    });

    let baseList = [...matched];
    if (baseList.length === 0 && VERIFIED_WPL_ROSTERS[team1Key]) {
      baseList = VERIFIED_WPL_ROSTERS[team1Key].map((p, idx) => ({
        id: `${team1Key}-${idx + 1}`,
        name: p.name,
        role: p.role,
        teamId: team1Key,
      } as any));
    }

    const customs = customPlayers[team1Key] || [];
    return [...baseList, ...customs].filter((p) => !removed.includes(p.id));
  }, [team1Key, players, customPlayers, removedPlayerIds]);

  // Team 2 Squad: strict canonical match + verified roster
  const team2Squad = useMemo(() => {
    if (!team2Key) return [];
    const removed = removedPlayerIds[team2Key] || [];
    
    const aliases = TEAM_ALIAS_MAP[team2Key] || [team2Key];
    const matched = players.filter((p) => {
      const rawId = String(p.teamId || (p as any).team || '').toLowerCase().trim();
      return aliases.some((a) => rawId === a || rawId.includes(a));
    });

    let baseList = [...matched];
    if (baseList.length === 0 && VERIFIED_WPL_ROSTERS[team2Key]) {
      baseList = VERIFIED_WPL_ROSTERS[team2Key].map((p, idx) => ({
        id: `${team2Key}-${idx + 1}`,
        name: p.name,
        role: p.role,
        teamId: team2Key,
      } as any));
    }

    const customs = customPlayers[team2Key] || [];
    return [...baseList, ...customs].filter((p) => !removed.includes(p.id));
  }, [team2Key, players, customPlayers, removedPlayerIds]);

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
      teamId: team1Key,
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
      teamId: team2Key,
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
            <span className="text-xs text-[var(--wpl-text-muted)]">Pre-Match Verification</span>
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

      {/* Match Picker */}
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
                        title="Remove player from squad"
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
                        title="Remove player from squad"
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
