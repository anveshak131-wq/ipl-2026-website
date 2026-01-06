'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Simple Points Table Page - Completely New Implementation
export default function PointsTablePage() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample data for points table
  const sampleTeams = [
    { id: 'rcb', name: 'Royal Challengers Bangalore', matches: 8, wins: 5, losses: 3, points: 10, nrr: 0.75 },
    { id: 'mi', name: 'Mumbai Indians', matches: 8, wins: 4, losses: 4, points: 8, nrr: -0.15 },
    { id: 'csk', name: 'Chennai Super Kings', matches: 8, wins: 4, losses: 4, points: 8, nrr: 0.30 },
    { id: 'kkr', name: 'Kolkata Knight Riders', matches: 8, wins: 3, losses: 5, points: 6, nrr: -0.45 },
    { id: 'srh', name: 'Sunrisers Hyderabad', matches: 8, wins: 3, losses: 5, points: 6, nrr: -0.60 },
    { id: 'rr', name: 'Rajasthan Royals', matches: 8, wins: 3, losses: 5, points: 6, nrr: 0.10 },
    { id: 'dc', name: 'Delhi Capitals', matches: 8, wins: 2, losses: 6, points: 4, nrr: -0.85 },
  ];

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      try {
        // In a real app, this would be an API call
        // For now, use sample data
        const sortedTeams = [...sampleTeams].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.nrr - a.nrr;
        });
        
        setTeams(sortedTeams.map((team, index) => ({ ...team, position: index + 1 })));
        setLoading(false);
      } catch (err) {
        setError('Failed to load points table data');
        setLoading(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Points Table</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center text-gray-400">Loading points table...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Points Table</h1>
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">IPL 2026 Points Table</h1>
          <p className="text-gray-400">Indian Premier League Season Standings</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Points Table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left p-4 text-gray-300 font-medium">Pos</th>
                <th className="text-left p-4 text-gray-300 font-medium">Team</th>
                <th className="text-center p-4 text-gray-300 font-medium">M</th>
                <th className="text-center p-4 text-gray-300 font-medium">W</th>
                <th className="text-center p-4 text-gray-300 font-medium">L</th>
                <th className="text-center p-4 text-gray-300 font-medium">PTS</th>
                <th className="text-center p-4 text-gray-300 font-medium">NRR</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.length > 0 ? (
                filteredTeams.map((team) => (
                  <tr key={team.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="p-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        team.position === 1 ? 'bg-yellow-500 text-black' :
                        team.position === 2 ? 'bg-gray-400 text-white' :
                        team.position === 3 ? 'bg-orange-600 text-white' :
                        team.position === 4 ? 'bg-blue-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {team.position}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                          team.id === 'rcb' ? 'from-red-500 to-red-600' :
                          team.id === 'mi' ? 'from-blue-500 to-blue-600' :
                          team.id === 'csk' ? 'from-yellow-500 to-yellow-600' :
                          team.id === 'kkr' ? 'from-purple-500 to-purple-600' :
                          team.id === 'srh' ? 'from-orange-500 to-orange-600' :
                          team.id === 'rr' ? 'from-pink-500 to-pink-600' :
                          team.id === 'dc' ? 'from-indigo-500 to-indigo-600' :
                          'from-gray-500 to-gray-600'
                        } flex items-center justify-center text-white font-bold text-xs`}>
                          {team.id.toUpperCase()}
                        </div>
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">{team.matches}</td>
                    <td className="p-4 text-center">{team.wins}</td>
                    <td className="p-4 text-center">{team.losses}</td>
                    <td className="p-4 text-center font-bold">{team.points}</td>
                    <td className="p-4 text-center">
                      <span className={team.nrr > 0 ? 'text-green-400' : 'text-red-400'}>{
                        team.nrr > 0 ? '+' : ''
                      }{team.nrr.toFixed(2)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    No teams found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Points System Legend */}
        <div className="mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Points System</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">2</div>
              <div className="text-white font-medium">Win</div>
              <div className="text-gray-400 text-sm">2 points</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">0</div>
              <div className="text-white font-medium">Loss</div>
              <div className="text-gray-400 text-sm">0 points</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold mx-auto mb-2">1</div>
              <div className="text-white font-medium">Tie/NR</div>
              <div className="text-gray-400 text-sm">1 point each</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">NRR</div>
              <div className="text-white font-medium">Net RR</div>
              <div className="text-gray-400 text-sm">Tie-breaker</div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/ipl-admin-2026/dashboard')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}