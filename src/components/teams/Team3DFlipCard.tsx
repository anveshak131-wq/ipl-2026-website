'use client';

import React, { useState } from 'react';
import type { Team } from '@/types';

interface Team3DFlipCardProps {
  team: Team;
  index?: number;
}

export default function Team3DFlipCard({ team, index = 0 }: Team3DFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Team color mapping
  const teamColors: Record<string, string> = {
    CSK: 'from-yellow-600 to-yellow-400',
    MI: 'from-blue-600 to-blue-400',
    RCB: 'from-red-600 to-red-400',
    KKR: 'from-purple-600 to-purple-400',
    DC: 'from-blue-700 to-blue-500',
    RR: 'from-pink-600 to-pink-400',
    SRH: 'from-orange-600 to-orange-400',
    LSG: 'from-green-600 to-green-400',
    GT: 'from-cyan-600 to-cyan-400',
    PBKS: 'from-red-700 to-red-500',
  };

  const bgGradient = teamColors[team.name] || 'from-gray-600 to-gray-400';

  return (
    <>
      <style>{`
        @keyframes flip3d {
          0% { transform: perspective(1000px) rotateY(0deg); }
          100% { transform: perspective(1000px) rotateY(360deg); }
        }
        .team-flip-card {
          transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          transform-style: preserve-3d;
        }
        .team-flip-card.flipped {
          transform: perspective(1000px) rotateY(180deg);
        }
        .team-flip-front,
        .team-flip-back {
          backface-visibility: hidden;
        }
        .team-flip-back {
          transform: rotateY(180deg);
        }
      `}</style>
      <div
        className="h-full cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '1000px' }}
      >
        <div
          className={`team-flip-card relative w-full h-full transition-transform duration-600 ${
            isFlipped ? 'flipped' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'perspective(1000px) rotateY(180deg)' : 'perspective(1000px) rotateY(0deg)',
          }}
        >
          {/* Front Side */}
          <div
            className="team-flip-front absolute w-full h-full"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div
              className={`bg-gradient-to-br ${bgGradient} rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center shadow-2xl border border-white/20 backdrop-blur-sm`}
            >
              <div className="text-6xl mb-4">{team.name.charAt(0)}</div>
              <h3 className="text-2xl font-black text-white mb-2">{team.name}</h3>
              <p className="text-white/80 text-sm mb-6">Cricket Team</p>
              <div className="text-xs text-white/60">Click to flip</div>
            </div>
          </div>

          {/* Back Side */}
          <div
            className="team-flip-back absolute w-full h-full"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 h-full flex flex-col justify-between shadow-2xl border border-white/20 backdrop-blur-sm">
              <div>
                <h4 className="text-lg font-bold text-ipl-gold mb-4">Team Info</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-white/80">
                    <span>Players:</span>
                    <span className="font-semibold text-white">{team.players?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Founded:</span>
                    <span className="font-semibold text-white">2008</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Trophies:</span>
                    <span className="font-semibold text-white">3</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-white/60 text-center">Click to flip back</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
