'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/data';
import type { Player, Team } from '@/types';
import ModernPlayersPanel from '../players/ModernPlayersPanel';

interface TeamPlayersTabProps {
  teamId: string;
  teamName: string;
  initialPlayers?: Player[];
  league?: 'ipl' | 'wpl';
}

function isMatchingTeam(
  playerTeamRef: unknown,
  playerTeamName: unknown,
  targetTeamRef: unknown,
  teams: Team[]
): boolean {
  const p = String(playerTeamRef ?? '').toLowerCase().trim();
  const pn = String(playerTeamName ?? '').toLowerCase().trim();
  const t = String(targetTeamRef ?? '').toLowerCase().trim();
  if (!t) return false;

  const pClean = p.replace(/^team[-_]?/i, '');
  const tClean = t.replace(/^team[-_]?/i, '');

  if (p === t || pClean === tClean) return true;

  const rcbAliases = [
    '1',
    'rcb',
    'royal-challengers-bangalore',
    'royal-challengers-bengaluru',
    'royal challengers bangalore',
    'royal challengers bengaluru'
  ];

  if (rcbAliases.includes(tClean)) {
    if (rcbAliases.includes(pClean)) return true;
    if (pn.includes('bengaluru') || pn.includes('bangalore') || pn === 'rcb') return true;
  }

  const matched = teams.find((team) => {
    const id = String(team.id).toLowerCase();
    const short = String(team.shortName || '').toLowerCase();
    const name = String(team.name || '').toLowerCase();
    return id === tClean || short === tClean || name === tClean;
  });

  if (matched) {
    const id = String(matched.id).toLowerCase();
    const short = String(matched.shortName || '').toLowerCase();
    const name = String(matched.name || '').toLowerCase();
    return (
      pClean === id ||
      pClean === short ||
      pClean === name ||
      pn === name ||
      pn === short
    );
  }

  return false;
}

export default function TeamPlayersTab({
  teamId,
  teamName,
  initialPlayers = [],
  league
}: TeamPlayersTabProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isLoading, setIsLoading] = useState(!initialPlayers.length);
  const [teams, setTeams] = useState<Team[]>([]);
  const [accentColors, setAccentColors] = useState<{ primary: string; secondary: string } | null>(null);

  useEffect(() => {
    if (initialPlayers && initialPlayers.length > 0) {
      setPlayers(initialPlayers);
      setIsLoading(false);
    }
  }, [initialPlayers]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        if (!initialPlayers.length) {
          setIsLoading(true);
        }

        const [playersData, teamsData] = await Promise.all([
          api.getPlayers(undefined, league),
          api.getTeams(league),
        ]);

        if (cancelled) return;

        setTeams(teamsData);

        const matchedTeam = teamsData.find((t) =>
          isMatchingTeam(t.id, t.name, teamId, teamsData)
        );

        if (matchedTeam && (matchedTeam as any).colors) {
          setAccentColors((matchedTeam as any).colors);
        } else if (matchedTeam && matchedTeam.primaryColor) {
          setAccentColors({
            primary: matchedTeam.primaryColor,
            secondary: matchedTeam.secondaryColor || '#E5B80B'
          });
        }

        const teamPlayers = (playersData || []).filter((p: any) =>
          isMatchingTeam(p.teamId, p.teamName, teamId, teamsData)
        );

        if (teamPlayers.length > 0) {
          setPlayers(teamPlayers);
        } else if (initialPlayers && initialPlayers.length > 0) {
          setPlayers(initialPlayers);
        }
      } catch (error) {
        console.error('Error fetching squad data:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [teamId, league, initialPlayers.length]);

  if (isLoading && players.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: accentColors?.primary || '#DA1A32' }}
          />
          Players • {new Date().getFullYear()}
        </div>
        <h2 className="mt-3 text-2xl md:text-3xl font-black tracking-tight text-white">
          {teamName} Squad
        </h2>
        <p className="mt-2 text-sm md:text-base text-white/60">
          Search by name or role and tap a player for the quick profile view.
        </p>
      </div>

      <ModernPlayersPanel 
        players={players}
        initialPlayers={players} 
        teamId={teamId}
        teams={teams}
        showHeader={false}
        showTeamFilter={false}
        accentColor={accentColors?.primary || '#DA1A32'}
        accentColorSecondary={accentColors?.secondary || '#E5B80B'}
        searchPlaceholder={`Search ${teamName} players…`}
      />
    </div>
  );
}
