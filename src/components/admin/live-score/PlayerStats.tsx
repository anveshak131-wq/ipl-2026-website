'use client';

interface PlayerStatsProps {
  player: {
    name: string;
    runs: number;
    balls: number;
    isBatter: boolean;
  };
  league?: 'ipl' | 'wpl';
}

export default function PlayerStats({ player, league = 'ipl' }: PlayerStatsProps) {
  const strikeRate = player.balls > 0 
    ? ((player.runs * 100) / player.balls).toFixed(1)
    : '0.0';
  
  const economy = player.balls > 0 && !player.isBatter
    ? ((player.runs * 6) / player.balls).toFixed(2)
    : null;

  const leagueColors = {
    ipl: {
      badge: 'bg-blue-500/20 text-blue-400',
      accent: 'text-blue-400'
    },
    wpl: {
      badge: 'bg-purple-500/20 text-pink-400',
      accent: 'text-pink-400'
    }
  };

  const colors = leagueColors[league];

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-white text-lg">{player.name}</h4>
        <span className={`text-xs px-2.5 py-1 rounded ${colors.badge} font-bold uppercase`}>
          {player.isBatter ? 'BATTER' : 'BOWLER'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-gray-400 text-xs mb-1">Runs</div>
          <div className="text-white font-black text-2xl">{player.runs}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">Balls</div>
          <div className="text-white font-black text-2xl">{player.balls}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">
            {player.isBatter ? 'SR' : 'Econ'}
          </div>
          <div className={`font-black text-2xl ${colors.accent}`}>
            {player.isBatter ? strikeRate : economy || '0.00'}
          </div>
        </div>
      </div>
    </div>
  );
}

