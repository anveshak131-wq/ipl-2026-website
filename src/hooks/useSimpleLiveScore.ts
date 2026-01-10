import { useState, useCallback } from 'react';

export type BallEventType = number | 'W' | 'WD' | 'NB' | 'B' | 'LB';

export interface BallEvent {
  type: BallEventType;
  runs: number;
  timestamp: number;
}

export interface LiveScoreState {
  team1: {
    name: string;
    runs: number;
    wickets: number;
    balls: number;
  };
  team2: {
    name: string;
    runs: number;
    wickets: number;
    balls: number;
  };
  currentBatter: {
    name: string;
    runs: number;
    balls: number;
  };
  currentBowler: {
    name: string;
    runs: number;
    balls: number;
  };
  battingTeam: 'team1' | 'team2';
  ballHistory: BallEvent[];
}

interface UseSimpleLiveScoreProps {
  team1Name: string;
  team2Name: string;
}

export function useSimpleLiveScore({ team1Name, team2Name }: UseSimpleLiveScoreProps) {
  const [state, setState] = useState<LiveScoreState>({
    team1: { name: team1Name, runs: 0, wickets: 0, balls: 0 },
    team2: { name: team2Name, runs: 0, wickets: 0, balls: 0 },
    currentBatter: { name: 'Select Batter', runs: 0, balls: 0 },
    currentBowler: { name: 'Select Bowler', runs: 0, balls: 0 },
    battingTeam: 'team1',
    ballHistory: [],
  });

  const recordBall = useCallback((ballType: BallEventType) => {
    setState((prev) => {
      const batting = prev.battingTeam;
      const team = prev[batting];
      
      // Calculate runs and balls
      let runsDelta = 0;
      let ballsDelta = 1;
      let wicketsDelta = 0;

      if (typeof ballType === 'number') {
        // Regular runs
        runsDelta = ballType;
        ballsDelta = 1;
      } else if (ballType === 'W') {
        // Wicket
        wicketsDelta = 1;
        ballsDelta = 1;
      } else if (ballType === 'WD' || ballType === 'NB') {
        // Wide or no-ball
        runsDelta = 1;
        ballsDelta = 0;
      } else if (ballType === 'B' || ballType === 'LB') {
        // Bye or leg-bye
        runsDelta = 1;
        ballsDelta = 1;
      }

      console.log('[Simple recordBall]', {
        ballType,
        batting,
        oldBalls: team.balls,
        newBalls: team.balls + ballsDelta,
        oldRuns: team.runs,
        newRuns: team.runs + runsDelta,
      });

      // Create new state
      const newState = {
        ...prev,
        [batting]: {
          ...team,
          runs: team.runs + runsDelta,
          wickets: team.wickets + wicketsDelta,
          balls: team.balls + ballsDelta,
        },
        currentBatter: {
          ...prev.currentBatter,
          runs: prev.currentBatter.runs + (typeof ballType === 'number' ? ballType : 0),
          balls: prev.currentBatter.balls + ballsDelta,
        },
        currentBowler: {
          ...prev.currentBowler,
          runs: prev.currentBowler.runs + runsDelta,
          balls: prev.currentBowler.balls + ballsDelta,
        },
        ballHistory: [
          ...prev.ballHistory,
          {
            type: ballType,
            runs: runsDelta,
            timestamp: Date.now(),
          },
        ],
      };

      console.log('[Simple recordBall] New state:', newState);
      return newState;
    });
  }, []);

  const changeBatter = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      currentBatter: { name, runs: 0, balls: 0 },
    }));
  }, []);

  const changeBowler = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      currentBowler: { name, runs: 0, balls: 0 },
    }));
  }, []);

  const switchBattingTeam = useCallback(() => {
    setState((prev) => ({
      ...prev,
      battingTeam: prev.battingTeam === 'team1' ? 'team2' : 'team1',
    }));
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.ballHistory.length === 0) return prev;
      
      const lastBall = prev.ballHistory[prev.ballHistory.length - 1];
      const batting = prev.battingTeam;
      const team = prev[batting];

      let runsDelta = 0;
      let ballsDelta = 1;
      let wicketsDelta = 0;

      if (typeof lastBall.type === 'number') {
        runsDelta = lastBall.type;
        ballsDelta = 1;
      } else if (lastBall.type === 'W') {
        wicketsDelta = 1;
        ballsDelta = 1;
      } else if (lastBall.type === 'WD' || lastBall.type === 'NB') {
        runsDelta = 1;
        ballsDelta = 0;
      } else if (lastBall.type === 'B' || lastBall.type === 'LB') {
        runsDelta = 1;
        ballsDelta = 1;
      }

      return {
        ...prev,
        [batting]: {
          ...team,
          runs: Math.max(0, team.runs - runsDelta),
          wickets: Math.max(0, team.wickets - wicketsDelta),
          balls: Math.max(0, team.balls - ballsDelta),
        },
        ballHistory: prev.ballHistory.slice(0, -1),
      };
    });
  }, []);

  return {
    state,
    recordBall,
    changeBatter,
    changeBowler,
    switchBattingTeam,
    undo,
  };
}
