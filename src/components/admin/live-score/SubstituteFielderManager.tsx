'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Trash2 } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  role?: string;
  jerseyNumber?: number;
  isCaptain?: boolean;
}

interface SubstituteFielderEntry {
  id: string;
  playerId: string;
  playerName: string;
  replacedId?: string;
  replacedName?: string;
  time: string; // over.ball format
  reason: string;
}

interface SubstituteFielderManagerProps {
  league?: 'ipl' | 'wpl';
  fieldingTeamPlayers: Player[];
  currentOver: string; // "12.3" format
  onSubstituteRecorded: (substitute: SubstituteFielderEntry) => void;
  substitutes: SubstituteFielderEntry[];
  onRemoveSubstitute: (id: string) => void;
}

const SUBSTITUTE_REASONS = [
  { key: 'injury', label: 'Injury', icon: '🤕' },
  { key: 'tactic', label: 'Tactical Change', icon: '🎯' },
  { key: 'impact', label: 'Impact Player (IPL)', icon: '⚡' },
  { key: 'fatigue', label: 'Player Fatigue', icon: '😰' },
  { key: 'other', label: 'Other', icon: '📝' },
];

export default function SubstituteFielderManager({
  league = 'ipl',
  fieldingTeamPlayers,
  currentOver,
  onSubstituteRecorded,
  substitutes = [],
  onRemoveSubstitute,
}: SubstituteFielderManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedSubstitute, setSelectedSubstitute] = useState<string>('');
  const [selectedReplacement, setSelectedReplacement] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('tactic');

  const isWPL = league === 'wpl';
  const colors = {
    bg: isWPL ? 'rgba(168, 85, 247, 0.1)' : 'rgba(59, 130, 246, 0.1)',
    border: isWPL ? 'rgba(168, 85, 247, 0.3)' : 'rgba(59, 130, 246, 0.3)',
    hover: isWPL ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)',
    button: isWPL ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700',
    text: isWPL ? 'text-purple-200' : 'text-blue-200',
  };

  const handleRecordSubstitute = () => {
    if (!selectedSubstitute || !selectedReplacement || selectedSubstitute === selectedReplacement) {
      alert('Please select both a fielder to replace and their substitute');
      return;
    }

    const replacedPlayer = fieldingTeamPlayers.find(p => p.id === selectedSubstitute);
    const substitutePlayer = fieldingTeamPlayers.find(p => p.id === selectedReplacement);

    if (!replacedPlayer || !substitutePlayer) return;

    const entry: SubstituteFielderEntry = {
      id: `${Date.now()}`,
      playerId: selectedReplacement,
      playerName: substitutePlayer.name,
      replacedId: selectedSubstitute,
      replacedName: replacedPlayer.name,
      time: currentOver,
      reason: SUBSTITUTE_REASONS.find(r => r.key === selectedReason)?.label || 'Other',
    };

    onSubstituteRecorded(entry);

    // Reset form
    setSelectedSubstitute('');
    setSelectedReplacement('');
    setSelectedReason('tactic');
    setShowModal(false);
  };

  const availableSubstitutes = useMemo(() => {
    // Show all players except those currently as active substitutes
    const activeSubstituteIds = substitutes.map(s => s.playerId);
    return fieldingTeamPlayers.filter(p => !activeSubstituteIds.includes(p.id));
  }, [fieldingTeamPlayers, substitutes]);

  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-yellow-400" />
          <div>
            <h3 className="font-bold text-white">Substitute Fielders</h3>
            <p className="text-xs text-gray-400">Manage fielding changes (injury, tactical, impact)</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className={`${colors.button} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-semibold">Record Change</span>
        </button>
      </div>

      {/* Substitutes List */}
      <AnimatePresence>
        {substitutes.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {substitutes.map((sub, idx) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: colors.hover }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{sub.replacedName}</span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="text-sm font-semibold text-green-400">{sub.playerName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-1 bg-yellow-500/30 text-yellow-300 rounded">
                      {sub.reason}
                    </span>
                    <span className="text-xs text-gray-400">Over {sub.time}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveSubstitute(sub.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center py-6 text-gray-400 text-sm">
            No fielding changes recorded yet
          </p>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-xl p-6 max-w-md w-full border-2 border-slate-700"
            >
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Record Fielding Change</h2>
              </div>

              {/* Fielder Being Replaced */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Fielder Being Replaced
                </label>
                <select
                  value={selectedSubstitute}
                  onChange={(e) => setSelectedSubstitute(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                >
                  <option value="">Select fielder...</option>
                  {fieldingTeamPlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} {player.isCaptain ? '(C)' : ''} #{player.jerseyNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Substitute Player */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Substitute Fielder
                </label>
                <select
                  value={selectedReplacement}
                  onChange={(e) => setSelectedReplacement(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                >
                  <option value="">Select substitute...</option>
                  {availableSubstitutes
                    .filter(p => p.id !== selectedSubstitute) // Exclude the player being replaced
                    .map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} {player.isCaptain ? '(C)' : ''} #{player.jerseyNumber}
                      </option>
                    ))}
                </select>
              </div>

              {/* Reason for Change */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Reason for Change
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SUBSTITUTE_REASONS.map((reason) => (
                    <button
                      key={reason.key}
                      onClick={() => setSelectedReason(reason.key)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                        selectedReason === reason.key
                          ? 'bg-yellow-500/30 border-yellow-500 text-yellow-300'
                          : 'bg-slate-700 border-slate-600 text-gray-300 hover:border-slate-500'
                      }`}
                    >
                      {reason.icon} {reason.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordSubstitute}
                  className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-bold transition-colors"
                >
                  Record Change
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
