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
  isTestPage?: boolean; // For test pages, allow manual fielder entry
}

const DISMISSAL_TYPES = [
  // Common Dismissals
  { 
    key: 'bowled', 
    label: 'Bowled', 
    icon: '🏏', 
    needsFielder: false, 
    description: 'Ball hits the stumps and dislodges the bails',
    category: 'common',
    notation: 'b'
  },
  { 
    key: 'caught', 
    label: 'Caught', 
    icon: '✋', 
    needsFielder: true, 
    description: 'Fielder catches the ball on the full after batter hits it',
    category: 'common',
    notation: 'c'
  },
  { 
    key: 'lbw', 
    label: 'LBW', 
    icon: '🦵', 
    needsFielder: false, 
    description: 'Leg Before Wicket - Ball strikes body in line with stumps',
    category: 'common',
    notation: 'lbw'
  },
  { 
    key: 'stumped', 
    label: 'Stumped', 
    icon: '🧤', 
    needsFielder: true, 
    description: 'Wicketkeeper removes bails while batter is out of crease',
    category: 'common',
    notation: 'st'
  },
  { 
    key: 'run out', 
    label: 'Run Out', 
    icon: '🏃', 
    needsFielder: true, 
    description: 'Fielder hits stumps with ball while batter is out of crease',
    category: 'common',
    notation: 'run out'
  },
  { 
    key: 'hit wicket', 
    label: 'Hit Wicket', 
    icon: '⚡', 
    needsFielder: false, 
    description: 'Batter dislodges bails with bat or body',
    category: 'rare',
    notation: 'hit wicket'
  },
  { 
    key: 'obstructing field', 
    label: 'Obstructing Field', 
    icon: '🚫', 
    needsFielder: false, 
    description: 'Batter deliberately obstructs fielder from making a play',
    category: 'rare',
    notation: 'obstructing field'
  },
  { 
    key: 'handled ball', 
    label: 'Handled Ball', 
    icon: '✋', 
    needsFielder: false, 
    description: 'Batter uses hand to return ball without fielder consent',
    category: 'rare',
    notation: 'handled ball'
  },
  { 
    key: 'hit ball twice', 
    label: 'Hit Ball Twice', 
    icon: '🔄', 
    needsFielder: false, 
    description: 'Batter intentionally strikes the ball twice',
    category: 'rare',
    notation: 'hit ball twice'
  },
  { 
    key: 'timed out', 
    label: 'Timed Out', 
    icon: '⏱️', 
    needsFielder: false, 
    description: 'New batter takes longer than 3 minutes to reach crease',
    category: 'rare',
    notation: 'timed out'
  },
];

export default function WicketModal({
  isOpen,
  onClose,
  onConfirm,
  players,
  league = 'ipl',
  isTestPage = false
}: WicketModalProps) {
  const [selectedType, setSelectedType] = useState('');
  const [selectedFielder, setSelectedFielder] = useState('');
  const [manualFielderName, setManualFielderName] = useState('');

  const needsFielder = DISMISSAL_TYPES.find(d => d.key === selectedType)?.needsFielder || false;
  const selectedDismissal = DISMISSAL_TYPES.find(d => d.key === selectedType);
  
  const commonDismissals = DISMISSAL_TYPES.filter(d => d.category === 'common');
  const rareDismissals = DISMISSAL_TYPES.filter(d => d.category === 'rare');

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
    
    // For test pages, allow manual fielder entry or use selected fielder
    let fielderName: string | undefined = undefined;
    if (needsFielder) {
      if (isTestPage) {
        // In test mode, use manual entry if provided, otherwise use selected fielder
        fielderName = manualFielderName.trim() || selectedFielder || 'Unknown Fielder';
      } else {
        // In normal mode, require fielder selection
        if (!selectedFielder) {
          alert('Please select a fielder');
          return;
        }
        fielderName = selectedFielder;
      }
    }
    
    onConfirm(selectedType, fielderName);
    setSelectedType('');
    setSelectedFielder('');
    setManualFielderName('');
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
            <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full border-2 border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Select Dismissal Type</h3>
                  <p className="text-sm text-gray-400">Choose how the batter was dismissed</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Selected Dismissal Preview */}
              {selectedDismissal && (
                <div className={`mb-6 p-4 rounded-xl border-2 ${colors.selected} border-opacity-50`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedDismissal.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-white">{selectedDismissal.label}</span>
                        <span className="text-xs px-2 py-1 bg-white/20 rounded text-gray-300">
                          {selectedDismissal.notation}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{selectedDismissal.description}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Common Dismissals */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  Common Dismissals
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {commonDismissals.map((type) => (
                    <motion.button
                      key={type.key}
                      onClick={() => setSelectedType(type.key)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        px-4 py-4 rounded-xl font-bold transition-all text-left
                        border-2
                        ${selectedType === type.key
                          ? `${colors.selected} border-opacity-100 shadow-lg`
                          : `${colors.unselected} border-slate-600 hover:border-slate-500`
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <div className="font-bold text-white">{type.label}</div>
                          {type.needsFielder && (
                            <span className="text-xs text-yellow-400">Requires fielder</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-normal opacity-70 mt-1 leading-tight">
                        {type.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Rare Dismissals */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  Rare Dismissals
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {rareDismissals.map((type) => (
                    <motion.button
                      key={type.key}
                      onClick={() => setSelectedType(type.key)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        px-4 py-4 rounded-xl font-bold transition-all text-left
                        border-2
                        ${selectedType === type.key
                          ? `${colors.selected} border-opacity-100 shadow-lg`
                          : `${colors.unselected} border-slate-600 hover:border-slate-500`
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <div className="font-bold text-white">{type.label}</div>
                          {type.needsFielder && (
                            <span className="text-xs text-yellow-400">Requires fielder</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-normal opacity-70 mt-1 leading-tight">
                        {type.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {needsFielder && (
                <div className="mb-6 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                  <label className="block text-sm text-gray-300 mb-3 font-semibold flex items-center gap-2">
                    <span>👤</span>
                    Select Fielder {selectedDismissal && `(for ${selectedDismissal.label})`}
                  </label>
                  
                  {/* Player dropdown (if players available) */}
                  {players.length > 0 && (
                    <select
                      value={selectedFielder}
                      onChange={(e) => {
                        setSelectedFielder(e.target.value);
                        if (e.target.value) setManualFielderName(''); // Clear manual entry if selecting from dropdown
                      }}
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors mb-3"
                    >
                      <option value="">Select fielder from list...</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.name}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {/* Manual entry for test mode or when no players */}
                  {(isTestPage || players.length === 0) && (
                    <div>
                      <input
                        type="text"
                        value={manualFielderName}
                        onChange={(e) => {
                          setManualFielderName(e.target.value);
                          if (e.target.value) setSelectedFielder(''); // Clear dropdown selection if typing manually
                        }}
                        placeholder={players.length > 0 ? "Or enter fielder name manually..." : "Enter fielder name..."}
                        className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      {isTestPage && (
                        <p className="text-xs text-gray-400 mt-2">
                          💡 Test mode: You can select from list or enter any fielder name manually
                        </p>
                      )}
                    </div>
                  )}
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
                  disabled={!selectedType || (!isTestPage && needsFielder && !selectedFielder && !manualFielderName.trim())}
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

