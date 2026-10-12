'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/data';
import { 
  Coins, 
  CheckCircle2, 
  ArrowRight, 
  Save, 
  RefreshCw, 
  Calendar, 
  ShieldCheck,
  AlertTriangle 
} from 'lucide-react';

const FIXTURES_STORAGE_KEY = 'wpl_matches_fixtures_v2027';

export default function WplTossSubmissionPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Toss states
  const [tossWinnerTeamId, setTossWinnerTeamId] = useState<string>('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  const loadMatches = useCallback(async () => {
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
            toss: lf.toss || null,
          });
        }
      });

      setMatches(combinedMatches);
      if (combinedMatches.length > 0) {
        setSelectedMatchId(String(combinedMatches[0].id));
      }
    } catch (err) {
      console.error('Failed loading matches for Toss:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const selectedMatch = useMemo(() => {
    return matches.find((m) => String(m.id) === String(selectedMatchId)) || null;
  }, [matches, selectedMatchId]);

  // Load existing toss when match changes
  useEffect(() => {
    if (!selectedMatch) return;
    if (selectedMatch.toss) {
      setTossWinnerTeamId(selectedMatch.toss.winnerId || selectedMatch.toss.winner || '');
      setTossDecision(selectedMatch.toss.decision?.toLowerCase() === 'bowl' ? 'bowl' : 'bat');
    } else {
      setTossWinnerTeamId(selectedMatch.team1?.id || '');
      setTossDecision('bat');
    }
  }, [selectedMatch]);

  const winnerName = useMemo(() => {
    if (!selectedMatch || !tossWinnerTeamId) return '';
    if (String(selectedMatch.team1?.id) === String(tossWinnerTeamId)) return selectedMatch.team1?.name || 'Team 1';
    if (String(selectedMatch.team2?.id) === String(tossWinnerTeamId)) return selectedMatch.team2?.name || 'Team 2';
    return tossWinnerTeamId;
  }, [selectedMatch, tossWinnerTeamId]);

  const battingFirstTeam = useMemo(() => {
    if (!selectedMatch || !tossWinnerTeamId) return null;
    const isTeam1Winner = String(selectedMatch.team1?.id) === String(tossWinnerTeamId);
    if (tossDecision === 'bat') {
      return isTeam1Winner ? selectedMatch.team1 : selectedMatch.team2;
    } else {
      return isTeam1Winner ? selectedMatch.team2 : selectedMatch.team1;
    }
  }, [selectedMatch, tossWinnerTeamId, tossDecision]);

  const bowlingFirstTeam = useMemo(() => {
    if (!selectedMatch || !battingFirstTeam) return null;
    return String(selectedMatch.team1?.id) === String(battingFirstTeam?.id)
      ? selectedMatch.team2
      : selectedMatch.team1;
  }, [selectedMatch, battingFirstTeam]);

  const handleSaveToss = async () => {
    if (!selectedMatch || !tossWinnerTeamId) {
      alert('Please choose a toss winner.');
      return;
    }

    setSaveStatus('saving');
    const tossSummaryText = `${winnerName} won the toss and elected to ${tossDecision}`;

    const tossPayload = {
      winnerId: tossWinnerTeamId,
      winner: tossWinnerTeamId,
      winnerName,
      decision: tossDecision,
      text: tossSummaryText,
      innings1: {
        battingTeamId: battingFirstTeam?.id,
        bowlingTeamId: bowlingFirstTeam?.id,
      },
      submittedAt: new Date().toISOString(),
    };

    try {
      // 1. Update localStorage fixtures
      try {
        const raw = localStorage.getItem(FIXTURES_STORAGE_KEY);
        if (raw) {
          const fixtures = JSON.parse(raw);
          const idx = fixtures.findIndex((f: any) => String(f.id) === String(selectedMatch.id));
          if (idx !== -1) {
            fixtures[idx].toss = tossPayload;
            fixtures[idx].status = 'TOSS_DONE';
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
          toss: tossPayload,
          status: 'TOSS_DONE',
        }),
      }).catch(() => null);

      // 3. Update active state
      setMatches((prev) =>
        prev.map((m) =>
          String(m.id) === String(selectedMatch.id)
            ? { ...m, toss: tossPayload, status: 'toss_done' }
            : m
        )
      );

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed saving toss:', err);
      setSaveStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                WPL 2027 OPS
              </span>
              <span className="text-xs text-slate-400">Match Official Handover</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
              <Coins className="w-7 h-7 text-cyan-400" /> Toss Submission
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadMatches()}
              disabled={isLoading}
              className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={handleSaveToss}
              disabled={saveStatus === 'saving' || !selectedMatch}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveStatus === 'saving' ? 'Submitting...' : saveStatus === 'saved' ? 'Toss Saved!' : 'Submit Toss Result'}
            </button>
          </div>
        </div>

        {/* Match Selector */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4">
          <label className="text-sm font-medium text-slate-300 whitespace-nowrap flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" /> Select Match:
          </label>
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="w-full md:w-auto flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.matchNumber ? `Match #${m.matchNumber}: ` : ''}
                {m.team1?.name || 'Team 1'} vs {m.team2?.name || 'Team 2'} 
                {m.date ? ` (${m.date})` : ''} - [{m.status?.toUpperCase() || 'SCHEDULED'}]
              </option>
            ))}
          </select>
        </div>

        {/* Toss Decision Card */}
        {selectedMatch && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                1. Which team won the toss?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[selectedMatch.team1, selectedMatch.team2].map((team) => {
                  const isWinner = String(team?.id) === String(tossWinnerTeamId);
                  return (
                    <button
                      key={team?.id}
                      type="button"
                      onClick={() => setTossWinnerTeamId(team?.id)}
                      className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isWinner
                          ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-base">{team?.name || 'Team'}</span>
                      {isWinner && <ShieldCheck className="w-5 h-5 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                2. What did they elect to do?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTossDecision('bat')}
                  className={`p-4 rounded-xl border text-center font-bold text-base transition-all ${
                    tossDecision === 'bat'
                      ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  🏏 Elected to BAT
                </button>
                <button
                  type="button"
                  onClick={() => setTossDecision('bowl')}
                  className={`p-4 rounded-xl border text-center font-bold text-base transition-all ${
                    tossDecision === 'bowl'
                      ? 'bg-blue-950/40 border-blue-500 text-blue-200 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  ⚾ Elected to BOWL
                </button>
              </div>
            </div>

            {/* Innings Order Preview */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Derived Innings Schedule
              </h3>
              <div className="text-sm space-y-1">
                <p className="text-slate-200">
                  <span className="text-amber-400 font-bold">Innings 1:</span> {battingFirstTeam?.name || '---'} (Batting) vs {bowlingFirstTeam?.name || '---'} (Bowling)
                </p>
                <p className="text-slate-200">
                  <span className="text-cyan-400 font-bold">Innings 2:</span> {bowlingFirstTeam?.name || '---'} (Batting) vs {battingFirstTeam?.name || '---'} (Bowling)
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60 italic">
                Broadcast String: &ldquo;{winnerName} won the toss and elected to {tossDecision}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
