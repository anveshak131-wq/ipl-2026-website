'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BallEntryButton from './BallEntryButton';
import AnimatedScoreDisplay from './AnimatedScoreDisplay';
import CurrentOverDisplay from './CurrentOverDisplay';
import OverProgressBar from './OverProgressBar';
import PlayerStats from './PlayerStats';
import WicketModal from './WicketModal';
import MatchStateManager from './MatchStateManager';
import WicketCelebration from './WicketCelebration';
import BoundaryHighlight from './BoundaryHighlight';
import MilestoneCelebration from './MilestoneCelebration';
import RichCommentary from './RichCommentary';
import PartnershipInfo from './PartnershipInfo';
import OverByOverAnalysis from './OverByOverAnalysis';
import EnhancedPlayerStats from './EnhancedPlayerStats';
import MatchContextPanel from './MatchContextPanel';
import QuickActionsBar from './QuickActionsBar';
import PowerplayIndicator from './PowerplayIndicator';
import StrategicTimeout from './StrategicTimeout';
import DRSReview from './DRSReview';
import SuperOverPanel from './SuperOverPanel';
import ImpactPlayerSelector from './ImpactPlayerSelector';
import TwoBallRuleIndicator from './TwoBallRuleIndicator';
import { useLiveScore, BallEvent } from '@/hooks/useLiveScore';
import { Player } from '@/types';
import { Users, RotateCcw, Save } from 'lucide-react';
import { initializeMatchState, transitionState } from '@/lib/matchStateMachine';
import { LiveScoreState } from '@/hooks/useLiveScore';

interface BallEntryPanelProps {
  matchId: string;
  team1Name: string;
  team2Name: string;
  team1Id: string;
  team2Id: string;
  onSave: (state: LiveScoreState) => Promise<void>;
  players: Player[];
  league?: 'ipl' | 'wpl';
  initialBatter?: { id: string; name: string };
  initialBowler?: { id: string; name: string };
  playing11?: {
    team1: string[];
    team2: string[];
  };
  initialState?: LiveScoreState;
  // Match context props
  venue?: string;
  date?: string;
  time?: string;
  toss?: {
    winner: 'team1' | 'team2';
    decision: 'bat' | 'bowl';
  };
  weather?: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  pitchReport?: string;
  headToHead?: {
    matches: number;
    team1Wins: number;
    team2Wins: number;
    lastResult?: string;
  };
  isTestPage?: boolean; // For test pages, skip match state restrictions
  isEveningMatch?: boolean;
}

