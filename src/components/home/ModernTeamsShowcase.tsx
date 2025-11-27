'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnimatedCard from '@/components/ui/AnimatedCard';
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
              {/* Background gradient based on team */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                style={{ backgroundColor: '#3b82f6' }}
              />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              {/* Logo/Icon */}
              <div className="w-16 h-16 mb-3 rounded-lg bg-white/10 flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                {team.shortName.charAt(0)}
              </div>

              {/* Team name */}
              <h3 className="font-bold text-white text-sm md:text-base mb-1 group-hover:text-ipl-gold transition-colors">
                {team.shortName}
              </h3>

              {/* Full name */}
              <p className="text-xs text-gray-400 line-clamp-2">{team.name}</p>

              {/* Stats on hover */}
              {hoveredTeam === team.id && (
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-300 animate-fade-in">
                  <p>Players: {team.players?.length || 0}</p>
                </div>
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
