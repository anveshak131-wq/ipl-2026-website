 'use client';

import { useState, useEffect } from 'react';
import SmartDescription from '@/components/teams/SmartDescription';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PlayerModal from '@/components/teams/PlayerModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuroraBackground from '@/components/ui/AuroraBackground';
import IPLLogo from '@/components/ui/IPLLogo';
import { 
  UsersIcon, 
  StarIcon, 
  GlobeIcon, 
  AllRounderIcon, 
  BatsmanIcon, 
  BowlerIcon, 
  WicketKeeperIcon,
  CricketBatIcon,
  TrophyIcon
} from '@/components/ui/CustomIcons';
import { Team, Player } from '@/types';
import { sortPlayersByRoleAndAge } from '@/lib/playerSort';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLion from '@/components/RCBLion/RCBLion';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { getOptimalTextColor } from '@/lib/colorUtils';

interface TeamDetailClientProps {
  teamId: string;
}


function createColorVariations(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const light = `rgba(${r}, ${g}, ${b}, 0.15)`;
  const medium = `rgba(${r}, ${g}, ${b}, 0.3)`;
  
  return {
    light,
    medium,
    solid: hex,
    glow: `rgba(${r}, ${g}, ${b}, 0.5)`,
    text: '#FFFFFF',
    textOnLight: '#FFFFFF',
  };
}

