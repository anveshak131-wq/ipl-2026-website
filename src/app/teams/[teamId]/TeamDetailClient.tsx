'use client';

import { useState, useEffect } from 'react';
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

interface TeamDetailClientProps {
  teamId: string;
}

// Map team IDs to logo filenames
const TEAM_LOGO_MAP: { [key: string]: string } = {
  '1': 'rcb_logo_new.svg',
  '2': 'csk_logo_new.svg',
  '3': 'mi_logo_new.svg',
  '4': 'kkr_logo_new.svg',
  '5': 'dc_logo_new.svg',
  '6': 'srh_logo_new.svg',
  '7': 'kxip_logo_new.svg',
  '8': 'rr_logo_new.svg',
  '9': 'gt_logo_new.svg',
  '10': 'lsg_logo_new.svg'
};

function createColorVariations(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return {
    light: `rgba(${r}, ${g}, ${b}, 0.15)`,
    medium: `rgba(${r}, ${g}, ${b}, 0.3)`,
    solid: hex,
    glow: `rgba(${r}, ${g}, ${b}, 0.5)`
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
                players: allPlayers.filter((p: Player) => p.teamId === team.id)
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
      <div className="min-h-screen bg-black">
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
      <div className="min-h-screen bg-black">
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
  const teamLogoPath = `/logos/${TEAM_LOGO_MAP[numericId] || 'rcb_logo_new.svg'}`;

  const batsmen = teamData.players?.filter(p => p.role === 'Batsman') || [];
  const bowlers = teamData.players?.filter(p => p.role === 'Bowler') || [];
  const allRounders = teamData.players?.filter(p => p.role === 'All-rounder') || [];
  const wicketkeepers = teamData.players?.filter(p => p.role === 'Wicket-keeper') || [];

  return (
    <div className="min-h-screen bg-black">
      <AuroraBackground />
      <Navbar />
      
      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <div className="relative min-h-screen flex items-center">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
            
            {/* Soft gradient orbs with parallax */}
            <div 
              className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-20 transition-all duration-700"
              style={{
                background: `radial-gradient(circle, ${primaryColor.medium}, transparent)`,
                top: `${-20 + scrollY * 0.1}%`,
                right: `${-10 + scrollY * 0.05}%`,
              }}
            />
            <div 
              className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-15 transition-all duration-700"
              style={{
                background: `radial-gradient(circle, ${secondaryColor.medium}, transparent)`,
                bottom: `${-15 + scrollY * 0.08}%`,
                left: `${-5 + scrollY * 0.06}%`,
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
              <div className="space-y-8 animate-fade-in">
                {/* Team Badge with IPL Logo */}
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-xl border shadow-xl transition-all duration-300 hover:scale-105"
                     style={{
                       background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                       borderColor: primaryColor.medium
                     }}>
                  <div className="w-6 h-6">
                    <IPLLogo />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wider">{teamData.shortName}</span>
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
                <p className="text-xl text-gray-300 leading-relaxed max-w-xl">
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
              <div className="relative flex items-center justify-center animate-fade-in" style={{ animationDelay: '200ms' }}>
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

                {/* Logo Container */}
                <div className="relative group">
                  <div className="absolute -inset-4 rounded-full opacity-50 group-hover:opacity-75 blur-2xl transition-all duration-500"
                       style={{
                         background: `conic-gradient(from 0deg, ${primaryColor.solid}, ${secondaryColor.solid}, ${primaryColor.solid})`
                       }} />
                  
                  <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full flex items-center justify-center backdrop-blur-xl border-2 shadow-2xl transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500"
                       style={{
                         background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                         borderColor: primaryColor.medium
                       }}>
                    {/* Actual Team Logo from /logos */}
                    <img 
                      src={teamLogoPath}
                      alt={`${teamData.shortName} logo`}
                      className="w-3/4 h-3/4 object-contain drop-shadow-2xl animate-float"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = teamData.logo;
                      }}
                    />
                    
                    {/* IPL Logo Badge */}
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full backdrop-blur-xl border-2 border-white/30 flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 bg-gradient-to-br from-blue-900/80 to-purple-900/80">
                      <div className="w-12 h-12">
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
                  className="group relative overflow-hidden rounded-3xl backdrop-blur-xl p-8 border shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                    borderColor: primaryColor.medium,
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* IPL Logo Watermark */}
                  <div className="absolute top-3 right-3 w-8 h-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <IPLLogo />
                  </div>
                  
                  <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    <stat.Icon className="w-12 h-12" color={primaryColor.solid} />
                  </div>
                  <p className="text-5xl font-black mb-2" style={{ color: primaryColor.solid }}>
                    {stat.value}
                  </p>
                  <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex justify-center">
            <div className="relative inline-flex gap-3 p-2 rounded-2xl backdrop-blur-xl border shadow-xl"
                 style={{
                   background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
                   borderColor: primaryColor.medium
                 }}>
              {/* IPL Logo Badge */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full backdrop-blur-xl border-2 border-white/30 flex items-center justify-center shadow-xl bg-gradient-to-br from-blue-900/80 to-purple-900/80">
                <div className="w-7 h-7">
                  <IPLLogo />
                </div>
              </div>
              
              {[
                { id: 'squad', label: 'Squad' },
                { id: 'stats', label: 'Stats' },
                { id: 'about', label: 'About' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                    activeTab === tab.id ? 'scale-105 shadow-lg' : 'hover:bg-white/10'
                  }`}
                  style={activeTab === tab.id ? {
                    background: `linear-gradient(135deg, ${primaryColor.solid}, ${secondaryColor.solid})`,
                    color: '#fff'
                  } : { color: '#fff' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {activeTab === 'squad' && (
            <div className="space-y-16">
              {[
                { title: 'Batsmen', players: batsmen, Icon: BatsmanIcon },
                { title: 'Bowlers', players: bowlers, Icon: BowlerIcon },
                { title: 'All-rounders', players: allRounders, Icon: AllRounderIcon },
                { title: 'Wicket-keepers', players: wicketkeepers, Icon: WicketKeeperIcon }
              ].map((section, sectionIndex) => (
                section.players.length > 0 && (
                  <div key={sectionIndex} className="animate-fade-in" style={{ animationDelay: `${sectionIndex * 100}ms` }}>
                    <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
                      <section.Icon className="w-10 h-10" color={primaryColor.solid} />
                      {section.title}
                      <span className="text-lg font-normal text-gray-400">({section.players.length})</span>
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
      />
    </div>
  );
}

// Player Card Component
function PlayerCard({ player, primaryColor, secondaryColor, onClick, index }: any) {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl backdrop-blur-xl p-6 border cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl animate-fade-in"
      style={{
        background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
        borderColor: primaryColor.medium,
        animationDelay: `${index * 50}ms`
      }}
    >
      {/* Jersey Number */}
      <div className="absolute top-4 right-4 w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"
           style={{ 
             background: `linear-gradient(135deg, ${primaryColor.medium}, ${secondaryColor.medium})`,
             color: '#fff'
           }}>
        {player.jerseyNumber || '-'}
      </div>

      {/* Player Name */}
      <h3 className="text-xl font-bold text-white mb-2 pr-16">{player.name}</h3>
      <p className="text-sm font-semibold text-gray-300 mb-4">{player.role}</p>

      {/* Badges with Custom Icons */}
      <div className="flex flex-wrap gap-2 mb-4">
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: primaryColor.medium }}>
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: primaryColor.solid }}>{player.stats.matches}</p>
          <p className="text-xs text-gray-400 uppercase">Matches</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: primaryColor.solid }}>{player.stats.runs}</p>
          <p className="text-xs text-gray-400 uppercase">Runs</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black" style={{ color: primaryColor.solid }}>{player.stats.wickets}</p>
          <p className="text-xs text-gray-400 uppercase">Wickets</p>
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
             borderColor: primaryColor.medium
           }}>
        <div className="flex items-center gap-3 mb-6">
          <CricketBatIcon className="w-8 h-8" color={primaryColor.solid} />
          <h3 className="text-2xl font-black text-white">Squad Composition</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Batsmen', value: batsmen.length, Icon: BatsmanIcon },
            { label: 'Bowlers', value: bowlers.length, Icon: BowlerIcon },
            { label: 'All-rounders', value: allRounders.length, Icon: AllRounderIcon },
            { label: 'Wicket-keepers', value: wicketkeepers.length, Icon: WicketKeeperIcon }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <span className="text-gray-300 font-semibold flex items-center gap-3">
                <item.Icon className="w-5 h-5" color={primaryColor.solid} />
                {item.label}
              </span>
              <span className="text-4xl font-black" style={{ color: primaryColor.solid }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl backdrop-blur-xl p-8 border shadow-xl animate-fade-in"
           style={{
             background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
             borderColor: primaryColor.medium,
             animationDelay: '100ms'
           }}>
        <div className="flex items-center gap-3 mb-6">
          <GlobeIcon className="w-8 h-8" color={primaryColor.solid} />
          <h3 className="text-2xl font-black text-white">Player Origin</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Indian Players', value: teamData.players?.filter((p: Player) => p.nationality === 'India').length || 0 },
            { label: 'Foreign Players', value: teamData.players?.filter((p: Player) => p.nationality !== 'India').length || 0 }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <span className="text-gray-300 font-semibold">{item.label}</span>
              <span className="text-4xl font-black" style={{ color: primaryColor.solid }}>{item.value}</span>
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
    <div className="max-w-4xl mx-auto">
      <div className="rounded-3xl backdrop-blur-xl p-12 border shadow-xl animate-fade-in"
           style={{
             background: `linear-gradient(135deg, ${primaryColor.light}, ${secondaryColor.light})`,
             borderColor: primaryColor.medium
           }}>
        <div className="flex items-center gap-3 mb-8">
          <TrophyIcon className="w-10 h-10" color={primaryColor.solid} />
          <h3 className="text-4xl font-black text-white">About {teamData.name}</h3>
        </div>
        
        <p className="text-xl text-gray-300 leading-relaxed mb-12">{teamData.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h4 className="text-2xl font-black text-white mb-6">Team Colors</h4>
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
                  <p className="text-gray-400 text-sm mt-3 font-semibold uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-2xl font-black text-white mb-6">Quick Facts</h4>
            <ul className="space-y-3 text-gray-300 text-lg">
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor.solid }} />
                Short Name: <span className="text-white font-bold">{teamData.shortName}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor.solid }} />
                Squad Size: <span className="text-white font-bold">{teamData.players?.length || 0} Players</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor.solid }} />
                Foreign Players: <span className="text-white font-bold">{teamData.players?.filter((p: Player) => p.nationality !== 'India').length || 0}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
