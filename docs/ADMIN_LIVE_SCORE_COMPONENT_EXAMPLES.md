# Admin Live Score - Component Code Examples

## 🎯 Core Components with Code

### **1. Ball Entry Button Component**

```typescript
// src/components/admin/live-score/BallEntryButton.tsx
'use client';

import { motion } from 'framer-motion';

interface BallEntryButtonProps {
  value: number | string;
  label: string;
  color: 'green' | 'red' | 'orange' | 'blue';
  onClick: () => void;
  disabled?: boolean;
}

export default function BallEntryButton({
  value,
  label,
  color,
  onClick,
  disabled = false
}: BallEntryButtonProps) {
  const colorClasses = {
    green: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    red: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colorClasses[color]}
        w-20 h-20 rounded-xl
        text-white font-black text-2xl
        shadow-lg hover:shadow-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
      `}
    >
      {value}
      <div className="text-xs font-normal mt-1">{label}</div>
    </motion.button>
  );
}
```

### **2. Score Display Component**

```typescript
// src/components/admin/live-score/ScoreDisplay.tsx
'use client';

interface ScoreDisplayProps {
  teamName: string;
  runs: number;
  wickets: number;
  overs: number;
  isBatting: boolean;
}

export default function ScoreDisplay({
  teamName,
  runs,
  wickets,
  overs,
  isBatting
}: ScoreDisplayProps) {
  return (
    <div className={`
      p-6 rounded-2xl backdrop-blur-xl border-2
      ${isBatting 
        ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/30' 
        : 'bg-slate-800/50 border-slate-700/30'
      }
    `}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white">{teamName}</h3>
        {isBatting && (
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
            BATTING
          </span>
        )}
      </div>
      <div className="text-4xl font-black text-white mb-1">
        {runs}/{wickets}
      </div>
      <div className="text-sm text-gray-400">
        ({overs.toFixed(1)} overs)
      </div>
    </div>
  );
}
```

### **3. Current Over Display**

```typescript
// src/components/admin/live-score/CurrentOverDisplay.tsx
'use client';

interface CurrentOverDisplayProps {
  over: number; // e.g., 12.3
  innings: 1 | 2;
  battingTeam: string;
}

