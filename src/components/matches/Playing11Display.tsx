/**
 * Component to display playing 11 for end users
 * End users only see playing 11 once admin publishes it (playing11.setAt)
 */

'use client';

import { useMemo } from 'react';
import { Match, Player } from '@/types';
import { isPlaying11VisibleNow, getPlaying11VisibilityMessage } from '@/lib/playing11Utils';

interface Playing11DisplayProps {
  match: Match;
  players: Player[];
}

export default function Playing11Display({ match, players }: Playing11DisplayProps) {
  const isVisible = useMemo(() => {
    if (!match.playing11) return false;
    return isPlaying11VisibleNow(match.date, match.time, match.playing11.setAt);
  }, [match]);

  const visibilityMessage = useMemo(() => {
    return getPlaying11VisibilityMessage(match.date, match.time);
  }, [match.date, match.time]);

  // Get actual player objects for each team
  const team1Players = useMemo(() => {
    if (!match.playing11?.team1) return [];
    return match.playing11.team1
      .map(playerId => players.find(p => p.id === playerId))
      .filter(Boolean) as Player[];
  }, [match.playing11, players]);

  const team2Players = useMemo(() => {
    if (!match.playing11?.team2) return [];
    return match.playing11.team2
      .map(playerId => players.find(p => p.id === playerId))
      .filter(Boolean) as Player[];
  }, [match.playing11, players]);

  if (!match.playing11 || !match.playing11.team1 || !match.playing11.team2) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-500/30 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-gray-300">Playing XI Not Yet Revealed</p>
            <p className="text-xs text-gray-400 mt-1">{visibilityMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Team 1 */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white mb-3">{match.team1.name}</h3>
        <div className="space-y-2">
          {team1Players.map((player) => (
            <div key={player.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span className="text-sm text-gray-200">
                {player.name}
                {player.isCaptain && <span className="ml-2 text-xs font-bold text-yellow-400">(C)</span>}
              </span>
              <span className="text-xs text-gray-400">#{player.jerseyNumber || '-'}</span>
            </div>
          ))}
          {team1Players.length === 0 && (
            <p className="text-xs text-gray-500 italic">Players list loading...</p>
          )}
        </div>
      </div>

      {/* Team 2 */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white mb-3">{match.team2.name}</h3>
        <div className="space-y-2">
          {team2Players.map((player) => (
            <div key={player.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span className="text-sm text-gray-200">
                {player.name}
                {player.isCaptain && <span className="ml-2 text-xs font-bold text-yellow-400">(C)</span>}
              </span>
              <span className="text-xs text-gray-400">#{player.jerseyNumber || '-'}</span>
            </div>
          ))}
          {team2Players.length === 0 && (
            <p className="text-xs text-gray-500 italic">Players list loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}
