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

        {/* Players Section */}
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-white font-semibold mb-3">
            Players
          </h4>
          {team.players && team.players.length > 0 ? (
            <div className="space-y-2">
              {team.players.slice(0, 4).map((player) => (
                <button
                  key={player.id}
                  onClick={() => onPlayerClick(player)}
                  className="text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 w-full"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-ipl-gold/20 text-ipl-gold rounded-full font-bold text-xs">
                        {player.jerseyNumber || '-'}
                      </span>
                      <p className="text-white text-sm font-medium">
                        {player.name}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      {player.isCaptain && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          ⭐
                        </span>
                      )}
                      {player.nationality !== 'India' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          🌍
                        </span>
                      )}
                      {player.role === 'Wicket-keeper' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          🧤
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-gray-400">
                      {player.role}
                    </p>
                    <p className="text-gray-500">
                      {player.battingStyle?.split(' ')[0] || 'N/A'}
                    </p>
                  </div>
                </button>
              ))}
              {team.players.length > 4 && (
                <div className="text-center pt-2">
                  <button className="text-ipl-gold hover:text-ipl-purple text-sm font-medium transition-colors duration-200">
                    +{team.players.length - 4} more players
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">
                No players added yet
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Players can be added via Admin Panel
              </p>
            </div>
          )}
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
