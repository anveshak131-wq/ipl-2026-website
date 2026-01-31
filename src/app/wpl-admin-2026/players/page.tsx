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
  const [showEnhancedEditor, setShowEnhancedEditor] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<'basic' | 'style' | 'advanced'>('basic');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [playerStatistics, setPlayerStatistics] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Enhanced editing state
  const [enhancedEditedPlayer, setEnhancedEditedPlayer] = useState({
    name: "",
    role: "Batter",
    teamId: "",
    age: "",
    nationality: "",
    jerseyNumber: "",
    isCaptain: false,
    bowlingStyle: "N/A",
    battingStyle: "Right-handed bat",
    specialization: ""
  });
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

  // Validation function for enhanced player editor
  const validateEnhancedPlayer = (player: typeof enhancedEditedPlayer) => {
    const errors = [];
    
    // Name validation
    if (!player.name || player.name.length < 2) {
      errors.push("Player name is required and must be at least 2 characters");
    }
    
    // Age validation
    if (player.age && (parseInt(player.age) < 15 || parseInt(player.age) > 50)) {
      errors.push("Age must be between 15 and 50");
    }
    
    // Jersey number validation
    if (player.jerseyNumber && (parseInt(player.jerseyNumber) < 0 || parseInt(player.jerseyNumber) > 99)) {
      errors.push("Jersey number must be between 0 and 99");
    }
    
    // Nationality validation
    if (!player.nationality) {
      errors.push("Nationality is required");
    }
    
    // Role consistency check
    if (player.role === 'Wicket-keeper' && player.bowlingStyle !== 'N/A') {
      errors.push("Wicket-keepers should have bowling style set to N/A");
    }
    
    return errors;
  };

  // Get nationality flag emoji
  const getNationalityFlag = (nationality: string) => {
    const flags: { [key: string]: string } = {
      'India': '🇮🇳',
      'Australia': '🇦🇺',
      'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'New Zealand': '🇳🇿',
      'South Africa': '🇿🇦',
      'West Indies': '🏏',
      'Sri Lanka': '🇱🇰',
      'Bangladesh': '🇧🇩',
      'Pakistan': '🇵🇰'
    };
    return flags[nationality] || '';
  };

  // Fetch player statistics from scorecards
  const fetchPlayerStatistics = async (playerName: string) => {
    setIsLoadingStats(true);
    try {
      // Fetch all WPL scorecards
      const response = await fetch('/api/scorecards?league=wpl');
      const scorecards = await response.json();
      
      if (!scorecards || scorecards.length === 0) {
        setPlayerStatistics({
          matches: 0,
          runs: 0,
          wickets: 0,
          average: 0,
          lastUpdated: new Date().toISOString()
        });
        return;
      }

      let totalMatches = 0;
      let totalRuns = 0;
      let totalWickets = 0;
      let inningsCount = 0;
      let lastMatchDate = null;

      // Process each scorecard
      for (const scorecard of scorecards) {
        if (!scorecard.scorecard) continue;
        
        // Check if player is in batting scorecard
        if (scorecard.scorecard.batting) {
          for (const team of Object.keys(scorecard.scorecard.batting)) {
            const battingTeam = scorecard.scorecard.batting[team];
            if (battingTeam.players) {
              for (const player of battingTeam.players) {
                if (player.name && player.name.toLowerCase().includes(playerName.toLowerCase())) {
                  totalMatches++;
                  totalRuns += player.runs || 0;
                  if (player.runs && player.runs > 0) {
                    inningsCount++;
                  }
                  lastMatchDate = scorecard.date || lastMatchDate;
                }
              }
            }
          }
        }

        // Check if player is in bowling scorecard
        if (scorecard.scorecard.bowling) {
          for (const team of Object.keys(scorecard.scorecard.bowling)) {
            const bowlingTeam = scorecard.scorecard.bowling[team];
            if (bowlingTeam.players) {
              for (const player of bowlingTeam.players) {
                if (player.name && player.name.toLowerCase().includes(playerName.toLowerCase())) {
                  totalWickets += player.wickets || 0;
                  if (!lastMatchDate) {
                    lastMatchDate = scorecard.date || lastMatchDate;
                  }
                }
              }
            }
          }
        }
      }

      // Calculate average (runs per innings)
      const average = inningsCount > 0 ? Math.round(totalRuns / inningsCount) : 0;

      // Calculate profile completeness based on available data
      const currentPlayer = players.find(p => p.name?.toLowerCase().includes(playerName.toLowerCase()));
      let completeness = 0;
      if (currentPlayer) {
        if (currentPlayer.name) completeness += 20;
        if (currentPlayer.nationality) completeness += 20;
        if (currentPlayer.age) completeness += 15;
        if (currentPlayer.battingStyle) completeness += 15;
        if (currentPlayer.bowlingStyle) completeness += 15;
        if (currentPlayer.role) completeness += 15;
      }

      setPlayerStatistics({
        matches: totalMatches,
        runs: totalRuns,
        wickets: totalWickets,
        average: average,
        lastUpdated: lastMatchDate || new Date().toISOString(),
        profileCompleteness: completeness
      });

    } catch (error) {
      console.error('Error fetching player statistics:', error);
      setPlayerStatistics({
        matches: 0,
        runs: 0,
        wickets: 0,
        average: 0,
        lastUpdated: new Date().toISOString(),
        profileCompleteness: 0
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Open enhanced editor for a player
  const openEnhancedEditor = (player: Player) => {
    setEnhancedEditedPlayer({
      name: player.name || "",
      role: player.role || "Batter",
      teamId: player.teamId || "",
      age: player.age?.toString() || "",
      nationality: player.nationality || "",
      jerseyNumber: player.jerseyNumber?.toString() || "",
      isCaptain: player.isCaptain || false,
      bowlingStyle: player.bowlingStyle || "N/A",
      battingStyle: player.battingStyle || "Right-handed bat",
      specialization: (player as any).specialization || ""
    });
    setValidationErrors([]);
    setShowEnhancedEditor(true);
    
    // Fetch player statistics when opening editor
    if (player.name) {
      fetchPlayerStatistics(player.name);
    }
  };

  // Save enhanced player
  const saveEnhancedPlayer = async () => {
    const errors = validateEnhancedPlayer(enhancedEditedPlayer);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const updatedPlayerData = {
        ...enhancedEditedPlayer,
        age: enhancedEditedPlayer.age ? parseInt(enhancedEditedPlayer.age) : undefined,
        jerseyNumber: enhancedEditedPlayer.jerseyNumber ? parseInt(enhancedEditedPlayer.jerseyNumber) : undefined,
        teamId: enhancedEditedPlayer.teamId,
        isCaptain: enhancedEditedPlayer.isCaptain,
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
          players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)),
        );
        setShowEnhancedEditor(false);
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
    openEnhancedEditor(player);
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
                      Nationality
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
                          <span style={{ color: WPLColors.textSecondary }}>
                            {getNationalityFlag(player.nationality || '')} {player.nationality || '-'}
                          </span>
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

      {/* Enhanced Player Editor Modal */}
      {showEnhancedEditor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            {/* Header */}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-black text-xl">
                      {enhancedEditedPlayer.name?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Edit Player Profile</h2>
                    <p className="text-white/70">
                      {enhancedEditedPlayer.name} • {teams.find(t => t.id === enhancedEditedPlayer.teamId)?.name || 'Unknown Team'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEnhancedEditor(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Tabbed Interface */}
            <div className="flex border-b border-white/20">
              {[
                { id: 'basic', label: 'Basic Info', icon: '👤' },
                { id: 'style', label: 'Playing Style', icon: '🏏' },
                { id: 'advanced', label: 'Advanced', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveEditorTab(tab.id as any)}
                  className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeEditorTab === tab.id
                      ? 'text-white border-b-2 border-purple-400'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Form Content */}
            <div className="p-6">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <h4 className="text-red-400 font-medium mb-2">Please fix the following errors:</h4>
                  <ul className="text-red-300 text-sm space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Basic Info Tab */}
              {activeEditorTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Player Name *</label>
                      <input
                        type="text"
                        value={enhancedEditedPlayer.name}
                        onChange={(e) => setEnhancedEditedPlayer(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
                        placeholder="Enter player name"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Jersey Number</label>
                      <input
                        type="number"
                        value={enhancedEditedPlayer.jerseyNumber}
                        onChange={(e) => setEnhancedEditedPlayer(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
                        placeholder="0-99"
                        min="0"
                        max="99"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Age</label>
                      <input
                        type="number"
                        value={enhancedEditedPlayer.age}
                        onChange={(e) => setEnhancedEditedPlayer(prev => ({ ...prev, age: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
                        placeholder="15-50"
                        min="15"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Nationality *</label>
                      <select
                        value={enhancedEditedPlayer.nationality}
                        onChange={(e) => setEnhancedEditedPlayer(prev => ({ ...prev, nationality: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
                      >
                        <option value="">Select Nationality</option>
                        <option value="India">India 🇮🇳</option>
                        <option value="Australia">Australia 🇦🇺</option>
                        <option value="England">England 🏴󠁧󠁢󠁥󠁮󠁧󠁿</option>
                        <option value="New Zealand">New Zealand 🇳🇿</option>
                        <option value="South Africa">South Africa 🇿🇦</option>
                        <option value="West Indies">West Indies 🏏</option>
                        <option value="Sri Lanka">Sri Lanka 🇱🇰</option>
                        <option value="Bangladesh">Bangladesh 🇧🇩</option>
                        <option value="Pakistan">Pakistan 🇵🇰</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Team *</label>
                      <select
                        value={enhancedEditedPlayer.teamId}
                        onChange={(e) => setEnhancedEditedPlayer(prev => ({ ...prev, teamId: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
                      >
                        <option value="">Select Team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Primary Role *</label>
                      <select
                        value={enhancedEditedPlayer.role}
                        onChange={(e) => setEnhancedEditedPlayer(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
                      >
                        <option value="Batter">Batter 🏏</option>
                        <option value="Bowler">Bowler 🎯</option>
                        <option value="All-rounder">All-rounder ⚡</option>
                        <option value="Wicket-keeper">Wicket-keeper 🧤</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Captain Checkbox */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="captain"
                      checked={enhancedEditedPlayer.isCaptain}
                      onChange={(e) => setEnhancedEditedPlayer(prev => ({ ...prev, isCaptain: e.target.checked }))}
                      className="w-5 h-5 rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                    <label htmlFor="captain" className="text-white font-medium">
                      Team Captain 👑
                    </label>
                  </div>
                </div>
              )}
              
              {/* Playing Style Tab */}
              {activeEditorTab === 'style' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Batting Style *</label>
                      <select
                        value={enhancedEditedPlayer.battingStyle}
                        onChange={(e) => setEnhancedEditedPlayer(prev => ({ ...prev, battingStyle: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
                      >
                        <option value="Right-handed bat">Right-handed bat 🏏</option>
                        <option value="Left-handed bat">Left-handed bat 🏏</option>
                        <option value="Right-hand bat">Right-hand bat</option>
                        <option value="Left-hand bat">Left-hand bat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Bowling Style *</label>
                      <select
                        value={enhancedEditedPlayer.bowlingStyle}
                        onChange={(e) => setEnhancedEditedPlayer(prev => ({ ...prev, bowlingStyle: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
                      >
                        <option value="Right-arm fast">Right-arm fast 🚀</option>
                        <option value="Left-arm fast">Left-arm fast 🚀</option>
                        <option value="Right-arm medium">Right-arm medium</option>
                        <option value="Left-arm medium">Left-arm medium</option>
                        <option value="Right-arm off-break">Right-arm off-break 🔄</option>
                        <option value="Left-arm orthodox">Left-arm orthodox 🔄</option>
                        <option value="Right-arm leg-break">Right-arm leg-break 🔄</option>
                        <option value="Left-arm chinaman">Left-arm chinaman 🔄</option>
                        <option value="N/A">N/A (Batter/WK)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Specialization</label>
                      <select
                        value={enhancedEditedPlayer.specialization}
                        onChange={(e) => setEnhancedEditedPlayer(prev => ({ ...prev, specialization: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
                      >
                        <option value="">None</option>
                        <option value="Opening Batter">Opening Batter 🚀</option>
                        <option value="Middle-order Batter">Middle-order Batter 🔥</option>
                        <option value="Finisher">Finisher 💪</option>
                        <option value="Fast Bowler">Fast Bowler ⚡</option>
                        <option value="Spin Bowler">Spin Bowler 🌀</option>
                        <option value="Death Bowler">Death Bowler 🎯</option>
                        <option value="Power-hitter">Power-hitter 💥</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Advanced Tab */}
              {activeEditorTab === 'advanced' && (
                <div className="space-y-6">
                  {/* Player Statistics */}
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">Player Statistics</h4>
                      {isLoadingStats && (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-white/50 text-sm">Loading...</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-white/50">Matches:</span>
                        <span className="text-white font-medium ml-2">
                          {isLoadingStats ? '-' : (playerStatistics?.matches || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">Runs:</span>
                        <span className="text-white font-medium ml-2">
                          {isLoadingStats ? '-' : (playerStatistics?.runs || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">Wickets:</span>
                        <span className="text-white font-medium ml-2">
                          {isLoadingStats ? '-' : (playerStatistics?.wickets || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">Average:</span>
                        <span className="text-white font-medium ml-2">
                          {isLoadingStats ? '-' : (playerStatistics?.average || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Data Quality */}
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-white font-medium mb-3">Data Quality</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white/50 text-sm">Profile Completeness:</span>
                          <span className="text-green-400 font-medium text-sm">
                            {playerStatistics?.profileCompleteness || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${playerStatistics?.profileCompleteness || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50 text-sm">Last Updated:</span>
                        <span className="text-white font-medium text-sm">
                          {playerStatistics?.lastUpdated 
                            ? new Date(playerStatistics.lastUpdated).toLocaleDateString()
                            : '-'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Summary */}
                  {playerStatistics && !isLoadingStats && (playerStatistics.matches > 0 || playerStatistics.runs > 0 || playerStatistics.wickets > 0) && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="text-white font-medium mb-3">Performance Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-white/50">Role Performance:</span>
                          <span className="text-white font-medium">
                            {enhancedEditedPlayer.role === 'Batter' && '🏏 Batsman'}
                            {enhancedEditedPlayer.role === 'Bowler' && '🎯 Bowler'}
                            {enhancedEditedPlayer.role === 'All-rounder' && '⚡ All-rounder'}
                            {enhancedEditedPlayer.role === 'Wicket-keeper' && '🧤 Wicket-keeper'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white/50">Team:</span>
                          <span className="text-white font-medium">
                            {teams.find(t => t.id === enhancedEditedPlayer.teamId)?.name || 'Unknown'}
                          </span>
                        </div>
                        {enhancedEditedPlayer.battingStyle && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/50">Batting:</span>
                            <span className="text-white font-medium">{enhancedEditedPlayer.battingStyle}</span>
                          </div>
                        )}
                        {enhancedEditedPlayer.bowlingStyle && enhancedEditedPlayer.bowlingStyle !== 'N/A' && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/50">Bowling:</span>
                            <span className="text-white font-medium">{enhancedEditedPlayer.bowlingStyle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-white/20">
                <button
                  onClick={saveEnhancedPlayer}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEnhancedEditor(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
