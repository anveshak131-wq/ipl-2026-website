"use client";

import { Match } from '@/types';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { CustomEmoji } from '@/components/emoji/Emoji';
import { formatMatchTime } from '@/lib/timeUtils';
import { getMatchNumberDisplay } from '@/lib/matchNumberUtils';

interface MatchCardProps {
  match: Match;
  index?: number;
}

export default function MatchCard({ match, index = 0 }: MatchCardProps) {
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
          <img
            src={team.logo}
            alt="TBA"
            className="w-10 h-10 object-contain"
          />
        );
      }
      // If team has a logo, use it directly (unless it's a special case)
      if (!team.logo.endsWith('.json') && !team.logo.includes('rcb_logo_premium.svg')) {
        return (
          <img
            src={team.logo}
            alt={`${team.shortName} logo`}
            className="w-10 h-10 object-contain"
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
    if (team.id.includes('tbd-') || team.shortName === 'TBD' || team.shortName?.includes('Place') || team.name?.includes('Place Team')) {
      return (
        <img
          src="/logos/tba_logo.svg"
          alt="TBA"
          className="w-10 h-10 object-contain"
        />
      );
    }

    // Get league from team, match, or default to 'ipl'
    const teamLeague = team.league || match.league || 'ipl';
    const teamShortName = team.shortName || '';
    const animatedPath = getAnimatedLogoPath(team.id, teamShortName, teamLeague);
    const fallbackPath = getLogoPath(team.id);

    if (animatedPath.endsWith('.json')) {
      return <RCBLottie className="w-10 h-10" />;
    }

    if (animatedPath.endsWith('rcb_logo_premium.svg')) {
      return <RCBLionLogo className="w-12 h-12" />;
    }

    return (
      <img
        src={animatedPath}
        alt={`${team.shortName} logo`}
        className="w-10 h-10 object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallbackPath;
        }}
      />
    );
  };

  return (
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
          {match.matchNumber && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-ipl-gold/20 text-ipl-gold border border-ipl-gold/30">
              {getMatchNumberDisplay(match)}
            </span>
          )}
        </div>

        {/* Date and Time */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white font-bold text-base flex items-center gap-2">
              <CustomEmoji type="calendar" size={14} /> {formatDate(match.date)}
            </p>
            <p className="text-gray-300 text-sm mt-1 flex items-center gap-2 flex-wrap">
              <CustomEmoji type="clock" size={14} /> 
              <span>{formatMatchTime(match.time, match.date)}</span>
            </p>
          </div>
        </div>

        {/* Teams */}
        <div className="space-y-4">
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
            {match.result}
          </div>
        )}

        {/* Action Button - Premium Design */}
        <button 
          onClick={() => alert(`${match.status === 'upcoming' ? 'Reminder set!' : match.status === 'live' ? 'Opening stream...' : 'Loading highlights...'}`)} 
          className="group w-full relative overflow-hidden rounded-xl font-bold text-sm py-3 mt-4 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
            {match.status === 'live' && 'Watch Live'}
            {match.status === 'completed' && 'View Highlights'}
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