export default function TeamDetailClient({ teamId }: TeamDetailClientProps) {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'squad' | 'stats' | 'about'>('squad');
  const [scrollY, setScrollY] = useState(0);
  const [nationalityFilter, setNationalityFilter] = useState<'all' | 'indian' | 'overseas'>('all');
  const [battingStyleFilter, setBattingStyleFilter] = useState<'any' | 'right' | 'left'>('any');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const numericId = teamId.replace('team', '');
        
        const teamsResponse = await fetch('/api/teams');
        if (teamsResponse.ok) {
          const allTeams = await teamsResponse.json();
          const team = allTeams.find((t: Team) => t.id === numericId || t.id === teamId);
          
          if (team) {
            const playersResponse = await fetch('/api/players');
            if (playersResponse.ok) {
              const allPlayers = await playersResponse.json();
              const teamWithPlayers = {
                ...team,
                players: sortPlayersByRoleAndAge(allPlayers.filter((p: Player) => p.teamId === team.id))
              };
              setTeamData(teamWithPlayers);
            } else {
              setTeamData(team);
            }
          } else {
            setTeamData(null);
          }
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        setTeamData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <AuroraBackground />
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
        <AuroraBackground />
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-white mb-4">Team Not Found</h1>
          <p className="text-gray-400 mb-6">This team does not exist.</p>
          <button
            onClick={() => router.push('/teams')}
            className="px-6 py-2 bg-gradient-to-r from-ipl-blue-dark to-ipl-purple hover:from-ipl-purple hover:to-ipl-gold text-white rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Back to Teams
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const primaryColor = createColorVariations(teamData.colors.primary);
  const secondaryColor = createColorVariations(teamData.colors.secondary);
  const numericId = teamId.replace('team', '');
  const teamLogoPath = getAnimatedLogoPath(teamData.id);
  const fallbackLogoPath = getLogoPath(teamData.id);

  // Apply squad filters
  const filteredPlayers = (teamData.players || []).filter((p) => {
    let nationalityOk = true;
    if (nationalityFilter === 'indian') {
      nationalityOk = p.nationality === 'India';
    } else if (nationalityFilter === 'overseas') {
      nationalityOk = p.nationality !== 'India';
    }

    let battingOk = true;
    if (battingStyleFilter === 'right') {
      battingOk = p.battingStyle.toLowerCase().includes('right');
    } else if (battingStyleFilter === 'left') {
      battingOk = p.battingStyle.toLowerCase().includes('left');
    }

    return nationalityOk && battingOk;
  });

  const batsmen = filteredPlayers.filter(p => p.role === 'Batsman');
  const wicketkeepers = filteredPlayers.filter(p => p.role === 'Wicket-keeper');
  const allRounders = filteredPlayers.filter(p => p.role === 'All-rounder');
  const bowlers = filteredPlayers.filter(p => p.role === 'Bowler');
  

  return (
    <div className="min-h-screen" style={{
      background: `linear-gradient(135deg, ${primaryColor.solid}15, ${secondaryColor.solid}15)`
    }}>
      <AuroraBackground />
      <Navbar />
      
      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <div className="relative min-h-screen flex items-center">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-800 to-gray-900" />
            
            {/* Team color gradient orbs */}
            <div 
              className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-30 transition-all duration-700"
              style={{
                background: `radial-gradient(circle, ${primaryColor.medium}, transparent)`,
                top: '-10%',
                right: '-5%',
              }}
            />
            <div 
              className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-25 transition-all duration-700"
              style={{
                background: `radial-gradient(circle, ${secondaryColor.medium}, transparent)`,
                bottom: '-10%',
                left: '-10%',
              }}
            />
            
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `radial-gradient(circle, ${primaryColor.solid} 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
            {/* Back Button */}
            <button 
              onClick={() => router.push('/teams')}
              className="mb-12 flex items-center gap-3 text-gray-400 hover:text-white transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:border-white/30 group-hover:scale-110 transition-all">
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="font-semibold">Back to Teams</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left: Team Info */}
              <div className="space-y-8 animate-slide-up">
                {/* Team Badge with IPL Logo - Fixed spacing */}
                <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full backdrop-blur-xl border shadow-xl transition-all duration-300 hover:scale-105"
                     style={{
                       background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                       borderColor: primaryColor.medium
                     }}>
                  <div className="w-6 h-6 flex-shrink-0">
                    <IPLLogo />
                  </div>
                  <span className="text-sm font-bold tracking-wider whitespace-nowrap" style={{ color: primaryColor.textOnLight }}>{teamData.shortName}</span>
                </div>

                {/* Team Name */}
                <div>
                  <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-none tracking-tighter"
                      style={{
                        textShadow: `0 0 60px ${primaryColor.glow}, 0 4px 20px rgba(0,0,0,0.5)`
                      }}>
                    {teamData.name}
                  </h1>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 w-24 rounded-full shadow-lg transition-all duration-500"
                         style={{
                           background: `linear-gradient(to right, ${primaryColor.solid}, ${secondaryColor.solid})`,
                           boxShadow: `0 0 20px ${primaryColor.glow}`
                         }} />
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor.solid }} />
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: secondaryColor.solid }} />
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-xl leading-relaxed max-w-xl text-white">
                  {teamData.description}
                </p>
                
                {/* Color Swatches */}
                <div className="flex gap-6">
                  <div className="group text-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl blur-lg opacity-50 transition-opacity duration-300 group-hover:opacity-75"
                           style={{ backgroundColor: primaryColor.solid }} />
                      <div 
                        className="relative w-16 h-16 rounded-2xl shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border-2 border-white/20"
                        style={{ backgroundColor: primaryColor.solid }}
                      />
                    </div>
                    <p className="text-gray-400 text-xs font-semibold mt-3 uppercase tracking-wider">Primary</p>
                  </div>
                  <div className="group text-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl blur-lg opacity-50 transition-opacity duration-300 group-hover:opacity-75"
                           style={{ backgroundColor: secondaryColor.solid }} />
                      <div 
                        className="relative w-16 h-16 rounded-2xl shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border-2 border-white/20"
                        style={{ backgroundColor: secondaryColor.solid }}
                      />
                    </div>
                    <p className="text-gray-400 text-xs font-semibold mt-3 uppercase tracking-wider">Secondary</p>
                  </div>
                </div>
              </div>

              {/* Right: Team Logo from /logos folder */}
              <div className="relative flex items-center justify-center animate-scale-in" style={{ animationDelay: '200ms' }}>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse"
                     style={{ 
                       background: `radial-gradient(circle, ${primaryColor.medium}, ${secondaryColor.medium})`,
                       animationDuration: '3s'
                     }} />
                
                {/* Rotating ring */}
                <div className="absolute inset-0 animate-spin-slow">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke={primaryColor.light} strokeWidth="0.5" strokeDasharray="5,5" />
                  </svg>
                </div>

                {/* Logo Container with enhanced animations */}
                <div className="relative group">
                  <div className="absolute -inset-4 rounded-full opacity-50 group-hover:opacity-75 blur-2xl transition-all duration-500 animate-pulse"
                       style={{
                         background: `conic-gradient(from 0deg, ${primaryColor.solid}, ${secondaryColor.solid}, ${primaryColor.solid})`
                       }} />
                  
                  <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full flex items-center justify-center backdrop-blur-xl border-2 shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 animate-glow-pulse overflow-visible"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium,
                         boxShadow: `0 0 40px ${primaryColor.glow}, 0 0 80px ${secondaryColor.glow}40`
                       }}>
                    {/* Rotating gradient ring */}
                    <div className="absolute inset-0 rounded-full opacity-30 animate-spin-slow"
                         style={{
                           background: `conic-gradient(from 0deg, transparent, ${primaryColor.solid}40, transparent)`
                         }} />
                    
                    {/* Actual Team Logo from /logos - Animated or Lottie */}
                    {teamLogoPath.endsWith('.json') ? (
                      <div className="w-3/4 h-3/4 relative z-10">
                        <RCBLottie className="w-full h-full" />
                      </div>
                    ) : teamLogoPath.endsWith('rcb-lion-logo.svg') ? (
                      <div className="w-3/4 h-3/4 relative z-10 flex items-center justify-center">
                        <RCBLionLogo className="w-full h-full" />
                      </div>
                    ) : (
                      <img 
                        src={teamLogoPath}
                        alt={`${teamData.shortName} logo`}
                        className="w-3/4 h-3/4 object-contain drop-shadow-2xl animate-float relative z-10 transform group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackLogoPath;
                        }}
                      />
                    )}
                    
                    {/* IPL Logo Badge with enhanced animation - Positioned to avoid overlap with team logo */}
                    <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-12 h-12 md:w-14 md:h-14 rounded-full backdrop-blur-xl border-2 border-white/30 flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 bg-gradient-to-br from-blue-900/80 to-purple-900/80 z-20">
                      <div className="w-7 h-7 md:w-8 md:h-8">
                        <IPLLogo />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>

        {/* Stats Section with Custom Icons */}
        <div className="relative z-20 -mt-20 mb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Squad Size', value: teamData.players?.length || 0, Icon: UsersIcon },
                { label: 'Captains', value: teamData.players?.filter(p => p.isCaptain).length || 0, Icon: StarIcon },
                { label: 'Foreign', value: teamData.players?.filter(p => p.nationality !== 'India').length || 0, Icon: GlobeIcon },
                { label: 'All-rounders', value: teamData.players?.filter(p => p.role === 'All-rounder').length || 0, Icon: AllRounderIcon }
              ].map((stat, index) => (
                <div 
                  key={index}
                  className="group relative overflow-hidden rounded-3xl backdrop-blur-xl p-8 border shadow-xl hover:scale-105 transition-all duration-500 animate-slide-up hover:shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                    borderColor: primaryColor.medium,
                    animationDelay: `${index * 100}ms`,
                    boxShadow: `0 10px 30px ${primaryColor.glow}20`
                  }}
                >
                  {/* IPL Logo Watermark */}
                  <div className="absolute top-3 right-3 w-8 h-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <IPLLogo />
                  </div>
                  
                  <div className="mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <stat.Icon className="w-12 h-12" color={primaryColor.solid} />
                  </div>
                  <p className="text-5xl font-black mb-2 transform group-hover:scale-110 transition-transform duration-300" style={{ color: primaryColor.text }}>
                    {stat.value}
                  </p>
                  <p className="text-sm font-semibold uppercase tracking-wider transition-colors duration-300" style={{ color: primaryColor.textOnLight }}>{stat.label}</p>
                  
                  {/* Hover shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation - Fixed overlap with proper spacing */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 mt-12">
          <div className="flex flex-col items-center gap-4">
            {/* IPL Logo Badge - Moved outside and above the tab container */}
            <div className="w-12 h-12 rounded-full backdrop-blur-xl border-2 border-white/30 flex items-center justify-center shadow-xl z-10" style={{
              background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
              borderColor: primaryColor.medium,
            }}>
              <div className="w-7 h-7">
                <IPLLogo />
              </div>
            </div>
            
            {/* Tab Container - Premium Design with Team Colors */}
            <div className="relative inline-flex gap-2 p-1.5 rounded-2xl backdrop-blur-xl border-2 shadow-xl"
                 style={{
                   background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                   borderColor: primaryColor.medium,
                   boxShadow: `0 10px 30px ${primaryColor.glow}20`
                 }}>
              {[
                { id: 'squad', label: 'Squad' },
                { id: 'stats', label: 'Stats' },
                { id: 'about', label: 'About' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative overflow-hidden px-8 py-4 rounded-xl font-bold text-lg transition-all duration-500 whitespace-nowrap transform ${
                    activeTab === tab.id ? 'scale-105' : 'hover:scale-105'
                  }`}
                  style={activeTab === tab.id ? {
                    background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                    color: '#FFFFFF',
                    boxShadow: `0 10px 30px ${primaryColor.glow}40, 0 0 40px ${secondaryColor.glow}20`,
                    border: `2px solid ${primaryColor.medium}`,
                  } : {
                    background: 'transparent',
                    color: primaryColor.textOnLight,
                    border: '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = primaryColor.textOnLight;
                      e.currentTarget.style.background = `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`;
                      e.currentTarget.style.borderColor = `${primaryColor.medium}60`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = primaryColor.textOnLight;
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  {/* Shimmer effect for active tab */}
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  )}
                  
                  <span className="relative z-10">{tab.label}</span>
                  
                  {/* Glow effect for active tab */}
                  {activeTab === tab.id && (
                    <div 
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg -z-10"
                      style={{
                        background: `radial-gradient(circle, ${primaryColor.medium}, transparent)`,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {activeTab === 'squad' && (
            <div className="space-y-16">
              {/* Squad Filters */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Filter squad</span>
                  <div className="w-12 h-px bg-white/10" />
                </div>

                <div className="flex flex-wrap gap-4">
                  {/* Nationality filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Nationality</span>
                    <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'indian', label: 'Indian' },
                        { id: 'overseas', label: 'Overseas' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setNationalityFilter(option.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            nationalityFilter === option.id
                              ? 'bg-white text-slate-900 shadow-md'
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Batting style filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Batting</span>
                    <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
                      {[
                        { id: 'any', label: 'Any' },
                        { id: 'right', label: 'Right-hand' },
                        { id: 'left', label: 'Left-hand' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setBattingStyleFilter(option.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            battingStyleFilter === option.id
                              ? 'bg-white text-slate-900 shadow-md'
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desired order: Batters, Wicket-keepers, All-rounders, Bowlers */}
              {[
                { title: 'Batters', players: batsmen, Icon: BatsmanIcon },
                { title: 'Wicket-keepers', players: wicketkeepers, Icon: WicketKeeperIcon },
                { title: 'All-rounders', players: allRounders, Icon: AllRounderIcon },
                { title: 'Bowlers', players: bowlers, Icon: BowlerIcon }
              ].map((section, sectionIndex) => (
                section.players.length > 0 && (
                  <div key={sectionIndex} className="animate-fade-in" style={{ animationDelay: `${sectionIndex * 100}ms` }}>
                    <h3 className="text-3xl font-black mb-8 flex items-center gap-4" style={{ color: primaryColor.text }}>
                      <section.Icon className="w-10 h-10" color={primaryColor.solid} />
                      {section.title}
                      <span className="text-lg font-normal" style={{ color: primaryColor.textOnLight }}>({section.players.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {section.players.map((player, playerIndex) => (
                        <PlayerCard 
                          key={player.id} 
                          player={player} 
                          primaryColor={primaryColor} 
                          secondaryColor={secondaryColor}
                          onClick={() => {
                            setSelectedPlayer(player);
                            setIsModalOpen(true);
                          }}
                          index={playerIndex}
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {activeTab === 'stats' && (
            <StatsTab 
              teamData={teamData} 
              primaryColor={primaryColor} 
              secondaryColor={secondaryColor}
              batsmen={batsmen}
              bowlers={bowlers}
              allRounders={allRounders}
              wicketkeepers={wicketkeepers}
            />
          )}

          {activeTab === 'about' && (
            <AboutTab teamData={teamData} primaryColor={primaryColor} secondaryColor={secondaryColor} />
          )}
        </div>
      </main>

      <Footer />

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
    </div>
  );
}

// Player Card Component with enhanced animations and role tags
function PlayerCard({ player, primaryColor, secondaryColor, onClick, index }: any) {
  const stats = player.stats || {};

  // Derive role tags
  const tags: string[] = [];

  if (player.role === 'Batsman' || player.role === 'All-rounder') {
    if (stats.strikeRate >= 140 || stats.sixes >= 30) {
      tags.push('Power Hitter');
    }
    if (stats.runs >= 400) {
      tags.push('Top-order');
    }
    if (stats.highest >= 75) {
      tags.push('Finisher');
    }
  }

  if (player.role === 'Bowler' || player.role === 'All-rounder') {
    if (stats.economy <= 7) {
      tags.push('Powerplay bowler');
    }
    if (stats.wickets >= 20) {
      tags.push('Strike bowler');
    }
    if (stats.economy <= 8 && stats.wickets >= 15) {
      tags.push('Death bowler');
    }
  }

  if (player.role === 'All-rounder') {
    tags.push('All-round impact');
  }

  // Key player highlight: high impact with bat or ball
  const isKeyPlayer =
    stats.runs >= 400 ||
    stats.wickets >= 18 ||
    (stats.fifties || 0) + (stats.hundreds || 0) >= 5;

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl backdrop-blur-xl p-6 border cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 shadow-xl hover:shadow-2xl animate-slide-up"
      style={{
        background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
        borderColor: isKeyPlayer ? '#facc15' : primaryColor.medium,
        animationDelay: `${index * 50}ms`,
        boxShadow: isKeyPlayer
          ? `0 0 25px rgba(250, 204, 21, 0.6), 0 10px 30px ${primaryColor.glow}20`
          : `0 10px 25px ${primaryColor.glow}20`,
      }}
    >
      {/* Jersey Number with enhanced animation */}
      <div
        className="absolute top-4 right-4 w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 z-10 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
          boxShadow: `0 5px 15px ${primaryColor.glow}`,
        }}
      >
        {player.jerseyNumber || '-'}
      </div>

      {/* Hover shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

      {/* Player Name */}
      <h3 className="text-xl font-bold mb-2 pr-16" style={{ color: primaryColor.textOnLight }}>
        {player.name}
      </h3>
      <p className="text-sm font-semibold mb-4" style={{ color: primaryColor.textOnLight }}>
        {player.role}
      </p>

      {/* Badges with Custom Icons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {player.isCaptain && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <StarIcon className="w-3 h-3" color="#FCD34D" filled />
            Captain
          </span>
        )}
        {player.nationality !== 'India' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <GlobeIcon className="w-3 h-3" color="#93C5FD" />
            Foreign
          </span>
        )}
        {isKeyPlayer && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/40">
            <StarIcon className="w-3 h-3" color="#FBBF24" filled />
            Key Player
          </span>
        )}
      </div>

      {/* Derived role tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 4).map((tag: string) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/20 border border-white/10 text-gray-100"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: primaryColor.medium }}>
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: primaryColor.text }}>
            {stats.matches}
          </p>
          <p className="text-xs uppercase" style={{ color: primaryColor.textOnLight }}>
            Matches
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: primaryColor.text }}>
            {stats.runs}
          </p>
          <p className="text-xs uppercase" style={{ color: primaryColor.textOnLight }}>
            Runs
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: primaryColor.text }}>
            {stats.wickets}
          </p>
          <p className="text-xs uppercase" style={{ color: primaryColor.textOnLight }}>
            Wickets
          </p>
        </div>
      </div>

      {/* Hover Arrow */}
      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

// Stats Tab
function StatsTab({ teamData, primaryColor, secondaryColor, batsmen, bowlers, allRounders, wicketkeepers }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
           style={{
             background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
             borderColor: primaryColor.medium,
             boxShadow: `0 10px 30px ${primaryColor.glow}15`
           }}>
        <div className="flex items-center gap-3 mb-6">
          <CricketBatIcon className="w-8 h-8" color={primaryColor.solid} />
          <h3 className="text-2xl font-black" style={{ color: primaryColor.textOnLight }}>Squad Composition</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Batsmen', value: batsmen.length, Icon: BatsmanIcon },
            { label: 'Bowlers', value: bowlers.length, Icon: BowlerIcon },
            { label: 'All-rounders', value: allRounders.length, Icon: AllRounderIcon },
            { label: 'Wicket-keepers', value: wicketkeepers.length, Icon: WicketKeeperIcon }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <span className="font-semibold flex items-center gap-3" style={{ color: primaryColor.textOnLight }}>
                <item.Icon className="w-5 h-5" color={primaryColor.solid} />
                {item.label}
              </span>
              <span className="text-4xl font-black" style={{ color: primaryColor.text }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
           style={{
             background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
             borderColor: primaryColor.medium,
             animationDelay: '100ms',
             boxShadow: `0 10px 30px ${primaryColor.glow}15`
           }}>
        <div className="flex items-center gap-3 mb-6">
          <GlobeIcon className="w-8 h-8" color={primaryColor.solid} />
          <h3 className="text-2xl font-black" style={{ color: primaryColor.textOnLight }}>Player Origin</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Indian Players', value: teamData.players?.filter((p: Player) => p.nationality === 'India').length || 0 },
            { label: 'Foreign Players', value: teamData.players?.filter((p: Player) => p.nationality !== 'India').length || 0 }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <span className="font-semibold" style={{ color: primaryColor.textOnLight }}>{item.label}</span>
              <span className="text-4xl font-black" style={{ color: primaryColor.text }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// About Tab
function AboutTab({ teamData, primaryColor, secondaryColor }: any) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="rounded-3xl backdrop-blur-xl p-12 border shadow-xl animate-fade-in"
           style={{
             background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
             borderColor: primaryColor.medium,
             boxShadow: `0 10px 30px ${primaryColor.glow}15`
           }}>
        <div className="flex items-center gap-3 mb-8">
          <TrophyIcon className="w-10 h-10" color={primaryColor.solid} />
          <h3 className="text-4xl font-black" style={{ color: primaryColor.textOnLight }}>About {teamData.name}</h3>
        </div>
        
        <div className="mb-8">
          {/* Smart description component: handles wrapping, read more, and AI suggestions */}
          <SmartDescription text={teamData.description} teamName={teamData.name} primaryColor={primaryColor} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h4 className="text-2xl font-black mb-6" style={{ color: primaryColor.textOnLight }}>Team Colors</h4>
            <div className="flex gap-6">
              {[
                { label: 'Primary', color: primaryColor.solid },
                { label: 'Secondary', color: secondaryColor.solid }
              ].map((item, i) => (
                <div key={i}>
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"
                         style={{ backgroundColor: item.color }} />
                    <div className="relative w-24 h-24 rounded-2xl shadow-2xl border-2 border-white/20 group-hover:scale-110 transition-transform duration-300" 
                         style={{ backgroundColor: item.color }} />
                  </div>
                  <p className="text-sm mt-3 font-semibold uppercase tracking-wider" style={{ color: primaryColor.textOnLight }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-2xl font-black mb-6" style={{ color: primaryColor.textOnLight }}>Quick Facts</h4>
            <ul className="space-y-3 text-lg" style={{ color: primaryColor.textOnLight }}>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor.solid }} />
                Short Name: <span className="font-bold">{teamData.shortName}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor.solid }} />
                Squad Size: <span className="font-bold">{teamData.players?.length || 0} Players</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor.solid }} />
                Foreign Players: <span className="font-bold">{teamData.players?.filter((p: Player) => p.nationality !== 'India').length || 0}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trophy Information */}
      {teamData.trophies && teamData.trophies.length > 0 && (
        <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
             style={{
               background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
               borderColor: primaryColor.medium,
               boxShadow: `0 10px 30px ${primaryColor.glow}15`
             }}>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-4xl">🏆</span>
            <h4 className="text-2xl font-black" style={{ color: primaryColor.textOnLight }}>Trophy Cabinet</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamData.trophies.map((trophy: any, idx: number) => (
              <div key={idx} className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🥇</div>
                  <div className="flex-1">
                    <p className="text-3xl font-black" style={{ color: primaryColor.text }}>{trophy.year}</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: primaryColor.textOnLight }}>{trophy.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Home Grounds Information */}
      {teamData.homeGrounds && teamData.homeGrounds.length > 0 && (
        <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
             style={{
               background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
               borderColor: primaryColor.medium,
               boxShadow: `0 10px 30px ${primaryColor.glow}15`
             }}>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-4xl">🏟️</span>
            <h4 className="text-2xl font-black" style={{ color: primaryColor.textOnLight }}>Home Grounds</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamData.homeGrounds.map((ground: string, idx: number) => (
              <div key={idx} className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20 hover:scale-105 transform">
                <p className="font-bold text-lg" style={{ color: primaryColor.textOnLight }}>{ground}</p>
                <p className="text-xs mt-2" style={{ color: primaryColor.textOnLight }}>Official Home Ground</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
