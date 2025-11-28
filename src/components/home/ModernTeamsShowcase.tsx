'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import type { Team } from '@/types';

interface ModernTeamsShowcaseProps {
  teams: Team[];
  isLoading?: boolean;
}

export default function ModernTeamsShowcase({ teams, isLoading = false }: ModernTeamsShowcaseProps) {
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-4 md:px-0">
      {teams.map((team, idx) => (
        <div
          key={team.id}
          onMouseEnter={() => setHoveredTeam(team.id)}
          onMouseLeave={() => setHoveredTeam(null)}
        >
          <Link href={`/teams/${team.id}`}>
            <AnimatedCard
              delay={idx}
              hover="scale"
              className="h-48 p-4 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden group"
            >
              {/* Background gradient based on team colors */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                style={{ 
                  background: `linear-gradient(135deg, ${team.colors?.primary || '#3b82f6'}40, ${team.colors?.secondary || '#8b5cf6'}40)`
                }}
                animate={hoveredTeam === team.id ? {
                  opacity: [0.1, 0.25, 0.1]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Animated border on hover */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 opacity-0 group-hover:opacity-100"
                style={{ 
                  borderColor: team.colors?.primary || '#3b82f6',
                  boxShadow: `0 0 20px ${team.colors?.primary || '#3b82f6'}40`
                }}
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              {/* Interactive Team Logo */}
              <motion.div 
                className="relative w-20 h-20 mb-4 flex items-center justify-center"
                initial={{ scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.2, rotate: 5 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              >
                {/* Glowing background on hover */}
                <motion.div
                  className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${team.colors?.primary || '#3b82f6'}40, ${team.colors?.secondary || '#8b5cf6'}40)`
                  }}
                  animate={hoveredTeam === team.id ? {
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Pulse ring on hover */}
                {hoveredTeam === team.id && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: team.colors?.primary || '#3b82f6' }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                
                {/* Actual Logo */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {getAnimatedLogoPath(team.id).endsWith('rcb_logo_premium.svg') ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <RCBLionLogo className="w-full h-full" />
                    </div>
                  ) : (
                    <motion.img
                      src={getAnimatedLogoPath(team.id)}
                      alt={`${team.shortName} logo`}
                      className="w-full h-full object-contain drop-shadow-2xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getLogoPath(team.id);
                      }}
                      whileHover={{ 
                        scale: 1.15,
                        rotate: [0, -5, 5, -5, 0],
                        filter: "brightness(1.2)"
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </div>
              </motion.div>

              {/* Team name with gradient on hover */}
              <motion.h3 
                className="font-bold text-sm md:text-base mb-1 transition-colors"
                style={{
                  color: hoveredTeam === team.id ? team.colors?.primary || '#fbbf24' : '#ffffff'
                }}
                animate={hoveredTeam === team.id ? {
                  scale: [1, 1.05, 1]
                } : {}}
                transition={{ duration: 0.5 }}
              >
                {team.shortName}
              </motion.h3>

              {/* Full name */}
              <p className="text-xs text-gray-400 line-clamp-2">{team.name}</p>

              {/* Enhanced stats on hover */}
              {hoveredTeam === team.id && (
                <motion.div 
                  className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-300"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-semibold">Players: {team.players?.length || 0}</p>
                  {team.titles && (
                    <p className="text-ipl-gold mt-1">🏆 {team.titles} Title{team.titles > 1 ? 's' : ''}</p>
                  )}
                </motion.div>
              )}
            </div>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-ipl-gold/0 to-ipl-gold/0 group-hover:from-ipl-gold/10 group-hover:to-ipl-gold/5 transition-all duration-300 pointer-events-none" />
            </AnimatedCard>
          </Link>
        </div>
      ))}
    </div>
  );
}
