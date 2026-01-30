'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  Facebook
} from 'lucide-react';
import { api } from '@/lib/data';
import { Team, Player, Match, Trophy as TrophyType, CoachingStaff } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

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
    
    // Find the corresponding scorecard for this match
    const scorecard = allScorecards.find(sc => 
      sc.matchId === match.id || 
      (sc.matchInfo && (
        String(sc.matchInfo.team1?.id) === String(match.team1Id) &&
        String(sc.matchInfo.team2?.id) === String(match.team2Id)
      ))
    );
    
    if (scorecard) {
      console.log('Found scorecard for match:', scorecard.id);
      setSelectedMatch(match);
      setSelectedScorecard(scorecard);
      setShowScorecard(true);
    } else {
      console.log('No scorecard found for match:', match.id);
      // Still show the match info even without scorecard
      setSelectedMatch(match);
      setSelectedScorecard(null);
      setShowScorecard(true);
    }
  };

  const closeScorecard = () => {
    setShowScorecard(false);
    setSelectedMatch(null);
    setSelectedScorecard(null);
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
    return matches.slice(-5).map(match => {
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
        venue: match.venue || 'TBD'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
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

      {/* Hero Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="relative inline-block mb-8">
              <motion.div
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(139, 92, 246, 0.5)",
                    "0 0 40px rgba(139, 92, 246, 0.8)",
                    "0 0 20px rgba(139, 92, 246, 0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20"
              >
                {team.logo ? (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={120}
                    height={120}
                    className="rounded-xl"
                  />
                ) : (
                  <Shield className="w-16 h-16 text-white" />
                )}
              </motion.div>
            </div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-bold text-white mb-4"
              style={{ textShadow: `0 0 30px ${teamColors.primary}` }}
            >
              {team.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-white/80 mb-8"
            >
              {team.shortName} • Women's Premier League
            </motion.p>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {teamStats && (
                <>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <div className="text-3xl font-bold text-white mb-2">{teamStats.matchesPlayed}</div>
                    <div className="text-white/70 text-sm">Matches</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <div className="text-3xl font-bold text-green-400 mb-2">{teamStats.wins}</div>
                    <div className="text-white/70 text-sm">Wins</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <div className="text-3xl font-bold text-white mb-2">{teamStats.winPercentage}%</div>
                    <div className="text-white/70 text-sm">Win Rate</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">{teamStats.highestScore}</div>
                    <div className="text-white/70 text-sm">Highest Score</div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="relative z-10 sticky top-0 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-4">
            {['overview', 'squad', 'matches', 'stats', 'about'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-medium transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
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

                {/* Key Players */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Star className="w-6 h-6" />
                    Key Players
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {players.slice(0, 3).map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-medium">{player.name}</div>
                            <div className="text-white/60 text-sm">{player.role}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-white font-bold">{player.stats?.runs || 0}</div>
                            <div className="text-white/60 text-xs">Runs</div>
                          </div>
                          <div>
                            <div className="text-white font-bold">{player.stats?.wickets || 0}</div>
                            <div className="text-white/60 text-xs">Wickets</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
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
                {/* Match Schedule */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Calendar className="w-6 h-6" />
                    Match Schedule
                  </h2>
                  <div className="space-y-4">
                    {recentMatches.map((match, index) => (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => handleMatchClick(match)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${
                              match.result === 'win' ? 'bg-green-500' :
                              match.result === 'loss' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <div>
                              <div className="text-white font-medium">vs {match.opponent}</div>
                              <div className="text-white/60 text-sm">{match.score}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white/60 text-sm">{match.date}</div>
                            <div className="text-white/60 text-sm">{match.venue}</div>
                            <div className="text-blue-400 text-xs mt-1">Click for details</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

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
                {/* Search and Filter */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      />
                    </div>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    >
                      <option value="all">All Roles</option>
                      <option value="Batsman">Batsman</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-rounder">All-rounder</option>
                      <option value="Wicket-keeper">Wicket-keeper</option>
                    </select>
                  </div>
                </div>

                {/* Players Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlayers.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{player.name}</h3>
                          <p className="text-white/70">{player.role}</p>
                          {player.nationality && (
                            <p className="text-white/60 text-sm flex items-center gap-1">
                              <Flag className="w-3 h-3" />
                              {player.nationality}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {player.stats && (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-white font-bold">{player.stats.runs || 0}</div>
                            <div className="text-white/60 text-xs">Runs</div>
                          </div>
                          <div>
                            <div className="text-white font-bold">{player.stats.wickets || 0}</div>
                            <div className="text-white/60 text-xs">Wickets</div>
                          </div>
                          <div>
                            <div className="text-white font-bold">{player.stats.average || 0}</div>
                            <div className="text-white/60 text-xs">Average</div>
                          </div>
                        </div>
                      )}
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
      
      {/* Full Scorecard Modal */}
      {showScorecard && selectedMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="sticky top-0 bg-gradient-to-r from-purple-900/90 to-blue-900/90 backdrop-blur-md p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Match Scorecard</h2>
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
            </div>

            <div className="p-6 space-y-6">
              {selectedScorecard ? (
                <>
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

                      {/* Playing 11 - Batting Scorecard */}
                      <div className="mb-6">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Playing 11 - Batting
                        </h4>
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

                      {/* Playing 11 - Bowling Scorecard */}
                      <div>
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Playing 11 - Bowling
                        </h4>
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
