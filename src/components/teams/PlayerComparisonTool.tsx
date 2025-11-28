'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { Player } from '@/types';

interface PlayerComparisonToolProps {
  players: Player[];
  primaryColor: string;
  onClose: () => void;
}

export default function PlayerComparisonTool({
  players,
  primaryColor,
  onClose,
}: PlayerComparisonToolProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  const togglePlayer = (player: Player) => {
    if (selectedPlayers.find((p) => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p.id !== player.id));
    } else if (selectedPlayers.length < 3) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const removePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerId));
  };

  const compareStat = (stat: keyof Player['stats'], label: string) => {
    if (selectedPlayers.length < 2) return null;

    const values = selectedPlayers.map((player) => ({
      player,
      value: player.stats[stat],
    }));

    const sorted = [...values].sort((a, b) => {
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        return b.value - a.value;
      }
      return String(a.value).localeCompare(String(b.value));
    });

    return { label, values: sorted };
  };

  const stats = [
    compareStat('runs', 'Runs'),
    compareStat('wickets', 'Wickets'),
    compareStat('average', 'Batting Average'),
    compareStat('strikeRate', 'Strike Rate'),
    compareStat('matches', 'Matches'),
  ].filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/20 p-6 md:p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-8 h-8" style={{ color: primaryColor }} />
              Compare Players
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Player Selection */}
          <div className="mb-8">
            <p className="text-sm text-gray-400 mb-4">
              Select up to 3 players to compare (selected: {selectedPlayers.length}/3)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-64 overflow-y-auto">
              {players.map((player) => {
                const isSelected = selectedPlayers.find((p) => p.id === player.id);
                const canSelect = !isSelected && selectedPlayers.length < 3;

                return (
                  <motion.button
                    key={player.id}
                    onClick={() => canSelect && togglePlayer(player)}
                    disabled={!canSelect && !isSelected}
                    className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/20'
                        : canSelect
                        ? 'border-white/20 bg-white/5 hover:border-blue-500/50 hover:bg-white/10'
                        : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                    }`}
                    whileHover={canSelect ? { scale: 1.05 } : {}}
                    whileTap={canSelect ? { scale: 0.95 } : {}}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="text-xs font-bold text-white mb-1">{player.name}</div>
                    <div className="text-xs text-gray-400">{player.role}</div>
                    <div className="text-xs text-gray-500 mt-1">#{player.jerseyNumber}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Comparison Results */}
          {selectedPlayers.length >= 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-4">Comparison</h3>

              {/* Selected Players Header */}
              <div
                className="grid gap-4 p-4 rounded-xl bg-white/5"
                style={{ gridTemplateColumns: `repeat(${selectedPlayers.length + 1}, 1fr)` }}
              >
                <div className="font-bold text-gray-400">Stat</div>
                {selectedPlayers.map((player) => (
                  <div key={player.id} className="text-center">
                    <div className="font-bold text-white">{player.name}</div>
                    <div className="text-xs text-gray-400">{player.role}</div>
                  </div>
                ))}
              </div>

              {/* Stats Comparison */}
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="grid gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                  style={{ gridTemplateColumns: `repeat(${selectedPlayers.length + 1}, 1fr)` }}
                >
                  <div className="font-semibold text-gray-300">{stat?.label}</div>
                  {stat?.values.map((item, idx) => {
                    const isBest = idx === 0 && stat?.values.length > 1;
                    return (
                      <div
                        key={item.player.id}
                        className={`text-center p-2 rounded-lg ${
                          isBest ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isBest && <TrendingUp className="w-4 h-4 text-green-400" />}
                          <span className="font-bold text-white">{String(item.value)}</span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ))}
            </div>
          )}

          {selectedPlayers.length < 2 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select at least 2 players to compare</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

