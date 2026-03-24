'use client';

import { useState } from 'react';
import { ArrowLeftRight, CheckCircle } from 'lucide-react';
import { Player } from '@/types';

interface ImpactPlayerSelectorProps {
  teamId: string;
  teamName: string;
  players: Player[];
  playing11: string[]; // Player IDs in playing 11
  onSubstitute: (originalPlayerId: string, impactPlayerId: string, substitutionTime: string) => void;
  currentSubstitution?: {
    original: string;
    impact: string;
    substitutedAt: number;
    substitutionTime?: string;
  };
}

export default function ImpactPlayerSelector({
  teamId,
  teamName,
  players,
  playing11,
  onSubstitute,
  currentSubstitution,
}: ImpactPlayerSelectorProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [selectedOriginal, setSelectedOriginal] = useState<string | null>(null);
  const [selectedImpact, setSelectedImpact] = useState<string | null>(null);
  const [substitutionTime, setSubstitutionTime] = useState<string>('End of Over');

  // Filter players for this team
  const teamPlayers = players.filter((p) => String(p.teamId) === String(teamId));

  // Players in playing 11
  const playing11Players = teamPlayers.filter(p => playing11.includes(p.id));

  // Players not in playing 11 (available as Impact Player)
  const impactPlayerOptions = teamPlayers.filter(p => !playing11.includes(p.id));

  const canSubstitute = selectedOriginal && selectedImpact && substitutionTime && !currentSubstitution;

  const handleSubstitute = () => {
    if (selectedOriginal && selectedImpact) {
      onSubstitute(selectedOriginal, selectedImpact, substitutionTime);
      setShowSelector(false);
      setSelectedOriginal(null);
      setSelectedImpact(null);
    }
  };

  return (
    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-green-400" />
          <span className="text-white font-semibold">Impact Player</span>
          <span className="text-gray-400 text-sm">({teamName})</span>
        </div>
        {currentSubstitution ? (
          <div className="flex items-center gap-2 text-green-300 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Substituted</span>
          </div>
        ) : (
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="text-green-300 hover:text-green-200 text-sm font-semibold"
          >
            {showSelector ? 'Cancel' : 'Substitute'}
          </button>
        )}
      </div>

      {currentSubstitution ? (
        <div className="bg-green-500/30 rounded-lg p-3">
          <div className="text-sm text-gray-300 space-y-1">
            <div>
              <span className="text-gray-400">Original:</span>{' '}
              <span className="text-white font-semibold">
                {teamPlayers.find(p => p.id === currentSubstitution.original)?.name || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Impact Player:</span>{' '}
              <span className="text-white font-semibold">
                {teamPlayers.find(p => p.id === currentSubstitution.impact)?.name || 'Unknown'}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Substituted at: {new Date(currentSubstitution.substitutedAt).toLocaleTimeString()}
            </div>
            {currentSubstitution.substitutionTime && (
              <div className="text-xs text-gray-400">
                When: {currentSubstitution.substitutionTime}
              </div>
            )}
          </div>
        </div>
      ) : showSelector ? (
        <div className="space-y-3">
          {/* Select Original Player */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Select Player to Replace</label>
            <select
              value={selectedOriginal || ''}
              onChange={(e) => setSelectedOriginal(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select player...</option>
              {playing11Players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.role})
                </option>
              ))}
            </select>
          </div>

          {/* Select Impact Player */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Select Impact Player</label>
            <select
              value={selectedImpact || ''}
              onChange={(e) => setSelectedImpact(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select impact player...</option>
              {impactPlayerOptions.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.role})
                </option>
              ))}
              </select>
          </div>

          {/* Substitution Timing */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Substitution Timing</label>
            <select
              value={substitutionTime}
              onChange={(e) => setSubstitutionTime(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="Before Innings">Before Innings</option>
              <option value="End of Over">End of Over</option>
              <option value="After Wicket">After Wicket</option>
              <option value="Batter Retired">Batter Retired</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {impactPlayerOptions.length === 0 && (
            <div className="text-yellow-300 text-sm">
              ⚠️ No players available as Impact Player. Ensure players are in the squad but not in Playing 11.
            </div>
          )}

          <button
            onClick={handleSubstitute}
            disabled={!canSubstitute}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
              canSubstitute
                ? 'bg-green-500 hover:bg-green-600 text-white hover:scale-105'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 inline mr-2" />
            Confirm Substitution
          </button>
        </div>
      ) : (
        <div className="text-gray-400 text-sm">
          Click "Substitute" to replace a player with Impact Player
        </div>
      )}
    </div>
  );
}
