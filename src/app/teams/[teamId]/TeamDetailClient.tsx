'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import SmartDescription from '@/components/teams/SmartDescription';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PlayerModal from '@/components/teams/PlayerModal';
import WPLPlayerCard from '@/components/teams/WPLPlayerCard';
import WPLPlayerModal from '@/components/teams/WPLPlayerModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuroraBackground from '@/components/ui/AuroraBackground';
import IPLLogo from '@/components/ui/IPLLogo';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import CustomEmoji from '@/components/emoji/CustomEmoji';
import UpcomingFixturesWidget from '@/components/teams/UpcomingFixturesWidget';
import PlayerPerformanceChart from '@/components/teams/PlayerPerformanceChart';
import TeamNewsFeed from '@/components/teams/TeamNewsFeed';
import SocialMediaLinks from '@/components/teams/SocialMediaLinks';
import TeamHistoryTimeline from '@/components/teams/TeamHistoryTimeline';
import RecentResultsTimeline from '@/components/teams/RecentResultsTimeline';
import TrophyShowcaseGallery from '@/components/teams/TrophyShowcaseGallery';
import InteractiveStadiumTour from '@/components/teams/InteractiveStadiumTour';
import PlayerComparisonTool from '@/components/teams/PlayerComparisonTool';
import TeamFormationVisualizer from '@/components/teams/TeamFormationVisualizer';
import { Calendar, Filter } from 'lucide-react';
import { api } from '@/lib/data';
import { 
  UsersIcon, 
  StarIcon, 
  GlobeIcon, 
  AllRounderIcon, 
  BatsmanIcon, 
  BowlerIcon, 
  WicketKeeperIcon,
  CricketBatIcon,
  TrophyIcon
} from '@/components/ui/CustomIcons';
import Image from 'next/image';
import { Team, Player, CoachingStaff, KeyPlayers, Match, Trophy } from '@/types';
import { PlayerCardProps, KeyPlayersSectionProps, StatsTabProps, AboutTabProps } from '@/types/components';
import { sortPlayersByRoleAndAge } from '@/lib/playerSort';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { getOptimalTextColor } from '@/lib/colorUtils';
import FlagImage from '@/components/ui/FlagImage';

interface TeamDetailClientProps {
  teamId: string;
  league?: 'ipl' | 'wpl';
}


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
    text: '#FFFFFF',
    textOnLight: '#FFFFFF',
  };
}

