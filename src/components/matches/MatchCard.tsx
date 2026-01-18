"use client";

import { useState, Fragment, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Match, Player } from '@/types';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { CustomEmoji } from '@/components/emoji/Emoji';
import { formatMatchTime } from '@/lib/timeUtils';
import { getMatchNumberDisplay } from '@/lib/matchNumberUtils';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Playing11Display from '@/components/matches/Playing11Display';
import { X } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  index?: number;
  players?: Player[]; // Optional players data for playing XI display
}

export default function MatchCard({ match, index = 0, players }: MatchCardProps) {
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [showPlaying11Modal, setShowPlaying11Modal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scorecard, setScorecard] = useState<any>(null);
  const [loadingScorecard, setLoadingScorecard] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showScorecardModal && match.id) {
      fetchScorecard();
    }
  }, [showScorecardModal, match.id]);

  const fetchScorecard = async () => {
    setLoadingScorecard(true);
    try {
      const response = await fetch(`/api/scorecards?matchId=${match.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Scorecard API response:', data);
        // API returns array directly when querying by matchId
        const scorecards = Array.isArray(data) ? data : [];
        // Find published scorecard only (draft = false)
        const published = scorecards.find((s: any) => s.draft === false);
        console.log('Published scorecard found:', published);
        setScorecard(published || null);
      } else {
        console.error('Failed to fetch scorecard:', response.status);
      }
    } catch (error) {
      console.error('Error fetching scorecard:', error);
    } finally {
      setLoadingScorecard(false);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return ' LIVE';
      case 'completed':
        return ' Completed';
      default:
        return ' Upcoming';
    }
  };

  const renderTeamLogo = (team: Match['team1']) => {
    // ALWAYS prioritize team.logo first (especially for TBA/TBD teams)
    if (team.logo && team.logo.trim() !== '') {
      // Check for TBA logo
      if (team.logo.includes('tba_logo.svg')) {
        return (
          <Image
            src={team.logo}
            alt="TBA"
            width={40}
            height={40}
            className="object-contain"
          />
        );
      }
      // If team has a logo, use it directly (unless it's a special case)
      if (!team.logo.endsWith('.json') && !team.logo.includes('rcb_logo_premium.svg')) {
        return (
          <Image
            src={team.logo}
            alt={`${team.shortName} logo`}
            width={40}
            height={40}
            className="object-contain"
            onError={(e) => {
              // Fallback to animated path if team.logo fails
              const teamLeague = team.league || match.league || 'ipl';
              const animatedPath = getAnimatedLogoPath(team.id, team.shortName || '', teamLeague);
              (e.target as HTMLImageElement).src = animatedPath;
            }}
          />
        );
      }
    }

    // Check if it's a TBD team by ID or shortName
    const teamIdStr = String(team.id || '');
    if (teamIdStr.includes('tbd-') || team.shortName === 'TBD' || team.shortName?.includes('Place') || team.name?.includes('Place Team')) {
      return (
        <Image
          src="/logos/tba_logo.svg"
          alt="TBA"
          width={40}
          height={40}
          className="object-contain"
        />
      );
    }

    // Get league from team, match, or default to 'ipl'
    const teamLeague = team.league || match.league || 'ipl';
    const teamShortName = team.shortName || '';
    const animatedPath = getAnimatedLogoPath(team.id, teamShortName, teamLeague);
    const fallbackPath = getLogoPath(team.id);

    // Use modern logo component for better animations
    return (
      <Image
        src={animatedPath}
        alt={`${team.shortName} logo`}
        width={40}
        height={40}
        className="object-contain transition-transform duration-300 hover:scale-110"
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallbackPath;
        }}
      />
    );
  };

  return (
    <>
      <div
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-ipl-gold/50 transition-all duration-300 hover:shadow-2xl hover:shadow-ipl-gold/20 transform hover:scale-105 animate-scale-in"
        style={{ animationDelay: `${index * 80}ms` }}
      >
      {/* Animated background on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold/10 to-ipl-purple/10" />
      </div>

      {/* Content */}
      <div className="relative p-6 md:p-8 space-y-4">
        {/* Status Badge and Match Number */}
        <div className="flex justify-between items-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(match.status)}`}>
            {getStatusText(match.status)}
          </span>
          {(() => {
            const matchNumberDisplay = getMatchNumberDisplay(match);
            if (matchNumberDisplay && matchNumberDisplay !== 'TBD') {
              return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-ipl-gold/20 text-ipl-gold border border-ipl-gold/30">
                  {matchNumberDisplay}
                </span>
              );
            }
            return null;
          })()}
        </div>

        {/* Date and Time */}
        <div className="space-y-3">
          <div>
            <p className="text-white font-bold text-base flex items-center gap-2">
              <CustomEmoji type="calendar" size={14} /> {formatDate(match.date)}
            </p>
            <p className="text-gray-300 text-sm mt-1 flex items-center gap-2 flex-wrap">
              <CustomEmoji type="clock" size={14} /> 
              <span>{formatMatchTime(match.time, match.date)}</span>
            </p>
          </div>
          
          {/* Countdown Timer for Upcoming Matches */}
          {match.status === 'upcoming' && (
            <div className="pt-2 pb-1">
              <CountdownTimer 
                targetDate={match.date} 
                matchTime={match.time}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-4">
          {/* WPL Playoff Helper Text */}
          {match.league === 'wpl' && match.playoffType && (
            (String(match.team1.id).includes('tbd-') || String(match.team2.id).includes('tbd-') || 
             match.team1.shortName?.includes('Place') || match.team2.shortName?.includes('Place') ||
             match.team1.shortName === 'Winner of Eliminator' || match.team2.shortName === 'Winner of Eliminator') && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 mb-2">
                <p className="text-xs text-purple-300 text-center">
                  💡 These are placeholders from the 5 WPL teams, determined by points table standings
                </p>
              </div>
            )
          )}
          
          {/* Team 1 */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-black/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {renderTeamLogo(match.team1)}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                {match.team1.shortName}
              </p>
              <p className="text-gray-400 text-xs">
                {match.team1.name}
              </p>
            </div>
            {match.score && (
              <div className="text-right">
                <p className="text-white font-bold text-sm">
                  {match.score.team1.runs}/{match.score.team1.wickets}
                </p>
                <p className="text-gray-400 text-xs">
                  {match.score.team1.overs} ov
                </p>
              </div>
            )}
          </div>

          {/* VS divider */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-gray-400 font-semibold text-sm px-2">VS</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          {/* Team 2 */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-black/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {renderTeamLogo(match.team2)}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                {match.team2.shortName}
              </p>
              <p className="text-gray-400 text-xs">
                {match.team2.name}
              </p>
            </div>
            {match.score && (
              <div className="text-right">
                <p className="text-white font-bold text-sm">
                  {match.score.team2.runs}/{match.score.team2.wickets}
                </p>
                <p className="text-gray-400 text-xs">
                  {match.score.team2.overs} ov
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Venue */}
        <div className="text-xs text-gray-300 flex items-center pt-2">
          <svg className="w-3 h-3 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {match.venue}
        </div>

        {/* Result */}
        {match.result && (
          <div className="text-xs text-ipl-gold font-semibold pt-2 border-t border-white/10">
            <div className="max-w-full overflow-hidden">
              <span className="block truncate whitespace-nowrap">{match.result}</span>
            </div>
          </div>
        )}

        {/* Action Buttons - Premium Design */}
        <div className="flex gap-3 mt-4">
          {/* Playing 11 Button */}
          {match.playing11 && players && players.length > 0 && (
            <button
              onClick={() => setShowPlaying11Modal(true)}
              className="group flex-1 relative overflow-hidden rounded-xl font-bold text-sm py-3 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
                boxShadow: '0 10px 40px rgba(245, 158, 11, 0.4), 0 0 60px rgba(217, 119, 6, 0.3)',
                border: '2px solid rgba(245, 158, 11, 0.5)',
                color: '#fff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(245, 158, 11, 0.6), 0 0 80px rgba(217, 119, 6, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(245, 158, 11, 0.4), 0 0 60px rgba(217, 119, 6, 0.3)';
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <span className="relative z-10 flex items-center justify-center gap-2 font-black tracking-tight">
                Playing 11
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
            </button>
          )}

          {/* Main Action Button */}
          <button
            onClick={() => {
              // Show scorecard if it exists (for any match status)
              if (match.scorecard || match.status === 'completed' || match.status === 'live') {
                setShowScorecardModal(true);
              } else if (match.status === 'upcoming') {
                alert('Reminder set!');
              } else {
                alert('Opening stream...');
              }
            }} 
            className="group flex-1 relative overflow-hidden rounded-xl font-bold text-sm py-3 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              background: match.status === 'live' 
                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)'
                : match.status === 'completed'
                ? 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)'
                : 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #A855F7 100%)',
              boxShadow: match.status === 'live'
                ? '0 10px 40px rgba(239, 68, 68, 0.4), 0 0 60px rgba(220, 38, 38, 0.3)'
                : match.status === 'completed'
                ? '0 10px 40px rgba(16, 185, 129, 0.4), 0 0 60px rgba(5, 150, 105, 0.3)'
                : '0 10px 40px rgba(124, 58, 237, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)',
              border: match.status === 'live'
                ? '2px solid rgba(239, 68, 68, 0.5)'
                : match.status === 'completed'
                ? '2px solid rgba(16, 185, 129, 0.5)'
                : '2px solid rgba(124, 58, 237, 0.5)',
              color: '#fff',
            }}
            onMouseEnter={(e) => {
              if (match.status === 'live') {
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(239, 68, 68, 0.6), 0 0 80px rgba(220, 38, 38, 0.5)';
              } else if (match.status === 'completed') {
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(16, 185, 129, 0.6), 0 0 80px rgba(5, 150, 105, 0.5)';
              } else {
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(124, 58, 237, 0.6), 0 0 80px rgba(147, 51, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (match.status === 'live') {
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(239, 68, 68, 0.4), 0 0 60px rgba(220, 38, 38, 0.3)';
              } else if (match.status === 'completed') {
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(16, 185, 129, 0.4), 0 0 60px rgba(5, 150, 105, 0.3)';
              } else {
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(124, 58, 237, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)';
              }
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
              style={{
                background: match.status === 'live'
                  ? 'radial-gradient(circle, rgba(239, 68, 68, 0.6), transparent)'
                  : match.status === 'completed'
                  ? 'radial-gradient(circle, rgba(16, 185, 129, 0.6), transparent)'
                  : 'radial-gradient(circle, rgba(124, 58, 237, 0.6), transparent)',
              }}
            />
            
            <span className="relative z-10 flex items-center justify-center gap-2 font-black tracking-tight">
              {match.status === 'upcoming' && 'Set Reminder'}
              {match.status === 'live' && 'View Details'}
              {match.status === 'completed' && 'Show Scorecard'}
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>

      {/* Scorecard Modal - Using Portal */}
      {mounted && showScorecardModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black"
        >
          <div 
            className="w-full h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowScorecardModal(false)}
              className="fixed top-4 right-4 md:top-8 md:right-8 p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all z-[10000] shadow-2xl hover:scale-110"
            >
              <X size={32} strokeWidth={3} />
            </button>

            {/* Modal Content Container */}
            <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
              <div className="w-full max-w-6xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border-4 border-ipl-gold/60 shadow-[0_0_100px_rgba(255,215,0,0.3)] p-6 md:p-12 my-8">
                <h2 className="text-3xl md:text-5xl font-bold text-ipl-gold mb-8 text-center">Match Scorecard</h2>
              
              {/* Teams Header */}
              <div className="flex items-center justify-between mb-6 p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  {renderTeamLogo(match.team1)}
                  <div>
                    <div className="font-bold text-white">{match.team1.name}</div>
                    {match.team1Score && (
                      <div className="text-2xl font-bold text-ipl-gold">{match.team1Score}</div>
                    )}
                  </div>
                </div>
                <div className="text-gray-400 font-bold">VS</div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-white">{match.team2.name}</div>
                    {match.team2Score && (
                      <div className="text-2xl font-bold text-ipl-gold">{match.team2Score}</div>
                    )}
                  </div>
                  {renderTeamLogo(match.team2)}
                </div>
              </div>

              {/* Match Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="text-gray-400 text-sm">Venue</div>
                  <div className="text-white font-semibold">{match.venue}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="text-gray-400 text-sm">Date & Time</div>
                  <div className="text-white font-semibold">{formatDate(match.date)} • {formatMatchTime(match.time)}</div>
                </div>
              </div>

              {/* Scorecard Content */}
              {loadingScorecard ? (
                <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl text-center border-2 border-white/20">
                  <div className="text-gray-300 mb-3 text-lg font-semibold">Loading scorecard...</div>
                </div>
              ) : scorecard ? (
                <div className="space-y-8">
                  {/* Toss Info */}
                  {scorecard.matchInfo?.toss?.winner && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <div className="text-blue-400 text-sm font-semibold">Toss</div>
                      <div className="text-white">
                        {scorecard.matchInfo.toss.winner} won the toss and chose to {scorecard.matchInfo.toss.decision}
                      </div>
                    </div>
                  )}

                  {/* Match Result - Moved here after Toss */}
                  {scorecard.result && scorecard.result.winner && (
                    <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-2 border-green-500/40 rounded-2xl">
                      <div className="text-green-400 text-sm font-semibold mb-2">Match Result</div>
                      <div className="text-white font-bold text-xl">
                        {scorecard.result.winner}
                        {scorecard.result.margin && ` won by ${scorecard.result.margin}`}
                      </div>
                      {scorecard.result.manOfTheMatch && (
                        <div className="text-yellow-400 mt-2">Player of the Match: {scorecard.result.manOfTheMatch}</div>
                      )}
                    </div>
                  )}

                  {/* Innings */}
                  {scorecard.innings
                    ?.sort((a: any, b: any) => (a.inningsNumber || 1) - (b.inningsNumber || 1))
                    .map((inning: any, idx: number) => {
                    const battingTeam = inning.battingTeamId === match.team1.id ? match.team1.name : match.team2.name;
                    const inningsLabel = inning.inningsNumber || (idx + 1);
                    return (
                      <div key={idx} className="bg-white/5 rounded-2xl p-6 border-2 border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-ipl-gold">
                            {battingTeam} Innings
                          </h3>
                          <span className="text-sm font-semibold text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                            {inningsLabel === 1 ? '1st Innings' : '2nd Innings'}
                          </span>
                        </div>

                        {/* Innings Total */}
                        {inning.totalRuns !== undefined && (
                          <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
                            <div className="text-3xl font-bold text-white text-center">
                              {inning.totalRuns}/{inning.totalWickets || 0} ({inning.totalOvers || '0.0'} overs)
                            </div>
                          </div>
                        )}

                        {/* Batting */}
                        {inning.batting?.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-white mb-3">Batting</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-white/20 text-gray-400">
                                    <th className="text-left p-2">Batter</th>
                                    <th className="text-center p-2">R</th>
                                    <th className="text-center p-2">B</th>
                                    <th className="text-center p-2">4s</th>
                                    <th className="text-center p-2">6s</th>
                                    <th className="text-center p-2">SR</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inning.batting.map((batter: any, bidx: number) => (
                                    <tr key={bidx} className="border-b border-white/10 text-white">
                                      <td className="p-2">
                                        <div className="font-semibold">
                                          {batter.name}
                                          {batter.isCaptain && <span className="ml-2 text-xs font-bold text-yellow-400">(C)</span>}
                                        </div>
                                        {batter.dismissal?.details && (
                                          <div className="text-xs text-gray-400">{batter.dismissal.details}</div>
                                        )}
                                      </td>
                                      <td className="text-center p-2 font-bold">{batter.runs || 0}</td>
                                      <td className="text-center p-2">{batter.balls || 0}</td>
                                      <td className="text-center p-2">{batter.fours || 0}</td>
                                      <td className="text-center p-2">{batter.sixes || 0}</td>
                                      <td className="text-center p-2">{batter.strikeRate?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Extras */}
                        {inning.extras && (
                          <div className="mb-6 p-3 bg-white/5 rounded-lg">
                            <div className="text-sm text-gray-400">Extras: 
                              <span className="text-white ml-2">
                                {(Number(inning.extras.wides) || 0) + (Number(inning.extras.noBalls) || 0) + (Number(inning.extras.byes) || 0) + (Number(inning.extras.legByes) || 0)}
                                {' '}(wd {inning.extras.wides || 0}, nb {inning.extras.noBalls || 0}, b {inning.extras.byes || 0}, lb {inning.extras.legByes || 0})
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Bowling */}
                        {inning.bowling?.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-white mb-3">Bowling</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-white/20 text-gray-400">
                                    <th className="text-left p-2">Bowler</th>
                                    <th className="text-center p-2">O</th>
                                    <th className="text-center p-2">M</th>
                                    <th className="text-center p-2">R</th>
                                    <th className="text-center p-2">W</th>
                                    <th className="text-center p-2">Econ</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inning.bowling.map((bowler: any, boidx: number) => (
                                    <tr key={boidx} className="border-b border-white/10 text-white">
                                      <td className="p-2 font-semibold">
                                        {bowler.name}
                                        {bowler.isCaptain && <span className="ml-2 text-xs font-bold text-yellow-400">(C)</span>}
                                      </td>
                                      <td className="text-center p-2">{bowler.overs || 0}.{bowler.balls || 0}</td>
                                      <td className="text-center p-2">{bowler.maidens || 0}</td>
                                      <td className="text-center p-2">{bowler.runs || 0}</td>
                                      <td className="text-center p-2 font-bold">{bowler.wickets || 0}</td>
                                      <td className="text-center p-2">{bowler.economyRate?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl text-center border-2 border-white/20">
                  <div className="text-gray-300 mb-3 text-lg font-semibold">No scorecard available</div>
                  <div className="text-gray-400">Scorecard will be published after the match</div>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Playing 11 Modal - Using Portal */}
      {mounted && showPlaying11Modal && match.playing11 && players && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black"
        >
          <div 
            className="w-full h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPlaying11Modal(false)}
              className="fixed top-4 right-4 md:top-8 md:right-8 p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all z-[10000] shadow-2xl hover:scale-110"
            >
              <X size={32} strokeWidth={3} />
            </button>

            {/* Modal Content Container */}
            <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
              <div className="w-full max-w-6xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border-4 border-ipl-gold/60 shadow-[0_0_100px_rgba(255,215,0,0.3)] p-6 md:p-12 my-8">
                <h2 className="text-3xl md:text-5xl font-bold text-ipl-gold mb-8 text-center">Playing XI</h2>
              
              <Playing11Display match={match} players={players} />
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
