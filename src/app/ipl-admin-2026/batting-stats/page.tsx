'use client';

const BattingStatsPage = () => {
  // Mock data for testing
  const mockTeams = [
    {
      id: '1',
      name: 'Royal Challengers Bengaluru',
      shortName: 'RCB'
    },
    {
      id: '2', 
      name: 'Mumbai Indians',
      shortName: 'MI'
    }
  ];

  const mockPlayers = [
    {
      id: '1',
      name: 'Virat Kohli',
      role: 'Batsman',
      age: 35,
      jerseyNumber: 18,
      teamId: '1',
      stats: {
        matches: 237,
        runs: 7263,
        battingAverage: 36.2,
        battingStrikeRate: 129.4,
        fifties: 64,
        hundreds: 7
      }
    },
    {
      id: '2',
      name: 'Rohit Sharma',
      role: 'Batsman',
      age: 36,
      jerseyNumber: 45,
      teamId: '2',
      stats: {
        matches: 243,
        runs: 6211,
        battingAverage: 30.3,
        battingStrikeRate: 130.1,
        fifties: 42,
        hundreds: 1
      }
    }
  ];

  // Group players by team
  const playersByTeam = mockTeams.map(team => ({
    team,
    players: mockPlayers.filter(player => player.teamId === team.id)
  }));

  return (
    <div className="flex min-h-screen bg-gray-900">
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Batting Statistics</h1>
        <p className="text-gray-400 mb-8">Manage player batting statistics by team</p>

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
                          {player.age}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats.matches}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats.runs}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats.battingAverage}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats.battingStrikeRate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats.fifties}/{player.stats.hundreds}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattingStatsPage;
