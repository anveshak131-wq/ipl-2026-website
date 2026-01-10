import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  MatchState, 
  initializeMatchState, 
  shouldAutoTransitionInnings,
  transitionState
} from '@/lib/matchStateMachine';

export type BallEventType = 
  | number // Regular runs: 0, 1, 2, 3, 4, 6
  | 'W' // Wicket
  | 'WD' | 'NB' | 'B' | 'LB' // Basic extras
  | 'NB+1' | 'NB+2' | 'NB+3' | 'NB+4' | 'NB+6' // No ball + runs
  | 'WD+1' | 'WD+2' | 'WD+3' | 'WD+4' // Wide + runs
  | '1B' | '2B' | '3B' | '4B' // Multiple byes
  | '1LB' | '2LB' | '3LB' | '4LB'; // Multiple leg byes

export type DismissalType = 
  | 'bowled' 
  | 'caught' 
  | 'lbw' 
  | 'stumped' 
  | 'run out' 
  | 'hit wicket' 
  | 'obstructing field' 
  | 'handled ball' 
  | 'hit ball twice' 
  | 'timed out';

export interface BallEvent {
  type: BallEventType;
  runs: number;
  timestamp: number;
  dismissalType?: DismissalType;
  fielderName?: string;
}

export interface LiveScoreState {
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
  matchState?: MatchState; // Match state machine
  toss?: {
    winner: 'team1' | 'team2';
    decision: 'bat' | 'bowl';
  };
}

