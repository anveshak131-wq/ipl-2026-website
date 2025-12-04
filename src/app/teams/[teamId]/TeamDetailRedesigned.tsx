'use client';

import { useState, useEffect, useRef } from 'react';
import SmartDescription from '@/components/teams/SmartDescription';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PlayerModal from '@/components/teams/PlayerModal';
import WPLPlayerCard from '@/components/teams/WPLPlayerCard';
import WPLPlayerModal from '@/components/teams/WPLPlayerModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Team, Player, Trophy } from '@/types';
import { StatsCardProps, PlayerCard3DProps } from '@/types/components';
import { sortPlayersByRoleAndAge } from '@/lib/playerSort';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { getAnimatedLogoPath } from '@/lib/logoUtils';
import CustomEmoji from '@/components/emoji/CustomEmoji';
import { api } from '@/lib/data';

interface TeamDetailRedesignedProps {
  teamId: string;
}

// Custom RCB Logo Component (SVG - No Copyright)
function CustomRCBLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield Background */}
      <path d="M100 10 L170 40 L170 120 C170 160 140 185 100 190 C60 185 30 160 30 120 L30 40 Z" 
            fill="url(#shield-gradient)" stroke="#DAA520" strokeWidth="3"/>
      
      {/* Lion Head Silhouette */}
      <circle cx="100" cy="85" r="35" fill="#000" opacity="0.3"/>
      <path d="M100 60 C85 60 75 70 75 85 C75 95 80 102 85 105 L85 120 C85 125 92 128 100 128 C108 128 115 125 115 120 L115 105 C120 102 125 95 125 85 C125 70 115 60 100 60 Z" 
            fill="#FFD700"/>
      
      {/* Crown */}
      <path d="M70 50 L75 60 L85 55 L90 65 L100 58 L110 65 L115 55 L125 60 L130 50 L100 45 Z" 
            fill="#DAA520"/>
      
      {/* Letters RCB */}
      <text x="100" y="160" fontSize="28" fontWeight="bold" fill="#EC1C24" textAnchor="middle" fontFamily="Arial Black">RCB</text>
      
      <defs>
        <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EC1C24"/>
          <stop offset="50%" stopColor="#8B0000"/>
          <stop offset="100%" stopColor="#000000"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Floating Particles Component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 2 === 0 ? '#EC1C24' : '#DAA520',
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
            opacity: 0.3 + Math.random() * 0.5
          }}
        />
      ))}
    </div>
  );
}

