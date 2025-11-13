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
    router.push(`/teams/${team.id}`);
  };

  return (
    <div className="ipl-card hover:scale-105 transform transition-all duration-300">
      <div className="text-center space-y-4">
        {/* Team Logo */}
        <div className="w-24 h-24 mx-auto flex items-center justify-center">
          <img 
            src={team.logo} 
            alt={`${team.shortName} logo`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Team Name */}
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            {team.shortName}
          </h3>
          <p className="text-gray-300 text-sm">
            {team.name}
          </p>
        </div>

        {/* Team Description */}
        <p className="text-gray-400 text-sm leading-relaxed">
          {team.description}
        </p>

        {/* Team Colors */}
        <div className="flex justify-center space-x-2">
          <div 
            className="w-8 h-8 rounded-full border-2 border-white/30"
            style={{ backgroundColor: team.colors.primary }}
          />
          <div 
            className="w-8 h-8 rounded-full border-2 border-white/30"
            style={{ backgroundColor: team.colors.secondary }}
          />
        </div>

        
        {/* View Team Button */}
        <button 
          onClick={handleViewFullSquad}
          className="w-full ipl-button text-sm py-2"
        >
          View Full Squad
        </button>
      </div>
    </div>
  );
}
