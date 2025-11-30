import { useState, useCallback, useMemo } from 'react';

export interface BallEvent {
  type: number | 'W' | 'WD' | 'NB' | 'B' | 'LB';
  runs: number;
  timestamp: number;
  dismissalType?: string;
  fielderName?: string;
}

export interface MatchState {
  innings: 1 | 2;
  battingTeam: 'team1' | 'team2';
  currentOver: number;
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
    id: string; 
    name: string; 
    runs: number; 
    balls: number;
  };
  currentBowler: { 
    id: string; 
    name: string; 
    runs: number; 
    balls: number;
  };
  ballHistory: BallEvent[];
}

interface UseLiveScoreProps {
  initialTeam1Name: string;
  initialTeam2Name: string;
  initialBatter?: { id: string; name: string };
  initialBowler?: { id: string; name: string };
}

// Helper functions
const ballsToOvers = (balls: number): number => {
  const whole = Math.floor(balls / 6);
  const rem = balls % 6;
  return parseFloat(`${whole}.${rem}`);
};

const oversToBalls = (overs: number): number => {
  const whole = Math.floor(overs);
  const fraction = Math.round((overs - whole) * 10);
  return whole * 6 + fraction;
};

export function useLiveScore({
  initialTeam1Name,
  initialTeam2Name,
  initialBatter,
  initialBowler
}: UseLiveScoreProps) {
  const [state, setState] = useState<MatchState>({
    innings: 1,
    battingTeam: 'team1',
    currentOver: 0.0,
    team1: {
      name: initialTeam1Name,
      runs: 0,
      wickets: 0,
      balls: 0,
    },
    team2: {
      name: initialTeam2Name,
      runs: 0,
      wickets: 0,
      balls: 0,
    },
    currentBatter: initialBatter ? { ...initialBatter, runs: 0, balls: 0 } : { id: '', name: 'Select Batter', runs: 0, balls: 0 },
    currentBowler: initialBowler ? { ...initialBowler, runs: 0, balls: 0 } : { id: '', name: 'Select Bowler', runs: 0, balls: 0 },
    ballHistory: [],
  });

  const [undoStack, setUndoStack] = useState<MatchState[]>([]);

  const recordBall = useCallback((ball: BallEvent) => {
    setState((prev) => {
      // Save current state for undo (keep last 5)
      setUndoStack((stack) => {
        const newStack = [...stack, { ...prev }];
        return newStack.slice(-5);
      });

      const battingKey = prev.battingTeam;
      const team = prev[battingKey];
      
      // Calculate runs
      let teamRunDelta = 0;
      let batterRunDelta = 0;
      let bowlerRunDelta = 0;

      if (typeof ball.type === 'number') {
        teamRunDelta = ball.type;
        batterRunDelta = ball.type;
        bowlerRunDelta = ball.type;
      } else if (ball.type === 'WD') {
        teamRunDelta = 1;
        batterRunDelta = 0; // Wides don't count as batter runs
        bowlerRunDelta = 1;
      } else if (ball.type === 'NB') {
        teamRunDelta = 1;
        batterRunDelta = 0; // No-balls don't count as batter runs (unless runs scored)
        bowlerRunDelta = 1;
      } else if (ball.type === 'B' || ball.type === 'LB') {
        teamRunDelta = 1;
        batterRunDelta = 0; // Byes/leg-byes don't count against bowler or batter
        bowlerRunDelta = 0; // Byes/leg-byes don't count against bowler
      } else if (ball.type === 'W') {
        teamRunDelta = 0;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      }

      // Determine if legal delivery
      const isLegalDelivery = !['WD', 'NB'].includes(ball.type as string);
      const isWicket = ball.type === 'W';

      // Update team stats
      const currentBalls = oversToBalls(team.balls);
      const newTeamBalls = isLegalDelivery ? currentBalls + 1 : currentBalls;
      const newTeamOvers = ballsToOvers(newTeamBalls);
      const newTeamRuns = team.runs + teamRunDelta;
      const newTeamWickets = isWicket ? team.wickets + 1 : team.wickets;

      // Update batter stats
      const batterBallDelta = isLegalDelivery ? 1 : 0;
      const newBatterRuns = prev.currentBatter.runs + batterRunDelta;
      const newBatterBalls = prev.currentBatter.balls + batterBallDelta;

      // Update bowler stats
      const bowlerBallDelta = isLegalDelivery ? 1 : 0;
      const newBowlerRuns = prev.currentBowler.runs + bowlerRunDelta;
      const newBowlerBalls = prev.currentBowler.balls + bowlerBallDelta;

      return {
        ...prev,
        [battingKey]: {
          ...team,
          runs: newTeamRuns,
          wickets: newTeamWickets,
          balls: newTeamBalls,
        },
        currentOver: newTeamOvers,
        currentBatter: {
          ...prev.currentBatter,
          runs: newBatterRuns,
          balls: newBatterBalls,
        },
        currentBowler: {
          ...prev.currentBowler,
          runs: newBowlerRuns,
          balls: newBowlerBalls,
        },
        ballHistory: [...prev.ballHistory, ball].slice(-100), // Keep last 100
      };
    });
  }, []);

  const recordWicket = useCallback((dismissalType: string, fielderName?: string) => {
    recordBall({
      type: 'W',
      runs: 0,
      timestamp: Date.now(),
      dismissalType,
      fielderName,
    });
  }, [recordBall]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return false;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setState(previousState);
    return true;
  }, [undoStack]);

  const changeBatter = useCallback((batter: { id: string; name: string }) => {
    setState((prev) => ({
      ...prev,
      currentBatter: {
        ...batter,
        runs: 0,
        balls: 0,
      },
    }));
  }, []);

  const changeBowler = useCallback((bowler: { id: string; name: string }) => {
    setState((prev) => ({
      ...prev,
      currentBowler: {
        ...bowler,
        runs: 0,
        balls: 0,
      },
    }));
  }, []);

  const switchInnings = useCallback(() => {
    setState((prev) => ({
      ...prev,
      innings: (prev.innings === 1 ? 2 : 1) as 1 | 2,
      battingTeam: prev.battingTeam === 'team1' ? 'team2' : 'team1',
      currentBatter: {
        ...prev.currentBatter,
        runs: 0,
        balls: 0,
      },
      currentBowler: {
        ...prev.currentBowler,
        runs: 0,
        balls: 0,
      },
    }));
  }, []);

  const canUndo = useMemo(() => undoStack.length > 0, [undoStack.length]);

  return {
    state,
    recordBall,
    recordWicket,
    undo,
    canUndo,
    changeBatter,
    changeBowler,
    switchInnings,
  };
}

