'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import type { Match } from '@/types';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface MatchSelectorProps {
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string | null) => void;
}

export default function MatchSelector({ selectedMatchId, onSelectMatch }: MatchSelectorProps) {
  const { currentLeague } = useLeague();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const allMatches = await api.getMatches(currentLeague);
        // Filter for upcoming matches only
        const upcoming = allMatches.filter((m: Match) => {
          if (m.status !== 'upcoming') return false;
          const matchDateTime = new Date(`${m.date}T${m.time}`);
          return matchDateTime > new Date();
        });
        // Sort by date
        upcoming.sort((a: Match, b: Match) => {
          const dateA = new Date(`${a.date}T${a.time}`).getTime();
          const dateB = new Date(`${b.date}T${b.time}`).getTime();
          return dateA - dateB;
        });
        setMatches(upcoming);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [currentLeague]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ipl-gold"></div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No upcoming matches available for predictions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4">Select a Match</h3>
      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {matches.map((match) => {
          const isSelected = selectedMatchId === match.id;
          const matchDateTime = new Date(`${match.date}T${match.time}`);
          const formattedDate = matchDateTime.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          const formattedTime = matchDateTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });

          return (
            <motion.button
              key={match.id}
              onClick={() => onSelectMatch(match.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-ipl-gold bg-ipl-gold/10 shadow-lg shadow-ipl-gold/20'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={match.team1.logo}
                      alt={match.team1.shortName}
                      className="w-8 h-8 object-contain"
                    />
                    <span className="font-semibold text-white">{match.team1.shortName}</span>
                  </div>
                  <span className="text-gray-400">vs</span>
                  <div className="flex items-center gap-2">
                    <img
                      src={match.team2.logo}
                      alt={match.team2.shortName}
                      className="w-8 h-8 object-contain"
                    />
                    <span className="font-semibold text-white">{match.team2.shortName}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formattedTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{match.venue}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

