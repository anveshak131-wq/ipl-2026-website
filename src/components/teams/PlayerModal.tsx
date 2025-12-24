'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import { getOptimalTextColor } from '@/lib/colorUtils';
import { formatDateDDMMYYYY, calculateAge } from '@/lib/dateUtils';
import FlagImage from '@/components/ui/FlagImage';
import { X, Star, Globe, Calendar, TrendingUp, Award, Target, Activity, Zap, BarChart3 } from 'lucide-react';
import { calculateOverallPerformance, OverallPerformance } from '@/lib/playerPerformance';

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

// Helper function to create color variations
function createColorVariations(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const light = `rgba(${r}, ${g}, ${b}, 0.12)`;
  const medium = `rgba(${r}, ${g}, ${b}, 0.25)`;
  const dark = `rgba(${r}, ${g}, ${b}, 0.4)`;
  
  return {
    light,
    medium,
    dark,
    solid: hex,
    glow: `rgba(${r}, ${g}, ${b}, 0.5)`,
    text: getOptimalTextColor(hex),
    textOnLight: '#E5E7EB',
  };
}

// Helper function to adjust opacity of rgba color
function adjustOpacity(rgbaColor: string, opacity: number): string {
  const match = rgbaColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
  }
  return rgbaColor;
}

export default function PlayerModal({ player, isOpen, onClose, teamColors, teamData }: PlayerModalProps) {
  const [teamColorsState, setTeamColorsState] = useState<{ primary: string; secondary: string } | null>(teamColors || null);

  useEffect(() => {
    if (teamColors) {
      setTeamColorsState(teamColors);
      return;
    }
    
    if (!teamColors && player?.teamId) {
      api.getTeams().then((teams) => {
        const team = teams.find(t => t.id === player.teamId);
        if (team) {
          setTeamColorsState(team.colors);
        }
      }).catch((error) => {
        console.error('Error fetching team colors:', error);
      });
    }
  }, [player?.teamId, teamColors]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !player) return null;

  // Default colors if team colors are not available
  const defaultColors = {
    primary: '#7C3AED',
    secondary: '#FFD700'
  };

  const colors = teamColorsState || defaultColors;
  const primaryColor = createColorVariations(colors.primary);
  const secondaryColor = createColorVariations(colors.secondary);

  // Check if player is from WPL
  const isWPLPlayer = player.league === 'wpl' || teamData?.league === 'wpl';

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Get player initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Calculate derived stats
  const boundariesPerMatch = player.stats.matches > 0 
    ? Math.round((player.stats.fours + player.stats.sixes) / player.stats.matches * 10) / 10 
    : 0;
  const runsPerMatch = player.stats.matches > 0 
    ? Math.round(player.stats.runs / player.stats.matches * 10) / 10 
    : 0;

  // Calculate overall performance using the comprehensive calculation system
  const overallPerformance = calculateOverallPerformance(player);

  // Get role border color
  const getRoleBorderColor = () => {
    if (player.role === 'Batsman') return '#F59E0B'; // Amber
    if (player.role === 'Bowler') return '#10B981'; // Emerald
    if (player.role === 'Wicket-keeper') return '#F97316'; // Orange
    if (player.role === 'All-rounder') {
      if (player.allrounderType === 'Batting All-rounder') return '#10B981'; // Emerald
      if (player.allrounderType === 'Bowling All-rounder') return '#3B82F6'; // Blue
      return '#10B981'; // Default Emerald
    }
    return primaryColor.solid;
  };

  const roleBorderColor = getRoleBorderColor();

  return (
    <AnimatePresence>
      {isOpen && player && (
        <motion.div 
          key="player-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={handleBackdropClick}
        >
          {/* Subtle animated background gradient */}
          <motion.div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${primaryColor.medium}, transparent 50%),
                           radial-gradient(circle at 70% 70%, ${secondaryColor.medium}, transparent 50%)`,
            }}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Modal Container */}
          <motion.div 
            className="relative rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
              border: `1px solid ${roleBorderColor}40`,
              boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px ${roleBorderColor}20`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50 transition-all"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5 text-gray-300" strokeWidth={2.5} />
            </motion.button>

            {/* Scrollable Content Container */}
            <div className="overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar">
              {/* Header Section */}
              <div className="relative p-6 border-b border-gray-800/50" style={{ borderColor: `${roleBorderColor}30` }}>
                {/* Subtle background pattern */}
                <div 
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${primaryColor.solid} 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                  }}
                />

                <div className="relative flex flex-col md:flex-row items-center gap-6">
                  {/* Player Avatar */}
                  <motion.div 
                    className="relative"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                  >
                    <div 
                      className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center shadow-lg border-2"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                        borderColor: `${roleBorderColor}60`,
                        boxShadow: `0 8px 24px ${primaryColor.glow}30`
                      }}
                    >
                <span 
                        className="relative font-bold text-3xl md:text-4xl text-white"
                  style={{
                          textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}
                >
                  {getInitials(player.name)}
                </span>

                {/* Captain badge */}
                {player.isCaptain && (
                        <motion.div 
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg border-2 border-yellow-500/50 z-10"
                          animate={{
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Star className="w-4 h-4 text-yellow-900 fill-yellow-900" />
                        </motion.div>
                )}

                {/* Special Achievement Badge - Highest Run Scorer */}
                {player.name.toLowerCase().includes('virat kohli') && (
                  <motion.div 
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg border-2 border-amber-400/50 z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-[10px] font-bold text-white whitespace-nowrap">
                      🏆 Highest Run Scorer
                    </span>
                  </motion.div>
                )}
              </div>
                  </motion.div>
              
              {/* Player Info */}
              <div className="flex-1 text-center md:text-left">
                    <motion.h2
                      className="text-2xl md:text-3xl font-bold mb-3 text-gray-100"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                >
                  {player.name}
                    </motion.h2>
                    
                    <motion.div 
                      className="flex flex-wrap items-center justify-center md:justify-start gap-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <motion.span 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{
                          background: `${roleBorderColor}20`,
                          color: roleBorderColor,
                          borderColor: `${roleBorderColor}40`,
                    }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                  >
                        <Target className="w-3.5 h-3.5" />
                    {player.role}
                        {player.allrounderType && (
                          <span className="ml-1 text-[10px] opacity-80">({player.allrounderType})</span>
                        )}
                      </motion.span>
                      
                      <motion.span 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800/50 border border-gray-700/50 text-gray-300"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                    {(player.dateOfBirth ? calculateAge(player.dateOfBirth) : player.age) > 0 
                          ? `${player.dateOfBirth ? calculateAge(player.dateOfBirth) : player.age} yrs`
                          : 'Age N/A'}
                      </motion.span>
                      
                      {player.nationality && player.nationality !== 'Pakistan' && (
                        <motion.span 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800/50 border border-gray-700/50 text-gray-300"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Globe className="w-3.5 h-3.5" />
                        <FlagImage nationality={player.nationality} size="sm" />
                          {player.nationality}
                        </motion.span>
                      )}

              {/* Jersey Number Badge */}
                      <motion.div 
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm border-2"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                          borderColor: `${roleBorderColor}60`,
                  color: '#FFFFFF',
                }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        whileHover={{ scale: 1.1 }}
              >
                {player.jerseyNumber > 0 ? player.jerseyNumber : 'N/A'}
                      </motion.div>
                    </motion.div>

                    {/* Special Achievement Badges for Virat Kohli */}
                    {player.name.toLowerCase().includes('virat kohli') && (
                      <div className="mt-3 w-full flex flex-wrap items-center justify-center gap-2">
                        <motion.div 
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-400/50"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.4 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Award className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-amber-300 whitespace-nowrap">
                            🏆 Highest Run Scorer
                          </span>
                        </motion.div>
                        <motion.div 
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/50"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.5 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Award className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-bold text-purple-300 whitespace-nowrap">
                            🎯 Most 50s in IPL History
                          </span>
                        </motion.div>
                        <motion.div 
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/50"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.6 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Award className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-bold text-blue-300 whitespace-nowrap">
                            💯 Most 100s in IPL History
                          </span>
                        </motion.div>
                      </div>
                    )}
              </div>
            </div>
          </div>

          {/* Playing Style Section */}
              <motion.div 
                className="p-6 border-b border-gray-800/50"
                style={{ borderColor: `${roleBorderColor}30` }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <motion.h3 
                  className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-200"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div 
                    className="w-1 h-6 rounded-full"
                    style={{ 
                      background: `linear-gradient(to bottom, ${primaryColor.solid}, ${secondaryColor.solid})`,
                    }}
              />
              Playing Style
                </motion.h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const isBowler = player.role === 'Bowler';
                const isAllRounder = player.role === 'All-rounder';
                    const highlightBatting = isAllRounder || player.role === 'Batsman' || player.role === 'Wicket-keeper';
                const highlightBowling = isBowler || isAllRounder;
                
                return (
                  <>
                        <motion.div 
                          className="p-5 rounded-xl border relative overflow-hidden group"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                      style={{
                        background: highlightBatting 
                              ? `linear-gradient(135deg, ${primaryColor.light}, ${adjustOpacity(primaryColor.medium, 0.3)})`
                              : 'rgba(30, 41, 59, 0.5)',
                            borderColor: highlightBatting ? `${primaryColor.solid}40` : 'rgba(71, 85, 105, 0.3)',
                      }}
                    >
                      <p 
                            className="text-xl font-bold mb-1 text-gray-100"
                      >
                        {player.battingStyle && player.battingStyle.trim() !== '' ? player.battingStyle : 'N/A'}
                      </p>
                      <p 
                            className="text-xs font-semibold uppercase tracking-wider text-gray-400"
                      >
                        Batting Style
                      </p>
                        </motion.div>
                        
                        <motion.div
                          className="p-5 rounded-xl border relative overflow-hidden group"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.5 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                      style={{
                        background: highlightBowling 
                              ? `linear-gradient(135deg, ${secondaryColor.light}, ${adjustOpacity(secondaryColor.medium || primaryColor.medium, 0.3)})`
                              : 'rgba(30, 41, 59, 0.5)',
                            borderColor: highlightBowling ? `${(secondaryColor.solid || primaryColor.solid)}40` : 'rgba(71, 85, 105, 0.3)',
                      }}
                    >
                      <p 
                            className="text-xl font-bold mb-1 text-gray-100"
                      >
                        {player.bowlingStyle && player.bowlingStyle.trim() !== '' ? player.bowlingStyle : 'N/A'}
                      </p>
                      <p 
                            className="text-xs font-semibold uppercase tracking-wider text-gray-400"
                      >
                        Bowling Style
                      </p>
                        </motion.div>
                  </>
                );
              })()}
            </div>
              </motion.div>

          {/* Career Statistics Section - Hide for WPL players */}
          {!isWPLPlayer && (
                <motion.div 
                  className="p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <motion.div 
                    className="flex justify-between items-center mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                  >
                    <motion.h3 
                      className="text-lg font-bold flex items-center gap-2 text-gray-200"
                    >
                      <div 
                        className="w-1 h-6 rounded-full"
                        style={{ 
                          background: `linear-gradient(to bottom, ${primaryColor.solid}, ${secondaryColor.solid})`,
                        }}
                      />
                      <Award className="w-5 h-5" style={{ color: primaryColor.solid }} />
                      Career Statistics
                    </motion.h3>
                  </motion.div>
                
                  {/* Batting Performance */}
                  <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                    <motion.h4 
                      className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-300"
              >
                <div 
                        className="w-8 h-0.5 rounded-full"
                        style={{ 
                          background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})`,
                        }}
                      />
                      <TrendingUp className="w-4 h-4" style={{ color: primaryColor.solid }} />
                Batting Performance
                    </motion.h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Matches', value: player.stats.matches, isNumeric: true },
                        { label: 'Innings', value: (player.stats as any).battingInnings || 0, isNumeric: true },
                        { label: 'Not Outs', value: (player.stats as any).notOuts || 0, isNumeric: true },
                  { label: 'Total Runs', value: player.stats.runs, isNumeric: true },
                        { label: 'Balls Faced', value: (player.stats as any).ballsFaced || 0, isNumeric: true },
                        { label: 'Highest', value: player.stats.highest, isNumeric: true },
                  { label: 'Batting Avg', value: player.stats.average, isNumeric: true, format: (v: number) => v.toFixed(2) },
                  { label: 'Strike Rate', value: player.stats.strikeRate, isNumeric: true, format: (v: number) => v.toFixed(1) },
                        { label: 'Fours', value: player.stats.fours, isNumeric: true },
                        { label: 'Sixes', value: player.stats.sixes, isNumeric: true },
                        { label: 'Fifties', value: player.stats.fifties, isNumeric: true },
                        { label: 'Hundreds', value: player.stats.hundreds, isNumeric: true },
                ].map((stat, index) => {
                  const displayValue = stat.isNumeric 
                    ? (stat.value > 0 ? (stat.format ? stat.format(stat.value) : stat.value.toString()) : '-')
                    : stat.value;
                  return (
                          <motion.div
                      key={index}
                            className="p-4 rounded-lg border text-center relative overflow-hidden group"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.6 + index * 0.03 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                              borderColor: `${primaryColor.medium}40`,
                      }}
                    >
                      <p 
                              className="text-xl font-bold mb-1 text-gray-100"
                      >
                        {displayValue}
                      </p>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              {stat.label}
                            </p>
                          </motion.div>
                  );
                })}
              </div>
                  </motion.div>

                  {/* Bowling Performance */}
                  <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                  >
                    <motion.h4 
                      className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-300"
              >
                <div 
                        className="w-8 h-0.5 rounded-full"
                        style={{ 
                          background: `linear-gradient(to right, ${secondaryColor.solid || primaryColor.solid}, ${primaryColor.solid})`,
                        }}
                      />
                      <TrendingUp className="w-4 h-4" style={{ color: secondaryColor.solid || primaryColor.solid }} />
                Bowling Performance
                    </motion.h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Matches', value: player.stats.matches, isNumeric: true },
                  { label: 'Bowling Innings', value: (player.stats as any).bowlingInnings || 0, isNumeric: true },
                  { label: 'Balls', value: (player.stats as any).balls || 0, isNumeric: true },
                  { label: 'Overs', value: (player.stats as any).balls ? ((player.stats as any).balls / 6).toFixed(1) : '0', isNumeric: false },
                  { label: 'Maidens', value: (player.stats as any).maidens || 0, isNumeric: true },
                  { label: 'Runs Conceded', value: (player.stats as any).runsConceded || 0, isNumeric: true },
                  { label: 'Wickets', value: player.stats.wickets, isNumeric: true },
                  { 
                          label: 'Bowling Avg', 
                    value: (() => {
                      const bowlingAvg = player.stats.bowlingAverage ?? 
                        (player.stats.wickets > 0 
                          ? calculateBowlingAverage(player.stats.economy, player.stats.wickets, player.stats.matches)
                          : 0);
                      return bowlingAvg;
                    })(),
                    isNumeric: true,
                    format: (v: number) => v.toFixed(2)
                  },
                  { label: 'Economy', value: player.stats.economy, isNumeric: true, format: (v: number) => v.toFixed(2) },
                  { 
                    label: 'Bowling SR', 
                    value: (() => {
                      const balls = (player.stats as any).balls || 0;
                      const wickets = player.stats.wickets || 0;
                      if (wickets > 0 && balls > 0) {
                        return (balls / wickets).toFixed(1);
                      }
                      return '0';
                    })(),
                    isNumeric: false
                  },
                  { label: 'Best Bowling', value: player.stats.bestBowling, isNumeric: false },
                  { label: '5 Wickets', value: (player.stats as any).fiveWickets || 0, isNumeric: true },
                ].map((stat, index) => {
                  let displayValue: string;
                  if (stat.isNumeric) {
                    displayValue = stat.value > 0 
                      ? (stat.format ? stat.format(stat.value) : stat.value.toString())
                      : '-';
                  } else {
                    displayValue = stat.value && stat.value !== '-' ? stat.value : '-';
                  }
                  return (
                          <motion.div
                      key={index}
                            className="p-4 rounded-lg border text-center relative overflow-hidden group"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.8 + index * 0.03 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                      style={{
                        background: `linear-gradient(135deg, ${secondaryColor.light}, ${primaryColor.light})`,
                              borderColor: `${(secondaryColor.medium || primaryColor.medium)}40`,
                      }}
                    >
                      <p 
                              className="text-xl font-bold mb-1 text-gray-100"
                      >
                        {displayValue}
                      </p>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              {stat.label}
                            </p>
                          </motion.div>
                  );
                })}
              </div>
                  </motion.div>

                  {/* Overall Performance */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 }}
                  >
                    <motion.h4 
                      className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-300"
              >
                <div 
                        className="w-8 h-0.5 rounded-full"
                        style={{ 
                          background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})`,
                        }}
                      />
                      <BarChart3 className="w-4 h-4" style={{ color: primaryColor.solid }} />
                      Overall Performance Rating
                    </motion.h4>

                    {/* Overall Rating Card */}
                    <motion.div
                      className="mb-6 p-6 rounded-xl border relative overflow-hidden"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 1.0 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                        borderColor: `${primaryColor.medium}50`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
                            Performance Rating
                          </p>
                          <p className="text-xs text-gray-500">
                            {overallPerformance.summary}
                          </p>
                        </div>
                        <div className="text-right">
                          <motion.div
                            className="text-4xl font-bold mb-1"
                            style={{ color: primaryColor.solid }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: 1.1, type: "spring" }}
                          >
                            {overallPerformance.rating.toFixed(1)}
                          </motion.div>
                          <p className="text-xs text-gray-400">out of 100</p>
                    </div>
                </div>
                      
                      {/* Rating Bar */}
                      <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                      style={{
                            background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${overallPerformance.rating}%` }}
                          transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
                        />
                    </div>
                    </motion.div>

                    {/* Performance Breakdown */}
                    {overallPerformance.breakdown.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                          Performance Breakdown
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {overallPerformance.breakdown
                            .filter(item => item.weight > 0) // Only show metrics with weight
                            .map((item, index) => (
                            <motion.div
                      key={index}
                              className="p-4 rounded-lg border text-center relative overflow-hidden group"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 1.2 + index * 0.05 }}
                              whileHover={{ scale: 1.05, y: -2 }}
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                                borderColor: `${primaryColor.medium}40`,
                      }}
                    >
                      <p 
                                className="text-xl font-bold mb-1 text-gray-100"
                              >
                                {item.value}
                              </p>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                {item.label}
                              </p>
                              <div className="w-full h-1 bg-gray-800/50 rounded-full overflow-hidden mt-2">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{
                                    background: primaryColor.solid,
                                  }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(item.weight / 30) * 100}%` }}
                                  transition={{ duration: 0.6, delay: 1.3 + index * 0.05 }}
                                />
                    </div>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {item.weight.toFixed(1)} pts
                              </p>
                            </motion.div>
                  ))}
                </div>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
          )}
    </AnimatePresence>
  );
}
