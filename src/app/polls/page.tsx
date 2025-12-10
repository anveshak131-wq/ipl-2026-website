'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Trophy, Clock, CheckCircle, TrendingUp, Calendar, Star } from 'lucide-react';
import AuroraBackground from '@/components/ui/AuroraBackground';
import GradientText from '@/components/ui/GradientText';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { useLeague } from '@/contexts/LeagueContext';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface Poll {
  id: string;
  question: string;
  type: 'match-prediction' | 'player-performance' | 'fan-preference';
  category: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  endsAt: string;
  description?: string;
  hasVoted: boolean;
  userVote?: string;
}

export default function PollsPage() {
  const { currentLeague } = useLeague();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  useEffect(() => {
    // Load mock polls data
    setPolls([
      {
        id: '1',
        question: 'Who will win today\'s match between MI vs CSK?',
        type: 'match-prediction',
        category: 'match-prediction',
        options: [
          { id: '1', text: 'Mumbai Indians', votes: 342, percentage: 45 },
          { id: '2', text: 'Chennai Super Kings', votes: 289, percentage: 38 },
          { id: '3', text: 'It will be a tie', votes: 67, percentage: 9 },
          { id: '4', text: 'Match will be abandoned', votes: 62, percentage: 8 }
        ],
        totalVotes: 760,
        isActive: true,
        endsAt: '2024-12-10T20:00:00Z',
        description: 'Vote for your prediction of today\'s high-voltage clash',
        hasVoted: false
      },
      {
        id: '2',
        question: 'Who will be the top scorer in today\'s match?',
        type: 'player-performance',
        category: 'player-performance',
        options: [
          { id: '1', text: 'Rohit Sharma', votes: 189, percentage: 25 },
          { id: '2', text: 'Virat Kohli', votes: 267, percentage: 35 },
          { id: '3', text: 'MS Dhoni', votes: 156, percentage: 20 },
          { id: '4', text: 'Jasprit Bumrah', votes: 148, percentage: 20 }
        ],
        totalVotes: 760,
        isActive: true,
        endsAt: '2024-12-10T20:00:00Z',
        description: 'Predict who will score the most runs today',
        hasVoted: false
      },
      {
        id: '3',
        question: 'Which team has the best opening partnership?',
        type: 'fan-preference',
        category: 'fan-preference',
        options: [
          { id: '1', text: 'MI (Rohit & Ishan)', votes: 412, percentage: 34 },
          { id: '2', text: 'CSK (Ruturaj & Conway)', votes: 378, percentage: 31 },
          { id: '3', text: 'RCB (Virat & Faf)', votes: 267, percentage: 22 },
          { id: '4', text: 'KKR (Shubman & Rahmanullah)', votes: 163, percentage: 13 }
        ],
        totalVotes: 1220,
        isActive: true,
        endsAt: '2024-12-15T18:00:00Z',
        description: 'Vote for your favorite opening pair',
        hasVoted: false
      },
      {
        id: '4',
        question: 'Who will take the most wickets this season?',
        type: 'player-performance',
        category: 'player-performance',
        options: [
          { id: '1', text: 'Jasprit Bumrah', votes: 523, percentage: 28 },
          { id: '2', text: 'Rashid Khan', votes: 489, percentage: 26 },
          { id: '3', text: 'Mohammed Siraj', votes: 412, percentage: 22 },
          { id: '4', text: 'Yuzvendra Chahal', votes: 456, percentage: 24 }
        ],
        totalVotes: 1880,
        isActive: true,
        endsAt: '2024-12-20T18:00:00Z',
        description: 'Predict the Purple Cap winner',
        hasVoted: false
      },
      {
        id: '5',
        question: 'Which stadium has the best atmosphere?',
        type: 'fan-preference',
        category: 'fan-preference',
        options: [
          { id: '1', text: 'Eden Gardens, Kolkata', votes: 678, percentage: 32 },
          { id: '2', text: 'Wankhede, Mumbai', votes: 567, percentage: 27 },
          { id: '3', text: 'Chepauk, Chennai', votes: 445, percentage: 21 },
          { id: '4', text: 'Chinnaswamy, Bangalore', votes: 410, percentage: 20 }
        ],
        totalVotes: 2100,
        isActive: true,
        endsAt: '2024-12-18T18:00:00Z',
        description: 'Vote for the most electrifying venue',
        hasVoted: false
      }
    ]);
  }, []);

  const categories = [
    { id: 'all', label: 'All Polls', icon: BarChart3 },
    { id: 'match-prediction', label: 'Match Predictions', icon: Trophy },
    { id: 'player-performance', label: 'Player Performance', icon: Star },
    { id: 'fan-preference', label: 'Fan Preferences', icon: Users }
  ];

  const filteredPolls = selectedCategory === 'all' 
    ? polls 
    : polls.filter(poll => poll.category === selectedCategory);

  const handleVote = (pollId: string, optionId: string) => {
    setVotingPollId(pollId);
    
    // Simulate voting delay
    setTimeout(() => {
      setPolls(polls.map(poll => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map(option => {
            if (option.id === optionId) {
              return {
                ...option,
                votes: option.votes + 1,
                percentage: ((option.votes + 1) / (poll.totalVotes + 1)) * 100
              };
            }
            return {
              ...option,
              percentage: (option.votes / (poll.totalVotes + 1)) * 100
            };
          });
          
          return {
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + 1,
            hasVoted: true,
            userVote: optionId
          };
        }
        return poll;
      }));
      setVotingPollId(null);
    }, 500);
  };

  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt).getTime();
    const now = new Date().getTime();
    const distance = end - now;
    
    if (distance < 0) return 'Ended';
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'match-prediction': return Trophy;
      case 'player-performance': return Star;
      case 'fan-preference': return Users;
      default: return BarChart3;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <AuroraBackground />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AnimatedSection>
            <div className="text-center mb-8">
              <GradientText className="text-4xl md:text-5xl font-bold mb-4">
                Polls & Surveys
              </GradientText>
              <p className="text-gray-300 text-lg">
                Vote, predict, and share your cricket opinions with fans worldwide
              </p>
            </div>
          </AnimatedSection>

          {/* Category Filter */}
          <AnimatedSection>
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={18} />
                    {category.label}
                  </motion.button>
                );
              })}
            </div>
          </AnimatedSection>

          {/* Polls Grid */}
          <div className="grid gap-6">
            {filteredPolls.map((poll, index) => {
              const CategoryIcon = getCategoryIcon(poll.type);
              return (
                <AnimatedSection key={poll.id} delay={index * 0.1}>
                  <motion.div
                    className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Poll Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                          <CategoryIcon className="text-blue-400" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">{poll.question}</h3>
                          {poll.description && (
                            <p className="text-gray-300 text-sm">{poll.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-gray-300">{getTimeRemaining(poll.endsAt)}</span>
                      </div>
                    </div>

                    {/* Poll Options */}
                    <div className="space-y-3">
                      {poll.options.map((option) => (
                        <motion.div
                          key={option.id}
                          className="relative"
                          whileHover={{ scale: poll.hasVoted ? 1 : 1.02 }}
                        >
                          {!poll.hasVoted ? (
                            <motion.button
                              onClick={() => handleVote(poll.id, option.id)}
                              disabled={votingPollId === poll.id}
                              className={`w-full text-left p-4 rounded-lg border transition-all ${
                                votingPollId === poll.id
                                  ? 'bg-blue-600/20 border-blue-400'
                                  : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                              }`}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span className="text-white font-medium">{option.text}</span>
                            </motion.button>
                          ) : (
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg" 
                                style={{ width: `${option.percentage}%` }} />
                              <div className="relative p-4 rounded-lg border border-white/20">
                                <div className="flex justify-between items-center">
                                  <span className="text-white font-medium">{option.text}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-300 text-sm">
                                      {option.votes} votes
                                    </span>
                                    {poll.userVote === option.id && (
                                      <CheckCircle className="text-green-400" size={20} />
                                    )}
                                  </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-300">
                                  {option.percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Poll Footer */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          {poll.totalVotes} votes
                        </div>
                        {poll.hasVoted && (
                          <div className="flex items-center gap-1 text-green-400">
                            <CheckCircle size={16} />
                            You voted
                          </div>
                        )}
                      </div>
                      {poll.hasVoted && (
                        <div className="flex items-center gap-1 text-blue-400">
                          <TrendingUp size={16} />
                          <span className="text-sm">View Results</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredPolls.length === 0 && (
            <AnimatedSection>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-white mb-2">No polls found</h3>
                <p className="text-gray-300">Check back later for new polls and surveys</p>
              </div>
            </AnimatedSection>
          )}

          {/* Create Poll Section */}
          <AnimatedSection>
            <div className="mt-12 bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Want to create a poll?</h3>
                <p className="text-gray-300 mb-4">
                  Submit your poll ideas and engage with the cricket community
                </p>
                <motion.button
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Suggest a Poll
                </motion.button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
