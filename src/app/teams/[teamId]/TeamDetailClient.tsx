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
import TeamPlayersTab from '@/components/teams/TeamPlayersTab';
import Image from 'next/image';
import { Team, Player, CoachingStaff, KeyPlayers, Match, Trophy } from '@/types';
import { PlayerCardProps, KeyPlayersSectionProps, StatsTabProps, AboutTabProps } from '@/types/components';
import { sortPlayersByRoleAndAge } from '@/lib/playerSort';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { getOptimalTextColor } from '@/lib/colorUtils';
import FlagImage from '@/components/ui/FlagImage';
import { usePlayerUpdates } from '@/hooks/usePlayerUpdates';
import ParticleBackground from '@/components/ui/ParticleBackground';
import FormGuide from '@/components/teams/FormGuide';
import QuickActionsBar from '@/components/teams/QuickActionsBar';
import TrophyCounter from '@/components/teams/TrophyCounter';
import QualifiedBadge from '@/components/ui/QualifiedBadge';
import { getMatchResult } from '@/lib/matchUtils';

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
  const [activeTab, setActiveTab] = useState<'squad' | 'players' | 'stats' | 'about'>('squad');
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
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [coachingStaff, setCoachingStaff] = useState<CoachingStaff | null>(null);
  const [keyPlayers, setKeyPlayers] = useState<KeyPlayers | null>(null);
  const [showPlayerComparison, setShowPlayerComparison] = useState(false);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [scorecard, setScorecard] = useState<any>(null);
  const [loadingScorecard, setLoadingScorecard] = useState(false);
  const [showPlayerCards, setShowPlayerCards] = useState(false);

  const fetchPlayerStats = async () => {
    if (!teamData || !league) return;
    
    console.log('Starting fetchPlayerStats for league:', league);
    
    try {
      // Fetch both batting and bowling stats
      const [battingResponse, bowlingResponse] = await Promise.all([
        fetch(`/api/stats?league=${league}&type=batting`),
        fetch(`/api/stats?league=${league}&type=bowling`)
      ]);
      
      if (battingResponse.ok && bowlingResponse.ok) {
        const battingData = await battingResponse.json();
        const bowlingData = await bowlingResponse.json();
        
        const battingStats = battingData.battingStats || [];
        const bowlingStats = bowlingData.bowlingStats || [];
        
        console.log('Fetched batting stats:', battingStats.length);
        console.log('Fetched bowling stats:', bowlingStats.length);
        
        // Merge batting and bowling stats by playerId
        const mergedStats = battingStats.map(battingStat => {
          const bowlingStat = bowlingStats.find(b => b.playerId === battingStat.playerId);
          return {
            ...battingStat,
            wickets: bowlingStat?.wickets || 0,
            bowlingAverage: bowlingStat?.average || 0,
            economy: bowlingStat?.economy || 0,
            bestBowling: bowlingStat?.bestBowling || '0/0'
          };
        });
        
        setPlayerStats(mergedStats);
        console.log('Merged player stats:', mergedStats.length, 'players');
        console.log('Sample merged stat:', mergedStats[0]);
      } else {
        console.error('Failed to fetch stats:', battingResponse.status, bowlingResponse.status);
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };

  // Function to get real player stats from scorecards
  const getPlayerRealStats = (player: any) => {
    const playerStat = playerStats.find(stat => 
      stat.playerId === player.id || 
      stat.playerId === String(player.id) ||
      stat.playerName === player.name
    );
    
    // Debug logging for first few players
    if (player.name === 'Gautami Naik' || player.name === 'Smriti Mandhana') {
      console.log('Debug - Player:', player.name, 'ID:', player.id);
      console.log('Debug - Available stats:', playerStats.slice(0, 3).map(s => ({ id: s.playerId, name: s.playerName })));
      console.log('Debug - Found stat:', playerStat ? 'YES' : 'NO');
    }
    
    if (playerStat) {
      return {
        ...player,
        stats: {
          matches: playerStat.matches || 0,
          runs: playerStat.runs || 0,
          wickets: playerStat.wickets || 0,
          average: playerStat.average || 0,
          strikeRate: playerStat.strikeRate || 0,
          highestScore: playerStat.highestScore || 0,
          fifties: playerStat.fifties || 0,
          hundreds: playerStat.hundreds || 0,
          fours: playerStat.fours || 0,
          sixes: playerStat.sixes || 0,
          bowlingAverage: playerStat.bowlingAverage || 0,
          economy: playerStat.economy || 0,
          bestBowling: playerStat.bestBowling || '0/0'
        }
      };
    }
    
    // Fallback to original stats if no real stats found
    return player;
  };

  const fetchScorecard = async (matchId: string) => {
    setLoadingScorecard(true);
    try {
      const query = new URLSearchParams({ matchId });
      if (league) {
        query.set('league', league);
      }
      const response = await fetch(`/api/scorecards?${query.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const scorecards = Array.isArray(data) ? data : [];
        // Find published scorecard only (draft = false)
        const published = scorecards.find((s: any) => s.draft === false);
        setScorecard(published || null);
        setShowScorecardModal(true);
      }
    } catch (error) {
      console.error('Error fetching scorecard:', error);
    } finally {
      setLoadingScorecard(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchTeamData = async () => {
      setIsLoading(true);

      try {
        console.log('TeamDetailClient: Starting fetch for teamId:', teamId, 'league:', league);
        
        // Handle different route formats: shortName (RCB, MI), numeric (1, 2), or team prefix (team1, team2)
        const numericId = teamId.replace('team', '');
        const shortNameUpper = teamId.toUpperCase();
        const shortNameLower = teamId.toLowerCase();
        
        // Fetch teams with league filter if provided
        const teamsUrl = league ? `/api/teams?league=${league}` : '/api/teams';
        console.log('TeamDetailClient: Fetching from URL:', teamsUrl);
        
        const teamsResponse = await fetch(teamsUrl);
        if (!teamsResponse.ok) {
          console.error('TeamDetailClient: Teams API response not OK:', teamsResponse.status, teamsResponse.statusText);
          setTeamData(null);
          return;
        }
        
        const allTeams = await teamsResponse.json();
        console.log('TeamDetailClient: Looking for teamId:', teamId, 'shortNameLower:', shortNameLower, 'shortNameUpper:', shortNameUpper, 'league:', league);
        console.log('TeamDetailClient: Available teams:', allTeams.map(t => ({ id: t.id, name: t.name, shortName: t.shortName, league: t.league })));
        
        // First, filter teams by league if specified
        const filteredTeams = league ? allTeams.filter((t: Team) => t.league === league) : allTeams;
        console.log('TeamDetailClient: Filtered teams by league:', filteredTeams.length);
        
        // Try to find team by shortName first (RCB, MI, etc.), then by ID
        let team = filteredTeams.find((t: Team) => {
          if (!t.shortName) return false;
          const tShortNameLower = t.shortName.toLowerCase();
          
          // Exact match - this should work for RCB-W
          if (tShortNameLower === shortNameLower || t.shortName.toUpperCase() === shortNameUpper) {
            console.log('TeamDetailClient: Exact match found:', t.name, 'shortName:', t.shortName, 'league:', t.league);
            return true;
          }
          // Partial match for WPL teams (e.g., "rcb" matches "rcb-w")
          if (tShortNameLower.includes(shortNameLower) || shortNameLower.includes(tShortNameLower.replace('-w', ''))) {
            console.log('TeamDetailClient: Partial match found:', t.name, 'shortName:', t.shortName, 'league:', t.league);
            return true;
          }
          // Match without -W suffix (e.g., "rcb" matches "rcb-w")
          if (tShortNameLower.replace('-w', '') === shortNameLower || shortNameLower === tShortNameLower.replace('-w', '')) {
            console.log('TeamDetailClient: Suffix match found:', t.name, 'shortName:', t.shortName, 'league:', t.league);
            return true;
          }
          return false;
        });
        
        // Fallback to ID matching if shortName not found (for backward compatibility)
        if (!team) {
          console.log('TeamDetailClient: No shortName match, trying ID matching with numericId:', numericId, 'teamId:', teamId);
          team = filteredTeams.find((t: Team) => t.id === numericId || t.id === teamId);
          if (team) {
            console.log('TeamDetailClient: ID match found:', team.name, 'id:', team.id, 'league:', team.league);
          }
        }
        
        console.log('TeamDetailClient: Final team result:', team ? team.name : 'null');
        
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
              normalizedTeamId: normalizeId(p.teamId)
            })));
            
            const normalizeId = (id: any) => {
              if (!id) return '';
              const idStr = String(id);
              // Remove 'team' prefix if present
              return idStr.replace(/^team/i, '');
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
            
            console.log('TeamDetailClient: Matched players count:', teamPlayers.length);
            
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
            
          } else {
            console.log('TeamDetailClient: No players found, using empty array');
            const teamWithPlayers = {
              ...team,
              players: []
            };
            setTeamData(teamWithPlayers);
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
              const raw = await keyPlayersResponse.json();
              if (raw && raw.keyPlayers) {
                const normalized = {
                  captain: raw.keyPlayers.captain || '',
                  viceCaptain: raw.keyPlayers.viceCaptain || '',
                  wicketKeeper: raw.keyPlayers.wicketKeeper || '',
                  batters: raw.keyPlayers.batters || [],
                  allRounders: raw.keyPlayers.allRounders || [],
                  bowlers: raw.keyPlayers.bowlers || [],
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
          console.log('TeamDetailClient: No team found, setting teamData to null');
          setTeamData(null);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        setTeamData(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchTeamData();

    return () => {
      cancelled = true;
    };
  }, [teamId, league]);

  // Real-time player updates - refresh team data when players are updated
  usePlayerUpdates(async (playerId: string) => {
    if (!teamData) return;
    
    try {
      const teamLeague = league || (teamData.league as 'ipl' | 'wpl') || 'ipl';
      const allPlayers = await api.getPlayers(undefined, teamLeague);
      
      // Normalize IDs for matching
      const normalizeId = (id: string | number | undefined): string => {
        if (!id) return '';
        const str = String(id).trim();
        const numMatch = str.replace(/^team/i, '').match(/^\d+$/);
        return numMatch ? numMatch[0] : str.toLowerCase();
      };
      
      const normalizedTeamId = normalizeId(teamData.id);
      const teamIdVariations = [
        String(teamData.id),
        normalizedTeamId,
        `team${normalizedTeamId}`,
        String(teamData.id).replace(/^team/i, ''),
        String(teamData.id).toLowerCase(),
        String(teamData.id).toUpperCase()
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
        
        return teamIdVariations.some(tv => 
          playerTeamIdVariations.some(pv => pv === tv)
        );
      });
      
      const finalPlayers = teamPlayers.length > 0 
        ? teamPlayers 
        : (teamData.players || []);
      
      setTeamData(prev => prev ? {
        ...prev,
        players: sortPlayersByRoleAndAge(finalPlayers)
      } : null);
      
      // If the updated player is currently selected in the modal, update it
      if (selectedPlayer && playerId && selectedPlayer.id === playerId) {
        const updatedPlayer = allPlayers.find(p => p.id === playerId);
        if (updatedPlayer) {
          setSelectedPlayer(updatedPlayer);
        }
      }
    } catch (error) {
      console.error('Error refreshing team data after player update:', error);
    }
  }, [teamData?.id, league, selectedPlayer?.id]);

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

        const completed = teamMatches.filter((m: Match) => m.status === 'completed' && m.result);
        const upcoming = teamMatches.filter((m: Match) => m.status === 'upcoming');

        // Use getMatchResult function for consistency with FormGuide
        let wins = 0;
        let losses = 0;
        let noResult = 0;

        completed.forEach((m: Match) => {
          const result = getMatchResult(m, teamData.id);
          if (result === 'win') {
            wins += 1;
          } else if (result === 'loss') {
            losses += 1;
          } else {
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
    fetchPlayerStats();
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
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      
      <main className="relative">
        {/* Enhanced Hero Section */}
        <section className="relative py-20 border-b border-gray-800 overflow-hidden">
          {/* Animated Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />
          <motion.div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor.solid}15, ${secondaryColor.solid}15)`,
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Particle System */}
          <ParticleBackground 
            primaryColor={primaryColor.solid}
            secondaryColor={secondaryColor.solid}
            particleCount={40}
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <motion.button 
              onClick={() => router.push(isWPL ? '/wpl/teams' : '/teams')}
              className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Teams
            </motion.button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left: Team Info */}
              <div className="space-y-8">
                {/* Team Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-900/70 backdrop-blur-sm"
                  style={{
                    boxShadow: `0 4px 20px ${primaryColor.solid}20`,
                  }}
                >
                  {!isWPL && <IPLLogo size="sm" />}
                  {isWPL && <span className="text-sm font-bold text-purple-400">WPL</span>}
                  <span className="text-sm font-bold text-white">{teamData.shortName}</span>
                  <div className="ml-2">
                    <QualifiedBadge qualified={Boolean(teamData.stats?.qualified)} />
                  </div>
                </motion.div>

                {/* Team Name with Animation */}
                <motion.h1 
                  className="text-5xl md:text-6xl font-black text-white leading-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    textShadow: `0 4px 30px ${primaryColor.solid}40`,
                  }}
                >
                  {teamData.name}
                </motion.h1>
                
                {/* Description */}
                <motion.p 
                  className="text-lg text-gray-300 leading-relaxed max-w-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {teamData.description}
                </motion.p>

                {/* Form Guide */}
                {allMatches.length > 0 && (
                  <FormGuide 
                    matches={allMatches}
                    teamId={teamData.id}
                    primaryColor={primaryColor.solid}
                  />
                )}

                {/* Trophy Showcase */}
                {teamData.trophies && teamData.trophies > 0 && (
                  <TrophyCounter
                    trophyCount={teamData.trophies}
                    trophyYears={teamData.trophyYears}
                    primaryColor={primaryColor.solid}
                    teamName={teamData.shortName}
                  />
                )}

                {/* Quick Actions Bar */}
                <QuickActionsBar
                  primaryColor={primaryColor.solid}
                  onSquadClick={() => setShowPlayerCards(!showPlayerCards)}
                  onFixturesClick={() => {
                    const fixturesSection = document.querySelector('[data-section="fixtures"]');
                    fixturesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onNewsClick={() => router.push(isWPL ? '/wpl/news' : '/news')}
                  league={teamLeague}
                  showPlayerCards={showPlayerCards}
                />
              </div>

              {/* Right: Team Logo */}
              <motion.div 
                className="relative flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <motion.div 
                  className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {/* Glow effect behind logo */}
                  <motion.div
                    className="absolute inset-0 rounded-full blur-3xl"
                    style={{
                      background: `radial-gradient(circle, ${primaryColor.solid}40, transparent)`,
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  {teamLogoPath.endsWith('.json') ? (
                    <div className="w-full h-full relative z-10">
                      <RCBLottie className="w-full h-full" />
                    </div>
                  ) : teamLogoPath.endsWith('rcb_logo_premium.svg') ? (
                    <div className="w-full h-full flex items-center justify-center relative z-10">
                      <RCBLionLogo className="w-full h-full" />
                    </div>
                  ) : (
                    <img 
                      src={teamLogoPath}
                      alt={`${teamData.shortName} logo`}
                      className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackLogoPath;
                      }}
                    />
                  )}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-white mb-8">Team Overview</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Squad Size', value: teamData.players?.length || 0, Icon: UsersIcon },
                { label: 'Captains', value: teamData.players?.filter(p => p.isCaptain).length || 0, Icon: StarIcon },
                { label: 'Foreign', value: teamData.players?.filter(p => p.nationality !== 'India').length || 0, Icon: GlobeIcon },
                { label: 'All-rounders', value: teamData.players?.filter(p => p.role === 'All-rounder').length || 0, Icon: AllRounderIcon }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 hover:bg-gray-900 transition-colors"
                >
                  <stat.Icon className="w-6 h-6 mb-3" style={{ color: primaryColor.solid }} />
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                    </div>
              ))}
            </div>

            {/* Upcoming Fixtures Widget */}
            {teamData && (
              <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in mb-6" data-section="fixtures"
                   style={{
                     background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                     borderColor: primaryColor.medium,
                     boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                   }}>
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3" style={{ color: primaryColor.textOnLight }}>
                  <CricketBatIcon className="w-8 h-8" color={primaryColor.solid} />
                  Fixtures
                </h3>
                <UpcomingFixturesWidget team={teamData} matches={allMatches} onViewScorecard={fetchScorecard} />
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
                      <p className="text-sm text-gray-300 mb-3 max-w-full overflow-hidden truncate whitespace-nowrap">{lastMatch.result || 'Result not available'}</p>
                      <p className="text-xs text-gray-500 mb-3">Status: {lastMatch.status}</p>
                      {lastMatch.status === 'completed' && (
                        <button
                          onClick={() => fetchScorecard(lastMatch.id)}
                          disabled={loadingScorecard}
                          className="mt-auto px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 text-sm"
                        >
                          {loadingScorecard ? 'Loading...' : '📊 View Scorecard'}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No completed matches yet this season.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="border-b border-gray-800 bg-gray-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1">
              {[
                { id: 'squad', label: 'Squad' },
                { id: 'players', label: 'Players' },
                { id: 'stats', label: 'Stats' },
                { id: 'about', label: 'About' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-white border-white'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>
          </div>
        </section>

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
                    league={league}
                  />
                </div>
              )}

              {/* Player Comparison Button */}
              {teamData && teamData.players && teamData.players.length > 1 && (
                <div className="flex justify-center gap-4">
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
              
              {showPlayerCards && (
              <>
              {/* Squad Filters */}
              <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-lg border border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Filters</span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Nationality filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Nationality:</span>
                    <div className="inline-flex rounded-md border border-gray-700 bg-gray-800 p-1 gap-1">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'indian', label: 'Indian' },
                        { id: 'overseas', label: 'Overseas' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setNationalityFilter(option.id as any)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            nationalityFilter === option.id
                              ? 'bg-white text-blue-600'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Batting style filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Batting:</span>
                    <div className="inline-flex rounded-md border border-gray-700 bg-gray-800 p-1 gap-1">
                      {[
                        { id: 'any', label: 'Any' },
                        { id: 'right', label: 'Right' },
                        { id: 'left', label: 'Left' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setBattingStyleFilter(option.id as any)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            battingStyleFilter === option.id
                              ? 'bg-white text-blue-600'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

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
                      {section.players.map((player, playerIndex) => {
                        const playerWithRealStats = getPlayerRealStats(player);
                        return isWPL ? (
                          <WPLPlayerCard
                            key={player.id}
                            player={playerWithRealStats}
                            onClick={() => {
                              setSelectedPlayer(playerWithRealStats);
                              setIsModalOpen(true);
                            }}
                            index={playerIndex}
                          />
                        ) : (
                          <PlayerCard 
                            key={player.id} 
                            player={playerWithRealStats} 
                            primaryColor={primaryColor} 
                            secondaryColor={secondaryColor}
                            onClick={() => {
                              setSelectedPlayer(playerWithRealStats);
                              setIsModalOpen(true);
                            }}
                            index={playerIndex}
                            keyPlayers={keyPlayers}
                          />
                        )
                      })}
                    </div>
                  </AnimatedSection>
                )
              ))}
              </>
              )}
              </motion.div>
            )}

            {activeTab === 'players' && teamData && (
              <motion.div
                key="players"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl"
                     style={{
                       background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                       borderColor: primaryColor.medium,
                       boxShadow: `0 10px 30px ${primaryColor.glow}15`,
                     }}>
                  <TeamPlayersTab 
                    teamId={teamData.id} 
                    teamName={teamData.name}
                    initialPlayers={teamData.players}
                  />
                </div>
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
                playerStats={playerStats}
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

      {/* Scorecard Modal */}
      {showScorecardModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
            <button
              onClick={() => {
                setShowScorecardModal(false);
                setScorecard(null);
              }}
              className="sticky top-4 right-4 float-right z-10 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close scorecard"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {loadingScorecard ? (
              <div className="p-20 text-center">
                <div className="text-gray-300 mb-3 text-lg font-semibold">Loading scorecard...</div>
              </div>
            ) : scorecard ? (
              <div className="space-y-8 p-6">
                {/* Toss Info */}
                {scorecard.matchInfo?.toss?.winner && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="text-blue-400 text-sm font-semibold">Toss</div>
                    <div className="text-white">
                      {scorecard.matchInfo.toss.winner} won the toss and chose to {scorecard.matchInfo.toss.decision}
                    </div>
                  </div>
                )}

                {/* Match Result */}
                {scorecard.result && scorecard.result.winner && (
                  <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-2 border-green-500/40 rounded-2xl">
                    <div className="text-green-400 text-sm font-semibold mb-2">Match Result</div>
                    <div className="text-white font-bold text-xl">
                      {scorecard.result.winner}
                      {scorecard.result.margin && ` won by ${scorecard.result.margin}`}
                    </div>
                    {scorecard.result.manOfTheMatch && (
                      <div className="text-yellow-400 mt-2">Player of the Match: {scorecard.result.manOfTheMatch}</div>
                    )}
                  </div>
                )}

                {/* Innings */}
                {scorecard.innings
                  ?.sort((a: any, b: any) => (a.inningsNumber || 1) - (b.inningsNumber || 1))
                  .map((inning: any, idx: number) => {
                    const battingTeamName = inning.battingTeamId === scorecard.matchInfo.team1.id 
                      ? scorecard.matchInfo.team1.name 
                      : scorecard.matchInfo.team2.name;

                    return (
                      <div key={idx} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">
                          {battingTeamName} - Innings {inning.inningsNumber || idx + 1}
                        </h3>
                        <div className="text-2xl font-bold text-green-400 mb-4">
                          {inning.totalRuns}/{inning.totalWickets} ({inning.totalOvers} overs)
                        </div>

                        {/* Batting */}
                        {inning.batting && inning.batting.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-white mb-3">Batting</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-700/50">
                                  <tr className="text-left text-gray-300">
                                    <th className="p-2">Batter</th>
                                    <th className="p-2 text-center">R</th>
                                    <th className="p-2 text-center">B</th>
                                    <th className="p-2 text-center">4s</th>
                                    <th className="p-2 text-center">6s</th>
                                    <th className="p-2 text-center">SR</th>
                                  </tr>
                                </thead>
                                <tbody className="text-gray-200">
                                  {inning.batting.map((batter: any, i: number) => (
                                    <tr key={i} className="border-t border-gray-700">
                                      <td className="p-2">
                                        <div className="font-semibold">{batter.name}</div>
                                        {batter.dismissal?.details && (
                                          <div className="text-xs text-gray-400">{batter.dismissal.details}</div>
                                        )}
                                      </td>
                                      <td className="p-2 text-center font-bold">{batter.runs}</td>
                                      <td className="p-2 text-center">{batter.balls}</td>
                                      <td className="p-2 text-center">{batter.fours}</td>
                                      <td className="p-2 text-center">{batter.sixes}</td>
                                      <td className="p-2 text-center">{batter.strikeRate?.toFixed(2) || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Bowling */}
                        {inning.bowling && inning.bowling.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-white mb-3">Bowling</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-700/50">
                                  <tr className="text-left text-gray-300">
                                    <th className="p-2">Bowler</th>
                                    <th className="p-2 text-center">O</th>
                                    <th className="p-2 text-center">M</th>
                                    <th className="p-2 text-center">R</th>
                                    <th className="p-2 text-center">W</th>
                                    <th className="p-2 text-center">Econ</th>
                                  </tr>
                                </thead>
                                <tbody className="text-gray-200">
                                  {inning.bowling.map((bowler: any, i: number) => (
                                    <tr key={i} className="border-t border-gray-700">
                                      <td className="p-2 font-semibold">{bowler.name}</td>
                                      <td className="p-2 text-center">{bowler.overs}</td>
                                      <td className="p-2 text-center">{bowler.maidens || 0}</td>
                                      <td className="p-2 text-center">{bowler.runs}</td>
                                      <td className="p-2 text-center font-bold text-red-400">{bowler.wickets}</td>
                                      <td className="p-2 text-center">{bowler.economyRate?.toFixed(2) || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Fall of Wickets */}
                        {inning.fallOfWickets && inning.fallOfWickets.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-white mb-3">Fall of Wickets</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-700/50">
                                  <tr className="text-left text-gray-300">
                                    <th className="p-2">Player</th>
                                    <th className="p-2 text-center">Score</th>
                                    <th className="p-2 text-center">Over</th>
                                  </tr>
                                </thead>
                                <tbody className="text-gray-200">
                                  {inning.fallOfWickets.map((fow: any, i: number) => (
                                    <tr key={i} className="border-t border-gray-700">
                                      <td className="p-2 font-semibold">{fow.player}</td>
                                      <td className="p-2 text-center font-bold text-yellow-400">{fow.score}</td>
                                      <td className="p-2 text-center">{fow.over}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Powerplays */}
                        {inning.powerplays && (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-white mb-3">Powerplays</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {inning.powerplays.mandatory && (
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                  <div className="text-sm text-gray-400 mb-1">Mandatory Powerplay</div>
                                  <div className="text-white font-semibold">{inning.powerplays.mandatory.overs || 'N/A'}</div>
                                  <div className="text-green-400 font-bold">{inning.powerplays.mandatory.runs || 0} runs</div>
                                </div>
                              )}
                              {inning.powerplays.optional && (
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                  <div className="text-sm text-gray-400 mb-1">Optional Powerplay</div>
                                  <div className="text-white font-semibold">{inning.powerplays.optional.overs || 'N/A'}</div>
                                  <div className="text-green-400 font-bold">{inning.powerplays.optional.runs || 0} runs</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Partnerships */}
                        {inning.partnerships && inning.partnerships.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-white mb-3">Partnerships</h4>
                            <div className="space-y-3">
                              {inning.partnerships.map((partnership: any, i: number) => (
                                <div key={i} className="bg-gray-700/30 rounded-lg p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <div className="text-sm text-gray-400 mb-1">Batsman 1</div>
                                      <div className="text-white font-semibold">{partnership.batsman1}</div>
                                      <div className="text-green-400">{partnership.batsman1Runs} ({partnership.batsman1Balls})</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-gray-400 mb-1">Batsman 2</div>
                                      <div className="text-white font-semibold">{partnership.batsman2}</div>
                                      <div className="text-green-400">{partnership.batsman2Runs} ({partnership.batsman2Balls})</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-gray-400 mb-1">Partnership</div>
                                      <div className="text-yellow-400 font-bold text-lg">{partnership.totalRuns} runs</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="p-20 text-center">
                <div className="text-gray-400 mb-3 text-lg">No published scorecard available</div>
                <div className="text-gray-500 text-sm">The scorecard for this match hasn't been published yet.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Modern Player Card Component - Redesigned with Best UI/UX
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

  // Determine border color based on role (no pink/purple)
  const getBorderColor = () => {
    if (isKeyPlayer) return primaryColor.solid;
    if (player.role === 'Batsman') return '#F59E0B'; // Amber
    if (player.role === 'Bowler') return '#3B82F6'; // Blue
    if (player.role === 'All-rounder') return '#10B981'; // Emerald/Green
    if (player.role === 'Wicket-keeper') return '#F97316'; // Orange
    return primaryColor.solid;
  };

  const borderColor = getBorderColor();

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 40, scale: 0.9, rotateX: -5 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.05, 
        ease: [0.22, 1, 0.36, 1],
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        y: -12, 
        scale: 1.03,
        rotateY: 2,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 border-2"
      style={{
        background: `linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))`,
        borderColor: borderColor,
        boxShadow: isKeyPlayer
          ? `0 8px 32px ${primaryColor.glow}40, 0 0 0 2px ${borderColor}60, inset 0 0 20px ${borderColor}20`
          : `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px ${borderColor}50`,
      }}
    >
      {/* Animated Gradient Background with Pulse */}
      <motion.div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${primaryColor.solid}15, ${secondaryColor.solid}10, transparent)`,
        }}
        animate={{
          opacity: [0, 0.3, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Animated Border Glow */}
      <motion.div
        className="absolute -inset-0.5 rounded-3xl opacity-0 group-hover:opacity-100 -z-10 blur-md"
        style={{
          background: `linear-gradient(135deg, ${borderColor}, ${borderColor}80, transparent)`,
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0, 0.6, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Top Accent Line for Key Players */}
      {isKeyPlayer && (
        <motion.div 
          className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
          style={{
            background: `linear-gradient(to right, transparent, ${primaryColor.solid}, transparent)`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scaleX: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Jersey Number Badge with Enhanced Animation */}
      <motion.div
        className="absolute top-4 right-4 w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl z-10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
          color: '#FFFFFF',
          boxShadow: `0 4px 16px ${primaryColor.glow}50`,
        }}
        initial={{ scale: 0, rotate: -180 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.05 + 0.2,
          type: "spring",
          stiffness: 200
        }}
        whileHover={{ 
          scale: 1.15, 
          rotate: 10,
          boxShadow: `0 8px 24px ${primaryColor.glow}70`
        }}
      >
        <motion.span
          animate={{
            y: [0, -3, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }}
      >
        {player.jerseyNumber > 0 ? player.jerseyNumber : 'N/A'}
        </motion.span>
      </motion.div>

      {/* Player Info Section */}
      <div className="relative z-10 p-6">
        <motion.div 
          className="flex items-start gap-4 mb-4 pr-20"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.05 + 0.3 }}
        >
        {player.nationality && (
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.05 + 0.4,
                type: "spring",
                stiffness: 200
              }}
              whileHover={{ 
                scale: 1.2, 
                rotate: 15,
                transition: { duration: 0.2 }
              }}
            >
              <FlagImage nationality={player.nationality} size="md" />
            </motion.div>
          )}
          <div className="flex-1 min-w-0">
            <motion.h3 
              className="text-xl font-bold mb-1 truncate text-white group-hover:text-white transition-colors"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 + 0.35 }}
              whileHover={{ scale: 1.05, x: 5 }}
            >
          {player.name}
            </motion.h3>
            <motion.p 
              className="text-sm font-semibold mb-2"
              style={{ color: borderColor }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 + 0.4 }}
            >
        {player.role}
            </motion.p>
            {player.allrounderType && (
              <motion.span 
                className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: `${borderColor}25`,
                  color: borderColor,
                  border: `1px solid ${borderColor}40`,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 + 0.45 }}
                whileHover={{ scale: 1.1 }}
              >
                {player.allrounderType}
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Badges Section with Stagger Animation */}
        <motion.div 
          className="flex flex-wrap gap-2 mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.05 + 0.5 }}
        >
        {player.isCaptain && (
            <motion.span 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: `${primaryColor.solid}25`,
                color: '#FFD700',
                border: `1px solid ${primaryColor.solid}50`,
              }}
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 + 0.55 }}
              whileHover={{ 
                scale: 1.1, 
                y: -2,
                boxShadow: `0 4px 12px ${primaryColor.glow}40`
              }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <StarIcon className="w-3.5 h-3.5" color="#FFD700" filled />
              </motion.div>
            Captain
            </motion.span>
        )}
        {player.nationality !== 'India' && (
            <motion.span 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(59, 130, 246, 0.25)',
                color: '#93C5FD',
                border: '1px solid rgba(59, 130, 246, 0.5)',
              }}
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 + 0.6 }}
              whileHover={{ 
                scale: 1.1, 
                y: -2,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
              }}
            >
              <GlobeIcon className="w-3.5 h-3.5" color="#93C5FD" />
            Foreign
            </motion.span>
        )}
        {isKeyPlayer && (
            <motion.span 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(245, 158, 11, 0.25)',
                color: '#FCD34D',
                border: '1px solid rgba(245, 158, 11, 0.5)',
              }}
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 + 0.65 }}
              whileHover={{ 
                scale: 1.1, 
                y: -2,
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
              }}
              animate={{
                boxShadow: [
                  '0 0 0 rgba(245, 158, 11, 0.4)',
                  '0 0 10px rgba(245, 158, 11, 0.6)',
                  '0 0 0 rgba(245, 158, 11, 0.4)'
                ]
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <StarIcon className="w-3.5 h-3.5" color="#FCD34D" filled />
              </motion.div>
            Key Player
            </motion.span>
        )}
        </motion.div>

        {/* Role Tags with Stagger Animation */}
      {tags.length > 0 && (
          <motion.div 
            className="flex flex-wrap gap-2 mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 + 0.7 }}
          >
            {tags.slice(0, 3).map((tag: string, tagIndex) => (
              <motion.span
              key={tag}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: `${borderColor}20`,
                  color: borderColor,
                  border: `1px solid ${borderColor}40`,
                }}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05 + 0.75 + tagIndex * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                whileHover={{ 
                  scale: 1.15, 
                  y: -3,
                  boxShadow: `0 4px 12px ${borderColor}40`
                }}
            >
              {tag}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Stats Section with Enhanced Animations */}
        <motion.div 
          className="grid grid-cols-3 gap-3 pt-4 border-t"
          style={{ borderColor: `${borderColor}30` }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.05 + 0.8 }}
        >
          <motion.div 
            className="text-center group/stat"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 + 0.85 }}
            whileHover={{ 
              scale: 1.1, 
              y: -5,
              transition: { duration: 0.2, type: "spring", stiffness: 300 }
            }}
          >
            <motion.div 
              className="p-3 rounded-2xl"
              style={{ background: `${primaryColor.solid}15` }}
              whileHover={{
                background: `${primaryColor.solid}25`,
                boxShadow: `0 8px 20px ${primaryColor.glow}30`
              }}
            >
              <motion.p 
                className="text-2xl font-bold mb-1 text-white"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.05 + 0.9,
                  type: "spring",
                  stiffness: 200
                }}
              >
                {stats.matches || 0}
              </motion.p>
              <p className="text-xs font-medium text-gray-200 uppercase tracking-wide">
            Matches
          </p>
            </motion.div>
          </motion.div>
          <motion.div 
            className="text-center group/stat"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 + 0.9 }}
            whileHover={{ 
              scale: 1.1, 
              y: -5,
              transition: { duration: 0.2, type: "spring", stiffness: 300 }
            }}
          >
            <motion.div 
              className="p-3 rounded-2xl"
              style={{ background: `${secondaryColor.solid}15` }}
              whileHover={{
                background: `${secondaryColor.solid}25`,
                boxShadow: `0 8px 20px ${secondaryColor.glow || primaryColor.glow}30`
              }}
            >
              <motion.p 
                className="text-2xl font-bold mb-1 text-white"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.05 + 0.95,
                  type: "spring",
                  stiffness: 200
                }}
              >
                {stats.runs || 0}
              </motion.p>
              <p className="text-xs font-medium text-gray-200 uppercase tracking-wide">
            Runs
          </p>
            </motion.div>
          </motion.div>
          <motion.div 
            className="text-center group/stat"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 + 0.95 }}
            whileHover={{ 
              scale: 1.1, 
              y: -5,
              transition: { duration: 0.2, type: "spring", stiffness: 300 }
            }}
          >
            <motion.div 
              className="p-3 rounded-2xl"
              style={{ background: `${primaryColor.solid}15` }}
              whileHover={{
                background: `${primaryColor.solid}25`,
                boxShadow: `0 8px 20px ${primaryColor.glow}30`
              }}
            >
              <motion.p 
                className="text-2xl font-bold mb-1 text-white"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.05 + 1.0,
                  type: "spring",
                  stiffness: 200
                }}
              >
                {stats.wickets || 0}
              </motion.p>
              <p className="text-xs font-medium text-gray-200 uppercase tracking-wide">
            Wickets
          </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Hover Arrow Indicator with Animation */}
      <motion.div 
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
          style={{
            background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
            boxShadow: `0 4px 16px ${primaryColor.glow}50`,
          }}
          initial={{ scale: 0, rotate: -180 }}
          whileHover={{ 
            x: 5, 
            scale: 1.15,
            boxShadow: `0 8px 24px ${primaryColor.glow}70`
          }}
          transition={{ 
            duration: 0.3,
            type: "spring",
            stiffness: 200
          }}
        >
          <motion.svg 
            className="w-5 h-5 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            animate={{
              x: [0, 3, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </motion.svg>
      </motion.div>
      </div>
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
function StatsTab({ teamData, primaryColor, secondaryColor, batsmen, bowlers, allRounders, wicketkeepers, playerStats = [] }: StatsTabProps) {
  if (!teamData) return null;
  const squad: Player[] = (teamData.players || []) as Player[];

  // Function to get real stats for a player
  const getPlayerRealStats = (player: Player) => {
    const playerStat = playerStats.find(stat => 
      stat.playerId === player.id || 
      stat.playerName === player.name
    );
    
    if (playerStat) {
      return {
        matches: playerStat.matches || 0,
        runs: playerStat.runs || 0,
        wickets: playerStat.wickets || 0,
        average: playerStat.average || 0,
        strikeRate: playerStat.strikeRate || 0,
        highestScore: playerStat.highestScore || 0,
        fifties: playerStat.fifties || 0,
        hundreds: playerStat.hundreds || 0,
        fours: playerStat.fours || 0,
        sixes: playerStat.sixes || 0,
        bowlingAverage: playerStat.bowlingAverage || 0,
        economy: playerStat.economy || 0,
        bestBowling: playerStat.bestBowling || '0/0'
      };
    }
    
    // Fallback to original stats
    return player.stats || {};
  };

  const totals = squad.reduce(
    (acc, p) => {
      const s = getPlayerRealStats(p);
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
    const currentRuns = getPlayerRealStats(p).runs || 0;
    const bestRuns = best ? getPlayerRealStats(best).runs || 0 : 0;
    return currentRuns > bestRuns ? p : best;
  }, null);

  const topWicketTaker = squad.reduce<Player | null>((best, p) => {
    const currentWkts = getPlayerRealStats(p).wickets || 0;
    const bestWkts = best ? getPlayerRealStats(best).wickets || 0 : 0;
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
                  Runs: <span className="font-semibold text-white">{getPlayerRealStats(topRunScorer).runs}</span> ·
                  Matches: <span className="font-semibold text-white">{getPlayerRealStats(topRunScorer).matches}</span>
                </p>
              </div>
            )}
            {topWicketTaker && (
              <div className="p-4 rounded-xl bg-black/25 border border-white/10 flex flex-col gap-1">
                <p className="text-xs uppercase text-gray-300">Top wicket-taker in squad</p>
                <p className="text-base font-semibold text-white">{topWicketTaker.name}</p>
                <p className="text-xs text-gray-300">
                  Wickets: <span className="font-semibold text-white">{getPlayerRealStats(topWicketTaker).wickets}</span> ·
                  Matches: <span className="font-semibold text-white">{getPlayerRealStats(topWicketTaker).matches}</span>
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