// Animated Counter Component
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const startValue = 0;
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
      
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, value, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function TeamDetailClient({ teamId, league }: TeamDetailClientProps) {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'squad' | 'stats' | 'about'>('squad');
  const [scrollY, setScrollY] = useState(0);
  const [nationalityFilter, setNationalityFilter] = useState<'all' | 'indian' | 'overseas'>('all');
  const [battingStyleFilter, setBattingStyleFilter] = useState<'any' | 'right' | 'left'>('any');
  const [seasonStats, setSeasonStats] = useState<{
    matchesPlayed: number;
    wins: number;
    losses: number;
    noResult: number;
    winPercentage: number;
  } | null>(null);
  const [lastMatch, setLastMatch] = useState<Match | null>(null);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [coachingStaff, setCoachingStaff] = useState<CoachingStaff | null>(null);
  const [keyPlayers, setKeyPlayers] = useState<KeyPlayers | null>(null);
  const [showPlayerComparison, setShowPlayerComparison] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Handle different route formats: shortName (RCB, MI), numeric (1, 2), or team prefix (team1, team2)
        const numericId = teamId.replace('team', '');
        const shortNameUpper = teamId.toUpperCase();
        const shortNameLower = teamId.toLowerCase();
        
        // Fetch teams with league filter if provided
        const teamsUrl = league ? `/api/teams?league=${league}` : '/api/teams';
        const teamsResponse = await fetch(teamsUrl);
        if (teamsResponse.ok) {
          const allTeams = await teamsResponse.json();
          // Try to find team by shortName first (RCB, MI, etc.), then by ID
          let team = allTeams.find((t: Team) => 
            t.shortName?.toLowerCase() === shortNameLower || 
            t.shortName?.toUpperCase() === shortNameUpper
          );
          
          // Fallback to ID matching if shortName not found (for backward compatibility)
          if (!team) {
            team = allTeams.find((t: Team) => t.id === numericId || t.id === teamId);
          }
          
          if (team) {
            // Fetch players using api helper for better error handling and ID normalization
            const teamLeague = league || (team.league as 'ipl' | 'wpl') || 'ipl';
            console.log('TeamDetailClient: Fetching players for league:', teamLeague, 'team ID:', team.id);
            
            const allPlayers = await api.getPlayers(undefined, teamLeague);
            console.log('TeamDetailClient: Fetched players:', allPlayers.length);
            
            if (allPlayers.length > 0) {
              console.log('TeamDetailClient: Sample player teamIds:', allPlayers.slice(0, 5).map(p => ({ 
                name: p.name, 
                teamId: p.teamId, 
                teamIdType: typeof p.teamId 
              })));
            }
            
            // Match players by teamId - handle both "1" and "team1" formats
            // Normalize both IDs for comparison
            const normalizeId = (id: string | number | undefined): string => {
              if (!id) return '';
              const str = String(id).trim();
              // Remove 'team' prefix if present and convert to number then back to string for consistency
              const numMatch = str.replace(/^team/i, '').match(/^\d+$/);
              return numMatch ? numMatch[0] : str.toLowerCase();
            };
            
            const normalizedTeamId = normalizeId(team.id);
            console.log('TeamDetailClient: Normalized team ID:', normalizedTeamId, 'from:', team.id);
            
            const teamIdVariations = [
              String(team.id),
              normalizedTeamId,
              `team${normalizedTeamId}`,
              String(team.id).replace(/^team/i, ''),
              String(team.id).toLowerCase(),
              String(team.id).toUpperCase()
            ];
            
            const teamPlayers = allPlayers.filter((p: Player) => {
              const normalizedPlayerTeamId = normalizeId(p.teamId);
              const playerTeamIdVariations = [
                String(p.teamId),
                normalizedPlayerTeamId,
                `team${normalizedPlayerTeamId}`,
                String(p.teamId).replace(/^team/i, ''),
                String(p.teamId).toLowerCase(),
                String(p.teamId).toUpperCase()
              ];
              
              // Check if any variation matches
              const matches = teamIdVariations.some(tv => 
                playerTeamIdVariations.some(pv => pv === tv)
              );
              
              if (matches) {
                console.log('TeamDetailClient: Matched player:', p.name, 'playerTeamId:', p.teamId, 'normalized:', normalizedPlayerTeamId, 'to team:', team.id, 'normalized:', normalizedTeamId);
              }
              return matches;
            });
            
            console.log('TeamDetailClient: Matched players for team:', teamPlayers.length, 'out of', allPlayers.length, 'total players');
            
            if (teamPlayers.length === 0 && allPlayers.length > 0) {
              console.warn('TeamDetailClient: No players matched! Sample player teamIds:', allPlayers.slice(0, 10).map(p => ({
                name: p.name,
                teamId: p.teamId,
                normalized: normalizeId(p.teamId)
              })));
            }
            
            // Use matched players if found, otherwise fall back to team's original players array
            const finalPlayers = teamPlayers.length > 0 
              ? teamPlayers 
              : (team.players || []);
            
            console.log('TeamDetailClient: Final players count:', finalPlayers.length);
            
            const teamWithPlayers = {
              ...team,
              players: sortPlayersByRoleAndAge(finalPlayers)
            };
            setTeamData(teamWithPlayers);
            
            // Fetch coaching staff for this team
            try {
              const coachesResponse = await fetch(`/api/coaches?teamId=${team.id}`);
              if (coachesResponse.ok) {
                const coaches = await coachesResponse.json();
                setCoachingStaff(coaches);
              }
            } catch (err) {
              console.error('Error fetching coaching staff:', err);
            }

            // Fetch key players for this team
            try {
              const keyPlayersResponse = await fetch(`/api/key-players?teamId=${team.id}`);
              if (keyPlayersResponse.ok) {
                const raw = await keyPlayersResponse.json() as { keyPlayers?: KeyPlayers };
                if (raw && raw.keyPlayers) {
                  const normalized: KeyPlayers = {
                    teamId: raw.keyPlayers.teamId || team.id,
                    powerHitterIds: raw.keyPlayers.powerHitterIds || [],
                    anchorIds: raw.keyPlayers.anchorIds || [],
                    finisherIds: raw.keyPlayers.finisherIds || [],
                    strikeBowlerIds: raw.keyPlayers.strikeBowlerIds || [],
                    deathSpecialistIds: raw.keyPlayers.deathSpecialistIds || [],
                    allRoundXFactorIds: raw.keyPlayers.allRoundXFactorIds || [],
                  };
                  setKeyPlayers(normalized);
                } else {
                  setKeyPlayers(null);
                }
              }
            } catch (err) {
              console.error('Error fetching key players:', err);
            }
          } else {
            setTeamData(null);
          }
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, league]);

  // Fetch matches and compute season snapshot once team data is available
  useEffect(() => {
    if (!teamData) return;

    const loadMatches = async () => {
      try {
        // Fetch matches with league filter if provided
        const matchesUrl = league ? `/api/matches?league=${league}` : '/api/matches';
        const res = await fetch(matchesUrl);
        if (!res.ok) return;

        const matches = await res.json();
        const teamMatches = matches.filter((m: Match) => m.team1?.id === teamData.id || m.team2?.id === teamData.id);
        setAllMatches(teamMatches);

        const completed = teamMatches.filter((m: Match) => m.status === 'completed');
        const upcoming = teamMatches.filter((m: Match) => m.status === 'upcoming');

        let wins = 0;
        let losses = 0;
        let noResult = 0;

        completed.forEach((m: Match) => {
          if (!m.result) {
            noResult += 1;
            return;
          }
          const resultText = (m.result as string).toLowerCase();
          const isThisTeam = m.team1?.id === teamData.id ? m.team1 : m.team2;
          const oppTeam = m.team1?.id === teamData.id ? m.team2 : m.team1;

          if (resultText.includes(isThisTeam.shortName.toLowerCase()) || resultText.includes(isThisTeam.name.toLowerCase())) {
            wins += 1;
          } else if (oppTeam && (resultText.includes(oppTeam.shortName.toLowerCase()) || resultText.includes(oppTeam.name.toLowerCase()))) {
            losses += 1;
          } else if (resultText.includes('no result') || resultText.includes('abandoned')) {
            noResult += 1;
          }
        });

        const matchesPlayed = completed.length;
        const winPercentage = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

        setSeasonStats({ matchesPlayed, wins, losses, noResult, winPercentage });

        // Last completed match (by date)
        if (completed.length > 0) {
          const sortedCompleted = [...completed].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setLastMatch(sortedCompleted[0]);
        }

        // Next upcoming match (by date)
        if (upcoming.length > 0) {
          const sortedUpcoming = [...upcoming].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setNextMatch(sortedUpcoming[0]);
        }
      } catch (err) {
        console.error('Error loading matches for team snapshot:', err);
      }
    };

    loadMatches();
  }, [teamData, league]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <AuroraBackground />
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <AuroraBackground />
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-white mb-4">Team Not Found</h1>
          <p className="text-gray-400 mb-6">This team does not exist.</p>
          <button
            onClick={() => router.push(league === 'wpl' ? '/wpl/teams' : '/teams')}
            className="px-6 py-2 bg-gradient-to-r from-ipl-blue-dark to-ipl-purple hover:from-ipl-purple hover:to-ipl-gold text-white rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Back to Teams
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Determine league from team data or prop
  const teamLeague = teamData.league || league || 'ipl';
  const isWPL = teamLeague === 'wpl';

  const primaryColor = createColorVariations(teamData.colors.primary);
  const secondaryColor = createColorVariations(teamData.colors.secondary);
  const numericId = teamId.replace('team', '');
  const teamLogoPath = getAnimatedLogoPath(teamData.id, teamData.shortName, teamData.league);
  const fallbackLogoPath = getLogoPath(teamData.id);

  // Apply squad filters
  const filteredPlayers = (teamData.players || []).filter((p) => {
    let nationalityOk = true;
    if (nationalityFilter === 'indian') {
      nationalityOk = p.nationality === 'India';
    } else if (nationalityFilter === 'overseas') {
      nationalityOk = p.nationality !== 'India';
    }

    let battingOk = true;
    if (battingStyleFilter === 'right') {
      battingOk = p.battingStyle.toLowerCase().includes('right');
    } else if (battingStyleFilter === 'left') {
      battingOk = p.battingStyle.toLowerCase().includes('left');
    }

    return nationalityOk && battingOk;
  });

  const batsmen = filteredPlayers.filter(p => p.role === 'Batsman');
  const wicketkeepers = filteredPlayers.filter(p => p.role === 'Wicket-keeper');
  const allRounders = filteredPlayers.filter(p => p.role === 'All-rounder');
  const bowlers = filteredPlayers.filter(p => p.role === 'Bowler');
  

  return (
    <div className="min-h-screen" style={{
      background: `linear-gradient(135deg, ${primaryColor.solid}15, ${secondaryColor.solid}15)`
    }}>
      <AuroraBackground />
      <Navbar />
      
      <main className="relative overflow-hidden">
        {/* Enhanced Hero Section */}
        <motion.div 
          className="relative min-h-[90vh] flex items-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Premium Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
            
            {/* Enhanced Team color gradient orbs with parallax */}
            <motion.div 
              className="absolute w-[1000px] h-[1000px] rounded-full blur-[120px] opacity-40"
              style={{
                background: `radial-gradient(circle, ${primaryColor.solid}60, ${primaryColor.solid}30, transparent)`,
                top: '-15%',
                right: '-10%',
              }}
              animate={{
                y: [0, -50, 0],
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute w-[800px] h-[800px] rounded-full blur-[100px] opacity-35"
              style={{
                background: `radial-gradient(circle, ${secondaryColor.solid}60, ${secondaryColor.solid}30, transparent)`,
                bottom: '-15%',
                left: '-10%',
              }}
              animate={{
                y: [0, 50, 0],
                scale: [1, 1.25, 1],
                opacity: [0.35, 0.55, 0.35],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
            
            {/* Animated mesh gradient overlay */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(135deg, ${primaryColor.solid}20, transparent 50%, ${secondaryColor.solid}20)`,
              }}
            />
            
            {/* Enhanced dot pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `radial-gradient(circle, ${primaryColor.solid} 1.5px, transparent 1.5px)`,
              backgroundSize: '50px 50px'
            }} />
            
            {/* Animated grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `
                  linear-gradient(${primaryColor.solid}40 1px, transparent 1px),
                  linear-gradient(90deg, ${primaryColor.solid}40 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px'
              }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
            {/* Enhanced Back Button */}
            <AnimatedSection direction="left" delay={0.2}>
              <motion.button 
                onClick={() => router.push(isWPL ? '/wpl/teams' : '/teams')}
                className="mb-16 flex items-center gap-4 text-gray-300 hover:text-white transition-all duration-300 group"
                whileHover={{ x: -8 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="w-12 h-12 rounded-2xl backdrop-blur-xl flex items-center justify-center border-2 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor.light}30, ${secondaryColor.light}30)`,
                    borderColor: `${primaryColor.medium}50`,
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    borderColor: primaryColor.medium,
                    boxShadow: `0 0 30px ${primaryColor.glow}40`
                  }}
                >
                  <svg className="w-6 h-6 transform group-hover:-translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </motion.div>
                <span className="font-bold text-lg">Back to Teams</span>
              </motion.button>
            </AnimatedSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              {/* Left: Enhanced Team Info */}
              <AnimatedSection direction="right" delay={0.3} className="space-y-10">
                {/* Premium Team Badge */}
                <motion.div 
                  className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl backdrop-blur-2xl border-2 shadow-2xl transition-all duration-500 group"
                     style={{
                    background: `linear-gradient(135deg, ${primaryColor.light}40, ${secondaryColor.light}40)`,
                    borderColor: primaryColor.medium,
                    boxShadow: `0 10px 40px ${primaryColor.glow}30`
                  }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  {!isWPL && (
                    <motion.div 
                      className="w-6 h-6"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <IPLLogo size="sm" />
                    </motion.div>
                  )}
                  {isWPL && (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">WPL</span>
                  )}
                  <span className="text-base font-black tracking-wider whitespace-nowrap" style={{ color: primaryColor.textOnLight }}>
                    {teamData.shortName}
                  </span>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </motion.div>

                {/* Enhanced Team Name */}
                <div>
                  <motion.h1 
                    className="text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-[0.9] tracking-tight"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid}, ${primaryColor.solid})`,
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: `drop-shadow(0 0 80px ${primaryColor.glow}) drop-shadow(0 4px 20px rgba(0,0,0,0.8))`,
                    }}
                  >
                    {teamData.name}
                  </motion.h1>
                  
                  {/* Enhanced Accent Line */}
                  <motion.div 
                    className="flex items-center gap-6 mb-8"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    transition={{ duration: 1, delay: 0.6 }}
                  >
                    <div className="h-1.5 w-32 rounded-full shadow-2xl"
                         style={{
                           background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})`,
                           boxShadow: `0 0 30px ${primaryColor.glow}60`
                         }} />
                    <div className="flex gap-3">
                      <motion.div 
                        className="w-3 h-3 rounded-full shadow-lg"
                        style={{ 
                          backgroundColor: primaryColor.solid,
                          boxShadow: `0 0 20px ${primaryColor.glow}`
                        }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div 
                        className="w-3 h-3 rounded-full shadow-lg"
                        style={{ 
                          backgroundColor: secondaryColor.solid,
                          boxShadow: `0 0 20px ${secondaryColor.glow || primaryColor.glow}`
                        }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      />
                    </div>
                  </motion.div>
                </div>
                
                {/* Enhanced Description */}
                <motion.p 
                  className="text-2xl leading-relaxed max-w-2xl text-gray-200 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  style={{
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                  }}
                >
                  {teamData.description}
                </motion.p>
                
                {/* Enhanced Color Swatches */}
                <div className="flex gap-8 pt-4">
                  <motion.div 
                    className="group text-center"
                    whileHover={{ scale: 1.1, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-3xl blur-xl opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                           style={{ backgroundColor: primaryColor.solid }} />
                      <motion.div 
                        className="relative w-20 h-20 rounded-3xl shadow-2xl border-2 border-white/30 transition-all duration-300"
                        style={{ 
                          backgroundColor: primaryColor.solid,
                          boxShadow: `0 10px 40px ${primaryColor.glow}50`
                        }}
                        whileHover={{ rotate: 12, scale: 1.15 }}
                      />
                    </div>
                    <p className="text-gray-300 text-sm font-bold mt-4 uppercase tracking-widest">Primary</p>
                  </motion.div>
                  <motion.div 
                    className="group text-center"
                    whileHover={{ scale: 1.1, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-3xl blur-xl opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                           style={{ backgroundColor: secondaryColor.solid }} />
                      <motion.div 
                        className="relative w-20 h-20 rounded-3xl shadow-2xl border-2 border-white/30 transition-all duration-300"
                        style={{ 
                          backgroundColor: secondaryColor.solid,
                          boxShadow: `0 10px 40px ${secondaryColor.glow || primaryColor.glow}50`
                        }}
                        whileHover={{ rotate: -12, scale: 1.15 }}
                      />
                    </div>
                    <p className="text-gray-300 text-sm font-bold mt-4 uppercase tracking-widest">Secondary</p>
                  </motion.div>
                </div>
              </AnimatedSection>

              {/* Right: Premium Team Logo */}
              <AnimatedSection direction="left" delay={0.5} className="relative flex items-center justify-center">
                {/* Enhanced Glow effect */}
                <motion.div 
                  className="absolute inset-0 rounded-full blur-[150px] opacity-40"
                     style={{ 
                    background: `radial-gradient(circle, ${primaryColor.solid}60, ${secondaryColor.solid}40, transparent)`,
                  }}
                  animate={{
                    opacity: [0.4, 0.6, 0.4],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Enhanced Rotating ring */}
                <motion.div 
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke={primaryColor.medium} strokeWidth="1" strokeDasharray="8,4" opacity="0.4" />
                  </svg>
                </motion.div>

                {/* Premium Logo Container */}
                <div className="relative group">
                  {/* Outer glow ring */}
                  <motion.div 
                    className="absolute -inset-8 rounded-full opacity-60 blur-3xl"
                       style={{
                         background: `conic-gradient(from 0deg, ${primaryColor.solid}, ${secondaryColor.solid}, ${primaryColor.solid})`
                    }}
                    animate={{
                      rotate: [0, 360],
                      opacity: [0.6, 0.8, 0.6],
                    }}
                    transition={{
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                    }}
                  />
                  
                  {/* Main logo container */}
                  <motion.div 
                    className="relative w-[400px] h-[400px] md:w-[500px] md:h-[500px] rounded-[3rem] flex items-center justify-center backdrop-blur-2xl border-[3px] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-visible"
                       style={{
                      background: `linear-gradient(135deg, ${primaryColor.light}50, ${secondaryColor.light}50, ${primaryColor.light}30)`,
                      borderColor: `${primaryColor.medium}80`,
                      boxShadow: `0 0 60px ${primaryColor.glow}60, 0 0 120px ${secondaryColor.glow || primaryColor.glow}40, inset 0 0 60px ${primaryColor.glow}20`
                    }}
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Animated gradient overlay */}
                    <motion.div 
                      className="absolute inset-0 rounded-[3rem] opacity-30"
                         style={{
                        background: `conic-gradient(from 0deg, transparent, ${primaryColor.solid}30, transparent, ${secondaryColor.solid}30, transparent)`
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Actual Team Logo */}
                    {teamLogoPath.endsWith('.json') ? (
                      <div className="w-4/5 h-4/5 relative z-10">
                        <RCBLottie className="w-full h-full" />
                      </div>
                    ) : teamLogoPath.endsWith('rcb_logo_premium.svg') ? (
                      <div className="w-5/6 h-5/6 relative z-10 flex items-center justify-center">
                        <RCBLionLogo className="w-full h-full" />
                      </div>
                    ) : (
                      <motion.img 
                        src={teamLogoPath}
                        alt={`${teamData.shortName} logo`}
                        className="w-4/5 h-4/5 object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] relative z-10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackLogoPath;
                        }}
                        animate={{ 
                          y: [0, -10, 0],
                          scale: [1, 1.02, 1]
                        }}
                        transition={{ 
                          duration: 4, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                      />
                    )}
                    
                    {/* Premium League Logo Badge */}
                    {!isWPL && (
                      <motion.div 
                        className="absolute bottom-4 right-4 w-16 h-16 md:w-20 md:h-20 rounded-2xl backdrop-blur-2xl border-2 border-white/40 flex items-center justify-center shadow-2xl z-20"
                        style={{
                          background: `linear-gradient(135deg, rgba(30, 58, 138, 0.9), rgba(88, 28, 135, 0.9))`,
                          boxShadow: `0 10px 40px rgba(59, 130, 246, 0.6)`
                        }}
                        whileHover={{ scale: 1.15, rotate: 15 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="w-10 h-10 md:w-12 md:h-12">
                          <IPLLogo animated />
                        </div>
                      </motion.div>
                    )}
                    {isWPL && (
                      <motion.div 
                        className="absolute bottom-4 right-4 w-16 h-16 md:w-20 md:h-20 rounded-2xl backdrop-blur-2xl border-2 border-white/40 flex items-center justify-center shadow-2xl z-20"
                        style={{
                          background: `linear-gradient(135deg, rgba(88, 28, 135, 0.9), rgba(219, 39, 119, 0.9))`,
                          boxShadow: `0 10px 40px rgba(168, 85, 247, 0.6)`
                        }}
                        whileHover={{ scale: 1.15, rotate: 15 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="text-sm md:text-base font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">WPL</span>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </AnimatedSection>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </motion.div>

        {/* Premium Stats Section */}
        <AnimatedSection direction="up" delay={0.2} className="relative z-20 -mt-32 mb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Section Header */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                Team Overview
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto rounded-full" />
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Squad Size', value: teamData.players?.length || 0, Icon: UsersIcon, color: 'blue' },
                { label: 'Captains', value: teamData.players?.filter(p => p.isCaptain).length || 0, Icon: StarIcon, color: 'yellow' },
                { label: 'Foreign', value: teamData.players?.filter(p => p.nationality !== 'India').length || 0, Icon: GlobeIcon, color: 'green' },
                { label: 'All-rounders', value: teamData.players?.filter(p => p.role === 'All-rounder').length || 0, Icon: AllRounderIcon, color: 'purple' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.08, y: -10, rotateY: 5 }}
                  className="group relative overflow-hidden rounded-3xl backdrop-blur-2xl p-8 border-2 shadow-2xl transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor.light}50, ${secondaryColor.light}50, ${primaryColor.light}30)`,
                    borderColor: `${primaryColor.medium}60`,
                    boxShadow: `0 20px 60px ${primaryColor.glow}30, inset 0 0 40px ${primaryColor.glow}10`,
                    transformStyle: 'preserve-3d',
                    perspective: '1000px'
                  }}
                >
                  {/* Enhanced Glow on Hover */}
                  <div 
                    className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl -z-10"
                    style={{
                      background: `radial-gradient(circle, ${primaryColor.medium}60, ${secondaryColor.medium}40, transparent)`
                    }}
                  />
                  
                  {/* League Logo Watermark */}
                  {!isWPL && (
                    <div className="absolute top-4 right-4 w-10 h-10 opacity-5 group-hover:opacity-15 transition-opacity">
                      <IPLLogo animated />
                    </div>
                  )}
                  {isWPL && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg opacity-5 group-hover:opacity-15 transition-opacity bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                      <span className="text-xs font-bold text-purple-300">WPL</span>
                    </div>
                  )}
                  
                  {/* Icon with enhanced animation */}
                  <motion.div 
                    className="mb-6 relative"
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="absolute inset-0 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity"
                         style={{ background: primaryColor.medium }} />
                    <div className="relative">
                      <stat.Icon className="w-16 h-16" color={primaryColor.solid} />
                    </div>
                  </motion.div>
                  
                  {/* Value with enhanced styling */}
                  <p className="text-6xl font-black mb-3 transform group-hover:scale-110 transition-transform duration-300" 
                     style={{ 
                       color: primaryColor.text,
                       textShadow: `0 0 30px ${primaryColor.glow}50`,
                       filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                     }}>
                    <AnimatedCounter value={stat.value} />
                  </p>
                  
                  {/* Label */}
                  <p className="text-sm font-bold uppercase tracking-widest transition-colors duration-300" 
                     style={{ 
                       color: primaryColor.textOnLight,
                       letterSpacing: '0.15em'
                     }}>
                    {stat.label}
                  </p>
                  
                  {/* Enhanced Hover shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '200%' }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                      style={{ transform: 'skewX(-20deg)' }}
                    />
                  </div>
                  
                  {/* Bottom accent line */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})`,
                      boxShadow: `0 0 20px ${primaryColor.glow}`
                    }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Upcoming Fixtures Widget */}
            {teamData && (
              <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in mb-6"
                   style={{
                     background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                     borderColor: primaryColor.medium,
                     boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                   }}>
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3" style={{ color: primaryColor.textOnLight }}>
                  <CricketBatIcon className="w-8 h-8" color={primaryColor.solid} />
                  Upcoming Fixtures
                </h3>
                <UpcomingFixturesWidget team={teamData} matches={allMatches} />
              </div>
            )}

            {/* Match & Season Snapshot */}
            {seasonStats && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                {/* Season summary */}
                <div
                  className="rounded-3xl backdrop-blur-xl p-6 border shadow-xl flex flex-col justify-between"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                    borderColor: primaryColor.medium,
                    boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: primaryColor.textOnLight }}>
                        Season snapshot
                      </p>
                      <h3 className="text-2xl font-black" style={{ color: primaryColor.text }}>
                        {teamData.shortName} 2026
                      </h3>
                    </div>
                    <div className="w-8 h-8 opacity-20">
                      <TrophyIcon className="w-full h-full" color={primaryColor.solid} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-400">Matches</p>
                      <p className="text-xl font-bold text-white">{seasonStats.matchesPlayed}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Win %</p>
                      <p className="text-xl font-bold text-ipl-gold">{seasonStats.winPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Wins</p>
                      <p className="text-lg font-semibold text-green-400">{seasonStats.wins}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Losses</p>
                      <p className="text-lg font-semibold text-red-400">{seasonStats.losses}</p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1 text-xs text-gray-400">
                      <span>Season progress</span>
                      <span>
                        {seasonStats.matchesPlayed} matches · {seasonStats.noResult} NR
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 via-ipl-gold to-red-500"
                        style={{ width: `${Math.max(seasonStats.winPercentage, 4)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Last match */}
                <div
                  className="rounded-3xl backdrop-blur-xl p-6 border shadow-xl flex flex-col"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(15,23,42,0.95))',
                    borderColor: 'rgba(148,163,184,0.6)',
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Last match</p>
                  {lastMatch ? (
                    <>
                      <p className="text-sm text-gray-400 mb-1">
                        {new Date(lastMatch.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        · {lastMatch.venue}
                      </p>
                      <p className="text-lg font-semibold text-white mb-1">
                        {lastMatch.team1.shortName} vs {lastMatch.team2.shortName}
                      </p>
                      <p className="text-sm text-gray-300 mb-3">{lastMatch.result || 'Result not available'}</p>
                      <p className="text-xs text-gray-500">Status: {lastMatch.status}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No completed matches yet this season.</p>
                  )}
                </div>

                {/* Next match */}
                <div
                  className="rounded-3xl backdrop-blur-xl p-6 border shadow-xl flex flex-col"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.98))',
                    borderColor: 'rgba(59,130,246,0.6)',
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Next match</p>
                  {nextMatch ? (
                    <>
                      <p className="text-sm text-gray-400 mb-1">
                        {new Date(nextMatch.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        · {nextMatch.venue}
                      </p>
                      <p className="text-lg font-semibold text-white mb-1">
                        {nextMatch.team1.shortName} vs {nextMatch.team2.shortName}
                      </p>
                      <p className="text-sm text-gray-300 mb-3">Starts at {nextMatch.time}</p>
                      <p className="text-xs text-blue-400 font-semibold">Tap to view in schedule</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No upcoming matches scheduled yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Premium Tab Navigation - Complete Redesign */}
        <AnimatedSection direction="up" delay={0.3} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 mt-16">
          <div className="flex flex-col items-center gap-12">
            {/* Enhanced League Logo Badge */}
            <motion.div 
              className="relative w-20 h-20 rounded-3xl backdrop-blur-2xl border-[3px] flex items-center justify-center shadow-2xl z-10 group" 
              style={{
                background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                borderColor: primaryColor.medium,
                boxShadow: `0 10px 40px ${primaryColor.glow}50`
              }}
              whileHover={{ scale: 1.15, rotate: 360 }}
              transition={{ duration: 0.6, type: "spring" }}
            >
              <div className="absolute inset-0 rounded-2xl opacity-50 blur-xl"
                   style={{ background: primaryColor.medium }} />
              <div className="relative w-10 h-10">
                <IPLLogo animated />
              </div>
            </motion.div>
            
            {/* Premium Tab Container */}
            <motion.div 
              className="relative inline-flex gap-3 p-2 rounded-3xl backdrop-blur-2xl border-[3px] shadow-2xl"
                 style={{
                background: `linear-gradient(135deg, ${primaryColor.light}50, ${secondaryColor.light}50, ${primaryColor.light}30)`,
                borderColor: `${primaryColor.medium}70`,
                boxShadow: `0 20px 60px ${primaryColor.glow}30, inset 0 0 40px ${primaryColor.glow}10`
              }}
            >
              {/* Background glow */}
              <div 
                className="absolute -inset-2 rounded-3xl opacity-30 blur-2xl -z-10"
                style={{
                  background: `radial-gradient(ellipse, ${primaryColor.medium}60, transparent)`
                }}
              />
              
              {[
                { id: 'squad', label: 'Squad', icon: '👥' },
                { id: 'stats', label: 'Stats', icon: '📊' },
                { id: 'about', label: 'About', icon: 'ℹ️' }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative overflow-hidden px-10 py-5 rounded-2xl font-black text-lg transition-all duration-500 whitespace-nowrap ${
                    activeTab === tab.id ? 'scale-110' : 'hover:scale-105'
                  }`}
                  style={activeTab === tab.id ? {
                    background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                    color: '#FFFFFF',
                    boxShadow: `0 15px 40px ${primaryColor.glow}60, 0 0 60px ${secondaryColor.glow || primaryColor.glow}30, inset 0 0 30px ${primaryColor.glow}20`,
                    border: `3px solid ${primaryColor.medium}`,
                  } : {
                    background: 'transparent',
                    color: primaryColor.textOnLight,
                    border: '3px solid transparent',
                  }}
                  whileHover={activeTab !== tab.id ? { 
                    scale: 1.08,
                    background: `linear-gradient(135deg, ${primaryColor.light}60, ${secondaryColor.light}60)`,
                    borderColor: `${primaryColor.medium}60`
                  } : {}}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Active tab shimmer */}
                  {activeTab === tab.id && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ['-200%', '200%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "easeInOut"
                      }}
                      style={{ transform: 'skewX(-20deg)' }}
                    />
                  )}
                  
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-xl">{tab.icon}</span>
                    {tab.label}
                  </span>
                  
                  {/* Active tab glow */}
                  {activeTab === tab.id && (
                    <motion.div 
                      className="absolute inset-0 rounded-2xl opacity-50 blur-xl -z-10"
                      style={{
                        background: `radial-gradient(circle, ${primaryColor.medium}80, transparent)`,
                      }}
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Content Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <AnimatePresence mode="wait">
            {activeTab === 'squad' && (
              <motion.div 
                key="squad"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-16"
              >
              {/* Team Formation Visualizer */}
              {teamData && teamData.players && teamData.players.length > 0 && (
                <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                     style={{
                       background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                       borderColor: primaryColor.medium,
                       boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                     }}>
                  <TeamFormationVisualizer
                    players={teamData.players}
                    primaryColor={primaryColor.solid}
                    secondaryColor={secondaryColor.solid}
                  />
                </div>
              )}

              {/* Player Comparison Button */}
              {teamData && teamData.players && teamData.players.length > 1 && (
                <div className="flex justify-center">
                  <motion.button
                    onClick={() => setShowPlayerComparison(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-xl font-bold text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                      color: '#FFFFFF',
                      boxShadow: `0 10px 30px ${primaryColor.glow}40`,
                    }}
                  >
                    Compare Players
                  </motion.button>
                </div>
              )}
              {/* Premium Squad Filters - Complete Redesign */}
              <motion.div 
                className="mb-12 rounded-3xl backdrop-blur-2xl border-2 p-8 shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  background: `linear-gradient(135deg, ${primaryColor.light}40, ${secondaryColor.light}40, ${primaryColor.light}20)`,
                  borderColor: `${primaryColor.medium}60`,
                  boxShadow: `0 20px 60px ${primaryColor.glow}20, inset 0 0 40px ${primaryColor.glow}5`
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-xl border-2"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor.light}50, ${secondaryColor.light}50)`,
                        borderColor: primaryColor.medium,
                      }}
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Filter className="w-6 h-6" style={{ color: primaryColor.solid }} />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-black mb-1" style={{ color: primaryColor.text }}>
                        Filter Squad
                      </h3>
                      <p className="text-sm text-gray-400">Refine your search</p>
                    </div>
                </div>

                  <div className="flex flex-wrap items-center gap-6">
                  {/* Nationality filter */}
                    <div className="flex items-center gap-3">
                      <GlobeIcon className="w-5 h-5" style={{ color: primaryColor.solid }} />
                      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor.textOnLight }}>
                        Nationality
                      </span>
                      <div className="inline-flex rounded-2xl backdrop-blur-xl p-1.5 border-2 gap-1.5"
                           style={{
                             background: `linear-gradient(135deg, ${primaryColor.light}30, ${secondaryColor.light}30)`,
                             borderColor: `${primaryColor.medium}40`
                           }}>
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'indian', label: 'Indian' },
                        { id: 'overseas', label: 'Overseas' },
                      ].map((option) => (
                          <motion.button
                          key={option.id}
                          onClick={() => setNationalityFilter(option.id as any)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                            nationalityFilter === option.id
                                ? 'shadow-lg'
                                : ''
                            }`}
                            style={nationalityFilter === option.id ? {
                              background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                              color: '#FFFFFF',
                              boxShadow: `0 8px 25px ${primaryColor.glow}40`
                            } : {
                              background: 'transparent',
                              color: primaryColor.textOnLight,
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                          {option.label}
                          </motion.button>
                      ))}
                    </div>
                  </div>

                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                  {/* Batting style filter */}
                    <div className="flex items-center gap-3">
                      <CricketBatIcon className="w-5 h-5" color={primaryColor.solid} />
                      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor.textOnLight }}>
                        Batting
                      </span>
                      <div className="inline-flex rounded-2xl backdrop-blur-xl p-1.5 border-2 gap-1.5"
                           style={{
                             background: `linear-gradient(135deg, ${primaryColor.light}30, ${secondaryColor.light}30)`,
                             borderColor: `${primaryColor.medium}40`
                           }}>
                      {[
                        { id: 'any', label: 'Any' },
                          { id: 'right', label: 'Right' },
                          { id: 'left', label: 'Left' },
                      ].map((option) => (
                          <motion.button
                          key={option.id}
                          onClick={() => setBattingStyleFilter(option.id as any)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                            battingStyleFilter === option.id
                                ? 'shadow-lg'
                                : ''
                            }`}
                            style={battingStyleFilter === option.id ? {
                              background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                              color: '#FFFFFF',
                              boxShadow: `0 8px 25px ${primaryColor.glow}40`
                            } : {
                              background: 'transparent',
                              color: primaryColor.textOnLight,
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                          {option.label}
                          </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </motion.div>

              {/* Premium Player Sections */}
              {[
                { title: 'Batters', players: batsmen, Icon: BatsmanIcon, color: 'amber' },
                { title: 'Wicket-keepers', players: wicketkeepers, Icon: WicketKeeperIcon, color: 'rose' },
                { title: 'All-rounders', players: allRounders, Icon: AllRounderIcon, color: 'purple' },
                { title: 'Bowlers', players: bowlers, Icon: BowlerIcon, color: 'blue' }
              ].map((section, sectionIndex) => (
                section.players.length > 0 && (
                  <AnimatedSection key={sectionIndex} direction="up" delay={sectionIndex * 0.15} className="mb-16">
                    {/* Premium Section Header */}
                      <motion.div
                      className="mb-10 flex items-center gap-6"
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                      >
                      <motion.div
                        className="relative"
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6, type: "spring" }}
                      >
                        <div className="absolute inset-0 rounded-2xl blur-xl opacity-50"
                             style={{ background: primaryColor.medium }} />
                        <div className="relative p-4 rounded-2xl backdrop-blur-xl border-2"
                             style={{
                               background: `linear-gradient(135deg, ${primaryColor.light}40, ${secondaryColor.light}40)`,
                               borderColor: primaryColor.medium,
                               boxShadow: `0 10px 30px ${primaryColor.glow}30`
                             }}>
                          <section.Icon className="w-12 h-12" color={primaryColor.solid} />
                        </div>
                      </motion.div>
                      <div className="flex-1">
                        <motion.h3 
                          className="text-4xl md:text-5xl font-black mb-2" 
                          style={{ 
                            color: primaryColor.text,
                            textShadow: `0 4px 20px ${primaryColor.glow}50`
                          }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                      {section.title}
                    </motion.h3>
                        <div className="h-1 w-24 rounded-full"
                             style={{
                               background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})`,
                               boxShadow: `0 0 20px ${primaryColor.glow}`
                             }} />
                      </div>
                      <motion.div
                        className="px-6 py-3 rounded-2xl backdrop-blur-xl border-2"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor.light}40, ${secondaryColor.light}40)`,
                          borderColor: primaryColor.medium,
                          boxShadow: `0 8px 25px ${primaryColor.glow}30`
                        }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-2xl font-black" style={{ color: primaryColor.text }}>
                          {section.players.length}
                        </span>
                      </motion.div>
                    </motion.div>
                    
                    {/* Premium Player Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {section.players.map((player, playerIndex) => (
                        isWPL ? (
                          <WPLPlayerCard
                            key={player.id}
                            player={player}
                            onClick={() => {
                              setSelectedPlayer(player);
                              setIsModalOpen(true);
                            }}
                            index={playerIndex}
                          />
                        ) : (
                          <PlayerCard 
                            key={player.id} 
                            player={player} 
                            primaryColor={primaryColor} 
                            secondaryColor={secondaryColor}
                            onClick={() => {
                              setSelectedPlayer(player);
                              setIsModalOpen(true);
                            }}
                            index={playerIndex}
                            keyPlayers={keyPlayers}
                          />
                        )
                      ))}
                    </div>
                  </AnimatedSection>
                )
              ))}
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-10"
              >
              <KeyPlayersSection
                teamData={teamData}
                keyPlayers={keyPlayers}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
              <StatsTab 
                teamData={teamData} 
                primaryColor={primaryColor} 
                secondaryColor={secondaryColor}
                batsmen={batsmen}
                bowlers={bowlers}
                allRounders={allRounders}
                wicketkeepers={wicketkeepers}
              />
              
              {/* Player Performance Charts */}
              {teamData && teamData.players && teamData.players.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                  <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                       }}>
                    <PlayerPerformanceChart
                      players={teamData.players}
                      metric="runs"
                      title="Top Run Scorers"
                      color={primaryColor.solid}
                    />
                  </div>
                  <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                       }}>
                    <PlayerPerformanceChart
                      players={teamData.players}
                      metric="wickets"
                      title="Top Wicket Takers"
                      color={secondaryColor.solid}
                    />
                  </div>
                  <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                       }}>
                    <PlayerPerformanceChart
                      players={teamData.players}
                      metric="average"
                      title="Best Batting Averages"
                      color="#10B981"
                    />
                  </div>
                  <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                       }}>
                    <PlayerPerformanceChart
                      players={teamData.players}
                      metric="strikeRate"
                      title="Best Strike Rates"
                      color="#F59E0B"
                    />
                  </div>
                </div>
              )}
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <AboutTab teamData={teamData} primaryColor={primaryColor} secondaryColor={secondaryColor} coachingStaff={coachingStaff} />
                
                {/* Recent Results Timeline */}
                {teamData && (
                  <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                       }}>
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-3" style={{ color: primaryColor.textOnLight }}>
                      <Calendar className="w-8 h-8" color={primaryColor.solid} />
                      Recent Results
                    </h3>
                    <RecentResultsTimeline team={teamData} matches={allMatches} />
                  </div>
                )}

                {/* Trophy Showcase Gallery */}
                {teamData && (
                  <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                       }}>
                    <TrophyShowcaseGallery
                      team={teamData}
                      primaryColor={primaryColor.solid}
                      secondaryColor={secondaryColor.solid}
                    />
                  </div>
                )}

                {/* Interactive Stadium Tour */}
                {teamData && teamData.homeGrounds && teamData.homeGrounds.length > 0 && (
                  <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                       }}>
                    <InteractiveStadiumTour
                      team={teamData}
                      primaryColor={primaryColor.solid}
                      secondaryColor={secondaryColor.solid}
                    />
                  </div>
                )}

                {/* Team History Timeline */}
                {teamData && (
                  <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                       }}>
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-3" style={{ color: primaryColor.textOnLight }}>
                      <TrophyIcon className="w-8 h-8" color={primaryColor.solid} />
                      Team History
                    </h3>
                    <TeamHistoryTimeline team={teamData} primaryColor={primaryColor.solid} />
                  </div>
                )}

                {/* Team News Feed */}
                {teamData && (
                  <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                       }}>
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-3" style={{ color: primaryColor.textOnLight }}>
                      <CricketBatIcon className="w-8 h-8" color={primaryColor.solid} />
                      Team News
                    </h3>
                    <TeamNewsFeed team={teamData} />
                  </div>
                )}

                {/* Social Media Links */}
                {teamData && (
                  <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                       }}>
                    <SocialMediaLinks team={teamData} primaryColor={primaryColor.solid} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />

      {isWPL ? (
        <WPLPlayerModal
          player={selectedPlayer}
          team={teamData}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPlayer(null);
          }}
        />
      ) : (
        <PlayerModal
          player={selectedPlayer}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPlayer(null);
          }}
          teamColors={teamData?.colors}
          teamData={teamData || undefined}
        />
      )}

      {showPlayerComparison && teamData && teamData.players && (
        <PlayerComparisonTool
          players={teamData.players}
          primaryColor={primaryColor.solid}
          onClose={() => setShowPlayerComparison(false)}
        />
      )}
    </div>
  );
}

