'use client';

import { useLeague } from '@/contexts/LeagueContext';
import { CustomEmoji } from '@/components/emoji/Emoji';

interface LeagueSwitchProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function LeagueSwitch({ 
  className = '', 
  showLabel = true,
  size = 'md' 
}: LeagueSwitchProps) {
  const { currentLeague, setCurrentLeague, isIPL, isWPL } = useLeague();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  const handleLeagueChange = (league: 'ipl' | 'wpl') => {
    // Only change league if it's different from current
    if (league !== currentLeague) {
      setCurrentLeague(league);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-gray-400 text-sm font-medium">League:</span>
      )}
      
      <div className="flex bg-gray-800/50 rounded-lg p-1 border border-gray-700/50">
        {/* IPL Button */}
        <button
          onClick={() => handleLeagueChange('ipl')}
          className={`
            flex items-center gap-2 rounded-md transition-all duration-200
            ${isIPL 
              ? 'bg-gradient-to-r from-ipl-blue to-ipl-purple text-white shadow-lg shadow-ipl-blue/25' 
              : 'text-gray-400 hover:text-white hover:bg-white/10'
            }
            ${sizeClasses[size]}
          `}
        >
          <CustomEmoji type="cricket" size={iconSizes[size]} />
          <span className="font-medium">IPL</span>
        </button>

        {/* WPL Button */}
        <button
          onClick={() => handleLeagueChange('wpl')}
          className={`
            flex items-center gap-2 rounded-md transition-all duration-200
            ${isWPL 
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25' 
              : 'text-gray-400 hover:text-white hover:bg-white/10'
            }
            ${sizeClasses[size]}
          `}
        >
          <CustomEmoji type="star" size={iconSizes[size]} />
          <span className="font-medium">WPL</span>
        </button>
      </div>

      {/* Current League Indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className={`w-2 h-2 rounded-full ${isIPL ? 'bg-ipl-blue' : 'bg-pink-500'}`} />
        <span>{currentLeague.toUpperCase()}</span>
      </div>
    </div>
  );
}
