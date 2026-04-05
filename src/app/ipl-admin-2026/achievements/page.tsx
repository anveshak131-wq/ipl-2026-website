'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Calendar, Plus, Save, Trash2, Users, Target } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';
import { AchievementEntry, Match, Player, Team } from '@/types';

const START_YEAR: Record<'ipl' | 'wpl', number> = {
  ipl: 2008,
  wpl: 2023,
};

const getSeasonFromDate = (value?: string): number | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const prefix = trimmed.slice(0, 4);
  if (/^\d{4}$/.test(prefix)) {
    const parsed = Number(prefix);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).getFullYear();
};

const getTeamLabel = (team: any): string => {
  if (!team) return 'TBD';
  if (typeof team === 'string' || typeof team === 'number') return String(team);
  return team.shortName || team.name || String(team.id || 'TBD');
};

const getTeamId = (team: any): string => {
  if (!team) return '';
  if (typeof team === 'string' || typeof team === 'number') return String(team);
  return String(team.id || '');
};

const formatMatchLabel = (match: Match | null): string => {
  if (!match) return '';
  const team1 = getTeamLabel(match.team1);
  const team2 = getTeamLabel(match.team2);
  const prefix = match.matchNumber ? `${match.matchNumber} · ` : '';
  return `${prefix}${team1} vs ${team2}`;
};

