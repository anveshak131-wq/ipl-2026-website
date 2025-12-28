'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/data';
import type { Poll } from '@/types';
import { MessageSquare, CheckCircle, BarChart3 } from 'lucide-react';

interface PollCardProps {
  poll: Poll;
  matchId: string;
  onVote: () => void;
}

export default function PollCard({ poll, matchId, onVote }: PollCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleVote = async () => {
    if (!selectedOption || voting) return;

    setError(null);
    setVoting(true);

    try {
      await api.voteOnPoll(matchId, poll.id, selectedOption);
      setHasVoted(true);
      onVote(); // Refresh poll data
    } catch (error: any) {
      setError(error.message || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  if (!poll.isActive) {
    return null;
  }

  return (
    <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
      <div className="flex items-start gap-3 mb-4">
        <MessageSquare className="w-6 h-6 text-ipl-gold flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{poll.question}</h3>
          {totalVotes > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <BarChart3 className="w-4 h-4" />
              <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isSelected = selectedOption === option.id;

          return (
            <div key={option.id}>
              <motion.button
                type="button"
                onClick={() => !hasVoted && setSelectedOption(option.id)}
                disabled={hasVoted}
                whileHover={!hasVoted ? { scale: 1.02 } : {}}
                whileTap={!hasVoted ? { scale: 0.98 } : {}}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  isSelected && !hasVoted
                    ? 'border-ipl-gold bg-ipl-gold/20'
                    : hasVoted
                    ? 'border-gray-700 bg-gray-800/30 cursor-not-allowed'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{option.text}</span>
                  {hasVoted && (
                    <span className="text-sm text-gray-400">{percentage.toFixed(1)}%</span>
                  )}
                </div>
                {hasVoted && totalVotes > 0 && (
                  <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-ipl-gold to-ipl-purple"
                    />
                  </div>
                )}
              </motion.button>
            </div>
          );
        })}
      </div>

      {!hasVoted && selectedOption && (
        <motion.button
          onClick={handleVote}
          disabled={voting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            voting
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-ipl-gold to-ipl-purple text-white hover:from-ipl-gold/90 hover:to-ipl-purple/90'
          }`}
        >
          {voting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Voting...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Vote</span>
            </>
          )}
        </motion.button>
      )}

      {hasVoted && (
        <div className="flex items-center gap-2 text-sm text-ipl-gold">
          <CheckCircle className="w-4 h-4" />
          <span>You have voted on this poll</span>
        </div>
      )}
    </div>
  );
}

