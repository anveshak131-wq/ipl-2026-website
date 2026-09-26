'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Trophy, Award, Zap, BarChart2, Users, Calendar, Award as TrophyIcon } from 'lucide-react';

interface PlayerDetailModernProps {
  player: {
    id: string;
    name: string;
    teamName: string;
    role: string;
    matches: number;
    runs: number;
    wickets: number;
    highestScore: string;
    battingAverage: number;
    bowlingAverage: number;
    strikeRate: number;
    economy: number;
    bestBowling: string;
    fifties: number;
    hundreds: number;
    fours: number;
    sixes: number;
    image?: string;
  };
  teamColor: string;
}

export default function PlayerDetailModern({ player, teamColor }: PlayerDetailModernProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Calculate player rating (example calculation)
  const playerRating = Math.min(5, 3.5 + 
    (player.runs / 1000) + 
    (player.wickets / 20) + 
    (player.fifties * 0.1) + 
    (player.hundreds * 0.2)
  ).toFixed(1);

  const stats = [
    { label: 'Matches', value: player.matches, icon: <Calendar className="w-4 h-4" /> },
    { label: 'Runs', value: player.runs, icon: <Zap className="w-4 h-4" /> },
    { label: 'Wickets', value: player.wickets, icon: <TrophyIcon className="w-4 h-4" /> },
    { label: 'Highest Score', value: player.highestScore, icon: <Award className="w-4 h-4" /> },
  ];

  const battingStats = [
    { label: 'Batting Avg', value: Number(player.battingAverage).toFixed(2) },
    { label: 'Strike Rate', value: Number(player.strikeRate).toFixed(2) },
    { label: '50s', value: player.fifties },
    { label: '100s', value: player.hundreds },
  ];

  const bowlingStats = [
    { label: 'Bowling Avg', value: player.bowlingAverage },
    { label: 'Economy', value: player.economy },
    { label: 'Best Bowling', value: player.bestBowling },
    { label: '4+ Wickets', value: Math.floor(player.wickets / 4) },
  ];

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 min-h-screen text-white">
      {/* Header with player image and basic info */}
      <div className="relative">
        <div 
          className="h-48 w-full bg-gradient-to-r from-slate-800 to-slate-700"
          style={{ 
            background: `linear-gradient(135deg, ${teamColor}33 0%, ${teamColor}99 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative -mt-16">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-slate-800 overflow-hidden">
                {player.image ? (
                  <Image
                    src={player.image}
                    alt={player.name}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-4xl font-bold">
                    {player.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full px-2 py-1 text-xs font-bold flex items-center">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {playerRating}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">{player.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 rounded-md text-xs font-medium" 
                      style={{ backgroundColor: `${teamColor}33`, color: teamColor }}>
                      {player.teamName}
                    </span>
                    <span className="px-2 py-1 bg-slate-700/50 rounded-md text-xs">
                      {player.role}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
                    Compare
                  </button>
                  <button 
                    className="px-4 py-2 rounded-lg transition-colors flex items-center"
                    style={{ backgroundColor: teamColor, color: 'white' }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Follow
                  </button>
                </div>
              </div>
              
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {stats.map((stat, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50"
                  >
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      {stat.icon}
                      {stat.label}
                    </div>
                    <div className="text-xl font-bold mt-1">{stat.value}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-8">
        <div className="border-b border-slate-700">
          <nav className="flex space-x-8">
            {['overview', 'batting', 'bowling', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? `border-${teamColor} text-white`
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'
                }`}
                style={activeTab === tab ? { borderColor: teamColor } : {}}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Performance</h3>
                <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                  <div className="h-48 flex items-center justify-center text-slate-500">
                    Performance Chart (Coming Soon)
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Key Stats</h3>
                <div className="space-y-4">
                  <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Batting</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {battingStats.map((stat, index) => (
                        <div key={index}>
                          <div className="text-xs text-slate-400">{stat.label}</div>
                          <div className="text-lg font-semibold">{stat.value || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Bowling</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {bowlingStats.map((stat, index) => (
                        <div key={index}>
                          <div className="text-xs text-slate-400">{stat.label}</div>
                          <div className="text-lg font-semibold">{stat.value || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'batting' && (
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-semibold mb-4">Batting Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Innings', value: Math.floor(player.matches * 0.9) },
                  { label: 'Runs', value: player.runs },
                  { label: 'Highest Score', value: player.highestScore },
                  { label: 'Average', value: player.battingAverage },
                  { label: 'Strike Rate', value: player.strikeRate },
                  { label: '50s', value: player.fifties },
                  { label: '100s', value: player.hundreds },
                  { label: '4s/6s', value: `${player.fours || 0}/${player.sixes || 0}` },
                ].map((stat, index) => (
                  <div key={index} className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-sm text-slate-400">{stat.label}</div>
                    <div className="text-xl font-bold mt-1">{stat.value || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bowling' && (
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-semibold mb-4">Bowling Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Innings', value: Math.floor(player.matches * 0.7) },
                  { label: 'Wickets', value: player.wickets },
                  { label: 'Best Bowling', value: player.bestBowling },
                  { label: 'Average', value: player.bowlingAverage },
                  { label: 'Economy', value: player.economy },
                  { label: 'Strike Rate', value: (player.bowlingAverage / player.economy * 6).toFixed(2) },
                  { label: '4+ Wickets', value: Math.floor(player.wickets / 4) },
                  { label: '5 Wickets', value: Math.floor(player.wickets / 5) },
                ].map((stat, index) => (
                  <div key={index} className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-sm text-slate-400">{stat.label}</div>
                    <div className="text-xl font-bold mt-1">{stat.value || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                  Career Highlights
                </h3>
                <ul className="space-y-3">
                  {player.hundreds > 0 && (
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 mr-3"></div>
                      <span>Scored {player.hundreds} century{player.hundreds > 1 ? 's' : ''} in IPL career</span>
                    </li>
                  )}
                  {player.wickets >= 10 && (
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 mr-3"></div>
                      <span>Over {player.wickets} wickets in IPL career</span>
                    </li>
                  )}
                  {player.runs > 1000 && (
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 mr-3"></div>
                      <span>Scored over {Math.floor(player.runs / 1000)}K runs in IPL</span>
                    </li>
                  )}
                  <li className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mr-3"></div>
                    <span>Player of the Match: {Math.floor(player.matches * 0.1)} times</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4">Season Performance</h3>
                <div className="h-48 flex items-center justify-center text-slate-500">
                  Season Performance Chart (Coming Soon)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
