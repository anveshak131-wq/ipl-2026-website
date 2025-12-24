'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import { getOptimalTextColor } from '@/lib/colorUtils';
import { formatDateDDMMYYYY, calculateAge } from '@/lib/dateUtils';
import FlagImage from '@/components/ui/FlagImage';
import { X, Star, Globe, Calendar, TrendingUp, Award, Target } from 'lucide-react';

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
  
  const light = `rgba(${r}, ${g}, ${b}, 0.15)`;
  const medium = `rgba(${r}, ${g}, ${b}, 0.3)`;
  
  return {
    light,
    medium,
    solid: hex,
    glow: `rgba(${r}, ${g}, ${b}, 0.5)`,
    text: getOptimalTextColor(hex),
    textOnLight: '#FFFFFF',
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

  // Calculate bowling average from economy and wickets if not provided
  const calculateBowlingAverage = (economy: number, wickets: number, matches: number): number => {
    if (wickets === 0) return 0;
    // Estimate overs bowled: assume average 4 overs per match for bowlers
    const estimatedOvers = matches * 4;
    const runsConceded = economy * estimatedOvers;
    return runsConceded / wickets;
  };

  useEffect(() => {
    // If team colors are provided directly, use them
    if (teamColors) {
      setTeamColorsState(teamColors);
      return;
    }
    
    // If team colors are not provided but we have a player, fetch team data
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
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    
    return undefined;};
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

  // Helper function to get white text color
  const getWhiteText = () => '#FFFFFF';
  
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

  if (!isOpen || !player) return null;

  return (
    <AnimatePresence>
      {isOpen && player && (
        <motion.div 
          key="player-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
        }}
        onClick={handleBackdropClick}
      >
        {/* Enhanced animated background gradients */}
        <motion.div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${primaryColor.medium}60, transparent 50%),
                         radial-gradient(circle at 70% 70%, ${secondaryColor.medium}60, transparent 50%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Animated mesh gradient overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${primaryColor.solid}30, transparent 50%, ${secondaryColor.solid}30)`,
          }}
        />

        {/* Premium Modal Content */}
        <motion.div 
          className="relative rounded-[2rem] max-w-5xl w-full max-h-[95vh] overflow-hidden border-[3px] shadow-2xl"
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: `linear-gradient(135deg, rgba(15, 15, 25, 0.98), rgba(25, 25, 35, 0.98), rgba(15, 15, 25, 0.98))`,
            borderColor: `${primaryColor.medium}80`,
            boxShadow: `0 30px 80px ${primaryColor.glow}50, 0 0 120px ${secondaryColor.glow || primaryColor.glow}30, inset 0 0 60px ${primaryColor.glow}10`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Premium Close Button */}
          <motion.button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-xl border-2 shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${primaryColor.light}60, ${secondaryColor.light}60)`,
              borderColor: primaryColor.medium,
              boxShadow: `0 8px 30px ${primaryColor.glow}40`
            }}
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <X className="w-6 h-6" style={{ color: primaryColor.textOnLight }} strokeWidth={3} />
          </motion.button>

          {/* Premium Header Section */}
          <div
                className="relative p-10 border-b-[3px] overflow-hidden"
                style={{
                  borderColor: `${primaryColor.medium}70`,
                  background: `linear-gradient(135deg, ${primaryColor.light}50, ${secondaryColor.light}50, ${primaryColor.light}30)`
                }}
              >
                {/* Enhanced animated background pattern */}
                <motion.div 
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 2px 2px, ${primaryColor.solid} 1.5px, transparent 0),
                      linear-gradient(45deg, transparent 48%, ${primaryColor.solid}20 49%, ${primaryColor.solid}20 51%, transparent 52%)
                    `,
                    backgroundSize: '40px 40px, 25px 25px'
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%']
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                
                {/* Animated gradient overlay */}
                <motion.div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `conic-gradient(from 0deg, transparent, ${primaryColor.solid}20, transparent, ${secondaryColor.solid}20, transparent)`
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                  {/* Premium Player Avatar */}
                  <motion.div 
                className="relative"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              >
                <div 
                  className="relative w-36 h-36 md:w-40 md:h-40 rounded-3xl flex items-center justify-center shadow-2xl border-[3px]"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                    borderColor: `${primaryColor.medium}80`,
                    boxShadow: `0 15px 50px ${primaryColor.glow}60, 0 0 80px ${secondaryColor.glow || primaryColor.glow}40, inset 0 0 40px ${primaryColor.glow}20`
                  }}
                >
                  {/* Enhanced outer glow ring */}
                  <motion.div 
                    className="absolute -inset-4 rounded-3xl opacity-60"
                    style={{
                      background: `conic-gradient(from 0deg, ${primaryColor.solid}, ${secondaryColor.solid}, ${primaryColor.solid})`,
                      filter: 'blur(12px)'
                    }}
                    animate={{
                      rotate: [0, 360],
                      opacity: [0.6, 0.8, 0.6]
                    }}
                    transition={{
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                    }}
                  />
                  
                  <span 
                    className="relative font-black text-5xl md:text-6xl z-10 text-white"
                    style={{
                      textShadow: `0 4px 20px rgba(0,0,0,0.8), 0 0 40px ${primaryColor.glow}60`
                    }}
                  >
                    {getInitials(player.name)}
                  </span>

                  {/* Premium Captain badge */}
                  {player.isCaptain && (
                    <motion.div 
                      className="absolute -top-3 -right-3 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl z-20 border-2"
                      style={{
                        background: `linear-gradient(135deg, #FFD700, #FFA500)`,
                        borderColor: '#FFD700',
                        boxShadow: `0 8px 30px rgba(255, 215, 0, 0.6)`
                      }}
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Star className="w-6 h-6" fill="#000000" color="#000000" />
                    </motion.div>
                )}
              </div>
              </motion.div>
              
              {/* Premium Player Info */}
              <div className="flex-1 text-center md:text-left">
                <motion.h2
                      className="text-5xl md:text-6xl font-black mb-6 text-white"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                  style={{
                        textShadow: `0 4px 30px ${primaryColor.glow}70, 0 2px 10px rgba(0,0,0,0.8)`,
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                  }}
                >
                  {player.name}
                    </motion.h2>
                    
                    <motion.div 
                      className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <motion.span 
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold backdrop-blur-xl border-2 text-white shadow-lg"
                    style={{
                          background: `linear-gradient(135deg, ${primaryColor.light}60, ${secondaryColor.light}60)`,
                      borderColor: primaryColor.medium,
                          boxShadow: `0 4px 20px ${primaryColor.glow}30`
                    }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        transition={{ duration: 0.2 }}
                  >
                        <Target className="w-4 h-4" />
                    {player.role}
                        {player.allrounderType && (
                          <span className="ml-2 text-xs opacity-80">({player.allrounderType})</span>
                        )}
                      </motion.span>
                      <motion.span 
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold backdrop-blur-xl border-2 text-white shadow-lg"
                    style={{
                          background: `linear-gradient(135deg, ${secondaryColor.light}60, ${primaryColor.light}60)`,
                          borderColor: secondaryColor.medium || primaryColor.medium,
                          boxShadow: `0 4px 20px ${secondaryColor.glow || primaryColor.glow}30`
                    }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        transition={{ duration: 0.2 }}
                  >
                        <Calendar className="w-4 h-4" />
                    {(player.dateOfBirth ? calculateAge(player.dateOfBirth) : player.age) > 0 
                      ? `${player.dateOfBirth ? calculateAge(player.dateOfBirth) : player.age} years`
                      : 'Age not set'}
                        {player.dateOfBirth && <span className="text-xs ml-2 opacity-80">({formatDateDDMMYYYY(player.dateOfBirth)})</span>}
                      </motion.span>
                      {player.nationality && player.nationality !== 'Pakistan' && (
                        <motion.span 
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold backdrop-blur-xl border-2 text-white shadow-lg"
                      style={{
                            background: `linear-gradient(135deg, ${primaryColor.light}60, ${secondaryColor.light}60)`,
                        borderColor: primaryColor.medium,
                            boxShadow: `0 4px 20px ${primaryColor.glow}30`
                      }}
                          whileHover={{ scale: 1.1, y: -2 }}
                          transition={{ duration: 0.2 }}
                    >
                          <Globe className="w-4 h-4" />
                        <FlagImage nationality={player.nationality} size="sm" />
                          {player.nationality}
                        </motion.span>
                      )}
                    </motion.div>
              </div>

                  {/* Premium Jersey Number Badge */}
                  <motion.div 
                className="absolute top-8 left-8 md:relative md:top-0 md:left-0 w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center font-black text-4xl md:text-5xl shadow-2xl border-[3px]"
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, type: "spring", delay: 0.4 }}
                style={{
                  background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                  borderColor: `${primaryColor.medium}80`,
                  color: '#FFFFFF',
                  boxShadow: `0 10px 40px ${primaryColor.glow}70, 0 0 60px ${secondaryColor.glow || primaryColor.glow}50, inset 0 0 30px ${primaryColor.glow}20`
                }}
                whileHover={{ scale: 1.15, rotate: 10 }}
              >
                <span className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                {player.jerseyNumber > 0 ? player.jerseyNumber : 'N/A'}
                </span>
              </motion.div>
            </div>
          </div>

              {/* Premium Playing Style Section */}
              <motion.div 
                className="p-10 border-b-[3px] overflow-hidden"
                style={{ borderColor: `${primaryColor.medium}70` }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.h3 
                  className="text-3xl font-black mb-8 flex items-center gap-4 text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div 
                    className="w-2 h-10 rounded-full shadow-lg"
                    style={{ 
                      background: `linear-gradient(to bottom, ${primaryColor.solid}, ${secondaryColor.solid})`,
                      boxShadow: `0 0 20px ${primaryColor.glow}`
                    }}
                  />
                  <span style={{ textShadow: `0 2px 20px ${primaryColor.glow}50` }}>Playing Style</span>
                </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const isBowler = player.role === 'Bowler';
                const isAllRounder = player.role === 'All-rounder';
                
                    const highlightBatting = isAllRounder || player.role === 'Batsman' || player.role === 'Wicket-keeper';
                const highlightBowling = isBowler || isAllRounder;
                
                return (
                  <>
                        <motion.div 
                          className="p-8 rounded-3xl backdrop-blur-xl border-[3px] relative overflow-hidden group"
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                      style={{
                        background: highlightBatting 
                              ? `linear-gradient(135deg, ${primaryColor.light}60, ${adjustOpacity(primaryColor.medium, 0.5)})`
                              : `linear-gradient(135deg, ${adjustOpacity(primaryColor.light, 0.3)}, transparent)`,
                            borderColor: highlightBatting ? `${primaryColor.solid}80` : `${adjustOpacity(primaryColor.medium, 0.3)}60`,
                            boxShadow: highlightBatting 
                              ? `0 15px 40px ${primaryColor.glow}40, inset 0 0 40px ${primaryColor.glow}10`
                              : `0 8px 25px ${primaryColor.glow}20`
                          }}
                        >
                          {/* Hover shimmer */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <motion.div 
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              style={{ transform: 'skewX(-20deg)' }}
                              animate={{ x: ['-200%', '200%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                            />
                          </div>
                          <p 
                            className="text-4xl font-black mb-3 text-white relative z-10"
                            style={{ textShadow: `0 4px 20px ${primaryColor.glow}60` }}
                      >
                        {player.battingStyle && player.battingStyle.trim() !== '' ? player.battingStyle : 'N/A'}
                      </p>
                      <p 
                        className="text-base font-bold uppercase tracking-widest text-white relative z-10"
                        style={{ letterSpacing: '0.15em' }}
                      >
                        Batting Style
                      </p>
                    </motion.div>
                    <motion.div
                          className="p-8 rounded-3xl backdrop-blur-xl border-[3px] relative overflow-hidden group"
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: 0.5 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                      style={{
                        background: highlightBowling 
                              ? `linear-gradient(135deg, ${secondaryColor.light}60, ${adjustOpacity(secondaryColor.medium || primaryColor.medium, 0.5)})`
                              : `linear-gradient(135deg, ${adjustOpacity(secondaryColor.light || primaryColor.light, 0.3)}, transparent)`,
                            borderColor: highlightBowling ? `${(secondaryColor.solid || primaryColor.solid)}80` : `${adjustOpacity(secondaryColor.medium || primaryColor.medium, 0.3)}60`,
                            boxShadow: highlightBowling 
                              ? `0 15px 40px ${secondaryColor.glow || primaryColor.glow}40, inset 0 0 40px ${secondaryColor.glow || primaryColor.glow}10`
                              : `0 8px 25px ${secondaryColor.glow || primaryColor.glow}20`
                          }}
                        >
                          {/* Hover shimmer */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <motion.div 
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              style={{ transform: 'skewX(-20deg)' }}
                              animate={{ x: ['-200%', '200%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                            />
                          </div>
                          <p 
                            className="text-4xl font-black mb-3 text-white relative z-10"
                            style={{ textShadow: `0 4px 20px ${secondaryColor.glow || primaryColor.glow}60` }}
                      >
                        {player.bowlingStyle && player.bowlingStyle.trim() !== '' ? player.bowlingStyle : 'N/A'}
                      </p>
                      <p 
                            className="text-base font-bold uppercase tracking-widest text-white relative z-10"
                            style={{ 
                              letterSpacing: '0.15em',
                              color: highlightBowling ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'
                            }}
                      >
                        Bowling Style
                      </p>
                        </motion.div>
                  </>
                );
              })()}
            </div>
              </motion.div>

              {/* Premium Career Statistics Section - Hide for WPL players */}
          {!isWPLPlayer && (
              <motion.div 
                className="p-10 overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.div 
                  className="flex justify-between items-center mb-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <motion.h3 
                    className="text-4xl font-black flex items-center gap-4 text-white"
                    style={{ textShadow: `0 2px 20px ${primaryColor.glow}50` }}
                  >
                    <div 
                      className="w-2 h-12 rounded-full shadow-lg"
                      style={{ 
                        background: `linear-gradient(to bottom, ${primaryColor.solid}, ${secondaryColor.solid})`,
                        boxShadow: `0 0 25px ${primaryColor.glow}`
                      }}
                    />
                    <Award className="w-8 h-8" style={{ color: primaryColor.solid }} />
                Career Statistics
                  </motion.h3>
                  <motion.div 
                    className="flex items-center gap-4"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-base font-bold uppercase tracking-wider" style={{ color: '#FFFFFF' }}>Jersey:</span>
                <span 
                      className="inline-flex items-center justify-center w-16 h-16 rounded-2xl font-black text-2xl shadow-2xl text-white border-2"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                        borderColor: primaryColor.medium,
                        boxShadow: `0 8px 30px ${primaryColor.glow}50`
                  }}
                >
                  {player.jerseyNumber > 0 ? player.jerseyNumber : 'N/A'}
                </span>
                  </motion.div>
                </motion.div>
            
                {/* Premium Batting Performance */}
                <motion.div 
                  className="mb-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <motion.h4 
                    className="text-2xl font-black mb-8 flex items-center gap-3 text-white"
                    style={{ textShadow: `0 2px 15px ${primaryColor.glow}40` }}
              >
                <div 
                      className="w-12 h-1.5 rounded-full shadow-lg"
                      style={{ 
                        background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})`,
                        boxShadow: `0 0 20px ${primaryColor.glow}`
                      }}
                    />
                    <TrendingUp className="w-6 h-6" style={{ color: primaryColor.solid }} />
                Batting Performance
                  </motion.h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                      { label: 'Highest Score', value: player.stats.highest, isNumeric: true, icon: '🏆' },
                      { label: 'Fours (4s)', value: player.stats.fours, isNumeric: true, icon: '4️⃣' },
                      { label: 'Sixes (6s)', value: player.stats.sixes, isNumeric: true, icon: '6️⃣' },
                      { label: 'Fifties (50s)', value: player.stats.fifties, isNumeric: true, icon: '5️⃣0️⃣' },
                      { label: 'Hundreds (100s)', value: player.stats.hundreds, isNumeric: true, icon: '💯' },
                      { label: 'Total Runs', value: player.stats.runs, isNumeric: true, icon: '📊' },
                      { label: 'Batting Avg', value: player.stats.average, isNumeric: true, format: (v: number) => v.toFixed(2), icon: '📈' },
                      { label: 'Strike Rate', value: player.stats.strikeRate, isNumeric: true, format: (v: number) => v.toFixed(1), icon: '⚡' },
                ].map((stat, index) => {
                  const displayValue = stat.isNumeric 
                    ? (stat.value > 0 ? (stat.format ? stat.format(stat.value) : stat.value.toString()) : '-')
                    : stat.value;
                  return (
                    <motion.div
                      key={index}
                      className="p-6 rounded-2xl backdrop-blur-xl border-[2px] text-center relative overflow-hidden group"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.05 }}
                      whileHover={{ scale: 1.1, y: -5 }}
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor.light}50, ${secondaryColor.light}50)`,
                        borderColor: `${primaryColor.medium}70`,
                        boxShadow: `0 10px 30px ${primaryColor.glow}30`
                      }}
                    >
                      {/* Hover glow */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                        style={{ background: primaryColor.medium }}
                      />
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <p 
                        className="text-4xl font-black mb-2 text-white relative z-10"
                        style={{ textShadow: `0 2px 15px ${primaryColor.glow}50` }}
                      >
                        {displayValue}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-widest relative z-10" style={{ color: primaryColor.textOnLight, letterSpacing: '0.1em' }}>
                        {stat.label}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Premium Bowling Performance */}
            <motion.div 
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <motion.h4 
                className="text-2xl font-black mb-8 flex items-center gap-3 text-white"
                style={{ textShadow: `0 2px 15px ${secondaryColor.glow || primaryColor.glow}40` }}
              >
                <div 
                  className="w-12 h-1.5 rounded-full shadow-lg"
                  style={{ 
                    background: `linear-gradient(to right, ${secondaryColor.solid || primaryColor.solid}, ${primaryColor.solid})`,
                    boxShadow: `0 0 20px ${secondaryColor.glow || primaryColor.glow}`
                  }}
                />
                <TrendingUp className="w-6 h-6" style={{ color: secondaryColor.solid || primaryColor.solid }} />
                Bowling Performance
              </motion.h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { label: 'Wickets', value: player.stats.wickets, isNumeric: true, icon: '🎯' },
                  { label: 'Economy Rate', value: player.stats.economy, isNumeric: true, format: (v: number) => v.toFixed(2), icon: '💰' },
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
                    format: (v: number) => v.toFixed(2),
                    icon: '📊'
                  },
                  { label: 'Best Bowling', value: player.stats.bestBowling, isNumeric: false, icon: '⭐' },
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
                      className="p-6 rounded-2xl backdrop-blur-xl border-[2px] text-center relative overflow-hidden group"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.05 }}
                      whileHover={{ scale: 1.1, y: -5 }}
                      style={{
                        background: `linear-gradient(135deg, ${secondaryColor.light}50, ${primaryColor.light}50)`,
                        borderColor: `${(secondaryColor.medium || primaryColor.medium)}70`,
                        boxShadow: `0 10px 30px ${secondaryColor.glow || primaryColor.glow}30`
                      }}
                    >
                      {/* Hover glow */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                        style={{ background: secondaryColor.medium || primaryColor.medium }}
                      />
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <p 
                        className="text-4xl font-black mb-2 text-white relative z-10"
                        style={{ textShadow: `0 2px 15px ${secondaryColor.glow || primaryColor.glow}50` }}
                      >
                        {displayValue}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-widest relative z-10 text-white" style={{ letterSpacing: '0.1em' }}>
                        {stat.label}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Premium Overall Performance - Role-specific calculation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <motion.h4 
                className="text-2xl font-black mb-8 flex items-center gap-3 text-white"
                style={{ textShadow: `0 2px 15px ${primaryColor.glow}40` }}
              >
                <div 
                  className="w-12 h-1.5 rounded-full shadow-lg"
                  style={{ 
                    background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})`,
                    boxShadow: `0 0 20px ${primaryColor.glow}`
                  }}
                />
                <Award className="w-6 h-6" style={{ color: primaryColor.solid }} />
                Overall Performance
              </motion.h4>
              
              {/* For Bowlers - Focus on bowling metrics */}
              {player.role === 'Bowler' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Matches Played', value: player.stats.matches, icon: '🎮' },
                    { label: 'Total Wickets', value: player.stats.wickets, icon: '🎯' },
                    { label: 'Avg Wickets/Match', value: (player.stats.matches > 0 ? (player.stats.wickets / player.stats.matches).toFixed(2) : 0), icon: '📈' },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="p-8 rounded-3xl backdrop-blur-xl border-[2px] text-center relative overflow-hidden group"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 1.0 + index * 0.1 }}
                      whileHover={{ scale: 1.1, y: -8 }}
                      style={{
                        background: `linear-gradient(135deg, ${secondaryColor.light}60, ${primaryColor.light}60)`,
                        borderColor: `${(secondaryColor.medium || primaryColor.medium)}70`,
                        boxShadow: `0 15px 40px ${secondaryColor.glow || primaryColor.glow}40`
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                           style={{ background: secondaryColor.medium || primaryColor.medium }} />
                      <div className="text-3xl mb-3 relative z-10">{stat.icon}</div>
                      <p 
                        className="text-5xl font-black mb-3 text-white relative z-10"
                        style={{ textShadow: `0 4px 20px ${secondaryColor.glow || primaryColor.glow}60` }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-sm font-bold uppercase tracking-widest text-white relative z-10" style={{ letterSpacing: '0.15em' }}>
                        {stat.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* For All-rounders - Focus on both batting and bowling */}
              {player.role === 'All-rounder' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Matches Played', value: player.stats.matches, icon: '🎮' },
                    { label: 'Runs/Match', value: runsPerMatch, icon: '🏃' },
                    { label: 'Wickets/Match', value: (player.stats.matches > 0 ? (player.stats.wickets / player.stats.matches).toFixed(2) : 0), icon: '🎯' },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="p-8 rounded-3xl backdrop-blur-xl border-[2px] text-center relative overflow-hidden group"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 1.0 + index * 0.1 }}
                      whileHover={{ scale: 1.1, y: -8 }}
                      style={{
                        background: `linear-gradient(135deg, ${secondaryColor.light}60, ${primaryColor.light}60)`,
                        borderColor: `${(secondaryColor.medium || primaryColor.medium)}70`,
                        boxShadow: `0 15px 40px ${secondaryColor.glow || primaryColor.glow}40`
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                           style={{ background: secondaryColor.medium || primaryColor.medium }} />
                      <div className="text-3xl mb-3 relative z-10">{stat.icon}</div>
                      <p 
                        className="text-5xl font-black mb-3 text-white relative z-10"
                        style={{ textShadow: `0 4px 20px ${secondaryColor.glow || primaryColor.glow}60` }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-sm font-bold uppercase tracking-widest text-white relative z-10" style={{ letterSpacing: '0.15em' }}>
                        {stat.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* For Batsmen and Wicket-keepers - Focus on batting metrics */}
              {(player.role === 'Batsman' || player.role === 'Wicket-keeper') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Matches Played', value: player.stats.matches, icon: '🎮' },
                    { label: 'Boundaries/Match', value: boundariesPerMatch, icon: '⚡' },
                    { label: 'Runs/Match', value: runsPerMatch, icon: '🏃' },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="p-8 rounded-3xl backdrop-blur-xl border-[2px] text-center relative overflow-hidden group"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 1.0 + index * 0.1 }}
                      whileHover={{ scale: 1.1, y: -8 }}
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor.light}60, ${secondaryColor.light}60)`,
                        borderColor: `${primaryColor.medium}70`,
                        boxShadow: `0 15px 40px ${primaryColor.glow}40`
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                           style={{ background: primaryColor.medium }} />
                      <div className="text-3xl mb-3 relative z-10">{stat.icon}</div>
                      <p 
                        className="text-5xl font-black mb-3 text-white relative z-10"
                        style={{ textShadow: `0 4px 20px ${primaryColor.glow}60` }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-sm font-bold uppercase tracking-widest text-white relative z-10" style={{ letterSpacing: '0.15em' }}>
                        {stat.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
