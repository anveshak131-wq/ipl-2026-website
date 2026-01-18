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
      team.shortName?.replace('-W', '')
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4"
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
    </motion.div>
  );
}
