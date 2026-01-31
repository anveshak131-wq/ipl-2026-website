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
  Medal
} from 'lucide-react';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import { WPLColors, getWPLGlassmorphism, getWPLHoverGlow } from '@/lib/wplColors';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [selectedScorecard, setSelectedScorecard] = useState<any | null>(null);
  const [showScorecard, setShowScorecard] = useState(false);
  const [allScorecards, setAllScorecards] = useState<any[]>([]);
  const [activeModalTab, setActiveModalTab] = useState<'scorecard' | 'playing11'>('scorecard');
  
  // Dynamic countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 12
  });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const totalSeconds = prev.hours * 3600 + prev.minutes * 60 + prev.seconds;
        if (totalSeconds <= 0) return { hours: 0, minutes: 0, seconds: 0 };
        
        const newTotal = totalSeconds - 1;
        return {
          hours: Math.floor(newTotal / 3600),
          minutes: Math.floor((newTotal % 3600) / 60),
          seconds: newTotal % 60
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const [playerStats, setPlayerStats] = useState<{ [key: string]: any }>({});

  // Enhanced mouse tracking and animations
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: false, amount: 0.3 });
  
  // Scroll-based animations
  const { scrollYProgress } = useScroll();
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
      }
    };
    
    fetchData();
  }, [teamId]);

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
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });
        cursorX.set(x);
        cursorY.set(y);
      }
    };

    const handleMouseEnter = () => setIsHoveringLogo(true);
    const handleMouseLeave = () => setIsHoveringLogo(false);

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
  }, [cursorX, cursorY]);

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
    }

    let totalMatches = 0;
    let wins = 0;
    let losses = 0;
    let teamScores: number[] = [];
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
          // Match by team combination (ignore date since scorecards have null dates)
          ((sc.matchInfo.team1?.shortName === match.team1.shortName && 
            sc.matchInfo.team2?.shortName === match.team2.shortName) ||
           (sc.matchInfo.team1?.shortName === match.team2.shortName && 
            sc.matchInfo.team2?.shortName === match.team1.shortName))
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
        ((sc.matchInfo.team1?.shortName === match.team1.shortName && 
          sc.matchInfo.team2?.shortName === match.team2.shortName) ||
         (sc.matchInfo.team1?.shortName === match.team2.shortName && 
          sc.matchInfo.team2?.shortName === match.team1.shortName))
      ))
    );
  };

  const closeScorecard = () => {
    setShowScorecard(false);
    setSelectedMatch(null);
    setSelectedScorecard(null);
    setActiveModalTab('scorecard');
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
      const teamInnings = m.innings?.find(i => i.teamId === teamId);
      return teamInnings?.totalRuns || 0;
    }).filter(score => score > 0);
    
    const stats: TeamStats = {
      matchesPlayed: completedMatches.length,
      wins,
      losses,
      titles: 0, // Would need separate API call
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      winPercentage: completedMatches.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0
    };
    
    setTeamStats(stats);
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'all' || player.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [players, searchQuery, selectedRole]);

  const recentMatches: RecentMatch[] = useMemo(() => {
    return matches.map(match => {
      const isTeam1 = match.team1?.id === teamId;
      const opponent = isTeam1 ? match.team2?.name : match.team1?.name;
      const teamInnings = match.innings?.find(i => i.teamId === teamId);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Team Not Found</h1>
          <p className="text-xl">The team you're looking for doesn't exist.</p>
          <Link href="/wpl/teams" className="inline-block mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  const teamColors = team.colors || { primary: '#8B5CF6', secondary: '#F59E0B' };
  const logoUrl = team.logo && team.logo.startsWith('/logos/') ? team.logo : 
    (team.shortName === 'RCB-W' ? '/logos/wpl_rcb_logo_animated.svg' :
     team.shortName === 'MI-W' ? '/logos/wpl_mi_logo_animated.svg' :
     team.shortName === 'DC-W' ? '/logos/wpl_dc_logo_animated.svg' :
     team.shortName === 'GG-W' ? '/logos/wpl_gg_logo_animated.svg' :
     team.shortName === 'UPW' ? '/logos/wpl_upw_logo_animated.svg' :
     team.shortName === 'RCB' ? '/logos/rcb_logo_animated.svg' :
     team.shortName === 'MI' ? '/logos/mi_logo_animated.svg' :
     team.shortName === 'CSK' ? '/logos/csk_logo_animated.svg' :
     team.shortName === 'KKR' ? '/logos/kkr_logo_animated.svg' :
     team.shortName === 'SRH' ? '/logos/srh_logo_animated.svg' :
     team.shortName === 'RR' ? '/logos/rr_logo_animated.svg' :
     team.shortName === 'PBKS' ? '/logos/pbks_logo_animated.svg' :
     team.shortName === 'LSG' ? '/logos/lsg_logo_animated.svg' :
     team.shortName === 'GT' ? '/logos/gt_logo_animated.svg' :
     team.shortName === 'DC' ? '/logos/dc_logo_animated.svg' :
     team.logo || null);

  return (
    <div className="min-h-screen" style={{
      background: `linear-gradient(135deg, ${WPLColors.base} 0%, ${WPLColors.gradientStart} 25%, ${WPLColors.gradientMid} 50%, ${WPLColors.gradientEnd} 75%, ${WPLColors.base} 100%)`
    }}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 100%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0"
        />
      </div>

      {/* Header */}
      <motion.header
        style={{ opacity: headerOpacity, scale: headerScale }}
        className="relative z-10 bg-black/20 backdrop-blur-lg border-b border-white/10"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/wpl/teams" className="text-white/70 hover:text-white transition-colors">
              ← Back to Teams
            </Link>
            <div className="flex gap-4">
              <button className="p-2 text-white/70 hover:text-white transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-white/70 hover:text-white transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Enhanced Hero Section with Dynamic Content */}
      <section className="relative z-10 py-20" ref={containerRef}>
        {/* Live Match Ticker */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="sticky top-0 z-50 mb-8"
        >
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-full flex items-center gap-3 shadow-lg">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </motion.div>
              <span className="text-sm font-bold">LIVE</span>
              <span className="text-sm">RCB-W vs MI-W - 45/2 (6.3 overs)</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </motion.div>

        {/* Next Match Countdown */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold mb-2">Next Match</h3>
                  <p className="text-2xl font-black">RCB-W vs DC-W</p>
                  <p className="text-sm opacity-90">Tomorrow, 7:30 PM • M. Chinnaswamy Stadium</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black mb-2">
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-sm opacity-90">Hours : Minutes : Seconds</div>
                  <button className="mt-3 bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">
                    Set Reminder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social Proof Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="container mx-auto px-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex flex-wrap items-center justify-center gap-8 text-white">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-bold">2.3M</span>
                  <span className="text-sm opacity-80">Followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-bold">85%</span>
                  <span className="text-sm opacity-80">Win Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  <span className="font-bold">3</span>
                  <span className="text-sm opacity-80">Championships</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  <span className="font-bold">156K</span>
                  <span className="text-sm opacity-80">Talking About</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interactive mouse-following gradient */}
        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${teamColors.primary}40, ${teamColors.secondary}30, transparent)`,
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
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
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
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
                      <div className="text-2xl font-black text-white mb-1">#2</div>
                      <div className="text-sm text-white/70">League Position</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-green-400 mb-1">W3</div>
                      <div className="text-sm text-white/70">Last 5 Games</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-white mb-1">87%</div>
                      <div className="text-sm text-white/70">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-yellow-400 mb-1">+42</div>
                      <div className="text-sm text-white/70">Net RR</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

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

      {/* Enhanced Navigation Tabs with AI-Inspired Design */}
      <motion.section 
        className="relative z-10 sticky top-0"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)`,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid ${teamColors.primary}30`,
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.3 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-6">
            {['overview', 'squad', 'matches', 'stats', 'about'].map((tab, index) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-300 overflow-hidden group ${
                  activeTab === tab
                    ? 'text-white scale-105'
                    : 'text-white/60 hover:text-white hover:scale-105'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + index * 0.1, duration: 0.5 }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Animated background for active tab */}
                {activeTab === tab && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${teamColors.primary}40, ${teamColors.secondary}40)`,
                    }}
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-50"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${teamColors.primary}20, transparent 70%)`,
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                )}
                
                {/* Hover background */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${teamColors.primary}20, ${teamColors.secondary}20)`,
                  }}
                />
                
                {/* Tab content */}
                <span className="relative z-10 flex items-center gap-2">
                  {/* Tab icons */}
                  {tab === 'overview' && <Activity className="w-4 h-4" />}
                  {tab === 'squad' && <Users className="w-4 h-4" />}
                  {tab === 'matches' && <Calendar className="w-4 h-4" />}
                  {tab === 'stats' && <BarChart3 className="w-4 h-4" />}
                  {tab === 'about' && <Star className="w-4 h-4" />}
                  
                  {tab}
                  
                  {/* Active indicator */}
                  {activeTab === tab && (
                    <motion.div
                      className="w-2 h-2 bg-white rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </span>
                
                {/* Interactive particles on hover */}
                {activeTab === tab && (
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                          left: `${20 + i * 30}%`,
                          top: '50%',
                        }}
                        animate={{
                          x: [0, 10, 0],
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
                )}
              </motion.button>
            ))}
          </div>
          
          {/* Animated underline */}
          <motion.div
            className="h-0.5 bg-gradient-to-r from-transparent via-white to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.8, duration: 1, ease: "easeOut" }}
            style={{ originX: 0.5 }}
          />
        </div>
      </motion.section>

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
                                        📊
                                      </motion.div>
                                      Full Scorecard Available
                                    </>
                                  ) : (
                                    <>
                                      <motion.div
                                        animate={{ rotate: [0, -10, 10, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                      >
                                        📋
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
                          <Search className="w-5 h-5" />
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
                        <Filter className="w-4 h-4" />
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
                      className="relative group overflow-hidden rounded-2xl"
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
                            <Users className="w-10 h-10 text-white" />
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
                                  <Flag className="w-3 h-3" />
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

            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <motion.div
                key="matches"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Calendar className="w-6 h-6" />
                    Match Schedule
                  </h2>
                  <div className="space-y-4">
                    {matches.map((match, index) => (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className="text-white font-bold">{match.team1?.shortName}</div>
                              <div className="text-white/60 text-sm">{match.team1?.name}</div>
                            </div>
                            <div className="text-white/50">VS</div>
                            <div className="text-center">
                              <div className="text-white font-bold">{match.team2?.shortName}</div>
                              <div className="text-white/60 text-sm">{match.team2?.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">{match.date}</div>
                            <div className="text-white/60 text-sm">{match.venue}</div>
                            <div className="text-white/60 text-sm">{match.status}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
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
      
      {/* Scorecard Modal with Separate Tabs */}
      {showScorecard && selectedMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="sticky top-0 bg-gradient-to-r from-purple-900/90 to-blue-900/90 backdrop-blur-md p-6 border-b border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Match Details</h2>
                  <div className="text-white/80">
                    {selectedMatch.opponent ? `vs ${selectedMatch.opponent}` : 'Match Details'}
                  </div>
                  <div className="text-white/60 text-sm">
                    {selectedMatch.date} • {selectedMatch.venue}
                  </div>
                </div>
                <button
                  onClick={closeScorecard}
                  className="text-white/60 hover:text-white transition-colors text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveModalTab('scorecard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeModalTab === 'scorecard'
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  📊 Scorecard
                </button>
                <button
                  onClick={() => setActiveModalTab('playing11')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeModalTab === 'playing11'
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  👥 Playing 11
                </button>
              </div>
            </div>

            <div className="p-6">
              {selectedScorecard ? (
                <>
                  {/* Scorecard Tab */}
                  {activeModalTab === 'scorecard' && (
                    <div className="space-y-6">
                      {/* Match Result */}
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-2">Result</h3>
                        <div className="text-white">
                          {selectedScorecard.result?.winner} won by {selectedScorecard.result?.margin}
                        </div>
                        {selectedScorecard.result?.manOfTheMatch && (
                          <div className="text-white/60 text-sm mt-1">
                            Man of the Match: {selectedScorecard.result.manOfTheMatch}
                          </div>
                        )}
                      </div>

                      {/* Scorecard Innings */}
                      {selectedScorecard.innings?.map((innings: any, index: number) => (
                        <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                          <h3 className="text-lg font-semibold text-white mb-4">
                            Innings {index + 1} - {innings.battingTeamId === teamId ? team?.name : innings.battingTeamId}
                          </h3>
                          
                          <div className="mb-4">
                            <div className="text-white font-medium">
                              {innings.totalRuns}/{innings.totalWickets} ({innings.totalOvers} overs)
                            </div>
                          </div>

                          {/* Batting Scorecard */}
                          <div className="mb-6">
                            <h4 className="text-white font-medium mb-3">Batting Scorecard</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-white">
                                <thead>
                                  <tr className="border-b border-white/20">
                                    <th className="text-left py-2">Batsman</th>
                                    <th className="text-center py-2">R</th>
                                    <th className="text-center py-2">B</th>
                                    <th className="text-center py-2">4s</th>
                                    <th className="text-center py-2">6s</th>
                                    <th className="text-center py-2">SR</th>
                                    <th className="text-left py-2">Dismissal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {innings.batting?.map((batsman: any, batsmanIndex: number) => (
                                    <tr key={batsmanIndex} className="border-b border-white/10">
                                      <td className="py-2">
                                        <div className="flex items-center gap-2">
                                          {batsman.name}
                                          {batsman.isCaptain && <span className="text-yellow-400 text-xs">(c)</span>}
                                          {batsman.isWicketKeeper && <span className="text-blue-400 text-xs">(wk)</span>}
                                        </div>
                                      </td>
                                      <td className="text-center py-2 font-medium">{batsman.runs}</td>
                                      <td className="text-center py-2">{batsman.balls}</td>
                                      <td className="text-center py-2">{batsman.fours}</td>
                                      <td className="text-center py-2">{batsman.sixes}</td>
                                      <td className="text-center py-2">{batsman.strikeRate}</td>
                                      <td className="py-2 text-white/60 text-xs">
                                        {batsman.dismissal?.type === 'not-out' ? 'not out' : 
                                         batsman.dismissal?.details || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Bowling Scorecard */}
                          <div>
                            <h4 className="text-white font-medium mb-3">Bowling Scorecard</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-white">
                                <thead>
                                  <tr className="border-b border-white/20">
                                    <th className="text-left py-2">Bowler</th>
                                    <th className="text-center py-2">O</th>
                                    <th className="text-center py-2">R</th>
                                    <th className="text-center py-2">W</th>
                                    <th className="text-center py-2">Eco</th>
                                    <th className="text-center py-2">0s</th>
                                    <th className="text-center py-2">4s</th>
                                    <th className="text-center py-2">6s</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {innings.bowling?.map((bowler: any, bowlerIndex: number) => (
                                    <tr key={bowlerIndex} className="border-b border-white/10">
                                      <td className="py-2">
                                        <div className="flex items-center gap-2">
                                          {bowler.name}
                                          {bowler.isCaptain && <span className="text-yellow-400 text-xs">(c)</span>}
                                        </div>
                                      </td>
                                      <td className="text-center py-2">{bowler.overs}</td>
                                      <td className="text-center py-2">{bowler.runs}</td>
                                      <td className="text-center py-2 font-medium">{bowler.wickets}</td>
                                      <td className="text-center py-2">{bowler.economyRate}</td>
                                      <td className="text-center py-2">{bowler.dots || 0}</td>
                                      <td className="text-center py-2">{bowler.fours || 0}</td>
                                      <td className="text-center py-2">{bowler.sixes || 0}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
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
                                        {player.wickets} wickets
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
                </>
              ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="text-center text-white">
                    <div className="text-lg font-medium mb-2">No Scorecard Available</div>
                    <div className="text-white/60">
                      Full scorecard and playing 11 details are not available for this match yet.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
