'use client';

interface PowerplayIndicatorProps {
  currentOver: number;
  league?: 'ipl' | 'wpl';
}

export default function PowerplayIndicator({ currentOver, league = 'ipl' }: PowerplayIndicatorProps) {
  const isPowerplay = currentOver <= 6;
  const powerplayOversRemaining = Math.max(0, 7 - Math.ceil(currentOver));
  const fieldersOutside = isPowerplay ? 2 : currentOver <= 15 ? 4 : 5;

  if (!isPowerplay) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4 animate-pulse">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-yellow-300 font-bold text-lg">⚡ POWERPLAY</span>
          <span className="text-gray-300 text-sm">
            {powerplayOversRemaining} {powerplayOversRemaining === 1 ? 'over' : 'overs'} remaining
          </span>
        </div>
        <div className="text-gray-300 text-sm">
          Max {fieldersOutside} fielders outside 30-yard circle
        </div>
      </div>
    </div>
  );
}

