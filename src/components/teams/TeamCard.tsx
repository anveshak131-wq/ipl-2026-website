'use client';

import { Team } from '@/types';
import { useRouter } from 'next/navigation';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { getOptimalTextColorForGradient } from '@/lib/colorUtils';
import { motion } from 'framer-motion';

interface TeamCardProps {
  team: Team;
  onPlayerClick: (player: any) => void;
}

export default function TeamCard({ team, onPlayerClick }: TeamCardProps) {
  const router = useRouter();
  const animatedLogo = getAnimatedLogoPath(team.id);
  const fallbackLogo = getLogoPath(team.id);
  // Prefer the new client-side component for RCB (team id 1) when available
  const isRCBStaticExport = animatedLogo.endsWith('rcb_inferno_lion.svg');

  const handleViewFullSquad = () => {
    // Ensure team ID has 'team' prefix for the route
    const teamRoute = team.id.startsWith('team') ? team.id : `team${team.id}`;
    router.push(`/teams/${teamRoute}`);
  };

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-ipl-gold/50 hover:shadow-2xl hover:shadow-ipl-gold/30"
      initial={{ opacity: 0, y: 8, scale: 0.995 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03, y: -4 }}
    >
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
            
            {/* Animated Logo: render Lottie if JSON, otherwise image */}
            {animatedLogo.endsWith('.json') ? (
              <div className="relative z-10 w-20 h-20">
                <RCBLottie className="w-full h-full" />
              </div>
            ) : isRCBStaticExport ? (
              <div className="relative z-10 w-24 h-24 flex items-center justify-center">
                <RCBLionLogo className="w-full h-full" />
              </div>
            ) : (
              <motion.img
                src={animatedLogo}
                alt={`${team.shortName} logo`}
                className="w-20 h-20 object-contain relative z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackLogo;
                }}
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.12, rotate: 4 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            
            {/* Pulse ring on hover */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-ipl-gold/50 opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
          </div>
        </div>

        {/* Team Name */}
        <div className="text-center">
          <h3 
            className="text-2xl font-black mb-1 transition-all duration-300 group-hover:scale-110"
            style={{
              // Card is on dark page background, so use light text with strong shadow for visibility
              color: '#FFFFFF',
              textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5), 2px 2px 4px rgba(0,0,0,0.9)'
            }}
          >
            {team.shortName}
          </h3>
          <p className="text-sm font-medium transition-colors duration-300" style={{ 
            color: '#E5E7EB',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)'
          }}>
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
          <p className="text-sm leading-relaxed text-center line-clamp-2" style={{ color: '#D1D5DB' }}>
            {team.description}
          </p>

        {/* Player Count Badge with animation */}
        <div className="flex justify-center">
          <span className="px-4 py-2 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold backdrop-blur-sm group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 flex items-center gap-2">
            <span className="text-base">👥</span>
            <span>{team.players?.length || 0} Players</span>
          </span>
        </div>

        {/* View Team Button with Premium Design - Using Team Colors */}
        <motion.button
          onClick={handleViewFullSquad}
          className="group w-full relative overflow-hidden rounded-xl font-bold text-sm py-3.5 mt-2 cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`,
            boxShadow: `0 10px 40px ${team.colors.primary}40, 0 0 60px ${team.colors.secondary}30`,
            border: `2px solid ${team.colors.primary}60`,
            color: getOptimalTextColorForGradient(`linear-gradient(135deg, ${team.colors.primary}, ${team.colors.secondary})`),
          }}
          onMouseEnter={(e) => {
            /* keep visual micro-interaction handled by motion */
          }}
          onMouseLeave={(e) => {}}
          initial={{ y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          
          {/* Glow effect on hover */}
          <div 
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
            style={{
              background: `radial-gradient(circle, ${team.colors.primary}60, transparent)`,
            }}
          />
          
          {/* Content */}
          <span className="relative z-10 flex items-center justify-center gap-2 font-black tracking-tight">
            View Full Squad
            <svg 
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
          
          {/* Pulse animation ring */}
          <div 
            className="absolute inset-0 rounded-xl border-2 opacity-0 group-hover:opacity-100 animate-ping"
            style={{
              borderColor: team.colors.primary,
            }}
          />
        </motion.button>
      </div>
    </motion.div>
  );
}
