/**
 * Match State Machine
 * Manages match progression: Pre-Match → Toss → Innings 1 → Break → Innings 2 → Complete
 */

export type MatchStateType = 
  | 'pre-match'
  | 'toss'
  | 'innings-1'
  | 'strategic-timeout-1'
  | 'break'
  | 'innings-2'
  | 'strategic-timeout-2'
  | 'super-over'
  | 'complete';

export interface MatchState {
  currentState: MatchStateType;
  toss?: {
    winner: 'team1' | 'team2';
    decision: 'bat' | 'bowl';
    timestamp: number;
  };
  innings1?: {
    battingTeam: 'team1' | 'team2';
    target?: number; // Target set for innings 2
    completed: boolean;
    completedAt?: number;
  };
  innings2?: {
    battingTeam: 'team1' | 'team2';
    target: number; // Target to chase
    completed: boolean;
    completedAt?: number;
  };
  superOver?: {
    overNumber: number; // Track multiple Super Overs
    team1: { runs: number; wickets: number };
    team2: { runs: number; wickets: number };
    battingTeam: 'team1' | 'team2';
    completed: boolean;
    winner?: 'team1' | 'team2';
  };
  strategicTimeout?: {
    team1: { used: number; remaining: number };
    team2: { used: number; remaining: number };
    currentTimeout?: { team: 'team1' | 'team2'; startTime: number; duration: number };
  };
  completedAt?: number;
  lockedStates: MatchStateType[]; // States that cannot be edited
}

export interface MatchStateTransition {
  from: MatchStateType;
  to: MatchStateType;
  allowed: boolean;
  reason?: string;
}

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<MatchStateType, MatchStateType[]> = {
  'pre-match': ['toss'],
  'toss': ['innings-1'],
  'innings-1': ['strategic-timeout-1', 'break'],
  'strategic-timeout-1': ['innings-1'],
  'break': ['innings-2'],
  'innings-2': ['strategic-timeout-2', 'super-over', 'complete'],
  'strategic-timeout-2': ['innings-2'],
  'super-over': ['super-over', 'complete'], // Can have multiple super overs
  'complete': [], // Terminal state
};

/**
 * Check if a state transition is allowed
 */
export function canTransition(
  currentState: MatchStateType,
  targetState: MatchStateType,
  matchState: MatchState
): MatchStateTransition {
  // Cannot transition if current state is locked
  if (matchState.lockedStates.includes(currentState)) {
    return {
      from: currentState,
      to: targetState,
      allowed: false,
      reason: `Cannot transition from locked state: ${currentState}`,
    };
  }

  // Check if transition is valid
  const allowedStates = VALID_TRANSITIONS[currentState];
  if (!allowedStates.includes(targetState)) {
    return {
      from: currentState,
      to: targetState,
      allowed: false,
      reason: `Invalid transition from ${currentState} to ${targetState}`,
    };
  }

  // Special validation for specific transitions
  if (targetState === 'innings-1' && !matchState.toss) {
    return {
      from: currentState,
      to: targetState,
      allowed: false,
      reason: 'Toss must be completed before starting innings 1',
    };
  }

  if (targetState === 'innings-2' && !matchState.innings1?.completed) {
    return {
      from: currentState,
      to: targetState,
      allowed: false,
      reason: 'Innings 1 must be completed before starting innings 2',
    };
  }

  // Super Over can only be triggered from innings-2 if scores are tied
  if (targetState === 'super-over' && currentState !== 'innings-2') {
    return {
      from: currentState,
      to: targetState,
      allowed: false,
      reason: 'Super Over can only be triggered after innings 2',
    };
  }

  return {
    from: currentState,
    to: targetState,
    allowed: true,
  };
}

/**
 * Transition to a new state
 */
