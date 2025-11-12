'use client';

import { Player } from '@/types';

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlayerModal({ player, isOpen, onClose }: PlayerModalProps) {
  if (!isOpen || !player) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop with frosted glass effect */}
      <div 
        className="fixed inset-0 z-50 frosted-glass flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Modal Content */}
        <div className="glass-effect rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
          {/* Header */}
          <div className="relative p-6 border-b border-white/10">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-4">
              {/* Player Photo */}
              <div className="w-24 h-24 bg-gradient-to-r from-ipl-purple to-ipl-gold rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {player.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              
              {/* Player Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {player.name}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {player.role}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    {player.age} years
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {player.nationality}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Career Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-ipl-gold">
                  {player.stats.matches}
                </p>
                <p className="text-gray-400 text-sm">Matches</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-ipl-gold">
                  {player.stats.runs}
                </p>
                <p className="text-gray-400 text-sm">Runs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-ipl-gold">
                  {player.stats.wickets}
                </p>
                <p className="text-gray-400 text-sm">Wickets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-ipl-gold">
                  {player.stats.average}
                </p>
                <p className="text-gray-400 text-sm">Average</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-ipl-gold">
                  {player.stats.strikeRate}
                </p>
                <p className="text-gray-400 text-sm">Strike Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-ipl-gold">
                  {player.stats.economy}
                </p>
                <p className="text-gray-400 text-sm">Economy</p>
              </div>
            </div>
          </div>

          {/* Player Bio */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Biography
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {player.bio}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-white/10">
            <div className="flex space-x-4">
              <button className="flex-1 ipl-button">
                View Full Stats
              </button>
              <button 
                onClick={onClose}
                className="flex-1 glass-effect text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
