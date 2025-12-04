'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Team } from '@/types';
import { api } from '@/lib/data';
import { isPlaceholderTeam } from '@/lib/playoffUtils';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { getOptimalTextColorForGradient } from '@/lib/colorUtils';
import { motion } from 'framer-motion';

export default function TeamsShowcase() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Helper function to normalize team/player IDs for matching
        const normalizeId = (id: string | number | undefined): string => {
          if (!id) return '';
          const str = String(id).trim();
          const numMatch = str.replace(/^team/i, '').match(/^\d+$/);
          return numMatch ? numMatch[0] : str.toLowerCase();
        };
        
        // Fetch both teams and players to ensure player counts are accurate
        const [teamsData, playersData] = await Promise.all([
          api.getTeams(),
          api.getPlayers().catch(() => []) // Don't fail if players fetch fails
        ]);
        
        console.log('TeamsShowcase: Fetched players:', playersData?.length || 0);
        
        // Filter out placeholder teams
        const realTeams = teamsData
          .filter(team => !isPlaceholderTeam(team))
          .map(team => {
            const normalizedTeamId = normalizeId(team.id);
            const teamIdVariations = [
              String(team.id),
              normalizedTeamId,
              `team${normalizedTeamId}`,
              String(team.id).replace(/^team/i, ''),
              String(team.id).toLowerCase(),
              String(team.id).toUpperCase()
            ];
            
            // Attach players to teams with improved matching
            const teamPlayers = (playersData || []).filter(player => {
              const normalizedPlayerTeamId = normalizeId(player.teamId);
              const playerTeamIdVariations = [
                String(player.teamId),
                normalizedPlayerTeamId,
                `team${normalizedPlayerTeamId}`,
                String(player.teamId).replace(/^team/i, ''),
                String(player.teamId).toLowerCase(),
                String(player.teamId).toUpperCase()
              ];
              
              // Check if any variation matches
              return teamIdVariations.some(tv => 
                playerTeamIdVariations.some(pv => pv === tv)
              );
            });
            
            if (teamPlayers.length > 0) {
              console.log(`TeamsShowcase: Matched ${teamPlayers.length} players for team ${team.name} (ID: ${team.id})`);
            } else if (playersData && playersData.length > 0) {
              console.warn(`TeamsShowcase: No players matched for team ${team.name} (ID: ${team.id}). Sample player teamIds:`, 
                playersData.slice(0, 3).map(p => p.teamId));
            }
            
            return {
              ...team,
              players: teamPlayers.length > 0 ? teamPlayers : (team.players || [])
            };
          });
        
        setTeams(realTeams);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-black via-slate-900 to-black">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600/20 to-pink-600/20 backdrop-blur-sm px-6 py-3 rounded-full border border-orange-500/30">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-orange-400 tracking-wider">10 ELITE FRANCHISES</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
            THE <span className="bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 bg-clip-text text-transparent">POWERHOUSES</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Discover the legendary franchises battling for cricket supremacy in IPL 2026
          </p>
        </div>

        {/* Teams Grid - Modern Bento Style */}
        <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } }
          }}
          initial="hidden"
          animate="show"
        >
          {teams.map((team, index) => (
            <motion.div
              key={team.id}
              onMouseEnter={() => setHoveredTeam(team.id)}
              onMouseLeave={() => setHoveredTeam(null)}
              onClick={() => {
                const teamRoute = team.id.startsWith('team') ? team.id : `team${team.id}`;
                // Use league-specific route for WPL teams
                const basePath = team.league === 'wpl' ? '/wpl/teams' : '/teams';
                router.push(`${basePath}/${teamRoute}`);
              }}
              className="group relative overflow-hidden rounded-2xl cursor-pointer"
              variants={{
                hidden: { opacity: 0, y: 8, scale: 0.995 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Gradient */}
              <div 
                className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`
                }}
              />

              {/* Glow Effect */}
              <div 
                className="absolute -inset-2 opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle, ${team.colors.primary}, transparent)`
                }}
              />

              {/* Content */}
              <div className="relative aspect-square p-6 flex flex-col items-center justify-center space-y-4">
                {/* Team Logo with animated version */}
                <motion.div className="relative w-20 h-20 md:w-24 md:h-24"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.16, rotate: 8 }}
                  transition={{ duration: 0.45 }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md transition-all duration-500" />
                  {(() => {
                    const logoPath = getAnimatedLogoPath(team.id, team.shortName, team.league);
                    if (logoPath.endsWith('.json')) {
                      return (
                        <div className="relative w-full h-full">
                          <RCBLottie className="w-full h-full" />
                        </div>
                      );
                    } else if (logoPath.endsWith('rcb_logo_premium.svg')) {
                      return (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <RCBLionLogo className="w-full h-full" />
                        </div>
                      );
                    } else {
                      return (
                        <motion.img 
                          src={logoPath} 
                          alt={team.shortName}
                          className="relative w-full h-full object-contain drop-shadow-2xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getLogoPath(team.id);
                          }}
                          initial={{ scale: 1 }}
                          transition={{ duration: 0.45 }}
                        />
                      );
                    }
                  })()}
                </motion.div>

                {/* Team Name */}
                <div className="text-center space-y-1 transition-transform duration-300">
                  <p 
                    className="font-black text-lg md:text-xl tracking-tight"
                    style={{ 
                      color: getOptimalTextColorForGradient(`linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`)
                    }}
                  >
                    {team.shortName}
                  </p>
                  <p 
                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-1"
                    style={{ 
                      color: getOptimalTextColorForGradient(`linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`)
                    }}
                  >
                    {team.name.split(' ').slice(-2).join(' ')}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Animated Border */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{
                     boxShadow: `inset 0 0 0 2px ${team.colors.primary}`
                   }} />
            </motion.div>
          ))}
        </motion.div>

        {/* View All Teams Button - Premium Design */}
        <div className="text-center">
          <button
            onClick={() => router.push('/teams')}
            className="group relative overflow-hidden rounded-xl font-black text-lg px-12 py-5 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD23F 100%)',
              boxShadow: '0 10px 40px rgba(255, 107, 53, 0.4), 0 0 60px rgba(247, 147, 30, 0.3)',
              border: '2px solid rgba(255, 107, 53, 0.5)',
              color: '#fff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(255, 107, 53, 0.6), 0 0 80px rgba(247, 147, 30, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(255, 107, 53, 0.4), 0 0 60px rgba(247, 147, 30, 0.3)';
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
              style={{
                background: 'radial-gradient(circle, rgba(255, 107, 53, 0.6), transparent)',
              }}
            />
            
            <span className="relative z-10 flex items-center gap-3 font-black tracking-tight">
              EXPLORE ALL TEAMS
              <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            
            {/* Pulse animation ring */}
            <div className="absolute inset-0 rounded-xl border-2 opacity-0 group-hover:opacity-100 animate-ping border-orange-500" />
          </button>
        </div>
      </div>
    </section>
  );
}
