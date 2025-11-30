'use client';

interface CurrentOverDisplayProps {
  over: number; // e.g., 12.3
  innings: 1 | 2;
  battingTeam: string;
  league?: 'ipl' | 'wpl';
}

export default function CurrentOverDisplay({
  over,
  innings,
  battingTeam,
  league = 'ipl'
}: CurrentOverDisplayProps) {
  const wholeOver = Math.floor(over);
  const ballInOver = Math.floor((over - wholeOver) * 10);

  const leagueColors = {
    ipl: {
      bg: 'from-blue-600/20 to-cyan-600/20',
      border: 'border-blue-400/30',
      text: 'text-blue-400'
    },
    wpl: {
      bg: 'from-purple-600/20 to-pink-600/20',
      border: 'border-purple-400/30',
      text: 'text-pink-400'
    }
  };

  const colors = leagueColors[league];

  return (
    <div className={`bg-gradient-to-r ${colors.bg} rounded-xl p-5 border-2 ${colors.border} backdrop-blur-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
            Innings {innings} · <span className={colors.text}>{battingTeam}</span> Batting
          </div>
          <div className="text-4xl font-black text-white">
            Over {wholeOver}.{ballInOver}
          </div>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((ball) => (
            <div
              key={ball}
              className={`
                w-4 h-4 rounded-full transition-all duration-300
                ${ball < ballInOver 
                  ? `bg-${league === 'ipl' ? 'green' : 'purple'}-500 shadow-lg` 
                  : ball === ballInOver 
                    ? `bg-${league === 'ipl' ? 'yellow' : 'pink'}-500 animate-pulse shadow-lg` 
                    : 'bg-gray-600'
                }
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

