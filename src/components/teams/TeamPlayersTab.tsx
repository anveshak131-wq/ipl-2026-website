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
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          {teamName} Squad {new Date().getFullYear()}
        </h2>
        <p className="text-slate-400">
          Meet the players representing {teamName} in the current season
        </p>
      </div>
      
      <ModernPlayersPanel 
        initialPlayers={players} 
        teams={teams}
      />
    </div>
  );
}
