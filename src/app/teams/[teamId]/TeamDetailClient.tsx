'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WPLPlayerModal from '@/components/teams/WPLPlayerModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CustomEmoji from '@/components/emoji/CustomEmoji';
import UpcomingFixturesWidget from '@/components/teams/UpcomingFixturesWidget';
import RecentResultsTimeline from '@/components/teams/RecentResultsTimeline';
import { Trophy, Users, MapPin, Crown, Globe } from 'lucide-react';
import { Team, Player, Match } from '@/types';
import Image from 'next/image';

interface TeamDetailClientProps {
  teamId: string;
  league?: 'ipl' | 'wpl';
}

export default function TeamDetailClient({ teamId, league = 'wpl' }: TeamDetailClientProps) {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [scorecardModalOpen, setScorecardModalOpen] = useState(false);
  const [scorecardData, setScorecardData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch team data
        const teamRes = await fetch(`/api/teams?league=${league}&id=${teamId}`);
        const teamData = await teamRes.json();
        setTeam(teamData);

        // Fetch players
        const playersRes = await fetch(`/api/players?league=${league}&teamId=${teamId}`);
        const playersData = await playersRes.json();
        setPlayers(playersData);

        // Fetch matches
        const matchesRes = await fetch(`/api/matches?league=${league}`);
        const matchesData = await matchesRes.json();
        const teamMatches = matchesData.filter((m: Match) => 
          m.team1?.id?.toString() === teamId?.toString() || m.team2?.id?.toString() === teamId?.toString()
        );
        setMatches(teamMatches);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId, league]);

  const fetchScorecard = async (matchId: string) => {
    try {
      const res = await fetch(`/api/scorecards?matchId=${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setScorecardData(data);
        setScorecardModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching scorecard:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-white">Team not found</p>
      </div>
    );
  }

  const stats = team.stats || {};
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const completedMatches = matches.filter(m => m.status === 'completed').slice(0, 5);
  
  const roleGroups = {
    batsman: players.filter(p => p.role?.toLowerCase().includes('bat')),
    bowler: players.filter(p => p.role?.toLowerCase() === 'bowler'),
    allrounder: players.filter(p => p.role?.toLowerCase().includes('all')),
    wicketkeeper: players.filter(p => p.role?.toLowerCase().includes('keeper'))
  };

  const foreignPlayers = players.filter(p => p.isOverseas || p.nationality !== 'India').length;
  const captain = players.find(p => p.isCaptain);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      {/* Hero Section - Simplified & Elegant */}
      <section className="relative overflow-hidden pt-24 pb-16">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at top right, ${team.colors?.primary || '#6366f1'}, transparent 50%)`
          }}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row items-center gap-12"
          >
            {/* Team Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0"
            >
              <div 
                className="relative w-48 h-48 rounded-3xl p-8 backdrop-blur-xl border border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${team.colors?.primary}15, ${team.colors?.secondary}15)`
                }}
              >
                {team.logo && (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                )}
              </div>
            </motion.div>

            {/* Team Info */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4">
                  {team.name}
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl">
                  {team.description}
                </p>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">{team.homeGrounds?.[0]}</span>
                  </div>
                  {captain && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Crown className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm">Captain: {captain.name}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 gap-4"
            >
              <StatCard label="Matches" value={stats.matchesPlayed || 0} />
              <StatCard label="Wins" value={stats.wins || 0} />
              <StatCard label="Points" value={stats.points || 0} />
              <StatCard label="NRR" value={stats.netRunRate?.toFixed(3) || '0.000'} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Team Overview Grid */}
      <section className="py-12 bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <OverviewCard
              icon={<Users className="w-6 h-6" />}
              label="Squad Size"
              value={players.length}
              color={team.colors?.primary}
            />
            <OverviewCard
              icon={<Crown className="w-6 h-6" />}
              label="Captains"
              value={players.filter(p => p.isCaptain).length}
              color={team.colors?.primary}
            />
            <OverviewCard
              icon={<Globe className="w-6 h-6" />}
              label="Foreign"
              value={foreignPlayers}
              color={team.colors?.primary}
            />
            <OverviewCard
              icon={<Trophy className="w-6 h-6" />}
              label="Trophies"
              value={team.trophies?.length || 0}
              color={team.colors?.primary}
            />
          </motion.div>
        </div>
      </section>

      {/* Trophies Section */}
      {team.trophies && team.trophies.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <CustomEmoji type="trophy" size={32} />
                Trophy Cabinet
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {team.trophies.map((trophy, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{trophy.title}</h3>
                        <p className="text-yellow-400 font-semibold">{trophy.year}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Recent Results & Upcoming Matches */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Results */}
            {completedMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  <CustomEmoji type="fire" size={32} />
                  Recent Matches
                </h2>
                <RecentResultsTimeline team={team} matches={completedMatches} />
              </motion.div>
            )}

            {/* Upcoming Fixtures */}
            {upcomingMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  <CustomEmoji type="calendar" size={32} />
                  Upcoming Fixtures
                </h2>
                <UpcomingFixturesWidget
                  team={team}
                  matches={upcomingMatches}
                  onViewScorecard={fetchScorecard}
                />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Squad Section - Simplified */}
      <section className="py-12 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <CustomEmoji type="cricket-bat" size={32} />
              Squad
            </h2>

            {/* Players by Role */}
            <div className="space-y-8">
              {Object.entries(roleGroups).map(([role, rolePlayers]) => {
                if (rolePlayers.length === 0) return null;
                
                return (
                  <div key={role}>
                    <h3 className="text-xl font-semibold text-white mb-4 capitalize flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ background: team.colors?.primary }}
                      />
                      {role}s ({rolePlayers.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {rolePlayers.map((player, idx) => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          teamColor={team.colors?.primary}
                          onClick={() => setSelectedPlayer(player)}
                          delay={idx * 0.05}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Player Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <WPLPlayerModal
            player={selectedPlayer}
            teamColor={team.colors?.primary}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </AnimatePresence>

      {/* Scorecard Modal */}
      <AnimatePresence>
        {scorecardModalOpen && scorecardData && (
          <ScorecardModal
            scorecard={scorecardData}
            onClose={() => {
              setScorecardModalOpen(false);
              setScorecardData(null);
            }}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

// Helper Components

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors duration-300">
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function OverviewCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${color}20` }}
      >
        <div style={{ color: color || '#fff' }}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </motion.div>
  );
}

function PlayerCard({ player, teamColor, onClick, delay }: { player: Player; teamColor?: string; onClick: () => void; delay: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      onClick={onClick}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 text-left group"
    >
      {/* Captain Badge */}
      {player.isCaptain && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Crown className="w-4 h-4 text-yellow-400" />
          </div>
        </div>
      )}
      
      {/* Player Info */}
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
          style={{ background: `${teamColor}30` }}
        >
          {player.jerseyNumber || player.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
            {player.name}
          </h4>
          <p className="text-xs text-gray-400 capitalize">{player.role}</p>
        </div>
      </div>

      {/* Overseas Badge */}
      {(player.isOverseas || player.nationality !== 'India') && (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <Globe className="w-3 h-3 text-blue-400" />
          <span className="text-xs text-blue-400">Overseas</span>
        </div>
      )}
    </motion.button>
  );
}

function ScorecardModal({ scorecard, onClose }: { scorecard: any; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-3xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Match Scorecard</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <span className="text-white text-xl">×</span>
            </button>
          </div>
          
          {/* Scorecard content would go here */}
          <div className="text-white">
            <p className="text-gray-400">Scorecard details coming soon...</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
