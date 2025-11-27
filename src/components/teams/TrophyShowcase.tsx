'use client';

import React from 'react';

interface Trophy {
  year: number;
  title: string;
}

interface TrophyShowcaseProps {
  trophies: Trophy[];
  teamName: string;
}

export default function TrophyShowcase({ trophies, teamName }: TrophyShowcaseProps) {
  return (
    <>
      <style>{`
        @keyframes trophyRotate {
          0% { transform: rotateY(0deg) rotateZ(-5deg); }
          50% { transform: rotateY(180deg) rotateZ(5deg); }
          100% { transform: rotateY(360deg) rotateZ(-5deg); }
        }
        @keyframes trophyBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .trophy-item {
          animation: trophyRotate 6s ease-in-out infinite;
        }
        .trophy-container:hover .trophy-item {
          animation-duration: 3s;
        }
        .trophy-glow {
          animation: trophyBounce 2s ease-in-out infinite;
        }
      `}</style>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-white/10">
      <h3 className="text-2xl font-bold text-white mb-8">🏆 {teamName} Trophies</h3>

      {trophies && trophies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trophies.map((trophy, idx) => (
            <div
              key={idx}
              className="trophy-container group relative"
            >
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-6 text-center shadow-2xl border-2 border-yellow-300 hover:border-yellow-200 transition-all hover:shadow-yellow-400/50">
                <div className="trophy-item text-5xl mb-4 inline-block">🏆</div>
                <h4 className="text-lg font-bold text-black mb-2">{trophy.title}</h4>
                <p className="text-black/80 font-semibold">{trophy.year}</p>

                {/* Glow effect */}
                <div className="trophy-glow absolute inset-0 bg-gradient-to-t from-yellow-400/0 to-yellow-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No trophies yet. Coming soon! 🎯</p>
        </div>
      )}
      </div>
    </>
  );
}
