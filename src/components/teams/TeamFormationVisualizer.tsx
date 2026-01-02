'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Shuffle } from 'lucide-react';
import { Player } from '@/types';

interface TeamFormationVisualizerProps {
  players: Player[];
  primaryColor: string;
  secondaryColor: string;
}

type FormationType = 'balanced' | 'batting-heavy' | 'bowling-heavy' | 'aggressive';

export default function TeamFormationVisualizer({
  players,
  primaryColor,
  secondaryColor,
}: TeamFormationVisualizerProps) {
  const [formationType, setFormationType] = useState<FormationType>('balanced');
  const [impactPlayer, setImpactPlayer] = useState<string | null>(null);

  const formation = useMemo(() => {
    const batsmen = players.filter((p) => p.role === 'Batsman');
    const bowlers = players.filter((p) => p.role === 'Bowler');
    const allRounders = players.filter((p) => p.role === 'All-rounder');
    const wicketkeepers = players.filter((p) => p.role === 'Wicket-keeper');

    let selectedPlayers: Player[] = [];

    switch (formationType) {
      case 'balanced':
        selectedPlayers = [
          ...wicketkeepers.slice(0, 1),
          ...batsmen.slice(0, 4),
          ...allRounders.slice(0, 2),
          ...bowlers.slice(0, 4),
        ].slice(0, 11);
        break;
      case 'batting-heavy':
        selectedPlayers = [
          ...wicketkeepers.slice(0, 1),
          ...batsmen.slice(0, 6),
          ...allRounders.slice(0, 2),
          ...bowlers.slice(0, 2),
        ].slice(0, 11);
        break;
      case 'bowling-heavy':
        selectedPlayers = [
          ...wicketkeepers.slice(0, 1),
          ...batsmen.slice(0, 3),
          ...allRounders.slice(0, 2),
          ...bowlers.slice(0, 5),
        ].slice(0, 11);
        break;
      case 'aggressive':
        selectedPlayers = [
          ...wicketkeepers.slice(0, 1),
          ...batsmen.slice(0, 5),
          ...allRounders.slice(0, 3),
          ...bowlers.slice(0, 2),
        ].slice(0, 11);
        break;
    }

    return selectedPlayers;
  }, [players, formationType]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Batsman':
        return '#10B981'; // green
      case 'Bowler':
        return '#EF4444'; // red
      case 'All-rounder':
        return '#F59E0B'; // amber
      case 'Wicket-keeper':
        return '#3B82F6'; // blue
      default:
        return primaryColor;
    }
  };

  const formations: { type: FormationType; label: string; description: string }[] = [
    { type: 'balanced', label: 'Balanced', description: '4 Batsmen, 2 All-rounders, 4 Bowlers' },
    { type: 'batting-heavy', label: 'Batting Heavy', description: '6 Batsmen, 2 All-rounders, 2 Bowlers' },
    { type: 'bowling-heavy', label: 'Bowling Heavy', description: '3 Batsmen, 2 All-rounders, 5 Bowlers' },
    { type: 'aggressive', label: 'Aggressive', description: '5 Batsmen, 3 All-rounders, 2 Bowlers' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5" style={{ color: primaryColor }} />
          Team Formation
        </h3>
      </div>

      {/* Formation Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {formations.map((formation) => (
          <motion.button
            key={formation.type}
            onClick={() => setFormationType(formation.type)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-xl border-2 transition-all text-left ${
              formationType === formation.type
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-white/20 bg-white/5 hover:border-white/40'
            }`}
          >
            <div className="font-bold text-white text-sm mb-1">{formation.label}</div>
            <div className="text-xs text-gray-400">{formation.description}</div>
          </motion.button>
        ))}
      </div>

      {/* Formation Visualization */}
      <div className="relative p-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 min-h-[400px]">
        {/* Cricket Field Background */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-10">
          <div className="absolute inset-0 bg-gradient-to-b from-green-600/20 to-green-800/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full" />
        </div>

        {/* Players on Field */}
        <div className="relative grid grid-cols-11 gap-2">
          {formation.map((player, index) => {
            const roleColor = getRoleColor(player.role);
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white/30 shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: roleColor,
                    boxShadow: `0 0 20px ${roleColor}40`,
                  }}
                  title={`${player.name} - ${player.role}`}
                >
                  <div className="text-center leading-tight px-1">
                    <div className="font-bold truncate" style={{ fontSize: '9px' }}>
                      {player.name.split(' ').map((n, i) => i === 0 ? n.charAt(0) + '.' : n).join(' ')}
                    </div>
                  </div>
                </div>
                {/* Player Info Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap border border-white/20">
                    <div className="font-bold">{player.name}</div>
                    <div className="text-gray-400">{player.role}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Playing 11 List */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h4 className="text-md font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: primaryColor }} />
            Playing 11
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {formation.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white/30"
                  style={{
                    backgroundColor: getRoleColor(player.role),
                    boxShadow: `0 0 15px ${getRoleColor(player.role)}40`,
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">{player.name}</div>
                  <div className="text-xs text-gray-400">{player.role}</div>
                </div>
                {player.isCaptain && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded font-bold border border-yellow-500/30">
                    C
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Impact Player Selection */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              <Shuffle className="w-4 h-4" style={{ color: secondaryColor }} />
              Impact Player
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {players
                .filter((p) => !formation.find((fp) => fp.id === p.id))
                .slice(0, 6)
                .map((player) => (
                  <motion.button
                    key={player.id}
                    onClick={() => setImpactPlayer(player.id === impactPlayer ? null : player.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      impactPlayer === player.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border border-white/30"
                      style={{
                        backgroundColor: getRoleColor(player.role),
                      }}
                    >
                      {player.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-xs truncate">{player.name}</div>
                      <div className="text-xs text-gray-400">{player.role}</div>
                    </div>
                  </motion.button>
                ))}
            </div>
            {impactPlayer && (
              <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="text-xs text-blue-400 font-bold">
                  Selected Impact Player: {players.find((p) => p.id === impactPlayer)?.name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Formation Stats */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Batsmen', count: formation.filter((p) => p.role === 'Batsman').length, color: '#10B981' },
              { label: 'Bowlers', count: formation.filter((p) => p.role === 'Bowler').length, color: '#EF4444' },
              { label: 'All-rounders', count: formation.filter((p) => p.role === 'All-rounder').length, color: '#F59E0B' },
              { label: 'Wicket-keepers', count: formation.filter((p) => p.role === 'Wicket-keeper').length, color: '#3B82F6' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.count}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