interface UseLiveScoreProps {
  initialTeam1Name: string;
  initialTeam2Name: string;
  initialBatter?: { id: string; name: string };
  initialBowler?: { id: string; name: string };
  initialMatchState?: MatchState;
  initialState?: LiveScoreState;
  maxOvers?: number;
  onMatchStateChange?: (matchState: MatchState) => void;
  isTestPage?: boolean; // For test pages, skip match state restrictions
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
  initialTeam1Name = '',
  initialTeam2Name = '',
  initialBatter,
  initialBowler,
  initialMatchState,
  initialState,
  maxOvers = 20,
  onMatchStateChange,
  isTestPage = false,
}: UseLiveScoreProps) {
  // For test pages, initialize directly to innings-1 state
  const getInitialMatchState = (): MatchState => {
    if (isTestPage) {
      return {
        currentState: 'innings-1',
        lockedStates: [],
        innings1: {
          battingTeam: 'team1',
          completed: false,
        },
      };
    }
    return initialMatchState || initializeMatchState();
  };

  const [matchState, setMatchState] = useState<MatchState>(getInitialMatchState());

  // Synchronize matchState with initialState when it contains persisted data (on page refresh)
  useEffect(() => {
    if (initialState && initialState.matchState) {
      // If initialState has a matchState, use it to restore the exact match state
      setMatchState(initialState.matchState);
    } else if (initialState && initialState.toss) {
      // If initialState has toss data but no explicit matchState, reconstruct it
      const tossState = transitionState(matchState, 'toss', {
        toss: initialState.toss,
      });
      
      // Auto-determine batting team for innings 1
      const battingTeam = initialState.toss.decision === 'bat' 
        ? initialState.toss.winner 
        : (initialState.toss.winner === 'team1' ? 'team2' : 'team1');
      
      const innings1State = transitionState(tossState, 'innings-1', {
        battingTeam,
      });
      
      setMatchState(innings1State);
    }
  }, [initialState?.matchState?.currentState, initialState?.toss]);

  // Determine initial batting team based on toss
  const getInitialBattingTeam = (): 'team1' | 'team2' => {
    if (initialState) return initialState.battingTeam;
    
    const toss = initialMatchState?.toss;
    if (toss) {
      if (toss.winner === 'team1') {
        return toss.decision === 'bat' ? 'team1' : 'team2';
      } else {
        return toss.decision === 'bat' ? 'team2' : 'team1';
      }
    }
    return 'team1'; // Default
  };

  const [state, setState] = useState<LiveScoreState>(() => {
    if (initialState) {
      return {
        ...initialState,
        matchState: matchState, // Ensure matchState is synced
      };
    }

    return {
      innings: 1,
      battingTeam: getInitialBattingTeam(),
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
      matchState,
    };
  });

  const [undoStack, setUndoStack] = useState<LiveScoreState[]>([]);
  
  // Track free hit - check last ball in history
  const isFreeHit = useMemo(() => {
    if (!state?.ballHistory || state.ballHistory.length === 0) return false;
    const lastBall = state.ballHistory[state.ballHistory.length - 1];
    return lastBall.type === 'NB' || (typeof lastBall.type === 'string' && lastBall.type.startsWith('NB'));
  }, [state?.ballHistory]);

  // Auto-detect innings transitions
  useEffect(() => {
    const battingTeam = state.battingTeam;
    const wickets = battingTeam === 'team1' ? state.team1.wickets : state.team2.wickets;
    const overs = battingTeam === 'team1' ? state.team1.balls / 6 : state.team2.balls / 6;

    if (shouldAutoTransitionInnings(matchState, state.innings, wickets, overs, maxOvers)) {
      // Auto-transition to break or complete
      if (state.innings === 1 && matchState.currentState === 'innings-1') {
        const target = battingTeam === 'team1' ? state.team1.runs : state.team2.runs;
        const newMatchState = transitionState(matchState, 'break', { target: target + 1 });
        setMatchState(newMatchState);
        if (onMatchStateChange) {
          onMatchStateChange(newMatchState);
        }
      } else if (state.innings === 2 && matchState.currentState === 'innings-2') {
        const newMatchState = transitionState(matchState, 'complete');
        setMatchState(newMatchState);
        if (onMatchStateChange) {
          onMatchStateChange(newMatchState);
        }
      }
    }
  }, [state.innings, state.team1.wickets, state.team2.wickets, state.team1.balls, state.team2.balls, matchState, maxOvers, onMatchStateChange, state.battingTeam, state.team1.runs, state.team2.runs]);

  const recordBall = useCallback((ball: BallEvent) => {
    // Skip match state check for test pages
    if (!isTestPage) {
      // Check if current state allows ball entry
      if (matchState.currentState !== 'innings-1' && matchState.currentState !== 'innings-2') {
        alert(`Cannot record balls in ${matchState.currentState} state. Please transition to an innings state first.`);
        return;
      }
    }

    setState((prev) => {
      // Save current state for undo (keep last 5)
      setUndoStack((stack) => {
        const newStack = [...stack, { ...prev }];
        return newStack.slice(-5);
      });

      const battingKey = prev.battingTeam;
      const team = prev[battingKey];
      
      // Check if innings is complete (20 overs or 10 wickets) - T20 format
      const currentBalls = team.balls; // team.balls is stored as integer (total balls)
      const maxBalls = maxOvers * 6; // 20 overs * 6 = 120 balls max
      
      // Prevent recording more balls if innings is complete
      if (currentBalls >= maxBalls || team.wickets >= 10) {
        if (!isTestPage) {
          alert(`Innings complete! ${team.wickets >= 10 ? 'All 10 wickets fallen' : `${maxOvers} overs completed`}`);
        }
        return prev;
      }
      
      // Calculate runs based on ball type
      let teamRunDelta = 0;
      let batterRunDelta = 0;
      let bowlerRunDelta = 0;

      // Regular runs (0, 1, 2, 3, 4, 6)
      if (typeof ball.type === 'number') {
        teamRunDelta = ball.type;
        batterRunDelta = ball.type;
        bowlerRunDelta = ball.type;
      }
      // No Ball + Runs
      else if (ball.type === 'NB+1') {
        teamRunDelta = 2; // 1 for no ball + 1 for run
        batterRunDelta = 1;
        bowlerRunDelta = 2;
      } else if (ball.type === 'NB+2') {
        teamRunDelta = 3;
        batterRunDelta = 2;
        bowlerRunDelta = 3;
      } else if (ball.type === 'NB+3') {
        teamRunDelta = 4;
        batterRunDelta = 3;
        bowlerRunDelta = 4;
      } else if (ball.type === 'NB+4') {
        teamRunDelta = 5;
        batterRunDelta = 4;
        bowlerRunDelta = 5;
      } else if (ball.type === 'NB+6') {
        teamRunDelta = 7;
        batterRunDelta = 6;
        bowlerRunDelta = 7;
      }
      // Wide + Runs
      else if (ball.type === 'WD+1') {
        teamRunDelta = 2; // 1 for wide + 1 for run
        batterRunDelta = 1;
        bowlerRunDelta = 2;
      } else if (ball.type === 'WD+2') {
        teamRunDelta = 3;
        batterRunDelta = 2;
        bowlerRunDelta = 3;
      } else if (ball.type === 'WD+3') {
        teamRunDelta = 4;
        batterRunDelta = 3;
        bowlerRunDelta = 4;
      } else if (ball.type === 'WD+4') {
        teamRunDelta = 5;
        batterRunDelta = 4;
        bowlerRunDelta = 5;
      }
      // Multiple Byes
      else if (ball.type === '1B') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      } else if (ball.type === '2B') {
        teamRunDelta = 2;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      } else if (ball.type === '3B') {
        teamRunDelta = 3;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      } else if (ball.type === '4B') {
        teamRunDelta = 4;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      }
      // Multiple Leg Byes
      else if (ball.type === '1LB') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      } else if (ball.type === '2LB') {
        teamRunDelta = 2;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      } else if (ball.type === '3LB') {
        teamRunDelta = 3;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      } else if (ball.type === '4LB') {
        teamRunDelta = 4;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      }
      // Basic extras
      else if (ball.type === 'WD') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 1;
      } else if (ball.type === 'NB') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 1;
      } else if (ball.type === 'B') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      } else if (ball.type === 'LB') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      }
      // Wicket
      else if (ball.type === 'W') {
        teamRunDelta = 0;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
      }

      // Determine if legal delivery (illegal deliveries don't count as balls)
      const illegalDeliveries = ['WD', 'NB', 'NB+1', 'NB+2', 'NB+3', 'NB+4', 'NB+6', 'WD+1', 'WD+2', 'WD+3', 'WD+4'];
      const isLegalDelivery = !illegalDeliveries.includes(ball.type as string);
      const isWicket = ball.type === 'W';
      
      // Validate ball type
      const validBallTypes = ['W', 'WD', 'NB', 'B', 'LB', '1B', '2B', '3B', '4B', '1LB', '2LB', '3LB', '4LB',
        'NB+1', 'NB+2', 'NB+3', 'NB+4', 'NB+6', 'WD+1', 'WD+2', 'WD+3', 'WD+4', 0, 1, 2, 3, 4, 6];
      if (!validBallTypes.includes(ball.type as any)) {
        console.warn(`Invalid ball type: ${ball.type}`);
        return prev;
      }

      // Set free hit flag if no ball was bowled
      // Note: We'll handle this in a useEffect to avoid stale state

      // Update team stats
      // team.balls is stored as integer (total number of balls), not as overs
      const newTeamBalls = isLegalDelivery ? team.balls + 1 : team.balls;
      const newTeamOvers = ballsToOvers(newTeamBalls);
      const newTeamRuns = Math.max(0, team.runs + teamRunDelta); // Prevent negative runs
      const newTeamWickets = Math.min(isWicket ? team.wickets + 1 : team.wickets, 10); // Max 10 wickets
      
      // Cap overs at maxOvers (20 for T20) - maxBalls already calculated above
      const cappedBalls = Math.min(newTeamBalls, maxBalls);
      const cappedOvers = ballsToOvers(cappedBalls);

      // Update batter stats
      const batterBallDelta = isLegalDelivery ? 1 : 0;
      const newBatterRuns = Math.max(0, prev.currentBatter.runs + batterRunDelta); // Prevent negative runs
      const newBatterBalls = prev.currentBatter.balls + batterBallDelta;

      // Update bowler stats
      const bowlerBallDelta = isLegalDelivery ? 1 : 0;
      const newBowlerRuns = Math.max(0, prev.currentBowler.runs + bowlerRunDelta); // Prevent negative runs
      const newBowlerBalls = prev.currentBowler.balls + bowlerBallDelta;

      return {
        ...prev,
        [battingKey]: {
          ...team,
          runs: newTeamRuns,
          wickets: newTeamWickets,
          balls: cappedBalls, // Store as integer (total balls)
        },
        currentOver: cappedOvers, // Display as decimal (overs.balls)
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
        ballHistory: [...(Array.isArray(prev.ballHistory) ? prev.ballHistory : []), ball].slice(-100), // Keep last 100, ensure it's an array
        matchState,
      };
    });
  }, [matchState]);

  const recordWicket = useCallback((dismissalType: string, fielderName?: string) => {
    recordBall({
      type: 'W',
      runs: 0,
      timestamp: Date.now(),
      dismissalType: dismissalType as DismissalType,
      fielderName,
    });
  }, [recordBall]);

  const undo = useCallback(() => {
    if (!undoStack || undoStack.length === 0) return false;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setState(previousState);
    return true;
  }, [undoStack]);

  const changeBatter = useCallback((batter: { id: string; name: string }) => {
    // Validate input
    if (!batter || !batter.id || !batter.name) {
      console.warn('Invalid batter data');
      return;
    }
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
    // Validate input
    if (!bowler || !bowler.id || !bowler.name) {
      console.warn('Invalid bowler data');
      return;
    }
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

  const canUndo = useMemo(() => (undoStack?.length || 0) > 0, [undoStack?.length]);

  const updateMatchState = useCallback((newMatchState: MatchState) => {
    setMatchState(newMatchState);
    setState((prev) => ({ ...prev, matchState: newMatchState }));
    if (onMatchStateChange) {
      onMatchStateChange(newMatchState);
    }
  }, [onMatchStateChange]);

  return {
    state,
    matchState,
    recordBall,
    recordWicket,
    undo,
    canUndo,
    changeBatter,
    changeBowler,
    switchInnings,
    updateMatchState,
    isFreeHit,
  };
}
