'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  TrendingUp, 
  Target, 
  Award, 
  Activity, 
  Zap, 
  Clock, 
  BarChart3,
  Trophy,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Filter,
  Calendar,
  Search,
  Users,
  Shield,
  Heart
} from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';
import { useAdminData } from '@/contexts/AdminDataContext';

export default function AnalyticsPage() {
  const { currentLeague } = useLeague();
  const { players, teams, loading, error, refreshData } = useAdminData();
  const [selectedTimeRange, setSelectedTimeRange] = useState('season');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');

  // Calculate analytics data from real player data
  const analyticsData = useMemo(() => {
    if (!players.length || !teams.length) {
      return {
        overview: {
          totalPlayers: 0,
          activePlayers: 0,
          averageRating: 0,
          topPerformers: 0,
          emergingTalent: 0
        },
        performanceMetrics: [],
        teamStats: [],
        playerCategories: {
          batsmen: 0,
          bowlers: 0,
          allRounders: 0,
          wicketKeepers: 0
        },
        recentActivity: []
      };
    }

    // Apply filters to players
    let filteredPlayers = players;
    
    // Filter by team
    if (selectedTeam !== 'all') {
      filteredPlayers = filteredPlayers.filter(player => player.teamId === selectedTeam);
    }
    
    // Filter by role
    if (selectedRole !== 'all') {
      filteredPlayers = filteredPlayers.filter(player => {
        const role = player.role?.toLowerCase() || '';
        const stats = player.stats;
        
        switch (selectedRole) {
          case 'batsman':
            return role.includes('batsman') || role.includes('batting');
          case 'bowler':
            return role.includes('bowler') || role.includes('bowling');
          case 'batting-all-rounder':
            return (role.includes('all-rounder') || role.includes('all rounder')) && 
                   stats && stats.runs && stats.runs > 300;
          case 'bowling-all-rounder':
            return (role.includes('all-rounder') || role.includes('all rounder')) && 
                   stats && stats.wickets && stats.wickets > 15;
          case 'wicket-keeper':
            return role.includes('wicket keeper') || role.includes('keeper');
          default:
            return true;
        }
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      filteredPlayers = filteredPlayers.filter(player => 
        player.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Calculate player categories
    const playerCategories = filteredPlayers.reduce((acc, player) => {
      const role = player.role?.toLowerCase() || '';
      if (role.includes('batsman') || role.includes('batting')) {
        acc.batsmen++;
      } else if (role.includes('bowler') || role.includes('bowling')) {
        acc.bowlers++;
      } else if (role.includes('all-rounder') || role.includes('all rounder')) {
        acc.allRounders++;
      } else if (role.includes('wicket keeper') || role.includes('keeper')) {
        acc.wicketKeepers++;
      }
      return acc;
    }, { batsmen: 0, bowlers: 0, allRounders: 0, wicketKeepers: 0 });

    // For pre-season: Calculate active players as registered players (season hasn't started)
    const activePlayers = filteredPlayers.length; // All registered players are considered active for pre-season

    // For pre-season: Use historical data for performance metrics with pre-season context
    const performanceMetrics = filteredPlayers
      .filter(player => player.stats && (player.stats.runs || player.stats.wickets))
      .map(player => {
        const stats = player.stats!;
        const team = teams.find(t => t.id === player.teamId);
        
        // Calculate rating based on player role and relevant stats
        let rating = 5.0; // Base rating
        const role = player.role?.toLowerCase() || '';
        
        // Role-specific rating calculation with precise percentages
        if (role.includes('batsman') || role.includes('batting')) {
          // Batsman rating: 100% batting stats
          if (stats.runs) {
            rating += Math.min(stats.runs / 120, 5); // Full weight for runs
          }
          if (stats.battingAverage) {
            const avg = parseFloat(stats.battingAverage);
            if (!isNaN(avg)) {
              rating += Math.min(avg / 25, 4); // Full weight for average
            }
          }
          if (stats.battingStrikeRate) {
            const sr = parseFloat(stats.battingStrikeRate);
            if (!isNaN(sr) && sr > 130) {
              rating += Math.min((sr - 130) / 15, 3); // Full weight for strike rate
            }
          }
        } else if (role.includes('bowler') || role.includes('bowling')) {
          // Bowler rating: 100% bowling stats
          if (stats.wickets) {
            rating += Math.min(stats.wickets / 4, 5); // Full weight for wickets
          }
          if (stats.economy) {
            const econ = parseFloat(stats.economy);
            if (!isNaN(econ)) {
              if (econ < 7) {
                rating += Math.min((7 - econ) / 1.5, 4); // Full weight for economy
              } else if (econ > 9) {
                rating -= Math.min((econ - 9) / 1.5, 3); // Full penalty for bad economy
              }
            }
          }
          if (stats.bowlingAverage) {
            const avg = parseFloat(stats.bowlingAverage);
            if (!isNaN(avg) && avg < 25) {
              rating += Math.min((25 - avg) / 4, 3); // Full weight for bowling average
            }
          }
        } else if (role.includes('all-rounder') || role.includes('all rounder')) {
          // Check if batting all-rounder or bowling all-rounder
          const isBattingAllRounder = stats.runs && stats.runs > 300; // Threshold for batting all-rounder
          const isBowlingAllRounder = stats.wickets && stats.wickets > 15; // Threshold for bowling all-rounder
          
          if (isBattingAllRounder) {
            // Batting All-Rounder: 75% batting + 25% bowling
            // Batting stats (75% weight)
            if (stats.runs) {
              rating += Math.min(stats.runs / 160, 3.75); // 75% of batsman weight
            }
            if (stats.battingAverage) {
              const avg = parseFloat(stats.battingAverage);
              if (!isNaN(avg)) {
                rating += Math.min(avg / 33, 3); // 75% of batsman weight
              }
            }
            if (stats.battingStrikeRate) {
              const sr = parseFloat(stats.battingStrikeRate);
              if (!isNaN(sr) && sr > 130) {
                rating += Math.min((sr - 130) / 20, 2.25); // 75% of batsman weight
              }
            }
            // Bowling stats (25% weight)
            if (stats.wickets) {
              rating += Math.min(stats.wickets / 16, 1.25); // 25% of bowler weight
            }
            if (stats.economy) {
              const econ = parseFloat(stats.economy);
              if (!isNaN(econ) && econ < 8) {
                rating += Math.min((8 - econ) / 6, 1); // 25% of bowler weight
              }
            }
          } else if (isBowlingAllRounder) {
            // Bowling All-Rounder: 75% bowling + 25% batting
            // Bowling stats (75% weight)
            if (stats.wickets) {
              rating += Math.min(stats.wickets / 5.3, 3.75); // 75% of bowler weight
            }
            if (stats.economy) {
              const econ = parseFloat(stats.economy);
              if (!isNaN(econ)) {
                if (econ < 7) {
                  rating += Math.min((7 - econ) / 2, 3); // 75% of bowler weight
                } else if (econ > 9) {
                  rating -= Math.min((econ - 9) / 2, 2.25); // 75% of bowler penalty
                }
              }
            }
            if (stats.bowlingAverage) {
              const avg = parseFloat(stats.bowlingAverage);
              if (!isNaN(avg) && avg < 25) {
                rating += Math.min((25 - avg) / 5.3, 2.25); // 75% of bowler weight
              }
            }
            // Batting stats (25% weight)
            if (stats.runs) {
              rating += Math.min(stats.runs / 480, 1.25); // 25% of batsman weight
            }
            if (stats.battingAverage) {
              const avg = parseFloat(stats.battingAverage);
              if (!isNaN(avg)) {
                rating += Math.min(avg / 100, 1); // 25% of batsman weight
              }
            }
          } else {
            // Default all-rounder (balanced 50-50)
            if (stats.runs) {
              rating += Math.min(stats.runs / 240, 2.5); // 50% of batsman weight
            }
            if (stats.wickets) {
              rating += Math.min(stats.wickets / 8, 2.5); // 50% of bowler weight
            }
            if (stats.battingAverage) {
              const avg = parseFloat(stats.battingAverage);
              if (!isNaN(avg)) {
                rating += Math.min(avg / 50, 2); // 50% of batsman weight
              }
            }
            if (stats.economy) {
              const econ = parseFloat(stats.economy);
              if (!isNaN(econ) && econ < 8) {
                rating += Math.min((8 - econ) / 4, 2); // 50% of bowler weight
              }
            }
          }
        } else if (role.includes('wicket keeper') || role.includes('keeper')) {
          // Wicket-keeper rating: 100% batting stats (same as batsman)
          if (stats.runs) {
            rating += Math.min(stats.runs / 120, 5); // Full weight for runs
          }
          if (stats.battingAverage) {
            const avg = parseFloat(stats.battingAverage);
            if (!isNaN(avg)) {
              rating += Math.min(avg / 25, 4); // Full weight for average
            }
          }
          if (stats.battingStrikeRate) {
            const sr = parseFloat(stats.battingStrikeRate);
            if (!isNaN(sr) && sr > 130) {
              rating += Math.min((sr - 130) / 15, 3); // Full weight for strike rate
            }
          }
          // Add keeping bonus
          rating += 1; // Base keeping bonus
        }
        
        // Role-specific trend calculation with precise thresholds
        let trend = 'stable';
        if (role.includes('batsman') || role.includes('batting')) {
          // Batsman trends based on batting performance
          if (stats.runs && stats.runs > 400) trend = 'up';
          else if (stats.runs && stats.runs < 200) trend = 'down';
          else if (stats.battingAverage && parseFloat(stats.battingAverage) > 30) trend = 'up';
          else if (stats.battingAverage && parseFloat(stats.battingAverage) < 18) trend = 'down';
        } else if (role.includes('bowler') || role.includes('bowling')) {
          // Bowler trends based on bowling performance
          if (stats.wickets && stats.wickets > 20) trend = 'up';
          else if (stats.wickets && stats.wickets < 10) trend = 'down';
          else if (stats.economy && parseFloat(stats.economy) < 7.5) trend = 'up';
          else if (stats.economy && parseFloat(stats.economy) > 9.5) trend = 'down';
        } else if (role.includes('all-rounder') || role.includes('all rounder')) {
          // All-rounder trends based on both skills
          const isBattingAllRounder = stats.runs && stats.runs > 300;
          const isBowlingAllRounder = stats.wickets && stats.wickets > 15;
          
          if (isBattingAllRounder) {
            // Batting all-rounder: 75% batting focus for trends
            if (stats.runs && stats.runs > 350) trend = 'up';
            else if (stats.runs && stats.runs < 250) trend = 'down';
            else if (stats.battingAverage && parseFloat(stats.battingAverage) > 28) trend = 'up';
            else if (stats.battingAverage && parseFloat(stats.battingAverage) < 20) trend = 'down';
          } else if (isBowlingAllRounder) {
            // Bowling all-rounder: 75% bowling focus for trends
            if (stats.wickets && stats.wickets > 18) trend = 'up';
            else if (stats.wickets && stats.wickets < 12) trend = 'down';
            else if (stats.economy && parseFloat(stats.economy) < 8) trend = 'up';
            else if (stats.economy && parseFloat(stats.economy) > 9) trend = 'down';
          } else {
            // Balanced all-rounder
            if (stats.runs && stats.runs > 250 && stats.wickets && stats.wickets > 12) trend = 'up';
            else if ((stats.runs && stats.runs < 200) || (stats.wickets && stats.wickets < 8)) trend = 'down';
          }
        } else if (role.includes('wicket keeper') || role.includes('keeper')) {
          // Wicket-keeper trends based on batting performance (same as batsman)
          if (stats.runs && stats.runs > 350) trend = 'up';
          else if (stats.runs && stats.runs < 180) trend = 'down';
          else if (stats.battingAverage && parseFloat(stats.battingAverage) > 28) trend = 'up';
          else if (stats.battingAverage && parseFloat(stats.battingAverage) < 20) trend = 'down';
        }
        
        // Give Virat Kohli highest rating only for batting-focused roles
        let finalRating = Math.min(rating, 10);
        if (player.name.toLowerCase().includes('virat')) {
          // Only give Virat #1 priority for batting-focused roles
          if (role.includes('batsman') || role.includes('batting') || role.includes('wicket keeper') || role.includes('keeper')) {
            finalRating = 10; // Maximum rating for Virat in batting roles
            trend = 'up'; // Always show positive trend for Virat
          }
          // For bowling all-rounders, don't give automatic #1
          // For pure bowlers, don't give automatic #1
        }
        
        return {
          id: player.id,
          name: player.name,
          team: team?.name || 'Unknown',
          role: player.role || 'Unknown',
          runs: stats.runs || 0,
          average: stats.battingAverage ? parseFloat(stats.battingAverage) || 0 : 0,
          strikeRate: stats.battingStrikeRate ? parseFloat(stats.battingStrikeRate) || 0 : 0,
          wickets: stats.wickets || 0,
          economy: stats.economy ? parseFloat(stats.economy) || 0 : 0,
          bowlingAverage: stats.bowlingAverage ? parseFloat(stats.bowlingAverage) || 0 : 0,
          rating: Math.min(finalRating, 10),
          trend,
          lastSeason: true // Flag to indicate this is last season data
        };
      })
      .sort((a, b) => {
        // Prioritize Virat Kohli at the top only for batting-focused roles
        const isBattingRole = (role: string) => 
          role.includes('batsman') || role.includes('batting') || 
          role.includes('wicket keeper') || role.includes('keeper');
        
        const aIsBatting = isBattingRole(a.role || '');
        const bIsBatting = isBattingRole(b.role || '');
        
        // If both are batting roles and one is Virat, prioritize Virat
        if (aIsBatting && bIsBatting) {
          if (a.name.toLowerCase().includes('virat') && !b.name.toLowerCase().includes('virat')) return -1;
          if (b.name.toLowerCase().includes('virat') && !a.name.toLowerCase().includes('virat')) return 1;
        }
        
        // Otherwise, sort by rating
        return b.rating - a.rating;
      })
      .slice(0, 10);

    // Calculate team statistics (squad composition only, no performance stats)
    const teamStats = teams.map(team => {
      const teamPlayers = filteredPlayers.filter(p => p.teamId === team.id);
      const playerCategories = teamPlayers.reduce((acc, player) => {
        const role = player.role?.toLowerCase() || '';
        if (role.includes('batsman') || role.includes('batting')) {
          acc.batsmen++;
        } else if (role.includes('bowler') || role.includes('bowling')) {
          acc.bowlers++;
        } else if (role.includes('all-rounder') || role.includes('all rounder')) {
          acc.allRounders++;
        } else if (role.includes('wicket keeper') || role.includes('keeper')) {
          acc.wicketKeepers++;
        }
        return acc;
      }, { batsmen: 0, bowlers: 0, allRounders: 0, wicketKeepers: 0 });

      return {
        team: team.name,
        players: teamPlayers.length,
        playerCategories,
        avgAge: teamPlayers.length > 0 
          ? teamPlayers.reduce((sum, p) => sum + (parseInt(p.age) || 0), 0) / teamPlayers.length 
          : 0,
        squadStrength: teamPlayers.length >= 20 ? 'Strong' : teamPlayers.length >= 15 ? 'Balanced' : 'Limited'
      };
    });

    // Calculate overview metrics for pre-season
    const topPerformers = performanceMetrics.filter(p => p.rating >= 8.0).length; // Adjusted threshold for pre-season
    const averageRating = performanceMetrics.length > 0 
      ? performanceMetrics.reduce((sum, p) => sum + p.rating, 0) / performanceMetrics.length 
      : 0;

    // Pre-season activity (based on recent team changes, auctions, etc.)
    const recentActivity = [
      { player: 'Season Preview', action: 'Teams finalized for IPL 2026', match: 'All Teams', time: 'Pre-season', impact: 'high' },
      { player: 'Player Auction', action: 'New players acquired', match: 'Auction Event', time: '2 weeks ago', impact: 'high' },
      { player: 'Training Camp', action: 'Teams preparing for season', match: 'Training Facilities', time: '1 week ago', impact: 'medium' },
      { player: 'Squad Announcement', action: 'Final squads announced', match: 'All Teams', time: '3 days ago', impact: 'high' }
    ];

    return {
      overview: {
        totalPlayers: filteredPlayers.length,
        activePlayers, // All registered players for pre-season
        averageRating,
        topPerformers,
        emergingTalent: filteredPlayers.filter(p => p.age && parseInt(p.age) <= 25).length,
        seasonStatus: 'pre-season' // Add season status indicator
      },
      performanceMetrics,
      teamStats,
      playerCategories,
      recentActivity
    };
  }, [players, teams, selectedTeam, selectedRole, searchQuery]);

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const MetricCard = ({ title, value, change, icon: Icon, color, subtitle }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-gray-300 text-sm font-medium">{title}</h3>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{value}</div>
          <div className="flex items-center gap-2">
            {change && <div className={`flex items-center gap-1 text-sm ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(change)}%
            </div>}
            <span className="text-gray-400 text-xs">{subtitle}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const PlayerOverview = () => (
    <div className="space-y-6">
      {/* Season Status Banner */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-blue-400 font-semibold">Player Analytics</h3>
            <p className="text-gray-400 text-sm">Comprehensive player performance analysis and rankings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Players"
          value={analyticsData.overview.totalPlayers}
          change={8.2}
          icon={Users}
          color="bg-blue-500/20"
          subtitle="registered for IPL 2026"
        />
        <MetricCard
          title="Squad Players"
          value={analyticsData.overview.activePlayers}
          change={12.5}
          icon={Activity}
          color="bg-green-500/20"
          subtitle="in team squads"
        />
        <MetricCard
          title="Avg Rating"
          value={analyticsData.overview.averageRating.toFixed(1)}
          change={3.8}
          icon={Star}
          color="bg-yellow-500/20"
          subtitle="last season performance"
        />
        <MetricCard
          title="Key Players"
          value={analyticsData.overview.topPerformers}
          change={15.3}
          icon={Trophy}
          color="bg-purple-500/20"
          subtitle="rating 8.0+"
        />
        <MetricCard
          title="Young Talent"
          value={analyticsData.overview.emergingTalent}
          change={22.1}
          icon={Target}
          color="bg-orange-500/20"
          subtitle="age 25 or under"
        />
      </div>

      {/* Player Categories */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Squad Composition</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400">{analyticsData.playerCategories.batsmen}</div>
            <div className="text-sm text-gray-400 mt-1">Batsmen</div>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{analyticsData.playerCategories.bowlers}</div>
            <div className="text-sm text-gray-400 mt-1">Bowlers</div>
          </div>
          <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-400">{analyticsData.playerCategories.allRounders}</div>
            <div className="text-sm text-gray-400 mt-1">All-Rounders</div>
          </div>
          <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="text-2xl font-bold text-orange-400">{analyticsData.playerCategories.wicketKeepers}</div>
            <div className="text-sm text-gray-400 mt-1">Wicket Keepers</div>
          </div>
        </div>
      </div>
    </div>
  );

  const TopPerformers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Player Rankings</h3>
          <p className="text-gray-400 text-sm">Based on performance metrics and ratings</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium">Player</th>
                <th className="text-left p-4 text-gray-400 font-medium">Team</th>
                <th className="text-left p-4 text-gray-400 font-medium">Role</th>
                {(selectedRole === 'all' || selectedRole === 'batsman' || selectedRole === 'wicket-keeper' || selectedRole === 'batting-all-rounder') && (
                  <th className="text-left p-4 text-gray-400 font-medium">Runs</th>
                )}
                {(selectedRole === 'all' || selectedRole === 'batsman' || selectedRole === 'wicket-keeper' || selectedRole === 'batting-all-rounder') && (
                  <th className="text-left p-4 text-gray-400 font-medium">Average</th>
                )}
                {(selectedRole === 'all' || selectedRole === 'batsman' || selectedRole === 'wicket-keeper' || selectedRole === 'batting-all-rounder') && (
                  <th className="text-left p-4 text-gray-400 font-medium">Strike Rate</th>
                )}
                {(selectedRole === 'all' || selectedRole === 'bowler' || selectedRole === 'bowling-all-rounder') && (
                  <th className="text-left p-4 text-gray-400 font-medium">Wickets</th>
                )}
                {(selectedRole === 'all' || selectedRole === 'bowler' || selectedRole === 'bowling-all-rounder') && (
                  <th className="text-left p-4 text-gray-400 font-medium">Economy</th>
                )}
                {(selectedRole === 'all' || selectedRole === 'bowler' || selectedRole === 'bowling-all-rounder') && (
                  <th className="text-left p-4 text-gray-400 font-medium">Bowling Avg</th>
                )}
                <th className="text-left p-4 text-gray-400 font-medium">Rating</th>
                <th className="text-left p-4 text-gray-400 font-medium">Form Trend</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.performanceMetrics.map((player, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">{player.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{player.team}</td>
                  <td className="p-4 text-gray-400 text-sm capitalize">{player.role || 'Unknown'}</td>
                  {(selectedRole === 'all' || selectedRole === 'batsman' || selectedRole === 'wicket-keeper' || selectedRole === 'batting-all-rounder') && (
                    <td className="p-4 text-white font-medium">{player.runs || '-'}</td>
                  )}
                  {(selectedRole === 'all' || selectedRole === 'batsman' || selectedRole === 'wicket-keeper' || selectedRole === 'batting-all-rounder') && (
                    <td className="p-4 text-gray-300">{player.average ? player.average.toFixed(1) : '-'}</td>
                  )}
                  {(selectedRole === 'all' || selectedRole === 'batsman' || selectedRole === 'wicket-keeper' || selectedRole === 'batting-all-rounder') && (
                    <td className="p-4 text-gray-300">{player.strikeRate ? player.strikeRate.toFixed(1) : '-'}</td>
                  )}
                  {(selectedRole === 'all' || selectedRole === 'bowler' || selectedRole === 'bowling-all-rounder') && (
                    <td className="p-4 text-white font-medium">{player.wickets || '-'}</td>
                  )}
                  {(selectedRole === 'all' || selectedRole === 'bowler' || selectedRole === 'bowling-all-rounder') && (
                    <td className="p-4 text-gray-300">{player.economy ? player.economy.toFixed(2) : '-'}</td>
                  )}
                  {(selectedRole === 'all' || selectedRole === 'bowler' || selectedRole === 'bowling-all-rounder') && (
                    <td className="p-4 text-gray-300">{player.bowlingAverage ? player.bowlingAverage.toFixed(1) : '-'}</td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-yellow-400 font-medium">{player.rating.toFixed(1)}</div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(player.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1 text-sm ${
                      player.trend === 'up' ? 'text-green-400' : 
                      player.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {player.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : 
                       player.trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : 
                       <div className="w-4 h-4 flex items-center justify-center">—</div>}
                      {player.trend === 'up' ? 'Strong' : player.trend === 'down' ? 'Declining' : 'Stable'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const TeamAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Team Analysis</h3>
          <p className="text-gray-400 text-sm">Squad composition and player statistics</p>
        </div>
        <button
          onClick={handleRefreshData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analyticsData.teamStats.map((team, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">{team.team}</h4>
              <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                team.squadStrength === 'Strong' ? 'bg-green-500/20 text-green-400' :
                team.squadStrength === 'Balanced' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {team.squadStrength} Squad
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <div className="text-xl font-bold text-blue-400">{team.players}</div>
                <div className="text-xs text-gray-400">Total Players</div>
              </div>
              <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                <div className="text-xl font-bold text-purple-400">{team.avgAge.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Average Age</div>
              </div>
            </div>
            
            {/* Player Categories Breakdown */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-300 mb-2">Squad Breakdown</h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded">
                  <span className="text-xs text-blue-300">Batsmen</span>
                  <span className="text-sm font-medium text-blue-400">{team.playerCategories.batsmen}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-500/10 rounded">
                  <span className="text-xs text-green-300">Bowlers</span>
                  <span className="text-sm font-medium text-green-400">{team.playerCategories.bowlers}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded">
                  <span className="text-xs text-purple-300">All-Rounders</span>
                  <span className="text-sm font-medium text-purple-400">{team.playerCategories.allRounders}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-500/10 rounded">
                  <span className="text-xs text-orange-300">Wicket Keepers</span>
                  <span className="text-sm font-medium text-orange-400">{team.playerCategories.wicketKeepers}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Shield className="w-3 h-3" />
                <span>Squad composition for IPL 2026</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

      
  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">IPL 2026 Player Analytics</h1>
            <p className="text-gray-400">Comprehensive player performance analysis and rankings</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white placeholder-gray-400 outline-none text-sm"
              />
            </div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="flex items-center gap-2 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-gray-300 hover:bg-slate-700 transition-colors outline-none"
            >
              <option value="all">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex items-center gap-2 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-gray-300 hover:bg-slate-700 transition-colors outline-none"
            >
              <option value="all">All Roles</option>
              <option value="batsman">Batsman</option>
              <option value="bowler">Bowler</option>
              <option value="batting-all-rounder">Batting All-Rounder</option>
              <option value="bowling-all-rounder">Bowling All-Rounder</option>
              <option value="wicket-keeper">Wicket-Keeper</option>
            </select>
            <button
              onClick={handleRefreshData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/50 border border-white/10 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'performers', label: 'Player Rankings', icon: Trophy },
            { id: 'teams', label: 'Team Analysis', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {loading || isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <PlayerOverview />}
            {activeTab === 'performers' && <TopPerformers />}
            {activeTab === 'teams' && <TeamAnalytics />}
          </>
        )}
      </div>
    </div>
  );
}
