// COMPREHENSIVE Excel export with ALL scorecard data
export const exportComprehensiveExcel = (scorecard: any) => {
  console.log('🚀 Starting COMPREHENSIVE Excel export with ALL scorecard data...');
  console.log('📊 Scorecard structure analysis:', {
    hasScorecard: !!scorecard,
    hasMatchInfo: !!scorecard?.matchInfo,
    hasInnings: !!scorecard?.innings,
    inningsLength: scorecard?.innings?.length || 0,
    team1Name: scorecard?.matchInfo?.team1?.name || 'MISSING',
    team2Name: scorecard?.matchInfo?.team2?.name || 'MISSING',
    venue: scorecard?.matchInfo?.venue || 'MISSING',
    date: scorecard?.matchInfo?.date || 'MISSING',
    firstInnings: scorecard?.innings?.[0] || null,
    battingLength: scorecard?.innings?.[0]?.batting?.length || 0,
    bowlingLength: scorecard?.innings?.[0]?.bowling?.length || 0,
    extras: scorecard?.innings?.[0]?.extras || null,
    fowLength: scorecard?.innings?.[0]?.fallOfWickets?.length || 0,
    partnershipsLength: scorecard?.innings?.[0]?.partnerships?.length || 0,
    powerplays: scorecard?.innings?.[0]?.powerplays || null
  });
  
  const XLSX = (window as any).XLSX;
  if (!XLSX) {
    console.error('❌ XLSX library not available');
    alert('Excel library not available');
    return;
  }

  console.log('✅ XLSX library available, creating workbook...');

  const wb = XLSX.utils.book_new();

  // 1. COMPREHENSIVE Match Overview
  const matchData = [
    ['🏆 WPL 2026 COMPREHENSIVE MATCH REPORT', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['MATCH INFORMATION', '', '', '', '', '', '', ''],
    ['Match ID', scorecard?.matchId || scorecard?.matchInfo?.matchId || 'N/A', '', 'League', scorecard?.league || 'WPL', '', '', ''],
    ['Team 1', scorecard?.matchInfo?.team1?.name || 'Unknown Team', '', 'Team 2', scorecard?.matchInfo?.team2?.name || 'Unknown Team', '', '', ''],
    ['Team 1 ID', scorecard?.matchInfo?.team1?.id || 'N/A', '', 'Team 2 ID', scorecard?.matchInfo?.team2?.id || 'N/A', '', '', ''],
    ['Venue', scorecard?.matchInfo?.venue || 'Unknown Venue', '', 'Date', scorecard?.matchInfo?.date || 'Unknown Date', '', '', ''],
    ['Time', scorecard?.matchInfo?.time || 'Unknown Time', '', 'Status', scorecard?.matchInfo?.status || 'In Progress', '', '', ''],
    ['Toss Winner', scorecard?.matchInfo?.toss?.winner || 'N/A', '', 'Decision', scorecard?.matchInfo?.toss?.decision || 'N/A', '', '', ''],
    ['Toss Decision', scorecard?.matchInfo?.toss?.decision || 'N/A', '', 'Result Winner', scorecard?.result?.winner || 'To be determined', '', '', ''],
    ['Margin', scorecard?.result?.margin || 'N/A', '', 'Man of Match', scorecard?.result?.manOfTheMatch || 'N/A', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['INNINGS SUMMARY', '', '', '', '', '', '', ''],
    ['Total Innings', scorecard?.innings?.length || 0, '', 'Active Innings', scorecard?.innings?.length || 0, '', '', '']
  ];

  // Add innings-specific data
  if (scorecard?.innings && scorecard.innings.length > 0) {
    scorecard.innings.forEach((innings: any, index: number) => {
      matchData.push([
        `Innings ${index + 1}`,
        `Runs: ${innings.totalRuns || 0}`,
        `Wickets: ${innings.totalWickets || 0}`,
        `Overs: ${innings.totalOvers || 0}`,
        `Batting Team: ${innings.battingTeamId || 'N/A'}`,
        '',
        ''
      ]);
    });
  }
  
  const ws1 = XLSX.utils.aoa_to_sheet(matchData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Match Overview');

  // 2. COMPREHENSIVE Batting Data
  const battingData = [
    ['🏏 COMPREHENSIVE BATTING ANALYSIS', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Innings', 'Player', 'Player ID', 'Position', 'Runs', 'Balls', 'Strike Rate', 'Fours', 'Sixes', 'Minutes', 'Dismissal Type', 'Dismissal Details', 'Performance', 'Impact Score', 'Runs %', 'Boundary %', 'Dot %', 'Badge']
  ];

  // Process ALL innings batting data
  if (scorecard?.innings && scorecard.innings.length > 0) {
    console.log('🏏 Processing batting data for', scorecard.innings.length, 'innings');
    
    scorecard.innings.forEach((innings: any, inningsIndex: number) => {
      console.log(`📊 Innings ${inningsIndex + 1}:`, {
        battingTeamId: innings.battingTeamId,
        battingArray: innings.batting,
        battingLength: innings.batting?.length || 0,
        totalRuns: innings.totalRuns
      });
      
      const totalRuns = innings.totalRuns || 1;
      
      if (innings.batting && innings.batting.length > 0) {
        console.log(`🏏 Processing ${innings.batting.length} batters for innings ${inningsIndex + 1}`);
        
        innings.batting.forEach((batter: any, batterIndex: number) => {
          console.log(`📊 Batter ${batterIndex + 1}:`, {
            name: batter.name,
            playerId: batter.playerId,
            runs: batter.runs,
            balls: batter.balls,
            fours: batter.fours,
            sixes: batter.sixes,
            minutes: batter.minutes,
            dismissal: batter.dismissal
          });
          
          const sr = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(1) : '0.0';
          const runsPercent = totalRuns > 0 ? ((batter.runs / totalRuns) * 100).toFixed(1) : '0.0';
          const boundaryRuns = ((batter.fours || 0) * 4) + ((batter.sixes || 0) * 6);
          const boundaryPercent = batter.runs > 0 ? ((boundaryRuns / batter.runs) * 100).toFixed(1) : '0.0';
          const dotPercent = batter.balls > 0 ? (((batter.balls - (batter.fours || 0) - (batter.sixes || 0)) / batter.balls) * 100).toFixed(1) : '0.0';
          const impactScore = calculateImpactScore(batter);
          const performance = getPerformanceRating(batter);
          const badge = getPerformanceBadge(batter);
          
          const battingRow = [
            inningsIndex + 1,
            batter.name || 'Unknown',
            batter.playerId || 'N/A',
            batterIndex + 1,
            batter.runs || 0,
            batter.balls || 0,
            sr,
            batter.fours || 0,
            batter.sixes || 0,
            batter.minutes || 0,
            batter.dismissal?.type || 'Not Out',
            batter.dismissal?.details || formatDismissal(batter.dismissal),
            performance,
            impactScore,
            `${runsPercent}%`,
            `${boundaryPercent}%`,
            `${dotPercent}%`,
            badge
          ];
          
          console.log(`📊 Adding batting row:`, battingRow);
          battingData.push(battingRow);
        });
      } else {
        console.log(`❌ No batting data found for innings ${inningsIndex + 1}`);
      }
    });
  } else {
    console.log('❌ No innings data found in scorecard');
  }
  
  const ws2 = XLSX.utils.aoa_to_sheet(battingData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Comprehensive Batting');

  // 3. COMPREHENSIVE Bowling Data
  const bowlingData = [
    ['⚡ COMPREHENSIVE BOWLING ANALYSIS', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Innings', 'Bowler', 'Player ID', 'Overs', 'Balls', 'Runs', 'Wickets', 'Economy', 'Maidens', 'Dots', 'Wides', 'No Balls', 'Performance', 'Score', 'Grade', 'Badge']
  ];

  // Process ALL innings bowling data
  if (scorecard?.innings && scorecard.innings.length > 0) {
    console.log('⚡ Processing bowling data for', scorecard.innings.length, 'innings');
    
    scorecard.innings.forEach((innings: any, inningsIndex: number) => {
      console.log(`📊 Innings ${inningsIndex + 1} bowling:`, {
        bowlingArray: innings.bowling,
        bowlingLength: innings.bowling?.length || 0
      });
      
      if (innings.bowling && innings.bowling.length > 0) {
        console.log(`⚡ Processing ${innings.bowling.length} bowlers for innings ${inningsIndex + 1}`);
        
        innings.bowling.forEach((bowler: any) => {
          console.log(`📊 Bowler:`, {
            name: bowler.name,
            playerId: bowler.playerId,
            overs: bowler.overs,
            runs: bowler.runs,
            wickets: bowler.wickets,
            maidens: bowler.maidens,
            dots: bowler.dots,
            wides: bowler.wides,
            noBalls: bowler.noBalls
          });
          
          const economy = bowler.overs > 0 ? (bowler.runs / bowler.overs).toFixed(2) : '0.00';
          const performance = getBowlingPerformance(bowler);
          const score = calculateBowlingScore(bowler);
          const grade = getBowlingGrade(parseFloat(economy), bowler.wickets);
          const badge = getBowlingBadge(bowler.wickets, parseFloat(economy));
          
          const bowlingRow = [
            inningsIndex + 1,
            bowler.name || 'Unknown',
            bowler.playerId || 'N/A',
            bowler.overs || 0,
            bowler.balls || (bowler.overs ? bowler.overs * 6 : 0),
            bowler.runs || 0,
            bowler.wickets || 0,
            economy,
            bowler.maidens || 0,
            bowler.dots || 0,
            bowler.wides || 0,
            bowler.noBalls || 0,
            performance,
            score,
            grade,
            badge
          ];
          
          console.log(`📊 Adding bowling row:`, bowlingRow);
          bowlingData.push(bowlingRow);
        });
      } else {
        console.log(`❌ No bowling data found for innings ${inningsIndex + 1}`);
      }
    });
  } else {
    console.log('❌ No innings data found for bowling processing');
  }
  
  const ws3 = XLSX.utils.aoa_to_sheet(bowlingData);
  XLSX.utils.book_append_sheet(wb, ws3, 'Comprehensive Bowling');

  // 4. COMPREHENSIVE Extras Data
  const extrasData = [
    ['📊 COMPREHENSIVE EXTRAS ANALYSIS', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    ['Innings', 'Wides', 'No Balls', 'Byes', 'Leg Byes', 'Total Extras', 'Percentage of Total', 'Extras Per Over']
  ];

  // Process ALL innings extras data
  if (scorecard?.innings && scorecard.innings.length > 0) {
    console.log('📊 Processing extras data for', scorecard.innings.length, 'innings');
    
    scorecard.innings.forEach((innings: any, inningsIndex: number) => {
      console.log(`📊 Innings ${inningsIndex + 1} extras:`, innings.extras);
      
      const extras = innings.extras || {};
      const totalExtras = (extras.wides || 0) + (extras.noBalls || 0) + (extras.byes || 0) + (extras.legByes || 0);
      const totalRuns = innings.totalRuns || 1;
      const percentage = ((totalExtras / totalRuns) * 100).toFixed(1);
      const overs = innings.totalOvers || 1;
      const extrasPerOver = (totalExtras / overs).toFixed(2);
      
      console.log(`📊 Extras calculation for innings ${inningsIndex + 1}:`, {
        wides: extras.wides,
        noBalls: extras.noBalls,
        byes: extras.byes,
        legByes: extras.legByes,
        totalExtras,
        totalRuns,
        percentage,
        overs,
        extrasPerOver
      });
      
      const extrasRow = [
        inningsIndex + 1,
        extras.wides || 0,
        extras.noBalls || 0,
        extras.byes || 0,
        extras.legByes || 0,
        totalExtras,
        `${percentage}%`,
        extrasPerOver
      ];
      
      console.log(`📊 Adding extras row:`, extrasRow);
      extrasData.push(extrasRow);
    });
  } else {
    console.log('❌ No innings data found for extras processing');
  }
  
  const ws4 = XLSX.utils.aoa_to_sheet(extrasData);
  XLSX.utils.book_append_sheet(wb, ws4, 'Comprehensive Extras');

  // 5. COMPREHENSIVE Fall of Wickets Data
  const fowData = [
    ['🎯 COMPREHENSIVE FALL OF WICKETS', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    ['Innings', 'Wicket Number', 'Score', 'Over', 'Batsman Dismissed', 'Dismissal Type', 'Details', 'Partnership Runs', 'Partnership Balls']
  ];

  // Process ALL innings fall of wickets data
  if (scorecard?.innings && scorecard.innings.length > 0) {
    console.log('🎯 Processing fall of wickets data for', scorecard.innings.length, 'innings');
    
    scorecard.innings.forEach((innings: any, inningsIndex: number) => {
      console.log(`🎯 Innings ${inningsIndex + 1} FOW:`, innings.fallOfWickets);
      
      if (innings.fallOfWickets && innings.fallOfWickets.length > 0) {
        console.log(`🎯 Processing ${innings.fallOfWickets.length} wickets for innings ${inningsIndex + 1}`);
        
        innings.fallOfWickets.forEach((fow: any, index: number) => {
          console.log(`🎯 Wicket ${index + 1}:`, {
            score: fow.score,
            over: fow.over,
            batsman: fow.batsman,
            dismissalType: fow.dismissalType,
            details: fow.details,
            partnershipRuns: fow.partnershipRuns,
            partnershipBalls: fow.partnershipBalls
          });
          
          const fowRow = [
            inningsIndex + 1,
            index + 1,
            fow.score || 'N/A',
            fow.over || 'N/A',
            fow.batsman || 'N/A',
            fow.dismissalType || 'N/A',
            fow.details || 'N/A',
            fow.partnershipRuns || 'N/A',
            fow.partnershipBalls || 'N/A'
          ];
          
          console.log(`🎯 Adding FOW row:`, fowRow);
          fowData.push(fowRow);
        });
      } else {
        console.log(`❌ No fall of wickets data found for innings ${inningsIndex + 1}`);
      }
    });
  } else {
    console.log('❌ No innings data found for FOW processing');
  }
  
  const ws5 = XLSX.utils.aoa_to_sheet(fowData);
  XLSX.utils.book_append_sheet(wb, ws5, 'Fall of Wickets');

  // 6. COMPREHENSIVE Powerplay Data
  const powerplayData = [
    ['⚡ COMPREHENSIVE POWERPLAY ANALYSIS', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['Innings', 'Phase', 'Overs', 'Runs', 'Wickets', 'Run Rate', 'Economy', 'Performance', 'Grade', 'Impact']
  ];

  // Process ALL innings powerplay data
  if (scorecard?.innings && scorecard.innings.length > 0) {
    console.log('⚡ Processing powerplay data for', scorecard.innings.length, 'innings');
    
    scorecard.innings.forEach((innings: any, inningsIndex: number) => {
      const powerplays = innings.powerplays;
      console.log(`⚡ Innings ${inningsIndex + 1} powerplays:`, powerplays);
      
      if (powerplays) {
        const mandatory = powerplays.mandatory || { overs: '6', runs: 0 };
        const optional = powerplays.optional || { overs: '4', runs: 0 };
        
        console.log(`⚡ Powerplay data for innings ${inningsIndex + 1}:`, {
          mandatory: mandatory,
          optional: optional
        });
        
        const mandatoryRR = mandatory.overs ? (mandatory.runs / parseFloat(mandatory.overs)).toFixed(2) : '0.00';
        const optionalRR = optional.overs ? (optional.runs / parseFloat(optional.overs)).toFixed(2) : '0.00';
        const totalOvers = parseFloat(mandatory.overs) + parseFloat(optional.overs);
        const totalRuns = mandatory.runs + optional.runs;
        const totalRR = totalOvers > 0 ? (totalRuns / totalOvers).toFixed(2) : '0.00';
        
        powerplayData.push(
          [inningsIndex + 1, 'Mandatory Powerplay', mandatory.overs, mandatory.runs, 0, mandatoryRR, mandatoryRR, getPowerplayPerformance('mandatory', parseFloat(mandatoryRR)), getPowerplayGrade('mandatory', parseFloat(mandatoryRR)), getPowerplayImpact('mandatory', parseFloat(mandatoryRR))],
          [inningsIndex + 1, 'Optional Powerplay', optional.overs, optional.runs, 0, optionalRR, optionalRR, getPowerplayPerformance('optional', parseFloat(optionalRR)), getPowerplayGrade('optional', parseFloat(optionalRR)), getPowerplayImpact('optional', parseFloat(optionalRR))],
          [inningsIndex + 1, 'Total Powerplay', totalOvers, totalRuns, 0, totalRR, totalRR, getPowerplayPerformance('total', parseFloat(totalRR)), getPowerplayGrade('total', parseFloat(totalRR)), getPowerplayImpact('total', parseFloat(totalRR))]
        );
      } else {
        console.log(`❌ No powerplay data found for innings ${inningsIndex + 1}`);
        // Add default powerplay data if not available
        powerplayData.push(
          [inningsIndex + 1, 'Mandatory Powerplay', '6', 0, 0, '0.00', '0.00', 'No Data', 'N/A', 'N/A'],
          [inningsIndex + 1, 'Optional Powerplay', '4', 0, 0, '0.00', '0.00', 'No Data', 'N/A', 'N/A'],
          [inningsIndex + 1, 'Total Powerplay', '10', 0, 0, '0.00', '0.00', 'No Data', 'N/A', 'N/A']
        );
      }
    });
  } else {
    console.log('❌ No innings data found for powerplay processing');
  }
  
  const ws6 = XLSX.utils.aoa_to_sheet(powerplayData);
  XLSX.utils.book_append_sheet(wb, ws6, 'Powerplay Analysis');

  // 7. COMPREHENSIVE Partnerships Data
  const partnershipData = [
    ['🤝 COMPREHENSIVE PARTNERSHIPS ANALYSIS', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Innings', 'Partnership', 'Batsman 1', 'Batsman 2', 'Runs', 'Balls', 'Strike Rate', 'Contribution %', 'Duration', 'Type', 'Impact']
  ];

  // Process ALL innings partnerships data
  if (scorecard?.innings && scorecard.innings.length > 0) {
    console.log('🤝 Processing partnerships data for', scorecard.innings.length, 'innings');
    
    scorecard.innings.forEach((innings: any, inningsIndex: number) => {
      const totalRuns = innings.totalRuns || 1;
      
      if (innings.partnerships && innings.partnerships.length > 0) {
        console.log(`🤝 Processing ${innings.partnerships.length} partnerships for innings ${inningsIndex + 1}`);
        
        innings.partnerships.forEach((partnership: any, index: number) => {
          console.log(`🤝 Partnership ${index + 1}:`, {
            batsman1: partnership.batsman1,
            batsman2: partnership.batsman2,
            runs: partnership.runs,
            balls: partnership.balls
          });
          
          const sr = partnership.balls > 0 ? ((partnership.runs / partnership.balls) * 100).toFixed(1) : '0.0';
          const contribution = totalRuns > 0 ? ((partnership.runs / totalRuns) * 100).toFixed(1) : '0.0';
          const duration = partnership.balls ? `${Math.floor(partnership.balls / 6)}.${partnership.balls % 6} overs` : '0.0 overs';
          
          const partnershipRow = [
            inningsIndex + 1,
            index + 1,
            partnership.batsman1?.name || partnership.batsman1 || 'Unknown',
            partnership.batsman2?.name || partnership.batsman2 || 'Unknown',
            partnership.runs || 0,
            partnership.balls || 0,
            sr,
            `${contribution}%`,
            duration,
            getPartnershipType(partnership),
            getPartnershipImpact(partnership)
          ];
          
          console.log(`🤝 Adding partnership row:`, partnershipRow);
          partnershipData.push(partnershipRow);
        });
      } else {
        console.log(`❌ No partnerships data found for innings ${inningsIndex + 1}`);
      }
    });
  } else {
    console.log('❌ No innings data found for partnerships processing');
  }
  
  const ws7 = XLSX.utils.aoa_to_sheet(partnershipData);
  XLSX.utils.book_append_sheet(wb, ws7, 'Partnerships');

  // 8. METADATA AND SYSTEM INFO
  const metadataData = [
    ['📋 SCORECARD METADATA', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['System Information', '', '', '', '', '', '', '', ''],
    ['Export Date', new Date().toLocaleString(), '', 'Export Version', '2.0 Comprehensive', '', '', ''],
    ['Scorecard ID', scorecard?.id || 'N/A', '', 'Created At', scorecard?.createdAt || 'N/A', '', '', ''],
    ['Updated At', scorecard?.updatedAt || 'N/A', '', 'Draft Status', scorecard?.draft ? 'Yes' : 'No', '', '', ''],
    ['Data Source', 'WPL Admin System', '', 'Export Type', 'Comprehensive', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['Data Completeness', '', '', '', '', '', '', '', ''],
    ['Total Innings', scorecard?.innings?.length || 0, '', 'Total Players', getTotalPlayers(scorecard), '', '', ''],
    ['Has Batting Data', hasBattingData(scorecard) ? 'Yes' : 'No', '', 'Has Bowling Data', hasBowlingData(scorecard) ? 'Yes' : 'No', '', '', ''],
    ['Has Extras Data', hasExtrasData(scorecard) ? 'Yes' : 'No', '', 'Has FOW Data', hasFOWData(scorecard) ? 'Yes' : 'No', '', '', ''],
    ['Has Powerplay Data', hasPowerplayData(scorecard) ? 'Yes' : 'No', '', 'Has Partnership Data', hasPartnershipData(scorecard) ? 'Yes' : 'No', '', '', '']
  ];
  
  const ws8 = XLSX.utils.aoa_to_sheet(metadataData);
  XLSX.utils.book_append_sheet(wb, ws8, 'Metadata');

  // Final summary
  console.log('📊 COMPREHENSIVE EXPORT SUMMARY:');
  console.log('✅ Total Sheets Created: 8');
  console.log(`✅ Total Batting Rows: ${battingData.length - 3}`); // -3 for headers
  console.log(`✅ Total Bowling Rows: ${bowlingData.length - 3}`); // -3 for headers
  console.log(`✅ Total Extras Rows: ${extrasData.length - 3}`); // -3 for headers
  console.log(`✅ Total FOW Rows: ${fowData.length - 3}`); // -3 for headers
  console.log(`✅ Total Powerplay Rows: ${powerplayData.length - 3}`); // -3 for headers
  console.log(`✅ Total Partnership Rows: ${partnershipData.length - 3}`); // -3 for headers
  console.log(`✅ Total Data Points: ${calculateTotalDataPoints(scorecard)}`);

  // Generate filename
  const team1 = scorecard?.matchInfo?.team1?.name || 'Team1';
  const team2 = scorecard?.matchInfo?.team2?.name || 'Team2';
  const date = scorecard?.matchInfo?.date || new Date().toISOString().split('T')[0];
  const filename = `WPL2026_Complete_Scorecard_${team1.replace(/\s+/g, '_')}_vs_${team2.replace(/\s+/g, '_')}_${date}.xlsx`;

  console.log('📁 Generated filename:', filename);

  // Download file
  XLSX.writeFile(wb, filename);
  console.log('✅ COMPREHENSIVE Excel export completed with ALL scorecard data!');
  alert(`Comprehensive Excel exported successfully!\n\nTotal Sheets: 8\nTotal Data Points: ${calculateTotalDataPoints(scorecard)}\nFilename: ${filename}`);
};

// Helper functions
function calculateTotalDataPoints(scorecard: any): number {
  let total = 0;
  if (scorecard?.innings) {
    scorecard.innings.forEach((innings: any) => {
      total += (innings.batting?.length || 0) * 18;
      total += (innings.bowling?.length || 0) * 16;
      total += (innings.fallOfWickets?.length || 0) * 10;
      total += (innings.partnerships?.length || 0) * 11;
    });
  }
  return total;
}

function getTotalPlayers(scorecard: any): number {
  let total = 0;
  if (scorecard?.innings) {
    scorecard.innings.forEach((innings: any) => {
      total += (innings.batting?.length || 0) + (innings.bowling?.length || 0);
    });
  }
  return total;
}

function hasBattingData(scorecard: any): boolean {
  return scorecard?.innings?.some((innings: any) => innings.batting && innings.batting.length > 0) || false;
}

function hasBowlingData(scorecard: any): boolean {
  return scorecard?.innings?.some((innings: any) => innings.bowling && innings.bowling.length > 0) || false;
}

function hasExtrasData(scorecard: any): boolean {
  return scorecard?.innings?.some((innings: any) => innings.extras) || false;
}

function hasFOWData(scorecard: any): boolean {
  return scorecard?.innings?.some((innings: any) => innings.fallOfWickets && innings.fallOfWickets.length > 0) || false;
}

function hasPowerplayData(scorecard: any): boolean {
  return scorecard?.innings?.some((innings: any) => innings.powerplays) || false;
}

function hasPartnershipData(scorecard: any): boolean {
  return scorecard?.innings?.some((innings: any) => innings.partnerships && innings.partnerships.length > 0) || false;
}

function calculateImpactScore(player: any): number {
  let score = 0;
  score += (player.runs || 0) * 0.5;
  score += (player.fours || 0) * 2;
  score += (player.sixes || 0) * 4;
  if ((player.runs || 0) >= 50) score += 25;
  if ((player.runs || 0) >= 100) score += 50;
  return Math.round(score);
}

function getPerformanceRating(player: any): string {
  const runs = player.runs || 0;
  if (runs >= 100) return 'Century 🏆';
  if (runs >= 50) return 'Half-Century 🌟';
  if (runs >= 30) return 'Good Knock 👍';
  if (runs >= 20) return 'Decent ✅';
  return 'Low Score 📊';
}

function getPerformanceBadge(player: any): string {
  const runs = player.runs || 0;
  if (runs >= 100) return '💯';
  if (runs >= 50) return '🌟';
  if (runs >= 30) return '👍';
  if (runs >= 20) return '✅';
  return '📊';
}

function formatDismissal(dismissal: any): string {
  if (!dismissal) return 'Not Out';
  if (typeof dismissal === 'string') return dismissal;
  if (dismissal.details) return dismissal.details;
  if (dismissal.type) return dismissal.type;
  return 'Out';
}

function getBowlingPerformance(bowler: any): string {
  const wickets = bowler.wickets || 0;
  const economy = bowler.overs > 0 ? bowler.runs / bowler.overs : 10;
  if (wickets >= 5) return '5+ Wickets 🔥';
  if (wickets >= 3) return '3+ Wickets ⭐';
  if (economy < 6) return 'Excellent Economy 🎯';
  if (economy < 8) return 'Good Economy ✅';
  return 'Standard 📊';
}

function calculateBowlingScore(bowler: any): number {
  let score = 0;
  score += (bowler.wickets || 0) * 20;
  score += (bowler.maidens || 0) * 10;
  const economy = bowler.overs > 0 ? bowler.runs / bowler.overs : 10;
  if (economy < 6) score += 30;
  else if (economy < 8) score += 15;
  return Math.round(score);
}

function getBowlingGrade(economy: number, wickets: number): string {
  if (wickets >= 5) return 'A+';
  if (wickets >= 3 && economy < 8) return 'A';
  if (economy < 7) return 'B+';
  if (economy < 9) return 'B';
  return 'C';
}

function getBowlingBadge(wickets: number, economy: number): string {
  if (wickets >= 5) return '🔥';
  if (wickets >= 3) return '⭐';
  if (economy < 6) return '🎯';
  if (wickets >= 1) return '👍';
  return '📊';
}

function getPowerplayPerformance(phase: string, runRate: number): string {
  if (runRate < 7) return 'Excellent';
  if (runRate < 9) return 'Good';
  if (runRate < 11) return 'Average';
  return 'Poor';
}

function getPowerplayGrade(phase: string, runRate: number): string {
  if (runRate < 7) return 'A';
  if (runRate < 9) return 'B';
  if (runRate < 11) return 'C';
  return 'D';
}

function getPowerplayImpact(phase: string, runRate: number): string {
  if (runRate < 7) return 'Dominant';
  if (runRate < 9) return 'Controlled';
  if (runRate < 11) return 'Managed';
  return 'Struggled';
}

function getPartnershipType(partnership: any): string {
  const runs = partnership.runs || 0;
  if (runs >= 100) return 'Century Partnership';
  if (runs >= 50) return 'Half-Century';
  return 'Building Partnership';
}

function getPartnershipImpact(partnership: any): string {
  const runs = partnership.runs || 0;
  if (runs >= 100) return 'Match-Winning';
  if (runs >= 50) return 'Match-Defining';
  if (runs >= 30) return 'Significant';
  return 'Useful';
}
