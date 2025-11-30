'use client';

import { useState, useEffect, useCallback } from 'react';
import BallEntryButton from './BallEntryButton';
import ScoreDisplay from './ScoreDisplay';
import CurrentOverDisplay from './CurrentOverDisplay';
import OverProgressBar from './OverProgressBar';
import PlayerStats from './PlayerStats';
import WicketModal from './WicketModal';
import { useLiveScore, BallEvent } from '@/hooks/useLiveScore';
import { Player } from '@/types';
import { Users, RotateCcw, Save } from 'lucide-react';

interface BallEntryPanelProps {
  matchId: string;
  team1Name: string;
  team2Name: string;
  team1Id: string;
  team2Id: string;
  onSave: (state: any) => Promise<void>;
  players: Player[];
  league?: 'ipl' | 'wpl';
  initialBatter?: { id: string; name: string };
  initialBowler?: { id: string; name: string };
  playing11?: {
    team1: string[];
    team2: string[];
  };
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
  playing11
}: BallEntryPanelProps) {
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showPlayerSelector, setShowPlayerSelector] = useState<'batter' | 'bowler' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    state,
    recordBall,
    recordWicket,
    undo,
    canUndo,
    changeBatter,
    changeBowler,
  } = useLiveScore({
    initialTeam1Name: team1Name,
    initialTeam2Name: team2Name,
    initialBatter,
    initialBowler,
  });

  const handleBallClick = useCallback((value: number | string) => {
    if (value === 'W') {
      setShowWicketModal(true);
      return;
    }

    recordBall({
      type: value as any,
      runs: typeof value === 'number' ? value : 0,
      timestamp: Date.now(),
    });
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
    recordWicket(dismissalType, fielderName);
    setShowWicketModal(false);
    // Reset batter stats for new batter (will be set when admin selects new batter)
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(state);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save score. Please try again.');
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

  return (
    <div className="space-y-6">
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
        <ScoreDisplay
          teamName={state.team1.name}
          runs={state.team1.runs}
          wickets={state.team1.wickets}
          overs={ballsToOvers(state.team1.balls)}
          isBatting={state.battingTeam === 'team1'}
          league={league}
        />
        <ScoreDisplay
          teamName={state.team2.name}
          runs={state.team2.runs}
          wickets={state.team2.wickets}
          overs={ballsToOvers(state.team2.balls)}
          isBatting={state.battingTeam === 'team2'}
          league={league}
        />
      </div>

      {/* Current Players */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlayerStats
          player={{
            name: state.currentBatter.name,
            runs: state.currentBatter.runs,
            balls: state.currentBatter.balls,
            isBatter: true,
          }}
          league={league}
        />
        <PlayerStats
          player={{
            name: state.currentBowler.name,
            runs: state.currentBowler.runs,
            balls: state.currentBowler.balls,
            isBatter: false,
          }}
          league={league}
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
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowPlayerSelector('batter')}
          className={`flex-1 px-4 py-3 ${colors.secondary} rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-colors`}
        >
          <Users className="w-5 h-5" />
          Change Batter
        </button>
        <button
          onClick={() => setShowPlayerSelector('bowler')}
          className={`flex-1 px-4 py-3 ${colors.secondary} rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-colors`}
        >
          <Users className="w-5 h-5" />
          Change Bowler
        </button>
        <button
          onClick={undo}
          disabled={!canUndo}
          className="px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Undo
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-3 bg-gradient-to-r ${colors.save} disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all`}
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

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
      />
    </div>
  );
}

// Helper function
function ballsToOvers(balls: number): number {
  const whole = Math.floor(balls / 6);
  const rem = balls % 6;
  return parseFloat(`${whole}.${rem}`);
}

