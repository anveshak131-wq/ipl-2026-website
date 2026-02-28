'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Player {
  id: string;
  name: string;
  team: string;
  role: string;
  isOverseas: boolean;
  isCapped: boolean;
  battingStyle?: string;
  bowlingStyle?: string;
}

interface Match {
  id: string;
  team1: { id: string; name: string; shortName?: string };
  team2: { id: string; name: string; shortName?: string };
  venue: string;
  date: string;
  time: string;
  status?: string;
}

interface PlayingXI {
  playerId: string;
  playerName: string;
  role: string;
  isImpactPlayer: boolean;
  substitutionTime?: string;
}

export default function PlayingElevenPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [team1PlayingXI, setTeam1PlayingXI] = useState<PlayingXI[]>([]);
  const [team2PlayingXI, setTeam2PlayingXI] = useState<PlayingXI[]>([]);
  const [team1ImpactPlayer, setTeam1ImpactPlayer] = useState<string>('');
  const [team2ImpactPlayer, setTeam2ImpactPlayer] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesData, playersData] = await Promise.all([
        api.get('/matches'),
        api.get('/players')
      ]);
      
      setMatches(matchesData.data || []);
      setPlayers(playersData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamPlayers = (teamId: string) => {
    return players.filter(player => player.team === teamId);
  };

  const initializePlayingXI = (teamId: string, isTeam1: boolean) => {
    const teamPlayers = getTeamPlayers(teamId);
    const playingXI: PlayingXI[] = [];
    
    // Initialize with 11 players (can be adjusted based on strategy)
    for (let i = 0; i < Math.min(11, teamPlayers.length); i++) {
      playingXI.push({
        playerId: teamPlayers[i].id,
        playerName: teamPlayers[i].name,
        role: teamPlayers[i].role,
        isImpactPlayer: false
      });
    }
    
    if (isTeam1) {
      setTeam1PlayingXI(playingXI);
    } else {
      setTeam2PlayingXI(playingXI);
    }
  };

  const handleMatchSelect = (match: Match) => {
    setSelectedMatch(match);
    initializePlayingXI(match.team1.id, true);
    initializePlayingXI(match.team2.id, false);
    setTeam1ImpactPlayer('');
    setTeam2ImpactPlayer('');
  };

  const handlePlayerSelection = (playerId: string, isTeam1: boolean) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const playingXI = isTeam1 ? [...team1PlayingXI] : [...team2PlayingXI];
    
    // Check if player is already in playing XI
    const existingIndex = playingXI.findIndex(p => p.playerId === playerId);
    
    if (existingIndex >= 0) {
      // Remove player from playing XI
      playingXI.splice(existingIndex, 1);
    } else if (playingXI.length < 11) {
      // Add player to playing XI
      playingXI.push({
        playerId: player.id,
        playerName: player.name,
        role: player.role,
        isImpactPlayer: false
      });
    }

    if (isTeam1) {
      setTeam1PlayingXI(playingXI);
    } else {
      setTeam2PlayingXI(playingXI);
    }
  };

  const handleImpactPlayerSelection = (playerId: string, isTeam1: boolean) => {
    if (isTeam1) {
      setTeam1ImpactPlayer(playerId);
    } else {
      setTeam2ImpactPlayer(playerId);
    }
  };

  const handleSubstitution = (playerId: string, isTeam1: boolean, substitutionTime: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const playingXI = isTeam1 ? [...team1PlayingXI] : [...team2PlayingXI];
    
    // Find player to replace
    const playerToReplaceIndex = playingXI.findIndex(p => !p.isImpactPlayer);
    
    if (playerToReplaceIndex >= 0) {
      // Mark replaced player as substituted
      playingXI[playerToReplaceIndex] = {
        ...playingXI[playerToReplaceIndex],
        isImpactPlayer: true,
        substitutionTime: substitutionTime
      };
      
      // Add impact player
      const impactPlayerIndex = playingXI.findIndex(p => p.playerId === playerId);
      if (impactPlayerIndex >= 0) {
        playingXI[impactPlayerIndex] = {
          playerId: player.id,
          playerName: player.name,
          role: player.role,
          isImpactPlayer: true,
          substitutionTime: substitutionTime
        };
      }
    }

    if (isTeam1) {
      setTeam1PlayingXI(playingXI);
    } else {
      setTeam2PlayingXI(playingXI);
    }
  };

  const getPlayingXIStats = (playingXI: PlayingXI[]) => {
    const overseasCount = playingXI.filter(p => {
      const player = players.find(pl => pl.id === p.playerId);
      return player?.isOverseas;
    }).length;

    const cappedCount = playingXI.filter(p => {
      const player = players.find(pl => pl.id === p.playerId);
      return player?.isCapped;
    }).length;

    return { overseasCount, cappedCount };
  };

  const validatePlayingXI = (playingXI: PlayingXI[]) => {
    if (playingXI.length !== 11) return false;
    
    const stats = getPlayingXIStats(playingXI);
    return stats.overseasCount <= 4; // Maximum 4 overseas players
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Playing 11 & Impact Player Management</h1>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Playing 11 & Impact Player Management</h1>
        
        {/* Match Selection */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Match</h2>
          <select
            value={selectedMatch?.id || ''}
            onChange={(e) => {
              const match = matches.find(m => m.id === e.target.value);
              if (match) handleMatchSelect(match);
            }}
            className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
          >
            <option value="">Select a match...</option>
            {matches.map(match => (
              <option key={match.id} value={match.id}>
                {match.team1.name} vs {match.team2.name} - {match.date}
              </option>
            ))}
          </select>
        </div>

        {selectedMatch && (
          <>
            {/* Rules Summary */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">IPL Rules Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="font-semibold mb-2">Playing XI Rules</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Exactly 11 players must play</li>
                    <li>• Maximum 4 overseas players allowed</li>
                    <li>• At least 8 local players required</li>
                    <li>• Match fee: INR 7.5 Lakhs per player</li>
                  </ul>
                </div>
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="font-semibold mb-2">Impact Player Rules</h3>
                  <ul className="text-sm space-y-1">
                    <li>• 1 substitution per match</li>
                    <li>• 5 substitutes named before match</li>
                    <li>• Can be introduced: Before innings, after wicket, or end of over</li>
                    <li>• Cannot be captain</li>
                    <li>• Can bat and bowl fully</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Team 1 Playing XI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedMatch.team1.name} - Playing XI
                  <span className={`ml-2 text-sm px-2 py-1 rounded ${
                    validatePlayingXI(team1PlayingXI) ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {team1PlayingXI.length}/11 Valid
                  </span>
                </h2>
                
                {/* Team Players Selection */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Available Players</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {getTeamPlayers(selectedMatch.team1.id).map(player => (
                      <button
                        key={player.id}
                        onClick={() => handlePlayerSelection(player.id, true)}
                        className={`p-2 rounded text-sm ${
                          team1PlayingXI.some(p => p.playerId === player.id)
                            ? 'bg-blue-600'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {player.name}
                        <div className="text-xs text-gray-400">
                          {player.role} {player.isOverseas && '🌍'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Playing XI Display */}
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="font-semibold mb-2">Current Playing XI</h3>
                  <div className="space-y-2">
                    {team1PlayingXI.map((player, index) => (
                      <div
                        key={player.playerId}
                        className={`p-2 rounded flex justify-between items-center ${
                          player.isImpactPlayer ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}
                      >
                        <span>{index + 1}. {player.playerName}</span>
                        <span className="text-sm text-gray-400">
                          {player.role} {player.isImpactPlayer && '⚡'}
                        </span>
                        {player.isImpactPlayer && (
                          <span className="text-xs bg-yellow-700 px-2 py-1 rounded">
                            {player.substitutionTime}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Player Selection */}
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Impact Player</h3>
                  <select
                    value={team1ImpactPlayer}
                    onChange={(e) => handleImpactPlayerSelection(e.target.value, true)}
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
                  >
                    <option value="">Select Impact Player...</option>
                    {getTeamPlayers(selectedMatch.team1.id)
                      .filter(player => !team1PlayingXI.some(p => p.playerId === player.id))
                      .map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.role})
                        </option>
                      ))}
                  </select>
                  
                  {/* Substitution Controls */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleSubstitution(team1ImpactPlayer, true, 'Before Innings')}
                      disabled={!team1ImpactPlayer}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-2 rounded text-sm"
                    >
                      Before Innings
                    </button>
                    <button
                      onClick={() => handleSubstitution(team1ImpactPlayer, true, 'After Wicket')}
                      disabled={!team1ImpactPlayer}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-2 rounded text-sm"
                    >
                      After Wicket
                    </button>
                    <button
                      onClick={() => handleSubstitution(team1ImpactPlayer, true, 'End of Over')}
                      disabled={!team1ImpactPlayer}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-2 rounded text-sm"
                    >
                      End of Over
                    </button>
                  </div>
                </div>

                {/* Stats Display */}
                <div className="mt-4 bg-gray-700 p-4 rounded">
                  <h3 className="font-semibold mb-2">Team Composition</h3>
                  <div className="text-sm space-y-1">
                    <div>Overseas Players: {getPlayingXIStats(team1PlayingXI).overseasCount}/4</div>
                    <div>Capped Players: {getPlayingXIStats(team1PlayingXI).cappedCount}</div>
                    <div>Total Players: {team1PlayingXI.length}/11</div>
                  </div>
                </div>
              </div>

              {/* Team 2 Playing XI - Similar structure */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedMatch.team2.name} - Playing XI
                  <span className={`ml-2 text-sm px-2 py-1 rounded ${
                    validatePlayingXI(team2PlayingXI) ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {team2PlayingXI.length}/11 Valid
                  </span>
                </h2>
                
                {/* Similar structure for Team 2 */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Available Players</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {getTeamPlayers(selectedMatch.team2.id).map(player => (
                      <button
                        key={player.id}
                        onClick={() => handlePlayerSelection(player.id, false)}
                        className={`p-2 rounded text-sm ${
                          team2PlayingXI.some(p => p.playerId === player.id)
                            ? 'bg-blue-600'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {player.name}
                        <div className="text-xs text-gray-400">
                          {player.role} {player.isOverseas && '🌍'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="font-semibold mb-2">Current Playing XI</h3>
                  <div className="space-y-2">
                    {team2PlayingXI.map((player, index) => (
                      <div
                        key={player.playerId}
                        className={`p-2 rounded flex justify-between items-center ${
                          player.isImpactPlayer ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}
                      >
                        <span>{index + 1}. {player.playerName}</span>
                        <span className="text-sm text-gray-400">
                          {player.role} {player.isImpactPlayer && '⚡'}
                        </span>
                        {player.isImpactPlayer && (
                          <span className="text-xs bg-yellow-700 px-2 py-1 rounded">
                            {player.substitutionTime}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Similar Impact Player and Stats for Team 2 */}
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Impact Player</h3>
                  <select
                    value={team2ImpactPlayer}
                    onChange={(e) => handleImpactPlayerSelection(e.target.value, false)}
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
                  >
                    <option value="">Select Impact Player...</option>
                    {getTeamPlayers(selectedMatch.team2.id)
                      .filter(player => !team2PlayingXI.some(p => p.playerId === player.id))
                      .map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.role})
                        </option>
                      ))}
                  </select>
                  
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleSubstitution(team2ImpactPlayer, false, 'Before Innings')}
                      disabled={!team2ImpactPlayer}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-2 rounded text-sm"
                    >
                      Before Innings
                    </button>
                    <button
                      onClick={() => handleSubstitution(team2ImpactPlayer, false, 'After Wicket')}
                      disabled={!team2ImpactPlayer}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-2 rounded text-sm"
                    >
                      After Wicket
                    </button>
                    <button
                      onClick={() => handleSubstitution(team2ImpactPlayer, false, 'End of Over')}
                      disabled={!team2ImpactPlayer}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-2 rounded text-sm"
                    >
                      End of Over
                    </button>
                  </div>
                </div>

                <div className="mt-4 bg-gray-700 p-4 rounded">
                  <h3 className="font-semibold mb-2">Team Composition</h3>
                  <div className="text-sm space-y-1">
                    <div>Overseas Players: {getPlayingXIStats(team2PlayingXI).overseasCount}/4</div>
                    <div>Capped Players: {getPlayingXIStats(team2PlayingXI).cappedCount}</div>
                    <div>Total Players: {team2PlayingXI.length}/11</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
