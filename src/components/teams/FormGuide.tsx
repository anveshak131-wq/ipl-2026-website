'use client';

import { motion } from 'framer-motion';
import { Match } from '@/types';

interface FormGuideProps {
  matches: Match[];
  teamId: string;
  primaryColor: string;
}

export default function FormGuide({ matches, teamId, primaryColor }: FormGuideProps) {
  // Get last 5 completed matches
  const recentMatches = matches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .reverse(); // Show oldest to newest (left to right)

  if (recentMatches.length === 0) {
    return null;
  }

  const getMatchResult = (match: Match) => {
    const team = match.team1.id === teamId ? match.team1 : match.team2;
    const opponent = match.team1.id === teamId ? match.team2 : match.team1;
    
    if (!match.result) return 'unknown';
    
    const resultLower = match.result.toLowerCase();
    const teamNameVariations = [
      team.name,
      team.shortName,
      team.name?.replace(' (WPL)', '').replace(' (IPL)', ''),
      team.name?.replace('Bengaluru', 'Bangalore'),
      team.name?.replace('Bangalore', 'Bengaluru'),
      team.name?.replace(' Women', ''),
      team.shortName?.replace('-W', ''),
      // Additional variations for RCB
      'Royal Challengers Bangalore',
      'Royal Challengers Bengaluru',
      'RCB',
      // Handle combined variations
      team.name?.replace(' Women', '').replace('Bengaluru', 'Bangalore'),
      team.name?.replace(' Women', '').replace('Bangalore', 'Bengaluru'),
    ].filter(Boolean);
    
    const isWin = teamNameVariations.some(name => {
      const nameLower = name?.toLowerCase() || '';
      return resultLower.includes(nameLower + ' won') || 
             resultLower.includes(nameLower + ' win');
    });
    
    if (resultLower.includes('no result') || resultLower.includes('abandoned')) {
      return 'nr';
    }
    
    return isWin ? 'win' : 'loss';
  };

  const wins = recentMatches.filter((m) => getMatchResult(m) === 'win').length;
  const winPercentage = (wins / recentMatches.length) * 100;

  // Calculate win/loss streak
  const calculateStreak = () => {
    const allMatches = matches
      .filter((m) => m.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (allMatches.length === 0) return { type: 'none', count: 0 };

    const firstResult = getMatchResult(allMatches[0]);
    if (firstResult === 'nr' || firstResult === 'unknown') return { type: 'none', count: 0 };

    let streak = 1;
    for (let i = 1; i < allMatches.length; i++) {
      const result = getMatchResult(allMatches[i]);
      if (result === firstResult) {
        streak++;
      } else {
        break;
      }
    }

    return { type: firstResult, count: streak };
  };

  const streak = calculateStreak();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-4 flex-wrap"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-400">Form:</span>
        <div className="flex gap-1.5">
          {recentMatches.map((match, index) => {
            const result = getMatchResult(match);
            const opponent = match.team1.id === teamId ? match.team2 : match.team1;
            
            return (
              <motion.div
                key={match.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.2, zIndex: 10 }}
                className="relative group"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    result === 'win'
                      ? 'bg-green-500 text-white'
                      : result === 'loss'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}
                  style={{
                    boxShadow:
                      result === 'win'
                        ? '0 0 10px rgba(34, 197, 94, 0.5)'
                        : result === 'loss'
                        ? '0 0 10px rgba(239, 68, 68, 0.5)'
                        : '0 0 10px rgba(107, 114, 128, 0.5)',
                  }}
                >
                  {result === 'win' ? 'W' : result === 'loss' ? 'L' : 'NR'}
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                    <div className="text-xs font-semibold text-white mb-1">
                      vs {opponent.shortName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(match.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-300 mt-1 max-w-48">
                      {match.result}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                      <div className="border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Win percentage badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
        className="px-3 py-1 rounded-full text-xs font-bold"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
          border: `1px solid ${primaryColor}40`,
          color: primaryColor,
        }}
      >
        {winPercentage.toFixed(0)}% Win Rate
      </motion.div>
      </div>

      {/* Win/Loss Streak Badge */}
      {streak.count >= 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
          className={`relative overflow-hidden rounded-xl px-5 py-3 ${
            streak.type === 'win'
              ? 'bg-gradient-to-r from-green-500/20 via-green-500/10 to-green-500/20 border-2 border-green-500/40'
              : 'bg-gradient-to-r from-red-500/20 via-red-500/10 to-red-500/20 border-2 border-red-500/40'
          }`}
          style={{
            boxShadow: streak.type === 'win'
              ? '0 8px 32px rgba(34, 197, 94, 0.3)'
              : '0 8px 32px rgba(239, 68, 68, 0.3)',
          }}
        >
          {/* Animated shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />

          {/* Content */}
          <div className="relative flex items-center gap-3">
            {streak.type === 'win' && (
              <motion.span
                className="text-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                🔥
              </motion.span>
            )}
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-black ${
                  streak.type === 'win' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {streak.count}
              </span>
              <span
                className={`text-sm font-bold uppercase tracking-wide ${
                  streak.type === 'win' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                Match {streak.type === 'win' ? 'Win' : 'Loss'} Streak
              </span>
            </div>
            {streak.type === 'loss' && (
              <motion.span
                className="text-xl"
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                📉
              </motion.span>
            )}
          </div>

          {/* Pulsing background effect for win streaks */}
          {streak.type === 'win' && (
            <motion.div
              className="absolute inset-0 bg-green-500/10"
              animate={{
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
