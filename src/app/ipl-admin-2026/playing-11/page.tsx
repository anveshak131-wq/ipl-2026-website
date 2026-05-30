'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { Match, Player } from '@/types';
import {
  filterMatchesBySeason,
  getAvailableSeasonYears,
  getPreferredMatch,
  getPreferredSeasonYear,
  getMatchSeasonYear,
  sortMatchesForAdmin,
} from '@/lib/adminMatchSeason';
import { api } from '@/lib/data';
import { ensureIplPlayoffMatchesForSeason } from '@/lib/iplAdminPlayoffSync';
import { LoadingSpinner } from '@/components/admin/animations';
import { CheckCircle2, AlertCircle, Users, Save, RefreshCw, FileDown, FileText, FileSpreadsheet, Database } from 'lucide-react';
import { WPLColors } from '@/lib/wplColors';
import { exportPlaying11ToCSV, exportPlaying11ToExcel, exportPlaying11ToPDF, exportPlaying11ToDatabase } from './playing-11-export';
import { exportPlaying11ToPDFModern2025 } from './pdf-export-modern-2025';

const LEAGUE = 'ipl' as const;

export default function Playing11Page() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasonYear, setSeasonYear] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [team1Playing11, setTeam1Playing11] = useState<string[]>([]);
  const [team2Playing11, setTeam2Playing11] = useState<string[]>([]);
  const [team1CaptainId, setTeam1CaptainId] = useState<string>('');
  const [team2CaptainId, setTeam2CaptainId] = useState<string>('');
  const [team1ImpactSubstitutes, setTeam1ImpactSubstitutes] = useState<string[]>(() => Array(5).fill(''));
  const [team2ImpactSubstitutes, setTeam2ImpactSubstitutes] = useState<string[]>(() => Array(5).fill(''));
  const [team1ImpactPlayer, setTeam1ImpactPlayer] = useState<string>('');
  const [team2ImpactPlayer, setTeam2ImpactPlayer] = useState<string>('');
  const [team1ImpactOriginalPlayer, setTeam1ImpactOriginalPlayer] = useState<string>('');
  const [team2ImpactOriginalPlayer, setTeam2ImpactOriginalPlayer] = useState<string>('');
  const [team1SubstitutionTime, setTeam1SubstitutionTime] = useState<string>('');
  const [team2SubstitutionTime, setTeam2SubstitutionTime] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const playoffSyncAttemptedRef = useRef<Record<number, boolean>>({});
  const substitutionTimingOptions = useMemo(
    () => [
      'Before Start of Innings',
      'Innings Break',
      'End of Over',
      'Fall of Wicket',
      'Batter Retired',
      'Injury Replacement (Mid-Over)',
    ],
    []
  );

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/ipl-admin-2026');
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Load matches and players
  const loadData = useCallback(async (showLoading = false) => {
    if (!isAuthenticated) return;

    if (showLoading) {
      setIsRefreshing(true);
    }

    try {
              const [matchesData, playersData] = await Promise.all([
                api.getMatches(LEAGUE, { includeAll: true, nocache: true }),
                api.getPlayers(undefined, LEAGUE),
              ]);
      setMatches(matchesData);
      setPlayers(playersData);
      setSeasonYear((prev) => {
        if (prev !== null && matchesData.some((match) => getMatchSeasonYear(match) === prev)) {
          return prev;
        }
        return getPreferredSeasonYear(matchesData) ?? null;
      });
      
      // Debug: Log players data from KV
      console.log('=== PLAYERS LOADED FROM KV (playing-11) ===');
      console.log('Total players loaded:', playersData.length);
      console.log('Current league:', LEAGUE);
      console.log('All players:', playersData.map(p => ({
        id: p.id,
        name: p.name,
        teamId: p.teamId,
        teamIdType: typeof p.teamId,
        league: p.league,
        leagueType: typeof p.league
      })));
      
      const playersByLeague = playersData.filter(p => {
        const playerLeague = p.league || 'ipl';
        return playerLeague === LEAGUE;
      });
      console.log(`Players for ${LEAGUE}:`, playersByLeague.length);
      console.log('Players by league:', playersByLeague.map(p => ({
        id: p.id,
        name: p.name,
        teamId: p.teamId,
        league: p.league
      })));
      
      if (playersData.length === 0) {
        console.warn('⚠️ No players found in KV storage at all!');
        console.warn('Please check if players exist in Workers KV storage.');
      } else if (playersByLeague.length === 0) {
        console.warn(`⚠️ No players found for league: ${LEAGUE}`);
        const uniqueLeagues = Array.from(new Set(playersData.map(p => p.league || 'ipl')));
        console.warn('Players in KV have leagues:', uniqueLeagues);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (showLoading) {
        setIsRefreshing(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh players when page becomes visible (user switches back to tab)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reload players when tab becomes visible (in case they were updated in another tab)
        loadData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, loadData]);

  const availableSeasonYears = useMemo(() => getAvailableSeasonYears(matches), [matches]);

  const visibleMatches = useMemo(
    () => sortMatchesForAdmin(filterMatchesBySeason(matches, seasonYear)),
    [matches, seasonYear]
  );

  useEffect(() => {
    setSelectedMatchId((prev) => {
      if (prev && visibleMatches.some((match) => match.id === prev)) {
        return prev;
      }
      return getPreferredMatch(visibleMatches)?.id || '';
    });
  }, [visibleMatches]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (seasonYear === null) return;
    if (playoffSyncAttemptedRef.current[seasonYear]) return;
    if (!matches.some((match) => getMatchSeasonYear(match) === seasonYear)) return;

    playoffSyncAttemptedRef.current[seasonYear] = true;
    let cancelled = false;

    (async () => {
      try {
        const result = await ensureIplPlayoffMatchesForSeason(seasonYear, matches);
        if (!cancelled && result.created > 0) {
          setMatches(result.matches);
        }
      } catch (error) {
        console.error('[Playing 11] Failed to auto-create IPL playoff matches:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, matches, seasonYear]);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  // Load existing playing 11 when match is selected
  useEffect(() => {
    if (selectedMatch) {
      const normalizeIdArray = (value: unknown): string[] => {
        if (Array.isArray(value)) return value.map(String).filter(Boolean);
        if (typeof value === 'string') {
          return value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [];
      };

      const normalizeFixedLength = (value: unknown, length: number): string[] => {
        const arr = normalizeIdArray(value).slice(0, length);
        while (arr.length < length) arr.push('');
        return arr;
      };

      // Load from match data if available
      const existingTeam1 = normalizeIdArray((selectedMatch as any).playing11?.team1);
      const existingTeam2 = normalizeIdArray((selectedMatch as any).playing11?.team2);
      setTeam1Playing11(existingTeam1);
      setTeam2Playing11(existingTeam2);

      const existingCaptains = selectedMatch.captains;
      setTeam1CaptainId(existingCaptains?.team1 ? String(existingCaptains.team1) : '');
      setTeam2CaptainId(existingCaptains?.team2 ? String(existingCaptains.team2) : '');

      const existingImpactSubs1 = normalizeFixedLength((selectedMatch as any).impactSubstitutes?.team1, 5);
      const existingImpactSubs2 = normalizeFixedLength((selectedMatch as any).impactSubstitutes?.team2, 5);
      setTeam1ImpactSubstitutes(existingImpactSubs1);
      setTeam2ImpactSubstitutes(existingImpactSubs2);

      const normalizeImpact = (impact: any) => {
        if (!impact) return { playerId: '', substitutionTime: '', original: '' };
        const playerId = impact.playerId || impact.impact || '';
        const original = impact.original || '';
        let substitutionTime = impact.substitutionTime || '';
        if (!substitutionTime && typeof impact.substitutedAt === 'number') {
          substitutionTime = new Date(impact.substitutedAt).toLocaleString();
        }
        return { playerId, substitutionTime, original };
      };

      const impact = (selectedMatch as any).impactPlayer;
      const team1Impact = normalizeImpact(impact?.team1);
      const team2Impact = normalizeImpact(impact?.team2);
      setTeam1ImpactPlayer(team1Impact.playerId);
      setTeam2ImpactPlayer(team2Impact.playerId);
      setTeam1ImpactOriginalPlayer(team1Impact.original);
      setTeam2ImpactOriginalPlayer(team2Impact.original);
      setTeam1SubstitutionTime(team1Impact.substitutionTime);
      setTeam2SubstitutionTime(team2Impact.substitutionTime);
    } else {
      setTeam1Playing11([]);
      setTeam2Playing11([]);
      setTeam1CaptainId('');
      setTeam2CaptainId('');
      setTeam1ImpactPlayer('');
      setTeam2ImpactPlayer('');
      setTeam1ImpactOriginalPlayer('');
      setTeam2ImpactOriginalPlayer('');
      setTeam1SubstitutionTime('');
      setTeam2SubstitutionTime('');
      setTeam1ImpactSubstitutes(Array(5).fill(''));
      setTeam2ImpactSubstitutes(Array(5).fill(''));
    }
  }, [selectedMatch]);

  // Ensure selected captain stays within the selected Playing XI
  useEffect(() => {
    if (team1CaptainId && !team1Playing11.includes(team1CaptainId)) {
      setTeam1CaptainId('');
    }
  }, [team1CaptainId, team1Playing11]);

  useEffect(() => {
    if (team2CaptainId && !team2Playing11.includes(team2CaptainId)) {
      setTeam2CaptainId('');
    }
  }, [team2CaptainId, team2Playing11]);

  // Get ALL players from each team's squad (no restrictions)
  const team1Players = useMemo(() => {
    if (!selectedMatch) {
      console.log('No selected match for team1Players');
      return [];
    }
    
    console.log('=== FILTERING TEAM 1 PLAYERS ===');
    console.log('Selected match:', {
      id: selectedMatch.id,
      team1Id: selectedMatch.team1.id,
      team1IdType: typeof selectedMatch.team1.id,
      team1Name: selectedMatch.team1.name,
      league: selectedMatch.league,
      leagueType: typeof selectedMatch.league
    });
    console.log('Total players available:', players.length);
    
    // Normalize team ID by removing "Team " prefix and extracting number
    const normalizeTeamId = (id: string | number) => {
      let str = String(id).trim();
      if (str.startsWith('Team ')) str = str.replace('Team ', '');
      if (str.toLowerCase().startsWith('team')) str = str.replace(/^team/i, '');
      return str;
    };
    
    // Filter by teamId and league to get all squad players
    // Try both string and number comparison for teamId
    const filtered = players.filter(p => {
      const playerTeamId = normalizeTeamId(p.teamId);
      const matchTeamId = normalizeTeamId(selectedMatch.team1.id);
      const playerLeague = p.league || 'ipl';
      const matchLeague = selectedMatch.league || 'ipl';
      
      const matchesTeam = playerTeamId === matchTeamId;
      const matchesLeague = playerLeague === matchLeague;
      
      if (!matchesTeam || !matchesLeague) {
        console.log('Player filtered out:', {
          playerName: p.name,
          playerTeamId: p.teamId,
          playerTeamIdString: playerTeamId,
          matchTeamId: selectedMatch.team1.id,
          matchTeamIdString: matchTeamId,
          playerLeague: playerLeague,
          matchLeague: matchLeague,
          matchesTeam,
          matchesLeague
        });
      }
      return matchesTeam && matchesLeague;
    });
    
    console.log('Team 1 players filtered result:', {
      totalPlayers: players.length,
      team1Id: selectedMatch.team1.id,
      team1IdString: String(selectedMatch.team1.id),
      league: selectedMatch.league,
      filteredCount: filtered.length,
      playerIds: filtered.map(p => p.id),
      playerNames: filtered.map(p => p.name)
    });
    
    return filtered;
  }, [players, selectedMatch]);

  const team2Players = useMemo(() => {
    if (!selectedMatch) {
      console.log('No selected match for team2Players');
      return [];
    }
    
    console.log('=== FILTERING TEAM 2 PLAYERS ===');
    console.log('Selected match:', {
      id: selectedMatch.id,
      team2Id: selectedMatch.team2.id,
      team2IdType: typeof selectedMatch.team2.id,
      team2Name: selectedMatch.team2.name,
      league: selectedMatch.league,
      leagueType: typeof selectedMatch.league
    });
    console.log('Total players available:', players.length);
    
    // Normalize team ID by removing "Team " prefix and extracting number
    const normalizeTeamId = (id: string | number) => {
      let str = String(id).trim();
      if (str.startsWith('Team ')) str = str.replace('Team ', '');
      if (str.toLowerCase().startsWith('team')) str = str.replace(/^team/i, '');
      return str;
    };
    
    // Filter by teamId and league to get all squad players
    // Try both string and number comparison for teamId
    const filtered = players.filter(p => {
      const playerTeamId = normalizeTeamId(p.teamId);
      const matchTeamId = normalizeTeamId(selectedMatch.team2.id);
      const playerLeague = p.league || 'ipl';
      const matchLeague = selectedMatch.league || 'ipl';
      
      const matchesTeam = playerTeamId === matchTeamId;
      const matchesLeague = playerLeague === matchLeague;
      
      if (!matchesTeam || !matchesLeague) {
        console.log('Player filtered out:', {
          playerName: p.name,
          playerTeamId: p.teamId,
          playerTeamIdString: playerTeamId,
          matchTeamId: selectedMatch.team2.id,
          matchTeamIdString: matchTeamId,
          playerLeague: playerLeague,
          matchLeague: matchLeague,
          matchesTeam,
          matchesLeague
        });
      }
      return matchesTeam && matchesLeague;
    });
    
    console.log('Team 2 players filtered result:', {
      totalPlayers: players.length,
      team2Id: selectedMatch.team2.id,
      team2IdString: String(selectedMatch.team2.id),
      league: selectedMatch.league,
      filteredCount: filtered.length,
      playerIds: filtered.map(p => p.id),
      playerNames: filtered.map(p => p.name)
    });
    
    return filtered;
  }, [players, selectedMatch]);

  const team1Playing11Players = useMemo(() => {
    const idSet = new Set(team1Playing11);
    return team1Players.filter((player) => idSet.has(player.id));
  }, [team1Players, team1Playing11]);

  const team2Playing11Players = useMemo(() => {
    const idSet = new Set(team2Playing11);
    return team2Players.filter((player) => idSet.has(player.id));
  }, [team2Players, team2Playing11]);

  const togglePlayer = (team: 'team1' | 'team2', playerId: string) => {
    console.log('togglePlayer called:', { team, playerId });
    if (team === 'team1') {
      setTeam1Playing11(prev => {
        if (prev.includes(playerId)) {
          const newList = prev.filter(id => id !== playerId);
          console.log('Team 1 - Removed player, new list:', newList);
          return newList;
        } else {
          if (prev.length >= 11) {
            alert('Maximum 11 players allowed for Team 1');
            return prev;
          }
          const newList = [...prev, playerId];
          console.log('Team 1 - Added player, new list:', newList);
          return newList;
        }
      });
    } else {
      setTeam2Playing11(prev => {
        if (prev.includes(playerId)) {
          const newList = prev.filter(id => id !== playerId);
          console.log('Team 2 - Removed player, new list:', newList);
          return newList;
        } else {
          if (prev.length >= 11) {
            alert('Maximum 11 players allowed for Team 2');
            return prev;
          }
          const newList = [...prev, playerId];
          console.log('Team 2 - Added player, new list:', newList);
          return newList;
        }
      });
    }
  };

  const handleImpactPlayerSelection = (team: 'team1' | 'team2', playerId: string) => {
    if (team === 'team1') {
      setTeam1ImpactPlayer(playerId);
      setTeam1SubstitutionTime('');
      // Keep original selection only if still valid (in playing 11 and not same as impact)
      setTeam1ImpactOriginalPlayer((prev) =>
        prev && team1Playing11.includes(prev) && prev !== playerId ? prev : ''
      );
    } else {
      setTeam2ImpactPlayer(playerId);
      setTeam2SubstitutionTime('');
      setTeam2ImpactOriginalPlayer((prev) =>
        prev && team2Playing11.includes(prev) && prev !== playerId ? prev : ''
      );
    }
  };

  const handleSubstitution = (team: 'team1' | 'team2', substitutionTime: string) => {
    const impactPlayerId = team === 'team1' ? team1ImpactPlayer : team2ImpactPlayer;
    const playing11 = team === 'team1' ? team1Playing11 : team2Playing11;
    const originalPlayerId = team === 'team1' ? team1ImpactOriginalPlayer : team2ImpactOriginalPlayer;
    
    if (!impactPlayerId) return;
    if (!originalPlayerId) {
      alert('Please select the original player to be substituted.');
      return;
    }
    if (!playing11.includes(originalPlayerId)) {
      alert('Selected original player is not in the current Playing 11.');
      return;
    }
    if (originalPlayerId === impactPlayerId) {
      alert('Impact Player cannot be the same as the original player.');
      return;
    }

    // IMPORTANT: keep Playing 11 unchanged; Impact Player is stored separately.
    if (playing11.includes(impactPlayerId)) {
      alert('Impact Player is currently selected in Playing 11. Remove them from Playing 11 to record as Impact Player.');
      return;
    }

    if (team === 'team1') {
      setTeam1SubstitutionTime(substitutionTime);
    } else {
      setTeam2SubstitutionTime(substitutionTime);
    }
  };

  const handleSave = async ({ publish }: { publish: boolean }) => {
    if (!selectedMatch) return;

    if (team1Playing11.length !== 11 || team2Playing11.length !== 11) {
      alert('Please select exactly 11 players for each team');
      return;
    }

    if (team1CaptainId && !team1Playing11.includes(team1CaptainId)) {
      alert('Team 1 captain must be selected from Team 1 Playing 11.');
      return;
    }
    if (team2CaptainId && !team2Playing11.includes(team2CaptainId)) {
      alert('Team 2 captain must be selected from Team 2 Playing 11.');
      return;
    }

    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('adminToken');
      
      const existingSetAt = (selectedMatch as any).playing11?.setAt;
      const existingImpactSubsSetAt = (selectedMatch as any).impactSubstitutes?.setAt;
      const existingCaptainsSetAt = selectedMatch.captains?.setAt;
      const sanitizePlaying11 = (playing11: string[], impactId: string, originalId: string) => {
        let xi = playing11.map(String).filter(Boolean);
        if (impactId && originalId) {
          // Keep the ORIGINAL XI (pre-substitution): ensure original is in XI and impact is not.
          xi = xi.map((id) => (id === impactId ? originalId : id));
          xi = xi.filter((id) => id !== impactId);
          if (!xi.includes(originalId)) {
            if (xi.length < 11) xi.push(originalId);
          }
        }
        xi = Array.from(new Set(xi));
        if (xi.length > 11) xi = xi.slice(0, 11);
        return xi;
      };

      const sanitizedTeam1Playing11 = sanitizePlaying11(
        team1Playing11,
        team1ImpactPlayer,
        team1ImpactOriginalPlayer
      );
      const sanitizedTeam2Playing11 = sanitizePlaying11(
        team2Playing11,
        team2ImpactPlayer,
        team2ImpactOriginalPlayer
      );

      const sanitizedTeam1CaptainId =
        team1CaptainId && sanitizedTeam1Playing11.includes(team1CaptainId) ? team1CaptainId : '';
      const sanitizedTeam2CaptainId =
        team2CaptainId && sanitizedTeam2Playing11.includes(team2CaptainId) ? team2CaptainId : '';

      const sanitizeSubstitutes = (subs: string[]) =>
        subs
          .map(String)
          .map((s) => s.trim())
          .filter(Boolean);

      const team1SubsRaw = sanitizeSubstitutes(team1ImpactSubstitutes);
      const team2SubsRaw = sanitizeSubstitutes(team2ImpactSubstitutes);
      const team1SubsUnique = Array.from(new Set(team1SubsRaw));
      const team2SubsUnique = Array.from(new Set(team2SubsRaw));
      const team1SubsOverlap = team1SubsUnique.filter((id) => sanitizedTeam1Playing11.includes(id));
      const team2SubsOverlap = team2SubsUnique.filter((id) => sanitizedTeam2Playing11.includes(id));

      const isIPL = LEAGUE === 'ipl';
      if (isIPL) {
        if (team1SubsRaw.length !== team1SubsUnique.length || team2SubsRaw.length !== team2SubsUnique.length) {
          alert('Impact substitutes must be unique (no duplicates).');
          return;
        }
        if (team1SubsOverlap.length || team2SubsOverlap.length) {
          alert('Impact substitutes must not include players from the Playing 11.');
          return;
        }
        if (publish && (team1SubsUnique.length !== 5 || team2SubsUnique.length !== 5)) {
          alert('Please select exactly 5 Impact substitutes for each team to publish.');
          return;
        }
      }

      // Update match with playing 11
      // Use the match update API format
      const payload: any = {
        id: selectedMatch.id,
        date: selectedMatch.date,
        time: selectedMatch.time,
        venue: selectedMatch.venue,
        team1Id: selectedMatch.team1.id,
        team2Id: selectedMatch.team2.id,
        status: selectedMatch.status,
        league: selectedMatch.league,
        captains: {
          team1: sanitizedTeam1CaptainId,
          team2: sanitizedTeam2CaptainId,
          ...(publish
            ? { setAt: new Date().toISOString() }
            : (existingCaptainsSetAt ? { setAt: existingCaptainsSetAt } : {})),
        },
        playing11: {
          team1: sanitizedTeam1Playing11,
          team2: sanitizedTeam2Playing11,
          ...(publish ? { setAt: new Date().toISOString() } : (existingSetAt ? { setAt: existingSetAt } : {})),
        },
      };

      if (isIPL) {
        payload.impactSubstitutes = {
          team1: team1SubsUnique,
          team2: team2SubsUnique,
          ...(publish
            ? { setAt: new Date().toISOString() }
            : (existingImpactSubsSetAt ? { setAt: existingImpactSubsSetAt } : {})),
        };
      } else {
        payload.impactPlayer = {
          team1: team1ImpactPlayer ? {
            original: team1ImpactOriginalPlayer || '',
            impact: team1ImpactPlayer,
            substitutionTime: team1SubstitutionTime || '',
            ...(team1SubstitutionTime ? { substitutedAt: Date.now() } : {}),
          } : null,
          team2: team2ImpactPlayer ? {
            original: team2ImpactOriginalPlayer || '',
            impact: team2ImpactPlayer,
            substitutionTime: team2SubstitutionTime || '',
            ...(team2SubstitutionTime ? { substitutedAt: Date.now() } : {}),
          } : null
        };
      }

      const response = await fetch(`/api/matches?id=${selectedMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save playing 11');
      }

      // Update local matches state
      const updatedMatchData = await response.json();
      setMatches(prev => prev.map(m => 
        m.id === selectedMatch.id ? updatedMatchData as Match : m
      ));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving playing 11:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const buildExportPayload = useCallback(() => {
    if (!selectedMatch) return null;
    const matchWithCaptains: Match = {
      ...selectedMatch,
      captains: {
        ...(selectedMatch.captains || {}),
        team1: team1CaptainId || '',
        team2: team2CaptainId || '',
      },
    };
    return {
      match: matchWithCaptains,
      players,
      playing11: {
        team1: team1Playing11,
        team2: team2Playing11
      },
      impact: {
        team1: team1ImpactPlayer || team1SubstitutionTime ? {
          playerId: team1ImpactPlayer,
          original: team1ImpactOriginalPlayer,
          impact: team1ImpactPlayer,
          substitutionTime: team1SubstitutionTime
        } : null,
        team2: team2ImpactPlayer || team2SubstitutionTime ? {
          playerId: team2ImpactPlayer,
          original: team2ImpactOriginalPlayer,
          impact: team2ImpactPlayer,
          substitutionTime: team2SubstitutionTime
        } : null
      }
    };
  }, [
    selectedMatch,
    players,
    team1Playing11,
    team2Playing11,
    team1CaptainId,
    team2CaptainId,
    team1ImpactPlayer,
    team2ImpactPlayer,
    team1ImpactOriginalPlayer,
    team2ImpactOriginalPlayer,
    team1SubstitutionTime,
    team2SubstitutionTime
  ]);

  const handleExport = async (format: 'pdf' | 'excel' | 'csv' | 'database') => {
    const payload = buildExportPayload();
    if (!payload) return;

    setIsExporting(true);
    try {
      switch (format) {
        case 'csv':
          exportPlaying11ToCSV(payload);
          break;
        case 'excel':
          await exportPlaying11ToExcel(payload);
          break;
        case 'pdf':
          await exportPlaying11ToPDFModern2025(payload);
          break;
        case 'database':
          exportPlaying11ToDatabase(payload);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const isWPL = false;
  const isIPL = true;
  const canExport = !!selectedMatch && (
    team1Playing11.length > 0 ||
    team2Playing11.length > 0 ||
    !!team1ImpactPlayer ||
    !!team2ImpactPlayer ||
    team1ImpactSubstitutes.some(Boolean) ||
    team2ImpactSubstitutes.some(Boolean)
  );
  const team1ImpactSubsCount = Array.from(new Set(team1ImpactSubstitutes.filter((id) => Boolean(id)))).length;
  const team2ImpactSubsCount = Array.from(new Set(team2ImpactSubstitutes.filter((id) => Boolean(id)))).length;
  const bgStyle = isWPL 
    ? { background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})` }
    : { background: '#0B0F13' };
  const spinnerColor = isWPL ? WPLColors.pink : '#FFD700';
  const headerGradient = isWPL
    ? `linear-gradient(to right, ${WPLColors.textPrimary}, ${WPLColors.purple}, ${WPLColors.pink})`
    : 'linear-gradient(to right, white, #93C5FD, #67E8F9)';

  if (isLoading) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" color={spinnerColor} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <AuroraBackground />
      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto" style={{ position: 'relative', zIndex: 20 }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 
                  className="text-4xl font-bold mb-2"
                  style={{
                    background: headerGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Playing 11 Selection
                </h1>
                <p style={{ color: isWPL ? WPLColors.textSecondary : '#9CA3AF' }}>
                  Select 11 players for each team before the match starts (after toss decision)
                </p>
              </div>
              <div className="flex items-center gap-3">
                {saveStatus === 'saved' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">Saved!</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-semibold">Save Failed</span>
                  </div>
                )}
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all
                    ${isWPL
                      ? 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300'
                      : 'bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300'
                    }
                    ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  `}
                  title="Refresh players data"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Match Selector */}
            <div 
              className="rounded-2xl p-4 backdrop-blur-xl border mb-6"
              style={isWPL ? {
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.purpleRGBA[30],
              } : {
                background: 'rgba(30, 41, 59, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}
                    >
                      Season
                    </label>
                    <select
                      value={seasonYear === null ? 'all' : String(seasonYear)}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSeasonYear(value === 'all' ? null : parseInt(value, 10) || null);
                      }}
                      className="w-full md:w-44 px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-colors"
                      style={isWPL ? {
                        background: WPLColors.purpleRGBA[20],
                        border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                      } : {
                        background: '#0F172A',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {availableSeasonYears.map((year) => (
                        <option key={year} value={String(year)}>
                          {year}
                        </option>
                      ))}
                      <option value="all">All seasons</option>
                    </select>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}
                    >
                      Select Match
                    </label>
                    <select
                      value={selectedMatchId}
                      onChange={(e) => setSelectedMatchId(e.target.value)}
                      className="w-full md:w-96 px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-colors"
                      style={isWPL ? {
                        background: WPLColors.purpleRGBA[20],
                        border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                      } : {
                        background: '#0F172A',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = isWPL ? WPLColors.purpleRGBA[50] : '#3B82F6';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = isWPL ? WPLColors.purpleRGBA[30] : 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <option value="">Select a match...</option>
                      {visibleMatches.map((match) => (
                        <option key={match.id} value={match.id}>
                          {match.team1.shortName} vs {match.team2.shortName} · {new Date(match.date).toLocaleDateString()} {match.time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-sm" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                  Showing {visibleMatches.length} match{visibleMatches.length === 1 ? '' : 'es'}
                </div>
              </div>
            </div>

            {selectedMatch && (
              <div
                className="rounded-2xl p-4 backdrop-blur-xl border"
                style={isWPL ? {
                  background: WPLColors.purpleRGBA[10],
                  borderColor: WPLColors.purpleRGBA[30],
                } : {
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Export Playing 11</h3>
                    <p className="text-sm" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                      Download playing 11 and impact players for the selected match.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleExport('pdf')}
                      disabled={!canExport || isExporting}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border
                        ${isWPL
                          ? 'bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30'
                          : 'bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30'
                        }
                        ${(!canExport || isExporting) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                      `}
                      title="Export PDF"
                    >
                      <FileDown className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      disabled={!canExport || isExporting}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border
                        ${isWPL
                          ? 'bg-purple-500/20 border-purple-400/30 text-purple-200 hover:bg-purple-500/30'
                          : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/30'
                        }
                        ${(!canExport || isExporting) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                      `}
                      title="Export Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      disabled={!canExport || isExporting}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border
                        ${isWPL
                          ? 'bg-blue-500/20 border-blue-400/30 text-blue-200 hover:bg-blue-500/30'
                          : 'bg-blue-500/20 border-blue-400/30 text-blue-200 hover:bg-blue-500/30'
                        }
                        ${(!canExport || isExporting) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                      `}
                      title="Export CSV"
                    >
                      <FileText className="w-4 h-4" />
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('database')}
                      disabled={!canExport || isExporting}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border
                        ${isWPL
                          ? 'bg-amber-500/20 border-amber-400/30 text-amber-200 hover:bg-amber-500/30'
                          : 'bg-amber-500/20 border-amber-400/30 text-amber-200 hover:bg-amber-500/30'
                        }
                        ${(!canExport || isExporting) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                      `}
                      title="Export Database (SQL)"
                    >
                      <Database className="w-4 h-4" />
                      Database
                    </button>
                  </div>
                </div>
                <p className="text-xs mt-3" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                  Exports include match info, playing 11, impact players, and full player data.
                </p>
              </div>
            )}
          </div>

          {/* Playing 11 Selection */}
          {selectedMatch ? (
            <div className="space-y-6">
              {/* Team 1 Selection */}
              <div 
                className="rounded-2xl p-6 backdrop-blur-xl border"
                style={isWPL ? {
                  background: WPLColors.purpleRGBA[10],
                  borderColor: WPLColors.purpleRGBA[30],
                } : {
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {selectedMatch.team1.shortName || selectedMatch.team1.name}
                      </h2>
                      <p className="text-sm" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        Select 11 players from squad ({team1Players.length} available)
                      </p>
                    </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                    background: team1Playing11.length === 11 
                      ? 'rgba(34, 197, 94, 0.2)' 
                      : 'rgba(251, 191, 36, 0.2)',
                    border: `1px solid ${team1Playing11.length === 11 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                  }}>
                    <Users className="w-5 h-5" style={{ color: team1Playing11.length === 11 ? '#22C55E' : '#FBBF24' }} />
                    <span className="font-bold" style={{ color: team1Playing11.length === 11 ? '#22C55E' : '#FBBF24' }}>
                      {team1Playing11.length} / 11
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-2">Match Captain (optional)</label>
                    <select
                      value={team1CaptainId}
                      onChange={(e) => setTeam1CaptainId(e.target.value)}
                      disabled={!team1Playing11Players.length}
                      className="w-full border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 bg-slate-950 text-white disabled:opacity-60"
                    >
                      <option value="">
                        {team1Playing11Players.length ? 'Select captain...' : 'Select Playing XI first'}
                      </option>
                      {team1Playing11Players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}{player.isCaptain ? ' (Season captain)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-white/50 mt-1">
                      Used for (C) on Playing XI, Impact Player, Scorecard, Live Score.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {team1Players.length === 0 ? (
                    <div className="col-span-full text-center py-8 px-4 rounded-xl border-2 border-dashed" style={isWPL ? {
                      background: WPLColors.purpleRGBA[10],
                      borderColor: WPLColors.purpleRGBA[30],
                    } : {
                      background: 'rgba(30, 41, 59, 0.2)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}>
                      <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: isWPL ? WPLColors.pink : '#60A5FA' }} />
                      <p className="text-lg font-semibold text-white mb-2">No Players Found</p>
                      <p className="text-sm mb-4" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        No players found for {selectedMatch.team1.name} in {LEAGUE.toUpperCase()}.
                      </p>
                      <p className="text-xs mb-4" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        Please add players in the <strong>Admin Players</strong> page and ensure they are assigned to this team.
                      </p>
                      <button
                        onClick={() => loadData(true)}
                        className={`
                          px-4 py-2 rounded-lg font-semibold transition-all
                          ${isWPL
                            ? 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300'
                            : 'bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300'
                          }
                        `}
                      >
                        <RefreshCw className="w-4 h-4 inline mr-2" />
                        Refresh Players
                      </button>
                    </div>
                  ) : (
                    team1Players.map((player) => {
                      const isSelected = team1Playing11.includes(player.id);
                      const isMatchCaptain = player.id === team1CaptainId;
                      return (
                        <button
                          key={player.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Button clicked for player:', player.name, player.id);
                            togglePlayer('team1', player.id);
                          }}
                          type="button"
                          className={`
                            p-4 rounded-xl border-2 transition-all text-left cursor-pointer
                            ${isSelected
                              ? isWPL
                                ? 'bg-purple-600/30 border-purple-500/50'
                                : 'bg-blue-600/30 border-blue-500/50'
                              : 'bg-slate-700/50 border-slate-600/50 hover:border-slate-500/50'
                            }
                          `}
                          style={{ position: 'relative', zIndex: 10 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-white">{player.name}</div>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5" style={{ color: isWPL ? WPLColors.pink : '#60A5FA' }} />
                            )}
                          </div>
                          <div className="text-xs" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                            {player.role} • #{player.jerseyNumber}
                            {isMatchCaptain && ' • Captain (Match)'}
                            {!isMatchCaptain && player.isCaptain && ' • Captain (Season)'}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Team 1 Impact Player / Nominees */}
              {isIPL && (
                <div
                  className="rounded-2xl p-6 backdrop-blur-xl border"
                  style={isWPL ? {
                    background: WPLColors.purpleRGBA[10],
                    borderColor: WPLColors.purpleRGBA[30],
                  } : {
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {selectedMatch.team1.shortName || selectedMatch.team1.name} - Impact Substitutes
                      </h2>
                      <p className="text-sm" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        IPL: nominate 5 substitutes at the toss (Impact Player is chosen during the match)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                      background: team1ImpactSubsCount === 5
                        ? 'rgba(34, 197, 94, 0.2)'
                        : 'rgba(251, 191, 36, 0.2)',
                      border: `1px solid ${team1ImpactSubsCount === 5 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                    }}>
                      <Users className="w-5 h-5" style={{ color: team1ImpactSubsCount === 5 ? '#22C55E' : '#FBBF24' }} />
                      <span className="font-bold" style={{ color: team1ImpactSubsCount === 5 ? '#22C55E' : '#FBBF24' }}>
                        {team1ImpactSubsCount} / 5
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const selected = team1ImpactSubstitutes[idx] || '';
                        const otherSelected = team1ImpactSubstitutes
                          .filter((id, i) => i !== idx)
                          .filter(Boolean);

                        const options = team1Players
                          .filter((player) => !team1Playing11.includes(player.id) || player.id === selected)
                          .filter((player) => !otherSelected.includes(player.id));

                        return (
                          <div key={idx}>
                            <h4 className="text-sm font-semibold mb-2 text-white">Substitute {idx + 1}</h4>
                            <select
                              value={selected}
                              onChange={(e) => {
                                const next = [...team1ImpactSubstitutes];
                                next[idx] = e.target.value;
                                setTeam1ImpactSubstitutes(next);
                              }}
                              className="w-full px-4 py-3 rounded-lg text-white"
                              style={isWPL ? {
                                background: WPLColors.purpleRGBA[20],
                                border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                              } : {
                                background: '#0F172A',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              <option value="">Select Substitute...</option>
                              {options.map((player) => (
                                <option key={player.id} value={player.id}>
                                  {player.name} ({player.role}) {player.nationality !== 'India' && '🌍'}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>

                    {team1ImpactSubstitutes.some((id) => id && team1Playing11.includes(id)) && (
                      <div className="p-3 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                        <p className="text-sm text-yellow-300">
                          One or more substitutes are also selected in the Playing 11. Substitutes must be outside the Playing 11.
                        </p>
                      </div>
                    )}

                    {(() => {
                      const impact = (selectedMatch as any).impactPlayer?.team1;
                      const impactId = impact?.impact || impact?.playerId || '';
                      const originalId = impact?.original || '';
                      if (!impactId) return null;
                      const impactName = team1Players.find((p) => p.id === impactId)?.name || impactId;
                      const originalName = team1Players.find((p) => p.id === originalId)?.name || originalId;
                      const time = impact?.substitutionTime || (impact?.substitutedAt ? new Date(impact.substitutedAt).toLocaleString() : '');
                      return (
                        <div className="p-3 rounded-lg bg-emerald-600/10 border border-emerald-500/25">
                          <p className="text-sm text-emerald-200">
                            Impact used: <span className="font-semibold">{impactName}</span> for <span className="font-semibold">{originalName || '—'}</span>
                            {time ? ` • ${time}` : ''}
                          </p>
                        </div>
                      );
                    })()}

                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-white/70">
                        Record the actual Impact Player substitution on the <strong>Live Score</strong> page (IN/OUT + timing).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isIPL && (
              <div 
                className="rounded-2xl p-6 backdrop-blur-xl border"
                style={isWPL ? {
                  background: WPLColors.purpleRGBA[10],
                  borderColor: WPLColors.purpleRGBA[30],
                } : {
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedMatch.team1.shortName || selectedMatch.team1.name} - Impact Player
                    </h2>
                    <p className="text-sm" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                      Select impact player from available substitutes
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                    background: team1ImpactPlayer ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                    border: `1px solid ${team1ImpactPlayer ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                  }}>
                    <Users className="w-5 h-5" style={{ color: team1ImpactPlayer ? '#22C55E' : '#FBBF24' }} />
                    <span className="font-bold" style={{ color: team1ImpactPlayer ? '#22C55E' : '#FBBF24' }}>
                      {team1ImpactPlayer ? 'Selected' : 'Not Selected'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Impact Player Selection */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-white">Select Impact Player:</h4>
                    <select
                      value={team1ImpactPlayer}
                      onChange={(e) => handleImpactPlayerSelection('team1', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-white"
                      style={isWPL ? {
                        background: WPLColors.purpleRGBA[20],
                        border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                      } : {
                        background: '#0F172A',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <option value="">Select Impact Player...</option>
                      {team1Players
                        .filter(player => !team1Playing11.includes(player.id))
                        .map(player => (
                          <option key={player.id} value={player.id}>
                            {player.name} ({player.role}) {player.nationality !== 'India' && '🌍'}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Original Player Selection */}
                  {team1ImpactPlayer && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-white">Select Original Player to Substitute:</h4>
                      <select
                        value={team1ImpactOriginalPlayer}
                        onChange={(e) => setTeam1ImpactOriginalPlayer(e.target.value)}
                        disabled={team1Playing11.length === 0}
                        className="w-full px-4 py-3 rounded-lg text-white disabled:opacity-60"
                        style={isWPL ? {
                          background: WPLColors.purpleRGBA[20],
                          border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                        } : {
                          background: '#0F172A',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <option value="">
                          {team1Playing11.length
                            ? `Select Original Player... (${team1Playing11.length}/11 selected)`
                            : 'Select Playing 11 first'}
                        </option>
                        {team1Playing11
                          .filter((id) => id !== team1ImpactPlayer)
                          .map((id) => {
                            const player = team1Players.find((p) => p.id === id);
                            return (
                              <option key={id} value={id}>
                                {player ? `${player.name} (${player.role})` : id}
                              </option>
                            );
                          })}
                      </select>
                      {team1Playing11.length > 0 && team1Playing11.length < 11 && (
                        <div className="mt-2 p-3 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                          <p className="text-sm text-yellow-300">
                            Select all 11 players to see the full Playing 11 list here.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Substitution Timing */}
                  {team1ImpactPlayer && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-white">Substitution Timing:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {substitutionTimingOptions.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handleSubstitution('team1', opt)}
                            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      
                      {team1SubstitutionTime && (
                        <div className="mt-2 p-3 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                          <p className="text-sm text-yellow-300">
                            Impact Player substituted: {team1SubstitutionTime}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Team 2 Selection */}
              <div 
                className="rounded-2xl p-6 backdrop-blur-xl border"
                style={isWPL ? {
                  background: WPLColors.purpleRGBA[10],
                  borderColor: WPLColors.purpleRGBA[30],
                } : {
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {selectedMatch.team2.shortName || selectedMatch.team2.name}
                      </h2>
                      <p className="text-sm" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        Select 11 players from squad ({team2Players.length} available)
                      </p>
                    </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                    background: team2Playing11.length === 11 
                      ? 'rgba(34, 197, 94, 0.2)' 
                      : 'rgba(251, 191, 36, 0.2)',
                    border: `1px solid ${team2Playing11.length === 11 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                  }}>
                    <Users className="w-5 h-5" style={{ color: team2Playing11.length === 11 ? '#22C55E' : '#FBBF24' }} />
                    <span className="font-bold" style={{ color: team2Playing11.length === 11 ? '#22C55E' : '#FBBF24' }}>
                      {team2Playing11.length} / 11
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-2">Match Captain (optional)</label>
                    <select
                      value={team2CaptainId}
                      onChange={(e) => setTeam2CaptainId(e.target.value)}
                      disabled={!team2Playing11Players.length}
                      className="w-full border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 bg-slate-950 text-white disabled:opacity-60"
                    >
                      <option value="">
                        {team2Playing11Players.length ? 'Select captain...' : 'Select Playing XI first'}
                      </option>
                      {team2Playing11Players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}{player.isCaptain ? ' (Season captain)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-white/50 mt-1">
                      Used for (C) on Playing XI, Impact Player, Scorecard, Live Score.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {team2Players.length === 0 ? (
                    <div className="col-span-full text-center py-8 px-4 rounded-xl border-2 border-dashed" style={isWPL ? {
                      background: WPLColors.purpleRGBA[10],
                      borderColor: WPLColors.purpleRGBA[30],
                    } : {
                      background: 'rgba(30, 41, 59, 0.2)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}>
                      <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: isWPL ? WPLColors.pink : '#60A5FA' }} />
                      <p className="text-lg font-semibold text-white mb-2">No Players Found</p>
                      <p className="text-sm mb-4" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        No players found for {selectedMatch.team2.name} in {LEAGUE.toUpperCase()}.
                      </p>
                      <p className="text-xs mb-4" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        Please add players in the <strong>Admin Players</strong> page and ensure they are assigned to this team.
                      </p>
                      <button
                        onClick={() => loadData(true)}
                        className={`
                          px-4 py-2 rounded-lg font-semibold transition-all
                          ${isWPL
                            ? 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300'
                            : 'bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300'
                          }
                        `}
                      >
                        <RefreshCw className="w-4 h-4 inline mr-2" />
                        Refresh Players
                      </button>
                    </div>
                  ) : (
                    team2Players.map((player) => {
                      const isSelected = team2Playing11.includes(player.id);
                      const isMatchCaptain = player.id === team2CaptainId;
                      return (
                        <button
                          key={player.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Button clicked for player:', player.name, player.id);
                            togglePlayer('team2', player.id);
                          }}
                          type="button"
                          className={`
                            p-4 rounded-xl border-2 transition-all text-left cursor-pointer
                            ${isSelected
                              ? isWPL
                                ? 'bg-purple-600/30 border-purple-500/50'
                                : 'bg-blue-600/30 border-blue-500/50'
                              : 'bg-slate-700/50 border-slate-600/50 hover:border-slate-500/50'
                            }
                          `}
                          style={{ position: 'relative', zIndex: 10 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-white">{player.name}</div>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5" style={{ color: isWPL ? WPLColors.pink : '#60A5FA' }} />
                            )}
                          </div>
                          <div className="text-xs" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                            {player.role} • #{player.jerseyNumber}
                            {isMatchCaptain && ' • Captain (Match)'}
                            {!isMatchCaptain && player.isCaptain && ' • Captain (Season)'}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Team 2 Impact Player / Nominees */}
              {isIPL && (
                <div
                  className="rounded-2xl p-6 backdrop-blur-xl border"
                  style={isWPL ? {
                    background: WPLColors.purpleRGBA[10],
                    borderColor: WPLColors.purpleRGBA[30],
                  } : {
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {selectedMatch.team2.shortName || selectedMatch.team2.name} - Impact Substitutes
                      </h2>
                      <p className="text-sm" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        IPL: nominate 5 substitutes at the toss (Impact Player is chosen during the match)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                      background: team2ImpactSubsCount === 5
                        ? 'rgba(34, 197, 94, 0.2)'
                        : 'rgba(251, 191, 36, 0.2)',
                      border: `1px solid ${team2ImpactSubsCount === 5 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                    }}>
                      <Users className="w-5 h-5" style={{ color: team2ImpactSubsCount === 5 ? '#22C55E' : '#FBBF24' }} />
                      <span className="font-bold" style={{ color: team2ImpactSubsCount === 5 ? '#22C55E' : '#FBBF24' }}>
                        {team2ImpactSubsCount} / 5
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const selected = team2ImpactSubstitutes[idx] || '';
                        const otherSelected = team2ImpactSubstitutes
                          .filter((id, i) => i !== idx)
                          .filter(Boolean);

                        const options = team2Players
                          .filter((player) => !team2Playing11.includes(player.id) || player.id === selected)
                          .filter((player) => !otherSelected.includes(player.id));

                        return (
                          <div key={idx}>
                            <h4 className="text-sm font-semibold mb-2 text-white">Substitute {idx + 1}</h4>
                            <select
                              value={selected}
                              onChange={(e) => {
                                const next = [...team2ImpactSubstitutes];
                                next[idx] = e.target.value;
                                setTeam2ImpactSubstitutes(next);
                              }}
                              className="w-full px-4 py-3 rounded-lg text-white"
                              style={isWPL ? {
                                background: WPLColors.purpleRGBA[20],
                                border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                              } : {
                                background: '#0F172A',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              <option value="">Select Substitute...</option>
                              {options.map((player) => (
                                <option key={player.id} value={player.id}>
                                  {player.name} ({player.role}) {player.nationality !== 'India' && '🌍'}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>

                    {team2ImpactSubstitutes.some((id) => id && team2Playing11.includes(id)) && (
                      <div className="p-3 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                        <p className="text-sm text-yellow-300">
                          One or more substitutes are also selected in the Playing 11. Substitutes must be outside the Playing 11.
                        </p>
                      </div>
                    )}

                    {(() => {
                      const impact = (selectedMatch as any).impactPlayer?.team2;
                      const impactId = impact?.impact || impact?.playerId || '';
                      const originalId = impact?.original || '';
                      if (!impactId) return null;
                      const impactName = team2Players.find((p) => p.id === impactId)?.name || impactId;
                      const originalName = team2Players.find((p) => p.id === originalId)?.name || originalId;
                      const time = impact?.substitutionTime || (impact?.substitutedAt ? new Date(impact.substitutedAt).toLocaleString() : '');
                      return (
                        <div className="p-3 rounded-lg bg-emerald-600/10 border border-emerald-500/25">
                          <p className="text-sm text-emerald-200">
                            Impact used: <span className="font-semibold">{impactName}</span> for <span className="font-semibold">{originalName || '—'}</span>
                            {time ? ` • ${time}` : ''}
                          </p>
                        </div>
                      );
                    })()}

                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-white/70">
                        Record the actual Impact Player substitution on the <strong>Live Score</strong> page (IN/OUT + timing).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isIPL && (
              <div 
                className="rounded-2xl p-6 backdrop-blur-xl border"
                style={isWPL ? {
                  background: WPLColors.purpleRGBA[10],
                  borderColor: WPLColors.purpleRGBA[30],
                } : {
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedMatch.team2.shortName || selectedMatch.team2.name} - Impact Player
                    </h2>
                    <p className="text-sm" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                      Select impact player from available substitutes
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                    background: team2ImpactPlayer ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                    border: `1px solid ${team2ImpactPlayer ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                  }}>
                    <Users className="w-5 h-5" style={{ color: team2ImpactPlayer ? '#22C55E' : '#FBBF24' }} />
                    <span className="font-bold" style={{ color: team2ImpactPlayer ? '#22C55E' : '#FBBF24' }}>
                      {team2ImpactPlayer ? 'Selected' : 'Not Selected'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Impact Player Selection */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-white">Select Impact Player:</h4>
                    <select
                      value={team2ImpactPlayer}
                      onChange={(e) => handleImpactPlayerSelection('team2', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-white"
                      style={isWPL ? {
                        background: WPLColors.purpleRGBA[20],
                        border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                      } : {
                        background: '#0F172A',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <option value="">Select Impact Player...</option>
                      {team2Players
                        .filter(player => !team2Playing11.includes(player.id))
                        .map(player => (
                          <option key={player.id} value={player.id}>
                            {player.name} ({player.role}) {player.nationality !== 'India' && '🌍'}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Original Player Selection */}
                  {team2ImpactPlayer && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-white">Select Original Player to Substitute:</h4>
                      <select
                        value={team2ImpactOriginalPlayer}
                        onChange={(e) => setTeam2ImpactOriginalPlayer(e.target.value)}
                        disabled={team2Playing11.length === 0}
                        className="w-full px-4 py-3 rounded-lg text-white disabled:opacity-60"
                        style={isWPL ? {
                          background: WPLColors.purpleRGBA[20],
                          border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                        } : {
                          background: '#0F172A',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <option value="">
                          {team2Playing11.length
                            ? `Select Original Player... (${team2Playing11.length}/11 selected)`
                            : 'Select Playing 11 first'}
                        </option>
                        {team2Playing11
                          .filter((id) => id !== team2ImpactPlayer)
                          .map((id) => {
                            const player = team2Players.find((p) => p.id === id);
                            return (
                              <option key={id} value={id}>
                                {player ? `${player.name} (${player.role})` : id}
                              </option>
                            );
                          })}
                      </select>
                      {team2Playing11.length > 0 && team2Playing11.length < 11 && (
                        <div className="mt-2 p-3 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                          <p className="text-sm text-yellow-300">
                            Select all 11 players to see the full Playing 11 list here.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Substitution Timing */}
                  {team2ImpactPlayer && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-white">Substitution Timing:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {substitutionTimingOptions.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handleSubstitution('team2', opt)}
                            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      
                      {team2SubstitutionTime && (
                        <div className="mt-2 p-3 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                          <p className="text-sm text-yellow-300">
                            Impact Player substituted: {team2SubstitutionTime}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Save Button */}
              <div className="flex flex-col items-end gap-3">
                {selectedMatch.playing11?.setAt ? (
                  <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
                    Published: {new Date(selectedMatch.playing11.setAt).toLocaleString()}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                    Draft only (not visible to end users)
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => handleSave({ publish: false })}
                  disabled={team1Playing11.length !== 11 || team2Playing11.length !== 11 || saveStatus === 'saving'}
                  className={`
                    px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all
                    ${team1Playing11.length === 11 && team2Playing11.length === 11
                      ? isWPL
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Save className="w-5 h-5" />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
                </button>

                <button
                  onClick={() => handleSave({ publish: true })}
                  disabled={
                    team1Playing11.length !== 11 ||
                    team2Playing11.length !== 11 ||
                    saveStatus === 'saving' ||
                    (isIPL && (team1ImpactSubsCount !== 5 || team2ImpactSubsCount !== 5))
                  }
                  className={`
                    px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all
                    ${team1Playing11.length === 11 && team2Playing11.length === 11
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {saveStatus === 'saving'
                    ? 'Publishing...'
                    : (selectedMatch.playing11?.setAt ? 'Republish Playing 11' : 'Publish Playing 11')}
                </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="rounded-2xl p-12 text-center backdrop-blur-xl border"
              style={isWPL ? {
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.purpleRGBA[30],
              } : {
                background: 'rgba(30, 41, 59, 0.4)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <p style={{ color: isWPL ? WPLColors.textSecondary : '#9CA3AF' }} className="text-lg">
                Please select a match to select playing 11
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
