'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import { calculateAge, formatDateDDMMYYYY } from '@/lib/dateUtils';

interface PlayerDetailClientProps {
  playerId: string;
}

function createColorVariations(hex: string) {
  const safe = /^#([0-9A-Fa-f]{6})$/.test(hex) ? hex : '#7C3AED';
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);

  const light = `rgba(${r}, ${g}, ${b}, 0.15)`;
  const medium = `rgba(${r}, ${g}, ${b}, 0.3)`;

  return {
    light,
    medium,
    solid: safe,
    glow: `rgba(${r}, ${g}, ${b}, 0.5)`,
    text: '#FFFFFF',
    textOnLight: '#FFFFFF',
  };
}

export default function PlayerDetailClient({ playerId }: PlayerDetailClientProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'batting' | 'bowling'>('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const players = await api.getPlayers();
        const found = players.find((p) => p.id === playerId);
        if (!found) {
          setPlayer(null);
          setIsLoading(false);
          return;
        }
        setPlayer(found);

        try {
          const teams = await api.getTeams();
          const t = teams.find((team) => team.id === found.teamId) || null;
          setTeam(t);
        } catch (e) {
          console.error('Failed to fetch team for player detail:', e);
        }
      } catch (e) {
        console.error('Failed to fetch player detail:', e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [playerId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-96 text-center px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Player not found</h1>
          <p className="text-gray-400 max-w-md mb-6">
            This player does not exist or has been removed. Try opening the player from the team page again.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  const teamColors = team?.colors || { primary: '#7C3AED', secondary: '#FACC15' };
  const primary = createColorVariations(teamColors.primary);
  const secondary = createColorVariations(teamColors.secondary);

  const stats = player.stats;
  const boundariesPerMatch = stats.matches > 0
    ? Math.round(((stats.fours + stats.sixes) / stats.matches) * 10) / 10
    : 0;
  const runsPerMatch = stats.matches > 0
    ? Math.round((stats.runs / stats.matches) * 10) / 10
    : 0;

  const bowlingAverage = (() => {
    if (stats.bowlingAverage != null) return stats.bowlingAverage;
    if (stats.wickets === 0) return 0;
    const estimatedOvers = stats.matches * 4;
    const runsConceded = stats.economy * estimatedOvers;
    return runsConceded / stats.wickets;
  })();

  const recentFormItems = [
    { label: 'Runs / Match', value: runsPerMatch.toFixed(1) },
    { label: 'Boundaries / Match', value: boundariesPerMatch.toFixed(1) },
    { label: 'Strike Rate', value: stats.strikeRate.toFixed(1) },
    { label: 'Economy', value: stats.economy.toFixed(1) },
    { label: 'Matches', value: stats.matches },
  ];

  const age = player.dateOfBirth ? calculateAge(player.dateOfBirth) : player.age;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div
      className="min-h-screen"
      style={{
        background: `radial-gradient(circle at top, ${primary.medium}, transparent 60%), radial-gradient(circle at bottom, ${secondary.medium}, transparent 60%), #020617`,
      }}
    >
      <Navbar />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Header */}
        <section className="mb-10 md:mb-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            {/* Avatar + core info */}
            <div className="flex items-center gap-6">
              <div
                className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${primary.solid}, ${secondary.solid})`,
                  boxShadow: `0 15px 45px ${primary.glow}`,
                }}
              >
                <span className="text-3xl md:text-4xl font-black text-white">
                  {getInitials(player.name)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2">
                  {player.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white font-semibold">
                    {player.role}
                  </span>
                  {team && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-black/30 text-gray-100">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primary.solid }} />
                      {team.shortName} · {team.name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-black/40 text-gray-100">
                    <span>{player.jerseyNumber > 0 ? `#${player.jerseyNumber}` : 'N/A'}</span>
                    <span className="text-xs uppercase tracking-wide">Jersey</span>
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-300">
                  <span>
                    Age: <span className="font-semibold text-white">{age} yrs</span>
                    {player.dateOfBirth && (
                      <span className="ml-1 text-gray-400">
                        ({formatDateDDMMYYYY(player.dateOfBirth)})
                      </span>
                    )}
                  </span>
                  <span>
                    Nationality: <span className="font-semibold text-white">{player.nationality}</span>
                  </span>
                  <span>
                    Batting: <span className="font-semibold text-white">{player.battingStyle}</span>
                  </span>
                  <span>
                    Bowling: <span className="font-semibold text-white">{player.bowlingStyle}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Summary numbers */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 text-center">
              <div className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Matches</p>
                <p className="text-2xl font-black text-white">{stats.matches}</p>
              </div>
              <div className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Runs</p>
                <p className="text-2xl font-black text-ipl-gold">{stats.runs}</p>
              </div>
              <div className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Wickets</p>
                <p className="text-2xl font-black text-emerald-400">{stats.wickets}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="mb-8">
          <div className="inline-flex gap-2 p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'batting', label: 'Batting stats' },
              { id: 'bowling', label: 'Bowling stats' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Content */}
        {activeTab === 'overview' && (
          <section className="space-y-8">
            {/* Recent form strip */}
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white mb-3">
                Recent form <span className="text-xs text-gray-400 font-normal">(season snapshot)</span>
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recentFormItems.map((item) => (
                  <div
                    key={item.label}
                    className="min-w-[140px] rounded-2xl bg-black/40 border border-white/10 px-4 py-3 flex flex-col justify-between"
                  >
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="text-xl font-black text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Role focus */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Highest Score</p>
                <p className="text-2xl font-black text-ipl-gold">{stats.highest}</p>
              </div>
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Batting Average</p>
                <p className="text-2xl font-black text-white">{stats.average.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Strike Rate</p>
                <p className="text-2xl font-black text-emerald-400">{stats.strikeRate.toFixed(1)}</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'batting' && (
          <section className="space-y-6">
            <h2 className="text-lg md:text-xl font-bold text-white">Batting statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[ 
                { label: 'Matches', value: stats.matches },
                { label: 'Innings runs', value: stats.runs },
                { label: 'Highest score', value: stats.highest },
                { label: 'Average', value: stats.average.toFixed(2) },
                { label: 'Strike rate', value: stats.strikeRate.toFixed(1) },
                { label: 'Fours (4s)', value: stats.fours },
                { label: 'Sixes (6s)', value: stats.sixes },
                { label: 'Fifties (50s)', value: stats.fifties },
                { label: 'Hundreds (100s)', value: stats.hundreds },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-black/40 border border-white/10 p-4">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="text-xl font-black text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'bowling' && (
          <section className="space-y-6">
            <h2 className="text-lg md:text-xl font-bold text-white">Bowling statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[ 
                { label: 'Matches', value: stats.matches },
                { label: 'Wickets', value: stats.wickets },
                { label: 'Economy', value: stats.economy.toFixed(2) },
                { label: 'Bowling average', value: bowlingAverage ? bowlingAverage.toFixed(2) : '-' },
                { label: 'Best bowling', value: stats.bestBowling || '-' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-black/40 border border-white/10 p-4">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="text-xl font-black text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
