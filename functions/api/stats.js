// API endpoint to calculate statistics from scorecards

export async function onRequest(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const league = url.searchParams.get('league') || 'wpl';
    const statsType = url.searchParams.get('type') || 'all'; // all, batting, bowling, teams, orangeCap, purpleCap

    // Fetch all published scorecards for the league
    const kvNamespace = env.IPL_CACHE;
    
    if (!kvNamespace) {
      return new Response(JSON.stringify({ error: 'KV namespace not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all scorecard keys
    const listResult = await kvNamespace.list({ prefix: 'scorecard_' });
    const keys = listResult.keys.map(k => k.name);

    // Fetch all scorecards and filter by league
    const scorecardPromises = keys.map(key => kvNamespace.get(key, 'json'));
    const allScorecards = (await Promise.all(scorecardPromises)).filter(Boolean);
    
    const debugInfo = {
      totalKeys: keys.length,
      totalScorecards: allScorecards.length,
      requestedLeague: league,
      allScorecards: allScorecards.map(s => ({ 
        id: s.id, 
        matchId: s.matchId,
        league: s.league, 
        draft: s.draft,
        hasInnings1: !!s.innings1,
        hasInnings2: !!s.innings2
      }))
    };
    
    // Filter by league and only get published (non-draft) scorecards
    const scorecards = allScorecards.filter(s => 
      s.league === league && s.draft === false
    );

    debugInfo.filteredCount = scorecards.length;

    if (scorecards.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No published scorecards found',
        debug: debugInfo,
        battingStats: [],
        bowlingStats: [],
        teamStats: [],
        orangeCap: null,
        purpleCap: null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate statistics inline (since we can't import the class easily)
    const stats = calculateStatsFromScorecards(scorecards);

    // Calculate requested statistics
    let response = {};

    switch (statsType) {
      case 'batting':
        response = {
          battingStats: stats.battingStats,
          orangeCap: stats.orangeCap,
        };
        break;

      case 'bowling':
        response = {
          bowlingStats: stats.bowlingStats,
          purpleCap: stats.purpleCap,
        };
        break;

      case 'teams':
        response = {
          teamStats: stats.teamStats,
        };
        break;

      case 'orangeCap':
        response = stats.orangeCap;
        break;

      case 'purpleCap':
        response = stats.purpleCap;
        break;

      case 'top':
        const limit = parseInt(url.searchParams.get('limit') || '10');
        response = {
          topBatsmen: stats.battingStats.slice(0, limit),
          topBowlers: stats.bowlingStats.slice(0, limit),
          orangeCap: stats.orangeCap,
          purpleCap: stats.purpleCap,
        };
        break;

      case 'all':
      default:
        response = {
          battingStats: stats.battingStats,
          bowlingStats: stats.bowlingStats,
          teamStats: stats.teamStats,
          orangeCap: stats.orangeCap,
          purpleCap: stats.purpleCap,
        };
        break;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to calculate statistics', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Helper function to normalize team names for consistency
function normalizeTeamName(name) {
  if (!name) return 'Unknown Team';
  const trimmed = String(name).trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'kings xi punjab' || lower === 'kings eleven punjab') {
    return 'Punjab Kings';
  }

  return trimmed;
}

function calculateStatsFromScorecards(scorecards) {
  // Batting statistics
  const battingMap = {};
  
  scorecards.forEach(scorecard => {
    const matchInfo = scorecard.matchInfo || {};
    const team1Name = normalizeTeamName(matchInfo.team1?.name || matchInfo.team1?.shortName || 'Team 1');
    const team2Name = normalizeTeamName(matchInfo.team2?.name || matchInfo.team2?.shortName || 'Team 2');
    const team1Id = matchInfo.team1?.id;
    const team2Id = matchInfo.team2?.id;
    
    // Handle both old format (innings1, innings2) and new format (innings array)
    const innings = scorecard.innings || [scorecard.innings1, scorecard.innings2].filter(Boolean);
    
    innings.forEach((inning, inningIndex) => {
      if (!inning?.batting) return;
      
      // Determine which team is batting in this inning
      // First check if innings has battingTeamId, then check battingTeam name, otherwise fall back to index
      let battingTeamName;
      if (inning.battingTeamId) {
        battingTeamName = inning.battingTeamId === team1Id ? team1Name : team2Name;
      } else if (inning.battingTeam) {
        battingTeamName = normalizeTeamName(inning.battingTeam);
      } else {
        // Fallback: assume innings order (may be incorrect)
        battingTeamName = inningIndex === 0 ? team1Name : team2Name;
      }
      
      inning.batting.forEach(batsman => {
        if (!batsman.playerId) return;
        
        const playerId = batsman.playerId;
        if (!battingMap[playerId]) {
          battingMap[playerId] = {
            playerId,
            playerName: batsman.name || 'Unknown',
            teamName: normalizeTeamName(batsman.teamName || inning.battingTeam || battingTeamName),
            runs: 0,
            ballsFaced: 0,
            fours: 0,
            sixes: 0,
            innings: 0,
            notOuts: 0,
            highestScore: 0,
            fifties: 0,
            hundreds: 0,
            matches: new Set(),
          };
        }
        
        const stats = battingMap[playerId];
        const runs = parseInt(batsman.runs) || 0;
        const balls = parseInt(batsman.balls) || 0;
        const fours = parseInt(batsman.fours) || 0;
        const sixes = parseInt(batsman.sixes) || 0;
        
        stats.runs += runs;
        stats.ballsFaced += balls;
        stats.fours += fours;
        stats.sixes += sixes;
        stats.innings += 1;
        stats.matches.add(scorecard.matchId);
        
        // Check dismissal type - handle both old and new formats
        const dismissalType = batsman.dismissal?.type || batsman.howOut;
        if (!dismissalType || dismissalType.toLowerCase() === 'not-out' || dismissalType.toLowerCase() === 'not out') {
          stats.notOuts += 1;
        }
        
        if (runs > stats.highestScore) {
          stats.highestScore = runs;
        }
        
        if (runs >= 100) {
          stats.hundreds += 1;
        } else if (runs >= 50) {
          stats.fifties += 1;
        }
      });
    });
  });
  
  // Calculate derived batting stats
  const battingStats = Object.values(battingMap).map(stats => {
    const matches = stats.matches.size;
    const dismissals = stats.innings - stats.notOuts;
    const average = dismissals > 0 ? (stats.runs / dismissals).toFixed(2) : stats.runs.toFixed(2);
    const strikeRate = stats.ballsFaced > 0 ? ((stats.runs / stats.ballsFaced) * 100).toFixed(2) : '0.00';
    
    return {
      playerId: stats.playerId,
      playerName: stats.playerName,
      teamName: stats.teamName,
      matches,
      innings: stats.innings,
      runs: stats.runs,
      ballsFaced: stats.ballsFaced,
      average: parseFloat(average),
      strikeRate: parseFloat(strikeRate),
      highestScore: stats.highestScore,
      fours: stats.fours,
      sixes: stats.sixes,
      fifties: stats.fifties,
      hundreds: stats.hundreds,
      notOuts: stats.notOuts,
    };
  }).sort((a, b) => b.runs - a.runs);
  
  // Bowling statistics
  const bowlingMap = {};
  
  scorecards.forEach(scorecard => {
    const matchInfo = scorecard.matchInfo || {};
    const team1Name = normalizeTeamName(matchInfo.team1?.name || matchInfo.team1?.shortName || 'Team 1');
    const team2Name = normalizeTeamName(matchInfo.team2?.name || matchInfo.team2?.shortName || 'Team 2');
    const team1Id = matchInfo.team1?.id;
    const team2Id = matchInfo.team2?.id;
    
    // Handle both old format (innings1, innings2) and new format (innings array)
    const innings = scorecard.innings || [scorecard.innings1, scorecard.innings2].filter(Boolean);
    
    innings.forEach((inning, inningIndex) => {
      if (!inning?.bowling) return;
      
      // Determine which team is bowling in this inning
      // First check if innings has bowlingTeamId or battingTeamId, then check team names, otherwise fall back to index
      let bowlingTeamName;
      if (inning.bowlingTeamId) {
        bowlingTeamName = inning.bowlingTeamId === team1Id ? team1Name : team2Name;
      } else if (inning.battingTeamId) {
        // Bowling team is opposite of batting team
        bowlingTeamName = inning.battingTeamId === team1Id ? team2Name : team1Name;
      } else if (inning.bowlingTeam) {
        bowlingTeamName = normalizeTeamName(inning.bowlingTeam);
      } else if (inning.battingTeam) {
        // Bowling team is opposite of batting team
        const battingTeamName = normalizeTeamName(inning.battingTeam);
        bowlingTeamName = battingTeamName === team1Name ? team2Name : team1Name;
      } else {
        // Fallback: opposite of batting team by index
        bowlingTeamName = inningIndex === 0 ? team2Name : team1Name;
      }
      
      inning.bowling.forEach(bowler => {
        if (!bowler.playerId) return;
        
        const playerId = bowler.playerId;
        if (!bowlingMap[playerId]) {
          bowlingMap[playerId] = {
            playerId,
            playerName: bowler.name || 'Unknown',
            teamName: normalizeTeamName(bowler.teamName || inning.bowlingTeam || bowlingTeamName),
            wickets: 0,
            runs: 0,
            overs: 0,
            maidens: 0,
            wides: 0,
            noBalls: 0,
            innings: 0,
            matches: new Set(),
            bestWickets: 0,
            bestRuns: 999,
            fourWickets: 0,
            fiveWickets: 0,
          };
        }
        
        const stats = bowlingMap[playerId];
        const wickets = parseInt(bowler.wickets) || 0;
        const runs = parseInt(bowler.runs) || 0;
        const overs = parseFloat(bowler.overs) || 0;
        const maidens = parseInt(bowler.maidens) || 0;
        const wides = parseInt(bowler.wides) || 0;
        const noBalls = parseInt(bowler.noBalls) || 0;
        
        stats.wickets += wickets;
        stats.runs += runs;
        stats.overs += overs;
        stats.maidens += maidens;
        stats.wides += wides;
        stats.noBalls += noBalls;
        stats.innings += 1;
        stats.matches.add(scorecard.matchId);
        
        // Track 4-wicket and 5-wicket hauls
        if (wickets >= 5) {
          stats.fiveWickets += 1;
        } else if (wickets >= 4) {
          stats.fourWickets += 1;
        }
        
        // Track best bowling
        if (wickets > stats.bestWickets || (wickets === stats.bestWickets && runs < stats.bestRuns)) {
          stats.bestWickets = wickets;
          stats.bestRuns = runs;
        }
      });
    });
  });
  
  // Calculate derived bowling stats
  const bowlingStats = Object.values(bowlingMap).map(stats => {
    const matches = stats.matches.size;
    const economy = stats.overs > 0 ? (stats.runs / stats.overs).toFixed(2) : '0.00';
    const average = stats.wickets > 0 ? (stats.runs / stats.wickets).toFixed(2) : '0.00';
    const strikeRate = stats.wickets > 0 ? ((stats.overs * 6) / stats.wickets).toFixed(2) : '0.00';
    const bestBowling = `${stats.bestWickets}/${stats.bestRuns}`;
    
    return {
      playerId: stats.playerId,
      playerName: stats.playerName,
      teamName: stats.teamName,
      matches,
      innings: stats.innings,
      wickets: stats.wickets,
      runs: stats.runs,
      overs: stats.overs,
      economy: parseFloat(economy),
      average: parseFloat(average),
      strikeRate: parseFloat(strikeRate),
      maidens: stats.maidens,
      bestBowling,
      wides: stats.wides,
      noBalls: stats.noBalls,
      fourWickets: stats.fourWickets,
      fiveWickets: stats.fiveWickets,
    };
  }).sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);

  const toNumber = (value) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizeToken = (value) => {
    if (value === null || value === undefined) return '';
    return normalizeTeamName(String(value))
      .toLowerCase()
      .replace(/\(wpl\)/g, '')
      .replace(/[^a-z0-9]+/g, '');
  };

  const resolveTeamKeyByLabel = (label, team1, team2, team1Key, team2Key) => {
    const token = normalizeToken(label);
    if (!token) return '';

    const team1Tokens = [team1?.id, team1?.name, team1?.shortName].map(normalizeToken).filter(Boolean);
    const team2Tokens = [team2?.id, team2?.name, team2?.shortName].map(normalizeToken).filter(Boolean);

    if (team1Tokens.some((candidate) => token === candidate || token.includes(candidate) || candidate.includes(token))) {
      return team1Key;
    }
    if (team2Tokens.some((candidate) => token === candidate || token.includes(candidate) || candidate.includes(token))) {
      return team2Key;
    }

    return '';
  };
  
  // Team statistics
  const teamMap = {};
  
  scorecards.forEach(scorecard => {
    const { matchInfo, innings1, innings2 } = scorecard;
    if (!matchInfo) return;

    const team1 = matchInfo.team1 || {};
    const team2 = matchInfo.team2 || {};
    const team1Key = String(team1.id || '').trim();
    const team2Key = String(team2.id || '').trim();

    if (!team1Key || !team2Key) {
      return;
    }

    const ensureTeam = (teamKey, teamData) => {
      if (!teamMap[teamKey]) {
        teamMap[teamKey] = {
          teamId: teamData.id,
          teamName: normalizeTeamName(teamData.name || teamData.shortName || 'Unknown'),
          matches: 0,
          wins: 0,
          losses: 0,
          noResult: 0,
          points: 0,
          runsScored: 0,
          runsConceded: 0,
          wicketsTaken: 0,
          wicketsLost: 0,
          oversPlayed: 0,
          oversBowled: 0,
        };
      }
      return teamMap[teamKey];
    };

    const team1Stats = ensureTeam(team1Key, team1);
    const team2Stats = ensureTeam(team2Key, team2);

    team1Stats.matches += 1;
    team2Stats.matches += 1;

    const innings = Array.isArray(scorecard.innings) && scorecard.innings.length
      ? scorecard.innings
      : [innings1, innings2].filter(Boolean);

    innings.forEach((inning, index) => {
      if (!inning) return;

      let battingTeamKey = '';
      const battingTeamId = String(inning.battingTeamId || '').trim();
      if (battingTeamId && (battingTeamId === team1Key || battingTeamId === team2Key)) {
        battingTeamKey = battingTeamId;
      }

      if (!battingTeamKey && inning.battingTeam) {
        battingTeamKey = resolveTeamKeyByLabel(inning.battingTeam, team1, team2, team1Key, team2Key);
      }

      if (!battingTeamKey) {
        battingTeamKey = index === 0 ? team1Key : team2Key;
      }

      const bowlingTeamKey = battingTeamKey === team1Key ? team2Key : team1Key;

      const runs = toNumber(inning.totalRuns ?? inning.runs);
      const wickets = toNumber(inning.totalWickets ?? inning.wickets);
      const overs = toNumber(inning.totalOvers ?? inning.overs);

      if (teamMap[battingTeamKey]) {
        teamMap[battingTeamKey].runsScored += runs;
        teamMap[battingTeamKey].wicketsLost += wickets;
        teamMap[battingTeamKey].oversPlayed += overs;
      }

      if (teamMap[bowlingTeamKey]) {
        teamMap[bowlingTeamKey].runsConceded += runs;
        teamMap[bowlingTeamKey].wicketsTaken += wickets;
        teamMap[bowlingTeamKey].oversBowled += overs;
      }
    });

    const winnerRaw = scorecard.result?.winner ?? matchInfo.winner;
    const winnerToken = normalizeToken(winnerRaw);
    const team1Token = normalizeToken(team1.id);
    const team2Token = normalizeToken(team2.id);

    let winnerKey = '';
    if (winnerToken) {
      if (winnerToken === team1Token) {
        winnerKey = team1Key;
      } else if (winnerToken === team2Token) {
        winnerKey = team2Key;
      } else {
        winnerKey = resolveTeamKeyByLabel(winnerRaw, team1, team2, team1Key, team2Key);
      }
    }

    const resultHint = [scorecard.result?.winner, scorecard.result?.margin, matchInfo.result]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const isTieOrNoResult = /(tie|no result|abandon|abandoned|washout|draw)/.test(resultHint);

    if (winnerKey === team1Key) {
      team1Stats.wins += 1;
      team1Stats.points += 2;
      team2Stats.losses += 1;
    } else if (winnerKey === team2Key) {
      team2Stats.wins += 1;
      team2Stats.points += 2;
      team1Stats.losses += 1;
    } else if (isTieOrNoResult || !winnerKey) {
      team1Stats.noResult += 1;
      team2Stats.noResult += 1;
      team1Stats.points += 1;
      team2Stats.points += 1;
    }
  });
  
  // Calculate derived team stats
  const teamStats = Object.values(teamMap).map(stats => {
    const runRate = stats.oversPlayed > 0 ? (stats.runsScored / stats.oversPlayed).toFixed(2) : '0.00';
    const againstRate = stats.oversBowled > 0 ? (stats.runsConceded / stats.oversBowled).toFixed(2) : '0.00';
    const nrr = (parseFloat(runRate) - parseFloat(againstRate)).toFixed(2);
    
    return {
      teamId: stats.teamId,
      teamName: stats.teamName,
      matches: stats.matches,
      wins: stats.wins,
      losses: stats.losses,
      noResult: stats.noResult,
      points: stats.points,
      netRunRate: parseFloat(nrr),
      runsScored: stats.runsScored,
      runsConceded: stats.runsConceded,
      wicketsTaken: stats.wicketsTaken,
      wicketsLost: stats.wicketsLost,
      oversPlayed: stats.oversPlayed,
      oversBowled: stats.oversBowled,
    };
  }).sort((a, b) => b.points - a.points || b.netRunRate - a.netRunRate);
  
  // Orange and Purple caps
  const orangeCap = battingStats[0] || null;
  const purpleCap = bowlingStats[0] || null;
  
  return {
    battingStats,
    bowlingStats,
    teamStats,
    orangeCap,
    purpleCap,
  };
}
