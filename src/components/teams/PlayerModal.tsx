'use client';

import { useState, useEffect } from 'react';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import { getOptimalTextColor } from '@/lib/colorUtils';
import { formatDateDDMMYYYY, calculateAge } from '@/lib/dateUtils';

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

  return (
    <>
      {/* Backdrop with animated gradient */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
        }}
        onClick={handleBackdropClick}
      >
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 opacity-30 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${primaryColor.medium}, ${secondaryColor.medium}, transparent)`,
          }}
        />

        {/* Modal Content with team colors */}
        <div 
          className="relative rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 shadow-2xl transform transition-all duration-500 animate-scale-in"
          style={{
            background: `linear-gradient(135deg, rgba(20, 20, 30, 0.98), rgba(30, 30, 40, 0.98))`,
            borderColor: primaryColor.medium,
            boxShadow: `0 20px 60px ${primaryColor.glow}40, 0 0 100px ${secondaryColor.glow}20`
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-90"
            style={{
              background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
              border: `2px solid ${primaryColor.medium}`
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primaryColor.textOnLight }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header Section with Player Info */}
          <div 
            className="relative p-8 border-b-2 overflow-hidden"
            style={{
              borderColor: primaryColor.medium,
              background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`
            }}
          >
            {/* Animated background pattern */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle, ${primaryColor.solid} 1px, transparent 1px)`,
                backgroundSize: '30px 30px'
              }}
            />

            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Player Avatar with team colors */}
              <div 
                className="relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                  boxShadow: `0 10px 40px ${primaryColor.glow}, 0 0 60px ${secondaryColor.glow}40`
                }}
              >
                {/* Outer glow ring */}
                <div 
                  className="absolute -inset-2 rounded-full opacity-50 animate-pulse"
                  style={{
                    background: `conic-gradient(from 0deg, ${primaryColor.solid}, ${secondaryColor.solid}, ${primaryColor.solid})`,
                    filter: 'blur(8px)'
                  }}
                />
                
                <span 
                  className="relative font-black text-3xl md:text-4xl z-10 text-white"
                  style={{
                    textShadow: `0 2px 10px rgba(0,0,0,0.5)`
                  }}
                >
                  {getInitials(player.name)}
                </span>

                {/* Captain badge */}
                {player.isCaptain && (
                  <div 
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-20"
                    style={{
                      background: `linear-gradient(135deg, #FFD700, #FFA500)`,
                    }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#000000' }}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Player Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 
                  className="text-4xl md:text-5xl font-black mb-4 text-white"
                  style={{
                    textShadow: `0 2px 20px ${primaryColor.glow}`
                  }}
                >
                  {player.name}
                </h2>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                  <span 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm border-2 text-white"
                    style={{
                      background: `${primaryColor.light}`,
                      borderColor: primaryColor.medium,
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {player.role}
                  </span>
                  <span 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm border-2 text-white"
                    style={{
                      background: `${secondaryColor.light}`,
                      borderColor: secondaryColor.medium,
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {player.dateOfBirth ? calculateAge(player.dateOfBirth) : player.age} years
                    {player.dateOfBirth && <span className="text-xs ml-2">({formatDateDDMMYYYY(player.dateOfBirth)})</span>}
                  </span>
                  {player.nationality !== 'Pakistan' && (
                    <span 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm border-2 text-white"
                      style={{
                        background: `${primaryColor.light}`,
                        borderColor: primaryColor.medium,
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {player.nationality}
                    </span>
                  )}
                </div>
              </div>

              {/* Jersey Number Badge */}
              <div 
                className="absolute top-6 left-6 md:relative md:top-0 md:left-0 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-black text-2xl md:text-3xl shadow-2xl transform hover:scale-110 transition-transform duration-300"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                  color: '#FFFFFF',
                  boxShadow: `0 5px 25px ${primaryColor.glow}, 0 0 40px ${secondaryColor.glow}30`
                }}
              >
                {player.jerseyNumber > 0 ? player.jerseyNumber : 'N/A'}
              </div>
            </div>
          </div>

          {/* Playing Style Section */}
          <div className="p-8 border-b-2" style={{ borderColor: primaryColor.medium }}>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-white">
              <div 
                className="w-1 h-8 rounded-full"
                style={{ background: `linear-gradient(to bottom, ${primaryColor.solid}, ${secondaryColor.solid})` }}
              />
              Playing Style
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Determine which cards should be highlighted based on role */}
              {(() => {
                const isBowler = player.role === 'Bowler';
                const isAllRounder = player.role === 'All-rounder';
                
                const highlightBatting = isAllRounder;
                const highlightBowling = isBowler || isAllRounder;
                
                return (
                  <>
                    <div 
                      className="p-6 rounded-2xl backdrop-blur-sm border-2 transform hover:scale-105 transition-all duration-300"
                      style={{
                        background: highlightBatting 
                          ? `linear-gradient(135deg, ${primaryColor.light}, ${adjustOpacity(primaryColor.medium, 0.4)})`
                          : `linear-gradient(135deg, ${adjustOpacity(primaryColor.light, 0.4)}, transparent)`,
                        borderColor: highlightBatting ? primaryColor.solid : adjustOpacity(primaryColor.medium, 0.4),
                        borderWidth: highlightBatting ? '2px' : '1px',
                        boxShadow: highlightBatting ? `0 4px 20px ${adjustOpacity(primaryColor.glow, 0.4)}` : 'none'
                      }}
                    >
                      <p 
                        className="text-2xl font-black mb-2 text-white"
                      >
                        {player.battingStyle || 'N/A'}
                      </p>
                      <p 
                        className="text-sm font-semibold uppercase tracking-wider text-white"
                      >
                        Batting Style
                      </p>
                    </div>
                    <div 
                      className="p-6 rounded-2xl backdrop-blur-sm border-2 transform hover:scale-105 transition-all duration-300"
                      style={{
                        background: highlightBowling 
                          ? `linear-gradient(135deg, ${secondaryColor.light}, ${adjustOpacity(secondaryColor.medium || primaryColor.medium, 0.4)})`
                          : `linear-gradient(135deg, ${adjustOpacity(secondaryColor.light || primaryColor.light, 0.4)}, transparent)`,
                        borderColor: highlightBowling ? (secondaryColor.solid || primaryColor.solid) : adjustOpacity(secondaryColor.medium || primaryColor.medium, 0.4),
                        borderWidth: highlightBowling ? '2px' : '1px',
                        boxShadow: highlightBowling ? `0 4px 20px ${adjustOpacity(secondaryColor.glow || primaryColor.glow, 0.4)}` : 'none'
                      }}
                    >
                      <p 
                        className="text-2xl font-black mb-2"
                        style={{ color: secondaryColor.text || primaryColor.text }}
                      >
                        {player.bowlingStyle || 'N/A'}
                      </p>
                      <p 
                        className="text-sm font-semibold uppercase tracking-wider"
                        style={{ color: highlightBowling ? primaryColor.textOnLight : 'rgba(156, 163, 175, 0.6)' }}
                      >
                        Bowling Style
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Career Statistics Section - Hide for WPL players */}
          {!isWPLPlayer && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black flex items-center gap-3 text-white">
                <div 
                  className="w-1 h-8 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${primaryColor.solid}, ${secondaryColor.solid})` }}
                />
                Career Statistics
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>Jersey:</span>
                <span 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full font-black text-lg shadow-lg text-white"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                    boxShadow: `0 5px 15px ${primaryColor.glow}`
                  }}
                >
                  {player.jerseyNumber > 0 ? player.jerseyNumber : 'N/A'}
                </span>
              </div>
            </div>
            
            {/* Batting Performance - Show for all players */}
            <div className="mb-8">
              <h4 
                className="text-xl font-black mb-6 flex items-center gap-2 text-white"
              >
                <div 
                  className="w-8 h-1 rounded-full"
                  style={{ background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})` }}
                />
                Batting Performance
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Highest Score', value: player.stats.highest },
                  { label: 'Fours (4s)', value: player.stats.fours },
                  { label: 'Sixes (6s)', value: player.stats.sixes },
                  { label: 'Fifties (50s)', value: player.stats.fifties },
                  { label: 'Hundreds (100s)', value: player.stats.hundreds },
                  { label: 'Total Runs', value: player.stats.runs },
                  { label: 'Batting Avg', value: player.stats.average },
                  { label: 'Strike Rate', value: player.stats.strikeRate },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl backdrop-blur-sm border text-center transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                      borderColor: primaryColor.medium,
                    }}
                  >
                    <p 
                      className="text-3xl font-black mb-1 text-white"
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: primaryColor.textOnLight }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bowling Performance - Show for all players */}
            <div className="mb-8">
              <h4 
                className="text-xl font-black mb-6 flex items-center gap-2 text-white"
              >
                <div 
                  className="w-8 h-1 rounded-full"
                  style={{ background: `linear-gradient(to right, ${secondaryColor.solid || primaryColor.solid}, ${primaryColor.solid})` }}
                />
                Bowling Performance
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Wickets', value: player.stats.wickets },
                  { label: 'Economy Rate', value: player.stats.economy },
                  { 
                    label: 'Bowling Avg', 
                    value: (() => {
                      const bowlingAvg = player.stats.bowlingAverage ?? 
                        (player.stats.wickets > 0 
                          ? calculateBowlingAverage(player.stats.economy, player.stats.wickets, player.stats.matches)
                          : 0);
                      return bowlingAvg > 0 ? bowlingAvg.toFixed(2) : '-';
                    })()
                  },
                  { label: 'Best Bowling (BBM)', value: player.stats.bestBowling || '-' },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl backdrop-blur-sm border text-center transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${secondaryColor.light}, ${primaryColor.light})`,
                      borderColor: secondaryColor.medium || primaryColor.medium,
                    }}
                  >
                    <p 
                      className="text-3xl font-black mb-1 text-white"
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Performance - Role-specific calculation */}
            <div>
              <h4 
                className="text-xl font-black mb-6 flex items-center gap-2 text-white"
              >
                <div 
                  className="w-8 h-1 rounded-full"
                  style={{ background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})` }}
                />
                Overall Performance
              </h4>
              
              {/* For Bowlers - Focus on bowling metrics */}
              {player.role === 'Bowler' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Matches Played', value: player.stats.matches },
                    { label: 'Total Wickets', value: player.stats.wickets },
                    { label: 'Avg Wickets/Match', value: (player.stats.matches > 0 ? (player.stats.wickets / player.stats.matches).toFixed(2) : 0) },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="p-6 rounded-xl backdrop-blur-sm border text-center transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                      style={{
                        background: `linear-gradient(135deg, ${secondaryColor.light}, ${primaryColor.light})`,
                        borderColor: secondaryColor.medium || primaryColor.medium,
                      }}
                    >
                      <p 
                        className="text-4xl font-black mb-2 text-white"
                      >
                        {stat.value}
                      </p>
                      <p className="text-sm font-semibold uppercase tracking-wider text-white">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* For All-rounders - Focus on both batting and bowling */}
              {player.role === 'All-rounder' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Matches Played', value: player.stats.matches },
                    { label: 'Runs/Match', value: runsPerMatch },
                    { label: 'Wickets/Match', value: (player.stats.matches > 0 ? (player.stats.wickets / player.stats.matches).toFixed(2) : 0) },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="p-6 rounded-xl backdrop-blur-sm border text-center transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                      style={{
                        background: `linear-gradient(135deg, ${secondaryColor.light}, ${primaryColor.light})`,
                        borderColor: secondaryColor.medium || primaryColor.medium,
                      }}
                    >
                      <p 
                        className="text-4xl font-black mb-2 text-white"
                      >
                        {stat.value}
                      </p>
                      <p className="text-sm font-semibold uppercase tracking-wider text-white">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* For Batsmen and Wicket-keepers - Focus on batting metrics */}
              {(player.role === 'Batsman' || player.role === 'Wicket-keeper') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Matches Played', value: player.stats.matches },
                    { label: 'Boundaries/Match', value: boundariesPerMatch },
                    { label: 'Runs/Match', value: runsPerMatch },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="p-6 rounded-xl backdrop-blur-sm border text-center transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                        borderColor: primaryColor.medium,
                      }}
                    >
                      <p 
                        className="text-4xl font-black mb-2"
                        style={{ color: primaryColor.text }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: primaryColor.textOnLight }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </>
  );
}
