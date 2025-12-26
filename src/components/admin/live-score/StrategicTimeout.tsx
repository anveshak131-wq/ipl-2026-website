'use client';

import { useState, useEffect } from 'react';
import { Clock, Pause } from 'lucide-react';

interface StrategicTimeoutProps {
  team: 'team1' | 'team2';
  teamName: string;
  used: number;
  remaining: number;
  onTimeout: () => void;
  isActive: boolean;
  onTimeoutEnd?: () => void;
}

const TIMEOUT_DURATION = 150000; // 2.5 minutes in milliseconds

export default function StrategicTimeout({ 
  team, 
  teamName,
  used, 
  remaining, 
  onTimeout, 
  isActive,
  onTimeoutEnd
}: StrategicTimeoutProps) {
  const [timeRemaining, setTimeRemaining] = useState(TIMEOUT_DURATION);
  const canUseTimeout = remaining > 0 && !isActive;

  useEffect(() => {
    if (!isActive) {
      setTimeRemaining(TIMEOUT_DURATION);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          if (onTimeoutEnd) {
            onTimeoutEnd();
          }
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeoutEnd]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Pause className="w-5 h-5 text-blue-400" />
          <span className="text-white font-semibold">Strategic Timeout</span>
          <span className="text-gray-400 text-sm">({teamName})</span>
        </div>
        <span className="text-gray-300 text-sm">
          Used: {used}/2 | Remaining: {remaining}
        </span>
      </div>
      {isActive ? (
        <div className="flex items-center gap-2 text-yellow-300 font-bold">
          <Clock className="w-5 h-5 animate-spin" />
          <span>⏱️ Timeout Active: {formatTime(timeRemaining)}</span>
        </div>
      ) : (
        <button
          onClick={onTimeout}
          disabled={!canUseTimeout}
          className={`w-full px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            canUseTimeout
              ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Pause className="w-4 h-4" />
          Call Timeout (2.5 min)
        </button>
      )}
    </div>
  );
}

