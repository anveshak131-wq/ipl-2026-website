"use client";

import { useState, useEffect } from 'react';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';
import { api as dataApi } from '@/lib/data';
import { Match } from '@/types';

const HEADERS = ['Overs','Ball','Innings','Striker','Non-Striker','Bowler','Runs','Wide','No Ball','Byes','LB','Wicket','Notes'];

export default function LiveScoreWithAIPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [liveData, setLiveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tossInfo, setTossInfo] = useState<string>('');
  const [aiCommentary, setAiCommentary] = useState<string>('');
  const [enhancedCommentary, setEnhancedCommentary] = useState<string>('');
  const [isGeneratingCommentary, setIsGeneratingCommentary] = useState(false);

  // Load matches on component mount
  useEffect(() => {
    (async () => {
      try {
        // Fetch matches (like scorecard page)
        const data = await dataApi.getMatches('wpl');
        console.log('=== MATCHES LIST DEBUG AI ===');
        console.log('Fetched WPL matches:', data);
        if (data && data.length > 0) {
          setMatches(data);
          setSelectedMatch(data[0].id);
        } else {
          console.log('No WPL matches found');
        }
      } catch (error) {
        console.error('Error loading matches:', error);
      }
    })();
  }, []);

  // Load live data when match is selected
  useEffect(() => {
    if (!selectedMatch) return;
    
    const loadLiveData = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`/api/wpl-live-score/save?matchId=${encodeURIComponent(selectedMatch)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.rows)) {
            setLiveData(data.rows);
          } else if (Array.isArray(data)) {
            setLiveData(data);
          }
        }
      } catch (error) {
        console.error('Error loading live data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLiveData();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadLiveData, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [selectedMatch]);

  // Generate AI commentary when data changes
  useEffect(() => {
    if (liveData.length > 0) {
      generateAICommentary();
    }
  }, [liveData]);

  const generateAICommentary = async () => {
    setIsGeneratingCommentary(true);
    
    try {
      // Calculate current match situation
      const innings1Data = liveData.filter(row => row[2] === '1');
      const innings2Data = liveData.filter(row => row[2] === '2');
      
      const calculateInningsStats = (data: any[]) => {
        let totalRuns = 0;
        let totalWickets = 0;
        let totalBalls = 0;
        let lastFewBalls = [];
        
        data.forEach((row, index) => {
          const runs = parseInt(row[6]) || 0;
          const hasWicket = row[11] === 'true' || row[11] === true;
          const hasWide = row[7] === 'true' || row[7] === true;
          const hasNoBall = row[8] === 'true' || row[8] === true;
          const hasByes = row[9] && row[9] !== '' && row[9] !== '0';
          const hasLB = row[10] && row[10] !== '' && row[10] !== '0';
          
          // Count balls (exclude wides and no balls from ball count)
          if (!hasWide && !hasNoBall) {
            totalBalls++;
          }
          
          // Count wickets
          if (hasWicket) {
            totalWickets++;
          }
          
          // Add all runs including extras
          totalRuns += runs;
          if (hasWide) totalRuns += (parseInt(row[7]) || 1);
          if (hasNoBall) totalRuns += (parseInt(row[8]) || 1);
          if (hasByes) totalRuns += (parseInt(row[9]) || 0);
          if (hasLB) totalRuns += (parseInt(row[10]) || 0);
          
          // Get last 3 balls for commentary
          if (index >= data.length - 3) {
            let ballEvent = '';
            if (hasWicket) {
              ballEvent = 'wicket';
            } else if (hasWide) {
              ballEvent = 'wide';
            } else if (hasNoBall) {
              ballEvent = 'no-ball';
            } else if (hasByes) {
              ballEvent = 'byes';
            } else if (hasLB) {
              ballEvent = 'leg-bye';
            } else {
              ballEvent = 'normal';
            }
            
            lastFewBalls.push({
              runs: totalRuns - (data[index - 1] ? 
                (parseInt(data[index - 1][6]) || 0) + 
                (data[index - 1][7] === 'true' ? (parseInt(data[index - 1][7]) || 1) : 0) +
                (data[index - 1][8] === 'true' ? (parseInt(data[index - 1][8]) || 1) : 0) +
                (data[index - 1][9] && data[index - 1][9] !== '' && data[index - 1][9] !== '0' ? (parseInt(data[index - 1][9]) || 0) : 0) +
                (data[index - 1][10] && data[index - 1][10] !== '' && data[index - 1][10] !== '0' ? (parseInt(data[index - 1][10]) || 0) : 0) : 0),
              hasWicket,
              hasWide,
              hasNoBall,
              hasByes,
              hasLB,
              striker: row[3],
              bowler: row[5],
              event: ballEvent
            });
          }
        });
        
        const overs = Math.floor(totalBalls / 6);
        const balls = totalBalls % 6;
        
        return {
          runs: totalRuns,
          wickets: totalWickets,
          overs: `${overs}.${balls}`,
          balls: totalBalls,
          runRate: totalBalls > 0 ? (totalRuns / totalBalls * 6).toFixed(2) : '0.00',
          lastFewBalls
        };
      };
      
      const innings1Stats = calculateInningsStats(innings1Data);
      const innings2Stats = calculateInningsStats(innings2Data);
      
      // Determine current situation
      const currentInnings = innings2Data.length > 0 ? innings2Stats : innings1Stats;
      const isSecondInnings = innings2Data.length > 0;
      const target = isSecondInnings ? innings1Stats.runs + 1 : null;
      const needed = isSecondInnings ? target - innings2Stats.runs : null;
      const remainingBalls = isSecondInnings ? 120 - innings2Stats.balls : null;
      
      // Generate basic AI commentary
      let basicCommentary = '';
      let enhancedCommentary = '';
      
      if (currentInnings.balls === 0) {
        basicCommentary = `🏏 Welcome to the live coverage! The match is about to begin with ${currentInnings.wickets} wickets in hand.`;
        enhancedCommentary = `🎯 **Exciting Cricket Action Ahead!** \n\nThe teams are ready to battle it out in what promises to be an thrilling encounter. With ${currentInnings.wickets} wickets remaining, the batting side looks to build a solid foundation.`;
      } else {
        const lastBall = currentInnings.lastFewBalls[currentInnings.lastFewBalls.length - 1];
        
        if (lastBall?.hasWicket) {
          basicCommentary = `💥 **WICKET!** ${lastBall.striker} is out! Score: ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs)`;
          enhancedCommentary = `⚡ **Dramatic Moment!** \n\n💥 **WICKET FALLS!** ${lastBall.striker} departs after a fighting innings. The bowling side strikes back through ${lastBall.bowler}. \n\n**Current Situation:** ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs) \n**Run Rate:** ${currentInnings.runRate} runs per over`;
        } else if (lastBall?.hasWide) {
          const wideRuns = lastBall.runs || 1;
          basicCommentary = `📏 **WIDE!** ${wideRuns} run${wideRuns !== 1 ? 's' : ''} added to total. Score: ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs)`;
          enhancedCommentary = `📏 **Bowling Error!** \n\n📏 **WIDE BALL!** The bowler loses control and concedes ${wideRuns} run${wideRuns !== 1 ? 's' : ''}. Extra runs added to the total. \n\n**Current Situation:** ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs) \n**Run Rate:** ${currentInnings.runRate} runs per over`;
        } else if (lastBall?.hasNoBall) {
          const noBallRuns = lastBall.runs || 1;
          basicCommentary = `⚠️ **NO BALL!** Free hit! ${noBallRuns} run${noBallRuns !== 1 ? 's' : ''} added. Score: ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs)`;
          enhancedCommentary = `⚠️ **No Ball Delivered!** \n\n⚠️ **ILLEGAL DELIVERY!** The bowler oversteps and concedes ${noBallRuns} run${noBallRuns !== 1 ? 's' : ''} plus a free hit for the batsman. \n\n**Current Situation:** ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs) \n**Run Rate:** ${currentInnings.runRate} runs per over`;
        } else if (lastBall?.hasByes) {
          const byeRuns = lastBall.runs || 0;
          basicCommentary = `🏃 **BYES!** ${byeRuns} run${byeRuns !== 1 ? 's' : ''} taken as byes. Score: ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs)`;
          enhancedCommentary = `🏃 **Quick Running!** \n\n🏃 **BYES TAKEN!** The batsmen run ${byeRuns} bye${byeRuns !== 1 ? 's' : ''} as the ball evades the keeper. Smart running between the wickets. \n\n**Current Situation:** ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs) \n**Run Rate:** ${currentInnings.runRate} runs per over`;
        } else if (lastBall?.hasLB) {
          const lbRuns = lastBall.runs || 0;
          basicCommentary = `🦵 **LEG BYE!** ${lbRuns} run${lbRuns !== 1 ? 's' : ''} taken. Score: ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs)`;
          enhancedCommentary = `🦵 **Leg Bye Taken!** \n\n🦵 **LEG BYES!** The ball deflects off the pads and ${lbRuns} run${lbRuns !== 1 ? 's' : ''} are taken. Good piece of running by the batting pair. \n\n**Current Situation:** ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs) \n**Run Rate:** ${currentInnings.runRate} runs per over`;
        } else if (lastBall?.runs >= 4) {
          basicCommentary = `🎯 **BOUNDARY!** ${lastBall.runs} runs by ${lastBall.striker}! Score: ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs)`;
          enhancedCommentary = `🔥 **Explosive Batting!** \n\n🎯 **BEAUTIFUL SHOT!** ${lastBall.striker} finds the rope for ${lastBall.runs} runs! The crowd is on its feet as the ball races to the boundary. \n\n**Current Situation:** ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs) \n**Run Rate:** ${currentInnings.runRate} runs per over`;
        } else {
          basicCommentary = `🏏 ${lastBall?.runs || 0} runs added. Score: ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs)`;
          enhancedCommentary = `🏏 **Steady Progress** \n\n${lastBall?.runs || 0} runs added to the total. ${lastBall?.striker || 'Batsman'} working the ball around carefully. \n\n**Current Situation:** ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs} overs) \n**Run Rate:** ${currentInnings.runRate} runs per over`;
        }
        
        if (isSecondInnings && needed !== null) {
          const reqRate = remainingBalls > 0 ? ((needed / remainingBalls) * 6).toFixed(2) : '∞';
          basicCommentary += ` • Need ${needed} runs from ${remainingBalls} balls (RR: ${reqRate})`;
          enhancedCommentary += `\n\n📊 **Chase Analysis:** \n• **Target:** ${target} runs \n• **Need:** ${needed} runs from ${remainingBalls} balls \n• **Required Rate:** ${reqRate} runs per over`;
        }
      }
      
      setAiCommentary(basicCommentary);
      setEnhancedCommentary(enhancedCommentary);
      
    } catch (error) {
      console.error('Error generating commentary:', error);
      setAiCommentary('📊 Live score data being processed...');
      setEnhancedCommentary('🎯 **Match in Progress**\n\nLive score data is being updated. Commentary will appear here as the action unfolds.');
    } finally {
      setIsGeneratingCommentary(false);
    }
  };

  const calculateTeamTotal = (innings: string | number) => {
    const filteredRows = liveData.filter(row => row[2] === String(innings));
    
    let totalRuns = 0;
    let totalWickets = 0;
    let totalBalls = 0;
    
    filteredRows.forEach((row) => {
      const runs = parseInt(row[6]) || 0;
      const hasWicket = row[11] === 'true' || row[11] === true;
      const hasWide = row[7] === 'true' || row[7] === true;
      const hasNoBall = row[8] === 'true' || row[8] === true;
      const hasByes = row[9] && row[9] !== '' && row[9] !== '0';
      const hasLB = row[10] && row[10] !== '' && row[10] !== '0';
      
      // Count balls (exclude wides and no balls from ball count)
      if (!hasWide && !hasNoBall) {
        totalBalls++;
      }
      
      // Count wickets
      if (hasWicket) {
        totalWickets++;
      }
      
      // Add all runs including extras
      totalRuns += runs;
      if (hasWide) totalRuns += (parseInt(row[7]) || 1);
      if (hasNoBall) totalRuns += (parseInt(row[8]) || 1);
      if (hasByes) totalRuns += (parseInt(row[9]) || 0);
      if (hasLB) totalRuns += (parseInt(row[10]) || 0);
    });
    
    const overs = Math.floor(totalBalls / 6);
    const balls = totalBalls % 6;
    
    return {
      runs: totalRuns,
      wickets: totalWickets,
      overs: `${overs}.${balls}`,
      balls: totalBalls,
      runRate: totalBalls > 0 ? (totalRuns / totalBalls * 6).toFixed(2) : '0.00'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex">
        <WPLAdminSidebarNew />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                🤖 Live Score with AI Commentary
              </h1>
              <p className="text-gray-300">Real-time cricket scores with AI-powered commentary and insights</p>
            </div>

            {/* Match Selection */}
            <div className="mb-8">
              <label className="block text-white text-sm font-medium mb-2">Select Match</label>
              <select
                value={selectedMatch}
                onChange={(e) => setSelectedMatch(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl 
                         text-white focus:outline-none focus:border-white/40 focus:bg-white/15 
                         transition-all duration-300 shadow-lg"
              >
                <option value="" className="bg-gray-800">Choose a match...</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id} className="bg-gray-800">
                    {match.team1.name} vs {match.team2.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedMatch && (
              <>
                {/* Live Score Display */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Innings 1 */}
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <h3 className="text-xl font-bold text-blue-100 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></span>
                      Innings 1
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-200 font-medium">Score</span>
                          <span className="font-mono text-white font-bold text-2xl">
                            {calculateTeamTotal(1).runs}/{calculateTeamTotal(1).wickets}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-blue-200 font-medium">Overs</span>
                        <span className="font-mono text-white font-bold">{calculateTeamTotal(1).overs}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-blue-200 font-medium">Run Rate</span>
                        <span className="font-mono text-white font-bold">{calculateTeamTotal(1).runRate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Innings 2 */}
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <h3 className="text-xl font-bold text-purple-100 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></span>
                      Innings 2
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-purple-200 font-medium">Score</span>
                          <span className="font-mono text-white font-bold text-2xl">
                            {calculateTeamTotal(2).runs}/{calculateTeamTotal(2).wickets}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-purple-200 font-medium">Overs</span>
                        <span className="font-mono text-white font-bold">{calculateTeamTotal(2).overs}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-purple-200 font-medium">Run Rate</span>
                        <span className="font-mono text-white font-bold">{calculateTeamTotal(2).runRate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Commentary Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic AI Commentary */}
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <h3 className="text-xl font-bold text-green-100 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                      🤖 AI Commentary
                    </h3>
                    <div className="bg-white/5 rounded-lg p-4 min-h-[120px]">
                      {isGeneratingCommentary ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                        </div>
                      ) : (
                        <p className="text-green-200 leading-relaxed">{aiCommentary}</p>
                      )}
                    </div>
                  </div>

                  {/* Enhanced AI Commentary */}
                  <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <h3 className="text-xl font-bold text-orange-100 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></span>
                      ✨ Enhanced Commentary
                    </h3>
                    <div className="bg-white/5 rounded-lg p-4 min-h-[120px]">
                      {isGeneratingCommentary ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
                        </div>
                      ) : (
                        <div className="text-orange-200 leading-relaxed whitespace-pre-line">
                          {enhancedCommentary}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Game-Style Match View */}
                {liveData.length > 0 && (
                  <div className="mt-8 bg-gradient-to-br from-gray-500/20 to-gray-600/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
                      <span className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></span>
                      📊 Live Match View
                    </h3>
                    
                    {/* Current Match Status */}
                    <div className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏏</span>
                          <div>
                            <div className="text-white font-bold text-lg">
                              MI {calculateTeamTotal(1).runs}/{calculateTeamTotal(1).wickets} ({calculateTeamTotal(1).overs} ov) vs RCB
                            </div>
                            <div className="text-gray-300 text-sm">
                              {calculateTeamTotal(2).runs > 0 && `RCB ${calculateTeamTotal(2).runs}/${calculateTeamTotal(2).wickets} (${calculateTeamTotal(2).overs} ov)`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">LIVE</div>
                          <div className="text-gray-400 text-sm">Updated 5s ago</div>
                        </div>
                      </div>
                    </div>

                    {/* Last 3 Balls */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                        <span className="text-xl">🎯</span>
                        Last 3 Balls
                      </h4>
                      <div className="space-y-3">
                        {liveData.slice(-3).reverse().map((row, index) => {
                          const runs = parseInt(row[6]) || 0;
                          const hasWicket = row[11] === 'true' || row[11] === true;
                          const hasWide = row[7] === 'true' || row[7] === true;
                          const hasNoBall = row[8] === 'true' || row[8] === true;
                          const hasByes = row[9] && row[9] !== '' && row[9] !== '0';
                          const hasLB = row[10] && row[10] !== '' && row[10] !== '0';
                          const isBoundary = runs >= 4 && !hasWide && !hasNoBall;
                          const isSix = runs === 6 && !hasWide && !hasNoBall;
                          const ballNumber = `${row[0]}.${row[1]}`;
                          
                          // Calculate total runs for this ball
                          const wideRuns = hasWide ? (parseInt(row[7]) || 1) : 0;
                          const noBallRuns = hasNoBall ? (parseInt(row[8]) || 1) : 0;
                          const byeRuns = hasByes ? (parseInt(row[9]) || 0) : 0;
                          const lbRuns = hasLB ? (parseInt(row[10]) || 0) : 0;
                          const totalRuns = runs + wideRuns + noBallRuns + byeRuns + lbRuns;
                          
                          // Determine event type and icon
                          let eventType = '';
                          let eventIcon = '';
                          let eventColor = '';
                          
                          if (hasWicket) {
                            eventType = 'Wicket';
                            eventIcon = '💥';
                            eventColor = 'text-red-400';
                          } else if (hasWide) {
                            eventType = `Wide ${wideRuns} run${wideRuns !== 1 ? 's' : ''}`;
                            eventIcon = '📏';
                            eventColor = 'text-yellow-400';
                          } else if (hasNoBall) {
                            eventType = `No Ball ${noBallRuns} run${noBallRuns !== 1 ? 's' : ''}`;
                            eventIcon = '⚠️';
                            eventColor = 'text-orange-400';
                          } else if (hasByes) {
                            eventType = `Byes ${byeRuns} run${byeRuns !== 1 ? 's' : ''}`;
                            eventIcon = '🏃';
                            eventColor = 'text-cyan-400';
                          } else if (hasLB) {
                            eventType = `Leg Bye ${lbRuns} run${lbRuns !== 1 ? 's' : ''}`;
                            eventIcon = '🦵';
                            eventColor = 'text-teal-400';
                          } else if (isSix) {
                            eventType = 'Six';
                            eventIcon = '⚡';
                            eventColor = 'text-purple-400';
                          } else if (isBoundary) {
                            eventType = 'Boundary';
                            eventIcon = '🎯';
                            eventColor = 'text-green-400';
                          } else if (runs === 0) {
                            eventType = 'Dot ball';
                            eventIcon = '🏏';
                            eventColor = 'text-gray-400';
                          } else {
                            eventType = `${runs} run${runs !== 1 ? 's' : ''}`;
                            eventIcon = '🏃';
                            eventColor = 'text-blue-400';
                          }
                          
                          return (
                            <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-400 font-mono text-sm">{ballNumber}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`${eventColor} text-lg`}>{eventIcon}</span>
                                  </div>
                                  <div>
                                    <span className="text-white font-medium">
                                      {eventType}
                                    </span>
                                    {totalRuns > 0 && (
                                      <span className="text-gray-300 ml-2">
                                        Total: {totalRuns} run{totalRuns !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-gray-400 text-sm">
                                    ({row[3]}{row[5] ? ` vs ${row[5]}` : ''})
                                  </span>
                                </div>
                                <div className="text-right">
                                  {hasWicket && <span className="text-red-300 text-sm">OUT!</span>}
                                  {isSix && <span className="text-purple-300 text-sm">SIX!</span>}
                                  {isBoundary && !isSix && <span className="text-green-300 text-sm">FOUR!</span>}
                                  {hasWide && <span className="text-yellow-300 text-sm">WIDE!</span>}
                                  {hasNoBall && <span className="text-orange-300 text-sm">NO BALL!</span>}
                                  {hasByes && <span className="text-cyan-300 text-sm">BYES!</span>}
                                  {hasLB && <span className="text-teal-300 text-sm">LEG BYE!</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Current Over Summary */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        This Over
                      </h4>
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        {(() => {
                          const currentOver = liveData[liveData.length - 1]?.[0] || '0';
                          const overBalls = liveData.filter(row => row[0] === currentOver);
                          
                          // Calculate all runs and extras
                          let overRuns = 0;
                          let overWickets = 0;
                          const bowler = overBalls[0]?.[5] || 'Unknown';
                          
                          overBalls.forEach(ball => {
                            const runs = parseInt(ball[6]) || 0;
                            const hasWicket = ball[11] === 'true' || ball[11] === true;
                            const hasWide = ball[7] === 'true' || ball[7] === true;
                            const hasNoBall = ball[8] === 'true' || ball[8] === true;
                            const hasByes = ball[9] && ball[9] !== '' && ball[9] !== '0';
                            const hasLB = ball[10] && ball[10] !== '' && ball[10] !== '0';
                            
                            if (hasWicket) overWickets++;
                            
                            // Add all runs
                            overRuns += runs;
                            if (hasWide) overRuns += (parseInt(ball[7]) || 1);
                            if (hasNoBall) overRuns += (parseInt(ball[8]) || 1);
                            if (hasByes) overRuns += (parseInt(ball[9]) || 0);
                            if (hasLB) overRuns += (parseInt(ball[10]) || 0);
                          });
                          
                          return (
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-white font-bold text-lg">
                                  Over {currentOver}: {overRuns} runs{overWickets > 0 && `, ${overWickets} wicket${overWickets > 1 ? 's' : ''}`}
                                </div>
                                <div className="text-gray-400 text-sm">
                                  └─ {bowler}: {overRuns} runs, {overWickets} wicket{overWickets !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {overBalls.map((ball, idx) => {
                                  const runs = parseInt(ball[6]) || 0;
                                  const hasWicket = ball[11] === 'true' || ball[11] === true;
                                  const hasWide = ball[7] === 'true' || ball[7] === true;
                                  const hasNoBall = ball[8] === 'true' || ball[8] === true;
                                  const hasByes = ball[9] && ball[9] !== '' && ball[9] !== '0';
                                  const hasLB = ball[10] && ball[10] !== '' && ball[10] !== '0';
                                  
                                  let ballDisplay = '';
                                  let ballColor = '';
                                  
                                  if (hasWicket) {
                                    ballDisplay = 'W';
                                    ballColor = 'bg-red-500/30 text-red-300 border border-red-400/30';
                                  } else if (hasWide) {
                                    ballDisplay = 'WD';
                                    ballColor = 'bg-yellow-500/30 text-yellow-300 border border-yellow-400/30';
                                  } else if (hasNoBall) {
                                    ballDisplay = 'NB';
                                    ballColor = 'bg-orange-500/30 text-orange-300 border border-orange-400/30';
                                  } else if (hasByes) {
                                    ballDisplay = 'B';
                                    ballColor = 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/30';
                                  } else if (hasLB) {
                                    ballDisplay = 'LB';
                                    ballColor = 'bg-teal-500/30 text-teal-300 border border-teal-400/30';
                                  } else if (runs === 6) {
                                    ballDisplay = '6';
                                    ballColor = 'bg-purple-500/30 text-purple-300 border border-purple-400/30';
                                  } else if (runs >= 4) {
                                    ballDisplay = '4';
                                    ballColor = 'bg-green-500/30 text-green-300 border border-green-400/30';
                                  } else if (runs > 0) {
                                    ballDisplay = runs.toString();
                                    ballColor = 'bg-blue-500/30 text-blue-300 border border-blue-400/30';
                                  } else {
                                    ballDisplay = '0';
                                    ballColor = 'bg-gray-500/30 text-gray-300 border border-gray-400/30';
                                  }
                                  
                                  return (
                                    <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${ballColor}`}>
                                      {ballDisplay}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* All Balls (Compact View) */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                        <span className="text-xl">📋</span>
                        All Balls
                      </h4>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {liveData.map((row, index) => {
                          const runs = parseInt(row[6]) || 0;
                          const hasWicket = row[11] === 'true' || row[11] === true;
                          const hasWide = row[7] === 'true' || row[7] === true;
                          const hasNoBall = row[8] === 'true' || row[8] === true;
                          const hasByes = row[9] && row[9] !== '' && row[9] !== '0';
                          const hasLB = row[10] && row[10] !== '' && row[10] !== '0';
                          const ballNumber = `${row[0]}.${row[1]}`;
                          
                          // Calculate total runs
                          const wideRuns = hasWide ? (parseInt(row[7]) || 1) : 0;
                          const noBallRuns = hasNoBall ? (parseInt(row[8]) || 1) : 0;
                          const byeRuns = hasByes ? (parseInt(row[9]) || 0) : 0;
                          const lbRuns = hasLB ? (parseInt(row[10]) || 0) : 0;
                          const totalRuns = runs + wideRuns + noBallRuns + byeRuns + lbRuns;
                          
                          // Determine icon and color
                          let eventIcon = '';
                          let eventColor = '';
                          let eventText = '';
                          
                          if (hasWicket) {
                            eventIcon = '💥';
                            eventColor = 'text-red-400';
                            eventText = 'Wicket';
                          } else if (hasWide) {
                            eventIcon = '📏';
                            eventColor = 'text-yellow-400';
                            eventText = `Wide ${wideRuns}`;
                          } else if (hasNoBall) {
                            eventIcon = '⚠️';
                            eventColor = 'text-orange-400';
                            eventText = `No Ball ${noBallRuns}`;
                          } else if (hasByes) {
                            eventIcon = '🏃';
                            eventColor = 'text-cyan-400';
                            eventText = `Byes ${byeRuns}`;
                          } else if (hasLB) {
                            eventIcon = '🦵';
                            eventColor = 'text-teal-400';
                            eventText = `Leg Bye ${lbRuns}`;
                          } else if (runs === 6) {
                            eventIcon = '⚡';
                            eventColor = 'text-purple-400';
                            eventText = 'Six';
                          } else if (runs >= 4) {
                            eventIcon = '🎯';
                            eventColor = 'text-green-400';
                            eventText = 'Boundary';
                          } else if (runs > 0) {
                            eventIcon = '🏃';
                            eventColor = 'text-blue-400';
                            eventText = `${runs} run${runs !== 1 ? 's' : ''}`;
                          } else {
                            eventIcon = '🏏';
                            eventColor = 'text-gray-400';
                            eventText = 'Dot ball';
                          }
                          
                          return (
                            <div key={index} className="flex items-center gap-3 text-sm bg-white/5 rounded px-3 py-2 hover:bg-white/10 transition-all duration-200">
                              <span className="text-gray-400 font-mono w-12">{ballNumber}</span>
                              <div className="flex items-center gap-2">
                                <span className={eventColor}>{eventIcon}</span>
                              </div>
                              <span className="text-white">
                                {eventText}
                              </span>
                              {totalRuns > 0 && (
                                <span className="text-gray-300 text-xs">
                                  ({totalRuns} total)
                                </span>
                              )}
                              <span className="text-gray-400 text-xs">
                                {row[3]} vs {row[5]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
