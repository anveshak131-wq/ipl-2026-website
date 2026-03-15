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

  // Oil-palette per status: rich multi-stop gradients
  const oilBg = isLive
    ? 'linear-gradient(135deg, #1a0505 0%, #2d0a18 25%, #1e0d2e 50%, #0d1a2e 75%, #0a1a1a 100%)'
    : isCompleted
    ? 'linear-gradient(135deg, #050f0a 0%, #0a1e18 25%, #091530 50%, #0f1020 75%, #0a0f18 100%)'
    : 'linear-gradient(135deg, #07051a 0%, #130a2e 25%, #1a0a2e 50%, #0d1030 75%, #050a1a 100%)';

  const oilOrb1 = isLive
    ? 'radial-gradient(ellipse at 0% 0%, rgba(239,68,68,0.35) 0%, rgba(220,38,38,0.15) 40%, transparent 70%)'
    : isCompleted
    ? 'radial-gradient(ellipse at 0% 0%, rgba(16,185,129,0.3) 0%, rgba(20,184,166,0.15) 40%, transparent 70%)'
    : 'radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.18) 40%, transparent 70%)';

  const oilOrb2 = isLive
    ? 'radial-gradient(ellipse at 100% 100%, rgba(245,158,11,0.3) 0%, rgba(251,146,60,0.15) 40%, transparent 70%)'
    : isCompleted
    ? 'radial-gradient(ellipse at 100% 100%, rgba(34,211,238,0.25) 0%, rgba(16,185,129,0.12) 40%, transparent 70%)'
    : 'radial-gradient(ellipse at 100% 100%, rgba(236,72,153,0.3) 0%, rgba(244,114,182,0.15) 40%, transparent 70%)';

  const oilOrb3 = isLive
    ? 'radial-gradient(ellipse at 100% 0%, rgba(168,85,247,0.2) 0%, rgba(192,132,252,0.08) 50%, transparent 70%)'
    : isCompleted
    ? 'radial-gradient(ellipse at 100% 0%, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)'
    : 'radial-gradient(ellipse at 100% 0%, rgba(34,211,238,0.2) 0%, rgba(14,165,233,0.08) 50%, transparent 70%)';

  const borderGlow = isLive
    ? '0 0 0 1px rgba(239,68,68,0.5), 0 0 40px rgba(239,68,68,0.12), 0 24px 64px rgba(0,0,0,0.7)'
    : isCompleted
    ? '0 0 0 1px rgba(16,185,129,0.3), 0 0 30px rgba(16,185,129,0.08), 0 24px 64px rgba(0,0,0,0.65)'
    : '0 0 0 1px rgba(99,102,241,0.3), 0 0 30px rgba(99,102,241,0.08), 0 24px 64px rgba(0,0,0,0.65)';

  const accentLine = isLive
    ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.8), rgba(245,158,11,0.8), rgba(168,85,247,0.6), transparent)'
    : isCompleted
    ? 'linear-gradient(90deg, transparent, rgba(16,185,129,0.8), rgba(34,211,238,0.8), rgba(99,102,241,0.6), transparent)'
    : 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), rgba(236,72,153,0.8), rgba(245,158,11,0.6), transparent)';

  return (
    <>
      <motion.div
        className="group relative overflow-hidden rounded-3xl cursor-default select-none"
        style={{ background: oilBg, boxShadow: borderGlow }}
        whileHover={{
          y: -8,
          boxShadow: isLive
            ? '0 0 0 1px rgba(239,68,68,0.7), 0 0 70px rgba(239,68,68,0.2), 0 36px 80px rgba(0,0,0,0.8)'
            : isCompleted
            ? '0 0 0 1px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.15), 0 36px 80px rgba(0,0,0,0.75)'
            : '0 0 0 1px rgba(99,102,241,0.6), 0 0 60px rgba(139,92,246,0.18), 0 36px 80px rgba(0,0,0,0.75)',
          transition: { duration: 0.28, ease: 'easeOut' },
        }}
      >
        {/* ── OIL LAYER 1: large ambient blobs ── */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: oilOrb1 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: oilOrb2 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: oilOrb3 }} />

        {/* ── OIL LAYER 2: mid-card iridescent sweep ── */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: 'conic-gradient(from 200deg at 60% 50%, #7c3aed22, #06b6d422, #ec489922, #f59e0b22, #7c3aed22)',
          }}
        />

        {/* ── DIAGONAL LIGHT STREAK (top-left to bottom-right) ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-30%', left: '-10%',
            width: '55%', height: '200%',
            transform: 'rotate(-25deg)',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.025), transparent)',
          }}
        />

        {/* ── TOP RAINBOW ACCENT LINE ── */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
          style={{ background: accentLine }}
        />

        {/* ── LIVE RING ── */}
        {isLive && (
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ boxShadow: 'inset 0 0 0 1.5px rgba(239,68,68,0.35)' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* ── HOVER SHEEN ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.04) 100%)',
          }}
        />

        <div className="relative flex flex-col">

          {/* ── HEADER ── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {isLive ? (
                <motion.span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(220,38,38,0.18))',
                    border: '1px solid rgba(239,68,68,0.55)',
                    color: '#fca5a5',
                    boxShadow: '0 0 16px rgba(239,68,68,0.25)',
                  }}
                  animate={{ opacity: [1, 0.65, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                >
                  <motion.span
                    className="w-2 h-2 rounded-full bg-red-400 inline-block"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                  LIVE NOW
                </motion.span>
              ) : isCompleted ? (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.12))',
                    border: '1px solid rgba(16,185,129,0.4)',
                    color: '#6ee7b7',
                    boxShadow: '0 0 12px rgba(16,185,129,0.15)',
                  }}
                >
                  <Trophy size={10} strokeWidth={2.5} /> Completed
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(168,85,247,0.14))',
                    border: '1px solid rgba(99,102,241,0.45)',
                    color: '#c4b5fd',
                    boxShadow: '0 0 12px rgba(99,102,241,0.2)',
                  }}
                >
                  <Zap size={10} strokeWidth={2.5} /> Upcoming
                </span>
              )}

              {match.playoffType && (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(251,146,60,0.14))',
                    border: '1px solid rgba(245,158,11,0.45)',
                    color: '#fde68a',
                    boxShadow: '0 0 10px rgba(245,158,11,0.15)',
                  }}
                >
                  ⚡ {match.playoffType}
                </span>
              )}
            </div>

            {matchNumberDisplay && matchNumberDisplay !== 'TBD' && (
              <span
                className="text-[11px] font-black tracking-widest px-2 py-1 rounded-lg"
                style={{
                  background: 'rgba(255,215,0,0.08)',
                  border: '1px solid rgba(255,215,0,0.2)',
                  color: 'rgba(255,215,0,0.85)',
                  boxShadow: '0 0 10px rgba(255,215,0,0.1)',
                }}
              >
                {matchNumberDisplay}
              </span>
            )}
          </div>

          {/* ── TEAMS BATTLE ARENA ── */}
          <div className="px-4 py-2 pb-4">

            {/* Decorative cricket pitch strip */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[3px] pointer-events-none"
              style={{
                top: '80px', height: '120px',
                background: isLive
                  ? 'linear-gradient(to bottom, transparent, rgba(239,68,68,0.4), rgba(245,158,11,0.4), transparent)'
                  : isCompleted
                  ? 'linear-gradient(to bottom, transparent, rgba(16,185,129,0.35), rgba(34,211,238,0.35), transparent)'
                  : 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.4), rgba(236,72,153,0.35), transparent)',
                filter: 'blur(1px)',
              }}
            />

            <div className="flex items-center justify-between gap-2">

              {/* ── TEAM 1 ── */}
              <div className="flex-1 flex flex-col items-center gap-2.5 min-w-0">
                {/* Logo with multi-ring glow */}
                <motion.div
                  className="relative flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                >
                  {/* outer glow ring */}
                  <div
                    className="absolute inset-[-8px] rounded-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-400"
                    style={{
                      background: isLive
                        ? 'radial-gradient(circle, rgba(239,68,68,0.5), transparent 70%)'
                        : isCompleted
                        ? 'radial-gradient(circle, rgba(16,185,129,0.45), transparent 70%)'
                        : 'radial-gradient(circle, rgba(99,102,241,0.5), transparent 70%)',
                      filter: 'blur(6px)',
                    }}
                  />
                  {/* inner ring */}
                  <div
                    className="absolute inset-[-2px] rounded-2xl"
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                  />
                  <div
                    className="relative w-[76px] h-[76px] rounded-2xl flex items-center justify-center overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                      border: '1.5px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    {renderTeamLogo(match.team1)}
                  </div>
                </motion.div>

                <div className="text-center w-full">
                  <p
                    className="font-black text-base leading-tight tracking-tight"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {match.team1.shortName}
                  </p>
                  <p className="text-[10px] mt-0.5 truncate max-w-[90px] mx-auto" style={{ color: 'rgba(148,163,184,0.7)' }}>
                    {match.team1.name}
                  </p>
                </div>

                {/* Score display */}
                {(match.score || match.team1Score) && (
                  <div
                    className="text-center px-3 py-1.5 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {match.team1Score ? (
                      <p className="font-black text-base leading-none" style={{ color: '#f1f5f9' }}>{match.team1Score}</p>
                    ) : match.score ? (
                      <>
                        <p className="font-black text-xl leading-none" style={{
                          background: 'linear-gradient(135deg, #fff, #94a3b8)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}>
                          {match.score.team1.runs}
                          <span style={{ WebkitTextFillColor: 'rgba(148,163,184,0.7)', fontSize: '0.85em' }}>/{match.score.team1.wickets}</span>
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(148,163,184,0.6)' }}>{match.score.team1.overs} ov</p>
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              {/* ── VS CLASH CENTER ── */}
              <div className="flex flex-col items-center gap-0 flex-shrink-0 px-1">
                {/* top beam */}
                <div className="w-[1.5px] h-10" style={{
                  background: isLive
                    ? 'linear-gradient(to bottom, transparent, rgba(239,68,68,0.5), rgba(245,158,11,0.4))'
                    : isCompleted
                    ? 'linear-gradient(to bottom, transparent, rgba(16,185,129,0.5), rgba(34,211,238,0.4))'
                    : 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.5), rgba(236,72,153,0.4))',
                }} />

                {/* VS pill */}
                <motion.div
                  style={{
                    background: isLive
                      ? 'linear-gradient(135deg, #7f1d1d, #450a0a, #1c0533)'
                      : isCompleted
                      ? 'linear-gradient(135deg, #052e16, #014d2e, #0c1a3e)'
                      : 'linear-gradient(135deg, #1e1b4b, #3b0764, #1e1b4b)',
                    border: isLive
                      ? '1.5px solid rgba(239,68,68,0.5)'
                      : isCompleted
                      ? '1.5px solid rgba(16,185,129,0.5)'
                      : '1.5px solid rgba(99,102,241,0.5)',
                    boxShadow: isLive
                      ? '0 0 24px rgba(239,68,68,0.3), 0 0 48px rgba(239,68,68,0.1)'
                      : isCompleted
                      ? '0 0 24px rgba(16,185,129,0.3), 0 0 48px rgba(16,185,129,0.1)'
                      : '0 0 24px rgba(99,102,241,0.3), 0 0 48px rgba(99,102,241,0.1)',
                  }}
                  className="px-3 py-2 rounded-xl"
                  animate={isLive ? { boxShadow: [
                    '0 0 20px rgba(239,68,68,0.3)', '0 0 36px rgba(239,68,68,0.5)', '0 0 20px rgba(239,68,68,0.3)'
                  ]} : {}}
                  transition={{ duration: 1.4, repeat: Infinity }}
                >
                  <span
                    className="text-[13px] font-black tracking-widest"
                    style={{
                      background: isLive
                        ? 'linear-gradient(135deg, #fca5a5, #fb923c, #f87171)'
                        : isCompleted
                        ? 'linear-gradient(135deg, #6ee7b7, #67e8f9, #34d399)'
                        : 'linear-gradient(135deg, #c4b5fd, #f9a8d4, #a5b4fc)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    VS
                  </span>
                </motion.div>

                {/* bottom beam */}
                <div className="w-[1.5px] h-10" style={{
                  background: isLive
                    ? 'linear-gradient(to bottom, rgba(245,158,11,0.4), rgba(239,68,68,0.5), transparent)'
                    : isCompleted
                    ? 'linear-gradient(to bottom, rgba(34,211,238,0.4), rgba(16,185,129,0.5), transparent)'
                    : 'linear-gradient(to bottom, rgba(236,72,153,0.4), rgba(99,102,241,0.5), transparent)',
                }} />
              </div>

              {/* ── TEAM 2 ── */}
              <div className="flex-1 flex flex-col items-center gap-2.5 min-w-0">
                <motion.div
                  className="relative flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                >
                  <div
                    className="absolute inset-[-8px] rounded-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-400"
                    style={{
                      background: isLive
                        ? 'radial-gradient(circle, rgba(245,158,11,0.5), transparent 70%)'
                        : isCompleted
                        ? 'radial-gradient(circle, rgba(34,211,238,0.45), transparent 70%)'
                        : 'radial-gradient(circle, rgba(236,72,153,0.5), transparent 70%)',
                      filter: 'blur(6px)',
                    }}
                  />
                  <div
                    className="absolute inset-[-2px] rounded-2xl"
                    style={{ border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
                  />
                  <div
                    className="relative w-[76px] h-[76px] rounded-2xl flex items-center justify-center overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                      border: '1.5px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    {renderTeamLogo(match.team2)}
                  </div>
                </motion.div>

                <div className="text-center w-full">
                  <p
                    className="font-black text-base leading-tight tracking-tight"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {match.team2.shortName}
                  </p>
                  <p className="text-[10px] mt-0.5 truncate max-w-[90px] mx-auto" style={{ color: 'rgba(148,163,184,0.7)' }}>
                    {match.team2.name}
                  </p>
                </div>

                {(match.score || match.team2Score) && (
                  <div
                    className="text-center px-3 py-1.5 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {match.team2Score ? (
                      <p className="font-black text-base leading-none" style={{ color: '#f1f5f9' }}>{match.team2Score}</p>
                    ) : match.score ? (
                      <>
                        <p className="font-black text-xl leading-none" style={{
                          background: 'linear-gradient(135deg, #fff, #94a3b8)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}>
                          {match.score.team2.runs}
                          <span style={{ WebkitTextFillColor: 'rgba(148,163,184,0.7)', fontSize: '0.85em' }}>/{match.score.team2.wickets}</span>
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(148,163,184,0.6)' }}>{match.score.team2.overs} ov</p>
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
                <div className="mt-4 rounded-2xl px-3 py-2.5" style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.06))',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}>
                  <p className="text-[11px] text-purple-300 text-center leading-snug">
                    💡 Placeholders from 5 WPL teams, determined by points table
                  </p>
                </div>
              )
            )}
          </div>

          {/* ── DIVIDER ── */}
          <div className="mx-5 h-px mb-4" style={{
            background: isLive
              ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), rgba(245,158,11,0.3), rgba(168,85,247,0.2), transparent)'
              : isCompleted
              ? 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), rgba(34,211,238,0.25), rgba(99,102,241,0.2), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), rgba(236,72,153,0.25), rgba(245,158,11,0.2), transparent)',
          }} />

          {/* ── RESULT BAR ── */}
          {match.result && (
            <div
              className="mx-5 mb-4 px-4 py-3 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(245,158,11,0.06), rgba(251,146,60,0.05))',
                border: '1px solid rgba(255,215,0,0.25)',
                boxShadow: '0 0 20px rgba(255,215,0,0.06), inset 0 1px 0 rgba(255,215,0,0.1)',
              }}
            >
              <p
                className="text-[12px] font-bold text-center leading-snug"
                style={{
                  background: 'linear-gradient(135deg, #fde68a, #fbbf24, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                🏆 {match.result}
              </p>
            </div>
          )}

          {/* ── COUNTDOWN ── */}
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

          {/* ── INFO STRIP ── */}
          <div
            className="mx-5 mb-4 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Calendar size={11} style={{ color: isLive ? '#f87171' : isCompleted ? '#34d399' : '#a5b4fc', flexShrink: 0 }} />
              <span className="text-[12px] font-semibold" style={{ color: '#e2e8f0' }}>
                {formatDate(match.date)}
              </span>
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Clock size={11} style={{ color: isLive ? '#fb923c' : isCompleted ? '#67e8f9' : '#c4b5fd', flexShrink: 0 }} />
              <span className="text-[12px]" style={{ color: '#cbd5e1' }}>
                {formatMatchTime(match.time, match.date)}
              </span>
            </div>
            <div className="flex items-start gap-2.5 px-3.5 py-2.5">
              <MapPin size={11} style={{ color: 'rgba(148,163,184,0.6)', flexShrink: 0, marginTop: '1px' }} />
              <span className="text-[12px] leading-snug line-clamp-2" style={{ color: 'rgba(148,163,184,0.8)' }}>
                {match.venue}
              </span>
            </div>
          </div>

          {/* ── BUTTONS ── */}
          <div className="px-5 pb-5 flex gap-2.5">
            {match.playing11 && players && players.length > 0 && (
              <motion.button
                onClick={() => setShowPlaying11Modal(true)}
                className="group/btn relative overflow-hidden flex-1 rounded-2xl py-3 text-sm font-black tracking-tight flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #92400e, #b45309, #d97706)',
                  border: '1.5px solid rgba(245,158,11,0.45)',
                  color: '#fff',
                  boxShadow: '0 6px 28px rgba(180,83,9,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
                whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(245,158,11,0.55), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                <Users size={14} className="relative z-10" />
                <span className="relative z-10">Playing 11</span>
              </motion.button>
            )}

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
              className="group/btn relative overflow-hidden flex-1 rounded-2xl py-3 text-sm font-black tracking-tight flex items-center justify-center gap-2"
              style={{
                background: isLive
                  ? 'linear-gradient(135deg, #7f1d1d, #991b1b, #dc2626)'
                  : isCompleted
                  ? 'linear-gradient(135deg, #052e16, #065f46, #059669)'
                  : 'linear-gradient(135deg, #1e1b4b, #4c1d95, #7c3aed)',
                border: isLive
                  ? '1.5px solid rgba(239,68,68,0.5)'
                  : isCompleted
                  ? '1.5px solid rgba(16,185,129,0.5)'
                  : '1.5px solid rgba(99,102,241,0.5)',
                color: '#fff',
                boxShadow: isLive
                  ? '0 6px 28px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.12)'
                  : isCompleted
                  ? '0 6px 28px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.12)'
                  : '0 6px 28px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
              whileHover={{
                scale: 1.03,
                boxShadow: isLive
                  ? '0 14px 44px rgba(239,68,68,0.6), inset 0 1px 0 rgba(255,255,255,0.18)'
                  : isCompleted
                  ? '0 14px 44px rgba(16,185,129,0.5), inset 0 1px 0 rgba(255,255,255,0.18)'
                  : '0 14px 44px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
              <span className="relative z-10">
                {isLive && '🔴 Live Score'}
                {isCompleted && 'Scorecard'}
                {match.status === 'upcoming' && 'Set Reminder'}
              </span>
              <ChevronRight size={15} className="relative z-10 group-hover/btn:translate-x-1 transition-transform duration-200" />
            </motion.button>
          </div>

        </div>

        {/* ── BOTTOM RAINBOW ACCENT LINE ── */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[1.5px] pointer-events-none opacity-60"
          style={{ background: accentLine }}
        />
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
