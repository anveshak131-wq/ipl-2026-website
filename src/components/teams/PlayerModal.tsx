'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import ModernDialog from '@/components/admin/ModernDialog';
import FlagImage from '@/components/ui/FlagImage';
import { computeRoleRawScore, applyReliability, gradeFromPercentile } from '@/lib/playerRanking';
import { usePlayerUpdates } from '@/hooks/usePlayerUpdates';
import {
  Eye,
  Star,
} from 'lucide-react';

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  teamColors?: {
    primary: string;
    secondary: string;
  };
  teamData?: Team;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function PlayerModal({ player, isOpen, onClose, teamColors, teamData }: PlayerModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamColorsState, setTeamColorsState] = useState<{ primary: string; secondary: string } | null>(teamColors || null);
  const [leaguePlayers, setLeaguePlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(player);

  useEffect(() => {
    if (player) setCurrentPlayer(player);
  }, [player]);

  const shownPlayer = player || currentPlayer;

  useEffect(() => {
    if (!shownPlayer?.league) return;

    api
      .getTeams(shownPlayer.league)
      .then((data) => setTeams(data))
      .catch((error) => console.error('Error fetching teams for player modal:', error));
  }, [shownPlayer?.league]);

  const refreshLeaguePlayers = async (playerId?: string) => {
    if (!shownPlayer) return;

    try {
      const allPlayers = await api.getPlayers(undefined, shownPlayer.league);
      setLeaguePlayers(allPlayers);

      const matchId = playerId || shownPlayer.id;
      const updated = allPlayers.find((p) => String(p.id) === String(matchId));
      if (updated) {
        setCurrentPlayer(updated);
      }
    } catch (error) {
      console.error('Error refreshing player data in modal:', error);
    }
  };

  // Real-time player updates (admin edits)
  usePlayerUpdates(async (playerId: string) => {
    if (!shownPlayer) return;
    if (playerId && shownPlayer.id !== playerId) return;

    await refreshLeaguePlayers(playerId);
  }, [shownPlayer?.id, shownPlayer?.league]);

  useEffect(() => {
    if (!isOpen || !shownPlayer) return;
    refreshLeaguePlayers();
  }, [isOpen, shownPlayer?.id, shownPlayer?.league]);

  useEffect(() => {
    if (teamColors) {
      setTeamColorsState(teamColors);
      return;
    }

    if (teamData?.colors) {
      setTeamColorsState(teamData.colors);
      return;
    }

    if (!shownPlayer?.teamId) return;

    api
      .getTeams(shownPlayer.league)
      .then((teams) => {
        const matched = teams.find((t) => String(t.id) === String(shownPlayer.teamId));
        if (matched?.colors) setTeamColorsState(matched.colors);
      })
      .catch((error) => console.error('Error fetching team colors:', error));
  }, [shownPlayer?.teamId, shownPlayer?.league, teamColors, teamData]);

  const getPerformanceMeta = (targetPlayer: Player) => {
    const raw = computeRoleRawScore(targetPlayer);
    const matches = Number(targetPlayer.stats?.matches || 0);
    const score = Math.round(applyReliability(raw, matches));
    const league = targetPlayer.league || 'ipl';
    const grade = gradeFromPercentile(
      score,
      targetPlayer.role,
      league,
      leaguePlayers.length > 0 ? leaguePlayers : [targetPlayer],
    );

    const label =
      grade === 'A' ? 'Excellent' :
      grade === 'B' ? 'Good' :
      grade === 'C' ? 'Average' :
      'Poor';

    const color =
      grade === 'A' ? '#10B981' :
      grade === 'B' ? '#3B82F6' :
      grade === 'C' ? '#F59E0B' :
      '#EF4444';

    const textColor =
      grade === 'A' ? 'text-green-400' :
      grade === 'B' ? 'text-blue-400' :
      grade === 'C' ? 'text-yellow-400' :
      'text-red-400';

    return { score, grade, label, color, textColor };
  };

  const getPerformanceIndicator = (targetPlayer: Player): string => getPerformanceMeta(targetPlayer).grade;
  const getPerformanceLabel = (targetPlayer: Player): string => getPerformanceMeta(targetPlayer).label;
  const getPerformanceTextColor = (targetPlayer: Player): string => getPerformanceMeta(targetPlayer).textColor;

  const renderRecentFormBand = (targetPlayer: Player, size: 'sm' | 'md' = 'sm'): ReactNode => {
    const { score, color } = getPerformanceMeta(targetPlayer);
    const markerSizeClass = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
    const trackHeightClass = size === 'md' ? 'h-3.5' : 'h-3';
    const textSizeClass = size === 'md' ? 'text-xs' : 'text-[11px]';

    return (
      <div>
        <div className={`relative ${trackHeightClass} rounded-full overflow-hidden border border-white/15 bg-white/5`}>
          <div className="absolute inset-y-0 left-0 w-1/4 bg-red-500/60" />
          <div className="absolute inset-y-0 left-1/4 w-1/4 bg-amber-500/60" />
          <div className="absolute inset-y-0 left-2/4 w-1/4 bg-sky-500/60" />
          <div className="absolute inset-y-0 left-3/4 w-1/4 bg-emerald-500/60" />
          <div
            className={`absolute top-1/2 ${markerSizeClass} rounded-full border-2 border-white shadow-lg`}
            style={{
              left: `${score}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: color,
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-gray-400 font-medium">
          <span>Poor</span>
          <span>Average</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
        <div className={`mt-1 ${textSizeClass} text-gray-300`}>
          Form score: <span className="font-semibold text-white">{score}/100</span>
        </div>
      </div>
    );
  };

  const selectedTeam = useMemo(() => {
    if (!shownPlayer) return null;
    if (teamData && String(teamData.id) === String(shownPlayer.teamId)) return teamData;
    return teams.find((t) => String(t.id) === String(shownPlayer.teamId)) || null;
  }, [shownPlayer, teamData, teams]);

  const stats = shownPlayer?.stats || null;
  const highestScore = Number(stats?.highest ?? (stats as any)?.highestScore ?? 0);
  const average = Number(stats?.average || 0);
  const strikeRate = Number(stats?.strikeRate || 0);

  return (
    <ModernDialog
      isOpen={isOpen && !!shownPlayer}
      onClose={onClose}
      title="Player Details"
      description="Complete player information and statistics"
      variant="info"
      size="lg"
      icon={
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <Eye className="w-6 h-6 text-white" />
        </div>
      }
    >
      {shownPlayer && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-white/10">
            <div
              className="w-20 h-20 rounded-full overflow-hidden border-3 border-white/20 shadow-xl"
              style={{ borderColor: selectedTeam?.colors?.primary || teamColorsState?.primary || '#3B82F6' }}
            >
              {shownPlayer.photoUrl ? (
                <Image
                  src={shownPlayer.photoUrl}
                  alt={shownPlayer.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-bold text-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${selectedTeam?.colors?.primary || teamColorsState?.primary || '#3B82F6'}, ${selectedTeam?.colors?.secondary || teamColorsState?.secondary || '#8B5CF6'})`,
                  }}
                >
                  {getInitials(shownPlayer.name)}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2">{shownPlayer.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-300 flex-wrap">
                <span className="flex items-center gap-2">
                  {shownPlayer.nationality && <FlagImage nationality={shownPlayer.nationality} size="sm" />}
                  {shownPlayer.nationality || 'Unknown'}
                </span>
                <span>•</span>
                <span>Age: {shownPlayer.age || 'N/A'}</span>
                <span>•</span>
                <span>Jersey #{shownPlayer.jerseyNumber || 'N/A'}</span>
                {shownPlayer.isCaptain && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    <Star className="w-3 h-3" /> Captain
                  </span>
                )}
              </div>
            </div>
          </div>

          {selectedTeam && (
            <div className="p-4 bg-gray-800/50 rounded-xl border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-3">Team Information</h4>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl text-white font-bold flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: selectedTeam.colors.primary }}
                >
                  {selectedTeam.shortName}
                </div>
                <div>
                  <p className="text-white font-medium">{selectedTeam.name}</p>
                  <p className="text-gray-400 text-sm">{selectedTeam.league === 'wpl' ? 'WPL' : 'IPL'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-xl border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-3">Player Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Role:</span>
                  <span className="text-white font-medium">{shownPlayer.role}</span>
                </div>
                {shownPlayer.allrounderType && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white font-medium">{shownPlayer.allrounderType}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Batting Style:</span>
                  <span className="text-white font-medium">{shownPlayer.battingStyle || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bowling Style:</span>
                  <span className="text-white font-medium">{shownPlayer.bowlingStyle || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-800/50 rounded-xl border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-3">Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Performance Grade:</span>
                  <span className={`font-bold text-lg ${getPerformanceTextColor(shownPlayer)}`}>
                    {getPerformanceIndicator(shownPlayer)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Performance:</span>
                  <span className={`text-white font-medium ${getPerformanceTextColor(shownPlayer)}`}>
                    {getPerformanceLabel(shownPlayer)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-xl border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4">Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-ipl-gold">{stats?.runs || 0}</p>
                <p className="text-xs text-gray-400">Runs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{stats?.wickets || 0}</p>
                <p className="text-xs text-gray-400">Wickets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{average > 0 ? average.toFixed(2) : '-'}</p>
                <p className="text-xs text-gray-400">Average</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{strikeRate > 0 ? strikeRate.toFixed(1) : '-'}</p>
                <p className="text-xs text-gray-400">Strike Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-400">{highestScore || 0}</p>
                <p className="text-xs text-gray-400">Highest Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-400">{stats?.fifties || 0}</p>
                <p className="text-xs text-gray-400">Fifties</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{stats?.hundreds || 0}</p>
                <p className="text-xs text-gray-400">Hundreds</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{stats?.economy || 0}</p>
                <p className="text-xs text-gray-400">Economy</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-xl border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-3">Recent Form</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Season Form Snapshot</span>
              <span className={`text-sm font-bold ${getPerformanceTextColor(shownPlayer)}`}>
                {getPerformanceLabel(shownPlayer)}
              </span>
            </div>
            {renderRecentFormBand(shownPlayer, 'md')}
            <p className="mt-3 text-xs text-gray-500">
              Based on season aggregate stats, not match-by-match trend.
            </p>
          </div>
        </div>
      )}
    </ModernDialog>
  );
}
