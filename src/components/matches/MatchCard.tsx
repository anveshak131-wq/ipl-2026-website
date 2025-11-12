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
    <div className="ipl-card hover:scale-105 transform transition-all duration-300">
      <div className="text-center space-y-4">
        {/* Status Badge */}
        <div className="flex justify-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(match.status)}`}>
            {getStatusText(match.status)}
          </span>
        </div>

        {/* Date and Time */}
        <div>
          <p className="text-white font-semibold text-lg">
            {formatDate(match.date)}
          </p>
          <p className="text-gray-300">
            {match.time} IST
          </p>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-r from-ipl-purple to-ipl-gold rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {match.team1.shortName}
              </span>
            </div>
            <p className="text-white font-medium">
              {match.team1.shortName}
            </p>
            <p className="text-gray-400 text-sm">
              {match.team1.name}
            </p>
            {match.score && (
              <div className="mt-2 text-white font-semibold">
                {match.score.team1.runs}/{match.score.team1.wickets}
                <span className="text-gray-400 text-sm ml-1">
                  ({match.score.team1.overs} ov)
                </span>
              </div>
            )}
          </div>
          
          <div className="px-6">
            <span className="text-gray-400 font-bold text-2xl">VS</span>
          </div>
          
          <div className="flex-1 text-center">
            <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-r from-ipl-purple to-ipl-gold rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {match.team2.shortName}
              </span>
            </div>
            <p className="text-white font-medium">
              {match.team2.shortName}
            </p>
            <p className="text-gray-400 text-sm">
              {match.team2.name}
            </p>
            {match.score && (
              <div className="mt-2 text-white font-semibold">
                {match.score.team2.runs}/{match.score.team2.wickets}
                <span className="text-gray-400 text-sm ml-1">
                  ({match.score.team2.overs} ov)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Venue */}
        <div className="text-sm text-gray-300 flex items-center justify-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {match.venue}
        </div>

        {/* Result */}
        {match.result && (
          <div className="text-sm text-ipl-gold font-medium">
            {match.result}
          </div>
        )}

        {/* Action Button */}
        <button className="w-full ipl-button text-sm py-3">
          {match.status === 'upcoming' && 'Set Reminder'}
          {match.status === 'live' && 'Watch Live'}
          {match.status === 'completed' && 'View Highlights'}
        </button>
      </div>
    </div>
  );
}
