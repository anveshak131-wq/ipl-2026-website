'use client';

import { Match } from '@/types';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
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
        return '🔴 LIVE';
      case 'completed':
        return '✅ Completed';
      default:
        return '📅 Upcoming';
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-ipl-gold/50 transition-all duration-300 hover:shadow-2xl hover:shadow-ipl-gold/20 transform hover:scale-105">
      {/* Animated background on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold/10 to-ipl-purple/10" />
      </div>

      {/* Content */}
      <div className="relative p-6 md:p-8 space-y-4">
        {/* Status Badge */}
        <div className="flex justify-start">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(match.status)}`}>
            {getStatusText(match.status)}
          </span>
        </div>

        {/* Date and Time */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white font-bold text-base">
              📅 {formatDate(match.date)}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              🕐 {match.time} IST
            </p>
          </div>
        </div>

        {/* Teams */}
        <div className="space-y-4">
          {/* Team 1 */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ipl-purple to-ipl-gold flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">
                {match.team1.shortName}
              </span>
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ipl-purple to-ipl-gold flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">
                {match.team2.shortName}
              </span>
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

        {/* Action Button */}
        <button onClick={() => alert(`${match.status === 'upcoming' ? 'Reminder set!' : match.status === 'live' ? 'Opening stream...' : 'Loading highlights...'}`)} className="w-full bg-gradient-to-r from-ipl-purple to-ipl-gold hover:from-ipl-gold hover:to-ipl-purple text-white font-bold text-sm py-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 mt-4 cursor-pointer">
          {match.status === 'upcoming' && 'Set Reminder'}
          {match.status === 'live' && 'Watch Live'}
          {match.status === 'completed' && 'View Highlights'}
        </button>
      </div>
    </div>
  );
}
