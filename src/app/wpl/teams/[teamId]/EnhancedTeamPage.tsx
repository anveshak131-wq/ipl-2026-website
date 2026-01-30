'use client';

import { useState, useEffect, useMemo } from 'react';
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

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const headerScale = useTransform(scrollY, [0, 300], [1, 0.8]);

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch team data
      const teamsResponse = await fetch(`/api/teams?league=wpl`);
      if (teamsResponse.ok) {
        const teams = await teamsResponse.json();
        console.log('EnhancedTeamPage: Looking for teamId:', teamId);
        console.log('EnhancedTeamPage: Available teams:', teams.map((t: Team) => ({ id: t.id, name: t.name, shortName: t.shortName })));
        
        // Enhanced team matching logic
        const normalizedTeamId = teamId.toLowerCase().trim();
        let foundTeam = null;
        
        // Try multiple matching strategies
        foundTeam = teams.find((t: Team) => {
          const teamShortName = t.shortName?.toLowerCase().trim();
          const teamId = String(t.id).toLowerCase().trim();
          
          // Exact shortName match (e.g., "rcb-w" === "rcb-w")
          if (teamShortName === normalizedTeamId) {
            console.log('EnhancedTeamPage: Exact shortName match:', t.name);
            return true;
          }
          
          // ID match (e.g., "12" === "12")
          if (teamId === normalizedTeamId) {
            console.log('EnhancedTeamPage: ID match:', t.name);
            return true;
          }
          
          // Handle variations without -w suffix (e.g., "rcb" matches "rcb-w")
          if (normalizedTeamId === 'rcb' && teamShortName === 'rcb-w') {
            console.log('EnhancedTeamPage: RCB variation match:', t.name);
            return true;
          }
          
          if (normalizedTeamId === 'mi' && teamShortName === 'mi-w') {
            console.log('EnhancedTeamPage: MI variation match:', t.name);
            return true;
          }
          
          if (normalizedTeamId === 'dc' && teamShortName === 'dc-w') {
            console.log('EnhancedTeamPage: DC variation match:', t.name);
            return true;
          }
          
          // Handle team prefix format (e.g., "team12" === "12")
          if (normalizedTeamId.replace('team', '') === teamId) {
            console.log('EnhancedTeamPage: Team prefix match:', t.name);
            return true;
          }
          
          return false;
        });
        
        console.log('EnhancedTeamPage: Final team result:', foundTeam ? foundTeam.name : 'null');
        
        if (foundTeam) {
          setTeam(foundTeam);
          
          // Fetch players
          const playersResponse = await fetch(`/api/players?teamId=${foundTeam.id}&league=wpl`);
          if (playersResponse.ok) {
            const teamPlayers = await playersResponse.json();
            setPlayers(teamPlayers);
          }
          
          // Fetch matches
          const matchesResponse = await fetch(`/api/matches?teamId=${foundTeam.id}&league=wpl`);
          if (matchesResponse.ok) {
            const teamMatches = await matchesResponse.json();
            setMatches(teamMatches);
          }
          
          // Fetch coaching staff
          const coachesResponse = await fetch(`/api/coaches?teamId=${foundTeam.id}`);
          if (coachesResponse.ok) {
            const staff = await coachesResponse.json();
            setCoachingStaff(staff);
          }
          
          // Calculate team stats
          calculateTeamStats(teamMatches);
        }
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
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
                {/* Recent Matches */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Clock className="w-6 h-6" />
                    Recent Matches
                  </h2>
                  <div className="space-y-4">
                    {recentMatches.map((match, index) => (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
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
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

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
    </div>
  );
}
