'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/data';
import { 
  Coins, 
  CheckCircle2, 
  Save, 
  RefreshCw, 
  Calendar, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

const FIXTURES_STORAGE_KEY = 'wpl_matches_fixtures_v2027';

export default function WplTossSubmissionPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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
    return tossDecision === 'bat'
      ? (isTeam1Winner ? selectedMatch.team1 : selectedMatch.team2)
      : (isTeam1Winner ? selectedMatch.team2 : selectedMatch.team1);
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
      setSaveStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--wpl-card-border,rgba(255,255,255,0.1))]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              WPL 2027 MATCH OFFICIALS
            </span>
            <span className="text-xs text-[var(--wpl-text-muted)]">Pre-Match Toss Protocol</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--wpl-text-title)] flex items-center gap-2.5">
            <Coins className="w-7 h-7 text-cyan-500 dark:text-cyan-400" /> Toss Submission
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadMatches()}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl border border-[var(--wpl-card-border)] bg-[var(--wpl-card-bg)] hover:bg-[var(--wpl-hover-bg)] text-xs font-semibold text-[var(--wpl-text-body)] transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleSaveToss}
            disabled={saveStatus === 'saving' || !selectedMatch}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            {saveStatus === 'saving' ? 'Submitting...' : saveStatus === 'saved' ? 'Toss Saved!' : 'Submit Toss'}
          </button>
        </div>
      </div>

      {/* Match Picker Bar */}
      <div className="p-4 rounded-2xl border border-[var(--wpl-card-border)] bg-[var(--wpl-card-bg)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="w-5 h-5 text-cyan-500 dark:text-cyan-400 shrink-0" />
          <div className="relative flex-1 sm:w-96">
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--wpl-input-border)] bg-[var(--wpl-input-bg)] text-[var(--wpl-text-body)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
        </div>

        {selectedMatch?.toss && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" /> Toss Recorded
          </div>
        )}
      </div>

      {/* Toss Controls */}
      {selectedMatch ? (
        <div className="p-6 rounded-2xl border border-[var(--wpl-card-border)] bg-[var(--wpl-card-bg)] shadow-sm space-y-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--wpl-text-muted)] block mb-3">
              1. Which Team Won the Toss?
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
                        ? 'bg-cyan-500/15 border-cyan-500 text-[var(--wpl-text-title)] shadow-md'
                        : 'border-[var(--wpl-card-border)] bg-[var(--wpl-hover-bg)] text-[var(--wpl-text-body)] hover:border-cyan-500/40'
                    }`}
                  >
                    <span className="font-bold text-base">{team?.name || 'Team'}</span>
                    {isWinner && <ShieldCheck className="w-5 h-5 text-cyan-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--wpl-text-muted)] block mb-3">
              2. What Did They Elect to Do?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTossDecision('bat')}
                className={`p-4 rounded-xl border text-center font-bold text-base transition-all ${
                  tossDecision === 'bat'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-300 shadow-md'
                    : 'border-[var(--wpl-card-border)] bg-[var(--wpl-hover-bg)] text-[var(--wpl-text-muted)] hover:border-amber-500/40'
                }`}
              >
                🏏 Elected to BAT
              </button>
              <button
                type="button"
                onClick={() => setTossDecision('bowl')}
                className={`p-4 rounded-xl border text-center font-bold text-base transition-all ${
                  tossDecision === 'bowl'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-300 shadow-md'
                    : 'border-[var(--wpl-card-border)] bg-[var(--wpl-hover-bg)] text-[var(--wpl-text-muted)] hover:border-blue-500/40'
                }`}
              >
                ⚾ Elected to BOWL
              </button>
            </div>
          </div>

          {/* Derived Order */}
          <div className="p-4 rounded-xl border border-[var(--wpl-card-border)] bg-[var(--wpl-hover-bg)] space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--wpl-text-muted)] mb-2">
              Derived Match Schedule
            </div>
            <div className="text-sm space-y-1 text-[var(--wpl-text-body)]">
              <p>
                <span className="text-amber-500 dark:text-amber-400 font-bold">Innings 1:</span> {battingFirstTeam?.name || '---'} (Batting) vs {bowlingFirstTeam?.name || '---'} (Bowling)
              </p>
              <p>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">Innings 2:</span> {bowlingFirstTeam?.name || '---'} (Batting) vs {battingFirstTeam?.name || '---'} (Bowling)
              </p>
            </div>
            <div className="text-xs text-[var(--wpl-text-muted)] italic pt-2 border-t border-[var(--wpl-card-border)]">
              Broadcast Statement: &ldquo;{winnerName} won the toss and elected to {tossDecision}&rdquo;
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-[var(--wpl-text-muted)] border border-[var(--wpl-card-border)] rounded-2xl bg-[var(--wpl-card-bg)]">
          No matches loaded. Create or refresh fixtures to proceed.
        </div>
      )}
    </div>
  );
}
