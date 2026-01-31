"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import WPLAdminSidebarNew from "@/components/admin/WPLAdminSidebarNew";
import { Player, Team } from "@/types";
import { wplTeams } from '@/data/wpl-teams';
import { api } from "@/lib/data";
import { WPLColors } from "@/lib/wplColors";
import AuroraBackground from "@/components/ui/AuroraBackground";
import { LoadingSpinner } from "@/components/admin/animations";
import { Edit2, Save, X, Users, Trash2, Plus } from "lucide-react";

export default function WPLPlayersManagementPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  // Use an empty string to represent "All Teams" for easier falsy checks and consistent comparisons
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editedTeamId, setEditedTeamId] = useState("");
  const [editedIsCaptain, setEditedIsCaptain] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState<Array<{players: Player[], reason: string}>>([]);
  const [useDeduplicatedView, setUseDeduplicatedView] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    role: "Batter",
    teamId: "",
    age: "",
    nationality: "",
    jerseyNumber: "",
    isCaptain: false,
    bowlingStyle: "N/A",
    battingStyle: "Right-handed bat",
  });

  // Normalize team ID helper (same as playing-11 page)
  const normalizeTeamId = (id: string | number | undefined) => {
    let str = String(id || '').trim();
    if (str.startsWith('Team ')) str = str.replace('Team ', '');
    if (str.toLowerCase().startsWith('team')) str = str.replace(/^team/i, '');
    return str;
  };

  // Deduplicate players based on name, team, and role to handle API duplicates
  const deduplicatePlayers = (playersList: Player[]): Player[] => {
    const seen = new Set<string>();
    const uniquePlayers: Player[] = [];
    
    for (const player of playersList) {
      // Create a unique key based on player name, team, and role
      const playerKey = `${(player.name || '').toLowerCase().trim()}-${normalizeTeamId(player.teamId)}-${(player.role || '').toLowerCase().trim()}`;
      
      if (!seen.has(playerKey)) {
        seen.add(playerKey);
        uniquePlayers.push(player);
      }
    }
    
    return uniquePlayers;
  };

  // Find potential duplicates for admin review (without auto-deleting)
  const findPotentialDuplicates = (playersList: Player[], teamsList: Team[]): Array<{players: Player[], reason: string}> => {
    const groups: { [key: string]: Player[] } = {};
    
    // Group players by similar criteria
    for (const player of playersList) {
      // Group by name and team (same player in same team)
      const nameTeamKey = `${(player.name || '').toLowerCase().trim()}-${normalizeTeamId(player.teamId)}`;
      if (!groups[nameTeamKey]) groups[nameTeamKey] = [];
      groups[nameTeamKey].push(player);
    }
    
    // Find groups with duplicates
    const duplicates = Object.entries(groups)
      .filter(([key, players]) => players.length > 1)
      .map(([key, players]) => {
        const teamName = teamsList.find(t => t.id === players[0].teamId)?.name || 'Unknown Team';
        return {
          players,
          reason: `Same name "${players[0].name}" in team "${teamName}"`
        };
      });
    
    return duplicates;
  };

  // Smart merge for known WPL duplicates with correct team assignments
  const mergeKnownDuplicates = (playersList: Player[], teamsList: Team[]): Player[] => {
    const knownMerges = [
      { name: 'Richa Ghosh', correctTeamId: 'rcb-w', correctTeamName: 'RCB-W' },
      { name: 'Harmanpreet Kaur', correctTeamId: 'mi-w', correctTeamName: 'MI-W' },
      { name: 'Ashleigh Gardner', correctTeamId: 'gg', correctTeamName: 'GG' },
      { name: 'Beth Mooney', correctTeamId: 'gg', correctTeamName: 'GG' }
    ];

    let updatedPlayers = [...playersList];
    
    for (const merge of knownMerges) {
      // Find all duplicates for this player
      const duplicates = updatedPlayers.filter(p => 
        p.name.toLowerCase().trim() === merge.name.toLowerCase().trim()
      );
      
      if (duplicates.length > 1) {
        // Merge duplicates with correct team assignment
        const merged = mergeDuplicatePlayers(duplicates);
        merged.teamId = merge.correctTeamId;
        
        // Remove all duplicates and add merged one
        updatedPlayers = updatedPlayers.filter(p => 
          !duplicates.some(dp => dp.id === p.id)
        );
        updatedPlayers.push(merged);
        
        console.log(`Merged ${duplicates.length} "${merge.name}" entries into team ${merge.correctTeamName}`);
      }
    }
    
    return updatedPlayers;
  };

  // Merge duplicate players (keep the one with most complete data)
  const mergeDuplicatePlayers = (duplicateGroup: Player[]): Player => {
    // Sort by completeness of data (more fields = higher priority)
    const sortedPlayers = duplicateGroup.sort((a: Player, b: Player) => {
      const aScore = [
        a.name ? 1 : 0,
        a.role ? 1 : 0,
        a.age ? 1 : 0,
        a.nationality ? 1 : 0,
        a.jerseyNumber ? 1 : 0,
        a.battingStyle ? 1 : 0,
        a.bowlingStyle ? 1 : 0
      ].reduce((sum, val) => sum + val, 0);
      
      const bScore = [
        b.name ? 1 : 0,
        b.role ? 1 : 0,
        b.age ? 1 : 0,
        b.nationality ? 1 : 0,
        b.jerseyNumber ? 1 : 0,
        b.battingStyle ? 1 : 0,
        b.bowlingStyle ? 1 : 0
      ].reduce((sum, val) => sum + val, 0);
      
      return bScore - aScore;
    });
    
    // Merge data from all duplicates, prioritizing the most complete one
    const merged: Player = { ...sortedPlayers[0] };
    
    // Merge non-null values from other duplicates
    for (const player of sortedPlayers.slice(1)) {
      if (player.age && !merged.age) merged.age = player.age;
      if (player.nationality && !merged.nationality) merged.nationality = player.nationality;
      if (player.jerseyNumber && !merged.jerseyNumber) merged.jerseyNumber = player.jerseyNumber;
      if (player.battingStyle && !merged.battingStyle) merged.battingStyle = player.battingStyle;
      if (player.bowlingStyle && !merged.bowlingStyle) merged.bowlingStyle = player.bowlingStyle;
      if (player.isCaptain && !merged.isCaptain) merged.isCaptain = player.isCaptain;
    }
    
    return merged;
  };

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/wpl-admin-2026");
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  // Load data
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        const [playersData, teamsData] = await Promise.all([
          api.getPlayers(undefined, "wpl"),
          api.getTeams("wpl"),
        ]);
        // Normalize players so teamId is always a string and names exist
        const normalizedPlayers = (playersData || []).map((p: Player) => ({
          ...p,
          teamId: normalizeTeamId(p.teamId),
          name: p.name || "Unknown",
        }));
        
        setPlayers(normalizedPlayers);

        // Deduplicate teams by ID and normalize ids to strings
        const uniqueTeams =
          teamsData?.reduce((acc: Team[], team: Team) => {
            const teamIdStr = normalizeTeamId(team.id as any);
            if (!acc.find((t) => String(t.id) === teamIdStr)) {
              acc.push({ ...team, id: teamIdStr });
            }
            return acc;
          }, []) || [];

        // If teams API returned no WPL teams, fallback to local `wplTeams` data with IDs 11-15
        let finalTeams = uniqueTeams;
        const hasWPL = finalTeams.some(t => t.league === 'wpl');
        if (!hasWPL || finalTeams.length === 0) {
          console.warn('WPL teams missing from API, using local fallback wplTeams');
          finalTeams = wplTeams.map((t, i) => ({ ...t, id: String(11 + i) } as Team));
        }

        setTeams(finalTeams);
        
        // Apply smart merge for known duplicates
        const mergedPlayers = mergeKnownDuplicates(normalizedPlayers, finalTeams);
        setPlayers(mergedPlayers);
        
        // Detect potential duplicates after teams are loaded
        const duplicates = findPotentialDuplicates(mergedPlayers, finalTeams);
        setPotentialDuplicates(duplicates);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setEditedTeamId(player.teamId || "");
    setEditedIsCaptain(player.isCaptain || false);
  };

  const handleSave = async () => {
    if (!editingPlayer || !editedTeamId) return;

    try {
      const token = localStorage.getItem("adminToken");
      const updatedPlayerData = {
        ...editingPlayer,
        teamId: editedTeamId,
        isCaptain: editedIsCaptain,
      };

      const response = await fetch("/api/players", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedPlayerData),
      });

      if (response.ok) {
        const updatedPlayer = await response.json();
        setPlayers(
          players.map((p) => (p.id === editingPlayer.id ? updatedPlayer : p)),
        );
        setEditingPlayer(null);
        alert("Player updated successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to save player"}`);
      }
    } catch (error) {
      console.error("Error saving player:", error);
      alert("Error saving player");
    }
  };

  const handleCancel = () => {
    setEditingPlayer(null);
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.name || !newPlayer.teamId) {
      alert("Please fill in player name and team");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const playerData = {
        ...newPlayer,
        league: "wpl",
        age: parseInt(newPlayer.age) || 0,
        jerseyNumber: parseInt(newPlayer.jerseyNumber) || 0,
        stats: {
          matches: 0,
          runs: 0,
          wickets: 0,
          average: 0,
          strikeRate: 0,
          economy: 0,
          highest: 0,
          fours: 0,
          sixes: 0,
          fifties: 0,
          hundreds: 0,
          bestBowling: "-",
        },
      };

      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(playerData),
      });

      if (response.ok) {
        const createdPlayer = await response.json();
        setPlayers([...players, createdPlayer]);
        setShowAddForm(false);
        setNewPlayer({
          name: "",
          role: "Batter",
          teamId: "",
          age: "",
          nationality: "",
          jerseyNumber: "",
          isCaptain: false,
          bowlingStyle: "N/A",
          battingStyle: "Right-handed bat",
        });
        alert("Player added successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to add player"}`);
      }
    } catch (error) {
      console.error("Error adding player:", error);
      alert("Error adding player");
    }
  };

  const handleDelete = async (player: Player) => {
    if (!confirm(`Are you sure you want to delete ${player.name}?`)) return;

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/players?id=${player.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPlayers(players.filter((p) => p.id !== player.id));
        alert("Player deleted successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to delete player"}`);
      }
    } catch (error) {
      console.error("Error deleting player:", error);
      alert("Error deleting player");
    }
  };

  const filteredPlayers = (() => {
    let playersToFilter = players;
    
    // Apply deduplication if enabled
    if (useDeduplicatedView) {
      playersToFilter = deduplicatePlayers(players);
    }
    
    return playersToFilter.filter((p) => {
      const matchesSearch = (p.name || "")
        .toLowerCase()
        .includes((searchTerm || "").toLowerCase());
      const matchesTeam =
        !selectedTeam ||
        String(p.teamId || "").trim() === String(selectedTeam || "").trim();
      return matchesSearch && matchesTeam;
    });
  })();

  const bgStyle = {
    background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" color={WPLColors.pink} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen" style={bgStyle}>
      <AuroraBackground />
      <WPLAdminSidebarNew />

      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8" style={{ color: WPLColors.pink }} />
              <h1
                className="text-4xl font-bold"
                style={{
                  background: `linear-gradient(to right, ${WPLColors.textPrimary}, ${WPLColors.purple}, ${WPLColors.pink})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Players Management
              </h1>
            </div>
            <p style={{ color: WPLColors.textSecondary }}>
              Edit player team assignments and captain status
            </p>
          </div>

          {/* Duplicate Management Alert */}
          {potentialDuplicates.length > 0 && (
            <div className="mb-6 p-4 rounded-lg border" style={{
              background: 'rgba(255, 193, 7, 0.1)',
              borderColor: 'rgba(255, 193, 7, 0.3)',
            }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: '#FFC107' }} />
                  <span className="text-white font-medium">
                    {potentialDuplicates.length} potential duplicate group{potentialDuplicates.length > 1 ? 's' : ''} found
                  </span>
                </div>
                <button
                  onClick={() => setShowDuplicates(!showDuplicates)}
                  className="px-3 py-1 rounded text-sm font-medium transition-colors"
                  style={{
                    background: 'rgba(255, 193, 7, 0.2)',
                    color: '#FFC107',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                  }}
                >
                  {showDuplicates ? 'Hide' : 'Show'} Details
                </button>
              </div>
              
              {showDuplicates && (
                <div className="space-y-3 mb-4">
                  {potentialDuplicates.map((dup, index) => (
                    <div key={index} className="p-3 rounded border" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}>
                      <div className="text-white text-sm mb-2">{dup.reason}</div>
                      <div className="flex flex-wrap gap-2">
                        {dup.players.map((player, pIndex) => (
                          <div key={pIndex} className="px-2 py-1 rounded text-xs" style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#FFF',
                          }}>
                            ID: {player.id}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            const merged = mergeDuplicatePlayers(dup.players);
                            // Remove all duplicates and add merged one
                            setPlayers(prev => {
                              const otherPlayers = prev.filter(p => 
                                !dup.players.some(dp => dp.id === p.id)
                              );
                              return [...otherPlayers, merged];
                            });
                            // Remove from potential duplicates
                            setPotentialDuplicates(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="px-3 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                        >
                          Merge All
                        </button>
                        <button
                          onClick={() => {
                            // Remove this duplicate group from the list
                            setPotentialDuplicates(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="px-3 py-1 rounded text-xs font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-white text-sm">
                  <input
                    type="checkbox"
                    checked={useDeduplicatedView}
                    onChange={(e) => setUseDeduplicatedView(e.target.checked)}
                    className="rounded"
                  />
                  Hide duplicates in main view
                </label>
                <span className="text-white/60 text-xs">
                  (Total: {players.length} → {deduplicatePlayers(players).length} unique)
                </span>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none"
              style={{
                background: WPLColors.purpleRGBA[20],
                border: `1px solid ${WPLColors.purpleRGBA[30]}`,
              }}
            />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none"
              style={{
                background: WPLColors.purpleRGBA[20],
                border: `1px solid ${WPLColors.purpleRGBA[30]}`,
              }}
            >
              {/* Empty value means 'all teams' */}
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${WPLColors.purple}, ${WPLColors.pink})`,
                color: "white",
              }}
            >
              <Plus className="w-5 h-5" />
              Add Player
            </button>
          </div>

          {/* Add Player Form */}
          {showAddForm && (
            <div
              className="mb-6 rounded-2xl p-6 backdrop-blur-xl border"
              style={{
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.pink,
              }}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Add New Player
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Player Name *"
                  value={newPlayer.name}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, name: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg text-white text-sm focus:outline-none"
                  style={{
                    background: WPLColors.purpleRGBA[20],
                    border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                  }}
                />
                <select
                  value={newPlayer.role}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, role: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg text-white text-sm focus:outline-none"
                  style={{
                    background: WPLColors.purpleRGBA[20],
                    border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                  }}
                >
                  <option value="Batter">Batter</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-rounder">All-rounder</option>
                  <option value="Wicket-keeper">Wicket-keeper</option>
                </select>
                <select
                  value={newPlayer.teamId}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, teamId: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg text-white text-sm focus:outline-none"
                  style={{
                    background: WPLColors.purpleRGBA[20],
                    border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                  }}
                >
                  <option value="">Select Team *</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Age"
                  value={newPlayer.age}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, age: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg text-white text-sm focus:outline-none"
                  style={{
                    background: WPLColors.purpleRGBA[20],
                    border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                  }}
                />
                <input
                  type="text"
                  placeholder="Nationality"
                  value={newPlayer.nationality}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, nationality: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg text-white text-sm focus:outline-none"
                  style={{
                    background: WPLColors.purpleRGBA[20],
                    border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                  }}
                />
                <input
                  type="number"
                  placeholder="Jersey Number"
                  value={newPlayer.jerseyNumber}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, jerseyNumber: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg text-white text-sm focus:outline-none"
                  style={{
                    background: WPLColors.purpleRGBA[20],
                    border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                  }}
                />
                <select
                  value={newPlayer.battingStyle}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, battingStyle: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg text-white text-sm focus:outline-none"
                  style={{
                    background: WPLColors.purpleRGBA[20],
                    border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                  }}
                >
                  <option value="Right-handed bat">Right-handed bat</option>
                  <option value="Left-handed bat">Left-handed bat</option>
                </select>
                <select
                  value={newPlayer.bowlingStyle}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, bowlingStyle: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg text-white text-sm focus:outline-none"
                  style={{
                    background: WPLColors.purpleRGBA[20],
                    border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                  }}
                >
                  <option value="N/A">N/A</option>
                  <option value="Right-arm fast">Right-arm fast</option>
                  <option value="Right-arm medium">Right-arm medium</option>
                  <option value="Right-arm off-break">
                    Right-arm off-break
                  </option>
                  <option value="Right-arm leg-break">
                    Right-arm leg-break
                  </option>
                  <option value="Left-arm fast">Left-arm fast</option>
                  <option value="Left-arm medium">Left-arm medium</option>
                  <option value="Left-arm orthodox">Left-arm orthodox</option>
                  <option value="Left-arm chinaman">Left-arm chinaman</option>
                </select>
                <label
                  className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer"
                  style={{
                    background: WPLColors.purpleRGBA[20],
                    border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newPlayer.isCaptain}
                    onChange={(e) =>
                      setNewPlayer({
                        ...newPlayer,
                        isCaptain: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-white text-sm">Captain</span>
                </label>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAddPlayer}
                  className="px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${WPLColors.purple}, ${WPLColors.pink})`,
                    color: "white",
                  }}
                >
                  <Save className="w-4 h-4" />
                  Add Player
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 rounded-lg font-semibold transition-all"
                  style={{
                    background: WPLColors.purpleRGBA[20],
                    border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                    color: WPLColors.textSecondary,
                  }}
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Players Table */}
          <div
            className="rounded-2xl overflow-hidden backdrop-blur-xl border"
            style={{
              background: WPLColors.purpleRGBA[10],
              borderColor: WPLColors.purpleRGBA[30],
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: `1px solid ${WPLColors.purpleRGBA[30]}`,
                    }}
                  >
                    <th
                      className="px-6 py-3 text-left font-semibold"
                      style={{ color: WPLColors.textPrimary }}
                    >
                      Player Name
                    </th>
                    <th
                      className="px-6 py-3 text-left font-semibold"
                      style={{ color: WPLColors.textPrimary }}
                    >
                      Role
                    </th>
                    <th
                      className="px-6 py-3 text-left font-semibold"
                      style={{ color: WPLColors.textPrimary }}
                    >
                      Current Team
                    </th>
                    <th
                      className="px-6 py-3 text-left font-semibold"
                      style={{ color: WPLColors.textPrimary }}
                    >
                      Captain
                    </th>
                    <th
                      className="px-6 py-3 text-center font-semibold"
                      style={{ color: WPLColors.textPrimary }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => {
                    const currentTeam = teams.find(
                      (t) => t.id === player.teamId,
                    );
                    const isEditing = editingPlayer?.id === player.id;

                    return (
                      <tr
                        key={player.id}
                        style={{
                          borderBottom: `1px solid ${WPLColors.purpleRGBA[30]}`,
                        }}
                      >
                        <td
                          className="px-6 py-4"
                          style={{ color: WPLColors.textSecondary }}
                        >
                          {player.name}
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{ color: WPLColors.textSecondary }}
                        >
                          {player.role}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <select
                              value={editedTeamId}
                              onChange={(e) => setEditedTeamId(e.target.value)}
                              className="px-3 py-2 rounded text-sm text-white"
                              style={{
                                background: WPLColors.purpleRGBA[30],
                                border: `1px solid ${WPLColors.pink}`,
                              }}
                            >
                              <option value="">Select Team</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ color: WPLColors.pink }}>
                              {currentTeam?.name || "Unassigned"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editedIsCaptain}
                                onChange={(e) =>
                                  setEditedIsCaptain(e.target.checked)
                                }
                                className="w-4 h-4 cursor-pointer"
                              />
                              <span style={{ color: WPLColors.textSecondary }}>
                                Captain
                              </span>
                            </label>
                          ) : (
                            <span style={{ color: WPLColors.textSecondary }}>
                              {player.isCaptain ? "👑 Yes" : "No"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={handleSave}
                                className="p-2 rounded hover:opacity-80 transition-opacity"
                                style={{ background: WPLColors.pink }}
                              >
                                <Save className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-2 rounded hover:opacity-80 transition-opacity"
                                style={{ background: WPLColors.purpleRGBA[50] }}
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEdit(player)}
                                className="p-2 rounded hover:opacity-80 transition-opacity"
                                style={{ background: WPLColors.purple }}
                              >
                                <Edit2 className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => handleDelete(player)}
                                className="p-2 rounded hover:opacity-80 transition-opacity"
                                style={{ background: "#ef4444" }}
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredPlayers.length === 0 && (
            <div className="text-center py-8">
              <p style={{ color: WPLColors.textSecondary }}>No players found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
