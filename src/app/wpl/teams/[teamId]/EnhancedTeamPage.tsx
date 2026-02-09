'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useInView } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Users, 
  Calendar, 
  TrendingUp, 
  MapPin, 
  Target,
  Star,
  Award,
  Activity,
  Shield,
  Zap,
  ChevronRight,
  Play,
  BarChart3,
  Heart,
  Share2,
  Download,
  Filter,
  Search,
  Clock,
  Flag,
  Globe,
  Twitter,
  Instagram,
  Youtube,
  Facebook,
  Crown,
  Flame,
  Medal,
  Menu,
  X
} from 'lucide-react';
import * as CI from './CricketIcons';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import { WPLColors, getWPLGlassmorphism, getWPLHoverGlow } from '@/lib/wplColors';

// Import types
interface Team {
  id: string | number;
  name: string;
  shortName: string;
  logo?: string;
  homeVenue?: string;
  captain?: string;
  coach?: string;
  founded?: string;
  colors?: string[];
  description?: string;
  social?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
}

interface Player {
  id: string | number;
  name: string;
  team?: string | Team;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  country?: string;
  image?: string;
  jerseyNumber?: number;
  age?: number;
  matches?: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
  economy?: number;
}

interface Match {
  id: string;
  team1: string | Team;
  team2: string | Team;
  date: string;
  time?: string;
  venue?: string;
  result?: string;
  status?: string;
  league?: string;
}

interface EnhancedWPLTeamPageProps {
  teamId: string;
}

interface TeamStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  titles: number;
  highestScore: number;
  lowestScore: number;
  averageScore: number;
  winPercentage: number;
}

interface RecentMatch {
  id: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw' | 'upcoming';
  score: string;
  date: string;
  venue: string;
}

interface PlayerStats {
  totalRuns: number;
  totalWickets: number;
  average: number;
  strikeRate: number;
  economy: number;
}

