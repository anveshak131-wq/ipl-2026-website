'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Team data interface
interface Team {
  id: string;
  name: string;
  matches: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  points: number;
  netRunRate: number;
  position?: number;
}

// IPL Teams Data
const IPL_TEAMS = [
  { id: 'rcb', name: 'Royal Challengers Bangalore' },
  { id: 'mi', name: 'Mumbai Indians' },
  { id: 'csk', name: 'Chennai Super Kings' },
  { id: 'kkr', name: 'Kolkata Knight Riders' },
  { id: 'srh', name: 'Sunrisers Hyderabad' },
  { id: 'rr', name: 'Rajasthan Royals' },
  { id: 'dc', name: 'Delhi Capitals' },
  { id: 'lsg', name: 'Lucknow Super Giants' },
  { id: 'pbks', name: 'Punjab Kings' },
  { id: 'gt', name: 'Gujarat Titans' },
];

export default function PointsTablePage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    matches: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    noResults: 0,
    netRunRate: 0.0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeamId, setNewTeamId] = useState('rcb');

  // Generate available years (2008 to current year)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2008; year <= currentYear; year++) {
      years.push(year);
    }
    setAvailableYears(years);
    setSelectedYear(currentYear);
  }, []);

  // Load data from localStorage on initial load
  useEffect(() => {
    if (selectedYear) {
      const savedData = localStorage.getItem(`iplPointsTable${selectedYear}`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setTeams(calculatePositions(parsedData));
        } catch (error) {
          console.error('Error parsing saved data:', error);
        }
      } else {
        // Initialize with default data if no saved data exists
        const initialData = IPL_TEAMS.map(team => ({
          id: team.id,
          name: team.name,
          matches: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          noResults: 0,
          points: 0,
          netRunRate: 0.0,
        }));
        setTeams(calculatePositions(initialData));
      }
      setLoading(false);
    }
  }, [selectedYear]);

  // Save data to localStorage whenever teams change
  useEffect(() => {
    if (!loading && selectedYear) {
      localStorage.setItem(`iplPointsTable${selectedYear}`, JSON.stringify(teams));
    }
  }, [teams, loading, selectedYear]);

  // Calculate team positions based on points and NRR
  const calculatePositions = (teamsData: Team[]): Team[] => {
    return [...teamsData]
      .map(team => ({
        ...team,
        // Calculate points: 2 for win, 1 for tie/no result, 0 for loss
        points: team.wins * 2 + team.ties * 1 + team.noResults * 1,
      }))
      .sort((a, b) => {
        // First by points (descending)
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        // Then by net run rate (descending)
        return b.netRunRate - a.netRunRate;
      })
      .map((team, index) => ({
        ...team,
        position: index + 1,
      }));
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string | number) => {
    // Validate numeric input
    if (field !== 'netRunRate' && typeof value === 'string') {
      const numValue = parseInt(value) || 0;
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else if (field === 'netRunRate' && typeof value === 'string') {
      const floatValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [field]: floatValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate matches
    if (formData.matches < 0) {
      newErrors.matches = 'Matches cannot be negative';
    }
    
    // Validate wins
    if (formData.wins < 0) {
      newErrors.wins = 'Wins cannot be negative';
    }
    
    // Validate losses
    if (formData.losses < 0) {
      newErrors.losses = 'Losses cannot be negative';
    }
    
    // Validate ties
    if (formData.ties < 0) {
      newErrors.ties = 'Ties cannot be negative';
    }
    
    // Validate no results
    if (formData.noResults < 0) {
      newErrors.noResults = 'No Results cannot be negative';
    }
    
    // Validate that wins + losses + ties + noResults <= matches
    const totalResults = formData.wins + formData.losses + formData.ties + formData.noResults;
    if (totalResults > formData.matches) {
      newErrors.results = 'Total results cannot exceed matches played';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle edit team
  const handleEdit = (teamId: string) => {
    const teamToEdit = teams.find(team => team.id === teamId);
    if (teamToEdit) {
      setEditingTeam(teamId);
      setFormData({
        matches: teamToEdit.matches,
        wins: teamToEdit.wins,
        losses: teamToEdit.losses,
        ties: teamToEdit.ties,
        noResults: teamToEdit.noResults,
        netRunRate: teamToEdit.netRunRate,
      });
    }
  };

  // Handle save team data
  const handleSave = (teamId: string) => {
    if (!validateForm()) {
      return;
    }
    
    const updatedTeams = teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          ...formData,
        };
      }
      return team;
    });
    
    setTeams(calculatePositions(updatedTeams));
    setEditingTeam(null);
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditingTeam(null);
    setErrors({});
  };

  // Handle delete team data
  const handleDelete = (teamId: string) => {
    if (confirm('Are you sure you want to reset this team\'s data? This cannot be undone.')) {
      const updatedTeams = teams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            matches: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            noResults: 0,
            points: 0,
            netRunRate: 0.0,
          };
        }
        return team;
      });
      
      setTeams(calculatePositions(updatedTeams));
    }
  };

  // Handle add new team
  const handleAddTeam = () => {
    if (!validateForm()) {
      return;
    }
    
    const teamExists = teams.some(team => team.id === newTeamId);
    if (teamExists) {
      alert('This team already exists in the points table.');
      return;
    }
    
    const teamName = IPL_TEAMS.find(team => team.id === newTeamId)?.name || 'Unknown Team';
    
    const newTeam: Team = {
      id: newTeamId,
      name: teamName,
      ...formData,
      points: formData.wins * 2 + formData.ties * 1 + formData.noResults * 1,
    };
    
    const updatedTeams = [...teams, newTeam];
    setTeams(calculatePositions(updatedTeams));
    setShowAddForm(false);
    setNewTeamId('rcb');
    setFormData({
      matches: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      noResults: 0,
      netRunRate: 0.0,
    });
  };

  // Handle reset all data
  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset ALL team data? This cannot be undone.')) {
      const resetTeams = IPL_TEAMS.map(team => ({
        id: team.id,
        name: team.name,
        matches: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        noResults: 0,
        points: 0,
        netRunRate: 0.0,
      }));
      setTeams(calculatePositions(resetTeams));
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">IPL {selectedYear} Points Table - Admin Panel</h1>
          <p className="text-gray-400">Manage team standings with full CRUD functionality</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Year Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Season Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="relative max-w-md flex-1 min-w-[250px]">
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
          
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Team
          </button>
          
          <button
            onClick={handleResetAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reset All
          </button>
        </div>

        {/* Add Team Form */}
        {showAddForm && (
          <div className="mb-6 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Add New Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Team</label>
                <select
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {IPL_TEAMS.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Matches Played</label>
                <input
                  type="number"
                  min="0"
                  value={formData.matches}
                  onChange={(e) => handleInputChange('matches', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.matches && <p className="text-red-400 text-sm mt-1">{errors.matches}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Wins</label>
                <input
                  type="number"
                  min="0"
                  value={formData.wins}
                  onChange={(e) => handleInputChange('wins', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.wins && <p className="text-red-400 text-sm mt-1">{errors.wins}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Losses</label>
                <input
                  type="number"
                  min="0"
                  value={formData.losses}
                  onChange={(e) => handleInputChange('losses', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.losses && <p className="text-red-400 text-sm mt-1">{errors.losses}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Ties</label>
                <input
                  type="number"
                  min="0"
                  value={formData.ties}
                  onChange={(e) => handleInputChange('ties', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.ties && <p className="text-red-400 text-sm mt-1">{errors.ties}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">No Results</label>
                <input
                  type="number"
                  min="0"
                  value={formData.noResults}
                  onChange={(e) => handleInputChange('noResults', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.noResults && <p className="text-red-400 text-sm mt-1">{errors.noResults}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Net Run Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.netRunRate}
                  onChange={(e) => handleInputChange('netRunRate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {errors.results && <p className="text-red-400 text-sm mb-4">{errors.results}</p>}
            
            <div className="flex gap-2">
              <button
                onClick={handleAddTeam}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Team
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
                <th className="text-center p-4 text-gray-300 font-medium">T</th>
                <th className="text-center p-4 text-gray-300 font-medium">NR</th>
                <th className="text-center p-4 text-gray-300 font-medium">PTS</th>
                <th className="text-center p-4 text-gray-300 font-medium">NRR</th>
                <th className="text-center p-4 text-gray-300 font-medium">Actions</th>
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
                          {team.position || '?'}
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
                          team.id === 'lsg' ? 'from-green-500 to-green-600' :
                          team.id === 'pbks' ? 'from-red-600 to-red-700' :
                          team.id === 'gt' ? 'from-blue-400 to-blue-500' :
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
                    <td className="p-4 text-center">{team.ties}</td>
                    <td className="p-4 text-center">{team.noResults}</td>
                    <td className="p-4 text-center font-bold">{team.points}</td>
                    <td className="p-4 text-center">
                      <span className={team.netRunRate > 0 ? 'text-green-400' : 'text-red-400'}>{
                        team.netRunRate > 0 ? '+' : ''
                      }{team.netRunRate.toFixed(2)}</span>
                    </td>
                    <td className="p-4 text-center">
                      {editingTeam === team.id ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleSave(team.id)}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title="Save"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            title="Cancel"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(team.id)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(team.id)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="Reset"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400">
                    No teams found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Form (shown when editing a team) */}
        {editingTeam && (
          <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Edit Team Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Matches Played</label>
                <input
                  type="number"
                  min="0"
                  value={formData.matches}
                  onChange={(e) => handleInputChange('matches', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.matches && <p className="text-red-400 text-sm mt-1">{errors.matches}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Wins</label>
                <input
                  type="number"
                  min="0"
                  value={formData.wins}
                  onChange={(e) => handleInputChange('wins', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.wins && <p className="text-red-400 text-sm mt-1">{errors.wins}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Losses</label>
                <input
                  type="number"
                  min="0"
                  value={formData.losses}
                  onChange={(e) => handleInputChange('losses', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.losses && <p className="text-red-400 text-sm mt-1">{errors.losses}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Ties</label>
                <input
                  type="number"
                  min="0"
                  value={formData.ties}
                  onChange={(e) => handleInputChange('ties', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.ties && <p className="text-red-400 text-sm mt-1">{errors.ties}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">No Results</label>
                <input
                  type="number"
                  min="0"
                  value={formData.noResults}
                  onChange={(e) => handleInputChange('noResults', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.noResults && <p className="text-red-400 text-sm mt-1">{errors.noResults}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Net Run Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.netRunRate}
                  onChange={(e) => handleInputChange('netRunRate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {errors.results && <p className="text-red-400 text-sm mb-4">{errors.results}</p>}
            
            <p className="text-sm text-gray-400 mb-4">
              <strong>Note:</strong> Points are calculated automatically (2 for win, 1 for tie/no result). Team positions are determined by points first, then net run rate.
            </p>
          </div>
        )}

        {/* Points System Legend */}
        <div className="mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Points System & Position Rules</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
          
          <div className="text-sm text-gray-300 space-y-2">
            <p><strong>Position Rules:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Teams are ranked by total points (descending)</li>
              <li>If points are equal, teams are ranked by Net Run Rate (descending)</li>
              <li>If both points and NRR are equal, teams share the same position</li>
              <li>Top 4 teams qualify for playoffs</li>
            </ol>
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