// Premium Player Card Component - Complete Redesign
function PlayerCard({ player, primaryColor, secondaryColor, onClick, index, keyPlayers }: PlayerCardProps) {
  const stats = player.stats || {};

  // Derive role tags
  const tags: string[] = [];

  if (keyPlayers) {
    if (keyPlayers.powerHitterIds?.includes(player.id)) {
      tags.push('Power hitter');
    }
    if (keyPlayers.anchorIds?.includes(player.id)) {
      tags.push('Anchor');
    }
    if (keyPlayers.finisherIds?.includes(player.id)) {
      tags.push('Finisher');
    }
    if (keyPlayers.strikeBowlerIds?.includes(player.id)) {
      tags.push('Strike bowler');
    }
    if (keyPlayers.deathSpecialistIds?.includes(player.id)) {
      tags.push('Death specialist');
    }
    if (keyPlayers.allRoundXFactorIds?.includes(player.id)) {
      tags.push('X-factor all-rounder');
    }
  }

  // Key player highlight: high impact with bat or ball
  const isKeyPlayer =
    !!keyPlayers &&
    (
      keyPlayers.powerHitterIds?.includes(player.id) ||
      keyPlayers.anchorIds?.includes(player.id) ||
      keyPlayers.finisherIds?.includes(player.id) ||
      keyPlayers.strikeBowlerIds?.includes(player.id) ||
      keyPlayers.deathSpecialistIds?.includes(player.id) ||
      keyPlayers.allRoundXFactorIds?.includes(player.id)
    );

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: -10 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.1, y: -15, rotateY: 8, rotateX: 5, z: 50 }}
      className="group relative overflow-visible rounded-[2rem] backdrop-blur-2xl p-8 border-[3px] cursor-pointer transition-all duration-700"
      style={{
        background: `linear-gradient(135deg, ${primaryColor.light}60, ${secondaryColor.light}50, ${primaryColor.light}40)`,
        borderColor: isKeyPlayer ? 'rgba(250, 204, 21, 0.8)' : `${primaryColor.medium}70`,
        boxShadow: isKeyPlayer
          ? `0 0 60px rgba(250, 204, 21, 0.6), 0 25px 60px ${primaryColor.glow}40, inset 0 0 80px ${primaryColor.glow}15, 0 0 0 1px rgba(250, 204, 21, 0.3)`
          : `0 25px 60px ${primaryColor.glow}35, inset 0 0 60px ${primaryColor.glow}10, 0 0 0 1px ${primaryColor.medium}30`,
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Premium Glow Effect on Hover */}
      <motion.div 
        className="absolute -inset-4 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl -z-10"
        style={{
          background: `radial-gradient(ellipse at center, ${primaryColor.medium}70, ${secondaryColor.medium}50, transparent 70%)`
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Premium Animated Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.12] transition-opacity duration-700"
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, ${primaryColor.solid} 1.5px, transparent 0),
            linear-gradient(45deg, transparent 48%, ${primaryColor.solid}20 49%, ${primaryColor.solid}20 51%, transparent 52%)
          `,
          backgroundSize: '30px 30px, 20px 20px'
        }}
      />
      
      {/* Top Accent Bar for Key Players */}
      {isKeyPlayer && (
        <motion.div 
          className="absolute top-0 left-0 right-0 h-2 rounded-t-[2rem]"
          style={{
            background: `linear-gradient(to right, transparent, rgba(250, 204, 21, 0.8), transparent)`,
            boxShadow: `0 0 30px rgba(250, 204, 21, 0.6)`
          }}
          animate={{
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Premium Jersey Number */}
      <motion.div
        className="absolute top-6 right-6 w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl shadow-2xl z-10 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
          boxShadow: `0 10px 40px ${primaryColor.glow}70, inset 0 4px 15px rgba(255,255,255,0.3), inset 0 -4px 15px rgba(0,0,0,0.2)`,
        }}
        whileHover={{ scale: 1.25, rotate: 20, z: 100 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
      >
        <span className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
        {player.jerseyNumber > 0 ? player.jerseyNumber : 'N/A'}
        </span>
      </motion.div>

      {/* Premium Hover Shimmer Effect */}
      <motion.div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden"
        initial={false}
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{ transform: 'skewX(-20deg)' }}
          animate={{
            x: ['-200%', '200%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Premium Player Name Section */}
      <div className="flex items-start gap-4 mb-6 pr-24 relative z-10">
        {player.nationality && (
          <motion.div
            className="relative"
            whileHover={{ scale: 1.3, rotate: 15, z: 50 }}
            transition={{ duration: 0.3, type: "spring" }}
          >
            <div className="absolute inset-0 rounded-full blur-lg opacity-50 group-hover:opacity-100 transition-opacity"
                 style={{ background: primaryColor.medium }} />
            <div className="relative">
              <FlagImage nationality={player.nationality} size="lg" />
            </div>
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <motion.h3 
            className="text-3xl font-black mb-2 truncate leading-tight" 
            style={{ 
              color: primaryColor.textOnLight,
              textShadow: `0 4px 20px ${primaryColor.glow}60, 0 2px 8px rgba(0,0,0,0.8)`,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
          {player.name}
          </motion.h3>
          <motion.p 
            className="text-base font-bold uppercase tracking-widest mb-1" 
            style={{ 
              color: `${primaryColor.textOnLight}95`,
              letterSpacing: '0.2em',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}
          >
        {player.role}
          </motion.p>
          {player.allrounderType && (
            <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold mt-2"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor.medium}40, ${secondaryColor.medium}40)`,
                    color: primaryColor.textOnLight,
                    border: `1px solid ${primaryColor.medium}60`
                  }}>
              {player.allrounderType}
            </span>
          )}
        </div>
      </div>

      {/* Premium Badges Section */}
      <div className="flex flex-wrap gap-3 mb-5 relative z-10">
        {player.isCaptain && (
          <motion.span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg border-2"
            style={{
              background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.3), rgba(251, 191, 36, 0.3))',
              color: '#FCD34D',
              borderColor: 'rgba(250, 204, 21, 0.6)',
              boxShadow: '0 4px 20px rgba(250, 204, 21, 0.4)'
            }}
            whileHover={{ scale: 1.1, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <StarIcon className="w-4 h-4" color="#FCD34D" filled />
            <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Captain</span>
          </motion.span>
        )}
        {player.nationality !== 'India' && (
          <motion.span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg border-2"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))',
              color: '#93C5FD',
              borderColor: 'rgba(59, 130, 246, 0.6)',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
            }}
            whileHover={{ scale: 1.1, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <GlobeIcon className="w-4 h-4" color="#93C5FD" />
            <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Foreign</span>
          </motion.span>
        )}
        {isKeyPlayer && (
          <motion.span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg border-2"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3))',
              color: '#FBBF24',
              borderColor: 'rgba(245, 158, 11, 0.6)',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.5)'
            }}
            whileHover={{ scale: 1.1, y: -2 }}
            transition={{ duration: 0.2 }}
            animate={{
              boxShadow: [
                '0 4px 20px rgba(245, 158, 11, 0.5)',
                '0 8px 30px rgba(245, 158, 11, 0.7)',
                '0 4px 20px rgba(245, 158, 11, 0.5)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <StarIcon className="w-4 h-4" color="#FBBF24" filled />
            <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Key Player</span>
          </motion.span>
        )}
      </div>

      {/* Premium Role Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 relative z-10">
          {tags.slice(0, 4).map((tag: string, tagIndex) => (
            <motion.span
              key={tag}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-sm"
              style={{
                background: `linear-gradient(135deg, ${primaryColor.light}30, ${secondaryColor.light}30)`,
                borderColor: `${primaryColor.medium}50`,
                color: primaryColor.textOnLight,
                boxShadow: `0 2px 10px ${primaryColor.glow}20`
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: tagIndex * 0.1 }}
              whileHover={{ scale: 1.15, y: -2 }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
      )}

      {/* Enhanced Stats with Icons */}
      <div className="grid grid-cols-3 gap-4 pt-5 border-t-2" style={{ borderColor: `${primaryColor.medium}60` }}>
        <motion.div 
          className="text-center group/stat"
          whileHover={{ scale: 1.1, y: -3 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 blur-lg"
                 style={{ background: primaryColor.medium }} />
            <div className="relative p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group-hover/stat:border-white/30 transition-all">
              <p className="text-3xl font-black mb-1" style={{ 
                color: primaryColor.text,
                textShadow: `0 0 20px ${primaryColor.glow}40`
              }}>
                {stats.matches || 0}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: primaryColor.textOnLight }}>
            Matches
          </p>
        </div>
          </div>
        </motion.div>
        <motion.div 
          className="text-center group/stat"
          whileHover={{ scale: 1.1, y: -3 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 blur-lg"
                 style={{ background: secondaryColor.medium }} />
            <div className="relative p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group-hover/stat:border-white/30 transition-all">
              <p className="text-3xl font-black mb-1" style={{ 
                color: secondaryColor.text || primaryColor.text,
                textShadow: `0 0 20px ${secondaryColor.glow || primaryColor.glow}40`
              }}>
                {stats.runs || 0}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: primaryColor.textOnLight }}>
            Runs
          </p>
        </div>
          </div>
        </motion.div>
        <motion.div 
          className="text-center group/stat"
          whileHover={{ scale: 1.1, y: -3 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 blur-lg"
                 style={{ background: primaryColor.medium }} />
            <div className="relative p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group-hover/stat:border-white/30 transition-all">
              <p className="text-3xl font-black mb-1" style={{ 
                color: primaryColor.text,
                textShadow: `0 0 20px ${primaryColor.glow}40`
              }}>
                {stats.wickets || 0}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: primaryColor.textOnLight }}>
            Wickets
          </p>
        </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Hover Arrow with glow */}
      <motion.div 
        className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
          boxShadow: `0 0 20px ${primaryColor.glow}60`
        }}
        whileHover={{ x: 5, scale: 1.2, rotate: 15 }}
        transition={{ duration: 0.2 }}
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// Key Players Section (admin-managed)
function KeyPlayersSection({ teamData, keyPlayers, primaryColor, secondaryColor }: KeyPlayersSectionProps) {
  if (!teamData || !teamData.players || !keyPlayers) {
    return null;
  }

  const findPlayerById = (id?: string) => {
    if (!id) return null;
    return (teamData.players as Player[]).find((p) => p.id === id) || null;
  };

  const getPlayersByIds = (ids?: string[]) => {
    if (!ids || !ids.length) return [];
    return ids
      .map((id) => findPlayerById(id))
      .filter((p): p is Player => Boolean(p));
  };

  const roles: { label: string; players: Player[] }[] = [
    { label: 'Power hitter', players: getPlayersByIds(keyPlayers.powerHitterIds) },
    { label: 'Anchor', players: getPlayersByIds(keyPlayers.anchorIds) },
    { label: 'Finisher', players: getPlayersByIds(keyPlayers.finisherIds) },
    { label: 'Strike bowler', players: getPlayersByIds(keyPlayers.strikeBowlerIds) },
    { label: 'Death specialist', players: getPlayersByIds(keyPlayers.deathSpecialistIds) },
    { label: 'X-factor all-rounder', players: getPlayersByIds(keyPlayers.allRoundXFactorIds) },
  ];

  const activeRoles = roles.filter((r) => r.players.length > 0);
  if (activeRoles.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
      style={{
        background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
        borderColor: primaryColor.medium,
        boxShadow: `0 10px 30px ${primaryColor.glow}15`,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <StarIcon className="w-7 h-7" color={primaryColor.solid} filled />
          <h3 className="text-2xl font-black" style={{ color: primaryColor.textOnLight }}>
            Key Players
          </h3>
        </div>
        <p className="text-xs uppercase tracking-wide text-gray-200/80">
          Selected by admin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeRoles.map(({ label, players }) => (
          <div
            key={label}
            className="group rounded-2xl bg-black/10 border border-white/10 p-4 hover:bg-black/20 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-200/90">
                {label}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-ipl-gold/15 text-ipl-gold border border-ipl-gold/40">
                Admin pick
              </span>
            </div>

            <div className="space-y-3">
              {players.map((player) => (
                <div key={player.id} className="border-t border-white/5 pt-2 first:border-t-0 first:pt-0">
                  <p className="text-sm font-semibold text-white mb-1 truncate">{player.name}</p>
                  <p className="text-xs text-gray-300 mb-2">{player.role}</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-300">
                    <span>Runs: <span className="font-semibold text-white">{player.stats.runs}</span></span>
                    <span>Wkts: <span className="font-semibold text-white">{player.stats.wickets}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stats Tab
function StatsTab({ teamData, primaryColor, secondaryColor, batsmen, bowlers, allRounders, wicketkeepers }: StatsTabProps) {
  if (!teamData) return null;
  const squad: Player[] = (teamData.players || []) as Player[];

  const totals = squad.reduce(
    (acc, p) => {
      const s = p.stats || {};
      acc.matches += s.matches || 0;
      acc.runs += s.runs || 0;
      acc.wickets += s.wickets || 0;
      acc.fours += s.fours || 0;
      acc.sixes += s.sixes || 0;
      acc.fifties += s.fifties || 0;
      acc.hundreds += s.hundreds || 0;
      return acc;
    },
    { matches: 0, runs: 0, wickets: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0 },
  );

  const totalFiftyPlus = totals.fifties + totals.hundreds;

  const topRunScorer = squad.reduce<Player | null>((best, p) => {
    const currentRuns = p.stats?.runs || 0;
    const bestRuns = best?.stats?.runs || 0;
    return currentRuns > bestRuns ? p : best;
  }, null);

  const topWicketTaker = squad.reduce<Player | null>((best, p) => {
    const currentWkts = p.stats?.wickets || 0;
    const bestWkts = best?.stats?.wickets || 0;
    return currentWkts > bestWkts ? p : best;
  }, null);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
          style={{
            background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
            borderColor: primaryColor.medium,
            boxShadow: `0 10px 30px ${primaryColor.glow}15`,
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <CricketBatIcon className="w-8 h-8" color={primaryColor.solid} />
            <h3 className="text-2xl font-black" style={{ color: primaryColor.textOnLight }}>
              Squad Composition
            </h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Batsmen', value: batsmen.length, Icon: BatsmanIcon },
              { label: 'Bowlers', value: bowlers.length, Icon: BowlerIcon },
              { label: 'All-rounders', value: allRounders.length, Icon: AllRounderIcon },
              { label: 'Wicket-keepers', value: wicketkeepers.length, Icon: WicketKeeperIcon },
            ].map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                <span
                  className="font-semibold flex items-center gap-3"
                  style={{ color: primaryColor.textOnLight }}
                >
                  <item.Icon className="w-5 h-5" color={primaryColor.solid} />
                  {item.label}
                </span>
                <span className="text-4xl font-black" style={{ color: primaryColor.text }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
          style={{
            background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
            borderColor: primaryColor.medium,
            animationDelay: '100ms',
            boxShadow: `0 10px 30px ${primaryColor.glow}15`,
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <GlobeIcon className="w-8 h-8" color={primaryColor.solid} />
            <h3 className="text-2xl font-black" style={{ color: primaryColor.textOnLight }}>
              Player Origin
            </h3>
          </div>
          <div className="space-y-4">
            {[
              {
                label: 'Indian Players',
                value:
                  teamData.players?.filter((p: Player) => p.nationality === 'India').length || 0,
              },
              {
                label: 'Foreign Players',
                value:
                  teamData.players?.filter((p: Player) => p.nationality !== 'India').length || 0,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                <span className="font-semibold" style={{ color: primaryColor.textOnLight }}>
                  {item.label}
                </span>
                <span className="text-4xl font-black" style={{ color: primaryColor.text }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {squad.length > 0 && (
        <div
          className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
          style={{
            background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
            borderColor: primaryColor.medium,
            animationDelay: '200ms',
            boxShadow: `0 10px 30px ${primaryColor.glow}20`,
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CricketBatIcon className="w-7 h-7" color={primaryColor.solid} />
              <h3 className="text-2xl font-black" style={{ color: primaryColor.textOnLight }}>
                Team Stats (from player careers)
              </h3>
            </div>
            <p className="text-[11px] uppercase tracking-wide text-gray-100/80">
              Aggregated from squad player stats
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-xs uppercase text-gray-300 mb-1">Total Runs</p>
              <p className="text-2xl font-black text-white">{totals.runs}</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-xs uppercase text-gray-300 mb-1">Total Wickets</p>
              <p className="text-2xl font-black text-white">{totals.wickets}</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-xs uppercase text-gray-300 mb-1">50+ Scores</p>
              <p className="text-2xl font-black text-white">{totalFiftyPlus}</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-xs uppercase text-gray-300 mb-1">Total Fours</p>
              <p className="text-2xl font-black text-white">{totals.fours}</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-xs uppercase text-gray-300 mb-1">Total Sixes</p>
              <p className="text-2xl font-black text-white">{totals.sixes}</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-xs uppercase text-gray-300 mb-1">Player Matches (sum)</p>
              <p className="text-2xl font-black text-white">{totals.matches}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {topRunScorer && (
              <div className="p-4 rounded-xl bg-black/25 border border-white/10 flex flex-col gap-1">
                <p className="text-xs uppercase text-gray-300">Top run-scorer in squad</p>
                <p className="text-base font-semibold text-white">{topRunScorer.name}</p>
                <p className="text-xs text-gray-300">
                  Runs: <span className="font-semibold text-white">{topRunScorer.stats.runs}</span> ·
                  Matches: <span className="font-semibold text-white">{topRunScorer.stats.matches}</span>
                </p>
              </div>
            )}
            {topWicketTaker && (
              <div className="p-4 rounded-xl bg-black/25 border border-white/10 flex flex-col gap-1">
                <p className="text-xs uppercase text-gray-300">Top wicket-taker in squad</p>
                <p className="text-base font-semibold text-white">{topWicketTaker.name}</p>
                <p className="text-xs text-gray-300">
                  Wickets: <span className="font-semibold text-white">{topWicketTaker.stats.wickets}</span> ·
                  Matches: <span className="font-semibold text-white">{topWicketTaker.stats.matches}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// About Tab
function AboutTab({ teamData, primaryColor, secondaryColor, coachingStaff }: AboutTabProps) {
  if (!teamData) return null;
  const hasCoachingStaff = coachingStaff && (
    coachingStaff.headCoach ||
    coachingStaff.mentor ||
    coachingStaff.battingCoach ||
    coachingStaff.bowlingCoach ||
    coachingStaff.fieldingCoach ||
    coachingStaff.physiotherapist ||
    coachingStaff.teamManager
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="rounded-3xl backdrop-blur-xl p-12 border shadow-xl animate-fade-in"
           style={{
             background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
             borderColor: primaryColor.medium,
             boxShadow: `0 10px 30px ${primaryColor.glow}15`
           }}>
        <div className="flex items-center gap-3 mb-8">
          <TrophyIcon className="w-10 h-10" color={primaryColor.solid} />
          <h3 className="text-4xl font-black" style={{ color: primaryColor.textOnLight }}>About {teamData.name}</h3>
        </div>
        
        <div className="mb-8">
          {/* Smart description component: handles wrapping, read more, and AI suggestions */}
          <SmartDescription text={teamData.description} teamName={teamData.name} primaryColor={primaryColor} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h4 className="text-2xl font-black mb-6" style={{ color: primaryColor.textOnLight }}>Team Colors</h4>
            <div className="flex gap-6">
              {[
                { label: 'Primary', color: primaryColor.solid },
                { label: 'Secondary', color: secondaryColor.solid }
              ].map((item, i) => (
                <div key={i}>
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"
                         style={{ backgroundColor: item.color }} />
                    <div className="relative w-24 h-24 rounded-2xl shadow-2xl border-2 border-white/20 group-hover:scale-110 transition-transform duration-300" 
                         style={{ backgroundColor: item.color }} />
                  </div>
                  <p className="text-sm mt-3 font-semibold uppercase tracking-wider" style={{ color: primaryColor.textOnLight }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-2xl font-black mb-6" style={{ color: primaryColor.textOnLight }}>Quick Facts</h4>
            <ul className="space-y-3 text-lg" style={{ color: primaryColor.textOnLight }}>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor.solid }} />
                Short Name: <span className="font-bold">{teamData.shortName}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor.solid }} />
                Squad Size: <span className="font-bold">{teamData.players?.length || 0} Players</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor.solid }} />
                Foreign Players: <span className="font-bold">{teamData.players?.filter((p: Player) => p.nationality !== 'India').length || 0}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Coaching Staff Information (only show filled roles) */}
      {hasCoachingStaff && (
        <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
             style={{
               background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
               borderColor: primaryColor.medium,
               boxShadow: `0 10px 30px ${primaryColor.glow}15`
             }}>
          <div className="flex items-center gap-3 mb-6">
           <CustomEmoji type="target" size={32} />
           <h4 className="text-2xl font-black" style={{ color: primaryColor.textOnLight }}>Coaching Staff</h4>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ color: primaryColor.textOnLight }}>
            {coachingStaff.headCoach && (
              <div>
                <dt className="font-semibold text-xs uppercase tracking-wide opacity-80">Head Coach</dt>
                <dd className="text-base">{coachingStaff.headCoach}</dd>
              </div>
            )}
            {coachingStaff.mentor && (
              <div>
                <dt className="font-semibold text-xs uppercase tracking-wide opacity-80">Mentor</dt>
                <dd className="text-base">{coachingStaff.mentor}</dd>
              </div>
            )}
            {coachingStaff.battingCoach && (
              <div>
                <dt className="font-semibold text-xs uppercase tracking-wide opacity-80">Batting Coach</dt>
                <dd className="text-base">{coachingStaff.battingCoach}</dd>
              </div>
            )}
            {coachingStaff.bowlingCoach && (
              <div>
                <dt className="font-semibold text-xs uppercase tracking-wide opacity-80">Bowling Coach</dt>
                <dd className="text-base">{coachingStaff.bowlingCoach}</dd>
              </div>
            )}
            {coachingStaff.fieldingCoach && (
              <div>
                <dt className="font-semibold text-xs uppercase tracking-wide opacity-80">Fielding Coach</dt>
                <dd className="text-base">{coachingStaff.fieldingCoach}</dd>
              </div>
            )}
            {coachingStaff.physiotherapist && (
              <div>
                <dt className="font-semibold text-xs uppercase tracking-wide opacity-80">Physiotherapist</dt>
                <dd className="text-base">{coachingStaff.physiotherapist}</dd>
              </div>
            )}
            {coachingStaff.teamManager && (
              <div>
                <dt className="font-semibold text-xs uppercase tracking-wide opacity-80">Team Manager</dt>
                <dd className="text-base">{coachingStaff.teamManager}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Trophy Information */}
      {teamData.trophies && teamData.trophies.length > 0 && (
        <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
             style={{
               background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
               borderColor: primaryColor.medium,
               boxShadow: `0 10px 30px ${primaryColor.glow}15`
             }}>
          <div className="flex items-center gap-3 mb-8">
           <CustomEmoji type="trophy" size={40} />
           <h4 className="text-2xl font-black" style={{ color: primaryColor.textOnLight }}>Trophy Cabinet</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamData.trophies.map((trophy, idx: number) => (
              <div key={idx} className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20">
                <div className="flex items-center gap-4">
                  <CustomEmoji type="medal-gold" size={48} />
                  <div className="flex-1">
                    <p className="text-3xl font-black" style={{ color: primaryColor.text }}>{trophy.year}</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: primaryColor.textOnLight }}>{trophy.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Home Grounds Information */}
      {teamData.homeGrounds && teamData.homeGrounds.length > 0 && (
        <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
             style={{
               background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
               borderColor: primaryColor.medium,
               boxShadow: `0 10px 30px ${primaryColor.glow}15`
             }}>
          <div className="flex items-center gap-3 mb-8">
            <CustomEmoji type="venue" size={48} animate={true} />
            <h4 className="text-2xl font-black" style={{ color: primaryColor.textOnLight }}>Home Grounds</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamData.homeGrounds.map((ground: string, idx: number) => (
              <div key={idx} className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20 hover:scale-105 transform">
                <p className="font-bold text-lg" style={{ color: primaryColor.textOnLight }}>{ground}</p>
                <p className="text-xs mt-2" style={{ color: primaryColor.textOnLight }}>Official Home Ground</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
