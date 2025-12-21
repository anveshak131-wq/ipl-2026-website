'use client';

import { useState, useEffect } from 'react';
import { Match, Player } from '@/types';
import { api } from '@/lib/data';
import { CustomEmoji } from '@/components/emoji/Emoji';
import FlagImage from '@/components/ui/FlagImage';
import { motion } from 'framer-motion';

interface Playing11DisplayProps {
  match: Match;
  className?: string;
}

export default function Playing11Display({ match, className = '' }: Playing11DisplayProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkVisibility = () => {
      if (!match.playing11VisibleAt) {
        setIsVisible(false);
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const visibleAt = new Date(match.playing11VisibleAt);
      const isVisibleNow = now >= visibleAt;

      setIsVisible(isVisibleNow);

      if (isVisibleNow && match.playing11) {
        // Load players if visible and we have playing11 data
        loadPlayers();
      } else {
        setIsLoading(false);
      }
    };

    const loadPlayers = async () => {
      try {
        const allPlayers = await api.getPlayers(undefined, match.league);
        setPlayers(allPlayers);
      } catch (error) {
        console.error('Failed to load players for playing-11:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkVisibility();

    // Check visibility every minute
    const interval = setInterval(checkVisibility, 60000);
    return () => clearInterval(interval);
  }, [match]);

  if (!match.playing11 || !isVisible) {
    return (
      <div className={`bg-white/5 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3 text-gray-400">
          <CustomEmoji type="cricket" size={24} />
          <div className="text-center">
            <p className="font-semibold">Playing XI</p>
            <p className="text-sm">Will be announced 30 minutes before match</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-white/5 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ipl-gold"></div>
        </div>
      </div>
    );
  }

  const getTeamPlayers = (team: 'team1' | 'team2') => {
    const playerIds = match.playing11?.[team] || [];
    return playerIds.map(playerId => players.find(p => p.id === playerId)).filter(Boolean) as Player[];
  };

  const team1Players = getTeamPlayers('team1');
  const team2Players = getTeamPlayers('team2');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 rounded-xl p-6 ${className}`}
    >
      <div className="flex items-center space-x-2 mb-6">
        <CustomEmoji type="cricket" size={24} />
        <h3 className="text-xl font-bold text-white">Playing XI</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Team 1 */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div
              className="w-6 h-6 rounded-full text-white font-bold text-xs flex items-center justify-center"
              style={{ backgroundColor: match.team1.colors.primary }}
            >
              {match.team1.shortName}
            </div>
            <h4 className="font-semibold text-white">{match.team1.name}</h4>
          </div>
          <div className="space-y-2">
            {team1Players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="text-sm font-mono text-gray-400 w-6">{index + 1}.</span>
                <div className="flex items-center space-x-2 flex-1">
                  {player.nationality && (
                    <FlagImage nationality={player.nationality} size="sm" />
                  )}
                  <span className="text-white font-medium">{player.name}</span>
                  {player.isCaptain && (
                    <span className="text-yellow-400 text-xs font-bold">(C)</span>
                  )}
                </div>
                <span className="text-sm text-gray-400">{player.role}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team 2 */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div
              className="w-6 h-6 rounded-full text-white font-bold text-xs flex items-center justify-center"
              style={{ backgroundColor: match.team2.colors.primary }}
            >
              {match.team2.shortName}
            </div>
            <h4 className="font-semibold text-white">{match.team2.name}</h4>
          </div>
          <div className="space-y-2">
            {team2Players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="text-sm font-mono text-gray-400 w-6">{index + 1}.</span>
                <div className="flex items-center space-x-2 flex-1">
                  {player.nationality && (
                    <FlagImage nationality={player.nationality} size="sm" />
                  )}
                  <span className="text-white font-medium">{player.name}</span>
                  {player.isCaptain && (
                    <span className="text-yellow-400 text-xs font-bold">(C)</span>
                  )}
                </div>
                <span className="text-sm text-gray-400">{player.role}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}