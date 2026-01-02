'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, BarChart2, Trophy, Zap, Users, Calendar, Award } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface PlayerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: {
    id: string;
    name: string;
    teamName: string;
    role: string;
    matches: number;
    runs: number;
    wickets: number;
    highestScore: string;
    battingAverage: number;
    bowlingAverage: number;
    strikeRate: number;
    economy: number;
    bestBowling: string;
    image?: string;
  };
  teamColor: string;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function PlayerCardModal({
  isOpen,
  onClose,
  player,
  teamColor,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: PlayerCardModalProps) {
  const [activeTab, setActiveTab] = useState('stats');
  const [isVisible, setIsVisible] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onClose, onNext, onPrev]);

  // Animation variants
  const modalVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
        when: 'beforeChildren',
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  // Stats for the player
  const stats = [
    { label: 'Matches', value: player.matches, icon: <Calendar className="w-4 h-4" /> },
    { label: 'Runs', value: player.runs, icon: <Zap className="w-4 h-4" /> },
    { label: 'Wickets', value: player.wickets, icon: <Trophy className="w-4 h-4" /> },
    { label: 'Best', value: player.highestScore, icon: <Award className="w-4 h-4" /> },
  ];

  // Calculate player rating (example)
  const playerRating = Math.min(5, 3.5 + (player.runs / 1000) + (player.wickets / 20)).toFixed(1);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={overlayVariants}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
          variants={modalVariants}
          style={{
            background: `linear-gradient(135deg, ${teamColor}10 0%, ${teamColor}05 100%)`,
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>

          {/* Navigation Arrows */}
          {hasPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 transition-colors"
              aria-label="Previous player"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 transition-colors"
              aria-label="Next player"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Header with player image */}
          <div className="relative h-48 bg-gradient-to-r from-slate-800 to-slate-700">
            <div 
              className="absolute inset-0 opacity-30"
              style={{ background: teamColor }}
            />
            <div className="absolute -bottom-16 left-6">
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg">
                {player.image ? (
                  <Image
                    src={player.image}
                    alt={player.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center text-3xl font-bold text-white">
                    {player.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <div className="absolute bottom-4 right-6 text-right">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm text-sm font-medium text-white">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                Active
              </div>
            </div>
          </div>

          {/* Player Info */}
          <div className="pt-12 px-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{player.name}</h2>
                <div className="flex items-center mt-1">
                  <span 
                    className="px-2 py-1 text-xs font-medium rounded-md mr-2"
                    style={{ backgroundColor: `${teamColor}33`, color: teamColor }}
                  >
                    {player.teamName}
                  </span>
                  <span className="text-sm text-slate-400">{player.role}</span>
                </div>
              </div>
              <div className="flex items-center bg-slate-800/50 rounded-full px-3 py-1">
                <span className="text-yellow-400 text-sm font-medium">{playerRating}</span>
                <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mt-6 mb-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl text-center"
                >
                  <div className="text-slate-400 text-xs flex items-center justify-center gap-1">
                    {stat.icon}
                    {stat.label}
                  </div>
                  <div className="text-lg font-bold mt-1">{stat.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`py-3 px-4 text-sm font-medium ${
                    activeTab === 'stats'
                      ? 'border-b-2 text-white'
                      : 'text-slate-400 hover:text-white border-transparent'
                  }`}
                  style={activeTab === 'stats' ? { borderColor: teamColor } : {}}
                >
                  <BarChart2 className="w-4 h-4 mr-2 inline" />
                  Stats
                </button>
                <button
                  onClick={() => setActiveTab('achievements')}
                  className={`py-3 px-4 text-sm font-medium ${
                    activeTab === 'achievements'
                      ? 'border-b-2 text-white'
                      : 'text-slate-400 hover:text-white border-transparent'
                  }`}
                  style={activeTab === 'achievements' ? { borderColor: teamColor } : {}}
                >
                  <Trophy className="w-4 h-4 mr-2 inline" />
                  Achievements
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="py-4 min-h-[200px]">
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-slate-400 mb-2">Batting</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Avg</span>
                          <span className="font-medium">{player.battingAverage || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">SR</span>
                          <span className="font-medium">{player.strikeRate || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">HS</span>
                          <span className="font-medium">{player.highestScore || '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-slate-400 mb-2">Bowling</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Avg</span>
                          <span className="font-medium">{player.bowlingAverage || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Econ</span>
                          <span className="font-medium">{player.economy || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Best</span>
                          <span className="font-medium">{player.bestBowling || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="space-y-3">
                  {[
                    { title: 'IPL Champion', year: '2023', team: player.teamName },
                    { title: 'Orange Cap', year: '2023', description: 'Most runs in a season' },
                    { title: 'Man of the Match', count: 5 },
                  ].map((achievement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start p-3 bg-slate-800/30 rounded-lg"
                    >
                      <div className="p-2 rounded-full bg-slate-700/50 mr-3">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <div className="font-medium">{achievement.title} {achievement.year && `(${achievement.year})`}</div>
                        {achievement.team && <div className="text-xs text-slate-400">{achievement.team}</div>}
                        {achievement.description && <div className="text-xs text-slate-400">{achievement.description}</div>}
                        {achievement.count && <div className="text-xs text-slate-400">{achievement.count} times</div>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex justify-between">
            <button 
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
            <button 
              className="px-4 py-2 text-sm font-medium rounded-lg flex items-center"
              style={{ backgroundColor: teamColor, color: 'white' }}
            >
              View Full Profile
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
