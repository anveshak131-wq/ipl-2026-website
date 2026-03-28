"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/data';
import { Match } from '@/types';

const HEADERS = ['Overs','Ball','Innings','Striker','Non-Striker','Bowler','Runs','Wide','No Ball','Byes','LB','Wicket','Notes'];

export default function IPLLiveScoreWithAIPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [liveData, setLiveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiCommentary, setAiCommentary] = useState<string>('');
  const [enhancedCommentary, setEnhancedCommentary] = useState<string>('');
  const [isGeneratingCommentary, setIsGeneratingCommentary] = useState(false);

  const [wicketData, setWicketData] = useState<Record<number, any>>({});
  const [extrasData, setExtrasData] = useState<Record<number, any>>({});

  const selectedMatchObj = matches.find((m) => m.id === selectedMatch) || null;
  const hasPlaying11 = Boolean(selectedMatchObj?.playing11?.team1?.length) && Boolean(selectedMatchObj?.playing11?.team2?.length);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMatches('ipl');
        if (data && data.length > 0) {
          setMatches(data);
          setSelectedMatch(data[0].id);
        }
      } catch (error) {
        console.error('Error loading IPL matches:', error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedMatch) return;

    const loadLiveData = async () => {
      setLoading(true);
      try {
        // Poll live rows for the selected IPL match
        const resp = await fetch(`/api/ipl-live-score/save?matchId=${encodeURIComponent(selectedMatch)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data?.rows)) setLiveData(data.rows);
          else if (Array.isArray(data)) setLiveData(data);
          else setLiveData([]);

          if (data?.extrasData && typeof data.extrasData === 'object') setExtrasData(data.extrasData);
          else setExtrasData({});

          if (data?.wicketData && typeof data.wicketData === 'object') setWicketData(data.wicketData);
          else setWicketData({});
        }
      } catch (error) {
        console.error('Error loading live data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLiveData();
    const interval = setInterval(loadLiveData, 5000);
    return () => clearInterval(interval);
  }, [selectedMatch]);

  useEffect(() => { if (liveData.length > 0) generateAICommentary(); }, [liveData]);

  const generateAICommentary = async () => {
    setIsGeneratingCommentary(true);
    try {
      const innings1Data = liveData.filter(row => row[2] === '1');
      const innings2Data = liveData.filter(row => row[2] === '2');

      const calculateInningsStats = (data: any[]) => {
        let totalRuns = 0, totalWickets = 0, totalBalls = 0, lastFewBalls: any[] = [];
        data.forEach((row, index) => {
          const actualRowIndex = liveData.indexOf(row);
          const runs = parseInt(row[6]) || 0;
          const wicket = wicketData[actualRowIndex] || {};
          const extras = extrasData[actualRowIndex] || {};
          const hasWicket = wicket.hasWicket;
          const hasWide = extras.hasWide;
          const hasNoBall = extras.hasNoBall;

          if (!hasWide && !hasNoBall) totalBalls++;
          if (hasWicket) totalWickets++;
          totalRuns += runs;
          if (hasWide) totalRuns += (extras.wideExtraRuns || 0) + 1;
          if (hasNoBall) totalRuns += 1;
          if (extras.hasByes) totalRuns += extras.byesRuns || 0;
          if (extras.hasLB) totalRuns += extras.lbRuns || 0;
          if (index >= data.length - 3) lastFewBalls.push({ runs, hasWicket, hasWide, hasNoBall, striker: row[3], bowler: row[5] });
        });
        const overs = Math.floor(totalBalls / 6);
        const balls = totalBalls % 6;
        return { runs: totalRuns, wickets: totalWickets, overs: `${overs}.${balls}`, balls: totalBalls, runRate: totalBalls > 0 ? (totalRuns / totalBalls * 6).toFixed(2) : '0.00', lastFewBalls };
      };

      const innings1Stats = calculateInningsStats(innings1Data);
      const innings2Stats = calculateInningsStats(innings2Data);
      const currentInnings = innings2Data.length > 0 ? innings2Stats : innings1Stats;
      const isSecondInnings = innings2Data.length > 0;
      const target = isSecondInnings ? innings1Stats.runs + 1 : null;
      const needed = isSecondInnings ? target - innings2Stats.runs : null;
      const remainingBalls = isSecondInnings ? 120 - innings2Stats.balls : null;

      let basicCommentary = '';
      let enhanced = '';

      if (currentInnings.balls === 0) {
        basicCommentary = `🏏 Welcome to the IPL live coverage!`;
        enhanced = `🎯 Match starting — stay tuned for ball-by-ball updates.`;
      } else {
        const lastBall = currentInnings.lastFewBalls[currentInnings.lastFewBalls.length - 1];
        if (lastBall?.hasWicket) basicCommentary = `💥 WICKET! Score: ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs})`;
        else if (lastBall?.hasWide) basicCommentary = `📏 WIDE! Score: ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs})`;
        else if (lastBall?.hasNoBall) basicCommentary = `⚠️ NO BALL! Free hit. Score: ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs})`;
        else basicCommentary = `🏏 ${lastBall?.runs || 0} runs. Score: ${currentInnings.runs}/${currentInnings.wickets} (${currentInnings.overs})`;

        if (isSecondInnings && needed !== null) {
          const reqRate = remainingBalls && remainingBalls > 0 ? ((needed / remainingBalls) * 6).toFixed(2) : '∞';
          basicCommentary += ` • Need ${needed} from ${remainingBalls} balls (RR: ${reqRate})`;
          enhanced += `\n\n📊 Chase: Target ${target}, Need ${needed} from ${remainingBalls} balls.`;
        }
      }

      setAiCommentary(basicCommentary);
      setEnhancedCommentary(enhanced);
    } catch (error) {
      console.error('AI commentary error:', error);
      setAiCommentary('Live score data being processed...');
    } finally {
      setIsGeneratingCommentary(false);
    }
  };

  const calculateTeamTotal = (innings: string | number) => {
    const filteredRows = liveData.filter(row => row[2] === String(innings));
    let totalRuns = 0, totalWickets = 0, totalBalls = 0;
    filteredRows.forEach((row) => {
      const actualRowIndex = liveData.indexOf(row);
      const runs = parseInt(row[6]) || 0;
      const wicket = wicketData[actualRowIndex] || {};
      const extras = extrasData[actualRowIndex] || {};
      const hasWicket = wicket.hasWicket;
      const hasWide = extras.hasWide;
      const hasNoBall = extras.hasNoBall;
      if (!hasWide && !hasNoBall) totalBalls++;
      if (hasWicket) totalWickets++;
      totalRuns += runs;
      if (hasWide) totalRuns += (extras.wideExtraRuns || 0) + 1;
      if (hasNoBall) totalRuns += 1;
      if (extras.hasByes) totalRuns += extras.byesRuns || 0;
      if (extras.hasLB) totalRuns += extras.lbRuns || 0;
    });
    const overs = Math.floor(totalBalls / 6);
    const balls = totalBalls % 6;
    return { runs: totalRuns, wickets: totalWickets, overs: `${overs}.${balls}`, runRate: totalBalls > 0 ? (totalRuns / totalBalls * 6).toFixed(2) : '0.00' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                🤖 IPL Live Score with AI
              </h1>
              <p className="text-gray-300">Real-time IPL scores with AI-powered commentary and insights</p>
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

            {/* Playing 11 warning (IPL specific) */}
            {selectedMatch && !hasPlaying11 && (
              <div
                className="rounded-2xl p-4 md:p-6 backdrop-blur-xl border mb-6"
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderColor: 'rgba(59, 130, 246, 0.25)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm text-blue-200">
                    ⚠️ Playing 11 not set yet — IPL pages require Playing 11 + Impact Player configured in Scorecard
                  </div>
                  <div className="ml-auto">
                    <a
                      href="/ipl-admin-2026/playing-11"
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80 bg-blue-600 text-white"
                    >
                      Set Playing 11
                    </a>
                  </div>
                </div>
              </div>
            )}

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

                {/* Live Feed table (compact) */}
                {liveData.length > 0 && (
                  <div className="mt-8 bg-gradient-to-br from-gray-500/20 to-gray-600/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
                      <span className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></span>
                      📊 Live Match View
                    </h3>

                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm text-left text-gray-200">
                        <thead>
                          <tr>
                            {HEADERS.map(h => (<th key={h} className="px-2 py-1 text-xs text-gray-400">{h}</th>))}
                          </tr>
                        </thead>
                        <tbody>
                          {liveData.map((row, idx) => (
                            <tr key={idx} className="border-t border-white/5">
                              {row.map((cell: any, ci: number) => <td key={ci} className="px-2 py-1">{String(cell)}</td>)}
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
  );
}
