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
  bowledBy?: string;
  strikerId?: string;
  nonStrikerId?: string;
  commentary?: string; // AI-enhanced or custom commentary
  isEdited?: boolean; // Track if ball was edited
}

// Enhanced Batter State
export interface BatterState {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOnStrike: boolean;
  howOut?: string;
  bowlerName?: string;
  fielderName?: string;
}

// Enhanced Bowler State
export interface BowlerState {
  id: string;
  name: string;
  overs: number;
  balls: number;  // balls in current over (0-5)
  totalBalls: number;
  maidens: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
  economyRate: number;
  dotBalls: number;
}

// Extras breakdown
export interface ExtrasState {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalties: number;
  total: number;
}

// Partnership tracking
export interface Partnership {
  batter1: { id: string; name: string; runs: number; balls: number };
  batter2: { id: string; name: string; runs: number; balls: number };
  totalRuns: number;
  totalBalls: number;
  runRate: number;
  isCurrentPartnership: boolean;
}

// Fall of wickets
export interface FallOfWicket {
  wicketNumber: number;
  runs: number;
  overs: number;
  batterName: string;
  batterId: string;
  howOut: string;
  bowlerName?: string;
  partnershipRuns: number;
  partnershipBalls: number;
}

// Over summary
export interface OverSummary {
  overNumber: number;
  bowlerId: string;
  bowlerName: string;
  balls: string[];
  runs: number;
  wickets: number;
  isMaiden: boolean;
}

export interface LiveScoreState {
  innings: 1 | 2;
  battingTeam: 'team1' | 'team2';
  currentOver: number;
  
  // Team Scores
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
  
  // Dual Batter System
  striker: BatterState;
  nonStriker: BatterState;
  yetToBat: string[];
  outBatters: BatterState[];
  
  // Backward compatibility - maps to striker
  currentBatter: { 
    id: string; 
    name: string; 
    runs: number; 
    balls: number;
  };
  
  // Bowling
  currentBowler: BowlerState;
  previousBowler: BowlerState | null;
  allBowlers: BowlerState[];
  
  // Over tracking
  currentOverBalls: string[];
  overHistory: OverSummary[];
  
  // Extras
  extras: ExtrasState;
  
  // Partnerships
  currentPartnership: Partnership;
  partnerships: Partnership[];
  
  // Fall of wickets
  fallOfWickets: FallOfWicket[];
  
  // Run rates
  runRate: number;
  requiredRunRate: number | null;
  projectedScore: number;
  
