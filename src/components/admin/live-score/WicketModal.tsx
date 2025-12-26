'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Player {
  id: string;
  name: string;
}

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dismissalType: string, fielderName?: string) => void;
  players: Player[];
  league?: 'ipl' | 'wpl';
}

const DISMISSAL_TYPES = [
  { key: 'bowled', label: 'Bowled', needsFielder: false, description: 'Ball hits the stumps' },
  { key: 'caught', label: 'Caught', needsFielder: true, description: 'Fielder catches the ball' },
  { key: 'lbw', label: 'LBW', needsFielder: false, description: 'Leg Before Wicket' },
  { key: 'stumped', label: 'Stumped', needsFielder: true, description: 'Wicketkeeper removes bails' },
  { key: 'run out', label: 'Run Out', needsFielder: true, description: 'Batter out of crease' },
  { key: 'hit wicket', label: 'Hit Wicket', needsFielder: false, description: 'Batter dislodges bails' },
  { key: 'obstructing field', label: 'Obstructing Field', needsFielder: false, description: 'Deliberate obstruction' },
  { key: 'handled ball', label: 'Handled Ball', needsFielder: false, description: 'Batter uses hand illegally' },
  { key: 'hit ball twice', label: 'Hit Ball Twice', needsFielder: false, description: 'Batter strikes ball twice' },
  { key: 'timed out', label: 'Timed Out', needsFielder: false, description: 'Batter takes too long' },
];

export default function WicketModal({
  isOpen,
  onClose,
  onConfirm,
  players,
  league = 'ipl'
}: WicketModalProps) {
  const [selectedType, setSelectedType] = useState('');
  const [selectedFielder, setSelectedFielder] = useState('');

  const needsFielder = DISMISSAL_TYPES.find(d => d.key === selectedType)?.needsFielder || false;

  const leagueColors = {
    ipl: {
      primary: 'bg-blue-600 hover:bg-blue-700',
      selected: 'bg-blue-600 text-white',
      unselected: 'bg-slate-700 text-gray-300 hover:bg-slate-600'
    },
    wpl: {
      primary: 'bg-purple-600 hover:bg-purple-700',
      selected: 'bg-purple-600 text-white',
      unselected: 'bg-slate-700 text-gray-300 hover:bg-slate-600'
    }
  };

  const colors = leagueColors[league];

  const handleConfirm = () => {
    if (!selectedType) return;
    if (needsFielder && !selectedFielder) {
      alert('Please select a fielder');
      return;
    }
    onConfirm(selectedType, needsFielder ? selectedFielder : undefined);
    setSelectedType('');
    setSelectedFielder('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border-2 border-slate-700 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">How was the wicket?</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6 max-h-96 overflow-y-auto">
                {DISMISSAL_TYPES.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setSelectedType(type.key)}
                    className={`
                      px-4 py-3 rounded-xl font-bold transition-all text-sm text-left
                      ${selectedType === type.key
                        ? colors.selected
                        : colors.unselected
                      }
                    `}
                    title={type.description}
                  >
                    <div className="font-bold">{type.label}</div>
                    {type.description && (
                      <div className="text-xs font-normal opacity-80 mt-1">{type.description}</div>
                    )}
                  </button>
                ))}
              </div>

              {needsFielder && (
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2 font-semibold">
                    Select Fielder
                  </label>
                  <select
                    value={selectedFielder}
                    onChange={(e) => setSelectedFielder(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select fielder...</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.name}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedType || (needsFielder && !selectedFielder)}
                  className={`flex-1 px-4 py-3 ${colors.primary} disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-colors`}
                >
                  Confirm Wicket
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

