'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Team, Player, KeyPlayers } from '@/types';
import Icon from '@/components/ui/Icon';

type KeyRoleId =
  | 'powerHitter'
  | 'anchor'
  | 'finisher'
  | 'strikeBowler'
  | 'deathSpecialist'
  | 'allRoundXFactor';

const KEY_ROLE_LABELS: Record<KeyRoleId, string> = {
  powerHitter: 'Power hitter',
  anchor: 'Anchor',
  finisher: 'Finisher',
  strikeBowler: 'Strike bowler',
  deathSpecialist: 'Death specialist',
  allRoundXFactor: 'X-factor all-rounder',
};

interface PlayerWithTeam extends Player {
  teamName?: string;
  teamShortName?: string;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [playerKeyRoles, setPlayerKeyRoles] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<'all' | string>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | Player['role']>('all');
  const [nationalityFilter, setNationalityFilter] = useState<'all' | 'indian' | 'overseas'>('all');
  const [keyRoleFilter, setKeyRoleFilter] = useState<'all' | KeyRoleId>('all');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [playersRes, teamsRes, keyPlayersRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/teams'),
          fetch('/api/key-players'),
        ]);

        if (!playersRes.ok) throw new Error('Failed to load players');
        const playersData: Player[] = await playersRes.json();

        let teamsData: Team[] = [];
        if (teamsRes.ok) {
          teamsData = await teamsRes.json();
          setTeams(teamsData);
        }

        const playersWithTeam: PlayerWithTeam[] = playersData.map((p) => {
          const team = teamsData.find((t) => t.id === p.teamId);
          return {
            ...p,
            teamName: team?.name,
            teamShortName: team?.shortName,
          };
        });

        setPlayers(playersWithTeam);

        // Build player -> key roles map
        const keyRolesMap: Record<string, string[]> = {};
        if (keyPlayersRes.ok) {
          const raw = await keyPlayersRes.json();
          const allKeyPlayers: any[] = Array.isArray(raw) ? raw : [];

          allKeyPlayers.forEach((kp: KeyPlayers | any) => {
            const addRole = (ids: string[] | string | undefined, label: string) => {
              if (!ids) return;
              const arr = Array.isArray(ids) ? ids : [ids];
              arr.forEach((id) => {
                if (!id) return;
                if (!keyRolesMap[id]) keyRolesMap[id] = [];
                if (!keyRolesMap[id].includes(label)) {
                  keyRolesMap[id].push(label);
                }
              });
            };

            addRole((kp as any).powerHitterIds ?? (kp as any).powerHitterId, KEY_ROLE_LABELS.powerHitter);
            addRole((kp as any).anchorIds ?? (kp as any).anchorId, KEY_ROLE_LABELS.anchor);
            addRole((kp as any).finisherIds ?? (kp as any).finisherId, KEY_ROLE_LABELS.finisher);
            addRole((kp as any).strikeBowlerIds ?? (kp as any).strikeBowlerId, KEY_ROLE_LABELS.strikeBowler);
            addRole((kp as any).deathSpecialistIds ?? (kp as any).deathSpecialistId, KEY_ROLE_LABELS.deathSpecialist);
            addRole((kp as any).allRoundXFactorIds ?? (kp as any).allRoundXFactorId, KEY_ROLE_LABELS.allRoundXFactor);
          });
        }

        setPlayerKeyRoles(keyRolesMap);
      } catch (err: any) {
        console.error('Error loading players:', err);
        setError(err.message || 'Failed to load players');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPlayers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return players.filter((p) => {
      if (term && !p.name.toLowerCase().includes(term)) {
        return false;
      }

      if (teamFilter !== 'all' && p.teamId !== teamFilter) {
        return false;
      }

      if (roleFilter !== 'all' && p.role !== roleFilter) {
        return false;
      }

      if (nationalityFilter === 'indian' && p.nationality !== 'India') {
        return false;
      }
      if (nationalityFilter === 'overseas' && p.nationality === 'India') {
        return false;
      }

      if (keyRoleFilter !== 'all') {
        const label = KEY_ROLE_LABELS[keyRoleFilter];
        const roles = playerKeyRoles[p.id] || [];
        if (!roles.includes(label)) {
          return false;
        }
      }

      return true;
    });
  }, [players, searchTerm, teamFilter, roleFilter, nationalityFilter, keyRoleFilter, playerKeyRoles]);

  const selectedForCompare = compareIds
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is PlayerWithTeam => Boolean(p));

  const toggleCompare = (playerId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }
      if (prev.length >= 2) {
        return [prev[1], playerId];
      }
      return [...prev, playerId];
    });
  };

  const getKeyRoleBadges = (playerId: string) => playerKeyRoles[playerId] || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-gray-950 relative">
      <AuroraBackground />
      <Navbar />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        {/* Header */}
        <section className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3">
              Player Explorer
            </h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-xl">
              Search, filter, and compare players across all teams. Admin-picked key roles like power hitter
              or strike bowler are highlighted.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-slate-900/60 border border-white/10 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Players</p>
              <p className="text-lg font-bold text-white">{players.length}</p>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-white/10 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Teams</p>
              <p className="text-lg font-bold text-white">{teams.length}</p>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-white/10 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Key-role tags</p>
              <p className="text-lg font-bold text-white">{
                Object.values(playerKeyRoles).reduce((acc, roles) => acc + roles.length, 0)
              }</p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1 max-w-xl">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                <Icon name="team" size={14} />
              </span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search players by name"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/60 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-1 focus:ring-ipl-gold/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Team filter */}
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-ipl-gold"
            >
              <option value="all">All teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.shortName})
                </option>
              ))}
            </select>

            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-ipl-gold"
            >
              <option value="all">All roles</option>
              <option value="Batsman">Batters</option>
              <option value="All-rounder">All-rounders</option>
              <option value="Bowler">Bowlers</option>
              <option value="Wicket-keeper">Wicket-keepers</option>
            </select>

            {/* Nationality filter */}
            <select
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-ipl-gold"
            >
              <option value="all">All nationalities</option>
              <option value="indian">Indian players</option>
              <option value="overseas">Overseas players</option>
            </select>

            {/* Key-role filter */}
            <select
              value={keyRoleFilter}
              onChange={(e) => setKeyRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-ipl-gold"
            >
              <option value="all">All players</option>
              {(
                Object.keys(KEY_ROLE_LABELS) as KeyRoleId[]
              ).map((id) => (
                <option key={id} value={id}>
                  {KEY_ROLE_LABELS[id]}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Loading / error */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-400">{error}</div>
        ) : (
          <>
            {/* Compare panel */}
            {selectedForCompare.length > 0 && (
              <section className="mb-8 rounded-2xl bg-slate-900/80 border border-ipl-gold/30 p-4 sm:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-ipl-gold tracking-wide uppercase">Comparison</h2>
                  <button
                    onClick={() => setCompareIds([])}
                    className="text-[11px] text-gray-400 hover:text-gray-200"
                  >
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedForCompare.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl bg-slate-800/70 border border-white/10 p-4 text-xs text-gray-200 space-y-2"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-sm font-semibold text-white">{p.name}</p>
                          <p className="text-[11px] text-gray-400">
                            {p.teamShortName || p.teamName || 'Unknown team'} · {p.role}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleCompare(p.id)}
                          className="text-[10px] text-gray-400 hover:text-gray-200"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px]">
                        <div>
                          <p className="text-gray-400">Matches</p>
                          <p className="font-semibold text-white">{p.stats.matches}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Runs</p>
                          <p className="font-semibold text-white">{p.stats.runs}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Wickets</p>
                          <p className="font-semibold text-white">{p.stats.wickets}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <p className="text-gray-400">SR</p>
                          <p className="font-semibold text-white">{p.stats.strikeRate}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Avg</p>
                          <p className="font-semibold text-white">{p.stats.average}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Eco</p>
                          <p className="font-semibold text-white">{p.stats.economy}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {getKeyRoleBadges(p.id).map((label) => (
                          <span
                            key={label}
                            className="px-2 py-0.5 rounded-full bg-ipl-gold/10 border border-ipl-gold/40 text-[10px] text-ipl-gold font-semibold"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {selectedForCompare.length === 1 && (
                    <div className="hidden sm:flex items-center justify-center text-[11px] text-gray-500 border border-dashed border-white/10 rounded-xl">
                      Select another player card to compare side-by-side.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Players grid */}
            {filteredPlayers.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                No players found for this combination of filters.
              </div>
            ) : (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlayers.map((player) => {
                  const keyRoles = getKeyRoleBadges(player.id);
                  const selected = compareIds.includes(player.id);

                  return (
                    <div
                      key={player.id}
                      className="group relative overflow-hidden rounded-2xl backdrop-blur-xl p-5 border cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-xl hover:shadow-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/90 border-white/10"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-base font-semibold text-white mb-0.5 truncate">{player.name}</p>
                          <p className="text-[11px] text-gray-400">
                            {player.teamShortName || player.teamName || 'Unknown team'} · {player.role}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCompare(player.id)}
                          className={`px-2 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                            selected
                              ? 'bg-ipl-gold text-slate-900 border-ipl-gold'
                              : 'bg-slate-900/60 text-gray-200 border-white/15 hover:bg-slate-800'
                          }`}
                        >
                          {selected ? 'Selected' : 'Compare'}
                        </button>
                      </div>

                      {/* Key role badges */}
                      {keyRoles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {keyRoles.slice(0, 3).map((label) => (
                            <span
                              key={label}
                              className="px-2 py-0.5 rounded-full bg-ipl-gold/10 border border-ipl-gold/40 text-[10px] text-ipl-gold font-semibold"
                            >
                              {label}
                            </span>
                          ))}
                          {keyRoles.length > 3 && (
                            <span className="text-[10px] text-gray-400">+{keyRoles.length - 3} more</span>
                          )}
                        </div>
                      )}

                      {/* Basic stats */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-[11px] text-gray-300">
                        <div>
                          <p className="text-gray-400">Matches</p>
                          <p className="font-semibold text-white">{player.stats.matches}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Runs</p>
                          <p className="font-semibold text-white">{player.stats.runs}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Wickets</p>
                          <p className="font-semibold text-white">{player.stats.wickets}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-2 text-[11px] text-gray-300">
                        <div>
                          <p className="text-gray-400">SR</p>
                          <p className="font-semibold text-white">{player.stats.strikeRate}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Avg</p>
                          <p className="font-semibold text-white">{player.stats.average}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Highest</p>
                          <p className="font-semibold text-white">{player.stats.highest}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
