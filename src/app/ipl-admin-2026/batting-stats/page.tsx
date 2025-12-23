'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ModernDialog from '@/components/admin/ModernDialog';
import LeagueSwitch from '@/components/admin/LeagueSwitch';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import { formatDateMonthDDYYYY, parseDateMonthDDYYYY, calculateAge } from '@/lib/dateUtils';
import { CustomEmoji } from '@/components/emoji/Emoji';
import FlagImage from '@/components/ui/FlagImage';
import '@/styles/flags.css';

const BattingStatsPage = () => {
  console.log('BattingStatsPage component rendered!');
  const { currentLeague } = useLeague();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    teamId: '',
    league: currentLeague,
    age: '',
    dateOfBirth: '',
    nationality: '',
    jerseyNumber: '',
    isCaptain: false,
    battingStyle: '',
    bowlingStyle: '',
    customBowlingStyle: '',
    stats: {
      matches: '',
      battingInnings: '',
      notOuts: '',
      runs: '',
      ballsFaced: '',
      highest: '',
      fours: '',
      sixes: '',
      fifties: '',
      hundreds: '',
      battingAverage: '',
      battingStrikeRate: '',
      // Bowling stats (empty for batting page)
      bowlingInnings: '',
      balls: '',
      maidens: '',
      runsConceded: '',
      wickets: '',
      bowlingAverage: '',
      bowlingStrikeRate: '',
      economy: '',
      bestBowling: '',
      fiveWickets: '',
    }
  });

  useEffect(() => {
    if (currentLeague) {
      loadData();
    }
  }, [currentLeague]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data for league:', currentLeague);
      
      const [playersData, teamsData] = await Promise.all([
        api.getPlayers(currentLeague),
        api.getTeams(currentLeague)
      ]);
      
      console.log('Players loaded:', playersData.length, playersData);
      console.log('Teams loaded:', teamsData.length, teamsData);
      
      setPlayers(playersData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group players by team
  const playersByTeam = teams.map(team => ({
    team,
    players: players.filter(player => player.teamId === team.id)
  })).filter(teamGroup => teamGroup.players.length > 0);

  console.log('Players by team:', playersByTeam);

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    
    // Load player data into form
    const dobFormatted = player.dateOfBirth 
      ? formatDateMonthDDYYYY(player.dateOfBirth)
      : '';
    
    setFormData({
      name: player.name,
      role: player.role,
      teamId: player.teamId,
      league: player.league,
      age: player.age > 0 ? player.age.toString() : '',
      dateOfBirth: dobFormatted,
      nationality: player.nationality,
      jerseyNumber: player.jerseyNumber > 0 ? player.jerseyNumber.toString() : '',
      isCaptain: player.isCaptain || false,
      battingStyle: player.battingStyle || '',
      bowlingStyle: player.bowlingStyle || '',
      customBowlingStyle: '',
      stats: {
        matches: player.stats.matches.toString(),
        battingInnings: player.stats.battingInnings?.toString() || '',
        notOuts: player.stats.notOuts?.toString() || '',
        runs: player.stats.runs.toString(),
        ballsFaced: player.stats.ballsFaced?.toString() || '',
        highest: player.stats.highest || '',
        fours: player.stats.fours.toString(),
        sixes: player.stats.sixes.toString(),
        fifties: player.stats.fifties.toString(),
        hundreds: player.stats.hundreds.toString(),
        battingAverage: player.stats.battingAverage?.toString() || '',
        battingStrikeRate: player.stats.battingStrikeRate?.toString() || '',
        // Bowling stats (empty for batting page)
        bowlingInnings: '',
        balls: '',
        maidens: '',
        runsConceded: '',
        wickets: '',
        bowlingAverage: '',
        bowlingStrikeRate: '',
        economy: '',
        bestBowling: '',
        fiveWickets: '',
      }
    });
    setShowEditDialog(true);
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;

    try {
      const updatedPlayer = {
        ...editingPlayer,
        ...formData,
        age: parseInt(formData.age) || 0,
        jerseyNumber: parseInt(formData.jerseyNumber) || 0,
        stats: {
          ...editingPlayer.stats,
          matches: parseInt(formData.stats.matches) || 0,
          battingInnings: parseInt(formData.stats.battingInnings) || 0,
          notOuts: parseInt(formData.stats.notOuts) || 0,
          runs: parseInt(formData.stats.runs) || 0,
          ballsFaced: parseInt(formData.stats.ballsFaced) || 0,
          highest: formData.stats.highest || '0',
          fours: parseInt(formData.stats.fours) || 0,
          sixes: parseInt(formData.stats.sixes) || 0,
          fifties: parseInt(formData.stats.fifties) || 0,
          hundreds: parseInt(formData.stats.hundreds) || 0,
          battingAverage: parseFloat(formData.stats.battingAverage) || 0,
          battingStrikeRate: parseFloat(formData.stats.battingStrikeRate) || 0,
          // Preserve existing bowling stats
          bowlingInnings: editingPlayer.stats.bowlingInnings || 0,
          balls: editingPlayer.stats.balls || 0,
          maidens: editingPlayer.stats.maidens || 0,
          runsConceded: editingPlayer.stats.runsConceded || 0,
          wickets: editingPlayer.stats.wickets || 0,
          bowlingAverage: editingPlayer.stats.bowlingAverage || 0,
          bowlingStrikeRate: editingPlayer.stats.bowlingStrikeRate || 0,
          economy: editingPlayer.stats.economy || 0,
          bestBowling: editingPlayer.stats.bestBowling || '',
          fiveWickets: editingPlayer.stats.fiveWickets || 0,
        }
      };

      await api.updatePlayer(editingPlayer.id, updatedPlayer);
      await loadData();
      setShowEditDialog(false);
      setEditingPlayer(null);
    } catch (error) {
      console.error('Failed to update player:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-900">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Loading batting stats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Batting Statistics</h1>
            <p className="text-gray-400">Manage player batting statistics by team</p>
          </div>
          <LeagueSwitch />
        </div>

        {playersByTeam.map(({ team, players: teamPlayers }) => (
          <div key={team.id} className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {team.shortName}
              </div>
              <h2 className="text-2xl font-bold text-white ml-4">{team.name}</h2>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Player</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Age</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Matches</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Runs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Average</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Strike Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">50s/100s</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {teamPlayers.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {player.name.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-white">{player.name}</div>
                              <div className="text-sm text-gray-400">#{player.jerseyNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.age || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats.matches}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats.runs}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats.battingAverage || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats.battingStrikeRate || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats.fifties}/{player.stats.hundreds}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleEditPlayer(player)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

        {/* Edit Player Dialog */}
        <ModernDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          title={`Edit Player - ${editingPlayer?.name}`}
        >
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select Role</option>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-rounder">All-rounder</option>
                  <option value="Wicket-keeper">Wicket-keeper</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Matches</label>
                <input
                  type="number"
                  value={formData.stats.matches}
                  onChange={(e) => setFormData({...formData, stats: {...formData.stats, matches: e.target.value}})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Runs</label>
                <input
                  type="number"
                  value={formData.stats.runs}
                  onChange={(e) => setFormData({...formData, stats: {...formData.stats, runs: e.target.value}})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Batting Average</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.stats.battingAverage}
                  onChange={(e) => setFormData({...formData, stats: {...formData.stats, battingAverage: e.target.value}})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Strike Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.stats.battingStrikeRate}
                  onChange={(e) => setFormData({...formData, stats: {...formData.stats, battingStrikeRate: e.target.value}})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">50s</label>
                <input
                  type="number"
                  value={formData.stats.fifties}
                  onChange={(e) => setFormData({...formData, stats: {...formData.stats, fifties: e.target.value}})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">100s</label>
                <input
                  type="number"
                  value={formData.stats.hundreds}
                  onChange={(e) => setFormData({...formData, stats: {...formData.stats, hundreds: e.target.value}})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setShowEditDialog(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePlayer}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Player
            </button>
          </div>
        </ModernDialog>
      </div>
    </div>
  );
};

export default BattingStatsPage;
