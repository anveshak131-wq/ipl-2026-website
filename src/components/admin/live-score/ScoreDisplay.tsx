'use client';

interface ScoreDisplayProps {
  teamName: string;
  runs: number;
  wickets: number;
  overs: number;
  isBatting: boolean;
  league?: 'ipl' | 'wpl';
}

export default function ScoreDisplay({
  teamName,
  runs,
  wickets,
  overs,
  isBatting,
  league = 'ipl'
}: ScoreDisplayProps) {
  const leagueColors = {
    ipl: {
      bg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-400/30',
      badge: 'bg-blue-500/20 text-blue-400'
    },
    wpl: {
      bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
      border: 'border-purple-400/30',
      badge: 'bg-purple-500/20 text-pink-400'
    }
  };

  const colors = leagueColors[league];

  return (
    <div className={`
      p-6 rounded-2xl backdrop-blur-xl border-2 transition-all duration-300
      ${isBatting 
        ? `${colors.bg} ${colors.border} shadow-lg shadow-${league === 'ipl' ? 'blue' : 'purple'}-500/20` 
        : 'bg-slate-800/50 border-slate-700/30'
      }
    `}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-white">{teamName}</h3>
        {isBatting && (
          <span className={`px-3 py-1.5 rounded-full ${colors.badge} text-xs font-bold uppercase tracking-wider`}>
            BATTING
          </span>
        )}
      </div>
      <div className="text-5xl font-black text-white mb-2 leading-none">
        {runs}<span className="text-3xl text-gray-400">/{wickets}</span>
      </div>
      <div className="text-sm text-gray-400 font-semibold">
        ({overs.toFixed(1)} overs)
      </div>
      {isBatting && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs text-gray-400">
            Run Rate: <span className="text-white font-bold">{(runs / (overs || 0.1)).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

