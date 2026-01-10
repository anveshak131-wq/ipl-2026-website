import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
    // Create default state
    const defaultState: LiveScoreState = {
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
      // Don't include matchState here - it will be set in a useEffect
    };

    // If initialState is provided, merge it with defaults (defaults fill in missing properties)
    if (initialState) {
      return {
        ...defaultState,
        ...initialState,
        // Ensure team1 and team2 have all required properties
        team1: {
          ...defaultState.team1,
          ...(initialState.team1 || {}),
        },
        team2: {
          ...defaultState.team2,
          ...(initialState.team2 || {}),
        },
        currentBatter: initialState.currentBatter ? { 
          ...initialState.currentBatter, 
          runs: initialState.currentBatter.runs ?? 0, 
          balls: initialState.currentBatter.balls ?? 0 
        } : defaultState.currentBatter,
        currentBowler: initialState.currentBowler ? { 
          ...initialState.currentBowler, 
          runs: initialState.currentBowler.runs ?? 0, 
          balls: initialState.currentBowler.balls ?? 0 
        } : defaultState.currentBowler,
        ballHistory: initialState.ballHistory || [],
      };
    }

    return defaultState;
  });

  const [undoStack, setUndoStack] = useState<LiveScoreState[]>([]);
  const stateRef = useRef(state);
  
  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync matchState into state
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      matchState,
    }));
  }, [matchState]);
  
  // Track free hit - check last ball in history
  const isFreeHit = useMemo(() => {
    if (!state?.ballHistory || state.ballHistory.length === 0) return false;
    const lastBall = state.ballHistory[state.ballHistory.length - 1];
    return lastBall.type === 'NB' || (typeof lastBall.type === 'string' && lastBall.type.startsWith('NB'));
  }, [state?.ballHistory]);

  // Auto-detect innings transitions
  useEffect(() => {
    if (!state?.team1 || !state?.team2) return; // Safety check
    
    const battingTeam = state.battingTeam;
    const wickets = battingTeam === 'team1' ? state.team1.wickets : state.team2.wickets;
    const overs = battingTeam === 'team1' ? (state.team1.balls || 0) / 6 : (state.team2.balls || 0) / 6;

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
  }, [state.innings, state.team1?.wickets, state.team2?.wickets, state.team1?.balls, state.team2?.balls, matchState, maxOvers, onMatchStateChange, state.battingTeam, state.team1?.runs, state.team2?.runs]);

  // Auto-transition to innings-1 when first ball is recorded
  useEffect(() => {
    if (!isTestPage && matchState && state.ballHistory && state.ballHistory.length > 0) {
      if (matchState.currentState !== 'innings-1' && matchState.currentState !== 'innings-2') {
        console.log(`Auto-transitioning to innings-1 due to ball entry`);
        const newMatchState = transitionState(matchState, 'innings-1', {
          battingTeam: matchState.innings1?.battingTeam || state.battingTeam || 'team1'
        });
        setMatchState(newMatchState);
        if (onMatchStateChange) {
          onMatchStateChange(newMatchState);
        }
      }
    }
  }, [state.ballHistory?.length, matchState, isTestPage, onMatchStateChange, state.battingTeam]);

  const recordBall = useCallback((ball: BallEvent) => {
    setState((prev) => {
      // ===== VALIDATION =====
      if (!prev || !prev.team1 || !prev.team2) {
        console.error('[recordBall] Invalid state:', prev);
        return prev;
      }

      const battingTeam = prev.battingTeam;
      if (battingTeam !== 'team1' && battingTeam !== 'team2') {
        console.error('[recordBall] Invalid batting team:', battingTeam);
        return prev;
      }

      const currentTeam = prev[battingTeam];
      if (!currentTeam || typeof currentTeam.balls !== 'number') {
        console.error('[recordBall] Invalid team:', currentTeam);
        return prev;
      }

      // ===== CALCULATE DELTAS =====
      let teamRunDelta = 0;
      let batterRunDelta = 0;
      let bowlerRunDelta = 0;
      let ballCountDelta = 0;
      let wicketDelta = 0;

      // Determine if legal delivery
      const illegalDeliveries = ['WD', 'NB', 'NB+1', 'NB+2', 'NB+3', 'NB+4', 'NB+6', 'WD+1', 'WD+2', 'WD+3', 'WD+4'];
      const isLegalDelivery = !illegalDeliveries.includes(ball.type as string);
      
      // Calculate runs
      if (typeof ball.type === 'number') {
        teamRunDelta = ball.type;
        batterRunDelta = ball.type;
        bowlerRunDelta = ball.type;
        ballCountDelta = 1;
      } else if (ball.type === 'W') {
        teamRunDelta = 0;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
        ballCountDelta = 1;
        wicketDelta = 1;
      } else if (ball.type === 'WD' || ball.type === 'NB') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 1;
        ballCountDelta = 0; // Illegal delivery
      } else if (ball.type === 'B' || ball.type === 'LB') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
        ballCountDelta = 1;
      } else if (ball.type.startsWith('NB+')) {
        const runs = parseInt(ball.type.substring(3));
        teamRunDelta = 1 + runs;
        batterRunDelta = runs;
        bowlerRunDelta = 1 + runs;
        ballCountDelta = 0;
      } else if (ball.type.startsWith('WD+')) {
        const runs = parseInt(ball.type.substring(3));
        teamRunDelta = 1 + runs;
        batterRunDelta = runs;
        bowlerRunDelta = 1 + runs;
        ballCountDelta = 0;
      } else if (ball.type.match(/^[0-9]B$/)) {
        const runs = parseInt(ball.type.substring(0, 1));
        teamRunDelta = runs;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
        ballCountDelta = 1;
      } else if (ball.type.match(/^[0-9]LB$/)) {
        const runs = parseInt(ball.type.substring(0, 1));
        teamRunDelta = runs;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
        ballCountDelta = 1;
      }

      // ===== UPDATE STATE =====
      const newBalls = currentTeam.balls + ballCountDelta;
      const newRuns = Math.max(0, currentTeam.runs + teamRunDelta);
      const newWickets = Math.min(currentTeam.wickets + wicketDelta, 10);
      const newOvers = ballsToOvers(newBalls);

      console.log('[recordBall] Updating:', {
        ballType: ball.type,
        team: battingTeam,
        oldBalls: currentTeam.balls,
        newBalls: newBalls,
        oldRuns: currentTeam.runs,
        newRuns: newRuns,
        runsDelta: teamRunDelta,
      });

      // Create new state
      const newState = {
        ...prev,
        [battingTeam]: {
          ...currentTeam,
          runs: newRuns,
          wickets: newWickets,
          balls: newBalls,
        },
        currentOver: newOvers,
        currentBatter: {
          ...prev.currentBatter,
          runs: Math.max(0, prev.currentBatter.runs + batterRunDelta),
          balls: prev.currentBatter.balls + ballCountDelta,
        },
        currentBowler: {
          ...prev.currentBowler,
          runs: Math.max(0, prev.currentBowler.runs + bowlerRunDelta),
          balls: prev.currentBowler.balls + ballCountDelta,
        },
        ballHistory: [...(Array.isArray(prev.ballHistory) ? prev.ballHistory : []), ball],
      };

      // Save to undo stack
      setUndoStack((stack) => [...stack, { ...prev }].slice(-5));

      return newState;
    });
  }, []);

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
