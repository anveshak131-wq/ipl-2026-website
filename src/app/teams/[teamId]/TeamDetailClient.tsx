'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import SmartDescription from '@/components/teams/SmartDescription';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PlayerModal from '@/components/teams/PlayerModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuroraBackground from '@/components/ui/AuroraBackground';
import IPLLogo from '@/components/ui/IPLLogo';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import CustomEmoji from '@/components/emoji/CustomEmoji';
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
import { Team, Player, CoachingStaff, KeyPlayers } from '@/types';
import { sortPlayersByRoleAndAge } from '@/lib/playerSort';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { getOptimalTextColor } from '@/lib/colorUtils';

interface TeamDetailClientProps {
  teamId: string;
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

export default function TeamDetailClient({ teamId }: TeamDetailClientProps) {
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
  const [lastMatch, setLastMatch] = useState<any | null>(null);
  const [nextMatch, setNextMatch] = useState<any | null>(null);
  const [coachingStaff, setCoachingStaff] = useState<CoachingStaff | null>(null);
  const [keyPlayers, setKeyPlayers] = useState<KeyPlayers | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const numericId = teamId.replace('team', '');
        
        const teamsResponse = await fetch('/api/teams');
        if (teamsResponse.ok) {
          const allTeams = await teamsResponse.json();
          const team = allTeams.find((t: Team) => t.id === numericId || t.id === teamId);
          
          if (team) {
            const playersResponse = await fetch('/api/players');
            if (playersResponse.ok) {
              const allPlayers = await playersResponse.json();
              const teamWithPlayers = {
                ...team,
                players: sortPlayersByRoleAndAge(allPlayers.filter((p: Player) => p.teamId === team.id))
              };
              setTeamData(teamWithPlayers);
            } else {
              setTeamData(team);
            }
            
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
                const raw: any = await keyPlayersResponse.json();
                if (raw) {
                  const normalized: KeyPlayers = {
                    teamId: raw.teamId || team.id,
                    powerHitterIds: raw.powerHitterIds || (raw.powerHitterId ? [raw.powerHitterId] : []),
                    anchorIds: raw.anchorIds || (raw.anchorId ? [raw.anchorId] : []),
                    finisherIds: raw.finisherIds || (raw.finisherId ? [raw.finisherId] : []),
                    strikeBowlerIds: raw.strikeBowlerIds || (raw.strikeBowlerId ? [raw.strikeBowlerId] : []),
                    deathSpecialistIds: raw.deathSpecialistIds || (raw.deathSpecialistId ? [raw.deathSpecialistId] : []),
                    allRoundXFactorIds: raw.allRoundXFactorIds || (raw.allRoundXFactorId ? [raw.allRoundXFactorId] : []),
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
  }, [teamId]);

  // Fetch matches and compute season snapshot once team data is available
  useEffect(() => {
    if (!teamData) return;

    const loadMatches = async () => {
      try {
        const res = await fetch('/api/matches');
        if (!res.ok) return;

        const matches = await res.json();
        const teamMatches = matches.filter((m: any) => m.team1?.id === teamData.id || m.team2?.id === teamData.id);

        const completed = teamMatches.filter((m: any) => m.status === 'completed');
        const upcoming = teamMatches.filter((m: any) => m.status === 'upcoming');

        let wins = 0;
        let losses = 0;
        let noResult = 0;

        completed.forEach((m: any) => {
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
  }, [teamData]);

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
            onClick={() => router.push('/teams')}
            className="px-6 py-2 bg-gradient-to-r from-ipl-blue-dark to-ipl-purple hover:from-ipl-purple hover:to-ipl-gold text-white rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Back to Teams
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const primaryColor = createColorVariations(teamData.colors.primary);
  const secondaryColor = createColorVariations(teamData.colors.secondary);
  const numericId = teamId.replace('team', '');
  const teamLogoPath = getAnimatedLogoPath(teamData.id);
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
        {/* Hero Section */}
        <motion.div 
          className="relative min-h-screen flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-800 to-gray-900" />
            
            {/* Team color gradient orbs with parallax */}
            <motion.div 
              className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-30"
              style={{
                background: `radial-gradient(circle, ${primaryColor.medium}, transparent)`,
                top: '-10%',
                right: '-5%',
              }}
              animate={{
                y: [0, -30, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-25"
              style={{
                background: `radial-gradient(circle, ${secondaryColor.medium}, transparent)`,
                bottom: '-10%',
                left: '-10%',
              }}
              animate={{
                y: [0, 30, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
            
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `radial-gradient(circle, ${primaryColor.solid} 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
            {/* Back Button */}
            <AnimatedSection direction="left" delay={0.2}>
              <motion.button 
                onClick={() => router.push('/teams')}
                className="mb-12 flex items-center gap-3 text-gray-400 hover:text-white transition-all duration-300 group"
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:border-white/30 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <span className="font-semibold">Back to Teams</span>
              </motion.button>
            </AnimatedSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left: Team Info */}
              <AnimatedSection direction="right" delay={0.3} className="space-y-8">
                {/* Team Badge with IPL Logo - Fixed spacing */}
                <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full backdrop-blur-xl border shadow-xl transition-all duration-300 hover:scale-105"
                     style={{
                       background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                       borderColor: primaryColor.medium
                     }}>
                  <span className="text-sm font-bold tracking-wider whitespace-nowrap" style={{ color: primaryColor.textOnLight }}>{teamData.shortName}</span>
                </div>

                {/* Team Name */}
                <div>
                  <motion.h1 
                    className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-none tracking-tighter"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid}, ${primaryColor.solid})`,
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textShadow: `0 0 60px ${primaryColor.glow}, 0 4px 20px rgba(0,0,0,0.5)`,
                      animation: 'gradient-shift 3s ease infinite'
                    }}
                  >
                    {teamData.name}
                  </motion.h1>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 w-24 rounded-full shadow-lg transition-all duration-500"
                         style={{
                           background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})`,
                           boxShadow: `0 0 20px ${primaryColor.glow}`
                         }} />
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor.solid }} />
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: secondaryColor.solid }} />
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-xl leading-relaxed max-w-xl text-white">
                  {teamData.description}
                </p>
                
                {/* Color Swatches */}
                <div className="flex gap-6">
                  <div className="group text-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl blur-lg opacity-50 transition-opacity duration-300 group-hover:opacity-75"
                           style={{ backgroundColor: primaryColor.solid }} />
                      <div 
                        className="relative w-16 h-16 rounded-2xl shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border-2 border-white/20"
                        style={{ backgroundColor: primaryColor.solid }}
                      />
                    </div>
                    <p className="text-gray-400 text-xs font-semibold mt-3 uppercase tracking-wider">Primary</p>
                  </div>
                  <div className="group text-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl blur-lg opacity-50 transition-opacity duration-300 group-hover:opacity-75"
                           style={{ backgroundColor: secondaryColor.solid }} />
                      <div 
                        className="relative w-16 h-16 rounded-2xl shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border-2 border-white/20"
                        style={{ backgroundColor: secondaryColor.solid }}
                      />
                    </div>
                    <p className="text-gray-400 text-xs font-semibold mt-3 uppercase tracking-wider">Secondary</p>
                  </div>
                </div>
              </AnimatedSection>

              {/* Right: Team Logo from /logos folder */}
              <AnimatedSection direction="left" delay={0.5} className="relative flex items-center justify-center">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse"
                     style={{ 
                       background: `radial-gradient(circle, ${primaryColor.medium}, ${secondaryColor.medium})`,
                       animationDuration: '3s'
                     }} />
                
                {/* Rotating ring */}
                <div className="absolute inset-0 animate-spin-slow">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke={primaryColor.light} strokeWidth="0.5" strokeDasharray="5,5" />
                  </svg>
                </div>

                {/* Logo Container with enhanced animations */}
                <div className="relative group">
                  <div className="absolute -inset-4 rounded-full opacity-50 group-hover:opacity-75 blur-2xl transition-all duration-500 animate-pulse"
                       style={{
                         background: `conic-gradient(from 0deg, ${primaryColor.solid}, ${secondaryColor.solid}, ${primaryColor.solid})`
                       }} />
                  
                  <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full flex items-center justify-center backdrop-blur-xl border-2 shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 animate-glow-pulse overflow-visible"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 0 40px ${primaryColor.glow}, 0 0 80px ${secondaryColor.glow}40`
                       }}>
                    {/* Rotating gradient ring */}
                    <div className="absolute inset-0 rounded-full opacity-30 animate-spin-slow"
                         style={{
                           background: `conic-gradient(from 0deg, transparent, ${primaryColor.solid}40, transparent)`
                         }} />
                    
                    {/* Actual Team Logo from /logos - Animated or Lottie */}
                    {teamLogoPath.endsWith('.json') ? (
                      <div className="w-3/4 h-3/4 relative z-10">
                        <RCBLottie className="w-full h-full" />
                      </div>
                    ) : teamLogoPath.endsWith('rcb_logo_premium.svg') ? (
                      <div className="w-5/6 h-5/6 relative z-10 flex items-center justify-center">
                        <RCBLionLogo className="w-full h-full" />
                      </div>
                    ) : (
                      <img 
                        src={teamLogoPath}
                        alt={`${teamData.shortName} logo`}
                        className="w-3/4 h-3/4 object-contain drop-shadow-2xl animate-float relative z-10 transform group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackLogoPath;
                        }}
                      />
                    )}
                    
                    {/* IPL Logo Badge with enhanced animation - Positioned to avoid overlap with team logo */}
                    <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-12 h-12 md:w-14 md:h-14 rounded-full backdrop-blur-xl border-2 border-white/30 flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 bg-gradient-to-br from-blue-900/80 to-purple-900/80 z-20">
                      <div className="w-7 h-7 md:w-8 md:h-8">
                        <IPLLogo animated />
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </motion.div>

        {/* Stats Section with Custom Icons */}
        <AnimatedSection direction="up" delay={0.2} className="relative z-20 -mt-20 mb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Squad Size', value: teamData.players?.length || 0, Icon: UsersIcon },
                { label: 'Captains', value: teamData.players?.filter(p => p.isCaptain).length || 0, Icon: StarIcon },
                { label: 'Foreign', value: teamData.players?.filter(p => p.nationality !== 'India').length || 0, Icon: GlobeIcon },
                { label: 'All-rounders', value: teamData.players?.filter(p => p.role === 'All-rounder').length || 0, Icon: AllRounderIcon }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group relative overflow-hidden rounded-3xl backdrop-blur-xl p-8 border shadow-xl transition-all duration-500 hover:shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                    borderColor: primaryColor.medium,
                    boxShadow: `0 10px 30px ${primaryColor.glow}20`
                  }}
                >
                  {/* IPL Logo Watermark */}
                  <div className="absolute top-3 right-3 w-8 h-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <IPLLogo animated />
                  </div>
                  
                  <motion.div 
                    className="mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                  >
                    <stat.Icon className="w-12 h-12" color={primaryColor.solid} />
                  </motion.div>
                  <p className="text-5xl font-black mb-2 transform group-hover:scale-110 transition-transform duration-300" style={{ color: primaryColor.text }}>
                    <AnimatedCounter value={stat.value} />
                  </p>
                  <p className="text-sm font-semibold uppercase tracking-wider transition-colors duration-300" style={{ color: primaryColor.textOnLight }}>{stat.label}</p>
                  
                  {/* Hover shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  </div>
                </motion.div>
              ))}
            </div>

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

        {/* Tab Navigation - Fixed overlap with proper spacing */}
        <AnimatedSection direction="up" delay={0.3} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 mt-12">
          <div className="flex flex-col items-center gap-4">
            {/* IPL Logo Badge - Moved outside and above the tab container */}
            <motion.div 
              className="w-12 h-12 rounded-full backdrop-blur-xl border-2 border-white/30 flex items-center justify-center shadow-xl z-10" 
              style={{
                background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                borderColor: primaryColor.medium,
              }}
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-7 h-7">
                <IPLLogo animated />
              </div>
            </motion.div>
            
            {/* Tab Container - Premium Design with Team Colors */}
            <motion.div 
              className="relative inline-flex gap-2 p-1.5 rounded-2xl backdrop-blur-xl border-2 shadow-xl"
                 style={{
                   background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                   borderColor: primaryColor.medium,
                   boxShadow: `0 10px 30px ${primaryColor.glow}20`
                 }}>
              {[
                { id: 'squad', label: 'Squad' },
                { id: 'stats', label: 'Stats' },
                { id: 'about', label: 'About' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative overflow-hidden px-8 py-4 rounded-xl font-bold text-lg transition-all duration-500 whitespace-nowrap transform ${
                    activeTab === tab.id ? 'scale-105' : 'hover:scale-105'
                  }`}
                  style={activeTab === tab.id ? {
                    background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                    color: '#FFFFFF',
                    boxShadow: `0 10px 30px ${primaryColor.glow}40, 0 0 40px ${secondaryColor.glow}20`,
                    border: `2px solid ${primaryColor.medium}`,
                  } : {
                    background: 'transparent',
                    color: primaryColor.textOnLight,
                    border: '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = primaryColor.textOnLight;
                      e.currentTarget.style.background = `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`;
                      e.currentTarget.style.borderColor = `${primaryColor.medium}60`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = primaryColor.textOnLight;
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  {/* Shimmer effect for active tab */}
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  )}
                  
                  <span className="relative z-10">{tab.label}</span>
                  
                  {/* Glow effect for active tab */}
                  {activeTab === tab.id && (
                    <div 
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg -z-10"
                      style={{
                        background: `radial-gradient(circle, ${primaryColor.medium}, transparent)`,
                      }}
                    />
                  )}
                </button>
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
              {/* Squad Filters */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Filter squad</span>
                  <div className="w-12 h-px bg-white/10" />
                </div>

                <div className="flex flex-wrap gap-4">
                  {/* Nationality filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Nationality</span>
                    <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'indian', label: 'Indian' },
                        { id: 'overseas', label: 'Overseas' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setNationalityFilter(option.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            nationalityFilter === option.id
                              ? 'bg-white text-slate-900 shadow-md'
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Batting style filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Batting</span>
                    <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
                      {[
                        { id: 'any', label: 'Any' },
                        { id: 'right', label: 'Right-hand' },
                        { id: 'left', label: 'Left-hand' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setBattingStyleFilter(option.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            battingStyleFilter === option.id
                              ? 'bg-white text-slate-900 shadow-md'
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desired order: Batters, Wicket-keepers, All-rounders, Bowlers */}
              {[
                { title: 'Batters', players: batsmen, Icon: BatsmanIcon },
                { title: 'Wicket-keepers', players: wicketkeepers, Icon: WicketKeeperIcon },
                { title: 'All-rounders', players: allRounders, Icon: AllRounderIcon },
                { title: 'Bowlers', players: bowlers, Icon: BowlerIcon }
              ].map((section, sectionIndex) => (
                section.players.length > 0 && (
                  <AnimatedSection key={sectionIndex} direction="up" delay={sectionIndex * 0.1}>
                    <motion.h3 
                      className="text-3xl font-black mb-8 flex items-center gap-4" 
                      style={{ color: primaryColor.text }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <section.Icon className="w-10 h-10" color={primaryColor.solid} />
                      </motion.div>
                      {section.title}
                      <span className="text-lg font-normal" style={{ color: primaryColor.textOnLight }}>({section.players.length})</span>
                    </motion.h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {section.players.map((player, playerIndex) => (
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
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AboutTab teamData={teamData} primaryColor={primaryColor} secondaryColor={secondaryColor} coachingStaff={coachingStaff} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />

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
    </div>
  );
}

// Player Card Component with enhanced animations and role tags
function PlayerCard({ player, primaryColor, secondaryColor, onClick, index, keyPlayers }: any) {
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ scale: 1.05, y: -8 }}
      className="group relative overflow-hidden rounded-2xl backdrop-blur-xl p-6 border cursor-pointer transition-all duration-500 shadow-xl hover:shadow-2xl"
      style={{
        background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
        borderColor: isKeyPlayer ? '#facc15' : primaryColor.medium,
        boxShadow: isKeyPlayer
          ? `0 0 25px rgba(250, 204, 21, 0.6), 0 10px 30px ${primaryColor.glow}20`
          : `0 10px 25px ${primaryColor.glow}20`,
      }}
    >
      {/* Jersey Number with enhanced animation */}
      <div
        className="absolute top-4 right-4 w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 z-10 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
          boxShadow: `0 5px 15px ${primaryColor.glow}`,
        }}
      >
        {player.jerseyNumber > 0 ? player.jerseyNumber : 'N/A'}
      </div>

      {/* Hover shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

      {/* Player Name */}
      <h3 className="text-xl font-bold mb-2 pr-16" style={{ color: primaryColor.textOnLight }}>
        {player.name}
      </h3>
      <p className="text-sm font-semibold mb-4" style={{ color: primaryColor.textOnLight }}>
        {player.role}
      </p>

      {/* Badges with Custom Icons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {player.isCaptain && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <StarIcon className="w-3 h-3" color="#FCD34D" filled />
            Captain
          </span>
        )}
        {player.nationality !== 'India' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <GlobeIcon className="w-3 h-3" color="#93C5FD" />
            Foreign
          </span>
        )}
        {isKeyPlayer && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/40">
            <StarIcon className="w-3 h-3" color="#FBBF24" filled />
            Key Player
          </span>
        )}
      </div>

      {/* Derived role tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 4).map((tag: string) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/20 border border-white/10 text-gray-100"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: primaryColor.medium }}>
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: primaryColor.text }}>
            {stats.matches}
          </p>
          <p className="text-xs uppercase" style={{ color: primaryColor.textOnLight }}>
            Matches
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: primaryColor.text }}>
            {stats.runs}
          </p>
          <p className="text-xs uppercase" style={{ color: primaryColor.textOnLight }}>
            Runs
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: primaryColor.text }}>
            {stats.wickets}
          </p>
          <p className="text-xs uppercase" style={{ color: primaryColor.textOnLight }}>
            Wickets
          </p>
        </div>
      </div>

      {/* Hover Arrow */}
      <motion.div 
        className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
        whileHover={{ x: 5, scale: 1.1 }}
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// Key Players Section (admin-managed)
function KeyPlayersSection({ teamData, keyPlayers, primaryColor, secondaryColor }: any) {
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
function StatsTab({ teamData, primaryColor, secondaryColor, batsmen, bowlers, allRounders, wicketkeepers }: any) {
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
function AboutTab({ teamData, primaryColor, secondaryColor, coachingStaff }: any) {
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
            {teamData.trophies.map((trophy: any, idx: number) => (
              <div key={idx} className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🥇</div>
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
