'use client';

import React from 'react';

interface BoundaryAnimationProps {
  runs: number;
  onComplete?: () => void;
}

export default function BoundaryAnimation({
  runs,
  onComplete,
}: BoundaryAnimationProps) {
  React.useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [onComplete]);

  const isSix = runs === 6;

  return (
    <>
    <style>{`
      @keyframes boundaryFlash {
        0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
        100% { box-shadow: 0 0 0 30px rgba(251, 191, 36, 0); }
      }
      @keyframes boundaryPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes sixRotate {
        0% { transform: rotateZ(0deg) scale(1); }
        50% { transform: rotateZ(180deg) scale(1.2); }
        100% { transform: rotateZ(360deg) scale(1); }
      }
      @keyframes ballFly {
        0% { transform: translateX(0) translateY(0); opacity: 1; }
        100% { transform: translateX(200px) translateY(-200px); opacity: 0; }
      }
      .boundary-flash {
        animation: boundaryFlash 0.8s ease-out;
      }
      .boundary-pulse {
        animation: boundaryPulse 0.6s ease-out;
      }
      .six-rotate {
        animation: sixRotate 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      .ball-fly {
        animation: ballFly 1.5s ease-out;
      }
    `}</style>
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      {/* Flash effect */}
      <div className="boundary-flash absolute w-32 h-32 rounded-full border-4 border-ipl-gold" />

      {/* Boundary/Six text */}
      <div className={`${isSix ? 'six-rotate' : 'boundary-pulse'} text-7xl font-black mb-20`}>
        {isSix ? '🎯 SIX!' : '⚾ BOUNDARY!'}
      </div>

      {/* Flying ball */}
      <div className="ball-fly absolute text-4xl">🏏</div>

      {/* Runs display */}
      <div className="absolute bottom-1/3 text-center">
        <div className="text-6xl font-black text-ipl-gold mb-2">
          +{runs}
        </div>
        <div className="text-white text-xl font-bold">
          {isSix ? 'SIX RUNS!' : 'FOUR RUNS!'}
        </div>
      </div>

      {/* Celebration particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${50 + Math.cos((i / 8) * Math.PI * 2) * 150}%`,
            top: `${50 + Math.sin((i / 8) * Math.PI * 2) * 150}%`,
            animation: `ballFly 1.5s ease-out ${i * 0.1}s forwards`,
          }}
        >
          ✨
        </div>
      ))}
    </div>
    </>
  );
}
