'use client';

import { Team } from '@/types';
import { useRouter } from 'next/navigation';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';

interface TeamCardProps {
  team: Team;
  onPlayerClick: (player: any) => void;
}

export default function TeamCard({ team, onPlayerClick }: TeamCardProps) {
  const router = useRouter();
  const animatedLogo = getAnimatedLogoPath(team.id);
  const fallbackLogo = getLogoPath(team.id);

  const handleViewFullSquad = () => {
    // Ensure team ID has 'team' prefix for the route
    const teamRoute = team.id.startsWith('team') ? team.id : `team${team.id}`;
    router.push(`/teams/${teamRoute}`);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-ipl-gold/50 transition-all duration-500 hover:shadow-2xl hover:shadow-ipl-gold/30 transform hover:scale-105 hover:-translate-y-2 animate-fade-in">
      {/* Animated background on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold/10 to-ipl-purple/10 animate-gradient" />
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

      {/* Content */}
      <div className="relative p-6 md:p-8 space-y-6">
        {/* Team Logo with enhanced animations */}
        <div className="flex justify-center">
          <div className="relative w-28 h-28 flex items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 group-hover:border-ipl-gold/30 transition-all duration-500 overflow-hidden group-hover:scale-110 group-hover:rotate-3">
            {/* Glowing background accent */}
            <div 
              className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
              style={{
                background: `linear-gradient(135deg, ${team.colors.primary}40, ${team.colors.secondary}40)`
              }}
            />
            
            {/* Animated Logo */}
            <img 
              src={animatedLogo}
              alt={`${team.shortName} logo`}
              className="w-20 h-20 object-contain relative z-10 transform group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackLogo;
              }}
            />
            
            {/* Pulse ring on hover */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-ipl-gold/50 opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
          </div>
        </div>

        {/* Team Name */}
        <div className="text-center transform group-hover:scale-105 transition-transform duration-300">
          <h3 
            className="text-2xl font-black mb-1 transition-all duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {team.shortName}
          </h3>
          <p className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors duration-300">
            {team.name}
          </p>
        </div>

        {/* Team Colors with enhanced animations */}
        <div className="flex justify-center space-x-3">
          <div 
            className="w-12 h-12 rounded-full border-2 border-white/30 hover:border-white/60 transition-all duration-300 shadow-lg transform hover:scale-125 hover:rotate-12 cursor-pointer group-hover:animate-bounce-in"
            style={{ 
              backgroundColor: team.colors.primary,
              boxShadow: `0 0 20px ${team.colors.primary}40`
            }}
            title="Primary color"
          />
          <div 
            className="w-12 h-12 rounded-full border-2 border-white/30 hover:border-white/60 transition-all duration-300 shadow-lg transform hover:scale-125 hover:rotate-12 cursor-pointer group-hover:animate-bounce-in"
            style={{ 
              backgroundColor: team.colors.secondary,
              boxShadow: `0 0 20px ${team.colors.secondary}40`,
              animationDelay: '0.1s'
            }}
            title="Secondary color"
          />
        </div>

        {/* Team Description */}
        <p className="text-gray-300 text-sm leading-relaxed text-center line-clamp-2 group-hover:text-gray-200 transition-colors duration-300">
          {team.description}
        </p>

        {/* Player Count Badge with animation */}
        <div className="flex justify-center">
          <span className="px-4 py-2 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold backdrop-blur-sm group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 flex items-center gap-2">
            <span className="text-base">👥</span>
            <span>{team.players?.length || 0} Players</span>
          </span>
        </div>

        {/* View Team Button with enhanced animations */}
        <button 
          onClick={handleViewFullSquad}
          className="w-full bg-gradient-to-r from-ipl-purple to-ipl-gold hover:from-ipl-gold hover:to-ipl-purple text-white font-bold text-sm py-3 rounded-lg transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-ipl-gold/50 mt-2 relative overflow-hidden group/btn"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            View Full Squad
            <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
        </button>
      </div>
    </div>
  );
}