  // Ball history
  ballHistory: BallEvent[];
  matchState?: MatchState;
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
  initialNonStriker?: { id: string; name: string };
  initialMatchState?: MatchState;
  initialState?: LiveScoreState;
  maxOvers?: number;
  onMatchStateChange?: (matchState: MatchState) => void;
  isTestPage?: boolean; // For test pages, skip match state restrictions
  target?: number; // Target for 2nd innings
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

const calculateStrikeRate = (runs: number, balls: number): number => {
  if (balls === 0) return 0;
  return Math.round((runs / balls) * 100 * 100) / 100;
};

const calculateEconomyRate = (runs: number, balls: number): number => {
  if (balls === 0) return 0;
  return Math.round((runs / (balls / 6)) * 100) / 100;
};

const createEmptyBatter = (id = '', name = 'Select Batter', isOnStrike = false): BatterState => ({
  id,
  name,
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  strikeRate: 0,
  isOnStrike,
});

const createEmptyBowler = (id = '', name = 'Select Bowler'): BowlerState => ({
  id,
  name,
  overs: 0,
  balls: 0,
  totalBalls: 0,
  maidens: 0,
  runs: 0,
  wickets: 0,
  wides: 0,
  noBalls: 0,
  economyRate: 0,
  dotBalls: 0,
});

const createEmptyExtras = (): ExtrasState => ({
  wides: 0,
  noBalls: 0,
  byes: 0,
  legByes: 0,
  penalties: 0,
  total: 0,
});

const createEmptyPartnership = (batter1: BatterState, batter2: BatterState): Partnership => ({
  batter1: { id: batter1.id, name: batter1.name, runs: 0, balls: 0 },
  batter2: { id: batter2.id, name: batter2.name, runs: 0, balls: 0 },
  totalRuns: 0,
  totalBalls: 0,
  runRate: 0,
  isCurrentPartnership: true,
});

// Check if runs require strike rotation (1, 3, 5 = swap)
const shouldSwapStrike = (runs: number): boolean => {
  return runs === 1 || runs === 3 || runs === 5;
};

export function useLiveScore({
  initialTeam1Name = '',
  initialTeam2Name = '',
  initialBatter,
  initialBowler,
  initialNonStriker,
  initialMatchState,
  initialState,
  maxOvers = 20,
  onMatchStateChange,
  isTestPage = false,
  target,
}: UseLiveScoreProps) {
  // For test pages, initialize directly to innings-1 state
  const getInitialMatchState = (): MatchState => {
    // First priority: restore from persisted state (localStorage)
    if (initialState?.matchState) {
      console.log('[useLiveScore] Restoring matchState from initialState:', initialState.matchState.currentState);
      return initialState.matchState;
    }
    
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

  // Determine initial batting team based on toss/matchState (ALWAYS calculate, don't trust stored battingTeam)
  const getInitialBattingTeam = (): 'team1' | 'team2' => {
    // Priority 1: Check matchState.innings1.battingTeam (most authoritative for innings 1)
    if (initialState?.matchState?.innings1?.battingTeam) {
      console.log('[getInitialBattingTeam] Using matchState.innings1.battingTeam:', initialState.matchState.innings1.battingTeam);
      return initialState.matchState.innings1.battingTeam;
    }
    
    // Priority 2: Calculate from toss data
    const toss = initialState?.toss || initialState?.matchState?.toss || initialMatchState?.toss;
    if (toss && toss.winner && toss.decision) {
      const calculated = toss.winner === 'team1'
        ? (toss.decision === 'bat' ? 'team1' : 'team2')
        : (toss.decision === 'bat' ? 'team2' : 'team1');
      console.log('[getInitialBattingTeam] Calculated from toss:', calculated, 'winner:', toss.winner, 'decision:', toss.decision);
      return calculated;
    }
    
    // Priority 3: Fallback to stored battingTeam
    if (initialState?.battingTeam) {
      console.log('[getInitialBattingTeam] Fallback to stored battingTeam:', initialState.battingTeam);
      return initialState.battingTeam;
    }
    
    console.log('[getInitialBattingTeam] Using default: team1');
    return 'team1'; // Default
  };

  const [state, setState] = useState<LiveScoreState>(() => {
    // Calculate correct batting team FIRST
    const correctBattingTeam = getInitialBattingTeam();
    
    // Create initial batters and bowlers
    const initialStriker = initialBatter 
      ? createEmptyBatter(initialBatter.id, initialBatter.name, true)
      : createEmptyBatter('', 'Select Striker', true);
    
    const initialNonStrikerBatter = initialNonStriker
      ? createEmptyBatter(initialNonStriker.id, initialNonStriker.name, false)
      : createEmptyBatter('', 'Select Non-Striker', false);
    
    const initialBowlerState = initialBowler
      ? createEmptyBowler(initialBowler.id, initialBowler.name)
      : createEmptyBowler();

    // Create default state
    const defaultState: LiveScoreState = {
      innings: 1,
      battingTeam: correctBattingTeam,
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
      // Dual batter system
      striker: initialStriker,
      nonStriker: initialNonStrikerBatter,
      yetToBat: [],
      outBatters: [],
      // Backward compatibility
      currentBatter: { 
        id: initialStriker.id, 
        name: initialStriker.name, 
        runs: 0, 
        balls: 0 
      },
      // Bowling
      currentBowler: initialBowlerState,
      previousBowler: null,
      allBowlers: initialBowler ? [initialBowlerState] : [],
      // Over tracking
      currentOverBalls: [],
      overHistory: [],
      // Extras
      extras: createEmptyExtras(),
      // Partnerships
      currentPartnership: createEmptyPartnership(initialStriker, initialNonStrikerBatter),
      partnerships: [],
      // FOW
      fallOfWickets: [],
      // Run rates
      runRate: 0,
      requiredRunRate: null,
      projectedScore: 0,
      // History
      ballHistory: [],
    };

    // If initialState is provided, merge it with defaults
    if (initialState) {
      // IMPORTANT: Always use calculated battingTeam, not the stored one
      const mergedState = {
        ...defaultState,
        ...initialState,
        battingTeam: correctBattingTeam, // Override with calculated value
        team1: {
          ...defaultState.team1,
          ...(initialState.team1 || {}),
        },
        team2: {
          ...defaultState.team2,
          ...(initialState.team2 || {}),
        },
        striker: initialState.striker || defaultState.striker,
        nonStriker: initialState.nonStriker || defaultState.nonStriker,
        currentBatter: initialState.currentBatter || defaultState.currentBatter,
        currentBowler: initialState.currentBowler || defaultState.currentBowler,
        extras: initialState.extras || defaultState.extras,
        currentPartnership: initialState.currentPartnership || defaultState.currentPartnership,
        fallOfWickets: initialState.fallOfWickets || [],
        partnerships: initialState.partnerships || [],
        overHistory: initialState.overHistory || [],
        allBowlers: initialState.allBowlers || [],
        ballHistory: initialState.ballHistory || [],
      };
      
      console.log('[useLiveScore] Initial state created, battingTeam:', mergedState.battingTeam, 'team1:', mergedState.team1?.name, 'team2:', mergedState.team2?.name);
      return mergedState;
    }

    return defaultState;
  });

  const [undoStack, setUndoStack] = useState<LiveScoreState[]>([]);
  const stateRef = useRef(state);
  
  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync matchState into state and update battingTeam from matchState
  useEffect(() => {
    setState((prev) => {
      // Determine batting team from matchState
      let battingTeam = prev.battingTeam;
      
      // For innings 1, use innings1.battingTeam from matchState
      if (matchState?.innings1?.battingTeam && prev.innings === 1) {
        battingTeam = matchState.innings1.battingTeam;
      }
      // For innings 2, use innings2.battingTeam from matchState
      else if (matchState?.innings2?.battingTeam && prev.innings === 2) {
        battingTeam = matchState.innings2.battingTeam;
      }
      // Fallback: calculate from toss if available
      else if (matchState?.toss?.winner && matchState?.toss?.decision) {
        const tossWinner = matchState.toss.winner;
        const tossDecision = matchState.toss.decision;
        if (prev.innings === 1) {
          battingTeam = tossDecision === 'bat' ? tossWinner : (tossWinner === 'team1' ? 'team2' : 'team1');
        } else {
          // Innings 2 - opposite team bats
          const innings1BattingTeam = tossDecision === 'bat' ? tossWinner : (tossWinner === 'team1' ? 'team2' : 'team1');
          battingTeam = innings1BattingTeam === 'team1' ? 'team2' : 'team1';
        }
      }
      
      console.log('[useLiveScore] Syncing matchState, battingTeam:', battingTeam, 'innings:', prev.innings);
      
      return {
        ...prev,
        matchState,
        battingTeam,
      };
    });
  }, [matchState, matchState?.innings1?.battingTeam, matchState?.innings2?.battingTeam, matchState?.toss?.winner, matchState?.toss?.decision]);
  
  // Track free hit - check last ball in history
  const isFreeHit = useMemo(() => {
    if (!state?.ballHistory || state.ballHistory.length === 0) return false;
    const lastBall = state.ballHistory[state.ballHistory.length - 1];
    return lastBall.type === 'NB' || (typeof lastBall.type === 'string' && lastBall.type.startsWith('NB'));
  }, [state?.ballHistory]);

  // Calculate run rates
  useEffect(() => {
    const battingTeam = state.battingTeam;
    const currentTeam = state[battingTeam];
    const balls = currentTeam?.balls || 0;
    const runs = currentTeam?.runs || 0;
    
    if (balls > 0) {
      const rr = calculateEconomyRate(runs, balls);
      const projected = Math.round(rr * maxOvers);
      
      let rrr: number | null = null;
      if (state.innings === 2 && target) {
        const remainingRuns = target - runs;
        const remainingBalls = (maxOvers * 6) - balls;
        if (remainingBalls > 0) {
          rrr = calculateEconomyRate(remainingRuns, remainingBalls);
        }
      }
      
      setState(prev => ({
        ...prev,
        runRate: rr,
        requiredRunRate: rrr,
        projectedScore: projected,
      }));
    }
  }, [state.battingTeam, state.team1?.balls, state.team2?.balls, state.team1?.runs, state.team2?.runs, state.innings, target, maxOvers]);

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
    console.log('[useLiveScore.recordBall] Called with:', ball);
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
      let isFour = false;
      let isSix = false;
      let isWide = false;
      let isNoBall = false;
      let isBye = false;
      let isLegBye = false;
      let isDotBall = false;

      // Determine if legal delivery
      const illegalDeliveries = ['WD', 'NB', 'NB+1', 'NB+2', 'NB+3', 'NB+4', 'NB+6', 'WD+1', 'WD+2', 'WD+3', 'WD+4'];
      const isLegalDelivery = !illegalDeliveries.includes(ball.type as string);
      
      // Calculate runs based on ball type
      if (typeof ball.type === 'number') {
        teamRunDelta = ball.type;
        batterRunDelta = ball.type;
        bowlerRunDelta = ball.type;
        ballCountDelta = 1;
        isFour = ball.type === 4;
        isSix = ball.type === 6;
        isDotBall = ball.type === 0;
      } else if (ball.type === 'W') {
        teamRunDelta = 0;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
        ballCountDelta = 1;
        wicketDelta = 1;
      } else if (ball.type === 'WD') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 1;
        ballCountDelta = 0;
        isWide = true;
      } else if (ball.type === 'NB') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 1;
        ballCountDelta = 0;
        isNoBall = true;
      } else if (ball.type === 'B') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
        ballCountDelta = 1;
        isBye = true;
      } else if (ball.type === 'LB') {
        teamRunDelta = 1;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
        ballCountDelta = 1;
        isLegBye = true;
      } else if (typeof ball.type === 'string' && ball.type.startsWith('NB+')) {
        const runs = parseInt(ball.type.substring(3));
        teamRunDelta = 1 + runs;
        batterRunDelta = runs;
        bowlerRunDelta = 1 + runs;
        ballCountDelta = 0;
        isNoBall = true;
        isFour = runs === 4;
        isSix = runs === 6;
      } else if (typeof ball.type === 'string' && ball.type.startsWith('WD+')) {
        const runs = parseInt(ball.type.substring(3));
        teamRunDelta = 1 + runs;
        batterRunDelta = runs;
        bowlerRunDelta = 1 + runs;
        ballCountDelta = 0;
        isWide = true;
      } else if (typeof ball.type === 'string' && ball.type.match(/^[0-9]B$/)) {
        const runs = parseInt(ball.type.substring(0, 1));
        teamRunDelta = runs;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
        ballCountDelta = 1;
        isBye = true;
      } else if (typeof ball.type === 'string' && ball.type.match(/^[0-9]LB$/)) {
        const runs = parseInt(ball.type.substring(0, 1));
        teamRunDelta = runs;
        batterRunDelta = 0;
        bowlerRunDelta = 0;
        ballCountDelta = 1;
        isLegBye = true;
      }

      // ===== UPDATE TEAM STATE =====
      const newBalls = currentTeam.balls + ballCountDelta;
      const newRuns = Math.max(0, currentTeam.runs + teamRunDelta);
      const newWickets = Math.min(currentTeam.wickets + wicketDelta, 10);
      const newOvers = ballsToOvers(newBalls);

      // ===== UPDATE STRIKER STATS =====
      let newStriker = { ...prev.striker };
      let newNonStriker = { ...prev.nonStriker };
      
      newStriker.runs += batterRunDelta;
      newStriker.balls += ballCountDelta;
      if (isFour) newStriker.fours += 1;
      if (isSix) newStriker.sixes += 1;
      newStriker.strikeRate = calculateStrikeRate(newStriker.runs, newStriker.balls);

      // ===== UPDATE BOWLER STATS =====
      let newBowler: BowlerState = { 
        ...prev.currentBowler,
        runs: (prev.currentBowler.runs || 0) + bowlerRunDelta,
        totalBalls: (prev.currentBowler.totalBalls || 0) + ballCountDelta,
        balls: ((prev.currentBowler.balls || 0) + ballCountDelta) % 6,
        overs: prev.currentBowler.overs || 0,
        maidens: prev.currentBowler.maidens || 0,
        wides: prev.currentBowler.wides || 0,
        noBalls: prev.currentBowler.noBalls || 0,
        dotBalls: prev.currentBowler.dotBalls || 0,
        wickets: prev.currentBowler.wickets || 0,
        economyRate: prev.currentBowler.economyRate || 0,
      };
      
      if (ballCountDelta > 0 && newBowler.balls === 0 && newBowler.totalBalls > 0) {
        newBowler.overs += 1;
      }
      if (isWide) newBowler.wides += 1;
      if (isNoBall) newBowler.noBalls += 1;
      if (isDotBall) newBowler.dotBalls += 1;
      if (wicketDelta > 0) newBowler.wickets += 1;
      newBowler.economyRate = calculateEconomyRate(newBowler.runs, newBowler.totalBalls);

      // ===== UPDATE EXTRAS =====
      let newExtras = { ...(prev.extras || createEmptyExtras()) };
      if (isWide) newExtras.wides += teamRunDelta;
      if (isNoBall) newExtras.noBalls += 1;
      if (isBye) newExtras.byes += teamRunDelta;
      if (isLegBye) newExtras.legByes += teamRunDelta;
      newExtras.total = newExtras.wides + newExtras.noBalls + newExtras.byes + newExtras.legByes + newExtras.penalties;

      // ===== UPDATE CURRENT OVER BALLS DISPLAY =====
      let ballDisplay = '';
      if (wicketDelta > 0) ballDisplay = 'W';
      else if (isWide) ballDisplay = `WD${teamRunDelta > 1 ? '+' + (teamRunDelta - 1) : ''}`;
      else if (isNoBall) ballDisplay = `NB${teamRunDelta > 1 ? '+' + (teamRunDelta - 1) : ''}`;
      else if (isBye) ballDisplay = `${teamRunDelta}B`;
      else if (isLegBye) ballDisplay = `${teamRunDelta}LB`;
      else if (isFour) ballDisplay = '4';
      else if (isSix) ballDisplay = '6';
      else ballDisplay = String(batterRunDelta);

      let newCurrentOverBalls = [...(prev.currentOverBalls || []), ballDisplay];
      let newOverHistory = [...(prev.overHistory || [])];

      // ===== CHECK FOR END OF OVER =====
      const totalLegalBalls = newBalls;
      const isEndOfOver = isLegalDelivery && totalLegalBalls > 0 && totalLegalBalls % 6 === 0;
      
      if (isEndOfOver) {
        // Record over summary
        const overRuns = newCurrentOverBalls.reduce((sum, b) => {
          const num = parseInt(b.replace(/[^0-9]/g, '') || '0');
          return sum + (isNaN(num) ? 0 : num);
        }, 0);
        const overWickets = newCurrentOverBalls.filter(b => b === 'W').length;
        const isMaiden = overRuns === 0 && overWickets === 0;
        
        if (isMaiden) {
          newBowler.maidens += 1;
        }
        
        newOverHistory.push({
          overNumber: Math.floor(totalLegalBalls / 6),
          bowlerId: newBowler.id,
          bowlerName: newBowler.name,
          balls: newCurrentOverBalls,
          runs: overRuns,
          wickets: overWickets,
          isMaiden,
        });
        
        newCurrentOverBalls = [];
        
        // Swap batters at end of over (unless wicket fell on last ball)
        if (wicketDelta === 0) {
          const temp = newStriker;
          newStriker = { ...newNonStriker, isOnStrike: true };
          newNonStriker = { ...temp, isOnStrike: false };
        }
      }

      // ===== STRIKE ROTATION FOR ODD RUNS (1, 3, 5) =====
      if (wicketDelta === 0 && shouldSwapStrike(batterRunDelta) && !isEndOfOver) {
        const temp = newStriker;
        newStriker = { ...newNonStriker, isOnStrike: true };
        newNonStriker = { ...temp, isOnStrike: false };
      }

      // ===== UPDATE PARTNERSHIP =====
      let newPartnership = { ...(prev.currentPartnership || createEmptyPartnership(newStriker, newNonStriker)) };
      if (newStriker.id === newPartnership.batter1.id) {
        newPartnership.batter1.runs += batterRunDelta;
        newPartnership.batter1.balls += ballCountDelta;
      } else if (newStriker.id === newPartnership.batter2.id) {
        newPartnership.batter2.runs += batterRunDelta;
        newPartnership.batter2.balls += ballCountDelta;
      }
      newPartnership.totalRuns += teamRunDelta;
      newPartnership.totalBalls += ballCountDelta;
      newPartnership.runRate = calculateEconomyRate(newPartnership.totalRuns, newPartnership.totalBalls);

      // ===== HANDLE WICKET - RECORD FOW =====
      let newFOW = [...(prev.fallOfWickets || [])];
      let newOutBatters = [...(prev.outBatters || [])];
      let newPartnerships = [...(prev.partnerships || [])];
      
      if (wicketDelta > 0) {
        // Record fall of wicket
        newFOW.push({
          wicketNumber: newWickets,
          runs: newRuns,
          overs: newOvers,
          batterName: newStriker.name,
          batterId: newStriker.id,
          howOut: ball.dismissalType || 'unknown',
          bowlerName: prev.currentBowler.name,
          partnershipRuns: newPartnership.totalRuns,
          partnershipBalls: newPartnership.totalBalls,
        });
        
        // Save completed partnership
        newPartnership.isCurrentPartnership = false;
        newPartnerships.push(newPartnership);
        
        // Move striker to out batters
        newOutBatters.push({
          ...newStriker,
          howOut: ball.dismissalType,
          bowlerName: prev.currentBowler.name,
          fielderName: ball.fielderName,
        });
        
        // Reset striker for new batter selection
        newStriker = createEmptyBatter('', 'Select Batter', true);
        
        // Create new partnership (will be set when new batter is selected)
        newPartnership = createEmptyPartnership(newStriker, newNonStriker);
      }

      // ===== UPDATE ALL BOWLERS LIST =====
      let newAllBowlers = [...(prev.allBowlers || [])];
      const existingBowlerIndex = newAllBowlers.findIndex(b => b.id === newBowler.id);
      if (existingBowlerIndex >= 0) {
        newAllBowlers[existingBowlerIndex] = newBowler;
      } else if (newBowler.id) {
        newAllBowlers.push(newBowler);
      }

      // ===== CREATE NEW STATE =====
      const newState: LiveScoreState = {
        ...prev,
        [battingTeam]: {
          ...currentTeam,
          runs: newRuns,
          wickets: newWickets,
          balls: newBalls,
        },
        currentOver: newOvers,
        striker: newStriker,
        nonStriker: newNonStriker,
        outBatters: newOutBatters,
        // Backward compatibility
        currentBatter: {
          id: newStriker.id,
          name: newStriker.name,
          runs: newStriker.runs,
          balls: newStriker.balls,
        },
        currentBowler: newBowler,
        allBowlers: newAllBowlers,
        currentOverBalls: newCurrentOverBalls,
        overHistory: newOverHistory,
        extras: newExtras,
        currentPartnership: newPartnership,
        partnerships: newPartnerships,
        fallOfWickets: newFOW,
        ballHistory: [...(Array.isArray(prev.ballHistory) ? prev.ballHistory : []), {
          ...ball,
          strikerId: prev.striker?.id,
          nonStrikerId: prev.nonStriker?.id,
          bowledBy: prev.currentBowler?.id,
        }],
      };

      // Save to undo stack
      setUndoStack((stack) => [...stack, { ...prev }].slice(-10));

      console.log('[useLiveScore.recordBall] New state created');
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

  const changeBatter = useCallback((batter: { id: string; name: string }, position: 'striker' | 'nonStriker' = 'striker') => {
    // Validate input
    if (!batter || !batter.id || !batter.name) {
      console.warn('Invalid batter data');
      return;
    }
    
    setState((prev) => {
      const newBatter = createEmptyBatter(batter.id, batter.name, position === 'striker');
      
      if (position === 'striker') {
        // Update partnership with new batter
        const newPartnership = createEmptyPartnership(newBatter, prev.nonStriker);
        return {
          ...prev,
          striker: newBatter,
          currentBatter: { id: batter.id, name: batter.name, runs: 0, balls: 0 },
          currentPartnership: newPartnership,
          yetToBat: prev.yetToBat.filter(id => id !== batter.id),
        };
      } else {
        const newPartnership = createEmptyPartnership(prev.striker, newBatter);
        return {
          ...prev,
          nonStriker: newBatter,
          currentPartnership: newPartnership,
          yetToBat: prev.yetToBat.filter(id => id !== batter.id),
        };
      }
    });
  }, []);

  const changeBowler = useCallback((bowler: { id: string; name: string }) => {
    // Validate input
    if (!bowler || !bowler.id || !bowler.name) {
      console.warn('Invalid bowler data');
      return;
    }
    
    setState((prev) => {
      // Check if bowler already exists in allBowlers
      const existingBowler = (prev.allBowlers || []).find(b => b.id === bowler.id);
      const newBowler = existingBowler || createEmptyBowler(bowler.id, bowler.name);
      
      return {
        ...prev,
        previousBowler: prev.currentBowler?.id ? prev.currentBowler : null,
        currentBowler: newBowler,
        currentOverBalls: [], // Reset current over display for new bowler
      };
    });
  }, []);

  const swapBatters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      striker: { ...prev.nonStriker, isOnStrike: true },
      nonStriker: { ...prev.striker, isOnStrike: false },
      currentBatter: {
        id: prev.nonStriker.id,
        name: prev.nonStriker.name,
        runs: prev.nonStriker.runs,
        balls: prev.nonStriker.balls,
      },
    }));
  }, []);

  const switchInnings = useCallback(() => {
    setState((prev) => {
      const newStriker = createEmptyBatter('', 'Select Striker', true);
      const newNonStriker = createEmptyBatter('', 'Select Non-Striker', false);
      
      return {
        ...prev,
        innings: (prev.innings === 1 ? 2 : 1) as 1 | 2,
        battingTeam: prev.battingTeam === 'team1' ? 'team2' : 'team1',
        striker: newStriker,
        nonStriker: newNonStriker,
        outBatters: [],
        yetToBat: [],
        currentBatter: { id: '', name: 'Select Striker', runs: 0, balls: 0 },
        currentBowler: createEmptyBowler(),
        previousBowler: null,
        allBowlers: [],
        currentOverBalls: [],
        overHistory: [],
        extras: createEmptyExtras(),
        currentPartnership: createEmptyPartnership(newStriker, newNonStriker),
        partnerships: [],
        fallOfWickets: [],
        runRate: 0,
        requiredRunRate: null,
        projectedScore: 0,
      };
    });
  }, []);

  const canUndo = useMemo(() => (undoStack?.length || 0) > 0, [undoStack?.length]);

  const updateMatchState = useCallback((newMatchState: MatchState) => {
    setMatchState(newMatchState);
    
    // Sync battingTeam from matchState to live score state
    let newBattingTeam: 'team1' | 'team2' | undefined;
    if (newMatchState.currentState === 'innings-1' && newMatchState.innings1?.battingTeam) {
      newBattingTeam = newMatchState.innings1.battingTeam;
    } else if (newMatchState.currentState === 'innings-2' && newMatchState.innings2?.battingTeam) {
      newBattingTeam = newMatchState.innings2.battingTeam;
    } else if (newMatchState.toss) {
      // Derive from toss if innings not set
      newBattingTeam = newMatchState.toss.decision === 'bat' 
        ? newMatchState.toss.winner 
        : (newMatchState.toss.winner === 'team1' ? 'team2' : 'team1');
    }
    
    setState((prev) => ({ 
      ...prev, 
      matchState: newMatchState,
      // Update battingTeam if derived from matchState
      ...(newBattingTeam ? { battingTeam: newBattingTeam } : {}),
    }));
    
    if (onMatchStateChange) {
      onMatchStateChange(newMatchState);
    }
  }, [onMatchStateChange]);

  // Delete a specific ball from history by index
  const deleteBall = useCallback((index: number) => {
    setState((prev) => {
      if (!prev.ballHistory || index < 0 || index >= prev.ballHistory.length) {
        return prev;
      }
      
      const newHistory = [...prev.ballHistory];
      newHistory.splice(index, 1);
      
      // Note: This is a simple delete - for production, you'd want to
      // recalculate all stats from scratch based on remaining balls
      return {
        ...prev,
        ballHistory: newHistory,
      };
    });
  }, []);

  // Edit a specific ball's commentary
  const editBallCommentary = useCallback((index: number, commentary: string) => {
    setState((prev) => {
      if (!prev.ballHistory || index < 0 || index >= prev.ballHistory.length) {
        return prev;
      }
      
      const newHistory = [...prev.ballHistory];
      newHistory[index] = {
        ...newHistory[index],
        commentary,
        isEdited: true,
      };
      
      return {
        ...prev,
        ballHistory: newHistory,
      };
    });
  }, []);

  // Clear all ball history
  const clearAllBalls = useCallback(() => {
    setState((prev) => {
      const battingTeam = prev.battingTeam;
      const newStriker = createEmptyBatter(prev.striker?.id || '', prev.striker?.name || 'Select Striker', true);
      const newNonStriker = createEmptyBatter(prev.nonStriker?.id || '', prev.nonStriker?.name || 'Select Non-Striker', false);
      
      return {
        ...prev,
        [battingTeam]: {
          ...prev[battingTeam],
          runs: 0,
          wickets: 0,
          balls: 0,
        },
        currentOver: 0,
        striker: newStriker,
        nonStriker: newNonStriker,
        outBatters: [],
        currentBatter: { id: newStriker.id, name: newStriker.name, runs: 0, balls: 0 },
        currentBowler: createEmptyBowler(prev.currentBowler?.id || '', prev.currentBowler?.name || 'Select Bowler'),
        allBowlers: [],
        currentOverBalls: [],
        overHistory: [],
        extras: createEmptyExtras(),
        currentPartnership: createEmptyPartnership(newStriker, newNonStriker),
        partnerships: [],
        fallOfWickets: [],
        runRate: 0,
        requiredRunRate: null,
        projectedScore: 0,
        ballHistory: [],
      };
    });
  }, []);

  return {
    state,
    matchState,
    recordBall,
    recordWicket,
    undo,
    canUndo,
    changeBatter,
    changeBowler,
    swapBatters,
    switchInnings,
    updateMatchState,
    isFreeHit,
    deleteBall,
    editBallCommentary,
    clearAllBalls,
  };
}
