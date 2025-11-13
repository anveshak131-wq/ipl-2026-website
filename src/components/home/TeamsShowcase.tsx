'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Team } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function TeamsShowcase() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await api.getTeams();
        setTeams(teamsData);
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {teams.map((team, index) => (
            <div
              key={team.id}
              onMouseEnter={() => setHoveredTeam(team.id)}
              onMouseLeave={() => setHoveredTeam(null)}
              onClick={() => router.push(`/teams/${team.id}`)}
              className="group relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-500 hover:scale-110 hover:z-10"
              style={{
                animationDelay: `${index * 50}ms`
              }}
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
                {/* Team Logo */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md" />
                  <img 
                    src={team.logo} 
                    alt={team.shortName}
                    className="relative w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>

                {/* Team Name */}
                <div className="text-center space-y-1 transform group-hover:translate-y-1 transition-transform duration-300">
                  <p className="font-black text-white text-lg md:text-xl tracking-tight">
                    {team.shortName}
                  </p>
                  <p className="text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-1">
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
            </div>
          ))}
        </div>

        {/* View All Teams Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/teams')}
            className="group relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white font-black text-lg px-12 py-5 rounded-2xl hover:shadow-2xl hover:shadow-orange-600/50 transition-all duration-300 transform hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-3">
              EXPLORE ALL TEAMS
              <svg className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </button>
        </div>
      </div>
    </section>
  );
}
