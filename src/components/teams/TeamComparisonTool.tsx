'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus, Trophy, Users, Target } from 'lucide-react';
import { Team } from '@/types';
import { getAnimatedLogoPath } from '@/lib/logoUtils';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import CustomEmoji from '@/components/emoji/CustomEmoji';

interface TeamComparisonToolProps {
  teams: Team[];
  onClose: () => void;
}

export default function TeamComparisonTool({ teams, onClose }: TeamComparisonToolProps) {
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);

  const toggleTeam = (team: Team) => {
    if (selectedTeams.find(t => t.id === team.id)) {
      setSelectedTeams(selectedTeams.filter(t => t.id !== team.id));
    } else if (selectedTeams.length < 3) {
      setSelectedTeams([...selectedTeams, team]);
    }
  };

  const removeTeam = (teamId: string) => {
    setSelectedTeams(selectedTeams.filter(t => t.id !== teamId));
  };

  const compareStat = (stat: keyof Team, label: string, formatter?: (value: any) => string) => {
    if (selectedTeams.length < 2) return null;

    const values = selectedTeams.map(team => {
      const value = team[stat];
      return { team, value: formatter ? formatter(value) : value };
    });

    const sorted = [...values].sort((a, b) => {
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        return b.value - a.value;
      }
      return String(a.value).localeCompare(String(b.value));
    });

    return { label, values: sorted };
  };

  const stats = [
    compareStat('trophies', 'Trophies', (trophies) => String((trophies as any)?.length || 0)),
    compareStat('players', 'Squad Size', (players) => String((players as any)?.length || 0)),
    compareStat('name', 'Team Name'),
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
            <h2 className="text-3xl font-bold text-white">Compare Teams</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Team Selection */}
          <div className="mb-8">
            <p className="text-sm text-gray-400 mb-4">
              Select up to 3 teams to compare (selected: {selectedTeams.length}/3)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {teams.map((team) => {
                const isSelected = selectedTeams.find(t => t.id === team.id);
                const canSelect = !isSelected && selectedTeams.length < 3;
                const animatedLogo = getAnimatedLogoPath(team.id);
                const isRCB = animatedLogo.endsWith('rcb_logo_premium.svg');

                return (
                  <motion.button
                    key={team.id}
                    onClick={() => canSelect && toggleTeam(team)}
                    disabled={!canSelect && !isSelected}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
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
                    <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      {isRCB ? (
                        <RCBLionLogo className="w-full h-full" />
                      ) : (
                        <img
                          src={animatedLogo}
                          alt={team.shortName}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <p className="text-xs font-bold text-white text-center">{team.shortName}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Comparison Results */}
          {selectedTeams.length >= 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-4">Comparison</h3>
              
              {/* Selected Teams Header */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedTeams.length + 1}, 1fr)` }}>
                <div className="font-bold text-gray-400">Stat</div>
                {selectedTeams.map((team) => (
                  <div key={team.id} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                      {getAnimatedLogoPath(team.id).endsWith('rcb_logo_premium.svg') ? (
                        <RCBLionLogo className="w-full h-full" />
                      ) : (
                        <img
                          src={getAnimatedLogoPath(team.id)}
                          alt={team.shortName}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <p className="text-sm font-bold text-white">{team.shortName}</p>
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
                  style={{ gridTemplateColumns: `repeat(${selectedTeams.length + 1}, 1fr)` }}
                >
                  <div className="font-semibold text-gray-300 flex items-center gap-2">
                    {stat?.label === 'Trophies' && <Trophy className="w-4 h-4" />}
                    {stat?.label === 'Squad Size' && <Users className="w-4 h-4" />}
                    {stat?.label}
                  </div>
                  {stat?.values.map((item, idx) => {
                    const isBest = idx === 0 && stat?.values.length > 1;
                    return (
                      <div
                        key={item.team.id}
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

          {selectedTeams.length < 2 && (
            <div className="text-center py-12 text-gray-400">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select at least 2 teams to compare</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

