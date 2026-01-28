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
          
          if (!hasWide && !hasNoBall) {
            totalBalls++;
          }
          
          if (hasWicket) {
            totalWickets++;
          }
          
          totalRuns += runs;
          
          // Get last 3 balls for commentary
          if (index >= data.length - 3) {
            lastFewBalls.push({
              runs,
              hasWicket,
              striker: row[3],
              bowler: row[5]
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
      
      if (!hasWide && !hasNoBall) {
        totalBalls++;
      }
      
      if (hasWicket) {
        totalWickets++;
      }
      
      totalRuns += runs;
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

                {/* Recent Balls */}
                {liveData.length > 0 && (
                  <div className="mt-8 bg-gradient-to-br from-gray-500/20 to-gray-600/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <h3 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></span>
                      📊 Recent Balls
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            {HEADERS.map((header, index) => (
                              <th key={index} className="text-left p-2 text-gray-300 font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {liveData.slice(-5).reverse().map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="p-2 text-white">
                                  {cell || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