export default function BallEntryPanel({
  matchId,
  team1Name,
  team2Name,
  team1Id,
  team2Id,
  onSave,
  players,
  league = 'ipl',
  initialBatter,
  initialBowler,
  playing11,
  initialState,
  venue,
  date,
  time,
  toss,
  weather,
  pitchReport,
  headToHead,
  isTestPage = false,
  isEveningMatch: propIsEveningMatch,
}: BallEntryPanelProps) {
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showPlayerSelector, setShowPlayerSelector] = useState<'batter' | 'bowler' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Animation states
  const [showWicketCelebration, setShowWicketCelebration] = useState(false);
  const [wicketData, setWicketData] = useState<{
    batterName: string;
    dismissalType: string;
    bowlerName?: string;
    fielderName?: string;
  } | null>(null);
  
  const [showBoundary, setShowBoundary] = useState(false);
  const [boundaryData, setBoundaryData] = useState<{
    runs: 4 | 6;
    batterName: string;
  } | null>(null);
  
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneData, setMilestoneData] = useState<{
    runs: number;
    batterName: string;
  } | null>(null);
  
  // Track previous state for animations
  const previousStateRef = useRef<LiveScoreState | null>(null);
  const lastBallRef = useRef<BallEvent | null>(null);

  // Strategic Timeout state
  const [timeoutState, setTimeoutState] = useState({
    team1: { used: 0, remaining: 2 },
    team2: { used: 0, remaining: 2 },
    currentTimeout: null as { team: 'team1' | 'team2'; startTime: number } | null,
  });

  // DRS Review state
  const [drsState, setDrsState] = useState({
    team1: { used: 0, remaining: 2, successful: 0 },
    team2: { used: 0, remaining: 2, successful: 0 },
  });

  // Super Over state
  const [superOverState, setSuperOverState] = useState<{
    overNumber: number;
    team1: { runs: number; wickets: number };
    team2: { runs: number; wickets: number };
    battingTeam: 'team1' | 'team2';
    completed: boolean;
    winner?: 'team1' | 'team2';
  } | null>(null);

  // Impact Player state
  const [impactPlayerState, setImpactPlayerState] = useState<{
    team1?: { original: string; impact: string; substitutedAt: number };
    team2?: { original: string; impact: string; substitutedAt: number };
  }>({});

  // Two-Ball Rule state
  const [ballChanged, setBallChanged] = useState(false);
  const [isEveningMatch, setIsEveningMatch] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Determine if evening match (after 5 PM IST typically)
  useEffect(() => {
    if (propIsEveningMatch !== undefined) {
      setIsEveningMatch(propIsEveningMatch);
    } else if (time) {
      const [hours] = time.split(':').map(Number);
      setIsEveningMatch(hours >= 17); // 5 PM or later
    }
  }, [propIsEveningMatch, time]);

  const {
    state,
    matchState,
    recordBall,
    recordWicket,
    undo,
    canUndo,
    changeBatter,
    changeBowler,
    updateMatchState,
    isFreeHit,
  } = useLiveScore({
    initialTeam1Name: team1Name,
    initialTeam2Name: team2Name,
    initialBatter,
    initialBowler,
    initialMatchState: initializeMatchState(),
    initialState,
    maxOvers: 20,
    isTestPage,
    onMatchStateChange: (newMatchState) => {
      // This will be called when match state changes
      // You can save it to backend here if needed
    },
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      if (isSaving || matchState.currentState === 'not-started') return;
      
      try {
        const extendedState = {
          ...state,
          toss: matchState.toss ? {
            winner: matchState.toss.winner,
            decision: matchState.toss.decision,
          } : undefined,
          strategicTimeout: timeoutState,
          drsReviews: drsState,
          impactPlayer: impactPlayerState,
          superOver: superOverState,
          ballChanged,
          isEveningMatch,
        };
        await onSave(extendedState as LiveScoreState);
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, 30000); // Auto-save every 30 seconds
    
    setAutoSaveInterval(saveInterval);
    
    return () => clearInterval(saveInterval);
  }, [state, matchState, timeoutState, drsState, impactPlayerState, superOverState, ballChanged, isEveningMatch, onSave, isSaving]);

  // Initialize previous state ref
  useEffect(() => {
    if (!previousStateRef.current) {
      previousStateRef.current = JSON.parse(JSON.stringify(state));
    }
  }, []);

  // Detect events for celebrations
  useEffect(() => {
    if (!previousStateRef.current) {
      previousStateRef.current = JSON.parse(JSON.stringify(state));
      return;
    }

    const prev = previousStateRef.current;
    const battingTeam = state.battingTeam === 'team1' ? state.team1 : state.team2;
    const prevBattingTeam = prev.battingTeam === 'team1' ? prev.team1 : prev.team2;
    const currentBatterRuns = state.currentBatter.runs;
    const prevBatterRuns = prev.currentBatter.runs;

    // Check for wicket
    if (battingTeam.wickets > prevBattingTeam.wickets) {
      const lastBall = lastBallRef.current;
      if (lastBall && lastBall.type === 'W') {
        setWicketData({
          batterName: prev.currentBatter.name,
          dismissalType: lastBall.dismissalType || 'out',
          bowlerName: state.currentBowler.name,
          fielderName: lastBall.fielderName,
        });
        setShowWicketCelebration(true);
        setTimeout(() => {
          setShowWicketCelebration(false);
          setWicketData(null);
        }, 3000);
      }
    }

    // Check for boundary (4 or 6) - only if runs increased
    if (lastBallRef.current && battingTeam.runs > prevBattingTeam.runs) {
      const lastBall = lastBallRef.current;
      let boundaryRuns: 4 | 6 | null = null;
      
      if (lastBall.type === 4 || lastBall.type === 6) {
        boundaryRuns = lastBall.type as 4 | 6;
      } else if (lastBall.type === 'NB+4' || lastBall.type === 'WD+4' || lastBall.type === '4B' || lastBall.type === '4LB') {
        boundaryRuns = 4;
      } else if (lastBall.type === 'NB+6') {
        boundaryRuns = 6;
      }
      
      if (boundaryRuns) {
        setBoundaryData({
          runs: boundaryRuns,
          batterName: state.currentBatter.name,
        });
        setShowBoundary(true);
        setTimeout(() => {
          setShowBoundary(false);
          setBoundaryData(null);
        }, 2000);
      }
    }

    // Check for milestone (50, 100, 150) - only on exact milestone
    if (currentBatterRuns === 50 && prevBatterRuns < 50) {
      setMilestoneData({ runs: currentBatterRuns, batterName: state.currentBatter.name });
      setShowMilestone(true);
      setTimeout(() => {
        setShowMilestone(false);
        setMilestoneData(null);
      }, 3000);
    } else if (currentBatterRuns === 100 && prevBatterRuns < 100) {
      setMilestoneData({ runs: currentBatterRuns, batterName: state.currentBatter.name });
      setShowMilestone(true);
      setTimeout(() => {
        setShowMilestone(false);
        setMilestoneData(null);
      }, 4000);
    } else if (currentBatterRuns === 150 && prevBatterRuns < 150) {
      setMilestoneData({ runs: currentBatterRuns, batterName: state.currentBatter.name });
      setShowMilestone(true);
      setTimeout(() => {
        setShowMilestone(false);
        setMilestoneData(null);
      }, 4000);
    }

    previousStateRef.current = JSON.parse(JSON.stringify(state));
  }, [state]);

  const handleBallClick = useCallback((value: number | string) => {
    if (value === 'W') {
      setShowWicketModal(true);
      return;
    }

    const ballEvent: BallEvent = {
      type: value as any,
      runs: typeof value === 'number' ? value : 0,
      timestamp: Date.now(),
    };
    
    lastBallRef.current = ballEvent;
    recordBall(ballEvent);
  }, [recordBall]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or modal is open
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        showWicketModal ||
        showPlayerSelector
      ) {
        return;
      }

      // Number keys 0-6
      if (e.key >= '0' && e.key <= '6' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const value = parseInt(e.key);
        handleBallClick(value);
      }
      // W for wicket
      else if (e.key.toLowerCase() === 'w' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleBallClick('W');
      }
      // N for no-ball
      else if (e.key.toLowerCase() === 'n' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleBallClick('NB');
      }
      // D for wide
      else if (e.key.toLowerCase() === 'd' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleBallClick('WD');
      }
      // U for undo
      else if (e.key.toLowerCase() === 'u' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && canUndo) {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canUndo, undo, showWicketModal, showPlayerSelector, handleBallClick]);

  const handleWicketConfirm = (dismissalType: string, fielderName?: string) => {
    // Store wicket data for celebration
    const batterName = state.currentBatter.name;
    const bowlerName = state.currentBowler.name;
    
    // Update last ball ref with wicket info
    lastBallRef.current = {
      type: 'W',
      runs: 0,
      timestamp: Date.now(),
      dismissalType: dismissalType as any,
      fielderName,
    };
    
    recordWicket(dismissalType, fielderName);
    setShowWicketModal(false);
    
    // Celebration will be triggered by the useEffect that watches state changes
  };

  const handleSave = async () => {
    if (!canRecordBalls && !isTestPage) {
      alert('Cannot save during this match state. Please update the match state first.');
      return;
    }

    setIsSaving(true);
    try {
      // Validate data before saving
      if (state.team1.wickets > 10) state.team1.wickets = 10;
      if (state.team2.wickets > 10) state.team2.wickets = 10;
      if (state.team1.runs < 0) state.team1.runs = 0;
      if (state.team2.runs < 0) state.team2.runs = 0;

      // Include all new state in the save
      const extendedState = {
        ...state,
        // Add toss data from matchState
        toss: matchState.toss ? {
          winner: matchState.toss.winner,
          decision: matchState.toss.decision,
        } : undefined,
        // Add new fields for persistence
        strategicTimeout: timeoutState,
        drsReviews: drsState,
        impactPlayer: impactPlayerState,
        superOver: superOverState,
        ballChanged,
        isEveningMatch,
        matchState,
      };
      
      // Ensure ballHistory is an array
      if (!Array.isArray(extendedState.ballHistory)) {
        extendedState.ballHistory = [];
      }

      await onSave(extendedState as LiveScoreState);
      console.log('Score saved successfully');
    } catch (error) {
      console.error('Failed to save:', error);
      alert(`Failed to save score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const battingTeam = state.battingTeam === 'team1' ? state.team1 : state.team2;
  const bowlingTeam = state.battingTeam === 'team1' ? state.team2 : state.team1;
  const battingTeamId = state.battingTeam === 'team1' ? team1Id : team2Id;
  const bowlingTeamId = state.battingTeam === 'team1' ? team2Id : team1Id;

  // Filter players based on match teams and playing 11
  // If playing11 is defined, only show those players; otherwise show all team players
  const battingTeamPlaying11 = playing11 
    ? (state.battingTeam === 'team1' ? playing11.team1 : playing11.team2)
    : null;
  const bowlingTeamPlaying11 = playing11
    ? (state.battingTeam === 'team1' ? playing11.team2 : playing11.team1)
    : null;

  const battingTeamPlayers = battingTeamPlaying11
    ? players.filter(p => p.teamId === battingTeamId && battingTeamPlaying11.includes(p.id))
    : players.filter(p => p.teamId === battingTeamId);
  
  const bowlingTeamPlayers = bowlingTeamPlaying11
    ? players.filter(p => p.teamId === bowlingTeamId && bowlingTeamPlaying11.includes(p.id))
    : players.filter(p => p.teamId === bowlingTeamId);

  const leagueColors = {
    ipl: {
      primary: 'from-blue-600 to-cyan-600',
      secondary: 'bg-blue-600 hover:bg-blue-700',
      save: 'from-blue-600 to-cyan-600'
    },
    wpl: {
      primary: 'from-purple-600 to-pink-600',
      secondary: 'bg-purple-600 hover:bg-purple-700',
      save: 'from-purple-600 to-pink-600'
    }
  };

  const colors = leagueColors[league];

  // Check if ball entry is allowed based on match state (always true for test pages)
  const canRecordBalls = isTestPage || matchState.currentState === 'innings-1' || matchState.currentState === 'innings-2';

  // Detect mobile device
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Top Section: Match Context + State Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
      {/* Match State Manager */}
      <MatchStateManager
        matchState={matchState}
        onStateChange={updateMatchState}
        league={league}
        team1Name={team1Name}
        team2Name={team2Name}
        currentInnings={state.innings}
        team1Wickets={state.team1.wickets}
        team2Wickets={state.team2.wickets}
        team1Overs={state.team1.balls / 6}
        team2Overs={state.team2.balls / 6}
        maxOvers={20}
      />

      {/* Match Info */}
      <div className="space-y-4">
        <CurrentOverDisplay
          over={state.currentOver}
          innings={state.innings}
          battingTeam={battingTeam.name}
          league={league}
        />
        <OverProgressBar currentOver={state.currentOver} league={league} />
      </div>

      {/* Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatedScoreDisplay
          teamName={state.team1.name}
          runs={state.team1.runs}
          wickets={state.team1.wickets}
          overs={ballsToOvers(state.team1.balls)}
          isBatting={state.battingTeam === 'team1'}
          league={league}
              previousRuns={previousStateRef.current?.battingTeam === 'team1' 
                ? previousStateRef.current.team1.runs 
                : previousStateRef.current?.team1.runs || 0}
              previousWickets={previousStateRef.current?.battingTeam === 'team1'
                ? previousStateRef.current.team1.wickets
                : previousStateRef.current?.team1.wickets || 0}
            />
            <AnimatedScoreDisplay
          teamName={state.team2.name}
          runs={state.team2.runs}
          wickets={state.team2.wickets}
          overs={ballsToOvers(state.team2.balls)}
          isBatting={state.battingTeam === 'team2'}
          league={league}
              previousRuns={previousStateRef.current?.battingTeam === 'team2'
                ? previousStateRef.current.team2.runs
                : previousStateRef.current?.team2.runs || 0}
              previousWickets={previousStateRef.current?.battingTeam === 'team2'
                ? previousStateRef.current.team2.wickets
                : previousStateRef.current?.team2.wickets || 0}
            />
          </div>
        </div>

        {/* Right Column: Match Context Panel */}
        <div className="lg:col-span-1">
          <MatchContextPanel
            team1Name={team1Name}
            team2Name={team2Name}
            venue="Test Venue"
            toss={matchState.toss}
            weather={{
              temperature: 28,
              condition: 'partly-cloudy',
              humidity: 65,
              windSpeed: 12,
            }}
            pitchReport="Hard and dry surface with even bounce. Good for stroke play. Expected to assist spinners in the second innings."
            headToHead={{
              totalMatches: 24,
              team1Wins: 12,
              team2Wins: 12,
              lastMeeting: '2025-04-15',
            }}
            currentOver={state.currentOver}
            league={league}
          />
          </div>
        </div>

      {/* Powerplay Indicator */}
      <PowerplayIndicator currentOver={state.currentOver} league={league} />

      {/* Two-Ball Rule Indicator */}
      <TwoBallRuleIndicator
        isEveningMatch={isEveningMatch}
        currentInnings={state.innings}
        currentOver={state.currentOver}
        ballChanged={ballChanged}
        onBallChange={() => {
          setBallChanged(true);
          // In real implementation, this would notify umpires/backend
        }}
        league={league}
      />

      {/* Strategic Timeouts */}
      {matchState.currentState === 'innings-1' || matchState.currentState === 'innings-2' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StrategicTimeout
            team="team1"
            teamName={team1Name}
            used={timeoutState.team1.used}
            remaining={timeoutState.team1.remaining}
            isActive={timeoutState.currentTimeout?.team === 'team1' || false}
            onTimeout={() => {
              setTimeoutState(prev => ({
                ...prev,
                team1: { ...prev.team1, used: prev.team1.used + 1, remaining: prev.team1.remaining - 1 },
                currentTimeout: { team: 'team1', startTime: Date.now() },
              }));
            }}
            onTimeoutEnd={() => {
              setTimeoutState(prev => ({
                ...prev,
                currentTimeout: null,
              }));
            }}
          />
          <StrategicTimeout
            team="team2"
            teamName={team2Name}
            used={timeoutState.team2.used}
            remaining={timeoutState.team2.remaining}
            isActive={timeoutState.currentTimeout?.team === 'team2' || false}
            onTimeout={() => {
              setTimeoutState(prev => ({
                ...prev,
                team2: { ...prev.team2, used: prev.team2.used + 1, remaining: prev.team2.remaining - 1 },
                currentTimeout: { team: 'team2', startTime: Date.now() },
              }));
            }}
            onTimeoutEnd={() => {
              setTimeoutState(prev => ({
                ...prev,
                currentTimeout: null,
              }));
            }}
          />
        </div>
      ) : null}

      {/* DRS Reviews */}
      {matchState.currentState === 'innings-1' || matchState.currentState === 'innings-2' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <DRSReview
            team="team1"
            teamName={team1Name}
            used={drsState.team1.used}
            remaining={drsState.team1.remaining}
            successful={drsState.team1.successful}
            onReview={(type) => {
              setDrsState(prev => ({
                ...prev,
                team1: { ...prev.team1, used: prev.team1.used + 1, remaining: prev.team1.remaining - 1 },
              }));
            }}
            onResult={(successful) => {
              if (successful) {
                setDrsState(prev => ({
                  ...prev,
                  team1: { ...prev.team1, successful: prev.team1.successful + 1 },
                }));
              }
            }}
          />
          <DRSReview
            team="team2"
            teamName={team2Name}
            used={drsState.team2.used}
            remaining={drsState.team2.remaining}
            successful={drsState.team2.successful}
            onReview={(type) => {
              setDrsState(prev => ({
                ...prev,
                team2: { ...prev.team2, used: prev.team2.used + 1, remaining: prev.team2.remaining - 1 },
              }));
            }}
            onResult={(successful) => {
              if (successful) {
                setDrsState(prev => ({
                  ...prev,
                  team2: { ...prev.team2, successful: prev.team2.successful + 1 },
                }));
              }
            }}
          />
        </div>
      ) : null}

      {/* Super Over Trigger - Show when innings 2 is complete and scores are tied */}
      {matchState.currentState === 'complete' && 
       matchState.innings1?.completed && 
       matchState.innings2?.completed &&
       !superOverState &&
       state.team1.runs === state.team2.runs && (
        <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-2 border-purple-500/50 rounded-xl p-6 mb-6">
          <div className="text-center">
            <h3 className="text-white font-bold text-xl mb-2">⚡ Match Tied!</h3>
            <p className="text-gray-300 mb-4">
              {team1Name}: {state.team1.runs}/{state.team1.wickets} | {team2Name}: {state.team2.runs}/{state.team2.wickets}
            </p>
            <button
              onClick={() => {
                const newSuperOverState = {
                  overNumber: 1,
                  team1: { runs: 0, wickets: 0 },
                  team2: { runs: 0, wickets: 0 },
                  battingTeam: matchState.toss?.decision === 'bat' ? matchState.toss.winner : 
                                matchState.toss?.winner === 'team1' ? 'team2' : 'team1',
                  completed: false,
                };
                setSuperOverState(newSuperOverState);
                updateMatchState(transitionState(matchState, 'super-over'));
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-6 py-3 rounded-lg transition-all hover:scale-105"
            >
              Start Super Over
            </button>
          </div>
        </div>
      )}

      {/* Super Over Panel */}
      {matchState.currentState === 'super-over' && superOverState && (
        <SuperOverPanel
          team1Name={team1Name}
          team2Name={team2Name}
          superOver={superOverState}
          onBallRecord={(ball) => {
            // Handle super over ball recording
            if (superOverState.battingTeam === 'team1') {
              setSuperOverState(prev => prev ? {
                ...prev,
                team1: { ...prev.team1, runs: prev.team1.runs + ball.runs },
              } : null);
            } else {
              setSuperOverState(prev => prev ? {
                ...prev,
                team2: { ...prev.team2, runs: prev.team2.runs + ball.runs },
              } : null);
            }
          }}
          onComplete={(winner) => {
            setSuperOverState(prev => prev ? { ...prev, completed: true, winner } : null);
            updateMatchState(transitionState(matchState, 'complete'));
          }}
          onNextSuperOver={() => {
            setSuperOverState(prev => prev ? {
              ...prev,
              overNumber: prev.overNumber + 1,
              team1: { runs: 0, wickets: 0 },
              team2: { runs: 0, wickets: 0 },
              completed: false,
            } : null);
          }}
        />
      )}

      {/* Partnership Info */}
      <PartnershipInfo state={state} league={league} />

      {/* Current Players - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnhancedPlayerStats
          player={{
            name: state.currentBatter.name,
            runs: state.currentBatter.runs,
            balls: state.currentBatter.balls,
            isBatter: true,
          }}
          ballHistory={state.ballHistory}
          league={league}
        />
        <EnhancedPlayerStats
          player={{
            name: state.currentBowler.name,
            runs: state.currentBowler.runs,
            balls: state.currentBowler.balls,
            isBatter: false,
          }}
          ballHistory={state.ballHistory}
          league={league}
        />
      </div>

      {/* Over-by-Over Analysis */}
      <OverByOverAnalysis state={state} league={league} />

      {/* Rich Commentary */}
      <RichCommentary
        ballHistory={state.ballHistory}
        currentOver={state.currentOver}
        currentBatter={state.currentBatter}
        currentBowler={state.currentBowler}
        league={league}
        maxVisible={10}
      />

      {/* Ball Entry Buttons */}
      <div className="space-y-4">
        {!isTestPage && !canRecordBalls && (
          <div className="px-4 py-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-400 font-semibold">
              ⚠️ Ball entry is disabled. Please transition to an innings state to record balls.
            </p>
          </div>
        )}
        {/* Free Hit Indicator */}
        {isFreeHit && (
          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-xl">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="text-yellow-300 font-bold text-lg">FREE HIT</span>
              <span className="text-yellow-300/80 text-sm">(Batter can only be dismissed by run out)</span>
            </div>
          </div>
        )}

        {/* Regular Runs */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Regular Runs</h4>
          <div className={`grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 ${!canRecordBalls ? 'opacity-50 pointer-events-none' : ''}`}>
            <BallEntryButton value={0} label={isMobile ? "0" : "Dot (0)"} color="green" onClick={() => handleBallClick(0)} />
            <BallEntryButton value={1} label={isMobile ? "1" : "Single (1)"} color="green" onClick={() => handleBallClick(1)} />
            <BallEntryButton value={2} label={isMobile ? "2" : "Double (2)"} color="green" onClick={() => handleBallClick(2)} />
            <BallEntryButton value={4} label={isMobile ? "4" : "Four (4)"} color="green" onClick={() => handleBallClick(4)} />
            <BallEntryButton value={6} label={isMobile ? "6" : "Six (6)"} color="green" onClick={() => handleBallClick(6)} />
          </div>
        </div>

        {/* No Ball + Runs */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">No Ball + Runs</h4>
          <div className={`grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 ${!canRecordBalls ? 'opacity-50 pointer-events-none' : ''}`}>
            <BallEntryButton value="NB" label={isMobile ? "NB" : "NB (0)"} color="orange" onClick={() => handleBallClick('NB')} />
            <BallEntryButton value="NB+1" label={isMobile ? "NB+1" : "NB+1"} color="orange" onClick={() => handleBallClick('NB+1')} />
            <BallEntryButton value="NB+2" label={isMobile ? "NB+2" : "NB+2"} color="orange" onClick={() => handleBallClick('NB+2')} />
            <BallEntryButton value="NB+4" label={isMobile ? "NB+4" : "NB+4"} color="orange" onClick={() => handleBallClick('NB+4')} />
            <BallEntryButton value="NB+6" label={isMobile ? "NB+6" : "NB+6"} color="orange" onClick={() => handleBallClick('NB+6')} />
          </div>
        </div>

        {/* Wide + Runs */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Wide + Runs</h4>
          <div className={`grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 ${!canRecordBalls ? 'opacity-50 pointer-events-none' : ''}`}>
            <BallEntryButton value="WD" label={isMobile ? "WD" : "WD (0)"} color="orange" onClick={() => handleBallClick('WD')} />
            <BallEntryButton value="WD+1" label={isMobile ? "WD+1" : "WD+1"} color="orange" onClick={() => handleBallClick('WD+1')} />
            <BallEntryButton value="WD+2" label={isMobile ? "WD+2" : "WD+2"} color="orange" onClick={() => handleBallClick('WD+2')} />
            <BallEntryButton value="WD+4" label={isMobile ? "WD+4" : "WD+4"} color="orange" onClick={() => handleBallClick('WD+4')} />
          </div>
        </div>

        {/* Byes */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Byes</h4>
          <div className={`grid grid-cols-4 gap-2 sm:gap-3 ${!canRecordBalls ? 'opacity-50 pointer-events-none' : ''}`}>
            <BallEntryButton value="1B" label={isMobile ? "1B" : "1 Bye"} color="orange" onClick={() => handleBallClick('1B')} />
            <BallEntryButton value="2B" label={isMobile ? "2B" : "2 Byes"} color="orange" onClick={() => handleBallClick('2B')} />
            <BallEntryButton value="3B" label={isMobile ? "3B" : "3 Byes"} color="orange" onClick={() => handleBallClick('3B')} />
            <BallEntryButton value="4B" label={isMobile ? "4B" : "4 Byes"} color="orange" onClick={() => handleBallClick('4B')} />
          </div>
        </div>

        {/* Leg Byes */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Leg Byes</h4>
          <div className={`grid grid-cols-4 gap-2 sm:gap-3 ${!canRecordBalls ? 'opacity-50 pointer-events-none' : ''}`}>
            <BallEntryButton value="1LB" label={isMobile ? "1LB" : "1 Leg Bye"} color="orange" onClick={() => handleBallClick('1LB')} />
            <BallEntryButton value="2LB" label={isMobile ? "2LB" : "2 Leg Byes"} color="orange" onClick={() => handleBallClick('2LB')} />
            <BallEntryButton value="3LB" label={isMobile ? "3LB" : "3 Leg Byes"} color="orange" onClick={() => handleBallClick('3LB')} />
            <BallEntryButton value="4LB" label={isMobile ? "4LB" : "4 Leg Byes"} color="orange" onClick={() => handleBallClick('4LB')} />
          </div>
        </div>

        {/* Wicket */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Wicket</h4>
          <div className={`grid grid-cols-1 gap-2 sm:gap-3 ${!canRecordBalls ? 'opacity-50 pointer-events-none' : ''}`}>
            <BallEntryButton value="W" label={isMobile ? "W" : "Wicket (W)"} color="red" onClick={() => handleBallClick('W')} />
          </div>
        </div>
        {/* Keyboard Shortcuts Hint - Hidden on mobile */}
        {!isMobile && (
        <div className="text-center">
          <p className="text-xs text-gray-400">
            💡 Keyboard Shortcuts: Press <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">0-6</kbd> for runs, 
            <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300 mx-1">W</kbd> for wicket, 
            <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300 mx-1">N</kbd> for no-ball, 
            <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300 mx-1">D</kbd> for wide, 
            <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300 mx-1">U</kbd> for undo
          </p>
        </div>
        )}
      </div>

      {/* Quick Actions Bar */}
      <QuickActionsBar
        onChangeBatter={() => setShowPlayerSelector('batter')}
        onChangeBowler={() => setShowPlayerSelector('bowler')}
        onUndo={undo}
        onSave={handleSave}
        canUndo={canUndo}
        isSaving={isSaving}
        isMobile={isMobile}
        league={league}
      />

      {/* Player Selector Modal */}
      {showPlayerSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border-2 border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">
              Select {showPlayerSelector === 'batter' ? 'Batter' : 'Bowler'}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {showPlayerSelector === 'batter' 
                ? `${battingTeam.name} - Playing 11` 
                : `${bowlingTeam.name} - Playing 11`}
            </p>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {(showPlayerSelector === 'batter' ? battingTeamPlayers : bowlingTeamPlayers).length > 0 ? (
                (showPlayerSelector === 'batter' ? battingTeamPlayers : bowlingTeamPlayers).map((player) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      if (showPlayerSelector === 'batter') {
                        changeBatter({ id: player.id, name: player.name });
                      } else {
                        changeBowler({ id: player.id, name: player.name });
                      }
                      setShowPlayerSelector(null);
                    }}
                    className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-left transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs text-gray-400">{player.role} • #{player.jerseyNumber}</div>
                    </div>
                    {player.isCaptain && (
                      <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                        C
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No players found for {showPlayerSelector === 'batter' ? battingTeam.name : bowlingTeam.name}</p>
                  <p className="text-xs mt-2">Please ensure players are assigned to this team</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowPlayerSelector(null)}
              className="mt-4 w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Wicket Modal */}
      <WicketModal
        isOpen={showWicketModal}
        onClose={() => setShowWicketModal(false)}
        onConfirm={handleWicketConfirm}
        players={players}
        league={league}
        isTestPage={isTestPage}
      />

      {/* Celebration Animations */}
      {wicketData && (
        <WicketCelebration
          isOpen={showWicketCelebration}
          onClose={() => {
            setShowWicketCelebration(false);
            setWicketData(null);
          }}
          batterName={wicketData.batterName}
          dismissalType={wicketData.dismissalType}
          bowlerName={wicketData.bowlerName}
          fielderName={wicketData.fielderName}
          league={league}
        />
      )}

      {boundaryData && (
        <BoundaryHighlight
          isVisible={showBoundary}
          runs={boundaryData.runs}
          batterName={boundaryData.batterName}
          league={league}
        />
      )}

      {milestoneData && (
        <MilestoneCelebration
          isVisible={showMilestone}
          runs={milestoneData.runs}
          batterName={milestoneData.batterName}
          league={league}
        />
      )}
    </div>
  );
}

// Helper function
function ballsToOvers(balls: number): number {
  const whole = Math.floor(balls / 6);
  const rem = balls % 6;
  return parseFloat(`${whole}.${rem}`);
}