export default function EnhancedWPLTeamPage({ teamId }: EnhancedWPLTeamPageProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [trophies, setTrophies] = useState<TrophyType[]>([]);
  const [coachingStaff, setCoachingStaff] = useState<CoachingStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isInitialized, setIsInitialized] = useState(false);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  // Helper: normalize team references (object, id string, or shortName)
  const resolveTeam = (t: any) => {
    if (!t) return { short: 'TBD', full: 'TBD' };
    if (typeof t === 'object') {
      return {
        short: (t.shortName && String(t.shortName)) || (t.name && String(t.name)) || String(t.id || 'TBD'),
        full: (t.name && String(t.name)) || (t.shortName && String(t.shortName)) || String(t.id || 'TBD')
      };
    }
    const idStr = String(t);
    const found = allTeams.find(a => String(a.id) === idStr || (a.shortName && a.shortName.toLowerCase() === idStr.toLowerCase()) || (a.name && a.name.toLowerCase() === idStr.toLowerCase()));
    if (found) return { short: found.shortName || found.name || String(found.id), full: found.name || found.shortName || String(found.id) };
    return { short: idStr, full: idStr };
  };

  const getTeamShort = (t: any) => resolveTeam(t).short;
  const getTeamFull = (t: any) => resolveTeam(t).full;
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [selectedScorecard, setSelectedScorecard] = useState<any | null>(null);
  const [showScorecard, setShowScorecard] = useState(false);
  const [allScorecards, setAllScorecards] = useState<any[]>([]);
  const [activeModalTab, setActiveModalTab] = useState<'scorecard' | 'playing11'>('scorecard');
  
  const [playerStats, setPlayerStats] = useState<{ [key: string]: any }>({});
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState<any | null>(null);
  const [isLoadingPlayerStats, setIsLoadingPlayerStats] = useState(false);
  
  // Points table stats
  const [leaguePosition, setLeaguePosition] = useState<number>(0);
  const [teamPointsData, setTeamPointsData] = useState<any>(null);
  const [last5Games, setLast5Games] = useState<string>('-');
  const [winRate, setWinRate] = useState<number>(0);
  const [netRunRate, setNetRunRate] = useState<number>(0);

  // Enhanced state for advanced interactions
  const [isHoveringCard, setIsHoveringCard] = useState<string | null>(null);
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isParallaxEnabled, setIsParallaxEnabled] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Enhanced mouse tracking and animations
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: false, amount: 0.3 });
  
  // Advanced scroll tracking
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Enhanced parallax effects
  const scaleValue = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const rotateValue = useTransform(scrollYProgress, [0, 1], [0, 5]);
  const opacityValue = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  // Spring animations for smooth interactions
  const springConfig = { damping: 25, stiffness: 300 };
  const scaleSpring = useSpring(scaleValue, springConfig);
  const rotateSpring = useSpring(rotateValue, springConfig);

  const hasFetchedData = useRef(false);

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const headerScale = useTransform(scrollY, [0, 300], [1, 0.8]);

  useEffect(() => {
    const fetchData = async () => {
      if (!hasFetchedData.current) {
        hasFetchedData.current = true;
        await fetchTeamData();
        await fetchPointsTableData();
      }
    };
    
    fetchData();
  }, [teamId]);
  
  // Fetch points table data for team stats
  const fetchPointsTableData = async () => {
    try {
      // Fetch all teams to get points table data
      const teamsResponse = await fetch('/api/teams?league=wpl');
      if (!teamsResponse.ok) return;
      
      const allTeams = await teamsResponse.json();
      
      // Load saved stats from localStorage
      let savedStats = {};
      if (typeof window !== 'undefined') {
        savedStats = JSON.parse(localStorage.getItem('pointsTableStats') || '{}');
      }
      
      // Find current team's stats
      const currentTeam = allTeams.find((t: any) => {
        const tId = String(t.id || '').replace(/^team/, '');
        const currentId = String(teamId || '').replace(/^team/, '');
        return tId === currentId || String(t.id) === teamId || t.shortName?.toLowerCase() === teamId.toLowerCase();
      });
      
      if (!currentTeam) return;
      
      // Get team stats from localStorage or team.stats
      let teamData = savedStats[currentTeam.id] || currentTeam.stats || {};
      setTeamPointsData(teamData);
      
      // Calculate stats
      const matchesPlayed = teamData.matchesPlayed || 0;
      const wins = teamData.wins || 0;
      const nrr = teamData.netRunRate || 0;
      
      // Calculate win rate
      const winRateCalc = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
      setWinRate(winRateCalc);
      setNetRunRate(nrr);
      
      // Calculate league position
      const teamsWithStats = allTeams.map((t: any) => {
        const stats = savedStats[t.id] || t.stats || {};
        return {
          id: t.id,
          name: t.name,
          points: stats.points || 0,
          netRunRate: stats.netRunRate || 0
        };
      }).sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.netRunRate - a.netRunRate;
      });
      
      const position = teamsWithStats.findIndex((t: any) => t.id === currentTeam.id) + 1;
      setLeaguePosition(position);
      
      // Calculate last 5 games form from recent matches
      const matchesResponse = await fetch('/api/matches?league=wpl');
      if (matchesResponse.ok) {
        const allMatches = await matchesResponse.json();
        
        // Filter matches for this team that have results
        const teamMatches = allMatches
          .filter((m: any) => {
            const team1Id = typeof m.team1 === 'object' ? m.team1.id : m.team1;
            const team2Id = typeof m.team2 === 'object' ? m.team2.id : m.team2;
            const team1Name = typeof m.team1 === 'object' ? m.team1.name : '';
            const team2Name = typeof m.team2 === 'object' ? m.team2.name : '';
            
            return (team1Id === currentTeam.id || team2Id === currentTeam.id ||
                    team1Name === currentTeam.name || team2Name === currentTeam.name) &&
                   m.result && m.result !== 'TBD' && m.status !== 'upcoming';
          })
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        // Determine W/L for last 5 games
        const formString = teamMatches.map((m: any) => {
          const result = m.result || '';
          if (result.toLowerCase().includes(currentTeam.name.toLowerCase()) || 
              result.toLowerCase().includes('won')) {
            return 'W';
          } else if (result.toLowerCase().includes('tie') || result.toLowerCase().includes('draw')) {
            return 'D';
          } else {
            return 'L';
          }
        }).join('');
        
        setLast5Games(formString || '-');
      }
    } catch (error) {
      console.error('Failed to fetch points table data:', error);
    }
  };

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      console.log('EnhancedTeamPage: Starting data fetch for teamId:', teamId);
      
      // Simple fetch with minimal timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const teamsResponse = await fetch(`/api/teams?league=wpl`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (teamsResponse.ok) {
        const teams = await teamsResponse.json();
        console.log('EnhancedTeamPage: Received teams:', teams.length);
        setAllTeams(teams || []);
        
        // Simple team matching
        const normalizedTeamId = teamId.toLowerCase().trim();
        const foundTeam = teams.find((t: Team) => {
          const teamShortName = t.shortName?.toLowerCase().trim();
          const teamId = String(t.id).toLowerCase().trim();
          
          return teamShortName === normalizedTeamId || 
                 teamId === normalizedTeamId ||
                 (normalizedTeamId === 'rcb' && teamShortName === 'rcb-w') ||
                 (normalizedTeamId === 'mi' && teamShortName === 'mi-w') ||
                 (normalizedTeamId === 'dc' && teamShortName === 'dc-w');
        });
        
        console.log('EnhancedTeamPage: Found team:', foundTeam?.name || 'null');
        
        if (foundTeam) {
          setTeam(foundTeam);
          
          // Fetch real data for this specific team
          try {
            const fetchPromises = [
              fetch(`/api/players?teamId=${foundTeam.id}&league=wpl`).catch(() => null),
              fetch(`/api/matches?teamId=${foundTeam.id}&league=wpl`).catch(() => null),
              fetch(`/api/coaches?teamId=${foundTeam.id}`).catch(() => null),
              fetch(`/api/scorecards`).catch(() => null) // Fetch all scorecards for detailed stats
            ];
            
            const [playersResponse, matchesResponse, coachesResponse, scorecardsResponse] = await Promise.all(fetchPromises);
            
            // Process players - filter for this team only
            if (playersResponse?.ok) {
              const allPlayers = await playersResponse.json();
              console.log('EnhancedTeamPage: Total players received:', allPlayers?.length || 0);
              
              // Filter players to ensure they belong to this team ONLY
              const teamPlayers = Array.isArray(allPlayers) ? allPlayers.filter(player => 
                String(player.teamId) === String(foundTeam.id)
              ) : [];
              
              console.log('EnhancedTeamPage: Filtered players for', foundTeam.shortName, ':', teamPlayers.length);
              setPlayers(teamPlayers);
            }
            
            // Process matches - filter for this team only
            if (matchesResponse?.ok) {
              const allMatches = await matchesResponse.json();
              console.log('EnhancedTeamPage: Total matches received:', allMatches?.length || 0);
              
              // Filter matches to ensure they involve this team
              const teamMatches = Array.isArray(allMatches) ? allMatches.filter(match => 
                (match.team1 && String(match.team1.id) === String(foundTeam.id)) ||
                (match.team2 && String(match.team2.id) === String(foundTeam.id)) ||
                (typeof match.team1 === 'string' && match.team1 === foundTeam.id) ||
                (typeof match.team2 === 'string' && match.team2 === foundTeam.id)
              ) : [];
              
              // Deduplicate matches by unique combination of date, venue, team1, team2
              const uniqueMatches = teamMatches.filter((match, index, self) => 
                index === self.findIndex((m) => 
                  m.date === match.date && 
                  m.venue === match.venue &&
                  ((m.team1?.id === match.team1?.id && m.team2?.id === match.team2?.id) ||
                   (m.team1?.id === match.team2?.id && m.team2?.id === match.team1?.id))
                )
              );
              
              console.log('EnhancedTeamPage: Filtered matches for', foundTeam.shortName, ':', teamMatches.length);
              console.log('EnhancedTeamPage: Unique matches after deduplication:', uniqueMatches.length);
              setMatches(uniqueMatches);
            } else {
              setMatches([]);
            }
            
            // Process coaches
            if (coachesResponse?.ok) {
              const staff = await coachesResponse.json();
              console.log('EnhancedTeamPage: Coaches received:', staff?.length || 0);
              setCoachingStaff(Array.isArray(staff) ? staff : []);
            } else {
              setCoachingStaff([]);
            }
            
            // Process scorecards for detailed stats
            if (scorecardsResponse?.ok) {
              const allScorecardsData = await scorecardsResponse.json();
              console.log('EnhancedTeamPage: Total scorecards received:', allScorecardsData?.length || 0);
              
              // Store all scorecards for later use in match clicks
              setAllScorecards(Array.isArray(allScorecardsData) ? allScorecardsData : []);
              
              // Filter scorecards for this team's matches
              const teamScorecards = Array.isArray(allScorecardsData) ? allScorecardsData.filter(scorecard => 
                scorecard.matchInfo && (
                  String(scorecard.matchInfo.team1?.id) === String(foundTeam.id) ||
                  String(scorecard.matchInfo.team2?.id) === String(foundTeam.id)
                )
              ) : [];
              
              console.log('EnhancedTeamPage: Filtered scorecards for', foundTeam.shortName, ':', teamScorecards.length);
              calculateTeamStatsFromScorecards(teamScorecards, foundTeam.id);
              
              // Calculate individual player statistics from scorecards
              const calculatedPlayerStats = calculatePlayerStats(players || [], teamScorecards);
              setPlayerStats(calculatedPlayerStats);
              console.log('EnhancedTeamPage: Calculated player stats for', Object.keys(calculatedPlayerStats).length, 'players');
            } else {
              // Fallback to basic match stats if scorecards fail
              calculateTeamStats(matches || []);
            }
            
          } catch (fetchError) {
            console.error('EnhancedTeamPage: Error fetching team data:', fetchError);
            // Set empty arrays on error
            setPlayers([]);
            setMatches([]);
            setCoachingStaff([]);
          }
        }
      } else {
        console.error('EnhancedTeamPage: API error:', teamsResponse.status);
      }
    } catch (error) {
      console.error('EnhancedTeamPage: Fetch error:', error);
      // Don't reset hasFetchedData - prevent infinite retries
    } finally {
      setLoading(false);
    }
  };

  // Mouse tracking event handlers
  const handleMouseMove = (e: MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cursorX.set(x);
      cursorY.set(y);
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }
  };

  const handleMouseEnter = () => setIsHoveringLogo(true);
  const handleMouseLeave = () => setIsHoveringLogo(false);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [cursorX, cursorY, isInitialized]);

  const calculateTeamStatsFromScorecards = (teamScorecards: any[], teamId: string) => {
    console.log('EnhancedTeamPage: Calculating stats from scorecards for team:', teamId);
    
    if (!teamScorecards || teamScorecards.length === 0) {
      console.log('EnhancedTeamPage: No scorecards found, using empty stats');
      setTeamStats({
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        titles: 0,
        highestScore: 0,
        lowestScore: 0,
        averageScore: 0,
        winPercentage: 0
      });
      return;
            <motion.div
              className="text-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <CI.IconCricketBat size={30} className="inline-block" />
    let totalRuns = 0;
    let totalWickets = 0;
    let totalOvers = 0;
    let highestIndividualScore = 0;
    let bestBowlingFigures = { wickets: 0, runs: 0 };
    let totalFifties = 0;
    let totalHundreds = 0;
    let totalWicketsTaken = 0;

    teamScorecards.forEach(scorecard => {
      if (!scorecard.innings || !Array.isArray(scorecard.innings)) return;

      // Determine if team won
      const isWinner = scorecard.result?.winner?.includes('Royal Challengers') || 
                       scorecard.result?.winner === teamId;
      
      if (isWinner) wins++;
      else losses++;
      
      totalMatches++;

      // Process each innings to find team's batting and bowling performance
      scorecard.innings.forEach(innings => {
        // Check if this is team's batting innings
        if (String(innings.battingTeamId) === String(teamId)) {
          const teamTotalRuns = innings.totalRuns || 0;
          const teamTotalWickets = innings.totalWickets || 0;
          const teamTotalOvers = innings.totalOvers || '0';
          
          teamScores.push(teamTotalRuns);
          totalRuns += teamTotalRuns;
          totalWickets += teamTotalWickets;
          
          // Parse overs for calculation
          const oversParts = teamTotalOvers.split('.');
          const overs = parseInt(oversParts[0]) || 0;
          const balls = parseInt(oversParts[1]) || 0;
          totalOvers += overs + (balls / 6);

          // Find highest individual score
          if (innings.batting && Array.isArray(innings.batting)) {
            innings.batting.forEach(batsman => {
              if (batsman.runs > highestIndividualScore) {
                highestIndividualScore = batsman.runs;
              }
              
              // Count fifties and hundreds
              if (batsman.runs >= 100) totalHundreds++;
              else if (batsman.runs >= 50) totalFifties++;
            });
          }
        }
        
        // Check if this is team's bowling innings
        if (String(innings.battingTeamId) !== String(teamId)) {
          if (innings.bowling && Array.isArray(innings.bowling)) {
            innings.bowling.forEach(bowler => {
              totalWicketsTaken += bowler.wickets || 0;
              
              // Track best bowling figures
              if (bowler.wickets > bestBowlingFigures.wickets || 
                  (bowler.wickets === bestBowlingFigures.wickets && bowler.runs < bestBowlingFigures.runs)) {
                bestBowlingFigures = {
                  wickets: bowler.wickets || 0,
                  runs: bowler.runs || 0
                };
              }
            });
          }
        }
      });
    });

    const stats: TeamStats = {
      matchesPlayed: totalMatches,
      wins,
      losses,
      titles: 0, // Could be calculated from tournament data
      highestScore: Math.max(...teamScores, 0),
      lowestScore: Math.min(...teamScores, 0),
      averageScore: teamScores.length > 0 ? Math.round(totalRuns / teamScores.length) : 0,
      winPercentage: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0
    };

    // Add additional detailed stats from scorecards
    const detailedStats = {
      ...stats,
      totalRuns,
      totalWickets,
      totalOvers: Math.round(totalOvers * 10) / 10,
      averageRunRate: totalOvers > 0 ? Math.round((totalRuns / totalOvers) * 100) / 100 : 0,
      highestIndividualScore,
      bestBowlingFigures,
      totalFifties,
      totalHundreds,
      totalWicketsTaken,
      averageEconomyRate: totalOvers > 0 ? Math.round((totalRuns / totalOvers) * 100) / 100 : 0
    };

    console.log('EnhancedTeamPage: Calculated detailed stats from scorecards:', detailedStats);
    setTeamStats(stats);
  };

  const handleMatchClick = (match: any) => {
    console.log('Match clicked:', match.id);
    console.log('Match details:', {
      id: match.id,
      team1: match.team1?.shortName,
      team2: match.team2?.shortName,
      date: match.date,
      venue: match.venue
    });
    
    // Find the corresponding scorecard for this match
    const scorecard = allScorecards.find(sc => {
      console.log('Checking scorecard:', {
        id: sc.id,
        matchId: sc.matchId,
        team1: sc.matchInfo?.team1?.shortName,
        team2: sc.matchInfo?.team2?.shortName,
        date: sc.matchInfo?.date,
        venue: sc.matchInfo?.venue
      });
      
      return (
        sc.matchId === match.id || 
        (sc.matchInfo && match.team1 && match.team2 && (
          // Match by normalized team short names (handles objects or id strings)
          ((getTeamShort(sc.matchInfo.team1) === getTeamShort(match.team1) && 
            getTeamShort(sc.matchInfo.team2) === getTeamShort(match.team2)) ||
           (getTeamShort(sc.matchInfo.team1) === getTeamShort(match.team2) && 
            getTeamShort(sc.matchInfo.team2) === getTeamShort(match.team1)))
        ))
      );
    });
    
    if (scorecard) {
      console.log('Found scorecard for match:', scorecard.id);
      setSelectedMatch(match);
      setSelectedScorecard(scorecard);
      setShowScorecard(true);
    } else {
      console.log('No scorecard found for match:', match.id);
      console.log('Available scorecards:', allScorecards.map(sc => ({
        id: sc.id,
        matchId: sc.matchId,
        teams: `${sc.matchInfo?.team1?.shortName} vs ${sc.matchInfo?.team2?.shortName}`,
        date: sc.matchInfo?.date
      })));
      // Still show the match info even without scorecard
      setSelectedMatch(match);
      setSelectedScorecard(null);
      setShowScorecard(true);
    }
  };

  // Check if a match has a scorecard available
  const hasScorecard = (match: any) => {
    return allScorecards.some(sc => 
      sc.matchId === match.id || 
      (sc.matchInfo && match.team1 && match.team2 && (
        ((getTeamShort(sc.matchInfo.team1) === getTeamShort(match.team1) && 
          getTeamShort(sc.matchInfo.team2) === getTeamShort(match.team2)) ||
         (getTeamShort(sc.matchInfo.team1) === getTeamShort(match.team2) && 
          getTeamShort(sc.matchInfo.team2) === getTeamShort(match.team1)))
      ))
    );
  };

  const closeScorecard = () => {
    setShowScorecard(false);
    setSelectedMatch(null);
    setSelectedScorecard(null);
    setActiveModalTab('scorecard');
  };

  const handlePlayerClick = async (player: any) => {
    setSelectedPlayerForStats(player);
    setIsLoadingPlayerStats(true);
    setShowPlayerStats(true);
    
    try {
      // Fetch all WPL scorecards
      const response = await fetch('/api/scorecards?league=wpl');
      const scorecards = await response.json();
      
      if (!scorecards || scorecards.length === 0) {
        setPlayerStats(prev => ({
          ...prev,
          [player.id]: {
            matches: 0,
            runs: 0,
            wickets: 0,
            average: 0,
            strikeRate: 0,
            economy: 0,
            innings: 0,
            notOuts: 0,
            overs: 0,
            runsConceded: 0
          }
        }));
        setIsLoadingPlayerStats(false);
        return;
      }

      let totalRuns = 0;
      let totalBalls = 0;
      let totalWickets = 0;
      let inningsCount = 0;
      let notOuts = 0;
      let totalOvers = 0;
      let totalRunsConceded = 0;
      let matchesPlayed = new Set();

      // Process each scorecard
      for (const scorecard of scorecards) {
        if (!scorecard.innings) continue;
        
        // Process each innings
        for (const innings of scorecard.innings) {
          // Check if player is in batting scorecard
          if (innings.batting) {
            for (const batsman of innings.batting) {
              if (batsman.name && batsman.name.toLowerCase().trim() === player.name.toLowerCase().trim()) {
                totalRuns += batsman.runs || 0;
                totalBalls += batsman.balls || 0;
                inningsCount++;
                if (batsman.dismissal?.type === 'not-out') {
                  notOuts++;
                }
                matchesPlayed.add(scorecard.id);
              }
            }
          }

          // Check if player is in bowling scorecard
          if (innings.bowling) {
            for (const bowler of innings.bowling) {
              if (bowler.name && bowler.name.toLowerCase().trim() === player.name.toLowerCase().trim()) {
                totalWickets += bowler.wickets || 0;
                totalOvers += parseFloat(bowler.overs) || 0;
                totalRunsConceded += bowler.runs || 0;
                matchesPlayed.add(scorecard.id);
              }
            }
          }
        }
      }

      // Calculate derived statistics
      const average = inningsCount > 0 && (inningsCount - notOuts) > 0 
        ? (totalRuns / (inningsCount - notOuts)).toFixed(2) 
        : '0.00';
      const strikeRate = totalBalls > 0 
        ? ((totalRuns / totalBalls) * 100).toFixed(2) 
        : '0.00';
      const economy = totalOvers > 0 
        ? (totalRunsConceded / totalOvers).toFixed(2) 
        : '0.00';

      setPlayerStats(prev => ({
        ...prev,
        [player.id]: {
          matches: matchesPlayed.size,
          runs: totalRuns,
          wickets: totalWickets,
          average: parseFloat(average),
          strikeRate: parseFloat(strikeRate),
          economy: parseFloat(economy),
          innings: inningsCount,
          notOuts: notOuts,
          overs: totalOvers.toFixed(1),
          runsConceded: totalRunsConceded,
          balls: totalBalls
        }
      }));

    } catch (error) {
      console.error('Error fetching player statistics:', error);
      setPlayerStats(prev => ({
        ...prev,
        [player.id]: {
          matches: 0,
          runs: 0,
          wickets: 0,
          average: 0,
          strikeRate: 0,
          economy: 0,
          innings: 0,
          notOuts: 0,
          overs: 0,
          runsConceded: 0
        }
      }));
    } finally {
      setIsLoadingPlayerStats(false);
    }
  };

  const closePlayerStats = () => {
    setShowPlayerStats(false);
    setSelectedPlayerForStats(null);
  };

  const calculatePlayerStats = (players: any[], scorecards: any[]) => {
    const playerStats: { [key: string]: { runs: number; balls: number; wickets: number; innings: number; notOuts: number; overs: number; runsConceded: number; } } = {};
    
    // Initialize all players with zero stats and create a mapping for multiple IDs
    const playerIdMap: { [key: string]: string[] } = {};
    players.forEach(player => {
      const mainId = String(player.id);
      playerStats[mainId] = {
        runs: 0,
        balls: 0,
        wickets: 0,
        innings: 0,
        notOuts: 0,
        overs: 0,
        runsConceded: 0
      };
      
      // Create mapping for all possible IDs this player might have
      const possibleIds = [
        mainId,
        String(player.id).replace(/^team/i, ''),
        `wpl${player.id}`,
        String(player.id).toLowerCase(),
        String(player.id).toUpperCase()
      ];
      
      // Map all possible IDs to this player's main ID
      possibleIds.forEach(id => {
        if (!playerIdMap[id]) {
          playerIdMap[id] = [];
        }
        playerIdMap[id].push(mainId);
      });
    });

    console.log('Player ID mapping:', playerIdMap);

    // Calculate stats from scorecards
    scorecards.forEach(scorecard => {
      scorecard.innings?.forEach((innings: any) => {
        // Calculate batting stats
        innings.batting?.forEach((batsman: any) => {
          const scorecardPlayerId = String(batsman.playerId);
          console.log('Processing batsman:', batsman.name, 'ID:', scorecardPlayerId);
          
          // Find the main player ID using our mapping
          const mainPlayerIds = playerIdMap[scorecardPlayerId];
          if (mainPlayerIds && mainPlayerIds.length > 0) {
            const mainPlayerId = mainPlayerIds[0]; // Use the first main ID
            if (playerStats[mainPlayerId]) {
              playerStats[mainPlayerId].runs += batsman.runs || 0;
              playerStats[mainPlayerId].balls += batsman.balls || 0;
              playerStats[mainPlayerId].innings += 1;
              if (batsman.dismissal?.type === 'not-out') {
                playerStats[mainPlayerId].notOuts += 1;
              }
              console.log('Added batting stats for', mainPlayerId, ':', batsman.runs, 'runs');
            }
          } else {
            console.log('No mapping found for player ID:', scorecardPlayerId);
          }
        });

        // Calculate bowling stats
        innings.bowling?.forEach((bowler: any) => {
          const scorecardPlayerId = String(bowler.playerId);
          console.log('Processing bowler:', bowler.name, 'ID:', scorecardPlayerId);
          
          // Find the main player ID using our mapping
          const mainPlayerIds = playerIdMap[scorecardPlayerId];
          if (mainPlayerIds && mainPlayerIds.length > 0) {
            const mainPlayerId = mainPlayerIds[0]; // Use the first main ID
            if (playerStats[mainPlayerId]) {
              playerStats[mainPlayerId].wickets += bowler.wickets || 0;
              playerStats[mainPlayerId].overs += parseFloat(bowler.overs) || 0;
              playerStats[mainPlayerId].runsConceded += bowler.runs || 0;
              console.log('Added bowling stats for', mainPlayerId, ':', bowler.wickets, 'wickets');
            }
          } else {
            console.log('No mapping found for bowler ID:', scorecardPlayerId);
          }
        });
      });
    });

    console.log('Final player stats:', playerStats);
    return playerStats;
  };

  const calculateTeamStats = (teamMatches: Match[]) => {
    const completedMatches = teamMatches.filter(m => m.status === 'completed');
    const wins = completedMatches.filter(m => m.result?.winner === teamId).length;
    const losses = completedMatches.filter(m => m.result?.winner !== teamId && m.result?.winner).length;
    
    const scores = completedMatches.map(m => {
      const innings = Array.isArray(m.innings) ? m.innings : [];
      const teamInnings = innings.find(i => i.teamId === teamId);
      return teamInnings?.totalRuns || 0;
    }).filter(score => score > 0);
    
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const stats: TeamStats = {
      matchesPlayed: completedMatches.length,
      wins,
      losses,
      titles: 0, // Would need separate API call
      highestScore,
      lowestScore,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      winPercentage: completedMatches.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0
    };
    
    setTeamStats(stats);
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const safeName = (player.name || '').toLowerCase();
      const safeRole = player.role || '';
      const matchesSearch = safeName.includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'all' || safeRole === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [players, searchQuery, selectedRole]);

  const recentMatches: RecentMatch[] = useMemo(() => {
    return matches.map(match => {
      const isTeam1 = match.team1?.id === teamId;
      const opponent = isTeam1 ? match.team2?.name : match.team1?.name;
      const innings = Array.isArray(match.innings) ? match.innings : [];
      const teamInnings = innings.find(i => i.teamId === teamId);
      const score = teamInnings ? `${teamInnings.totalRuns}/${teamInnings.wickets}` : 'N/A';
      
      return {
        id: match.id,
        opponent: opponent || 'Unknown',
        result: match.status === 'completed' 
          ? (match.result?.winner === teamId ? 'win' : 'loss')
          : 'upcoming',
        score,
        date: match.date || 'TBD',
        venue: match.venue || 'TBD',
        team1: match.team1,
        team2: match.team2
      };
    });
  }, [matches, teamId]);

  // ── Helpers to normalise admin scorecard data for export ──────
  const buildExportData = (sc: any) => {
    const mi = sc.matchInfo || {};
    const t1 = mi.team1?.shortName || mi.team1?.name || (typeof mi.team1 === 'string' ? mi.team1 : 'Team 1');
    const t2 = mi.team2?.shortName || mi.team2?.name || (typeof mi.team2 === 'string' ? mi.team2 : 'Team 2');
    const t1id = mi.team1?.id ?? mi.team1;
    const t2id = mi.team2?.id ?? mi.team2;
    const innings: any[] = sc.innings || [];

    // Resolve battingTeamId to correct team name
    const resolveTeam = (inn: any, idx: number): string => {
      if (inn.teamName) return inn.teamName;
      const btid = inn.battingTeamId ?? inn.teamId;
      if (btid != null) {
        if (String(btid) === String(t1id)) return t1;
        if (String(btid) === String(t2id)) return t2;
      }
      if (inn.inningsNumber === 1) return t1;
      if (inn.inningsNumber === 2) return t2;
      return idx === 0 ? t1 : t2;
    };

    // Build per-innings batting / bowling arrays
    const inningsData = innings.map((inn: any, idx: number) => {
      const teamName = resolveTeam(inn, idx);
      const batting = (inn.batting || []).map((b: any) => ({
        name: b.name || b.batsman || '',
        runs: Number(b.runs) || 0,
        balls: Number(b.balls) || 0,
        fours: Number(b.fours ?? b['4s'] ?? 0),
        sixes: Number(b.sixes ?? b['6s'] ?? 0),
        strikeRate: b.balls > 0 ? ((Number(b.runs) / Number(b.balls)) * 100).toFixed(1) : '0.0',
        dismissal: typeof b.dismissal === 'object'
          ? (b.dismissal?.details || b.dismissal?.type || 'not out')
          : (b.dismissal || b.howOut || 'not out'),
      }));
      const bowling = (inn.bowling || []).map((bw: any) => ({
        name: bw.name || bw.bowler || '',
        overs: bw.overs ?? 0,
        maidens: bw.maidens ?? 0,
        runs: bw.runs ?? 0,
        wickets: bw.wickets ?? 0,
        economy: bw.economyRate ?? bw.economy ?? (bw.overs > 0 ? (Number(bw.runs) / Number(bw.overs)).toFixed(1) : '0.0'),
        wides: bw.wides ?? 0,
        noBalls: bw.noBalls ?? 0,
        dots: bw.dots ?? '-',
      }));
      const extras = inn.extras || {};
      const fow = (inn.fallOfWickets || []).map((f: any, i: number) => ({
        wicketNumber: i + 1,
        player: f.player || f.batsman || '',
        score: f.score || f.runs || '',
        over: f.over || '',
      }));
      const pps: any[] = [];
      if (inn.powerplays?.mandatory) pps.push({ type: 'Mandatory', overs: inn.powerplays.mandatory.overs || '', runs: inn.powerplays.mandatory.runs ?? '' });
      if (inn.powerplays?.optional)  pps.push({ type: 'Optional',  overs: inn.powerplays.optional.overs  || '', runs: inn.powerplays.optional.runs  ?? '' });
      if (inn.powerplay) pps.push({ type: 'Powerplay', overs: inn.powerplay.overs || '', runs: inn.powerplay.runs ?? '' });
      const partnerships = (inn.partnerships || []).map((p: any, i: number) => {
        // totalRuns can be "22(16)" meaning 22 runs in 16 balls
        const raw = String(p.totalRuns ?? p.runs ?? '');
        const tpMatch = raw.match(/^(\d+)\s*\((\d+)\)$/);
        const totalRuns  = tpMatch ? Number(tpMatch[1]) : (parseInt(raw) || 0);
        const totalBalls = tpMatch ? Number(tpMatch[2]) : 0;
        return {
          number: i + 1,
          batsman1: p.batsman1 || '',
          batsman1Runs: p.batsman1Runs ?? p.runs1 ?? '',
          batsman1Balls: p.batsman1Balls ?? p.balls1 ?? '',
          batsman2: p.batsman2 || '',
          batsman2Runs: p.batsman2Runs ?? p.runs2 ?? '',
          batsman2Balls: p.batsman2Balls ?? p.balls2 ?? '',
          totalRuns,
          totalBalls,
        };
      });
      return {
        teamName,
        totalRuns: inn.totalRuns ?? inn.total ?? '-',
        totalWickets: inn.totalWickets ?? inn.wickets ?? '-',
        totalOvers: inn.totalOvers ?? inn.overs ?? '-',
        batting,
        bowling,
        extras,
        fallOfWickets: fow,
        powerplays: pps,
        partnerships,
      };
    });

    return {
      matchInfo: {
        matchId: sc.matchId || sc.id || '',
        team1: t1,
        team2: t2,
        venue: mi.venue || '',
        date: mi.date || '',
        toss: mi.toss ? `${mi.toss.winner} won toss and chose to ${mi.toss.decision}` : '',
      },
      result: {
        winner: sc.result?.winner || '',
        margin: sc.result?.margin || '',
        manOfTheMatch: sc.result?.manOfTheMatch || '',
      },
      innings: inningsData,
    };
  };

  // Export Scorecard Function — pulls real data from admin scorecard
  const exportScorecard = async (format: 'excel' | 'csv' | 'json' | 'pdf') => {
    if (!selectedScorecard || !selectedScorecard.matchInfo) {
      alert('No scorecard data available for this match.');
      return;
    }

    const data = buildExportData(selectedScorecard);
    const t1 = data.matchInfo.team1;
    const t2 = data.matchInfo.team2;
    const fileName = `${t1}_vs_${t2}_Scorecard_${new Date().toISOString().split('T')[0]}`.replace(/\s+/g, '_');

    // ── JSON ─────────────────────────────────────────────────────
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fileName}.json`; a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // ── CSV ──────────────────────────────────────────────────────
    if (format === 'csv') {
      let csv = '';
      // Match Info
      csv += 'MATCH INFORMATION\n';
      csv += `Match ID,${data.matchInfo.matchId}\n`;
      csv += `Team 1,${t1}\nTeam 2,${t2}\n`;
      csv += `Venue,"${data.matchInfo.venue}"\nDate,${data.matchInfo.date}\n`;
      if (data.matchInfo.toss) csv += `Toss,"${data.matchInfo.toss}"\n`;
      csv += `Result,"${data.result.winner ? data.result.winner + ' won by ' + data.result.margin : 'Pending'}"\n`;
      if (data.result.manOfTheMatch) csv += `Man of the Match,${data.result.manOfTheMatch}\n`;
      csv += '\n';

      data.innings.forEach((inn: any, idx: number) => {
        csv += `INNINGS ${idx + 1} — ${inn.teamName}  (${inn.totalRuns}/${inn.totalWickets} in ${inn.totalOvers} overs)\n\n`;

        // Batting
        csv += 'BATTING\nBatter,Dismissal,Runs,Balls,4s,6s,SR\n';
        inn.batting.forEach((b: any) => {
          csv += `"${b.name}","${b.dismissal}",${b.runs},${b.balls},${b.fours},${b.sixes},${b.strikeRate}\n`;
        });
        // Extras
        const ex = inn.extras;
        csv += `\nExtras,"W ${ex.wides || 0}  NB ${ex.noBalls || 0}  B ${ex.byes || 0}  LB ${ex.legByes || 0}"\n`;
        csv += '\n';

        // Bowling
        csv += 'BOWLING\nBowler,Overs,Maidens,Runs,Wickets,Economy,Wides,No Balls,Dots\n';
        inn.bowling.forEach((bw: any) => {
          csv += `"${bw.name}",${bw.overs},${bw.maidens},${bw.runs},${bw.wickets},${bw.economy},${bw.wides},${bw.noBalls},${bw.dots}\n`;
        });
        csv += '\n';

        // Fall of Wickets
        if (inn.fallOfWickets.length > 0) {
          csv += 'FALL OF WICKETS\n#,Player,Score,Over\n';
          inn.fallOfWickets.forEach((f: any) => {
            csv += `${f.wicketNumber},"${f.player}",${f.score},${f.over}\n`;
          });
          csv += '\n';
        }

        // Powerplays
        if (inn.powerplays.length > 0) {
          csv += 'POWERPLAYS\nType,Overs,Runs\n';
          inn.powerplays.forEach((p: any) => {
            csv += `${p.type},${p.overs},${p.runs}\n`;
          });
          csv += '\n';
        }

        // Partnerships
        if (inn.partnerships.length > 0) {
          csv += 'PARTNERSHIPS\n#,Batsman 1,Runs,Balls,Batsman 2,Runs,Balls,Total Runs,Total Balls\n';
          inn.partnerships.forEach((p: any) => {
            csv += `${p.number},"${p.batsman1}",${p.batsman1Runs},${p.batsman1Balls},"${p.batsman2}",${p.batsman2Runs},${p.batsman2Balls},${p.totalRuns},${p.totalBalls}\n`;
          });
          csv += '\n';
        }
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fileName}.csv`; a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // ── EXCEL (HTML table → .xls) ────────────────────────────────
    if (format === 'excel') {
      const esc = (v: any) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;');
      let html = '<html><head><meta charset="utf-8"><style>';
      html += 'body{font-family:Calibri,Arial,sans-serif}';
      html += 'table{border-collapse:collapse;width:100%;margin-bottom:24px}';
      html += 'th,td{border:1px solid #bbb;padding:6px 10px;text-align:left}';
      html += 'th{background:#4B0082;color:#fff;font-weight:bold}';
      html += '.section{background:#f0e6ff;font-size:16px;font-weight:bold;padding:10px}';
      html += '.sub{background:#f9f5ff;font-weight:bold}';
      html += '</style></head><body>';

      // Match Info
      html += '<table><tr><td class="section" colspan="2">MATCH INFORMATION</td></tr>';
      html += `<tr><th>Match ID</th><td>${esc(data.matchInfo.matchId)}</td></tr>`;
      html += `<tr><th>Team 1</th><td>${esc(t1)}</td></tr>`;
      html += `<tr><th>Team 2</th><td>${esc(t2)}</td></tr>`;
      html += `<tr><th>Venue</th><td>${esc(data.matchInfo.venue)}</td></tr>`;
      html += `<tr><th>Date</th><td>${esc(data.matchInfo.date)}</td></tr>`;
      if (data.matchInfo.toss) html += `<tr><th>Toss</th><td>${esc(data.matchInfo.toss)}</td></tr>`;
      html += `<tr><th>Result</th><td>${data.result.winner ? esc(data.result.winner + ' won by ' + data.result.margin) : 'Pending'}</td></tr>`;
      if (data.result.manOfTheMatch) html += `<tr><th>Man of the Match</th><td>${esc(data.result.manOfTheMatch)}</td></tr>`;
      html += '</table>';

      data.innings.forEach((inn: any, idx: number) => {
        // Batting
        html += `<table><tr><td class="section" colspan="7">INNINGS ${idx + 1} — ${esc(inn.teamName)}  (${esc(inn.totalRuns)}/${esc(inn.totalWickets)}, ${esc(inn.totalOvers)} ov)</td></tr>`;
        html += '<tr><th>Batter</th><th>Dismissal</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>';
        inn.batting.forEach((b: any) => {
          html += `<tr><td><b>${esc(b.name)}</b></td><td>${esc(b.dismissal)}</td><td><b>${b.runs}</b></td><td>${b.balls}</td><td>${b.fours}</td><td>${b.sixes}</td><td>${b.strikeRate}</td></tr>`;
        });
        const ex = inn.extras;
        html += `<tr class="sub"><td>Extras</td><td colspan="6">W ${ex.wides||0}  NB ${ex.noBalls||0}  B ${ex.byes||0}  LB ${ex.legByes||0}</td></tr>`;
        html += '</table>';

        // Bowling
        html += `<table><tr><td class="section" colspan="9">BOWLING — ${esc(inn.teamName)}</td></tr>`;
        html += '<tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th><th>Wd</th><th>NB</th><th>Dots</th></tr>';
        inn.bowling.forEach((bw: any) => {
          html += `<tr><td><b>${esc(bw.name)}</b></td><td>${bw.overs}</td><td>${bw.maidens}</td><td>${bw.runs}</td><td><b>${bw.wickets}</b></td><td>${bw.economy}</td><td>${bw.wides}</td><td>${bw.noBalls}</td><td>${bw.dots}</td></tr>`;
        });
        html += '</table>';

        // Fall of Wickets
        if (inn.fallOfWickets.length > 0) {
          html += `<table><tr><td class="section" colspan="4">FALL OF WICKETS — ${esc(inn.teamName)}</td></tr>`;
          html += '<tr><th>#</th><th>Player</th><th>Score</th><th>Over</th></tr>';
          inn.fallOfWickets.forEach((f: any) => {
            html += `<tr><td>${f.wicketNumber}</td><td>${esc(f.player)}</td><td>${esc(f.score)}</td><td>${esc(f.over)}</td></tr>`;
          });
          html += '</table>';
        }

        // Powerplays
        if (inn.powerplays.length > 0) {
          html += `<table><tr><td class="section" colspan="3">POWERPLAYS — ${esc(inn.teamName)}</td></tr>`;
          html += '<tr><th>Type</th><th>Overs</th><th>Runs</th></tr>';
          inn.powerplays.forEach((p: any) => {
            html += `<tr><td>${esc(p.type)}</td><td>${esc(p.overs)}</td><td>${esc(p.runs)}</td></tr>`;
          });
          html += '</table>';
        }

        // Partnerships
        if (inn.partnerships.length > 0) {
          html += `<table><tr><td class="section" colspan="9">PARTNERSHIPS — ${esc(inn.teamName)}</td></tr>`;
          html += '<tr><th>#</th><th>Batsman 1</th><th>Runs</th><th>Balls</th><th>Batsman 2</th><th>Runs</th><th>Balls</th><th>Total Runs</th><th>Total Balls</th></tr>';
          inn.partnerships.forEach((p: any) => {
            html += `<tr><td>${p.number}</td><td>${esc(p.batsman1)}</td><td>${esc(p.batsman1Runs)}</td><td>${esc(p.batsman1Balls)}</td><td>${esc(p.batsman2)}</td><td>${esc(p.batsman2Runs)}</td><td>${esc(p.batsman2Balls)}</td><td>${esc(p.totalRuns)}</td><td>${esc(p.totalBalls)}</td></tr>`;
          });
          html += '</table>';
        }
      });

      html += '</body></html>';
      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fileName}.xls`; a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // ── PDF ──────────────────────────────────────────────────────
    if (format === 'pdf') {
      try {
        const { exportScorecardAsPDF } = await import('./scorecard-pdf-export');
        await exportScorecardAsPDF(selectedScorecard);
      } catch (err) {
        console.error('PDF export failed:', err);
        alert('PDF export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(145deg, #0a0015 0%, #1a0a2e 30%, #0f172a 60%, #1e1b4b 100%)',
      }}>
        {/* Animated background for loading */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-30"
            style={{ background: 'conic-gradient(from 0deg, #8b5cf6, #ec4899, #06b6d4, #8b5cf6)' }}
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div
            className="relative"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #8b5cf6, #ec4899, #06b6d4, transparent)',
              }}
            />
            <div className="absolute inset-2 rounded-full" style={{ background: '#0a0015' }} />
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <CI.IconCricketBat size={30} className="inline-block" />
            </motion.div>
          </motion.div>
          <motion.p
            className="text-white/70 text-lg font-medium tracking-wide"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Loading team details...
          </motion.p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(145deg, #0a0015 0%, #1a0a2e 30%, #0f172a 60%, #1e1b4b 100%)',
      }}>
        <div className="absolute inset-0">
          <motion.div
            className="absolute w-[400px] h-[400px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] opacity-20"
            style={{ background: 'conic-gradient(from 0deg, #ef4444, #f97316, #ef4444)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.div 
          className="text-center relative z-10 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="text-8xl mb-6"
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <CI.IconSearch size={72} className="inline-block" />
          </motion.div>
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Team Not Found
          </h1>
          <p className="text-xl text-white/60 mb-8 max-w-md mx-auto">
            The team you're looking for doesn't exist or has been moved.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link 
              href="/wpl/teams" 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                boxShadow: '0 4px 30px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
              }}
            >
              <span>←</span>
              <span>Back to Teams</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const teamColors = team.colors || { primary: '#8B5CF6', secondary: '#F59E0B' };
  
  const getLogoUrl = () => {
    if (team.logo && team.logo.startsWith('/logos/')) {
      return team.logo;
    }
    
    switch (team.shortName) {
      case 'RCB-W': return '/logos/wpl_rcb_logo_animated.svg';
      case 'MI-W': return '/logos/wpl_mi_logo_animated.svg';
      case 'DC-W': return '/logos/wpl_dc_logo_animated.svg';
      case 'GG-W': return '/logos/wpl_gg_logo_animated.svg';
      case 'UPW': return '/logos/wpl_upw_logo_animated.svg';
      case 'RCB': return '/logos/rcb_logo_animated.svg';
      case 'MI': return '/logos/mi_logo_animated.svg';
      case 'CSK': return '/logos/csk_logo_animated.svg';
      case 'KKR': return '/logos/kkr_logo_animated.svg';
      case 'SRH': return '/logos/srh_logo_animated.svg';
      case 'RR': return '/logos/rr_logo_animated.svg';
      case 'PBKS': return '/logos/pbks_logo_animated.svg';
      case 'LSG': return '/logos/lsg_logo_animated.svg';
      case 'GT': return '/logos/gt_logo_animated.svg';
      case 'DC': return '/logos/dc_logo_animated.svg';
      default: return team.logo || null;
    }
  };
  
  const logoUrl = getLogoUrl();

  return (
    <div ref={containerRef} className="min-h-screen font-sans antialiased" style={{
      background: `linear-gradient(145deg, #0a0015 0%, #1a0a2e 20%, #0f172a 40%, #1e1b4b 60%, #0a0015 100%)`,
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Premium Animated Background with Mesh Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated mesh gradient base */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(124, 58, 237, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse 60% 60% at 80% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 70% 70% at 50% 90%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 50% 80% at 10% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)
          `,
        }} />
        
        {/* Animated color waves */}
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 100% 100% at 0% 0%, rgba(139, 92, 246, 0.4) 0%, transparent 50%)",
              "radial-gradient(ellipse 100% 100% at 100% 0%, rgba(236, 72, 153, 0.4) 0%, transparent 50%)",
              "radial-gradient(ellipse 100% 100% at 100% 100%, rgba(6, 182, 212, 0.4) 0%, transparent 50%)",
              "radial-gradient(ellipse 100% 100% at 0% 100%, rgba(168, 85, 247, 0.4) 0%, transparent 50%)",
              "radial-gradient(ellipse 100% 100% at 0% 0%, rgba(139, 92, 246, 0.4) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        />
        
        {/* Premium floating particles with glow */}
        {[...Array(30)].map((_, i) => {
          const size = Math.random() * 4 + 1;
          const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#a855f7', '#f472b6'];
          const color = colors[i % colors.length];
          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: color,
                boxShadow: `0 0 ${size * 3}px ${color}80, 0 0 ${size * 6}px ${color}40`,
              }}
              animate={{
                x: [0, Math.random() * 150 - 75, Math.random() * 100 - 50, 0],
                y: [0, Math.random() * 150 - 75, Math.random() * 100 - 50, 0],
                opacity: [0.2, 0.8, 0.4, 0.2],
                scale: [1, 1.5, 0.8, 1],
              }}
              transition={{
                duration: Math.random() * 15 + 15,
                repeat: Infinity,
                delay: Math.random() * 8,
                ease: "easeInOut"
              }}
            />
          );
        })}
        
        {/* Premium geometric shapes with gradient borders */}
        {[...Array(12)].map((_, i) => {
          const size = Math.random() * 120 + 60;
          const isCircle = Math.random() > 0.5;
          return (
            <motion.div
              key={`shape-${i}`}
              className="absolute"
              style={{
                width: size,
                height: size,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                borderRadius: isCircle ? '50%' : '20%',
                background: 'transparent',
                border: '1px solid',
                borderImage: `linear-gradient(${Math.random() * 360}deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2), rgba(6, 182, 212, 0.3)) 1`,
              }}
              animate={{
                rotate: [0, isCircle ? 360 : 90, isCircle ? 720 : 180],
                scale: [1, 1.15, 0.9, 1],
                opacity: [0.15, 0.35, 0.2, 0.15],
              }}
              transition={{
                duration: Math.random() * 25 + 25,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          );
        })}
        
        {/* Enhanced animated aurora effect instead of mouse-following */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none opacity-40"
          style={{
            background: `conic-gradient(from 0deg, ${teamColors.primary}, ${teamColors.secondary}, #ec4899, #8b5cf6, ${teamColors.primary})`,
          }}
          animate={{
            x: ['-10%', '60%', '30%', '-10%'],
            y: ['-10%', '30%', '60%', '-10%'],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none opacity-30"
          style={{
            background: `conic-gradient(from 180deg, #06b6d4, #8b5cf6, #f472b6, #06b6d4)`,
          }}
          animate={{
            x: ['70%', '10%', '50%', '70%'],
            y: ['60%', '20%', '-10%', '60%'],
            rotate: [360, 180, 0],
            scale: [0.9, 1.1, 1, 0.9],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Premium Sticky Navigation Bar */}
      <motion.nav 
        className="sticky top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 25 }}
        style={{
          background: 'linear-gradient(180deg, rgba(15, 10, 30, 0.95) 0%, rgba(15, 10, 30, 0.85) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
          boxShadow: '0 4px 30px rgba(139, 92, 246, 0.1), 0 1px 0 rgba(255, 255, 255, 0.05) inset',
        }}
      >
        {/* Animated Progress Bar */}
        <motion.div
          className="absolute top-0 left-0 h-[2px] origin-left"
          style={{ 
            scaleX,
            background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #06b6d4, #8b5cf6)',
            backgroundSize: '300% 100%',
          }}
        />
        <motion.div
          className="absolute top-0 left-0 h-[2px] w-full opacity-50"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            backgroundSize: '200% 100%',
          }}
        />
        
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Enhanced Team Logo and Name */}
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/wpl/teams" className="flex items-center gap-2 text-white/70 hover:text-white transition-all duration-300 group">
                  <motion.span
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="text-lg"
                  >
                    <CI.IconBack size={18} className="inline-block" />
                  </motion.span>
                  <span className="hidden sm:inline text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">Teams</span>
                </Link>
              </motion.div>
              
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
              >
                {logoUrl ? (
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="relative"
                  >
                    <Image 
                      src={logoUrl} 
                      alt={team.name} 
                      className="w-10 h-10 object-contain drop-shadow-lg"
                      width={40}
                      height={40}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                    <span className="text-white font-black text-lg">{team.shortName?.charAt(0) || 'T'}</span>
                  </motion.div>
                )}
                <div className="hidden md:block">
                  <motion.div 
                    className="text-white font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.05 }}
                  >
                    {team.shortName}
                  </motion.div>
                  <div className="text-white/60 text-xs font-medium">Women's Premier League</div>
                </div>
              </motion.div>
            </div>
            
            {/* Enhanced Primary Navigation - Desktop with Premium UI */}
            <div className="hidden md:flex items-center gap-3 relative">
              {/* Floating indicator background */}
              <motion.div
                className="absolute h-full rounded-2xl pointer-events-none"
                layoutId="activeTabIndicator"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              
              {[
                { id: 'overview', label: 'Overview', icon: <CI.IconTarget size={20} className="inline-block" />, gradient: 'from-purple-500 via-violet-500 to-purple-600', glow: 'rgba(139, 92, 246, 0.5)' },
                { id: 'squad', label: 'Squad', icon: <CI.IconSquad size={20} className="inline-block" />, gradient: 'from-emerald-500 via-green-500 to-teal-600', glow: 'rgba(16, 185, 129, 0.5)' },
                { id: 'matches', label: 'Matches', icon: <CI.IconCalendar size={20} className="inline-block" />, gradient: 'from-orange-500 via-red-500 to-pink-600', glow: 'rgba(249, 115, 22, 0.5)' },
                { id: 'stats', label: 'Stats', icon: <CI.IconChart size={20} className="inline-block" />, gradient: 'from-blue-500 via-cyan-500 to-sky-600', glow: 'rgba(59, 130, 246, 0.5)' },
                { id: 'about', label: 'About', icon: <CI.IconStar size={20} className="inline-block" />, gradient: 'from-yellow-500 via-amber-500 to-orange-600', glow: 'rgba(234, 179, 8, 0.5)' }
              ].map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative group px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-500 overflow-hidden ${
                    activeTab === item.id
                      ? 'text-white shadow-2xl'
                      : 'text-white/60 hover:text-white'
                  }`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: 1.08, 
                    y: -3,
                    rotateX: 5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: activeTab === item.id 
                      ? `linear-gradient(135deg, ${item.gradient})`
                      : 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(12px)',
                    border: activeTab === item.id 
                      ? '1px solid rgba(255, 255, 255, 0.2)' 
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: activeTab === item.id
                      ? `0 10px 40px ${item.glow}, 0 0 20px ${item.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                      : 'none',
                  }}
                >
                  {/* Glossy overlay effect */}
                  {activeTab === item.id && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%)',
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Shimmer effect on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                      backgroundSize: '200% 100%',
                    }}
                    animate={{
                      backgroundPosition: ['200% 0', '-200% 0'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  {/* Animated particles for active tab */}
                  {activeTab === item.id && (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 rounded-full bg-white"
                          style={{
                            left: `${20 + i * 30}%`,
                            top: '50%',
                          }}
                          animate={{
                            y: [0, -20, 0],
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Content */}
                  <span className="relative z-10 flex items-center gap-2.5">
                    <motion.span
                      className="text-lg"
                      animate={{ 
                        rotate: activeTab === item.id ? [0, -10, 10, -5, 5, 0] : 0,
                        scale: activeTab === item.id ? [1, 1.2, 1] : 1
                      }}
                      transition={{ 
                        duration: activeTab === item.id ? 2 : 0.3,
                        ease: "easeInOut",
                        repeat: activeTab === item.id ? Infinity : 0,
                        repeatDelay: 1
                      }}
                    >
                      {item.icon}
                    </motion.span>
                    <span className="font-medium">{item.label}</span>
                  </span>
                  
                  {/* Active indicator with enhanced animation */}
                  {activeTab === item.id && (
                    <>
                      <motion.div
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r rounded-full"
                        style={{
                          backgroundImage: `linear-gradient(90deg, ${item.color})`
                        }}
                        layoutId="activeNavIndicator"
                        transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
                      />
                      <motion.div
                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white/20 rounded-full blur-md"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </>
                  )}
                </motion.button>
              ))}
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Search Button */}
              <motion.button 
                className="relative p-3 text-white/70 hover:text-white rounded-xl transition-all duration-300 overflow-hidden group"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <motion.span
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10 text-lg"
                >
                  <CI.IconSearch size={20} className="inline-block" />
                </motion.span>
              </motion.button>
              
              {/* Favorite Button */}
              <motion.button 
                className="relative p-3 text-white/70 hover:text-white rounded-xl transition-all duration-300 overflow-hidden group"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10 text-lg"
                >
                  <CI.IconHeart size={20} className="inline-block" />
                </motion.span>
              </motion.button>
              
              {/* Mobile Menu Button */}
              <motion.button 
                className="md:hidden relative p-3 text-white/70 hover:text-white rounded-xl transition-all duration-300 overflow-hidden group"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <motion.span
                  animate={{ 
                    rotate: showMobileMenu ? [0, 360] : [0, -10, 10, 0],
                    scale: showMobileMenu ? [1, 1.3, 1] : [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: showMobileMenu ? 0.6 : 3,
                    ease: "easeInOut",
                    repeat: showMobileMenu ? 0 : Infinity
                  }}
                  className="relative z-10 text-xl"
                >
                  {showMobileMenu ? <CI.IconSparkle size={20} className="inline-block" /> : <CI.IconMobile size={20} className="inline-block" />}
                </motion.span>
              </motion.button>
            </div>
          </div>
          
          {/* Mobile Navigation Menu - Enhanced Premium Design */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="md:hidden border-t mt-2 pt-4 overflow-hidden"
                style={{
                  borderImage: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent) 1',
                }}
              >
                {/* Premium glassmorphic container */}
                <div className="relative p-4 rounded-2xl mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Animated background effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-30"
                    style={{
                      background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                    }}
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  />
                  
                  <div className="relative z-10 grid grid-cols-2 gap-3 pb-3">
                    {[
                      { id: 'overview', label: 'Overview', icon: <CI.IconTarget size={18} className="inline-block" />, gradient: 'from-purple-500 to-violet-600', glow: 'rgba(139, 92, 246, 0.4)' },
                      { id: 'squad', label: 'Squad', icon: <CI.IconSquad size={18} className="inline-block" />, gradient: 'from-emerald-500 to-teal-600', glow: 'rgba(16, 185, 129, 0.4)' },
                      { id: 'matches', label: 'Matches', icon: <CI.IconCalendar size={18} className="inline-block" />, gradient: 'from-orange-500 to-pink-600', glow: 'rgba(249, 115, 22, 0.4)' },
                      { id: 'stats', label: 'Stats', icon: <CI.IconChart size={18} className="inline-block" />, gradient: 'from-blue-500 to-cyan-600', glow: 'rgba(59, 130, 246, 0.4)' },
                      { id: 'about', label: 'About', icon: <CI.IconStar size={18} className="inline-block" />, gradient: 'from-yellow-500 to-orange-600', glow: 'rgba(234, 179, 8, 0.4)' }
                    ].map((item, index) => (
                      <motion.button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowMobileMenu(false);
                        }}
                        className={`relative group flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden ${
                          activeTab === item.id
                            ? 'text-white shadow-xl'
                            : 'text-white/60 hover:text-white'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: index * 0.05,
                          type: "spring",
                          stiffness: 200,
                          damping: 20
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          background: activeTab === item.id 
                            ? `linear-gradient(135deg, ${item.gradient})`
                            : 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          border: activeTab === item.id 
                            ? '1px solid rgba(255, 255, 255, 0.2)' 
                            : '1px solid rgba(255, 255, 255, 0.05)',
                          boxShadow: activeTab === item.id
                            ? `0 8px 24px ${item.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                            : 'none',
                        }}
                      >
                        {/* Glossy overlay */}
                        {activeTab === item.id && (
                          <motion.div
                            className="absolute inset-0 rounded-xl"
                            style={{
                              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%)',
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                        
                        {/* Shimmer on hover */}
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100"
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                            backgroundSize: '200% 100%',
                          }}
                          animate={{
                            backgroundPosition: ['200% 0', '-200% 0'],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                        
                        <motion.span
                          animate={{ 
                            rotate: activeTab === item.id ? [0, -10, 10, 0] : 0,
                            scale: activeTab === item.id ? [1, 1.2, 1] : 1
                          }}
                          transition={{ 
                            duration: activeTab === item.id ? 1.5 : 0.3,
                            ease: "easeInOut",
                            repeat: activeTab === item.id ? Infinity : 0,
                            repeatDelay: 0.5
                          }}
                          className="relative z-10 text-lg"
                        >
                          {item.icon}
                        </motion.span>
                        <span className="relative z-10 font-semibold">{item.label}</span>
                        
                        {/* Active pulse indicator */}
                        {activeTab === item.id && (
                          <motion.div
                            className="absolute right-2 w-2 h-2 rounded-full bg-white"
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [1, 0.5, 1]
                            }}
                            transition={{ 
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                  
                  {/* Enhanced Mobile Quick Actions */}
                  <div className="relative z-10 flex gap-3 pt-3 border-t border-white/10">
                    <motion.button 
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-all group relative overflow-hidden"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
                        }}
                      />
                      <motion.span 
                        className="relative z-10 text-base"
                        whileHover={{ rotate: 360, scale: 1.2 }}
                        transition={{ duration: 0.6 }}
                      >
                        <CI.IconSearch size={18} className="inline-block" />
                      </motion.span>
                      <span className="relative z-10">Search</span>
                    </motion.button>
                    <motion.button 
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-all group relative overflow-hidden"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(239, 68, 68, 0.2))',
                        }}
                      />
                      <motion.span 
                        className="relative z-10 text-base"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <CI.IconHeart size={18} className="inline-block" />
                      </motion.span>
                      <span className="relative z-10">Share</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Original Header - Now simplified */}
      <motion.header
        style={{ opacity: headerOpacity, scale: headerScale }}
        className="relative z-10 bg-black/20 backdrop-blur-lg border-b border-white/10"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-white/60 text-sm">
              Season 2026 • WPL
            </div>
            <div className="flex items-center gap-4 text-white/60 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>2.3M</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                <span>3 Titles</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Enhanced Hero Section with Dynamic Content */}
      <section className="relative z-10 py-24">
        {/* Enhanced floating orbs animation */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${teamColors.primary}50, ${teamColors.secondary}30, transparent)`,
          }}
          animate={{
            x: ['0%', '50%', '25%', '0%'],
            y: ['0%', '25%', '50%', '0%'],
            scale: [1, 1.3, 0.8, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <div className="container mx-auto px-4">
          <motion.div
            ref={heroRef}
            style={{
              scale: scaleSpring,
              rotate: rotateSpring,
              opacity: opacityValue,
            }}
            className="text-center"
          >
            {/* Enhanced Team Logo with Advanced Animations */}
            <div className="relative inline-block mb-12">
              {/* Floating particles around logo */}
              <motion.div
                className="absolute inset-0 -z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    style={{
                      left: `${50 + Math.cos((i * 60) * Math.PI / 180) * 80}px`,
                      top: `${50 + Math.sin((i * 60) * Math.PI / 180) * 80}px`,
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>

            {/* Modern Enhanced Header with Professional Typography */}
            <motion.div
              className="relative z-10 text-center mb-12"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              {/* Team Badge/Logo Container */}
              <motion.div
                className="relative inline-block mb-8"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <div className="relative">
                  {/* Animated Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from 0deg, ${teamColors.primary}, ${teamColors.secondary}, ${WPLColors.accent}, ${teamColors.primary})`,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-gray-900 to-gray-800 p-1">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={`${team.name} Logo`}
                          width={120}
                          height={120}
                          className="w-24 h-24 md:w-32 md:h-32 object-contain filter drop-shadow-2xl"
                          style={{
                            filter: `drop-shadow(0 0 20px ${teamColors.primary}80)`,
                          }}
                        />
                      ) : (
                        <motion.div
                          className="text-6xl md:text-7xl font-black"
                          style={{
                            background: `linear-gradient(135deg, ${teamColors.primary}, ${teamColors.secondary})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {team.shortName?.charAt(0) || 'T'}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Team Name with Modern Typography */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <h1 
                  className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none"
                  style={{
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: WPLColors.textPrimary,
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                    fontWeight: 900,
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    textShadow: '4px 4px 8px rgba(0, 0, 0, 0.9)',
                  }}
                >
                  <motion.span
                    className="block"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    {team.name}
                  </motion.span>
                </h1>

                {/* Team Short Name with Enhanced Visibility */}
                <motion.div
                  className="text-2xl md:text-3xl lg:text-4xl font-bold"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  style={{
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: WPLColors.textSecondary,
                    textShadow: `
                      0 0 10px ${teamColors.secondary}60,
                      0 0 20px ${teamColors.secondary}40,
                      0 2px 4px rgba(0, 0, 0, 0.8),
                      0 4px 8px rgba(0, 0, 0, 0.6)
                    `,
                    background: `linear-gradient(135deg, 
                      ${WPLColors.textSecondary} 0%, 
                      ${teamColors.secondary} 50%, 
                      ${WPLColors.textSecondary} 100%
                    )`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))',
                    letterSpacing: '0.02em',
                  }}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {team.shortName}
                </motion.div>
              </motion.div>

              {/* Modern Status Badges */}
              <motion.div
                className="flex flex-wrap justify-center gap-4 mt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <motion.div
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2"
                  style={{
                    ...getWPLGlassmorphism('primary', 20),
                    borderColor: WPLColors.primaryRGBA[60],
                    background: `linear-gradient(135deg, ${WPLColors.primaryRGBA[20]}, ${WPLColors.primaryRGBA[10]})`,
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: `0 10px 30px ${WPLColors.primaryRGBA[40]}`,
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Crown className="w-5 h-5" style={{ color: WPLColors.accent }} />
                  </motion.div>
                  <span 
                    className="font-bold text-lg"
                    style={{
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: WPLColors.textPrimary,
                      textShadow: `0 0 10px ${WPLColors.primaryRGBA[60]}`
                    }}
                  >
                    {team.shortName}
                  </span>
                </motion.div>

                <motion.div
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2"
                  style={{
                    ...getWPLGlassmorphism('secondary', 20),
                    borderColor: WPLColors.secondaryRGBA[60],
                    background: `linear-gradient(135deg, ${WPLColors.secondaryRGBA[20]}, ${WPLColors.secondaryRGBA[10]})`,
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: `0 10px 30px ${WPLColors.secondaryRGBA[40]}`,
                  }}
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, -10, 10, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Flame className="w-5 h-5" style={{ color: WPLColors.warning }} />
                  </motion.div>
                  <span 
                    className="font-bold text-lg"
                    style={{
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: WPLColors.textPrimary,
                      textShadow: `0 0 10px ${WPLColors.secondaryRGBA[60]}`
                    }}
                  >
                    Women's Premier League
                  </span>
                  <motion.div>
                    <Trophy className="w-5 h-5" style={{ color: WPLColors.accent }} />
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Dynamic Team Stats Bar */}
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <motion.div 
                        className="text-2xl font-black text-white mb-1"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 1.0 }}
                      >
                        {leaguePosition > 0 ? `#${leaguePosition}` : '-'}
                      </motion.div>
                      <div className="text-sm text-white/70">League Position</div>
                    </div>
                    <div className="text-center">
                      <motion.div 
                        className="text-2xl font-black mb-1"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 1.1 }}
                        style={{
                          color: last5Games.startsWith('W') ? '#10b981' : 
                                 last5Games.startsWith('L') ? '#ef4444' : '#ffffff'
                        }}
                      >
                        {last5Games || '-'}
                      </motion.div>
                      <div className="text-sm text-white/70">Last 5 Games</div>
                    </div>
                    <div className="text-center">
                      <motion.div 
                        className="text-2xl font-black text-white mb-1"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                      >
                        {winRate > 0 ? `${Math.round(winRate)}%` : '-'}
                      </motion.div>
                      <div className="text-sm text-white/70">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <motion.div 
                        className="text-2xl font-black mb-1"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 1.3 }}
                        style={{
                          color: netRunRate > 0 ? '#facc15' : 
                                 netRunRate < 0 ? '#ef4444' : '#ffffff'
                        }}
                      >
                        {netRunRate !== 0 ? (netRunRate > 0 ? '+' : '') + netRunRate.toFixed(2) : '-'}
                      </motion.div>
                      <div className="text-sm text-white/70">Net RR</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

            {/* Enhanced Quick Stats with AI-Inspired Design */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16"
            >
              {teamStats && (
                <>
                  {/* Matches Stat Card */}
                  <motion.div
                    className="relative group"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.05,
                      rotateY: 5,
                      z: 50
                    }}
                    style={{
                      ...getWPLGlassmorphism('purple', 20),
                      border: `1px solid ${teamColors.primary}40`,
                    }}
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: `linear-gradient(135deg, ${teamColors.primary}20, ${teamColors.secondary}20)`,
                        }}
                        animate={{
                          background: [
                            `linear-gradient(135deg, ${teamColors.primary}20, ${teamColors.secondary}20)`,
                            `linear-gradient(225deg, ${teamColors.secondary}20, ${teamColors.primary}20)`,
                            `linear-gradient(315deg, ${teamColors.primary}20, ${teamColors.secondary}20)`,
                          ],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    
                    <div className="relative z-10 p-6">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="mb-3"
                      >
                        <Calendar className="w-6 h-6 text-blue-400" />
                      </motion.div>
                      <motion.div 
                        className="text-4xl font-black text-white mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2, delay: 0.8 }}
                      >
                        {teamStats.matchesPlayed}
                      </motion.div>
                      <div className="text-white/70 text-sm font-medium">Matches</div>
                      
                      {/* Animated progress ring */}
                      <motion.div
                        className="absolute -top-2 -right-2 w-12 h-12 rounded-full border-2 border-blue-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                      >
                        <motion.div
                          className="w-full h-full rounded-full border-2 border-blue-400 border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Wins Stat Card */}
                  <motion.div
                    className="relative group"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.05,
                      rotateY: -5,
                      z: 50
                    }}
                    style={{
                      ...getWPLGlassmorphism('pink', 20),
                      border: `1px solid ${teamColors.secondary}40`,
                    }}
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: `linear-gradient(135deg, ${teamColors.secondary}20, #10b98120)`,
                        }}
                        animate={{
                          background: [
                            `linear-gradient(135deg, ${teamColors.secondary}20, #10b98120)`,
                            `linear-gradient(225deg, #10b98120, ${teamColors.secondary}20)`,
                            `linear-gradient(315deg, ${teamColors.secondary}20, #10b98120)`,
                          ],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    
                    <div className="relative z-10 p-6">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="mb-3"
                      >
                        <Trophy className="w-6 h-6 text-green-400" />
                      </motion.div>
                      <motion.div 
                        className="text-4xl font-black text-green-400 mb-2"
                        initial={{ count: 0 }}
                        animate={{ count: teamStats.wins }}
                        transition={{ duration: 2, delay: 0.9 }}
                      >
                        {teamStats.wins}
                      </motion.div>
                      <div className="text-white/70 text-sm font-medium">Wins</div>
                      
                      {/* Victory particles */}
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-green-400 rounded-full"
                          style={{
                            top: `${20 + i * 15}px`,
                            right: `${10 + i * 5}px`,
                          }}
                          animate={{
                            y: [0, -10, 0],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* Win Rate Stat Card */}
                  <motion.div
                    className="relative group"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.05,
                      rotateY: 5,
                      z: 50
                    }}
                    style={{
                      ...getWPLGlassmorphism('violet', 20),
                      border: `1px solid #a855f740`,
                    }}
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: `linear-gradient(135deg, #a855f720, #f59e0b20)`,
                        }}
                        animate={{
                          background: [
                            `linear-gradient(135deg, #a855f720, #f59e0b20)`,
                            `linear-gradient(225deg, #f59e0b20, #a855f720)`,
                            `linear-gradient(315deg, #a855f720, #f59e0b20)`,
                          ],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    
                    <div className="relative z-10 p-6">
                      <motion.div
                        animate={{ rotate: [-10, 10, -10] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="mb-3"
                      >
                        <Target className="w-6 h-6 text-purple-400" />
                      </motion.div>
                      <motion.div 
                        className="text-4xl font-black text-white mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2, delay: 1 }}
                      >
                        {teamStats.winPercentage}%
                      </motion.div>
                      <div className="text-white/70 text-sm font-medium">Win Rate</div>
                      
                      {/* Animated percentage indicator */}
                      <motion.div
                        className="absolute bottom-2 left-2 right-2 h-1 bg-white/20 rounded-full overflow-hidden"
                      >
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${teamStats.winPercentage}%` }}
                          transition={{ duration: 2, delay: 1.2, ease: "easeOut" }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Highest Score Stat Card */}
                  <motion.div
                    className="relative group"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.05,
                      rotateY: -5,
                      z: 50
                    }}
                    style={{
                      ...getWPLGlassmorphism('orange', 20),
                      border: `1px solid #fb923c40`,
                    }}
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: `linear-gradient(135deg, #fb923c20, #ef444420)`,
                        }}
                        animate={{
                          background: [
                            `linear-gradient(135deg, #fb923c20, #ef444420)`,
                            `linear-gradient(225deg, #ef444420, #fb923c20)`,
                            `linear-gradient(315deg, #fb923c20, #ef444420)`,
                          ],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    
                    <div className="relative z-10 p-6">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="mb-3"
                      >
                        <Zap className="w-6 h-6 text-yellow-400" />
                      </motion.div>
                      <motion.div 
                        className="text-4xl font-black text-yellow-400 mb-2"
                        initial={{ count: 0 }}
                        animate={{ count: teamStats.highestScore }}
                        transition={{ duration: 2, delay: 1.1 }}
                      >
                        {teamStats.highestScore}
                      </motion.div>
                      <div className="text-white/70 text-sm font-medium">Highest Score</div>
                      
                      {/* Lightning bolt animation */}
                      <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Zap className="w-4 h-4 text-yellow-300" />
                      </motion.div>
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="relative z-10 py-12">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                  {/* Recent Matches - Moved to separate Matches tab */}

                {/* Enhanced Key Players Panel */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative"
                  style={{
                    ...getWPLGlassmorphism('purple', 20),
                    border: `1px solid ${teamColors.primary}30`,
                    borderRadius: '1.5rem',
                  }}
                >
                  {/* Animated background gradient */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-30"
                    style={{
                      background: `linear-gradient(135deg, ${teamColors.primary}20, ${teamColors.secondary}20)`,
                    }}
                    animate={{
                      background: [
                        `linear-gradient(135deg, ${teamColors.primary}20, ${teamColors.secondary}20)`,
                        `linear-gradient(225deg, ${teamColors.secondary}20, ${teamColors.primary}20)`,
                        `linear-gradient(315deg, ${teamColors.primary}20, ${teamColors.secondary}20)`,
                      ],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
                  
                  <div className="relative z-10 p-8">
                    <motion.div 
                      className="flex items-center gap-3 mb-8"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Star className="w-8 h-8 text-yellow-400" />
                      </motion.div>
                      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                        Key Players
                      </h2>
                      <motion.div
                        className="ml-auto"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      </motion.div>
                    </motion.div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      {players.slice(0, 3).map((player, index) => (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                          whileHover={{ 
                            scale: 1.05,
                            rotateY: 5,
                            z: 50,
                            transition: { duration: 0.3 }
                          }}
                          whileTap={{ scale: 0.95 }}
                          className="relative group overflow-hidden rounded-2xl"
                          style={{
                            ...getWPLGlassmorphism('pink', 20),
                            border: `1px solid ${teamColors.secondary}40`,
                          }}
                        >
                          {/* Hover background effect */}
                          <motion.div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: `radial-gradient(circle at 50% 50%, ${teamColors.secondary}30, transparent 70%)`,
                            }}
                          />
                          
                          <div className="relative z-10 p-6">
                            <div className="flex items-center gap-4 mb-6">
                              <motion.div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${teamColors.primary}, ${teamColors.secondary})`,
                                }}
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                              >
                                <Users className="w-8 h-8 text-white" />
                              </motion.div>
                              <div>
                                <motion.h3 
                                  className="text-xl font-bold text-white mb-1"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  {player.name}
                                </motion.h3>
                                <motion.div 
                                  className="text-white/70 text-sm font-medium"
                                  animate={{ opacity: [0.7, 1, 0.7] }}
                                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                                >
                                  {player.role}
                                </motion.div>
                              </div>
                            </div>
                            
                            {/* Enhanced Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                              <motion.div
                                className="text-center p-3 rounded-xl"
                                style={{
                                  background: `linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))`,
                                  border: `1px solid rgba(59, 130, 246, 0.3)`,
                                }}
                                whileHover={{ scale: 1.05, y: -2 }}
                              >
                                <motion.div
                                  className="text-2xl font-black text-blue-400"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 1.5, delay: 0.6 + index * 0.1 }}
                                >
                                  {player.stats?.runs || 0}
                                </motion.div>
                                <div className="text-white/60 text-xs font-medium">Runs</div>
                              </motion.div>
                              
                              <motion.div
                                className="text-center p-3 rounded-xl"
                                style={{
                                  background: `linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(236, 72, 153, 0.2))`,
                                  border: `1px solid rgba(16, 185, 129, 0.3)`,
                                }}
                                whileHover={{ scale: 1.05, y: -2 }}
                              >
                                <motion.div
                                  className="text-2xl font-black text-green-400"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 1.5, delay: 0.7 + index * 0.1 }}
                                >
                                  {player.stats?.wickets || 0}
                                </motion.div>
                                <div className="text-white/60 text-xs font-medium">Wickets</div>
                              </motion.div>
                            </div>
                            
                            {/* Performance indicator */}
                            <motion.div
                              className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden"
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                            >
                              <motion.div
                                className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((player.stats?.runs || 0) / 5, 100)}%` }}
                                transition={{ delay: 1 + index * 0.1, duration: 1, ease: "easeOut" }}
                              />
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <motion.div
                key="matches"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Enhanced Match Schedule Panel */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative"
                  style={{
                    ...getWPLGlassmorphism('violet', 20),
                    border: `1px solid rgba(59, 130, 246, 0.3)`,
                    borderRadius: '1.5rem',
                  }}
                >
                  {/* Animated background gradient */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-30"
                    style={{
                      background: `linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))`,
                    }}
                    animate={{
                      background: [
                        `linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))`,
                        `linear-gradient(225deg, rgba(147, 51, 234, 0.2), rgba(59, 130, 246, 0.2))`,
                        `linear-gradient(315deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))`,
                      ],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
                  
                  <div className="relative z-10 p-8">
                    <motion.div 
                      className="flex items-center gap-3 mb-8"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div
                        animate={{ 
                          rotate: [0, -10, 10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Calendar className="w-8 h-8 text-blue-400" />
                      </motion.div>
                      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        Match Schedule
                      </h2>
                      <motion.div
                        className="ml-auto"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      </motion.div>
                    </motion.div>
                    
                    <div className="space-y-4">
                      {recentMatches.map((match, index) => (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                          whileHover={{ 
                            scale: 1.02,
                            x: 10,
                            transition: { duration: 0.3 }
                          }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative group overflow-hidden rounded-2xl cursor-pointer ${
                            hasScorecard(match) 
                              ? 'border-green-500/40' 
                              : 'border-white/20'
                          }`}
                          style={{
                            ...getWPLGlassmorphism('violet', 20),
                            border: `1px solid ${hasScorecard(match) ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
                          }}
                          onClick={() => handleMatchClick(match)}
                        >
                          {/* Hover background effect */}
                          <motion.div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: `radial-gradient(circle at 50% 50%, ${hasScorecard(match) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(147, 51, 234, 0.3)'}, transparent 70%)`,
                            }}
                          />
                          
                          {/* Scorecard indicator */}
                          {hasScorecard(match) && (
                            <motion.div
                              className="absolute top-3 right-3"
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.8, 1, 0.8]
                              }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <div className="w-3 h-3 bg-green-500 rounded-full" />
                            </motion.div>
                          )}
                          
                          <div className="relative z-10 p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                {/* Match status indicator */}
                                <motion.div
                                  className={`w-4 h-4 rounded-full ${
                                    match.result === 'win' ? 'bg-green-500' :
                                    match.result === 'loss' ? 'bg-red-500' : 'bg-yellow-500'
                                  }`}
                                  animate={{ 
                                    scale: [1, 1.3, 1],
                                    opacity: [0.7, 1, 0.7]
                                  }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                />
                                
                                <div>
                                  <motion.h3 
                                    className="text-xl font-bold text-white mb-1"
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    vs {match.opponent}
                                  </motion.h3>
                                  <motion.div 
                                    className="text-white/70 text-sm font-medium"
                                    animate={{ opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
                                  >
                                    {match.score}
                                  </motion.div>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <motion.div 
                                  className="text-white/60 text-sm font-medium mb-1"
                                  animate={{ opacity: [0.7, 1, 0.7] }}
                                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.4 }}
                                >
                                  {match.date}
                                </motion.div>
                                <motion.div 
                                  className="text-white/60 text-sm mb-2"
                                  animate={{ opacity: [0.7, 1, 0.7] }}
                                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                                >
                                  {match.venue}
                                </motion.div>
                                
                                {/* Scorecard indicator with animation */}
                                <motion.div
                                  className={`text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${
                                    hasScorecard(match) 
                                      ? 'text-green-400 bg-green-400/20 border border-green-400/40' 
                                      : 'text-blue-400 bg-blue-400/20 border border-blue-400/40'
                                  }`}
                                  whileHover={{ scale: 1.05 }}
                                  animate={{ 
                                    opacity: [0.8, 1, 0.8]
                                  }}
                                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.6 }}
                                >
                                  {hasScorecard(match) ? (
                                    <>
                                      <motion.div
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                      >
                                        <CI.IconChart size={16} className="inline-block" />
                                      </motion.div>
                                      Full Scorecard Available
                                    </>
                                  ) : (
                                    <>
                                      <motion.div
                                        animate={{ rotate: [0, -10, 10, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                      >
                                        <CI.IconClipboard size={16} className="inline-block" />
                                      </motion.div>
                                      Match Details
                                    </>
                                  )}
                                </motion.div>
                              </div>
                            </div>
                            
                            {/* Progress indicator */}
                            <motion.div
                              className="mt-4 h-0.5 bg-white/20 rounded-full overflow-hidden"
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                            >
                              <motion.div
                                className={`h-full rounded-full ${
                                  hasScorecard(match) 
                                    ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                                    : 'bg-gradient-to-r from-blue-400 to-purple-400'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ delay: 1 + index * 0.1, duration: 1, ease: "easeOut" }}
                              />
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Full Scorecard & Playing 11 Features */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <BarChart3 className="w-6 h-6" />
                    Full Scorecard & Playing 11 Features
                  </h2>
                  <div className="text-white/80 mb-4">
                    Click on any match above to view detailed scorecard with complete Playing 11 information including:
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Batting Scorecard
                      </h3>
                      <ul className="text-white/60 text-sm space-y-2">
                        <li>• Complete Playing 11 batting lineup</li>
                        <li>• Runs scored, balls faced, strike rate</li>
                        <li>• Fours, sixes, and dismissal details</li>
                        <li>• Captain and wicket-keeper indicators</li>
                      </ul>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Bowling Scorecard
                      </h3>
                      <ul className="text-white/60 text-sm space-y-2">
                        <li>• Complete Playing 11 bowling figures</li>
                        <li>• Overs bowled, runs conceded</li>
                        <li>• Wickets taken and economy rate</li>
                        <li>• Dots, fours, and sixes analysis</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Match Details
                    </h3>
                    <ul className="text-white/60 text-sm space-y-2">
                      <li>• Match result with winner and margin</li>
                      <li>• Man of the Match award</li>
                      <li>• Innings-wise complete breakdown</li>
                      <li>• Professional scorecard format</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Squad Tab */}
            {activeTab === 'squad' && (
              <motion.div
                key="squad"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Enhanced Search and Filter Panel */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative"
                  style={{
                    ...getWPLGlassmorphism('violet', 20),
                    border: `1px solid rgba(16, 185, 129, 0.3)`,
                    borderRadius: '1.5rem',
                  }}
                >
                  {/* Animated background gradient */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-30"
                    style={{
                      background: `linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))`,
                    }}
                    animate={{
                      background: [
                        `linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))`,
                        `linear-gradient(225deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2))`,
                        `linear-gradient(315deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))`,
                      ],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
                  
                  <div className="relative z-10 p-6">
                    <motion.div 
                      className="flex flex-col md:flex-row gap-4"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {/* Enhanced Search Input */}
                      <motion.div 
                        className="flex-1 relative group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                          <motion.div
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60"
                            animate={{ 
                              rotate: [0, -10, 10, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                          <CI.IconSearch size={18} className="inline-block" />
                        </motion.div>
                        <motion.input
                          type="text"
                          placeholder="Search players..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:border-green-400/50 focus:bg-white/15 transition-all duration-300"
                          whileFocus={{ 
                            scale: 1.02,
                            borderColor: 'rgba(16, 185, 129, 0.5)'
                          }}
                        />
                        {/* Search pulse effect */}
                        <motion.div
                          className="absolute inset-0 rounded-2xl border border-green-400/30 pointer-events-none"
                          animate={{ 
                            opacity: [0, 0.5, 0],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </motion.div>
                      
                      {/* Enhanced Role Filter */}
                      <motion.select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:border-green-400/50 focus:bg-white/15 transition-all duration-300 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <option value="all">All Roles</option>
                        <option value="Batsman">Batsman</option>
                        <option value="Bowler">Bowler</option>
                        <option value="All-rounder">All-rounder</option>
                        <option value="Wicket-keeper">Wicket-keeper</option>
                      </motion.select>
                    </motion.div>
                    
                    {/* Filter Results Indicator */}
                    <motion.div
                      className="mt-4 flex items-center gap-2 text-white/60 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <CI.IconTarget size={18} className="inline-block" />
                      </motion.div>
                      <span>
                        {filteredPlayers.length} {filteredPlayers.length === 1 ? 'player' : 'players'} found
                        {selectedRole !== 'all' && ` • ${selectedRole}`}
                        {searchQuery && ` • "${searchQuery}"`}
                      </span>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Enhanced Players Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlayers.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.8, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.05, duration: 0.6 }}
                      whileHover={{ 
                        scale: 1.05,
                        rotateY: 5,
                        z: 50,
                        transition: { duration: 0.3 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePlayerClick(player)}
                      className="relative group overflow-hidden rounded-2xl cursor-pointer"
                      style={{
                        ...getWPLGlassmorphism('orange', 20),
                        border: `1px solid ${teamColors.secondary}40`,
                      }}
                    >
                      {/* Hover background effect */}
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, ${teamColors.secondary}30, transparent 70%)`,
                        }}
                      />
                      
                      {/* Player status indicator */}
                      <motion.div
                        className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full"
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      
                      <div className="relative z-10 p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <motion.div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${teamColors.primary}, ${teamColors.secondary})`,
                            }}
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                          >
                            <CI.IconPlayer size={30} className="inline-block" />
                          </motion.div>
                          <div>
                            <motion.h3 
                              className="text-2xl font-black text-white mb-1"
                              whileHover={{ scale: 1.05 }}
                            >
                              {player.name}
                            </motion.h3>
                            <motion.div 
                              className="text-white/70 text-sm font-medium mb-1"
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                            >
                              {player.role}
                            </motion.div>
                            {player.nationality && (
                              <motion.div 
                                className="text-white/60 text-sm flex items-center gap-1"
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
                              >
                                <motion.div
                                  animate={{ rotate: [0, -10, 10, 0] }}
                                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                >
                                  <CI.IconGlobe size={14} className="inline-block" />
                                </motion.div>
                                {player.nationality}
                              </motion.div>
                            )}
                          </div>
                        </div>
                        
                        {/* Enhanced Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <motion.div
                            className="text-center p-3 rounded-xl"
                            style={{
                              background: `linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))`,
                              border: `1px solid rgba(59, 130, 246, 0.3)`,
                            }}
                            whileHover={{ scale: 1.1, y: -3 }}
                          >
                            <motion.div
                              className="text-xl font-black text-blue-400"
                              initial={{ count: 0 }}
                              animate={{ count: playerStats[player.id]?.runs || 0 }}
                              transition={{ duration: 1.5, delay: 0.8 + index * 0.05 }}
                            >
                              {playerStats[player.id]?.runs || 0}
                            </motion.div>
                            <div className="text-white/60 text-xs font-medium">Runs</div>
                          </motion.div>
                          
                          <motion.div
                            className="text-center p-3 rounded-xl"
                            style={{
                              background: `linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(236, 72, 153, 0.2))`,
                              border: `1px solid rgba(16, 185, 129, 0.3)`,
                            }}
                            whileHover={{ scale: 1.1, y: -3 }}
                          >
                            <motion.div
                              className="text-xl font-black text-green-400"
                              initial={{ count: 0 }}
                              animate={{ count: playerStats[player.id]?.wickets || 0 }}
                              transition={{ duration: 1.5, delay: 0.9 + index * 0.05 }}
                            >
                              {playerStats[player.id]?.wickets || 0}
                            </motion.div>
                            <div className="text-white/60 text-xs font-medium">Wickets</div>
                          </motion.div>
                          
                          <motion.div
                            className="text-center p-3 rounded-xl"
                            style={{
                              background: `linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(239, 68, 68, 0.2))`,
                              border: `1px solid rgba(251, 146, 60, 0.3)`,
                            }}
                            whileHover={{ scale: 1.1, y: -3 }}
                          >
                            <motion.div
                              className="text-xl font-black text-orange-400"
                              initial={{ count: 0 }}
                              animate={{ count: 
                                playerStats[player.id]?.innings > 0 
                                  ? Math.round(playerStats[player.id].runs / (playerStats[player.id].innings - playerStats[player.id].notOuts) || 0)
                                  : 0
                              }}
                              transition={{ duration: 1.5, delay: 1 + index * 0.05 }}
                            >
                              {playerStats[player.id]?.innings > 0 
                                ? Math.round(playerStats[player.id].runs / (playerStats[player.id].innings - playerStats[player.id].notOuts) || 0)
                                : 0
                              }
                            </motion.div>
                            <div className="text-white/60 text-xs font-medium">Avg</div>
                          </motion.div>
                        </div>
                        
                        {/* Performance indicator */}
                        <motion.div
                          className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ delay: 1.2 + index * 0.05, duration: 0.5 }}
                        >
                          <motion.div
                            className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(((playerStats[player.id]?.runs || 0) + (playerStats[player.id]?.wickets || 0) * 20) / 10, 100)}%` }}
                            transition={{ delay: 1.5 + index * 0.05, duration: 1, ease: "easeOut" }}
                          />
                        </motion.div>
                        
                        {/* Hover particles */}
                        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                          {[...Array(4)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100"
                              style={{
                                left: `${20 + i * 20}%`,
                                top: `${30 + i * 10}px`,
                              }}
                              animate={{
                                y: [0, -15, 0],
                                opacity: [0, 1, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Enhanced Matches Tab with Premium Design */}
            {activeTab === 'matches' && (
              <motion.div
                key="matches"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="space-y-8"
              >
                {/* Premium Header Section */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative overflow-hidden rounded-3xl p-8"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
                  }}
                >
                  {/* Animated background pattern */}
                  <motion.div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  <div className="relative z-10">
                    <motion.h2 
                      className="text-4xl font-black text-white mb-6 flex items-center gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(239, 68, 68, 0.3))',
                          border: '1px solid rgba(249, 115, 22, 0.4)',
                          boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
                        }}
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Calendar className="w-7 h-7" style={{ color: WPLColors.warning }} />
                      </motion.div>
                      <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 bg-clip-text text-transparent">
                        Match Schedule
                      </span>
                    </motion.h2>
                    
                    {/* Stats Summary */}
                    <motion.div
                      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {[
                        { label: 'Total', value: matches.length, icon: <CI.IconChart size={18} className="inline-block" />, color: 'from-blue-500 to-cyan-500', glow: 'rgba(59, 130, 246, 0.3)' },
                        { label: 'Completed', value: matches.filter(m => m.status === 'completed').length, icon: <CI.IconCheck size={18} className="inline-block" />, color: 'from-green-500 to-emerald-500', glow: 'rgba(16, 185, 129, 0.3)' },
                        { label: 'Live', value: matches.filter(m => m.status === 'live').length, icon: <CI.IconLive size={18} className="inline-block" />, color: 'from-red-500 to-pink-500', glow: 'rgba(239, 68, 68, 0.3)' },
                        { label: 'Upcoming', value: matches.filter(m => m.status === 'upcoming' || m.status === 'scheduled').length, icon: <CI.IconHourglass size={18} className="inline-block" />, color: 'from-yellow-500 to-orange-500', glow: 'rgba(234, 179, 8, 0.3)' },
                      ].map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          className="relative group"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                          whileHover={{ scale: 1.05, y: -3 }}
                        >
                          <div
                            className="relative overflow-hidden rounded-2xl p-4"
                            style={{
                              background: `linear-gradient(135deg, ${stat.color})`,
                              boxShadow: `0 8px 24px ${stat.glow}`,
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            {/* Glossy overlay */}
                            <div
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%)',
                              }}
                            />
                            
                            <div className="relative z-10 flex items-center justify-between">
                              <div>
                                <motion.div 
                                  className="text-3xl font-black text-white mb-1"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.6 + index * 0.05 }}
                                >
                                  {stat.value}
                                </motion.div>
                                <div className="text-white/90 text-sm font-semibold">{stat.label}</div>
                              </div>
                              <motion.div
                                className="text-3xl"
                                animate={{
                                  scale: [1, 1.2, 1],
                                  rotate: [0, 10, -10, 0],
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  delay: index * 0.2,
                                  ease: "easeInOut"
                                }}
                              >
                                {stat.icon}
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Enhanced Match Cards Grid */}
                <div className="space-y-6">
                  {matches.map((match, index) => {
                    const isLive = match.status === 'live';
                    const isCompleted = match.status === 'completed';
                    const isUpcoming = match.status === 'upcoming' || match.status === 'scheduled';
                    
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: 0.5 + index * 0.08,
                          type: "spring",
                          stiffness: 200,
                          damping: 25
                        }}
                        whileHover={{ 
                          scale: 1.02,
                          y: -5,
                          transition: { duration: 0.2 }
                        }}
                        onClick={() => handleMatchClick(match)}
                        className="group relative cursor-pointer"
                      >
                        {/* Match Card Container */}
                        <div
                          className="relative overflow-hidden rounded-3xl p-6 md:p-8"
                          style={{
                            background: isLive 
                              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(236, 72, 153, 0.15))'
                              : isCompleted
                              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))'
                              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: isLive 
                              ? '0 8px 32px rgba(239, 68, 68, 0.2)'
                              : '0 8px 32px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          {/* Animated shimmer effect */}
                          <motion.div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                              backgroundSize: '200% 100%',
                            }}
                            animate={{
                              backgroundPosition: ['200% 0', '-200% 0'],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                          
                          {/* Live indicator */}
                          {isLive && (
                            <motion.div
                              className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full"
                              style={{
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3))',
                                border: '1px solid rgba(239, 68, 68, 0.5)',
                                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                              }}
                              animate={{
                                scale: [1, 1.05, 1],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <motion.div
                                className="w-2 h-2 rounded-full bg-red-500"
                                animate={{
                                  scale: [1, 1.5, 1],
                                  opacity: [1, 0.5, 1],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                              <span className="text-red-300 font-bold text-sm">LIVE</span>
                            </motion.div>
                          )}
                          
                          {/* Match Content */}
                          <div className="relative z-10">
                            {/* Teams Section */}
                            <div className="grid grid-cols-3 items-center gap-4 md:gap-8 mb-6">
                              {/* Team 1 */}
                              <motion.div
                                className="flex flex-col items-center text-center"
                                whileHover={{ scale: 1.05 }}
                              >
                                <motion.div
                                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-3 flex items-center justify-center"
                                  style={{
                                    background: `linear-gradient(135deg, ${teamColors.primary}40, ${teamColors.secondary}40)`,
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: `0 8px 24px ${teamColors.primary}30`,
                                  }}
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  <CI.IconCricketBat size={36} className="inline-block" />
                                </motion.div>
                                <div className="text-white font-black text-lg md:text-xl mb-1">
                                  {getTeamShort(match.team1) || 'TBD'}
                                </div>
                                <div className="text-white/60 text-xs md:text-sm font-medium line-clamp-2">
                                  {getTeamFull(match.team1) || 'Team 1'}
                                </div>
                              </motion.div>
                              
                              {/* VS Section */}
                              <motion.div 
                                className="flex flex-col items-center"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 + index * 0.08 }}
                              >
                                <motion.div
                                  className="w-12 h-12 md:w-16 md:h-16 rounded-2xl mb-2 flex items-center justify-center"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(239, 68, 68, 0.3))',
                                    border: '1px solid rgba(249, 115, 22, 0.4)',
                                    boxShadow: '0 4px 16px rgba(249, 115, 22, 0.3)',
                                  }}
                                  animate={{
                                    rotate: [0, 180, 360],
                                    scale: [1, 1.1, 1],
                                  }}
                                  transition={{
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                >
                                  <span className="text-white/80 font-black text-sm md:text-base">VS</span>
                                </motion.div>
                                <motion.div
                                  className="text-white/60 text-xs md:text-sm font-semibold"
                                  animate={{ opacity: [0.6, 1, 0.6] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                  {match.time || ''}
                                </motion.div>
                              </motion.div>
                              
                              {/* Team 2 */}
                              <motion.div
                                className="flex flex-col items-center text-center"
                                whileHover={{ scale: 1.05 }}
                              >
                                <motion.div
                                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-3 flex items-center justify-center"
                                  style={{
                                    background: `linear-gradient(135deg, ${teamColors.secondary}40, ${teamColors.primary}40)`,
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: `0 8px 24px ${teamColors.secondary}30`,
                                  }}
                                  whileHover={{ rotate: -360 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  <CI.IconCricketBat size={36} className="inline-block" />
                                </motion.div>
                                <div className="text-white font-black text-lg md:text-xl mb-1">
                                  {getTeamShort(match.team2) || 'TBD'}
                                </div>
                                <div className="text-white/60 text-xs md:text-sm font-medium line-clamp-2">
                                  {getTeamFull(match.team2) || 'Team 2'}
                                </div>
                              </motion.div>
                            </div>
                            
                            {/* Match Info Footer */}
                            <motion.div
                              className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.7 + index * 0.08 }}
                            >
                              <div className="flex items-center gap-2 text-white/70">
                                <motion.div
                                  animate={{ rotate: [0, 360] }}
                                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                >
                                  <MapPin className="w-4 h-4" />
                                </motion.div>
                                <span className="text-sm font-medium">{match.venue}</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/70">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">{match.date}</span>
                              </div>
                              <motion.div
                                className="px-4 py-2 rounded-xl text-sm font-bold"
                                style={{
                                  background: isLive
                                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3))'
                                    : isCompleted
                                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3))'
                                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(124, 58, 237, 0.3))',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  color: isLive ? '#fca5a5' : isCompleted ? '#86efac' : '#c4b5fd',
                                }}
                                whileHover={{ scale: 1.05 }}
                              >
                                {isLive ? (
                                  <span className="inline-flex items-center gap-2"><CI.IconLive size={14} className="inline-block" /> Live</span>
                                ) : isCompleted ? (
                                  <span className="inline-flex items-center gap-2"><CI.IconCheck size={14} className="inline-block" /> Completed</span>
                                ) : (
                                  <span className="inline-flex items-center gap-2"><CI.IconHourglass size={14} className="inline-block" /> Upcoming</span>
                                )}
                              </motion.div>
                            </motion.div>
                          </div>
                          
                          {/* Hover glow effect */}
                          <motion.div
                            className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                            style={{
                              background: `radial-gradient(circle at 50% 50%, ${teamColors.primary}20, transparent 70%)`,
                            }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Empty State */}
                {matches.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                  >
                    <motion.div
                      className="text-6xl mb-4"
                      animate={{
                        rotate: [0, -10, 10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <CI.IconCalendar size={56} className="inline-block" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Matches Available</h3>
                    <p className="text-white/60">Check back soon for upcoming fixtures!</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {teamStats && (
                  <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <Trophy className="w-6 h-6 text-yellow-400" />
                          <span className="text-white/70">Performance</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-2">{teamStats.winPercentage}%</div>
                        <div className="text-white/60 text-sm">Win Rate</div>
                        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${teamStats.winPercentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <Target className="w-6 h-6 text-blue-400" />
                          <span className="text-white/70">Scoring</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-2">{teamStats.averageScore}</div>
                        <div className="text-white/60 text-sm">Average Score</div>
                        <div className="mt-4 text-sm text-white/60">
                          Highest: {teamStats.highestScore} • Lowest: {teamStats.lowestScore}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <Activity className="w-6 h-6 text-purple-400" />
                          <span className="text-white/70">Matches</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-2">{teamStats.matchesPlayed}</div>
                        <div className="text-white/60 text-sm">Total Played</div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                          <div className="text-green-400">W: {teamStats.wins}</div>
                          <div className="text-red-400">L: {teamStats.losses}</div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <Award className="w-6 h-6 text-orange-400" />
                          <span className="text-white/70">Achievements</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-2">{teamStats.titles}</div>
                        <div className="text-white/60 text-sm">Titles Won</div>
                        <div className="mt-4">
                          <div className="flex gap-1">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < teamStats.titles ? 'bg-yellow-400' : 'bg-white/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Globe className="w-6 h-6" />
                    About {team.name}
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-white/80 leading-relaxed">
                      {team.description || `The ${team.name} is a professional cricket team competing in the Women's Premier League (WPL). 
                      Known for their competitive spirit and talented roster, they have become one of the most exciting teams in the league.`}
                    </p>
                  </div>
                </div>

                {/* Coaching Staff */}
                {coachingStaff.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <Users className="w-6 h-6" />
                      Coaching Staff
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {coachingStaff.map((coach, index) => (
                        <motion.div
                          key={coach.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/5 rounded-xl p-6 border border-white/10"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{coach.name}</div>
                              <div className="text-white/60 text-sm">{coach.role}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Media */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Share2 className="w-6 h-6" />
                    Follow {team.shortName}
                  </h2>
                  <div className="flex gap-4">
                    <button className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                      <Twitter className="w-6 h-6 text-blue-400" />
                    </button>
                    <button className="p-3 bg-pink-500/20 rounded-xl border border-pink-500/30 hover:bg-pink-500/30 transition-colors">
                      <Instagram className="w-6 h-6 text-pink-400" />
                    </button>
                    <button className="p-3 bg-red-500/20 rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-colors">
                      <Youtube className="w-6 h-6 text-red-400" />
                    </button>
                    <button className="p-3 bg-blue-600/20 rounded-xl border border-blue-600/30 hover:bg-blue-600/30 transition-colors">
                      <Facebook className="w-6 h-6 text-blue-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      
      {/* Enhanced Match Details Modal */}
      <AnimatePresence>
        {showScorecard && selectedMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeScorecard();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 rounded-3xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl shadow-purple-500/20"
            >
              {/* Enhanced Header */}
              <div className="relative overflow-hidden">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
                  <motion.div
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%), 
                                       radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)`,
                      backgroundSize: "200% 200%",
                    }}
                  />
                </div>
                
                <div className="relative p-8 border-b border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Match Title with Animation */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <h2 className="text-4xl font-black text-white mb-4 flex items-center gap-4">
                          <motion.div
                            animate={{ 
                              rotate: [0, 10, -10, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity, 
                              repeatDelay: 2,
                              ease: "easeInOut"
                            }}
                            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30"
                          >
                            <CI.IconFire size={24} className="inline-block" />
                          </motion.div>
                          <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                            Match Details
                          </span>
                        </h2>
                      </motion.div>
                      
                      {/* Teams Information */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
                      >
                        <div className="flex items-center gap-6 text-white/90 text-2xl font-bold">
                          <motion.span 
                            className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
                            whileHover={{ scale: 1.05 }}
                          >
                            {selectedMatch.team1?.shortName || 'Team 1'}
                          </motion.span>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="text-3xl"
                          >
                            <CI.IconLightning size={28} className="inline-block" />
                          </motion.div>
                          <motion.span 
                            className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                            whileHover={{ scale: 1.05 }}
                          >
                            {selectedMatch.team2?.shortName || 'Team 2'}
                          </motion.span>
                        </div>
                      </motion.div>
                      
                      {/* Match Meta Information */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap items-center gap-6 text-white/70 text-sm"
                      >
                        <motion.div 
                          className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm border border-white/20"
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                        >
                          <CI.IconCalendar size={18} className="inline-block" />
                          <span className="font-medium">{selectedMatch.date}</span>
                        </motion.div>
                        <motion.div 
                          className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm border border-white/20"
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                        >
                          <CI.IconStadium size={18} className="inline-block" />
                          <span className="font-medium">{selectedMatch.venue}</span>
                        </motion.div>
                        <motion.div 
                          className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm border border-white/20"
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                        >
                          <CI.IconClock size={18} className="inline-block" />
                          <span className="font-medium">{selectedMatch.time || '19:30'}</span>
                        </motion.div>
                      </motion.div>
                    </div>
                    
                    {/* Close Button */}
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={closeScorecard}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-white/80 hover:text-white transition-all duration-200 flex items-center justify-center border border-white/20 backdrop-blur-sm"
                    >
                      <CI.IconSparkle size={20} className="inline-block" />
                    </motion.button>
                  </div>
                  
                  {/* Enhanced Tab Navigation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-3 mt-8"
                  >
                    {[
                      { id: 'scorecard', label: 'Scorecard', icon: <CI.IconChart size={18} className="inline-block" />, color: 'from-blue-500 to-cyan-500' },
                      { id: 'playing11', label: 'Playing 11', icon: <CI.IconSquad size={18} className="inline-block" />, color: 'from-green-500 to-emerald-500' },
                      { id: 'highlights', label: 'Highlights', icon: <CI.IconStar size={18} className="inline-block" />, color: 'from-yellow-500 to-orange-500' },
                      { id: 'stats', label: 'Statistics', icon: <CI.IconTrendUp size={18} className="inline-block" />, color: 'from-purple-500 to-pink-500' }
                    ].map((tab, index) => (
                      <motion.button
                        key={tab.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        onClick={() => setActiveModalTab(tab.id as any)}
                        className={`px-5 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 border ${
                          activeModalTab === tab.id
                            ? `bg-gradient-to-r ${tab.color} text-white shadow-xl shadow-lg transform scale-105 border-white/40`
                            : 'text-white/70 hover:text-white hover:bg-white/10 border-white/20 backdrop-blur-sm'
                        }`}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.span
                          animate={{ 
                            rotate: activeModalTab === tab.id ? [0, 360] : 0,
                            scale: activeModalTab === tab.id ? [1, 1.2, 1] : 1
                          }}
                          transition={{ 
                            duration: activeModalTab === tab.id ? 0.6 : 0.3,
                            ease: "easeInOut"
                          }}
                          className="text-xl"
                        >
                          {tab.icon}
                        </motion.span>
                        <span className="text-sm font-medium">{tab.label}</span>
                        {activeModalTab === tab.id && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 rounded-2xl bg-white/10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* Enhanced Content Area */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                {selectedScorecard ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-8"
                  >
                    {/* Scorecard Tab */}
                    {activeModalTab === 'scorecard' && (
                      <div className="space-y-8">
                        {/* Export Options */}
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.75 }}
                          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                                <motion.div
                                  animate={{ 
                                    scale: [1, 1.2, 1],
                                    rotate: [0, -10, 10, 0]
                                  }}
                                  transition={{ 
                                    duration: 3, 
                                    repeat: Infinity, 
                                    ease: "easeInOut" 
                                  }}
                                  className="text-2xl"
                                >
                                  <CI.IconExport size={22} className="inline-block" />
                                </motion.div>
                                Export Scorecard Data
                              </h3>
                              <p className="text-white/60 text-sm">Download complete match data including Fall of Wickets, Powerplays, and Partnerships</p>
                            </div>
                            
                            <div className="flex gap-3">
                              {/* Excel Export */}
                              <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => exportScorecard('excel')}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                <CI.IconExcel size={18} className="inline-block" />
                                Excel
                              </motion.button>
                              
                              {/* CSV Export */}
                              <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => exportScorecard('csv')}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                <CI.IconClipboard size={18} className="inline-block" />
                                CSV
                              </motion.button>
                              
                              {/* JSON Export */}
                              <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => exportScorecard('json')}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                <CI.IconWrench size={18} className="inline-block" />
                                JSON
                              </motion.button>
                              
                              {/* PDF Export */}
                              <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => exportScorecard('pdf')}
                                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                <CI.IconFile size={18} className="inline-block" />
                                PDF
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                        {/* Enhanced Match Result */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 }}
                          className="bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 backdrop-blur-md rounded-3xl p-8 border border-green-500/30 shadow-xl shadow-green-500/10"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
                                <motion.div
                                  animate={{ 
                                    scale: [1, 1.3, 1],
                                    rotate: [0, 10, -10, 0]
                                  }}
                                  transition={{ 
                                    duration: 3, 
                                    repeat: Infinity, 
                                    ease: "easeInOut" 
                                  }}
                                  className="text-3xl"
                                >
                                  <CI.IconTrophy size={36} className="inline-block" />
                                </motion.div>
                                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                  Final Result
                                </span>
                              </h3>
                              <motion.div 
                                className="text-3xl font-black text-green-400 mb-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                              >
                                {selectedScorecard.result?.winner} won by {selectedScorecard.result?.margin}
                              </motion.div>
                              {selectedScorecard.result?.manOfTheMatch && (
                                <motion.div
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 1.2 }}
                                  className="flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl px-4 py-3 border border-yellow-500/30"
                                >
                                  <motion.div
                                    animate={{ 
                                      scale: [1, 1.2, 1],
                                      rotate: [0, 360]
                                    }}
                                    transition={{ 
                                      duration: 4, 
                                      repeat: Infinity, 
                                      ease: "linear" 
                                    }}
                                    className="text-2xl"
                                  >
                                    <CI.IconStar size={20} className="inline-block" />
                                  </motion.div>
                                  <div>
                                    <span className="text-yellow-400 font-bold">Man of the Match:</span>
                                    <span className="text-white ml-2 font-semibold">{selectedScorecard.result.manOfTheMatch}</span>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                            <motion.div
                              animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                              }}
                              transition={{ 
                                duration: 5, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                              }}
                              className="text-6xl opacity-50"
                            >
                              <CI.IconTarget size={56} className="inline-block" />
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* Enhanced Scorecard Innings */}
                        {selectedScorecard.innings?.map((innings: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.9 + index * 0.1 }}
                            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-xl"
                          >
                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-4">
                              <motion.div
                                animate={{ 
                                  rotate: [0, 360],
                                  scale: [1, 1.1, 1]
                                }}
                                transition={{ 
                                  duration: 20, 
                                  repeat: Infinity, 
                                  ease: "linear" 
                                }}
                                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg"
                              >
                                <span className="text-sm font-bold text-white">{index + 1}</span>
                              </motion.div>
                              <div>
                                <div className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                  Innings {index + 1}
                                </div>
                                <div className="text-white/70 text-sm font-medium">
                                  {innings.battingTeamId === teamId ? team?.name : innings.battingTeamId}
                                </div>
                              </div>
                            </h3>
                            
                            {/* Enhanced Score Summary */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1 + index * 0.1 }}
                              className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-blue-500/30 shadow-lg"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-4xl font-black text-white mb-2">
                                    {innings.totalRuns}/{innings.totalWickets}
                                  </div>
                                  <div className="text-white/60 text-sm">
                                    ({innings.totalOvers} overs)
                                  </div>
                                </div>
                                <motion.div
                                  animate={{ 
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, -10, 0]
                                  }}
                                  transition={{ 
                                    duration: 3, 
                                    repeat: Infinity, 
                                    ease: "easeInOut" 
                                  }}
                                  className="text-4xl opacity-50"
                                >
                                  <CI.IconTarget size={36} className="inline-block" />
                                </motion.div>
                              </div>
                              <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm border border-white/20">
                                <CI.IconLightning size={18} className="inline-block" />
                                <span className="text-white font-medium">
                                  Run Rate: {((innings.totalRuns / (parseFloat(innings.totalOvers) || 1)) * 6).toFixed(2)}
                                </span>
                              </div>
                            </motion.div>

                            {/* Enhanced Batting Scorecard */}
                            <div className="mb-8">
                              <h4 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                <motion.div
                                  animate={{ 
                                    scale: [1, 1.2, 1],
                                    rotate: [0, -10, 10, 0]
                                  }}
                                  transition={{ 
                                    duration: 3, 
                                    repeat: Infinity, 
                                    ease: "easeInOut" 
                                  }}
                                  className="text-2xl"
                                >
                                  <CI.IconCricketBat size={22} className="inline-block" />
                                </motion.div>
                                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                  Batting Scorecard
                                </span>
                              </h4>
                              <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-sm text-white">
                                  <thead>
                                    <tr className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-white/20">
                                      <th className="text-left py-4 px-4 font-semibold">Batsman</th>
                                      <th className="text-center py-4 px-2 font-semibold">R</th>
                                      <th className="text-center py-4 px-2 font-semibold">B</th>
                                      <th className="text-center py-4 px-2 font-semibold">4s</th>
                                      <th className="text-center py-4 px-2 font-semibold">6s</th>
                                      <th className="text-center py-4 px-2 font-semibold">SR</th>
                                      <th className="text-left py-4 px-4 font-semibold">Dismissal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {innings.batting?.map((batsman: any, batsmanIndex: number) => (
                                      <motion.tr
                                        key={batsmanIndex}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.1 + batsmanIndex * 0.05 }}
                                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                                      >
                                        <td className="py-4 px-4">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{batsman.name}</span>
                                            {batsman.isCaptain && (
                                              <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="text-yellow-400 text-xs font-bold bg-yellow-400/20 px-2 py-1 rounded"
                                              >
                                                (c)
                                              </motion.span>
                                            )}
                                            {batsman.isWicketKeeper && (
                                              <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="text-blue-400 text-xs font-bold bg-blue-400/20 px-2 py-1 rounded"
                                              >
                                                (wk)
                                              </motion.span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="text-center py-4 px-2 font-bold text-lg">{batsman.runs}</td>
                                        <td className="text-center py-4 px-2">{batsman.balls}</td>
                                        <td className="text-center py-4 px-2">{batsman.fours}</td>
                                        <td className="text-center py-4 px-2">{batsman.sixes}</td>
                                        <td className="text-center py-4 px-2 font-medium">{batsman.strikeRate}</td>
                                        <td className="py-4 px-4 text-white/60 text-sm">
                                          {batsman.dismissal?.type === 'not-out' ? (
                                            <span className="text-green-400 font-semibold">not out</span>
                                          ) : (
                                            batsman.dismissal?.details || '-'
                                          )}
                                        </td>
                                      </motion.tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Enhanced Bowling Scorecard */}
                            <div>
                              <h4 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                <motion.div
                                  animate={{ 
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, -10, 0]
                                  }}
                                  transition={{ 
                                    duration: 3, 
                                    repeat: Infinity, 
                                    delay: 0.5,
                                    ease: "easeInOut" 
                                  }}
                                  className="text-2xl"
                                >
                                  <CI.IconTarget size={20} className="inline-block" />
                                </motion.div>
                                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                  Bowling Scorecard
                                </span>
                              </h4>
                              <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-sm text-white">
                                  <thead>
                                    <tr className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-b border-white/20">
                                      <th className="text-left py-4 px-4 font-semibold">Bowler</th>
                                      <th className="text-center py-4 px-2 font-semibold">O</th>
                                      <th className="text-center py-4 px-2 font-semibold">R</th>
                                      <th className="text-center py-4 px-2 font-semibold">W</th>
                                      <th className="text-center py-4 px-2 font-semibold">Eco</th>
                                      <th className="text-center py-4 px-2 font-semibold">0s</th>
                                      <th className="text-center py-4 px-2 font-semibold">4s</th>
                                      <th className="text-center py-4 px-2 font-semibold">6s</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {innings.bowling?.map((bowler: any, bowlerIndex: number) => (
                                      <motion.tr
                                        key={bowlerIndex}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.2 + bowlerIndex * 0.05 }}
                                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                                      >
                                        <td className="py-4 px-4">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{bowler.name}</span>
                                            {bowler.isCaptain && (
                                              <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="text-yellow-400 text-xs font-bold bg-yellow-400/20 px-2 py-1 rounded"
                                              >
                                                (c)
                                              </motion.span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="text-center py-4 px-2">{bowler.overs}</td>
                                        <td className="text-center py-4 px-2">{bowler.runs}</td>
                                        <td className="text-center py-4 px-2 font-bold text-lg text-purple-400">{bowler.wickets}</td>
                                        <td className="text-center py-4 px-2 font-medium">{bowler.economyRate}</td>
                                        <td className="text-center py-4 px-2">{bowler.dots || 0}</td>
                                        <td className="text-center py-4 px-2">{bowler.fours || 0}</td>
                                        <td className="text-center py-4 px-2">{bowler.sixes || 0}</td>
                                      </motion.tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                  {/* Playing 11 Tab */}
                  {activeModalTab === 'playing11' && (
                    <div className="space-y-6">
                      {selectedScorecard.innings?.map((innings: any, index: number) => (
                        <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                          <h3 className="text-lg font-semibold text-white mb-4">
                            {innings.battingTeamId === teamId ? team?.name : innings.battingTeamId} Playing 11
                          </h3>
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Batting Playing 11 */}
                            <div>
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Batting Playing 11
                              </h4>
                              <div className="space-y-2">
                                {innings.batting?.map((player: any, playerIndex: number) => (
                                  <div key={playerIndex} className="bg-white/5 rounded-lg p-3 border border-white/10">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="text-white font-medium">{player.name}</div>
                                        {player.isCaptain && <span className="text-yellow-400 text-xs">(c)</span>}
                                        {player.isWicketKeeper && <span className="text-blue-400 text-xs">(wk)</span>}
                                      </div>
                                      <div className="text-white/60 text-sm">
                                        {player.runs} runs ({player.balls} balls)
                                      </div>
                                    </div>
                                    <div className="text-white/40 text-xs mt-1">
                                      SR: {player.strikeRate} • {player.fours}x4s • {player.sixes}x6s
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Bowling Playing 11 */}
                            <div>
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Bowling Playing 11
                              </h4>
                              <div className="space-y-2">
                                {innings.bowling?.map((player: any, playerIndex: number) => (
                                  <div key={playerIndex} className="bg-white/5 rounded-lg p-3 border border-white/10">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="text-white font-medium">{player.name}</div>
                                        {player.isCaptain && <span className="text-yellow-400 text-xs">(c)</span>}
                                      </div>
                                      <div className="text-white/60 text-sm">
                                        {player.wickets} wickets ({player.overs} overs)
                                      </div>
                                    </div>
                                    <div className="text-white/40 text-xs mt-1">
                                      {player.overs} overs • {player.runs} runs • Eco: {player.economyRate}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Highlights Tab */}
                  {activeModalTab === 'highlights' && (
                    <div className="space-y-6">
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          Match Highlights
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="text-white font-medium mb-2"><CI.IconTrophy size={18} className="inline-block mr-2"/>Man of the Match</div>
                            <div className="text-white/80">{selectedScorecard.result?.manOfTheMatch || 'N/A'}</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="text-white font-medium mb-2"><CI.IconTarget size={18} className="inline-block mr-2"/>Result Margin</div>
                            <div className="text-white/80">{selectedScorecard.result?.margin || 'N/A'}</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="text-white font-medium mb-2"><CI.IconClock size={18} className="inline-block mr-2"/>Match Duration</div>
                            <div className="text-white/80">Full 20 overs match</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Statistics Tab */}
                  {activeModalTab === 'stats' && (
                    <div className="space-y-6">
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-400" />
                          Match Statistics
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          {selectedScorecard.innings?.map((innings: any, index: number) => (
                            <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <h4 className="text-white font-medium mb-3">
                                Innings {index + 1} Stats
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-white/60">Total Runs:</span>
                                  <span className="text-white font-medium">{innings.totalRuns}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/60">Wickets Lost:</span>
                                  <span className="text-white font-medium">{innings.totalWickets}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/60">Overs Played:</span>
                                  <span className="text-white font-medium">{innings.totalOvers}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/60">Run Rate:</span>
                                  <span className="text-white font-medium">
                                    {((innings.totalRuns / (parseFloat(innings.totalOvers) || 1)) * 6).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center"
                >
                  <div className="text-6xl mb-4"><CI.IconClipboard size={56} className="inline-block" /></div>
                  <div className="text-xl font-medium text-white mb-2">No Scorecard Available</div>
                  <div className="text-white/60">
                    Full scorecard and playing 11 details are not available for this match yet.
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Player Statistics Modal */}
      <AnimatePresence>
        {showPlayerStats && selectedPlayerForStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closePlayerStats();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl shadow-purple-500/20"
            >
              {/* Enhanced Header */}
              <div className="relative overflow-hidden">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
                  <motion.div
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%), 
                                       radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)`,
                      backgroundSize: "200% 200%",
                    }}
                  />
                </div>
                
                <div className="relative p-8 border-b border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Player Title with Animation */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <h2 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center"
                          >
                            <Users className="w-4 h-4 text-white" />
                          </motion.div>
                          Player Statistics
                        </h2>
                      </motion.div>
                      
                      {/* Player Information */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-4"
                      >
                        <div className="text-2xl font-bold text-white mb-2">{selectedPlayerForStats.name}</div>
                        <div className="flex items-center gap-4 text-white/90">
                          <span className="font-medium">{selectedPlayerForStats.role}</span>
                          {selectedPlayerForStats.nationality && (
                            <span className="text-white/70">• {selectedPlayerForStats.nationality}</span>
                          )}
                        </div>
                      </motion.div>
                      
                      {/* Team Information */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-6 text-white/60 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {team?.name}
                        </div>
                        {selectedPlayerForStats.jerseyNumber && (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{selectedPlayerForStats.jerseyNumber}</span>
                            <span>Jersey</span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                    
                    {/* Close Button */}
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={closePlayerStats}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 flex items-center justify-center border border-white/20"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Statistics Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                {isLoadingPlayerStats ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
                    />
                    <div className="text-white text-lg">Loading player statistics...</div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-8"
                  >
                    {playerStats[selectedPlayerForStats.id] ? (
                      <>
                        {/* Batting Statistics */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 }}
                          className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-6 border border-green-500/30"
                        >
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <CI.IconCricketBat size={20} className="inline-block" />
                            </motion.div>
                            Batting Statistics
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">
                                {playerStats[selectedPlayerForStats.id].runs}
                              </div>
                              <div className="text-white/60 text-sm">Runs</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">
                                {playerStats[selectedPlayerForStats.id].average}
                              </div>
                              <div className="text-white/60 text-sm">Average</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">
                                {playerStats[selectedPlayerForStats.id].strikeRate}
                              </div>
                              <div className="text-white/60 text-sm">Strike Rate</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">
                                {playerStats[selectedPlayerForStats.id].innings}
                              </div>
                              <div className="text-white/60 text-sm">Innings</div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Bowling Statistics */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7 }}
                          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl p-6 border border-blue-500/30"
                        >
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            >
                              <CI.IconTarget size={20} className="inline-block" />
                            </motion.div>
                            Bowling Statistics
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">
                                {playerStats[selectedPlayerForStats.id].wickets}
                              </div>
                              <div className="text-white/60 text-sm">Wickets</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">
                                {playerStats[selectedPlayerForStats.id].economy}
                              </div>
                              <div className="text-white/60 text-sm">Economy</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">
                                {playerStats[selectedPlayerForStats.id].overs}
                              </div>
                              <div className="text-white/60 text-sm">Overs</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">
                                {playerStats[selectedPlayerForStats.id].runsConceded}
                              </div>
                              <div className="text-white/60 text-sm">Runs Conceded</div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Overall Performance */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 }}
                          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30"
                        >
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                            >
                              <CI.IconChart size={20} className="inline-block" />
                            </motion.div>
                            Overall Performance
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">
                                {playerStats[selectedPlayerForStats.id].matches}
                              </div>
                              <div className="text-white/60 text-sm">Matches</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">
                                {playerStats[selectedPlayerForStats.id].notOuts}
                              </div>
                              <div className="text-white/60 text-sm">Not Outs</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">
                                {playerStats[selectedPlayerForStats.id].balls}
                              </div>
                              <div className="text-white/60 text-sm">Balls Faced</div>
                            </div>
                          </div>
                        </motion.div>
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center"
                      >
                        <div className="text-6xl mb-4"><CI.IconChart size={56} className="inline-block" /></div>
                        <div className="text-xl font-medium text-white mb-2">No Statistics Available</div>
                        <div className="text-white/60">
                          This player hasn't played any matches yet or statistics are not available.
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
    </div>
  );
}