const makeLocalId = (): string => `ach_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function AdminAchievementsPage() {
  const { currentLeague } = useLeague();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(new Date().getFullYear());
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [entries, setEntries] = useState<AchievementEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const startYear = START_YEAR[currentLeague] || 2008;
    const seasons: number[] = [];
    for (let y = startYear; y <= currentYear; y += 1) {
      seasons.push(y);
    }
    setAvailableSeasons(seasons);

    try {
      const stored = parseInt(localStorage.getItem(`adminAchievementsSeason_${currentLeague}`) ?? '', 10);
      if (stored >= startYear && stored <= currentYear) {
        setSelectedSeason(stored);
      } else {
        setSelectedSeason(currentYear);
      }
    } catch {
      setSelectedSeason(currentYear);
    }
  }, [currentLeague]);

  useEffect(() => {
    try {
      localStorage.setItem(`adminAchievementsSeason_${currentLeague}`, String(selectedSeason));
    } catch {
      // ignore storage errors
    }
  }, [selectedSeason, currentLeague]);

  useEffect(() => {
    let cancelled = false;

    const fetchBaseData = async () => {
      try {
        const [teamsRes, playersRes, matchesRes] = await Promise.all([
          fetch(`/api/teams?league=${currentLeague}`),
          fetch(`/api/players?league=${currentLeague}&includeInactive=true`),
          fetch(`/api/matches?league=${currentLeague}`),
        ]);

        if (!cancelled) {
          if (teamsRes.ok) {
            const teamsData = await teamsRes.json();
            setTeams(Array.isArray(teamsData) ? teamsData : []);
          } else {
            setTeams([]);
          }

          if (playersRes.ok) {
            const playersData = await playersRes.json();
            const normalized = (Array.isArray(playersData) ? playersData : []).map((player: Player) => ({
              ...player,
              teamId: String(player.teamId || ''),
            }));
            setPlayers(normalized);
          } else {
            setPlayers([]);
          }

          if (matchesRes.ok) {
            const matchesData = await matchesRes.json();
            setMatches(Array.isArray(matchesData) ? matchesData : []);
          } else {
            setMatches([]);
          }
        }
      } catch (error) {
        console.error('Error fetching achievements setup data:', error);
        if (!cancelled) {
          setTeams([]);
          setPlayers([]);
          setMatches([]);
        }
      }
    };

    fetchBaseData();

    return () => {
      cancelled = true;
    };
  }, [currentLeague]);

  const seasonMatches = useMemo(() => {
    const filtered = matches.filter((match) => getSeasonFromDate(match.date) === selectedSeason);
    return filtered.sort((a, b) => {
      const aTime = Date.parse(a.date || '');
      const bTime = Date.parse(b.date || '');
      return aTime - bTime;
    });
  }, [matches, selectedSeason]);

  const selectedMatch = useMemo(() => {
    return seasonMatches.find((match) => match.id === selectedMatchId) || null;
  }, [seasonMatches, selectedMatchId]);

  const matchTeamIds = useMemo(() => {
    if (!selectedMatch) return [] as string[];
    const ids = [getTeamId(selectedMatch.team1), getTeamId(selectedMatch.team2)].filter(Boolean);
    return Array.from(new Set(ids));
  }, [selectedMatch]);

  const matchTeams = useMemo(() => {
    if (matchTeamIds.length === 0) return teams;
    const filtered = teams.filter((team) => matchTeamIds.includes(String(team.id)));
    return filtered.length > 0 ? filtered : teams;
  }, [teams, matchTeamIds]);

  useEffect(() => {
    if (selectedMatchId && !seasonMatches.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId('');
      setEntries([]);
    }
  }, [seasonMatches, selectedMatchId]);

  useEffect(() => {
    let cancelled = false;

    const fetchAchievements = async () => {
      if (!selectedMatchId) {
        setEntries([]);
        return;
      }

      setLoading(true);
      setMessage(null);

      try {
        const res = await fetch(
          `/api/achievements?league=${currentLeague}&season=${selectedSeason}&matchId=${encodeURIComponent(
            selectedMatchId
          )}`
        );
        if (!res.ok) {
          throw new Error('Failed to fetch achievements');
        }
        const data = await res.json();
        const matchLabel = formatMatchLabel(selectedMatch);
        const matchDate = selectedMatch?.date || '';
        const normalized: AchievementEntry[] = (Array.isArray(data) ? data : []).map((entry: any) => ({
          id: String(entry.id || makeLocalId()),
          league: currentLeague,
          season: selectedSeason,
          matchId: selectedMatchId,
          matchLabel: entry.matchLabel || matchLabel,
          matchDate: entry.matchDate || matchDate,
          target: entry.target === 'team' ? 'team' : 'player',
          teamId: entry.teamId ? String(entry.teamId) : '',
          playerId: entry.playerId ? String(entry.playerId) : '',
          title: entry.title || '',
          description: entry.description || '',
          value: entry.value || '',
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        }));

        if (!cancelled) {
          setEntries(normalized);
        }
      } catch (error) {
        console.error('Error fetching achievements:', error);
        if (!cancelled) {
          setEntries([]);
          setMessage({ type: 'error', text: 'Failed to load achievements for this match.' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAchievements();

    return () => {
      cancelled = true;
    };
  }, [currentLeague, selectedSeason, selectedMatchId, selectedMatch]);

  const addEntry = () => {
    if (!selectedMatchId) {
      setMessage({ type: 'error', text: 'Select a match first.' });
      return;
    }

    const matchLabel = formatMatchLabel(selectedMatch);
    const matchDate = selectedMatch?.date || '';
    const defaultTeamId = matchTeamIds[0] || '';

    setEntries((prev) => [
      ...prev,
      {
        id: makeLocalId(),
        league: currentLeague,
        season: selectedSeason,
        matchId: selectedMatchId,
        matchLabel,
        matchDate,
        target: 'player',
        teamId: defaultTeamId,
        playerId: '',
        title: '',
        description: '',
        value: '',
      },
    ]);
  };

  const updateEntry = (id: string, updates: Partial<AchievementEntry>) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const validateEntries = (): string | null => {
    if (!selectedMatchId) return 'Please select a match.';

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const prefix = `Achievement ${i + 1}`;
      if (!entry.teamId) return `${prefix}: select a team.`;
      if (!entry.title || !entry.title.trim()) return `${prefix}: enter a title.`;
      if (entry.target === 'player' && (!entry.playerId || !entry.playerId.trim())) {
        return `${prefix}: select a player.`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const error = validateEntries();
    if (error) {
      setMessage({ type: 'error', text: error });
      return;
    }

    if (entries.length === 0) {
      const proceed = confirm('This will clear all achievements for the selected match. Continue?');
      if (!proceed) return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const pickToken = (...candidates: Array<string | null>) =>
        candidates.find((value) => value && value !== 'null' && value !== 'undefined') || null;
      const token = pickToken(
        localStorage.getItem('auth_token'),
        localStorage.getItem('adminToken'),
        sessionStorage.getItem('auth_token'),
        sessionStorage.getItem('adminToken')
      );
      if (!token) {
        setMessage({ type: 'error', text: 'Missing admin token. Please sign in again.' });
        return;
      }

      const matchLabel = formatMatchLabel(selectedMatch);
      const matchDate = selectedMatch?.date || '';

      const payload = {
        league: currentLeague,
        season: selectedSeason,
        matchId: selectedMatchId,
        matchLabel,
        matchDate,
        achievements: entries.map((entry) => ({
          ...entry,
          league: currentLeague,
          season: selectedSeason,
          matchId: selectedMatchId,
          matchLabel,
          matchDate,
        })),
      };

      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save achievements');
      }

      setMessage({ type: 'success', text: 'Achievements saved successfully.' });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-data-updated', {
          detail: {
            type: 'achievements',
            league: currentLeague,
            season: selectedSeason,
            matchId: selectedMatchId,
          },
        }));
      }
    } catch (error: any) {
      console.error('Error saving achievements:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to save achievements.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Match Achievements</h1>
        <p className="text-sm text-gray-400">
          Capture player and team achievements by match. These entries show up on player and team pages.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-green-500/40 bg-green-500/10 text-green-300'
              : 'border-red-500/40 bg-red-500/10 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="admin-card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Season
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(parseInt(e.target.value, 10))}
                className="admin-select w-full pl-9"
              >
                {availableSeasons
                  .slice()
                  .reverse()
                  .map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Match
            </label>
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="admin-select w-full"
            >
              <option value="">Select a match</option>
              {seasonMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  {formatMatchLabel(match)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedMatch && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{formatMatchLabel(selectedMatch)}</p>
                <p className="text-xs text-gray-400">
                  {selectedMatch.date
                    ? new Date(selectedMatch.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Date TBD'}
                  {selectedMatch.venue ? ` · ${selectedMatch.venue}` : ''}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-xs text-gray-300">
                <Award className="h-4 w-4 text-ipl-gold" /> {entries.length} achievement{entries.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="admin-card space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Achievements</h2>
            <p className="text-xs text-gray-400">Add awards, milestones, or match highlights.</p>
          </div>
          <button
            type="button"
            onClick={addEntry}
            className="admin-btn-secondary flex items-center gap-2"
            disabled={!selectedMatchId}
          >
            <Plus className="h-4 w-4" />
            Add achievement
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Loading achievements...</div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-gray-400">
            No achievements recorded for this match yet.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => {
              const teamPlayers = players.filter((player) => String(player.teamId) === String(entry.teamId));
              return (
                <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Target className="h-4 w-4 text-ipl-gold" />
                      Achievement {index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="admin-btn-ghost text-xs"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Target
                      </label>
                      <select
                        value={entry.target}
                        onChange={(e) =>
                          updateEntry(entry.id, {
                            target: e.target.value === 'team' ? 'team' : 'player',
                            playerId: e.target.value === 'team' ? '' : entry.playerId,
                          })
                        }
                        className="admin-select w-full"
                      >
                        <option value="player">Player</option>
                        <option value="team">Team</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Team
                      </label>
                      <select
                        value={entry.teamId || ''}
                        onChange={(e) => updateEntry(entry.id, { teamId: e.target.value, playerId: '' })}
                        className="admin-select w-full"
                      >
                        <option value="">Select team</option>
                        {matchTeams.map((team) => (
                          <option key={team.id} value={String(team.id)}>
                            {team.name} ({team.shortName})
                          </option>
                        ))}
                      </select>
                    </div>

                    {entry.target === 'player' ? (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                          Player
                        </label>
                        <select
                          value={entry.playerId || ''}
                          onChange={(e) => updateEntry(entry.id, { playerId: e.target.value })}
                          className="admin-select w-full"
                          disabled={!entry.teamId}
                        >
                          <option value="">Select player</option>
                          {teamPlayers.map((player) => (
                            <option key={player.id} value={String(player.id)}>
                              {player.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/20 text-xs text-gray-400 px-3">
                        <Users className="h-4 w-4 mr-2" />
                        Team achievement
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={entry.title}
                        onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                        className="admin-input w-full"
                        placeholder="Player of the Match"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Stat line (optional)
                      </label>
                      <input
                        type="text"
                        value={entry.value || ''}
                        onChange={(e) => updateEntry(entry.id, { value: e.target.value })}
                        className="admin-input w-full"
                        placeholder="72 off 44 balls"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={entry.description || ''}
                      onChange={(e) => updateEntry(entry.id, { description: e.target.value })}
                      className="admin-input w-full min-h-[90px]"
                      placeholder="Quick summary or context for the achievement"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="admin-btn-primary flex items-center gap-2"
            disabled={saving || !selectedMatchId}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save achievements'}
          </button>
        </div>
      </div>
    </div>
  );
}