export default function CurrentOverDisplay({
  over,
  innings,
  battingTeam
}: CurrentOverDisplayProps) {
  const wholeOver = Math.floor(over);
  const ballInOver = Math.floor((over - wholeOver) * 10);

  return (
    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-400/30">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Innings {innings} · {battingTeam} Batting
          </div>
          <div className="text-3xl font-black text-white">
            Over {wholeOver}.{ballInOver}
          </div>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((ball) => (
            <div
              key={ball}
              className={`
                w-3 h-3 rounded-full
                ${ball < ballInOver 
                  ? 'bg-green-500' 
                  : ball === ballInOver 
                    ? 'bg-yellow-500 animate-pulse' 
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
```

### **4. Player Stats Display**

```typescript
// src/components/admin/live-score/PlayerStats.tsx
'use client';

interface PlayerStatsProps {
  player: {
    name: string;
    runs: number;
    balls: number;
    isBatter: boolean;
  };
}

export default function PlayerStats({ player }: PlayerStatsProps) {
  const strikeRate = player.balls > 0 
    ? ((player.runs * 100) / player.balls).toFixed(1)
    : '0.0';
  
  const economy = player.balls > 0 && !player.isBatter
    ? ((player.runs * 6) / player.balls).toFixed(2)
    : null;

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-white">{player.name}</h4>
        <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
          {player.isBatter ? 'BATTER' : 'BOWLER'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-gray-400 text-xs">Runs</div>
          <div className="text-white font-bold">{player.runs}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Balls</div>
          <div className="text-white font-bold">{player.balls}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">
            {player.isBatter ? 'SR' : 'Econ'}
          </div>
          <div className="text-white font-bold">
            {player.isBatter ? strikeRate : economy}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### **5. Ball Entry Panel (Main Component)**

```typescript
// src/components/admin/live-score/BallEntryPanel.tsx
'use client';

import { useState } from 'react';
import BallEntryButton from './BallEntryButton';
import ScoreDisplay from './ScoreDisplay';
import CurrentOverDisplay from './CurrentOverDisplay';
import PlayerStats from './PlayerStats';

interface BallEntryPanelProps {
  matchId: string;
  onBallRecorded: (ball: BallEvent) => void;
  matchState: MatchState;
}

export default function BallEntryPanel({
  matchId,
  onBallRecorded,
  matchState
}: BallEntryPanelProps) {
  const handleBallClick = (value: number | string) => {
    onBallRecorded({
      type: typeof value === 'number' ? 'runs' : value,
      runs: typeof value === 'number' ? value : 0,
      timestamp: Date.now()
    });
  };

  return (
    <div className="space-y-6">
      {/* Match Info */}
      <CurrentOverDisplay
        over={matchState.currentOver}
        innings={matchState.innings}
        battingTeam={matchState.battingTeam === 'team1' 
          ? matchState.team1.name 
          : matchState.team2.name
        }
      />

      {/* Score Display */}
      <div className="grid grid-cols-2 gap-4">
        <ScoreDisplay
          teamName={matchState.team1.name}
          runs={matchState.team1.runs}
          wickets={matchState.team1.wickets}
          overs={matchState.team1.overs}
          isBatting={matchState.battingTeam === 'team1'}
        />
        <ScoreDisplay
          teamName={matchState.team2.name}
          runs={matchState.team2.runs}
          wickets={matchState.team2.wickets}
          overs={matchState.team2.overs}
          isBatting={matchState.battingTeam === 'team2'}
        />
      </div>

      {/* Current Players */}
      <div className="grid grid-cols-2 gap-4">
        <PlayerStats
          player={{
            name: matchState.currentBatter.name,
            runs: matchState.currentBatter.runs,
            balls: matchState.currentBatter.balls,
            isBatter: true
          }}
        />
        <PlayerStats
          player={{
            name: matchState.currentBowler.name,
            runs: matchState.currentBowler.runs,
            balls: matchState.currentBowler.balls,
            isBatter: false
          }}
        />
      </div>

      {/* Ball Entry Buttons */}
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          <BallEntryButton value={0} label="Dot" color="green" onClick={() => handleBallClick(0)} />
          <BallEntryButton value={1} label="Single" color="green" onClick={() => handleBallClick(1)} />
          <BallEntryButton value={2} label="Double" color="green" onClick={() => handleBallClick(2)} />
          <BallEntryButton value={4} label="Four" color="green" onClick={() => handleBallClick(4)} />
          <BallEntryButton value={6} label="Six" color="green" onClick={() => handleBallClick(6)} />
        </div>
        <div className="grid grid-cols-5 gap-3">
          <BallEntryButton value="W" label="Wicket" color="red" onClick={() => handleBallClick('W')} />
          <BallEntryButton value="WD" label="Wide" color="orange" onClick={() => handleBallClick('WD')} />
          <BallEntryButton value="NB" label="No-Ball" color="orange" onClick={() => handleBallClick('NB')} />
          <BallEntryButton value="B" label="Bye" color="orange" onClick={() => handleBallClick('B')} />
          <BallEntryButton value="LB" label="Leg-Bye" color="orange" onClick={() => handleBallClick('LB')} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold">
          Change Batter
        </button>
        <button className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold">
          Change Bowler
        </button>
        <button className="px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl text-white font-bold">
          Undo
        </button>
      </div>
    </div>
  );
}
```

### **6. Wicket Modal Component**

```typescript
// src/components/admin/live-score/WicketModal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dismissalType: string, fielderName?: string) => void;
  players: Player[];
}

const DISMISSAL_TYPES = [
  { key: 'bowled', label: 'Bowled', needsFielder: false },
  { key: 'caught', label: 'Caught', needsFielder: true },
  { key: 'lbw', label: 'LBW', needsFielder: false },
  { key: 'run_out', label: 'Run Out', needsFielder: true },
  { key: 'stumped', label: 'Stumped', needsFielder: true },
  { key: 'hit_wicket', label: 'Hit Wicket', needsFielder: false },
];

export default function WicketModal({
  isOpen,
  onClose,
  onConfirm,
  players
}: WicketModalProps) {
  const [selectedType, setSelectedType] = useState('');
  const [selectedFielder, setSelectedFielder] = useState('');

  const needsFielder = DISMISSAL_TYPES.find(d => d.key === selectedType)?.needsFielder || false;

  const handleConfirm = () => {
    if (!selectedType) return;
    if (needsFielder && !selectedFielder) {
      alert('Please select a fielder');
      return;
    }
    onConfirm(selectedType, needsFielder ? selectedFielder : undefined);
    setSelectedType('');
    setSelectedFielder('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700"
          >
            <h3 className="text-2xl font-bold text-white mb-4">How was the wicket?</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {DISMISSAL_TYPES.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setSelectedType(type.key)}
                  className={`
                    px-4 py-3 rounded-xl font-bold transition-all
                    ${selectedType === type.key
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }
                  `}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {needsFielder && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Select Fielder</label>
                <select
                  value={selectedFielder}
                  onChange={(e) => setSelectedFielder(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 rounded-lg text-white"
                >
                  <option value="">Select fielder...</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.name}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedType || (needsFielder && !selectedFielder)}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold"
              >
                Confirm Wicket
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 🔄 State Management Example

```typescript
// src/hooks/useLiveScore.ts
import { useState, useCallback } from 'react';

interface MatchState {
  innings: 1 | 2;
  battingTeam: 'team1' | 'team2';
  currentOver: number;
  team1: { runs: number; wickets: number; balls: number };
  team2: { runs: number; wickets: number; balls: number };
  currentBatter: { id: string; name: string; runs: number; balls: number };
  currentBowler: { id: string; name: string; runs: number; balls: number };
  ballHistory: BallEvent[];
}

export function useLiveScore(initialState: MatchState) {
  const [state, setState] = useState<MatchState>(initialState);
  const [undoStack, setUndoStack] = useState<MatchState[]>([]);

  const recordBall = useCallback((ball: BallEvent) => {
    setState((prev) => {
      // Save current state for undo
      setUndoStack((stack) => [...stack, prev].slice(-5)); // Keep last 5

      const battingKey = prev.battingTeam;
      const team = prev[battingKey];
      
      // Calculate new values
      const runs = ball.runs || 0;
      const isWicket = ball.type === 'W';
      const isLegal = !['WD', 'NB'].includes(ball.type);
      
      const newBalls = isLegal ? team.balls + 1 : team.balls;
      const newRuns = team.runs + runs;
      const newWickets = isWicket ? team.wickets + 1 : team.wickets;
      const newOver = ballsToOvers(newBalls);

      // Update batter/bowler stats
      const batterRuns = ['WD', 'NB', 'B', 'LB'].includes(ball.type) 
        ? prev.currentBatter.runs 
        : prev.currentBatter.runs + runs;
      const batterBalls = isLegal ? prev.currentBatter.balls + 1 : prev.currentBatter.balls;
      
      const bowlerRuns = ['B', 'LB'].includes(ball.type)
        ? prev.currentBowler.runs
        : prev.currentBowler.runs + runs;
      const bowlerBalls = isLegal ? prev.currentBowler.balls + 1 : prev.currentBowler.balls;

      return {
        ...prev,
        [battingKey]: {
          ...team,
          runs: newRuns,
          wickets: newWickets,
          balls: newBalls,
        },
        currentOver: newOver,
        currentBatter: {
          ...prev.currentBatter,
          runs: batterRuns,
          balls: batterBalls,
        },
        currentBowler: {
          ...prev.currentBowler,
          runs: bowlerRuns,
          balls: bowlerBalls,
        },
        ballHistory: [...prev.ballHistory, ball].slice(-100), // Keep last 100
      };
    });
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setState(previousState);
  }, [undoStack]);

  return {
    state,
    recordBall,
    undo,
  };
}
```

---

## 📱 Responsive Layout Example

```typescript
// Mobile-first responsive design
<div className="
  p-4 md:p-6 lg:p-8
  max-w-md md:max-w-2xl lg:max-w-4xl mx-auto
">
  {/* Ball buttons - stack on mobile, grid on desktop */}
  <div className="
    grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4
  ">
    {/* Buttons */}
  </div>
</div>
```

---

## 🎨 Styling with Tailwind

```css
/* Custom animations */
@keyframes ballRecorded {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.ball-recorded {
  animation: ballRecorded 0.3s ease;
}

/* Touch-friendly sizes */
@media (max-width: 768px) {
  .ball-button {
    min-height: 80px;
    min-width: 80px;
  }
}
```

---

These examples provide a solid foundation for building a simplified, user-friendly admin live score interface!

