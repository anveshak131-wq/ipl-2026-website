'use client';

import React from 'react';

interface ScoreAnimationProps {
  score: number;
  previousScore?: number;
  isLive?: boolean;
}

export default function ScoreAnimation({
  score,
  previousScore = 0,
  isLive = false,
}: ScoreAnimationProps) {
  const hasScoreUpdate = score > previousScore;

  return (
    <>
    <style>{`
      @keyframes scoreUpdate {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
      @keyframes scorePulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes scoreGlow {
        0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
        100% { box-shadow: 0 0 0 20px rgba(251, 191, 36, 0); }
      }
      .score-update {
        animation: scoreUpdate 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      .score-pulse {
        animation: scorePulse 2s ease-in-out infinite;
      }
      .score-glow {
        animation: scoreGlow 0.8s ease-out;
      }
    `}</style>
  ) || (
    <div className="relative">
      <div
        className={`text-6xl md:text-7xl font-black text-white transition-all ${
          hasScoreUpdate ? 'score-update' : ''
        } ${isLive ? 'score-pulse' : ''}`}
      >
        {score}
      </div>

      {/* Glow effect on score update */}
      {hasScoreUpdate && (
        <div className="score-glow absolute inset-0 rounded-lg" />
      )}

      {/* Live indicator */}
      {isLive && (
        <div className="absolute -top-4 -right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
    </div>
    </>
  );
}
