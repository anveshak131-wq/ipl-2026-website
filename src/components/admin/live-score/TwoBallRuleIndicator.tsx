'use client';

import { Droplets, RefreshCw } from 'lucide-react';

interface TwoBallRuleIndicatorProps {
  isEveningMatch: boolean;
  currentInnings: 1 | 2;
  currentOver: number;
  ballChanged: boolean;
  onBallChange?: () => void;
  league?: 'ipl' | 'wpl';
}

export default function TwoBallRuleIndicator({
  isEveningMatch,
  currentInnings,
  currentOver,
  ballChanged,
  onBallChange,
  league = 'ipl',
}: TwoBallRuleIndicatorProps) {
  // Two-ball rule applies only to evening matches, 2nd innings, from 11th over onwards
  const canChangeBall = 
    isEveningMatch && 
    currentInnings === 2 && 
    currentOver >= 11 && 
    !ballChanged;

  if (!isEveningMatch || currentInnings !== 2 || currentOver < 11) {
    return null;
  }

  return (
    <div className={`rounded-lg p-4 border-2 ${
      canChangeBall
        ? 'bg-blue-500/20 border-blue-500/50'
        : ballChanged
        ? 'bg-green-500/20 border-green-500/50'
        : 'bg-gray-500/20 border-gray-500/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Droplets className={`w-6 h-6 ${
            canChangeBall ? 'text-blue-400' : ballChanged ? 'text-green-400' : 'text-gray-400'
          }`} />
          <div>
            <div className="text-white font-semibold mb-1">
              {ballChanged ? 'Ball Changed' : 'Two-Ball Rule Available'}
            </div>
            <div className="text-sm text-gray-300">
              {ballChanged 
                ? 'Ball has been changed to counteract dew effects'
                : 'Dew conditions detected. Ball change available from 11th over (2nd innings)'
              }
            </div>
            {!ballChanged && (
              <div className="text-xs text-gray-400 mt-1">
                Over: {currentOver.toFixed(1)} | Request ball change to improve grip
              </div>
            )}
          </div>
        </div>
        {canChangeBall && onBallChange && (
          <button
            onClick={onBallChange}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            Change Ball
          </button>
        )}
        {ballChanged && (
          <div className="flex items-center gap-2 text-green-300 text-sm">
            <RefreshCw className="w-4 h-4" />
            <span>Changed</span>
          </div>
        )}
      </div>
    </div>
  );
}

