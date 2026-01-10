'use client';

import { useState, useEffect } from 'react';
import { useSimpleLiveScore } from '@/hooks/useSimpleLiveScore';
import { WPLColors } from '@/lib/wplColors';
import { Play, RotateCcw, Save } from 'lucide-react';

interface SimpleBallEntryPanelProps {
  matchId: string;
  team1Name: string;
  team2Name: string;
  onSave?: (state: any) => Promise<void>;
}

export default function SimpleBallEntryPanel({
  matchId,
  team1Name,
  team2Name,
  onSave,
}: SimpleBallEntryPanelProps) {
  const { state, recordBall, changeBatter, changeBowler, switchBattingTeam, undo } =
    useSimpleLiveScore({ team1Name, team2Name });

  const [isSaving, setSaving] = useState(false);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (state.ballHistory.length > 0 && onSave) {
        try {
          setSaving(true);
          await onSave(state);
          console.log('[SimpleBallEntryPanel] Auto-saved');
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setSaving(false);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [state, onSave]);

  const battingTeam = state.battingTeam === 'team1' ? state.team1 : state.team2;
  const bowlingTeam = state.battingTeam === 'team1' ? state.team2 : state.team1;
  const overs = Math.floor(battingTeam.balls / 6);
  const balls = battingTeam.balls % 6;

  const buttonClass = (color: string) =>
    `px-4 py-2 rounded font-semibold text-white transition-all ${
      color === 'green'
        ? 'bg-green-600 hover:bg-green-700 active:scale-95'
        : color === 'red'
        ? 'bg-red-600 hover:bg-red-700 active:scale-95'
        : 'bg-orange-600 hover:bg-orange-700 active:scale-95'
    }`;

  return (
    <div
      className="p-6 rounded-2xl backdrop-blur-xl border"
      style={{
        background: WPLColors.purpleRGBA[10],
        borderColor: WPLColors.purpleRGBA[30],
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Live Scoring</h2>
            <p style={{ color: WPLColors.textSecondary }}>
              {state.battingTeam === 'team1' ? team1Name : team2Name} batting
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">
              {battingTeam.runs}/{battingTeam.wickets}
            </p>
            <p style={{ color: WPLColors.textSecondary }}>
              {overs}.{balls} ({battingTeam.balls} balls)
            </p>
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Team 1 */}
        <div
          className="p-4 rounded-lg border"
          style={{
            background:
              state.battingTeam === 'team1'
                ? WPLColors.purpleRGBA[20]
                : WPLColors.purpleRGBA[10],
            borderColor: WPLColors.purpleRGBA[20],
            borderWidth: state.battingTeam === 'team1' ? 2 : 1,
          }}
        >
          <p className="font-semibold text-white mb-2">{team1Name}</p>
          <p className="text-2xl font-bold text-white">
            {state.team1.runs}/{state.team1.wickets}
          </p>
          <p style={{ color: WPLColors.textSecondary }} className="text-sm">
            {Math.floor(state.team1.balls / 6)}.{state.team1.balls % 6} overs
          </p>
        </div>

        {/* Team 2 */}
        <div
          className="p-4 rounded-lg border"
          style={{
            background:
              state.battingTeam === 'team2'
                ? WPLColors.purpleRGBA[20]
                : WPLColors.purpleRGBA[10],
            borderColor: WPLColors.purpleRGBA[20],
            borderWidth: state.battingTeam === 'team2' ? 2 : 1,
          }}
        >
          <p className="font-semibold text-white mb-2">{team2Name}</p>
          <p className="text-2xl font-bold text-white">
            {state.team2.runs}/{state.team2.wickets}
          </p>
          <p style={{ color: WPLColors.textSecondary }} className="text-sm">
            {Math.floor(state.team2.balls / 6)}.{state.team2.balls % 6} overs
          </p>
        </div>
      </div>

      {/* Current Players */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-lg" style={{ background: WPLColors.purpleRGBA[10] }}>
          <p style={{ color: WPLColors.textMuted }} className="text-xs font-semibold mb-2">
            BATTER
          </p>
          <p className="font-bold text-white">{state.currentBatter.name}</p>
          <p style={{ color: WPLColors.textSecondary }} className="text-sm">
            {state.currentBatter.runs}({state.currentBatter.balls})
          </p>
        </div>

        <div className="p-4 rounded-lg" style={{ background: WPLColors.purpleRGBA[10] }}>
          <p style={{ color: WPLColors.textMuted }} className="text-xs font-semibold mb-2">
            BOWLER
          </p>
          <p className="font-bold text-white">{state.currentBowler.name}</p>
          <p style={{ color: WPLColors.textSecondary }} className="text-sm">
            {state.currentBowler.runs}({state.currentBowler.balls})
          </p>
        </div>
      </div>

      {/* Ball Entry Buttons */}
      <div className="space-y-4 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Regular Runs</h3>
          <div className="grid grid-cols-5 gap-2">
            <button className={buttonClass('green')} onClick={() => recordBall(0)}>
              Dot
            </button>
            <button className={buttonClass('green')} onClick={() => recordBall(1)}>
              1
            </button>
            <button className={buttonClass('green')} onClick={() => recordBall(2)}>
              2
            </button>
            <button className={buttonClass('green')} onClick={() => recordBall(4)}>
              4
            </button>
            <button className={buttonClass('green')} onClick={() => recordBall(6)}>
              6
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Extras</h3>
          <div className="grid grid-cols-4 gap-2">
            <button className={buttonClass('orange')} onClick={() => recordBall('WD')}>
              Wide
            </button>
            <button className={buttonClass('orange')} onClick={() => recordBall('NB')}>
              No Ball
            </button>
            <button className={buttonClass('orange')} onClick={() => recordBall('B')}>
              Bye
            </button>
            <button className={buttonClass('orange')} onClick={() => recordBall('LB')}>
              Leg Bye
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Other</h3>
          <div className="grid grid-cols-3 gap-2">
            <button className={buttonClass('red')} onClick={() => recordBall('W')}>
              Wicket
            </button>
            <button className={buttonClass('orange')} onClick={undo}>
              <RotateCcw className="w-4 h-4 inline mr-1" /> Undo
            </button>
            <button
              className={buttonClass('orange')}
              onClick={switchBattingTeam}
            >
              <Play className="w-4 h-4 inline mr-1" /> Next Innings
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={async () => {
            if (onSave) {
              setSaving(true);
              try {
                await onSave(state);
                alert('Score saved!');
              } catch (error) {
                alert('Save failed');
              } finally {
                setSaving(false);
              }
            }
          }}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Score'}
        </button>
      </div>

      {/* Ball History */}
      {state.ballHistory.length > 0 && (
        <div className="mt-8 p-4 rounded-lg" style={{ background: WPLColors.purpleRGBA[10] }}>
          <h3 className="text-sm font-semibold text-white mb-2">Ball History</h3>
          <div className="flex flex-wrap gap-2">
            {state.ballHistory.map((ball, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded text-xs font-bold text-white"
                style={{ background: WPLColors.pink }}
              >
                {typeof ball.type === 'number'
                  ? ball.type === 0
                    ? 'Dot'
                    : ball.type
                  : ball.type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-4 text-xs" style={{ color: WPLColors.textSecondary }}>
        <p>Total balls: {state.ballHistory.length}</p>
        <p>Match ID: {matchId}</p>
      </div>
    </div>
  );
}
