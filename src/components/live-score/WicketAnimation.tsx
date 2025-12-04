'use client';

import React from 'react';
import CustomEmoji from '@/components/emoji/CustomEmoji';

interface WicketAnimationProps {
  playerName: string;
  bowlerName: string;
  onComplete?: () => void;
}

export default function WicketAnimation({
  playerName,
  bowlerName,
  onComplete,
}: WicketAnimationProps) {
  React.useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [onComplete]);

  return (
    <>
    <style>{`
      @keyframes wicketBurst {
        0% { transform: scale(0) rotate(-45deg); opacity: 0; }
        50% { transform: scale(1.3) rotate(10deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes wicketFall {
        0% { transform: translateY(-100px) rotateZ(0deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(0) rotateZ(90deg); opacity: 0; }
      }
      @keyframes celebrationConfetti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(-200px) rotate(360deg); opacity: 0; }
      }
      .wicket-burst {
        animation: wicketBurst 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      .wicket-fall {
        animation: wicketFall 1.2s ease-out;
      }
      .celebration-confetti {
        animation: celebrationConfetti 2s ease-out;
      }
    `}</style>
  ) || (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      {/* Wicket burst effect */}
      <div className="wicket-burst">
        <CustomEmoji type="target" size={96} />
      </div>

      {/* Falling stumps */}
      <div className="wicket-fall absolute">
        <CustomEmoji type="cricket-stumps" size={72} />
      </div>

      {/* Celebration text */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-4xl font-black text-red-500 mb-4 animate-bounce">
          WICKET!
        </div>
        <div className="text-white text-lg font-bold mb-2">
          {playerName} out
        </div>
        <div className="text-gray-300 text-sm">
          Bowled by {bowlerName}
        </div>
      </div>

      {/* Confetti particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="celebration-confetti absolute text-2xl"
          style={{
            left: `${50 + Math.cos((i / 12) * Math.PI * 2) * 100}%`,
            top: `${50 + Math.sin((i / 12) * Math.PI * 2) * 100}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        >
          <CustomEmoji type="party" size={32} />
        </div>
      ))}
    </div>
    </>
  );
}