// Stats Card Component
function StatsCard({ icon, value, label, delay }: StatsCardProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && count < value) {
      const timer = setTimeout(() => {
        setCount(prev => Math.min(prev + Math.ceil(value / 50), value));
      }, 30);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [count, value, isVisible]);

  return (
    <div
      ref={cardRef}
      className="group relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl border border-white/10 hover:border-red-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
      style={{
        background: 'linear-gradient(135deg, rgba(236,28,36,0.1), rgba(218,165,32,0.1))',
        animationDelay: `${delay}ms`
      }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/5 to-gold-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Icon */}
      <div className="relative mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
        {icon}
      </div>
      
      {/* Value with counter animation */}
      <div className="relative text-6xl font-black mb-2 bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
        {count}
      </div>
      
      {/* Label */}
      <div className="relative text-sm font-bold uppercase tracking-wider text-white">
        {label}
      </div>

      {/* Hover shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </div>
    </div>
  );
}

// Enhanced Player Card with 3D Effect
function PlayerCard3D({ player, onClick, index }: PlayerCard3DProps) {
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    setTiltX(rotateX);
    setTiltY(rotateY);
  };

  const handleMouseLeave = () => {
    setTiltX(0);
    setTiltY(0);
  };

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative cursor-pointer animate-fade-in"
      style={{
        animationDelay: `${index * 50}ms`,
        perspective: '1000px'
      }}
    >
      <div
        className="relative overflow-hidden rounded-3xl backdrop-blur-xl p-6 border border-white/10 transition-all duration-300 hover:border-red-500/50"
        style={{
          background: 'linear-gradient(135deg, rgba(236,28,36,0.15), rgba(218,165,32,0.1))',
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(20px)`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(236,28,36,0.2)'
        }}
      >
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 animate-spin-slow blur-sm" style={{ padding: '2px' }} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Jersey Number */}
          <div className="absolute top-2 right-2 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"
               style={{
                 background: 'linear-gradient(135deg, rgba(236,28,36,0.8), rgba(218,165,32,0.8))',
                 boxShadow: '0 4px 20px rgba(236,28,36,0.5)',
                 color: '#FFFFFF'
               }}>
            <span>{player.jerseyNumber > 0 ? player.jerseyNumber : 'N/A'}</span>
          </div>

          {/* Player Avatar Placeholder (Circle with Initials) */}
          <div className="mb-4 w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-black transform group-hover:scale-110 transition-transform duration-300"
               style={{
                 background: 'linear-gradient(135deg, #EC1C24, #DAA520)',
                 boxShadow: '0 10px 40px rgba(236,28,36,0.4)',
                 color: '#FFFFFF'
               }}>
            <span>{player.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
          </div>

          {/* Player Name */}
          <h3 className="text-xl font-bold mb-2 text-center transition-colors text-white">
            {player.name}
          </h3>
          
          {/* Role */}
          <p className="text-sm font-semibold mb-4 text-center text-white">{player.role}</p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {player.isCaptain && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                👑 Captain
              </span>
            )}
            {player.nationality !== 'India' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <CustomEmoji type="globe" size={16} /> Foreign
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#EC1C24' }}>{player.stats.matches}</p>
              <p className="text-xs uppercase mt-1 text-white">Matches</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#DAA520' }}>{player.stats.runs}</p>
              <p className="text-xs uppercase mt-1 text-white">Runs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#EC1C24' }}>{player.stats.wickets}</p>
              <p className="text-xs uppercase mt-1 text-white">Wickets</p>
            </div>
          </div>

          {/* View Profile Arrow */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold transition-colors text-white">
            <span>View Profile</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamDetailRedesigned({ teamId }: TeamDetailRedesignedProps) {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'squad' | 'stats' | 'achievements'>('squad');
  const [scrollY, setScrollY] = useState(0);
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const numericId = teamId.replace('team', '');
        
        // Use api helper for better error handling
        const allTeams = await api.getTeams();
        const team = allTeams.find((t: Team) => {
          const tId = String(t.id || '').replace(/^team/, '');
          return tId === numericId || String(t.id) === teamId || String(t.id) === numericId;
        });
        
        console.log('TeamDetailRedesigned: Found team:', team?.id, team?.name);
        
        if (team) {
          // Determine league from team data or default to 'ipl'
          const teamLeague = (team.league || 'ipl') as 'ipl' | 'wpl';
          console.log('TeamDetailRedesigned: Team league:', teamLeague);
          
          // Fetch players using api helper with league filter
          const allPlayers = await api.getPlayers(undefined, teamLeague);
          console.log('TeamDetailRedesigned: Fetched players for league', teamLeague, ':', allPlayers.length);
          console.log('TeamDetailRedesigned: Team ID:', team.id, 'Type:', typeof team.id);
          
          if (allPlayers.length > 0) {
            console.log('TeamDetailRedesigned: Sample player teamIds:', allPlayers.slice(0, 5).map(p => ({ name: p.name, teamId: p.teamId, teamIdType: typeof p.teamId })));
          }
          
          // Match players by teamId - handle both "1" and "team1" formats
          const teamPlayers = allPlayers.filter((p: Player) => {
            const playerTeamId = String(p.teamId || '').replace(/^team/, '');
            const teamIdStr = String(team.id || '').replace(/^team/, '');
            const matches = playerTeamId === teamIdStr || 
                           playerTeamId === `team${teamIdStr}` || 
                           teamIdStr === `team${playerTeamId}` ||
                           String(p.teamId) === String(team.id);
            
            if (matches) {
              console.log('TeamDetailRedesigned: Matched player:', p.name, 'teamId:', p.teamId, 'to team:', team.id);
            }
            return matches;
          });
          
          console.log('TeamDetailRedesigned: Matched players for team:', teamPlayers.length);
          
          const teamWithPlayers = {
            ...team,
            players: sortPlayersByRoleAndAge(teamPlayers)
          };
          setTeamData(teamWithPlayers);
        } else {
          console.error('TeamDetailRedesigned: Team not found for ID:', teamId, 'numericId:', numericId);
          setTeamData(null);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  // Check if team is WPL
  const isWPL = teamData?.league === 'wpl';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-white mb-4">Team Not Found</h1>
          <button onClick={() => router.push('/teams')} className="px-6 py-2 bg-gradient-to-r from-red-600 to-yellow-600 text-white rounded-lg">
            Back to Teams
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const filteredPlayers = filterRole === 'all' 
    ? teamData.players || [] 
    : (teamData.players || []).filter(p => p.role.toLowerCase().includes(filterRole.toLowerCase()));

  // Group players by role in the exact desired order and skip empty groups when rendering
  const batsmen = filteredPlayers.filter(p => p.role === 'Batsman');
  const wicketkeepers = filteredPlayers.filter(p => p.role === 'Wicket-keeper');
  const allRounders = filteredPlayers.filter(p => p.role === 'All-rounder');
  const bowlers = filteredPlayers.filter(p => p.role === 'Bowler');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <Navbar />
      
      <main className="relative overflow-hidden">
        {/* SECTION 1: CINEMATIC HERO */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            {/* Dark gradient base */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-red-950/20 to-gray-900" />
            
            {/* Animated orbs */}
            <div 
              className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-20 animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(236,28,36,0.4), transparent)',
                top: `${-20 + scrollY * 0.05}%`,
                right: `${-10 + scrollY * 0.03}%`,
                animationDuration: '4s'
              }}
            />
            <div 
              className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-15 animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(218,165,32,0.4), transparent)',
                bottom: `${-15 + scrollY * 0.04}%`,
                left: `${-5 + scrollY * 0.02}%`,
                animationDuration: '6s'
              }}
            />

            {/* Floating particles */}
            <FloatingParticles />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
            <div className="text-center space-y-12 animate-fade-in">
              {/* 3D Logo */}
              <div className="relative inline-block">
                <div className="absolute inset-0 blur-3xl opacity-50 bg-gradient-to-r from-red-500 to-yellow-500 animate-pulse" />
                <div className="relative w-64 h-64 mx-auto transform hover:scale-110 hover:rotate-6 transition-all duration-500 animate-float">
                  {teamData?.id === '1' ? (
                    <RCBLionLogo className="w-full h-full" />
                  ) : (
                    <RCBLottie className="w-full h-full" />
                  )}
                </div>
              </div>

              {/* Tagline with Neon Effect */}
              <div className="space-y-4">
                <h2 className="text-2xl md:text-4xl font-bold text-yellow-500 uppercase tracking-widest animate-pulse flex items-center justify-center gap-3"
                    style={{
                      textShadow: '0 0 10px rgba(218,165,32,0.8), 0 0 20px rgba(218,165,32,0.6), 0 0 40px rgba(218,165,32,0.4)'
                    }}>
                  <CustomEmoji type="lightning" size={32} /> Play Bold <CustomEmoji type="lightning" size={32} />
                </h2>
                
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-none tracking-tighter"
                    style={{
                      textShadow: '0 0 60px rgba(236,28,36,0.8), 0 4px 20px rgba(0,0,0,0.8)'
                    }}>
                  <span className="bg-gradient-to-r from-red-500 via-red-600 to-yellow-500 bg-clip-text text-transparent">
                    ROYAL CHALLENGERS
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-yellow-500 via-red-600 to-red-500 bg-clip-text text-transparent">
                    BANGALORE
                  </span>
                </h1>

                {/* Decorative line */}
                <div className="flex items-center justify-center gap-4">
                  <div className="h-1 w-32 rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <div className="h-1 w-32 rounded-full bg-gradient-to-r from-transparent via-yellow-500 to-transparent animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>

                {/* Description: admin-provided plus AI enrichment (SmartDescription component) */}
                <div className="max-w-3xl mx-auto w-full">
                  <SmartDescription text={teamData.description} teamName={teamData.name} primaryColor={teamData.colors?.primary || '#EC1C24'} />
                </div>

              {/* Scroll Indicator */}
              <div className="pt-12 animate-bounce">
                <svg className="w-8 h-8 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: DYNAMIC STATS DASHBOARD */}
        <section className="relative z-20 -mt-32 mb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatsCard
                icon={<CustomEmoji type="cricket" size={48} />}
                value={teamData.players?.length || 0}
                label="Squad Size"
                delay={0}
              />
              <StatsCard
                icon={<CustomEmoji type="crown" size={48} />}
                value={teamData.players?.filter(p => p.isCaptain).length || 0}
                label="Captain"
                delay={100}
              />
              <StatsCard
                icon={<CustomEmoji type="globe" size={48} />}
                value={teamData.players?.filter(p => p.nationality !== 'India').length || 0}
                label="Foreign Players"
                delay={200}
              />
              <StatsCard
                icon={<CustomEmoji type="trophy" size={48} />}
                value={0}
                label="IPL Titles"
                delay={300}
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: TAB NAVIGATION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex justify-center">
            <div className="relative inline-flex gap-3 p-2 rounded-3xl backdrop-blur-xl border border-white/10"
                 style={{ background: 'linear-gradient(135deg, rgba(236,28,36,0.1), rgba(218,165,32,0.1))' }}>
              {[
                { id: 'squad', label: 'Squad', iconType: 'people' },
                { id: 'stats', label: 'Statistics', iconType: 'chart' },
                { id: 'achievements', label: 'Legacy', iconType: 'trophy' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id 
                      ? 'scale-105 shadow-lg shadow-red-500/50' 
                      : 'hover:bg-white/5'
                  }`}
                  style={activeTab === tab.id ? {
                    background: 'linear-gradient(135deg, #EC1C24, #DAA520)',
                    color: '#FFFFFF'
                  } : { 
                    color: '#FFFFFF'
                  }}
                >
                  <CustomEmoji type={tab.iconType as any} size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: CONTENT AREA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {activeTab === 'squad' && (
            <div className="space-y-12">
              {/* Filter Bar */}
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { id: 'all', label: 'All Players', iconType: 'people' },
                  { id: 'batsman', label: 'Batsmen', iconType: 'cricket' },
                  { id: 'bowler', label: 'Bowlers', iconType: 'lightning' },
                  { id: 'all-rounder', label: 'All-Rounders', iconType: 'target' },
                  { id: 'wicket-keeper', label: 'Keepers', iconType: 'glove' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setFilterRole(filter.id)}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                      filterRole === filter.id
                        ? 'scale-105 shadow-lg shadow-red-500/50'
                        : 'hover:bg-white/5 border border-white/10'
                    }`}
                    style={filterRole === filter.id ? {
                      background: 'linear-gradient(135deg, #EC1C24, #DAA520)',
                      color: '#FFFFFF'
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      color: '#FFFFFF'
                    }}
                  >
                    <CustomEmoji type={filter.iconType as any} size={18} />
                    <span>{filter.label}</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-black/30 text-xs">
                      {filter.id === 'all' 
                        ? teamData.players?.length || 0
                        : (teamData.players || []).filter(p => p.role.toLowerCase().includes(filter.id)).length
                      }
                    </span>
                  </button>
                ))}
              </div>

              {/* Player Cards Sections in fixed order: Batters, Wicket-keepers, All-rounders, Bowlers */}
              <div className="space-y-12">
                {[
                  { title: 'Batters', players: batsmen, iconType: 'cricket' },
                  { title: 'Wicket-keepers', players: wicketkeepers, iconType: 'glove' },
                  { title: 'All-rounders', players: allRounders, iconType: 'target' },
                  { title: 'Bowlers', players: bowlers, iconType: 'lightning' }
                ].map((section, sIdx) => (
                  section.players.length > 0 && (
                    <div key={sIdx} className="animate-fade-in" style={{ animationDelay: `${sIdx * 80}ms` }}>
                      <h3 className="text-3xl font-black mb-6 flex items-center gap-4 text-white">
                        <CustomEmoji type={section.iconType as any} size={32} />
                        {section.title}
                        <span className="text-lg font-normal text-white/70">({section.players.length})</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {section.players.map((player, index) => (
                          isWPL ? (
                            <WPLPlayerCard
                              key={player.id}
                              player={player}
                              index={index}
                              onClick={() => {
                                setSelectedPlayer(player);
                                setIsModalOpen(true);
                              }}
                            />
                          ) : (
                          <PlayerCard3D
                            key={player.id}
                            player={player}
                            index={index}
                            onClick={() => {
                              setSelectedPlayer(player);
                              setIsModalOpen(true);
                            }}
                          />
                          )
                        ))}
                      </div>
                    </div>
                  )
                ))}

                {filteredPlayers.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-2xl font-bold text-white">No players found in this category</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              {/* Squad Composition */}
              <div className="rounded-3xl backdrop-blur-xl p-8 border border-white/10"
                   style={{ background: 'linear-gradient(135deg, rgba(236,28,36,0.1), rgba(218,165,32,0.1))' }}>
                <h3 className="text-3xl font-black mb-6 flex items-center gap-3 text-white">
                  <CustomEmoji type="chart" size={32} />
                  Squad Breakdown
                </h3>
                <div className="space-y-4">
                  {[
                    { role: 'Batsman', count: (teamData.players || []).filter(p => p.role === 'Batsman').length, color: '#EC1C24', iconType: 'cricket' },
                    { role: 'Bowler', count: (teamData.players || []).filter(p => p.role === 'Bowler').length, color: '#DAA520', iconType: 'lightning' },
                    { role: 'All-rounder', count: (teamData.players || []).filter(p => p.role === 'All-rounder').length, color: '#EC1C24', iconType: 'target' },
                    { role: 'Wicket-keeper', count: (teamData.players || []).filter(p => p.role === 'Wicket-keeper').length, color: '#DAA520', iconType: 'glove' }
                  ].map((item, i) => (
                    <div key={i} className="group flex justify-between items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                      <span className="font-semibold flex items-center gap-3 text-white">
                        <CustomEmoji type={item.iconType as any} size={24} />
                        {item.role}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-black/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 group-hover:animate-pulse"
                            style={{ 
                              width: `${(item.count / (teamData.players?.length || 1)) * 100}%`,
                              background: `linear-gradient(to right, ${item.color}, ${item.color}dd)`
                            }}
                          />
                        </div>
                        <span className="text-4xl font-black" style={{ color: item.color }}>{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Player Origin */}
              <div className="rounded-3xl backdrop-blur-xl p-8 border border-white/10"
                   style={{ background: 'linear-gradient(135deg, rgba(236,28,36,0.1), rgba(218,165,32,0.1))' }}>
                <h3 className="text-3xl font-black mb-6 flex items-center gap-3 text-white">
                  <CustomEmoji type="globe" size={32} />
                  Player Origin
                </h3>
                <div className="space-y-6">
                  {[
                    { label: 'Indian Players', count: (teamData.players || []).filter(p => p.nationality === 'India').length, iconType: 'flag-india' },
                    { label: 'Foreign Players', count: (teamData.players || []).filter(p => p.nationality !== 'India').length, iconType: 'globe' }
                  ].map((item, i) => (
                    <div key={i} className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold flex items-center gap-2 text-white">
                          <CustomEmoji type={item.iconType as any} size={32} />
                          {item.label}
                        </span>
                        <span className="text-5xl font-black bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                          {item.count}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${(item.count / (teamData.players?.length || 1)) * 100}%`,
                            background: 'linear-gradient(to right, #EC1C24, #DAA520)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
              {/* Trophy Cabinet - from Admin Data */}
              {teamData.trophies && teamData.trophies.length > 0 && (
                <div className="rounded-3xl backdrop-blur-xl p-12 border border-white/10"
                     style={{ background: 'linear-gradient(135deg, rgba(236,28,36,0.1), rgba(218,165,32,0.1))' }}>
                  <h3 className="text-4xl font-black mb-8 flex items-center justify-center gap-3 text-white">
                    <CustomEmoji type="trophy" size={40} />
                    Trophy Cabinet
                    <CustomEmoji type="trophy" size={40} />
                  </h3>
                  
                  {teamData.trophies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {teamData.trophies.map((trophy: Trophy, i: number) => (
                        <div key={i} className="group text-center">
                          <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-yellow-900 flex items-center justify-center text-6xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl">
                            🥇
                          </div>
                          <p className="text-2xl font-black" style={{ color: '#DAA520' }}>{trophy.year}</p>
                          <p className="text-sm mt-1 text-white">{trophy.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8">No trophies recorded yet</p>
                  )}

                  <div className="py-8 border-t border-white/10">
                    <p className="text-3xl font-black text-transparent bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text animate-pulse flex items-center gap-2">
                      "Ee Sala Cup Namde" <CustomEmoji type="fire" size={32} animate={true} />
                    </p>
                    <p className="mt-2 italic text-white">(This Year, The Cup is Ours)</p>
                  </div>
                </div>
              )}

              {/* Home Grounds - from Admin Data */}
              {teamData.homeGrounds && teamData.homeGrounds.length > 0 && (
                <div className="rounded-3xl backdrop-blur-xl p-12 border border-white/10"
                     style={{ background: 'linear-gradient(135deg, rgba(236,28,36,0.1), rgba(218,165,32,0.1))' }}>
                  <h3 className="text-4xl font-black mb-8 flex items-center gap-3 text-white">
                    <CustomEmoji type="stadium" size={40} />
                    Home Grounds
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {teamData.homeGrounds.map((ground: string, i: number) => (
                      <div key={i} className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20 hover:scale-105 transform">
                        <div className="flex items-start gap-4">
                          <CustomEmoji type="venue" size={48} animate={true} />
                          <div className="flex-1">
                            <p className="text-xl font-bold text-white">{ground}</p>
                            <p className="text-xs mt-2 text-gray-400">Official Home Ground</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Static Achievements Section */}
              <div className="rounded-3xl backdrop-blur-xl p-12 border border-white/10"
                   style={{ background: 'linear-gradient(135deg, rgba(236,28,36,0.1), rgba(218,165,32,0.1))' }}>
                <h3 className="text-3xl font-black mb-8 flex items-center gap-3 text-white">
                  <CustomEmoji type="star" size={32} animate={true} />
                  Legacy Highlights
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: 'cricket-bat', text: 'Home for iconic cricket moments and legendary performances', color: 'from-red-500 to-yellow-500' },
                    { icon: 'star', text: 'Nurturing talent and creating future cricket champions', color: 'from-yellow-500 to-orange-500' },
                    { icon: 'heart', text: 'Unwavering support from millions of passionate fans', color: 'from-red-600 to-pink-600' },
                    { icon: 'fire', text: 'Known for bold, fearless cricket and never-give-up spirit', color: 'from-orange-500 to-red-500' },
                    { icon: 'crown', text: 'Consistently competitive in the IPL tournament', color: 'from-purple-500 to-pink-500' }
                  ].map((achievement, i) => (
                    <div key={i} className="group flex items-center gap-4 p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all hover:scale-105 cursor-pointer">
                      <div className={`transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300`}>
                        <CustomEmoji type={achievement.icon as any} size={48} animate={true} />
                      </div>
                      <p className={`text-xl font-bold bg-gradient-to-r ${achievement.color} bg-clip-text text-transparent`}>
                        {achievement.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 5: LEGACY MESSAGE */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-red-950/15 to-gray-900" />
          <FloatingParticles />
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-5xl md:text-7xl font-black mb-8"
                style={{
                  background: 'linear-gradient(to right, #EC1C24, #DAA520, #EC1C24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 80px rgba(236,28,36,0.5)'
                }}>
              More Than A Team
            </h2>
            <p className="text-2xl text-gray-300 leading-relaxed mb-12">
              A movement. A family. A legacy built on passion, courage, and the unwavering belief that glory is not just about trophies—it's about the journey, the spirit, and the millions of hearts that beat as one.
            </p>
            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full backdrop-blur-xl border border-red-500/50"
                 style={{ background: 'linear-gradient(135deg, rgba(236,28,36,0.2), rgba(218,165,32,0.2))' }}>
              <CustomEmoji type="crown" size={64} animate={true} />
              <span className="text-2xl font-black text-yellow-500">PLAY BOLD. PLAY FEARLESS.</span>
              <CustomEmoji type="fire" size={64} animate={true} />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {isWPL ? (
        <WPLPlayerModal
          player={selectedPlayer}
          team={teamData}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPlayer(null);
          }}
        />
      ) : (
      <PlayerModal
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPlayer(null);
        }}
        teamColors={teamData?.colors}
        teamData={teamData || undefined}
      />
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-float {
          animation: float 15s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
