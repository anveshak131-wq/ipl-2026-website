'use client';

import { Team } from '@/types';

interface TeamCardProps {
  team: Team;
  onPlayerClick: (player: any) => void;
}

export default function TeamCard({ team, onPlayerClick }: TeamCardProps) {
  return (
    <div className="ipl-card hover:scale-105 transform transition-all duration-300">
      <div className="text-center space-y-4">
        {/* Team Logo */}
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-ipl-purple to-ipl-gold rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-2xl">
            {team.shortName}
          </span>
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
            <div className="grid grid-cols-2 gap-2">
              {team.players.slice(0, 4).map((player) => (
                <button
                  key={player.id}
                  onClick={() => onPlayerClick(player)}
                  className="text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200"
                >
                  <p className="text-white text-sm font-medium">
                    {player.name}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {player.role}
                  </p>
                </button>
              ))}
              {team.players.length > 4 && (
                <div className="col-span-2 text-center">
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
        <button className="w-full ipl-button text-sm py-2">
          View Full Squad
        </button>
      </div>
    </div>
  );
}