export function transitionState(
  matchState: MatchState,
  targetState: MatchStateType,
  data?: {
    toss?: { winner: 'team1' | 'team2'; decision: 'bat' | 'bowl' };
    battingTeam?: 'team1' | 'team2';
    target?: number;
  }
): MatchState {
  const transition = canTransition(matchState.currentState, targetState, matchState);
  
  if (!transition.allowed) {
    throw new Error(transition.reason || 'Invalid state transition');
  }

  const newState: MatchState = {
    ...matchState,
    currentState: targetState,
    lockedStates: [...matchState.lockedStates, matchState.currentState], // Lock previous state
  };

  // Handle state-specific data
  switch (targetState) {
    case 'toss':
      if (data?.toss) {
        newState.toss = {
          winner: data.toss.winner,
          decision: data.toss.decision,
          timestamp: Date.now(),
        };
      }
      break;

    case 'innings-1':
      if (data?.battingTeam) {
        newState.innings1 = {
          battingTeam: data.battingTeam,
          completed: false,
        };
      }
      break;

    case 'break':
      if (matchState.innings1) {
        newState.innings1 = {
          ...matchState.innings1,
          completed: true,
          completedAt: Date.now(),
          target: data?.target, // Target set for innings 2
        };
      }
      break;

    case 'innings-2':
      if (data?.battingTeam && matchState.innings1?.target) {
        newState.innings2 = {
          battingTeam: data.battingTeam,
          target: matchState.innings1.target,
          completed: false,
        };
      }
      break;

    case 'strategic-timeout-1':
    case 'strategic-timeout-2':
      // Strategic timeout doesn't change match state, just pauses
      // The timeout state is temporary and returns to the innings state
      break;

    case 'super-over':
      if (!matchState.superOver) {
        newState.superOver = {
          overNumber: 1,
          team1: { runs: 0, wickets: 0 },
          team2: { runs: 0, wickets: 0 },
          battingTeam: matchState.toss?.decision === 'bat' ? matchState.toss.winner : 
                        matchState.toss?.winner === 'team1' ? 'team2' : 'team1',
          completed: false,
        };
      }
      break;

    case 'complete':
      if (matchState.superOver && !matchState.superOver.completed) {
        // Complete super over first
        newState.superOver = {
          ...matchState.superOver,
          completed: true,
        };
      } else if (matchState.innings2) {
        newState.innings2 = {
          ...matchState.innings2,
          completed: true,
          completedAt: Date.now(),
        };
        newState.completedAt = Date.now();
      }
      break;
  }

  return newState;
}

/**
 * Initialize match state
 */
export function initializeMatchState(): MatchState {
  return {
    currentState: 'pre-match',
    lockedStates: [],
  };
}

/**
 * Check if a state is locked
 */
export function isStateLocked(state: MatchStateType, matchState: MatchState): boolean {
  return matchState.lockedStates.includes(state);
}

/**
 * Get state display information
 */
export function getStateDisplay(state: MatchStateType): {
  label: string;
  description: string;
  color: string;
  icon: string;
} {
  const states: Record<MatchStateType, { label: string; description: string; color: string; icon: string }> = {
    'pre-match': {
      label: 'Pre-Match',
      description: 'Match has not started yet',
      color: 'blue',
      icon: '📅',
    },
    'toss': {
      label: 'Toss',
      description: 'Toss is in progress',
      color: 'yellow',
      icon: '🪙',
    },
    'innings-1': {
      label: '1st Innings',
      description: 'First innings in progress',
      color: 'green',
      icon: '🏏',
    },
    'break': {
      label: 'Innings Break',
      description: 'Break between innings',
      color: 'orange',
      icon: '⏸️',
    },
    'innings-2': {
      label: '2nd Innings',
      description: 'Second innings in progress',
      color: 'green',
      icon: '🏏',
    },
    'strategic-timeout-1': {
      label: 'Strategic Timeout (1st Innings)',
      description: 'Strategic timeout in first innings',
      color: 'blue',
      icon: '⏸️',
    },
    'strategic-timeout-2': {
      label: 'Strategic Timeout (2nd Innings)',
      description: 'Strategic timeout in second innings',
      color: 'blue',
      icon: '⏸️',
    },
    'super-over': {
      label: 'Super Over',
      description: 'Super Over in progress',
      color: 'purple',
      icon: '⚡',
    },
    'complete': {
      label: 'Match Complete',
      description: 'Match has finished',
      color: 'gray',
      icon: '✅',
    },
  };

  return states[state];
}

/**
 * Auto-detect if innings should transition
 */
export function shouldAutoTransitionInnings(
  matchState: MatchState,
  currentInnings: 1 | 2,
  wickets: number,
  overs: number,
  maxOvers: number = 20
): boolean {
  // Check if we're in the correct innings state
  if (currentInnings === 1 && matchState.currentState !== 'innings-1') {
    return false;
  }
  if (currentInnings === 2 && matchState.currentState !== 'innings-2') {
    return false;
  }

  // Auto-transition if all wickets fall (10 wickets)
  if (wickets >= 10) {
    return true;
  }

  // Auto-transition if max overs completed
  if (overs >= maxOvers) {
    return true;
  }

  return false;
}

/**
 * Get next state from current state
 */
export function getNextState(currentState: MatchStateType): MatchStateType | null {
  const nextStates = VALID_TRANSITIONS[currentState];
  return nextStates.length > 0 ? nextStates[0] : null;
}

