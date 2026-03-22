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

function resolveCanonicalTeamId(teamRef: unknown, teams: Team[]): string {
  const raw = String(teamRef ?? '').trim();
  if (!raw) return '';

  const withoutPrefix = raw.replace(/^team/i, '');
  if (/^\d+$/.test(withoutPrefix)) return withoutPrefix;

  const lower = raw.toLowerCase();
  const match = teams.find((t) => {
    const short = String(t.shortName || '').toLowerCase();
    const name = String(t.name || '').toLowerCase();
    return (
      short === lower ||
      short.replace('-w', '') === lower ||
      name === lower
    );
  });

  if (match) return String(match.id);
  return withoutPrefix.toLowerCase();
}

export default function TeamPlayersTab({ teamId, teamName, initialPlayers = [], league }: TeamPlayersTabProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isLoading, setIsLoading] = useState(!initialPlayers.length);
  const [teams, setTeams] = useState<Team[]>([]);
  const [canonicalTeamId, setCanonicalTeamId] = useState<string>(() => String(teamId ?? ''));
  const [accentColors, setAccentColors] = useState<{ primary: string; secondary: string } | null>(null);

  useEffect(() => {
    setPlayers(initialPlayers);
    if (initialPlayers.length > 0) {
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

        const canonicalTeamId = resolveCanonicalTeamId(teamId, teamsData);
        setCanonicalTeamId(canonicalTeamId);

        const matchedTeam = teamsData.find((t) => String(t.id) === String(canonicalTeamId));
        setAccentColors(matchedTeam?.colors ? matchedTeam.colors : null);

        const teamPlayers = (playersData || []).filter((p) => {
          const playerTeamId = resolveCanonicalTeamId(p.teamId, teamsData);
          return playerTeamId === canonicalTeamId;
        });

        // Only replace local state if KV returns data (otherwise preserve initialPlayers)
        if (teamPlayers.length > 0 || !initialPlayers.length) {
          setPlayers(teamPlayers);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: accentColors?.primary || '#7C3AED' }}
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
        initialPlayers={players} 
        teams={teams}
        showHeader={false}
        showTeamFilter={false}
        defaultTeamId={canonicalTeamId}
        accentColor={accentColors?.primary}
        accentColorSecondary={accentColors?.secondary}
        searchPlaceholder={`Search ${teamName} players…`}
      />
    </div>
  );
}
