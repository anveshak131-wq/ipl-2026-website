'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Match, Player } from '@/types';
import { formatMatchTime } from '@/lib/timeUtils';
import { getMatchNumberDisplay } from '@/lib/matchNumberUtils';
import { getMatchAdvisory } from '@/lib/matchAdvisory';
import MatchTeamCrest from '@/components/matches/MatchTeamCrest';
import CountdownTimer from '@/components/ui/CountdownTimer';
import {
  MapPin,
  Calendar,
  Clock,
  Trophy,
  ArrowRight,
  AlertTriangle,
  CloudRain,
  Info,
  Radio,
  Zap,
} from 'lucide-react';

interface MatchCardProps {
  match: Match;
  index?: number;
  players?: Player[];
  detailHref?: string;
}

export default function MatchCard({ match, index = 0, detailHref }: MatchCardProps) {
  const router = useRouter();
  const matchCenterHref = detailHref || `/matches/${match.id}`;

  const openMatchCenter = () => {
    const parsedDate = new Date(match.date);
    const season = !Number.isNaN(parsedDate.getTime())
      ? String(parsedDate.getFullYear())
      : ((match.date || '').match(/(20\d{2}|19\d{2})/) || [])[1] || '';

    const query = new URLSearchParams({
      league: match.league || 'ipl',
      date: match.date || '',
      team1Id: String(match.team1?.id || ''),
      team2Id: String(match.team2?.id || ''),
    });
    if (season) {
      query.set('season', season);
    }
    const separator = matchCenterHref.includes('?') ? '&' : '?';
    router.push(`${matchCenterHref}${separator}${query.toString()}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const isUpcoming = match.status === 'upcoming';
  const matchNumberDisplay = getMatchNumberDisplay(match);
  const advisory = getMatchAdvisory(match);

  // Winner check for subtle highlight
  const team1Short = (match.team1?.shortName || '').toLowerCase();
  const team2Short = (match.team2?.shortName || '').toLowerCase();
  const resultLower = (match.result || '').toLowerCase();
  const team1Won = isCompleted && resultLower.includes(team1Short) && !resultLower.includes(team2Short);
  const team2Won = isCompleted && resultLower.includes(team2Short) && !resultLower.includes(team1Short);

  return (
    <motion.div
      onClick={openMatchCenter}
      whileHover={{ y: -6, transition: { duration: 0.22, ease: 'easeOut' } }}
      className={`group relative overflow-hidden rounded-[26px] border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between ${
        isLive
          ? 'border-red-500/50 bg-gradient-to-b from-[#18080A]/95 via-[#0D0B14]/95 to-[#080B18]/95 shadow-[0_16px_45px_rgba(239,68,68,0.2)]'
          : match.playoffType
          ? 'border-amber-500/40 bg-gradient-to-b from-[#141006]/95 via-[#0B0D18]/95 to-[#080A14]/95 shadow-[0_16px_45px_rgba(245,158,11,0.15)]'
          : 'border-white/12 bg-gradient-to-b from-[#0F172A]/90 via-[#0A0E1A]/95 to-[#050814]/95 shadow-[0_14px_36px_rgba(0,0,0,0.5)] hover:border-amber-400/45 hover:shadow-[0_20px_50px_rgba(245,158,11,0.18)]'
      }`}
    >
      {/* Top Accent Strip */}
      <div
        className={`h-1 w-full ${
          isLive
            ? 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600 animate-pulse'
            : match.playoffType
            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
            : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500'
        }`}
      />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                LIVE NOW
              </span>
            ) : isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Trophy className="w-3 h-3 text-amber-400" />
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
                <Zap className="w-3 h-3 text-blue-400" />
                Upcoming
              </span>
            )}

            {match.playoffType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/35">
                ⚡ {match.playoffType}
              </span>
            )}
          </div>

          {matchNumberDisplay && matchNumberDisplay !== 'TBD' && (
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              {matchNumberDisplay}
            </span>
          )}
        </div>

        {/* Advisory alert if rain or reduced overs */}
        {advisory && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="line-clamp-1">{advisory.title} {advisory.detail ? `• ${advisory.detail}` : ''}</span>
          </div>
        )}

        {/* ── TEAMS BATTLE ARENA ── */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Team 1 */}
          <div className={`flex flex-col items-center text-center space-y-2 p-2 rounded-2xl transition-all ${
            team1Won ? 'bg-amber-400/[0.06] border border-amber-400/25' : ''
          }`}>
            <MatchTeamCrest team={match.team1} size={58} glow={team1Won} />

            <div className="w-full">
              <span className="block text-lg font-black text-white tracking-tight leading-tight">
                {match.team1?.shortName || 'TBD'}
              </span>
              <span className="block text-[11px] text-slate-400 truncate max-w-[110px] mx-auto mt-0.5">
                {match.team1?.name || ''}
              </span>
            </div>

            {/* Score */}
            {(match.score?.team1 || match.team1Score) && (
              <div className="pt-1">
                {match.score?.team1 ? (
                  <div className="space-y-0.5">
                    <span className="text-xl font-black text-white tabular-nums block leading-none">
                      {match.score.team1.runs}/{match.score.team1.wickets}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      ({match.score.team1.overs} ov)
                    </span>
                  </div>
                ) : (
                  <span className="text-base font-black text-slate-200 block">
                    {match.team1Score}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center px-1">
            <span className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 text-white font-black text-xs flex items-center justify-center shadow-inner">
              VS
            </span>
          </div>

          {/* Team 2 */}
          <div className={`flex flex-col items-center text-center space-y-2 p-2 rounded-2xl transition-all ${
            team2Won ? 'bg-amber-400/[0.06] border border-amber-400/25' : ''
          }`}>
            <MatchTeamCrest team={match.team2} size={58} glow={team2Won} />

            <div className="w-full">
              <span className="block text-lg font-black text-white tracking-tight leading-tight">
                {match.team2?.shortName || 'TBD'}
              </span>
              <span className="block text-[11px] text-slate-400 truncate max-w-[110px] mx-auto mt-0.5">
                {match.team2?.name || ''}
              </span>
            </div>

            {/* Score */}
            {(match.score?.team2 || match.team2Score) && (
              <div className="pt-1">
                {match.score?.team2 ? (
                  <div className="space-y-0.5">
                    <span className="text-xl font-black text-white tabular-nums block leading-none">
                      {match.score.team2.runs}/{match.score.team2.wickets}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      ({match.score.team2.overs} ov)
                    </span>
                  </div>
                ) : (
                  <span className="text-base font-black text-slate-200 block">
                    {match.team2Score}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RESULT BANNER ── */}
        {match.result && (
          <div className="p-3 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 text-center">
            <p className="text-xs font-bold text-amber-200 flex items-center justify-center gap-1.5 leading-snug">
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{match.result}</span>
            </p>
          </div>
        )}

        {/* ── UPCOMING COUNTDOWN ── */}
        {isUpcoming && (
          <div className="pt-1">
            <CountdownTimer
              targetDate={match.date}
              matchTime={match.time}
              variant="compact"
              className="w-full"
            />
          </div>
        )}

        {/* ── VENUE & TIMING FOOTER ── */}
        <div className="space-y-2 pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              {formatDate(match.date)}
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              {formatMatchTime(match.time, match.date)}
            </span>
          </div>

          <div className="flex items-start gap-1.5 text-slate-400 text-[11px] leading-tight">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{match.venue}</span>
          </div>
        </div>
      </div>

      {/* ── MATCH CENTER ACTION BAR ── */}
      <div className="px-5 py-3.5 bg-black/40 border-t border-white/10 flex items-center justify-between group-hover:bg-amber-400/10 transition-colors">
        <span className="text-xs font-bold text-slate-300 group-hover:text-amber-200 transition-colors">
          Match Center & Analytics
        </span>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
}
