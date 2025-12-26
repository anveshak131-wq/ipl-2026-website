'use client';

import { useState } from 'react';
import { Zap, Trophy } from 'lucide-react';
import BallEntryButton from './BallEntryButton';

interface SuperOverPanelProps {
  team1Name: string;
  team2Name: string;
  superOver: {
    overNumber: number;
    team1: { runs: number; wickets: number };
    team2: { runs: number; wickets: number };
    battingTeam: 'team1' | 'team2';
    completed: boolean;
    winner?: 'team1' | 'team2';
  };
  onBallRecord: (ball: { type: number | 'W'; runs: number }) => void;
  onComplete: (winner: 'team1' | 'team2') => void;
  onNextSuperOver?: () => void;
}

const MAX_BALLS_PER_SUPER_OVER = 6;
const MAX_WICKETS_PER_SUPER_OVER = 2;

export default function SuperOverPanel({
  team1Name,
  team2Name,
  superOver,
  onBallRecord,
  onComplete,
  onNextSuperOver,
}: SuperOverPanelProps) {
  const [currentBall, setCurrentBall] = useState(0);
  const [currentTeam, setCurrentTeam] = useState<'team1' | 'team2'>(superOver.battingTeam);
  const [currentRuns, setCurrentRuns] = useState(0);
  const [currentWickets, setCurrentWickets] = useState(0);

  const currentTeamData = currentTeam === 'team1' ? superOver.team1 : superOver.team2;
  const ballsRemaining = MAX_BALLS_PER_SUPER_OVER - currentBall;
  const wicketsRemaining = MAX_WICKETS_PER_SUPER_OVER - currentWickets;

  const handleBallClick = (runs: number) => {
    if (currentBall >= MAX_BALLS_PER_SUPER_OVER || currentWickets >= MAX_WICKETS_PER_SUPER_OVER) {
      return;
    }

    setCurrentRuns(prev => prev + runs);
    setCurrentBall(prev => prev + 1);
    onBallRecord({ type: runs, runs });

    if (currentBall + 1 >= MAX_BALLS_PER_SUPER_OVER || currentWickets >= MAX_WICKETS_PER_SUPER_OVER) {
      // Super Over complete for this team
      if (currentTeam === 'team1') {
        // Switch to team 2
        setCurrentTeam('team2');
        setCurrentBall(0);
        setCurrentWickets(0);
        setCurrentRuns(0);
      } else {
        // Both teams done, determine winner
        const team1Total = superOver.team1.runs + currentRuns + runs;
        const team2Total = superOver.team2.runs;
        
        if (team1Total > team2Total) {
          onComplete('team1');
        } else if (team2Total > team1Total) {
          onComplete('team2');
        } else {
          // Tie - need another Super Over
          if (onNextSuperOver) {
            onNextSuperOver();
          }
        }
      }
    }
  };

  const handleWicket = () => {
    if (currentWickets >= MAX_WICKETS_PER_SUPER_OVER) {
      return;
    }

    setCurrentWickets(prev => prev + 1);
    setCurrentBall(prev => prev + 1);
    onBallRecord({ type: 'W', runs: 0 });

    if (currentBall + 1 >= MAX_BALLS_PER_SUPER_OVER || currentWickets + 1 >= MAX_WICKETS_PER_SUPER_OVER) {
      // Super Over complete for this team
      if (currentTeam === 'team1') {
        setCurrentTeam('team2');
        setCurrentBall(0);
        setCurrentWickets(0);
        setCurrentRuns(0);
      } else {
        const team1Total = superOver.team1.runs;
        const team2Total = superOver.team2.runs;
        
        if (team1Total > team2Total) {
          onComplete('team1');
        } else if (team2Total > team1Total) {
          onComplete('team2');
        } else {
          if (onNextSuperOver) {
            onNextSuperOver();
          }
        }
      }
    }
  };

  const isFirstTeamBatting = currentTeam === superOver.battingTeam;
  const isSecondTeamBatting = !isFirstTeamBatting && superOver.team1.runs > 0;

  return (
    <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-purple-500/50 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h3 className="text-white font-bold text-xl">Super Over #{superOver.overNumber}</h3>
        </div>
        {superOver.winner && (
          <div className="flex items-center gap-2 text-yellow-400">
            <Trophy className="w-5 h-5" />
            <span className="font-bold">
              Winner: {superOver.winner === 'team1' ? team1Name : team2Name}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-gray-300 text-sm mb-1">{team1Name}</div>
          <div className="text-white font-bold text-2xl">
            {superOver.team1.runs}/{superOver.team1.wickets}
          </div>
        </div>
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-gray-300 text-sm mb-1">{team2Name}</div>
          <div className="text-white font-bold text-2xl">
            {superOver.team2.runs}/{superOver.team2.wickets}
          </div>
        </div>
      </div>

      {!superOver.completed && (
        <>
          <div className="bg-white/10 rounded-lg p-4 mb-4">
            <div className="text-gray-300 text-sm mb-2">
              {currentTeam === 'team1' ? team1Name : team2Name} Batting
            </div>
            <div className="text-white font-bold text-xl mb-2">
              {currentRuns}/{currentWickets} ({currentBall}/6)
            </div>
            <div className="text-gray-400 text-sm">
              Balls remaining: {ballsRemaining} | Wickets remaining: {wicketsRemaining}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[0, 1, 2, 3, 4, 6].map((runs) => (
              <BallEntryButton
                key={runs}
                label={runs.toString()}
                onClick={() => handleBallClick(runs)}
                disabled={currentBall >= MAX_BALLS_PER_SUPER_OVER || currentWickets >= MAX_WICKETS_PER_SUPER_OVER}
                size="md"
              />
            ))}
            <BallEntryButton
              label="W"
              onClick={handleWicket}
              disabled={currentBall >= MAX_BALLS_PER_SUPER_OVER || currentWickets >= MAX_WICKETS_PER_SUPER_OVER}
              variant="wicket"
              size="md"
            />
          </div>
        </>
      )}
    </div>
  );
}

