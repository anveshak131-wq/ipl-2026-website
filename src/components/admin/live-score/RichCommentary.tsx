'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Trophy, 
  X, 
  ChevronDown, 
  ChevronUp,
  Circle,
  Star,
  AlertCircle,
} from 'lucide-react';
import { BallEvent } from '@/hooks/useLiveScore';

interface CommentaryEntry {
  ball: string; // "12.3"
  event: BallEvent;
  timestamp: string;
  batterName?: string;
  bowlerName?: string;
  isKeyMoment: boolean;
  eventType: 'boundary' | 'wicket' | 'milestone' | 'dot' | 'runs' | 'extras';
}

interface RichCommentaryProps {
  ballHistory: BallEvent[];
  currentOver: number;
  currentBatter?: { name: string; runs: number };
  currentBowler?: { name: string };
  league?: 'ipl' | 'wpl';
  maxVisible?: number;
}

export default function RichCommentary({
  ballHistory,
  currentOver,
  currentBatter,
  currentBowler,
  league = 'ipl',
  maxVisible = 10,
}: RichCommentaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);

  // Convert ball history to commentary entries
  const commentaryEntries = useMemo(() => {
    const entries: CommentaryEntry[] = [];
    let ballCount = 0;

    if (ballHistory && Array.isArray(ballHistory)) {
      ballHistory.forEach((event, index) => {
        ballCount++;
        const over = Math.floor(ballCount / 6);
        const ballInOver = (ballCount % 6) || 6;
        const ballString = `${over}.${ballInOver}`;

        // Determine event type
        let eventType: CommentaryEntry['eventType'] = 'runs';
        let isKeyMoment = false;

      if (event.type === 'W') {
        eventType = 'wicket';
        isKeyMoment = true;
      } else if (event.type === 4 || event.type === 6) {
        eventType = 'boundary';
        isKeyMoment = true;
      } else if (event.type === 0) {
        eventType = 'dot';
      } else if (typeof event.type === 'number' && event.type > 0) {
        eventType = 'runs';
        // Check for milestone (50, 100, 150)
        if (currentBatter && currentBatter.runs >= 50) {
          const runs = currentBatter.runs;
          if (runs === 50 || runs === 100 || runs === 150) {
            eventType = 'milestone';
            isKeyMoment = true;
          }
        }
      } else if (['WD', 'NB', 'B', 'LB', 'NB+1', 'NB+2', 'NB+3', 'NB+4', 'NB+6', 'WD+1', 'WD+2', 'WD+3', 'WD+4', '1B', '2B', '3B', '4B', '1LB', '2LB', '3LB', '4LB'].includes(event.type)) {
        eventType = 'extras';
        // Check if it's a boundary from extras
        if (event.type === 'NB+4' || event.type === 'NB+6' || event.type === 'WD+4' || event.type === '4B' || event.type === '4LB') {
          eventType = 'boundary';
          isKeyMoment = true;
        }
      } else {
        eventType = 'extras';
      }

      entries.push({
        ball: ballString,
        event,
        timestamp: new Date(event.timestamp).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        batterName: currentBatter?.name,
        bowlerName: currentBowler?.name,
        isKeyMoment,
        eventType,
      });
    });
    }

    return entries.reverse(); // Most recent first
  }, [ballHistory, currentBatter, currentBowler]);

  const visibleEntries = isExpanded 
    ? commentaryEntries 
    : commentaryEntries.slice(0, maxVisible);

  const getEventIcon = (eventType: CommentaryEntry['eventType'], event: BallEvent) => {
    switch (eventType) {
      case 'boundary':
        return event.type === 6 ? (
          <Zap className="w-5 h-5 text-yellow-400" />
        ) : (
          <Zap className="w-5 h-5 text-green-400" />
        );
      case 'wicket':
        return <X className="w-5 h-5 text-red-400" />;
      case 'milestone':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'dot':
        return <Circle className="w-4 h-4 text-gray-500" />;
      case 'extras':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      default:
        return <Circle className="w-4 h-4 text-blue-400" />;
    }
  };

  const getEventColor = (eventType: CommentaryEntry['eventType'], event: BallEvent) => {
    switch (eventType) {
      case 'boundary':
        const isSix = event.type === 6 || event.type === 'NB+6';
        return isSix
          ? 'border-yellow-500/50 bg-yellow-500/10'
          : 'border-green-500/50 bg-green-500/10';
      case 'wicket':
        return 'border-red-500/50 bg-red-500/10';
      case 'milestone':
        return 'border-yellow-500/50 bg-yellow-500/20';
      case 'dot':
        return 'border-gray-500/30 bg-gray-500/5';
      case 'extras':
        // Special colors for no ball and wide combinations
        if (typeof event.type === 'string' && event.type.startsWith('NB')) {
          return 'border-orange-600/50 bg-orange-600/10';
        }
        if (typeof event.type === 'string' && event.type.startsWith('WD')) {
          return 'border-orange-500/50 bg-orange-500/10';
        }
        return 'border-orange-500/50 bg-orange-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  const getEventTextColor = (eventType: CommentaryEntry['eventType'], event: BallEvent) => {
    switch (eventType) {
      case 'boundary':
        return event.type === 6 ? 'text-yellow-300' : 'text-green-300';
      case 'wicket':
        return 'text-red-300';
      case 'milestone':
        return 'text-yellow-300';
      case 'dot':
        return 'text-gray-400';
      case 'extras':
        return 'text-orange-300';
      default:
        return 'text-blue-300';
    }
  };

  const getEventDescription = (entry: CommentaryEntry): string => {
    const { event, batterName, bowlerName } = entry;
    
    if (event.type === 'W') {
      const dismissal = event.dismissalType || 'out';
      const fielder = event.fielderName ? ` by ${event.fielderName}` : '';
      return `${batterName || 'Batter'} ${dismissal}${fielder}`;
    }
    
    if (typeof event.type === 'number') {
      if (event.type === 0) {
        return `Dot ball${bowlerName ? ` by ${bowlerName}` : ''}`;
      }
      if (event.type === 4) {
        return `${batterName || 'Batter'} hits a FOUR!`;
      }
      if (event.type === 6) {
        return `${batterName || 'Batter'} hits a SIX!`;
      }
      return `${event.type} run${event.type === 1 ? '' : 's'}`;
    }
    
    switch (event.type) {
      // Basic extras
      case 'WD':
        return 'Wide ball';
      case 'NB':
        return 'No-ball';
      case 'B':
        return '1 Bye';
      case 'LB':
        return '1 Leg-bye';
      // No ball + runs
      case 'NB+1':
        return 'No-ball + 1 run';
      case 'NB+2':
        return 'No-ball + 2 runs';
      case 'NB+3':
        return 'No-ball + 3 runs';
      case 'NB+4':
        return 'No-ball + 4 runs (FOUR!)';
      case 'NB+6':
        return 'No-ball + 6 runs (SIX!)';
      // Wide + runs
      case 'WD+1':
        return 'Wide + 1 run';
      case 'WD+2':
        return 'Wide + 2 runs';
      case 'WD+3':
        return 'Wide + 3 runs';
      case 'WD+4':
        return 'Wide + 4 runs (FOUR!)';
      // Multiple byes
      case '1B':
        return '1 Bye';
      case '2B':
        return '2 Byes';
      case '3B':
        return '3 Byes';
      case '4B':
        return '4 Byes (boundary)';
      // Multiple leg byes
      case '1LB':
        return '1 Leg-bye';
      case '2LB':
        return '2 Leg-byes';
      case '3LB':
        return '3 Leg-byes';
      case '4LB':
        return '4 Leg-byes (boundary)';
      default:
        return 'Ball';
    }
  };

  const leagueColors = {
    ipl: {
      bg: 'bg-slate-800/50',
      border: 'border-slate-700/50',
    },
    wpl: {
      bg: 'bg-purple-900/20',
      border: 'border-purple-700/50',
    },
  };

  const colors = leagueColors[league];

  if (commentaryEntries.length === 0) {
    return (
      <div className={`${colors.bg} rounded-xl p-6 border ${colors.border}`}>
        <p className="text-gray-400 text-center">No commentary yet. Start recording balls to see commentary.</p>
      </div>
    );
  }

  return (
    <div className={`${colors.bg} rounded-xl border ${colors.border} overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">Ball-by-Ball Commentary</h3>
          <span className="text-xs text-gray-400">
            ({commentaryEntries.length} {commentaryEntries.length === 1 ? 'ball' : 'balls'})
          </span>
        </div>
        {commentaryEntries.length > maxVisible && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show More ({commentaryEntries.length - maxVisible} more)
              </>
            )}
          </button>
        )}
      </div>

      {/* Commentary List */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence>
          {visibleEntries.map((entry, index) => {
            const isSelected = selectedEntry === index;
            const colorClass = getEventColor(entry.eventType, entry.event);
            const textColorClass = getEventTextColor(entry.eventType, entry.event);
            const description = getEventDescription(entry);

            return (
              <motion.div
                key={`${entry.ball}-${entry.event.timestamp}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className={`
                  border-l-4 ${colorClass} p-4 hover:bg-white/5 transition-all cursor-pointer
                  ${entry.isKeyMoment ? 'ring-2 ring-yellow-500/30' : ''}
                  ${isSelected ? 'bg-white/10' : ''}
                `}
                onClick={() => setSelectedEntry(isSelected ? null : index)}
              >
                <div className="flex items-start gap-3">
                  {/* Event Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(entry.eventType, entry.event)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Ball and Timestamp */}
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-bold text-white">
                        {entry.ball}
                      </span>
                      <span className="text-xs text-gray-500">
                        {entry.timestamp}
                      </span>
                      {entry.isKeyMoment && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="inline-flex items-center gap-1 text-xs text-yellow-400 font-semibold"
                        >
                          <Star className="w-3 h-3 fill-yellow-400" />
                          Key Moment
                        </motion.span>
                      )}
                    </div>

                    {/* Event Description */}
                    <p className={`text-sm font-semibold ${textColorClass} mb-1`}>
                      {description}
                    </p>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2 pt-2 border-t border-white/10 space-y-1"
                        >
                          {entry.batterName && (
                            <p className="text-xs text-gray-400">
                              Batter: <span className="text-white">{entry.batterName}</span>
                            </p>
                          )}
                          {entry.bowlerName && (
                            <p className="text-xs text-gray-400">
                              Bowler: <span className="text-white">{entry.bowlerName}</span>
                            </p>
                          )}
                          {entry.event.dismissalType && (
                            <p className="text-xs text-gray-400">
                              Dismissal: <span className="text-red-300">{entry.event.dismissalType}</span>
                            </p>
                          )}
                          {entry.event.fielderName && (
                            <p className="text-xs text-gray-400">
                              Fielder: <span className="text-white">{entry.event.fielderName}</span>
                            </p>
                          )}
                          {typeof entry.event.type === 'number' && entry.event.type > 0 && (
                            <p className="text-xs text-gray-400">
                              Runs: <span className="text-green-300">{entry.event.type}</span>
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Key Moments Summary */}
      {commentaryEntries.filter(e => e.isKeyMoment).length > 0 && (
        <div className="p-4 border-t border-white/10 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-semibold text-yellow-300">
              Key Moments: {commentaryEntries.filter(e => e.isKeyMoment).length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {commentaryEntries
              .filter(e => e.isKeyMoment)
              .slice(0, 5)
              .map((entry, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                >
                  {entry.ball} - {entry.eventType === 'wicket' ? 'W' : entry.event.type}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

