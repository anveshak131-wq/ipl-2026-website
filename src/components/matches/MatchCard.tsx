"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Match, Player } from '@/types';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import { CustomEmoji } from '@/components/emoji/Emoji';
import { formatMatchTime } from '@/lib/timeUtils';
import { getMatchNumberDisplay } from '@/lib/matchNumberUtils';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Playing11Display from '@/components/matches/Playing11Display';
import { X, MapPin, Calendar, Clock, Trophy, Zap, Users, ChevronRight } from 'lucide-react';

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

  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const matchNumberDisplay = getMatchNumberDisplay(match);

  const cardBorderStyle = isLive
    ? '2px solid rgba(239, 68, 68, 0.6)'
    : isCompleted
    ? '2px solid rgba(16, 185, 129, 0.25)'
    : '2px solid rgba(255, 255, 255, 0.08)';

  const cardGlowStyle = isLive
    ? '0 0 40px rgba(239, 68, 68, 0.15), 0 20px 60px rgba(0,0,0,0.4)'
    : '0 20px 60px rgba(0,0,0,0.35)';

  return (
    <>
      <motion.div
        className="group relative overflow-hidden rounded-2xl cursor-default select-none"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
          backdropFilter: 'blur(20px)',
          border: cardBorderStyle,
          boxShadow: cardGlowStyle,
        }}
        whileHover={{
          y: -6,
          boxShadow: isLive
            ? '0 0 60px rgba(239,68,68,0.25), 0 30px 80px rgba(0,0,0,0.5)'
            : '0 0 40px rgba(99,102,241,0.2), 0 30px 80px rgba(0,0,0,0.5)',
          borderColor: isLive ? 'rgba(239,68,68,0.8)' : isCompleted ? 'rgba(16,185,129,0.5)' : 'rgba(99,102,241,0.5)',
          transition: { duration: 0.25, ease: 'easeOut' },
        }}
      >
        {/* Live pulse ring */}
        {isLive && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: '2px solid rgba(239,68,68,0.4)' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Hover shimmer overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: isLive
                ? 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(220,38,38,0.03))'
                : isCompleted
                ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.03))'
                : 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(147,51,234,0.04))',
            }}
          />
        </div>

        <div className="relative flex flex-col">

          {/* ── TOP HEADER BAR ── */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              {isLive ? (
                <motion.span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))',
                    border: '1px solid rgba(239,68,68,0.5)',
                    color: '#f87171',
                  }}
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.span
                    className="w-2 h-2 rounded-full bg-red-500 inline-block"
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  LIVE
                </motion.span>
              ) : isCompleted ? (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#34d399',
                  }}
                >
                  <Trophy size={10} /> Completed
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    color: '#a5b4fc',
                  }}
                >
                  <Zap size={10} /> Upcoming
                </span>
              )}

              {/* Playoff type badge */}
              {match.playoffType && (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    color: '#fbbf24',
                  }}
                >
                  {match.playoffType}
                </span>
              )}
            </div>

            {/* Match number */}
            {matchNumberDisplay && matchNumberDisplay !== 'TBD' && (
              <span
                className="text-[11px] font-bold tracking-wider"
                style={{ color: 'rgba(255,215,0,0.7)' }}
              >
                {matchNumberDisplay}
              </span>
            )}
          </div>

          {/* ── TEAMS HERO SECTION ── */}
          <div className="px-5 py-5">
            <div className="flex items-center justify-between gap-3">

              {/* Team 1 */}
              <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <motion.div
                  className="relative w-[68px] h-[68px] rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  }}
                  whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
                >
                  {renderTeamLogo(match.team1)}
                </motion.div>
                <div className="text-center w-full">
                  <p className="text-white font-black text-base leading-tight tracking-tight">
                    {match.team1.shortName}
                  </p>
                  <p className="text-gray-500 text-[10px] mt-0.5 truncate max-w-[90px] mx-auto">
                    {match.team1.name}
                  </p>
                </div>
                {/* Score for team1 */}
                {(match.score || match.team1Score) && (
                  <div className="text-center">
                    {match.team1Score ? (
                      <p className="text-white font-black text-lg leading-none">{match.team1Score}</p>
                    ) : match.score ? (
                      <>
                        <p className="text-white font-black text-xl leading-none">
                          {match.score.team1.runs}
                          <span className="text-gray-400 font-bold text-base">/{match.score.team1.wickets}</span>
                        </p>
                        <p className="text-gray-500 text-[11px] mt-0.5">{match.score.team1.overs} ov</p>
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              {/* VS CENTER */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className="w-px h-8"
                  style={{
                    background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)',
                  }}
                />
                <div
                  className="px-3 py-1.5 rounded-xl text-xs font-black tracking-widest"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.5)',
                    boxShadow: isLive ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
                  }}
                >
                  VS
                </div>
                <div
                  className="w-px h-8"
                  style={{
                    background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)',
                  }}
                />
              </div>

              {/* Team 2 */}
              <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <motion.div
                  className="relative w-[68px] h-[68px] rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  }}
                  whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
                >
                  {renderTeamLogo(match.team2)}
                </motion.div>
                <div className="text-center w-full">
                  <p className="text-white font-black text-base leading-tight tracking-tight">
                    {match.team2.shortName}
                  </p>
                  <p className="text-gray-500 text-[10px] mt-0.5 truncate max-w-[90px] mx-auto">
                    {match.team2.name}
                  </p>
                </div>
                {/* Score for team2 */}
                {(match.score || match.team2Score) && (
                  <div className="text-center">
                    {match.team2Score ? (
                      <p className="text-white font-black text-lg leading-none">{match.team2Score}</p>
                    ) : match.score ? (
                      <>
                        <p className="text-white font-black text-xl leading-none">
                          {match.score.team2.runs}
                          <span className="text-gray-400 font-bold text-base">/{match.score.team2.wickets}</span>
                        </p>
                        <p className="text-gray-500 text-[11px] mt-0.5">{match.score.team2.overs} ov</p>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* WPL TBD notice */}
            {match.league === 'wpl' && match.playoffType && (
              (String(match.team1.id).includes('tbd-') || String(match.team2.id).includes('tbd-') ||
               match.team1.shortName?.includes('Place') || match.team2.shortName?.includes('Place') ||
               match.team1.shortName === 'Winner of Eliminator' || match.team2.shortName === 'Winner of Eliminator') && (
                <div className="mt-3 rounded-xl px-3 py-2" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <p className="text-[11px] text-purple-300 text-center leading-snug">
                    💡 Placeholders from 5 WPL teams, determined by points table
                  </p>
                </div>
              )
            )}
          </div>

          {/* ── RESULT BAR ── */}
          {match.result && (
            <div
              className="mx-5 mb-4 px-4 py-2.5 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(245,158,11,0.06))',
                border: '1px solid rgba(255,215,0,0.2)',
              }}
            >
              <p className="text-[12px] font-bold text-center leading-snug"
                 style={{ color: '#fbbf24' }}>
                <Trophy size={11} className="inline mr-1.5 mb-0.5" />
                {match.result}
              </p>
            </div>
          )}

          {/* ── COUNTDOWN (upcoming) ── */}
          {match.status === 'upcoming' && (
            <div className="mx-5 mb-4">
              <CountdownTimer
                targetDate={match.date}
                matchTime={match.time}
                variant="panel"
                className="w-full"
              />
            </div>
          )}

          {/* ── INFO FOOTER ── */}
          <div
            className="mx-5 mb-4 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.05]">
              <Calendar size={11} className="text-gray-500 flex-shrink-0" />
              <span className="text-gray-300 text-[12px] font-semibold">
                {formatDate(match.date)}
              </span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.05]">
              <Clock size={11} className="text-gray-500 flex-shrink-0" />
              <span className="text-gray-300 text-[12px]">
                {formatMatchTime(match.time, match.date)}
              </span>
            </div>
            <div className="flex items-start gap-3 px-3 py-2.5">
              <MapPin size={11} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-400 text-[12px] leading-snug line-clamp-2">
                {match.venue}
              </span>
            </div>
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div className="px-5 pb-5 flex gap-2.5">
            {/* Playing 11 Button */}
            {match.playing11 && players && players.length > 0 && (
              <motion.button
                onClick={() => setShowPlaying11Modal(true)}
                className="group relative overflow-hidden flex-1 rounded-xl py-3 text-sm font-black tracking-tight flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  border: '1.5px solid rgba(245,158,11,0.4)',
                  color: '#fff',
                  boxShadow: '0 6px 24px rgba(245,158,11,0.3)',
                }}
                whileHover={{ scale: 1.03, boxShadow: '0 10px 36px rgba(245,158,11,0.5)' }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700" />
                <Users size={14} className="relative z-10" />
                <span className="relative z-10">Playing 11</span>
              </motion.button>
            )}

            {/* Main CTA Button */}
            <motion.button
              onClick={() => {
                if (match.status === 'completed' || match.status === 'live') {
                  setShowScorecardModal(true);
                } else if (match.status === 'upcoming') {
                  alert('Reminder set!');
                } else {
                  alert('Opening stream...');
                }
              }}
              className="group relative overflow-hidden flex-1 rounded-xl py-3 text-sm font-black tracking-tight flex items-center justify-center gap-2"
              style={{
                background: isLive
                  ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                  : isCompleted
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : 'linear-gradient(135deg, #6366f1, #9333ea)',
                border: isLive
                  ? '1.5px solid rgba(239,68,68,0.4)'
                  : isCompleted
                  ? '1.5px solid rgba(16,185,129,0.4)'
                  : '1.5px solid rgba(99,102,241,0.4)',
                color: '#fff',
                boxShadow: isLive
                  ? '0 6px 24px rgba(239,68,68,0.35)'
                  : isCompleted
                  ? '0 6px 24px rgba(16,185,129,0.3)'
                  : '0 6px 24px rgba(99,102,241,0.3)',
              }}
              whileHover={{
                scale: 1.03,
                boxShadow: isLive
                  ? '0 10px 36px rgba(239,68,68,0.55)'
                  : isCompleted
                  ? '0 10px 36px rgba(16,185,129,0.5)'
                  : '0 10px 36px rgba(99,102,241,0.5)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700" />
              <span className="relative z-10">
                {isLive && 'Live Score'}
                {isCompleted && 'Scorecard'}
                {match.status === 'upcoming' && 'Set Reminder'}
              </span>
              <ChevronRight size={15} className="relative z-10 group-hover:translate-x-0.5 transition-transform duration-200" />
            </motion.button>
          </div>

        </div>
      </motion.div>

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
                  <div className="text-white font-semibold">{formatDate(match.date)} • {formatMatchTime(match.time, match.date)}</div>
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

                        {/* Fall of Wickets */}
                        {inning.fallOfWickets && inning.fallOfWickets.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-white mb-3">Fall of Wickets</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-white/20 text-gray-400">
                                    <th className="text-left p-2">Player</th>
                                    <th className="text-center p-2">Score</th>
                                    <th className="text-center p-2">Over</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inning.fallOfWickets.map((fow: any, fidx: number) => (
                                    <tr key={fidx} className="border-b border-white/10 text-white">
                                      <td className="p-2 font-semibold">{fow.player}</td>
                                      <td className="p-2 text-center font-bold text-yellow-400">{fow.score}</td>
                                      <td className="p-2 text-center">{fow.over}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Powerplays */}
                        {inning.powerplays && (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-white mb-3">Powerplays</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {inning.powerplays.mandatory && (
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                  <div className="text-sm text-gray-400 mb-1">Mandatory Powerplay</div>
                                  <div className="text-white font-semibold">{inning.powerplays.mandatory.overs || 'N/A'}</div>
                                  <div className="text-green-400 font-bold">{inning.powerplays.mandatory.runs || 0} runs</div>
                                </div>
                              )}
                              {inning.powerplays.optional && (
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                  <div className="text-sm text-gray-400 mb-1">Optional Powerplay</div>
                                  <div className="text-white font-semibold">{inning.powerplays.optional.overs || 'N/A'}</div>
                                  <div className="text-green-400 font-bold">{inning.powerplays.optional.runs || 0} runs</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Partnerships */}
                        {inning.partnerships && inning.partnerships.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-white mb-3">Partnerships</h4>
                            <div className="space-y-3">
                              {inning.partnerships.map((partnership: any, pidx: number) => (
                                <div key={pidx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <div className="text-sm text-gray-400 mb-1">Batsman 1</div>
                                      <div className="text-white font-semibold">{partnership.batsman1}</div>
                                      <div className="text-green-400">{partnership.batsman1Runs} ({partnership.batsman1Balls})</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-gray-400 mb-1">Batsman 2</div>
                                      <div className="text-white font-semibold">{partnership.batsman2}</div>
                                      <div className="text-green-400">{partnership.batsman2Runs} ({partnership.batsman2Balls})</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-gray-400 mb-1">Partnership</div>
                                      <div className="text-yellow-400 font-bold text-lg">{partnership.totalRuns} runs</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
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
