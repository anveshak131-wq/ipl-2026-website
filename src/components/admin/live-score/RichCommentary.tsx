'use client';

import { useState, useMemo, useCallback } from 'react';
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
  Edit2,
  Trash2,
  Sparkles,
  Save,
  XCircle,
  Trash,
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
  originalIndex: number; // Track original index for edit/delete
}

interface RichCommentaryProps {
  ballHistory: BallEvent[];
  currentOver: number;
  currentBatter?: { name: string; runs: number };
  currentBowler?: { name: string };
  league?: 'ipl' | 'wpl';
  maxVisible?: number;
  onDeleteBall?: (index: number) => void;
  onEditBallCommentary?: (index: number, commentary: string) => void;
  onClearAllBalls?: () => void;
}

export default function RichCommentary({
  ballHistory,
  currentOver,
  currentBatter,
  currentBowler,
  league = 'ipl',
  maxVisible = 10,
  onDeleteBall,
  onEditBallCommentary,
  onClearAllBalls,
}: RichCommentaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editCommentary, setEditCommentary] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Convert ball history to commentary entries
  const commentaryEntries = useMemo(() => {
    const entries: CommentaryEntry[] = [];
    let ballCount = 0;

    if (ballHistory && Array.isArray(ballHistory)) {
      ballHistory.forEach((event, index) => {
        ballCount++;
        // Calculate over and ball correctly:
        // Ball 1-6 = Over 0 (0.1, 0.2, 0.3, 0.4, 0.5, 0.6)
        // Ball 7-12 = Over 1 (1.1, 1.2, 1.3, 1.4, 1.5, 1.6)
        const over = Math.floor((ballCount - 1) / 6);
        const ballInOver = ((ballCount - 1) % 6) + 1;
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
      } else if (['WD', 'NB', 'B', 'LB', 'NB+1', 'NB+2', 'NB+3', 'NB+4', 'NB+6', 'WD+1', 'WD+2', 'WD+3', 'WD+4', '1B', '2B', '3B', '4B', '1LB', '2LB', '3LB', '4LB'].includes(String(event.type))) {
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
        originalIndex: index,
      });
    });
    }

    return entries.reverse(); // Most recent first
  }, [ballHistory, currentBatter, currentBowler]);

  // Generate AI-enhanced commentary
  const generateAICommentary = useCallback(async (entry: CommentaryEntry) => {
    setIsGeneratingAI(entry.originalIndex);
    
    // Simulate AI generation with cricket-specific commentary
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { event, batterName, bowlerName, eventType } = entry;
    let aiCommentary = '';
    
    if (event.type === 'W') {
      const dismissal = event.dismissalType || 'out';
      const fielder = event.fielderName ? ` Brilliant effort by ${event.fielderName}!` : '';
      aiCommentary = `💥 WICKET! ${batterName || 'The batter'} is ${dismissal}! ${bowlerName || 'The bowler'} strikes!${fielder} The crowd erupts as another one bites the dust!`;
    } else if (event.type === 6) {
      aiCommentary = `🚀 MASSIVE SIX! ${batterName || 'The batter'} launches it into the stands! ${bowlerName || 'The bowler'} can only watch as the ball disappears into the night sky. What a shot!`;
    } else if (event.type === 4) {
      const shots = ['elegant cover drive', 'fierce pull shot', 'delicate late cut', 'powerful straight drive', 'crisp square cut'];
      const randomShot = shots[Math.floor(Math.random() * shots.length)];
      aiCommentary = `🔥 FOUR! A ${randomShot} from ${batterName || 'the batter'}! The ball races to the boundary. ${bowlerName || 'The bowler'} is left searching for answers.`;
    } else if (event.type === 0) {
      const dotComments = [
        `Excellent delivery! ${bowlerName || 'The bowler'} beats the bat.`,
        `Dot ball! Good pressure from ${bowlerName || 'the bowler'}.`,
        `No run there. ${batterName || 'The batter'} defends solidly.`,
        `Tight bowling! Building pressure here.`,
      ];
      aiCommentary = `⚪ ${dotComments[Math.floor(Math.random() * dotComments.length)]}`;
    } else if (typeof event.type === 'number' && event.type > 0) {
      const runComments = event.type === 1 
        ? ['Quick single taken!', 'Sharp running between the wickets.', 'They sneak a quick single.']
        : event.type === 2 
          ? ['Excellent running! Two runs taken.', 'Good placement and they come back for two.']
          : ['Three runs! Outstanding running between the wickets.'];
      aiCommentary = `🏃 ${runComments[Math.floor(Math.random() * runComments.length)]}`;
    } else if (String(event.type).includes('NB')) {
      aiCommentary = `⚠️ NO BALL! ${bowlerName || 'The bowler'} oversteps. Free hit coming up! The batting team gets a bonus run.`;
    } else if (String(event.type).includes('WD')) {
      aiCommentary = `⚠️ WIDE! ${bowlerName || 'The bowler'} strays down leg side. An extra run added to the total.`;
    } else {
      aiCommentary = `Ball bowled by ${bowlerName || 'the bowler'} to ${batterName || 'the batter'}.`;
    }
    
    if (onEditBallCommentary) {
      onEditBallCommentary(entry.originalIndex, aiCommentary);
    }
    
    setIsGeneratingAI(null);
  }, [onEditBallCommentary]);

  // Handle delete ball
  const handleDeleteBall = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteBall) {
      onDeleteBall(index);
    }
  }, [onDeleteBall]);

  // Handle edit save
  const handleSaveEdit = useCallback((originalIndex: number) => {
    if (onEditBallCommentary && editCommentary.trim()) {
      onEditBallCommentary(originalIndex, editCommentary.trim());
    }
    setEditingIndex(null);
    setEditCommentary('');
  }, [onEditBallCommentary, editCommentary]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    if (onClearAllBalls) {
      onClearAllBalls();
    }
    setShowClearConfirm(false);
  }, [onClearAllBalls]);

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
        <div className="flex items-center gap-2">
          {/* Clear All Button */}
          {onClearAllBalls && commentaryEntries.length > 0 && (
            <>
              {showClearConfirm ? (
                <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-lg">
                  <span className="text-xs text-red-400">Clear all?</span>
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                  title="Clear all balls"
                >
                  <Trash className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </>
          )}
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
      </div>

      {/* Commentary List */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence>
          {visibleEntries.map((entry, index) => {
            const isSelected = selectedEntry === index;
            const colorClass = getEventColor(entry.eventType, entry.event);
            const textColorClass = getEventTextColor(entry.eventType, entry.event);
            const description = getEventDescription(entry);
            const isEditing = editingIndex === entry.originalIndex;

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
                  ${isEditing ? 'bg-blue-500/10' : ''}
                `}
                onClick={() => !isEditing && setSelectedEntry(isSelected ? null : index)}
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
                      {entry.event.isEdited && (
                        <span className="text-xs text-blue-400 italic">(edited)</span>
                      )}
                    </div>

                    {/* Event Description or Edit Mode */}
                    {isEditing ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <textarea
                          value={editCommentary}
                          onChange={(e) => setEditCommentary(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Enter custom commentary..."
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(entry.originalIndex)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-colors"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingIndex(null);
                              setEditCommentary('');
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              setIsGeneratingAI(entry.originalIndex);
                              // Generate AI commentary inline
                              await new Promise(resolve => setTimeout(resolve, 500));
                              const { event, batterName, bowlerName } = entry;
                              let aiCommentary = '';
                              
                              if (event.type === 'W') {
                                const dismissal = event.dismissalType || 'out';
                                const fielder = event.fielderName ? ` Brilliant effort by ${event.fielderName}!` : '';
                                aiCommentary = `💥 WICKET! ${batterName || 'The batter'} is ${dismissal}!${fielder}`;
                              } else if (event.type === 6) {
                                aiCommentary = `🚀 MASSIVE SIX! ${batterName || 'The batter'} launches it into the stands!`;
                              } else if (event.type === 4) {
                                const shots = ['elegant cover drive', 'fierce pull shot', 'delicate late cut'];
                                aiCommentary = `🔥 FOUR! A ${shots[Math.floor(Math.random() * shots.length)]} from ${batterName || 'the batter'}!`;
                              } else if (event.type === 0) {
                                aiCommentary = `⚪ Excellent delivery! ${bowlerName || 'The bowler'} beats the bat.`;
                              } else if (typeof event.type === 'number' && event.type > 0) {
                                aiCommentary = `🏃 ${event.type === 1 ? 'Quick single!' : event.type === 2 ? 'Two runs!' : 'Three runs!'} Good running.`;
                              } else if (String(event.type).includes('NB')) {
                                aiCommentary = `⚠️ NO BALL! Free hit coming up!`;
                              } else if (String(event.type).includes('WD')) {
                                aiCommentary = `⚠️ WIDE! Extra run to the batting team.`;
                              } else {
                                aiCommentary = `Ball delivered by ${bowlerName || 'the bowler'}.`;
                              }
                              
                              setEditCommentary(aiCommentary);
                              setIsGeneratingAI(null);
                            }}
                            disabled={isGeneratingAI === entry.originalIndex}
                            className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Sparkles className={`w-3 h-3 ${isGeneratingAI === entry.originalIndex ? 'animate-spin' : ''}`} />
                            {isGeneratingAI === entry.originalIndex ? 'Generating...' : 'AI Enhance'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`text-sm font-semibold ${textColorClass} mb-1`}>
                          {description}
                        </p>
                        {/* Custom Commentary Display */}
                        {entry.event.commentary && (
                          <p className="text-xs text-purple-300 italic mt-1 bg-purple-500/10 px-2 py-1 rounded">
                            {entry.event.commentary}
                          </p>
                        )}
                      </>
                    )}

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isSelected && !isEditing && (
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

                  {/* Action Buttons */}
                  {!isEditing && (onDeleteBall || onEditBallCommentary) && (
                    <div className="flex-shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {onEditBallCommentary && (
                        <button
                          onClick={() => {
                            setEditingIndex(entry.originalIndex);
                            setEditCommentary(entry.event.commentary || '');
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                          title="Edit commentary"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteBall && (
                        <button
                          onClick={(e) => handleDeleteBall(entry.originalIndex, e)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete this ball"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
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

