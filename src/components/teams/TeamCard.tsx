'use client';

import { Team } from '@/types';
import { useRouter } from 'next/navigation';

interface TeamCardProps {
  team: Team;
  onPlayerClick: (player: any) => void;
}

export default function TeamCard({ team, onPlayerClick }: TeamCardProps) {
  const router = useRouter();

  const handleViewFullSquad = () => {
    // Ensure team ID has 'team' prefix for the route
    const teamRoute = team.id.startsWith('team') ? team.id : `team${team.id}`;
    router.push(`/teams/${teamRoute}`);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-ipl-gold/50 transition-all duration-300 hover:shadow-2xl hover:shadow-ipl-gold/20 transform hover:scale-105">
      {/* Animated background on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold/10 to-ipl-purple/10" />
      </div>

      {/* Content */}
      <div className="relative p-6 md:p-8 space-y-6">
        {/* Team Logo */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24 flex items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 group-hover:border-ipl-gold/30 transition-colors duration-300 overflow-hidden">
            {/* Background accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-ipl-purple/20 to-ipl-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <img 
              src={team.logo} 
              alt={`${team.shortName} logo`}
              className="w-16 h-16 object-contain relative z-10"
            />
          </div>
        </div>

        {/* Team Name */}
        <div className="text-center">
          <h3 className="text-2xl font-black text-white mb-1 group-hover:text-ipl-gold transition-colors duration-300">
            {team.shortName}
          </h3>
          <p className="text-gray-300 text-sm font-medium">
            {team.name}
          </p>
        </div>

        {/* Team Colors */}
        <div className="flex justify-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full border-2 border-white/30 hover:border-white/60 transition-colors duration-300 shadow-lg"
            style={{ backgroundColor: team.colors.primary }}
            title="Primary color"
          />
          <div 
            className="w-10 h-10 rounded-full border-2 border-white/30 hover:border-white/60 transition-colors duration-300 shadow-lg"
            style={{ backgroundColor: team.colors.secondary }}
            title="Secondary color"
          />
        </div>

        {/* Team Description */}
        <p className="text-gray-300 text-sm leading-relaxed text-center line-clamp-2">
          {team.description}
        </p>

        {/* Player Count Badge */}
        <div className="flex justify-center">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold">
            👥 {team.players?.length || 0} Players
          </span>
        </div>

        {/* View Team Button */}
        <button 
          onClick={handleViewFullSquad}
          className="w-full bg-gradient-to-r from-ipl-purple to-ipl-gold hover:from-ipl-gold hover:to-ipl-purple text-white font-bold text-sm py-3 rounded-lg transition-all duration-300 transform hover:scale-105 mt-2"
        >
          View Full Squad
        </button>
      </div>
    </div>
  );
}
