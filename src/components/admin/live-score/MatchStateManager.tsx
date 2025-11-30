'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MatchStateType, 
  MatchState, 
  transitionState, 
  getStateDisplay, 
  getNextState,
  isStateLocked,
  canTransition
} from '@/lib/matchStateMachine';
import { CheckCircle2, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { WPLColors } from '@/lib/wplColors';

interface MatchStateManagerProps {
  matchState: MatchState;
  onStateChange: (newState: MatchState) => void;
  league?: 'ipl' | 'wpl';
  team1Name: string;
  team2Name: string;
  currentInnings: 1 | 2;
  team1Wickets: number;
  team2Wickets: number;
  team1Overs: number;
  team2Overs: number;
  maxOvers?: number;
}

export default function MatchStateManager({
  matchState,
  onStateChange,
  league = 'ipl',
  team1Name,
  team2Name,
  currentInnings,
  team1Wickets,
  team2Wickets,
  team1Overs,
  team2Overs,
  maxOvers = 20,
}: MatchStateManagerProps) {
  const [showTossModal, setShowTossModal] = useState(false);
  const [tossWinner, setTossWinner] = useState<'team1' | 'team2' | null>(null);
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingState, setPendingState] = useState<MatchStateType | null>(null);

  const currentDisplay = getStateDisplay(matchState.currentState);
  const nextState = getNextState(matchState.currentState);
  const nextDisplay = nextState ? getStateDisplay(nextState) : null;

  const isWPL = league === 'wpl';
  const colors = isWPL
    ? {
        primary: WPLColors.purple,
        secondary: WPLColors.pink,
        bg: WPLColors.purpleRGBA[10],
        border: WPLColors.purpleRGBA[30],
        text: WPLColors.textPrimary,
      }
    : {
        primary: '#3B82F6',
        secondary: '#06B6D4',
        bg: 'rgba(30, 41, 59, 0.6)',
        border: 'rgba(255, 255, 255, 0.1)',
        text: '#FFFFFF',
      };

  const handleStateTransition = (targetState: MatchStateType) => {
    const transition = canTransition(matchState.currentState, targetState, matchState);
    
    if (!transition.allowed) {
      alert(transition.reason || 'Cannot transition to this state');
      return;
    }

    // Special handling for toss
    if (targetState === 'toss') {
      setShowTossModal(true);
      return;
    }

    // Special handling for innings transitions
    if (targetState === 'innings-1' || targetState === 'innings-2') {
      setPendingState(targetState);
      setShowConfirmModal(true);
      return;
    }

    // Direct transition for other states
    try {
      const newState = transitionState(matchState, targetState);
      onStateChange(newState);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to transition state');
    }
  };

  const handleTossComplete = () => {
    if (!tossWinner || !tossDecision) {
      alert('Please select toss winner and decision');
      return;
    }

    try {
      const newState = transitionState(matchState, 'toss', {
        toss: {
          winner: tossWinner,
          decision: tossDecision,
        },
      });

      // Auto-determine batting team for innings 1
      const battingTeam = tossDecision === 'bat' ? tossWinner : (tossWinner === 'team1' ? 'team2' : 'team1');
      
      const innings1State = transitionState(newState, 'innings-1', {
        battingTeam,
      });

      onStateChange(innings1State);
      setShowTossModal(false);
      setTossWinner(null);
      setTossDecision(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to record toss');
    }
  };

  const handleConfirmTransition = () => {
    if (!pendingState) return;

    try {
      let newState = transitionState(matchState, pendingState);

      // If transitioning to break, calculate target
      if (pendingState === 'break' && currentInnings === 1) {
        const battingTeam = matchState.innings1?.battingTeam || 'team1';
        const target = battingTeam === 'team1' 
          ? (matchState.innings1?.target || 0) 
          : (matchState.innings1?.target || 0);
        
        // Get actual runs from current innings
        const currentRuns = battingTeam === 'team1' 
          ? (matchState.innings1?.target || 0) // This should come from live score
          : (matchState.innings1?.target || 0);

        newState = transitionState(newState, 'break', {
          target: currentRuns + 1, // Target is runs + 1
        });
      }

      // If transitioning to innings 2, determine batting team
      if (pendingState === 'innings-2') {
        const innings1BattingTeam = matchState.innings1?.battingTeam || 'team1';
        const innings2BattingTeam = innings1BattingTeam === 'team1' ? 'team2' : 'team1';
        
        newState = transitionState(newState, 'innings-2', {
          battingTeam: innings2BattingTeam,
        });
      }

      onStateChange(newState);
      setShowConfirmModal(false);
      setPendingState(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to transition state');
    }
  };

  // Check if current innings should auto-transition
  const shouldAutoTransition = () => {
    if (matchState.currentState === 'innings-1') {
      const battingTeam = matchState.innings1?.battingTeam || 'team1';
      const wickets = battingTeam === 'team1' ? team1Wickets : team2Wickets;
      const overs = battingTeam === 'team1' ? team1Overs : team2Overs;
      return wickets >= 10 || overs >= maxOvers;
    }
    if (matchState.currentState === 'innings-2') {
      const battingTeam = matchState.innings2?.battingTeam || 'team2';
      const wickets = battingTeam === 'team1' ? team1Wickets : team2Wickets;
      const overs = battingTeam === 'team1' ? team1Overs : team2Overs;
      return wickets >= 10 || overs >= maxOvers;
    }
    return false;
  };

  const canEdit = !isStateLocked(matchState.currentState, matchState);

  return (
    <div className="space-y-4">
      {/* Current State Display */}
      <div
        className="rounded-xl p-4 border backdrop-blur-xl"
        style={{
          background: colors.bg,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{currentDisplay.icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg" style={{ color: colors.text }}>
                  {currentDisplay.label}
                </h3>
                {!canEdit && (
                  <Lock className="w-4 h-4 text-gray-400" title="This state is locked" />
                )}
              </div>
              <p className="text-sm text-gray-400">{currentDisplay.description}</p>
            </div>
          </div>
          {shouldAutoTransition() && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-semibold">
                Ready to transition
              </span>
            </div>
          )}
        </div>

        {/* State Timeline */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
          {(['pre-match', 'toss', 'innings-1', 'break', 'innings-2', 'complete'] as MatchStateType[]).map((state, index) => {
            const display = getStateDisplay(state);
            const isCurrent = state === matchState.currentState;
            const isCompleted = matchState.lockedStates.includes(state);
            const isFuture = !isCurrent && !isCompleted;

            return (
              <div key={state} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : isCompleted
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {display.icon} {display.label}
                </div>
                {index < 5 && (
                  <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next State Button */}
      {nextState && canEdit && (
        <button
          onClick={() => handleStateTransition(nextState)}
          className="w-full px-4 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 shadow-lg"
          style={{
            background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
          }}
        >
          {nextDisplay && (
            <>
              {nextDisplay.icon} Proceed to {nextDisplay.label}
            </>
          )}
        </button>
      )}

      {/* Toss Modal */}
      <AnimatePresence>
        {showTossModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border-2 border-slate-700"
            >
              <h3 className="text-xl font-bold text-white mb-4">Record Toss</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Toss Winner
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTossWinner('team1')}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                        tossWinner === 'team1'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      {team1Name}
                    </button>
                    <button
                      onClick={() => setTossWinner('team2')}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                        tossWinner === 'team2'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      {team2Name}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Decision
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTossDecision('bat')}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                        tossDecision === 'bat'
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      🏏 Bat
                    </button>
                    <button
                      onClick={() => setTossDecision('bowl')}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                        tossDecision === 'bowl'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      🎾 Bowl
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowTossModal(false);
                    setTossWinner(null);
                    setTossDecision(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTossComplete}
                  disabled={!tossWinner || !tossDecision}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all"
                >
                  Confirm Toss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Transition Modal */}
      <AnimatePresence>
        {showConfirmModal && pendingState && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border-2 border-slate-700"
            >
              <h3 className="text-xl font-bold text-white mb-2">
                Confirm State Transition
              </h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to transition from{' '}
                <span className="font-semibold text-white">
                  {getStateDisplay(matchState.currentState).label}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-white">
                  {getStateDisplay(pendingState).label}
                </span>
                ?
              </p>
              <p className="text-xs text-yellow-400 mb-4">
                ⚠️ This action will lock the current state and cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingState(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmTransition}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg text-white font-semibold transition-all"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

