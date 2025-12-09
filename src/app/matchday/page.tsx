'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import GradientText from '@/components/ui/GradientText';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { useLeague } from '@/contexts/LeagueContext';
import { api } from '@/types';
import { Match, Team, League } from '@/types';
import { 
  MapPin, 
  Cloud, 
  Thermometer, 
  Wind, 
  Clock, 
  Calendar,
  Sun,
  CloudRain,
  Eye,
  Navigation,
  Phone,
  Car,
  Train,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface VenueInfo {
  name: string;
  city: string;
  capacity: number;
  established: number;
  dimensions: string;
  pitchType: string;
  averageScore: number;
  floodlights: boolean;
  parking: boolean;
  publicTransport: boolean;
  facilities: string[];
  directions: string;
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
}

interface WeatherInfo {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'partly-cloudy';
  humidity: number;
  windSpeed: number;
  precipitation: number;
  forecast: string[];
  recommendations: string[];
}

interface MatchConditions {
  pitchReport: string;
  outfieldCondition: string;
  dewFactor: 'low' | 'medium' | 'high';
  expectedBehavior: string;
  tossAdvantage: string;
}

export default function MatchDayPage() {
  const { currentLeague } = useLeague();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<VenueInfo | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [conditions, setConditions] = useState<MatchConditions | null>(null);

  // Mock venue data - in real app, this would come from API
  const mockVenues: Record<string, VenueInfo> = {
    'M. Chinnaswamy Stadium': {
      name: 'M. Chinnaswamy Stadium',
      city: 'Bengaluru',
      capacity: 38000,
      established: 1969,
      dimensions: '160m x 140m',
      pitchType: 'Batting-friendly',
      averageScore: 175,
      floodlights: true,
      parking: true,
      publicTransport: true,
      facilities: ['Food Courts', 'Restrooms', 'First Aid', 'VIP Boxes', 'Merchandise Store'],
      directions: 'Located in the heart of Bengaluru, accessible via MG Road and Cubbon Park',
      contactInfo: {
        phone: '+91 80 2266 0000',
        email: 'info@ksca.cricket',
        website: 'www.ksca.cricket'
      }
    },
    'Wankhede Stadium': {
      name: 'Wankhede Stadium',
      city: 'Mumbai',
      capacity: 33000,
      established: 1974,
      dimensions: '150m x 130m',
      pitchType: 'Balanced',
      averageScore: 165,
      floodlights: true,
      parking: false,
      publicTransport: true,
      facilities: ['Food Courts', 'Restrooms', 'First Aid', 'Corporate Boxes'],
      directions: 'Marine Drive, Mumbai - Well connected by local trains',
      contactInfo: {
        phone: '+91 22 2281 8000',
        email: 'info@mca.cricket',
        website: 'www.mca.cricket'
      }
    }
  };

  // Mock weather data - in real app, this would come from weather API
  const mockWeather: WeatherInfo = {
    temperature: 28,
    condition: 'partly-cloudy',
    humidity: 65,
    windSpeed: 12,
    precipitation: 20,
    forecast: [
      'Partly cloudy throughout the day',
      'Clear skies expected by evening',
      'No rain predicted during match hours'
    ],
    recommendations: [
      'Comfortable temperature for cricket',
      'Low chance of rain interruption',
      'Good batting conditions expected'
    ]
  };

  // Mock match conditions
  const mockConditions: MatchConditions = {
    pitchReport: 'Hard and dry surface with even bounce. Good for stroke play.',
    outfieldCondition: 'Fast and well-maintained outfield',
    dewFactor: 'medium',
    expectedBehavior: 'Batting-friendly in first innings, slight turn for spinners later',
    tossAdvantage: 'Teams might prefer to chase due to dew factor'
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [matchesData, teamsData] = await Promise.all([
          api.getMatches(currentLeague),
          api.getTeams(currentLeague)
        ]);
        setMatches(matchesData);
        setTeams(teamsData);
        
        // Select today's match if available
        const today = new Date().toISOString().split('T')[0];
        const todayMatch = matchesData.find(m => m.date === today);
        if (todayMatch) {
          setSelectedMatch(todayMatch);
          const venueData = mockVenues[todayMatch.venue];
          if (venueData) {
            setSelectedVenue(venueData);
          }
        }
        
        setWeather(mockWeather);
        setConditions(mockConditions);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentLeague]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'cloudy': return <Cloud className="w-6 h-6 text-gray-500" />;
      case 'rainy': return <CloudRain className="w-6 h-6 text-blue-500" />;
      case 'partly-cloudy': return <Cloud className="w-6 h-6 text-gray-400" />;
      default: return <Sun className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getDewFactorColor = (factor: string) => {
    switch (factor) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />
      <AuroraBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <AnimatedSection>
          <div className="text-center mb-12">
            <GradientText 
              className="text-5xl font-bold mb-4" 
              text="Match Day Experience"
            />
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Everything you need to know for match day - venue info, weather conditions, and more
            </p>
          </div>
        </AnimatedSection>

        {/* Match Selection */}
        <AnimatedSection delay={0.1}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Select Match</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <motion.div
                  key={match.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedMatch(match);
                    const venueData = mockVenues[match.venue];
                    if (venueData) {
                      setSelectedVenue(venueData);
                    }
                  }}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedMatch?.id === match.id 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' 
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">{match.date}</span>
                    <span className="text-sm font-semibold text-blue-400">{match.matchNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{match.team1.shortName}</span>
                    <span className="text-gray-400">vs</span>
                    <span className="text-white font-medium">{match.team2.shortName}</span>
                  </div>
                  <div className="flex items-center mt-2 text-gray-300">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{match.venue}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {selectedMatch && selectedVenue && (
          <>
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Venue Information */}
              <AnimatedSection delay={0.2} className="lg:col-span-2">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <MapPin className="w-6 h-6 mr-2 text-blue-400" />
                    Venue Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">{selectedVenue.name}</h4>
                      <div className="space-y-2 text-gray-300">
                        <p><span className="text-gray-400">City:</span> {selectedVenue.city}</p>
                        <p><span className="text-gray-400">Capacity:</span> {selectedVenue.capacity.toLocaleString()}</p>
                        <p><span className="text-gray-400">Established:</span> {selectedVenue.established}</p>
                        <p><span className="text-gray-400">Dimensions:</span> {selectedVenue.dimensions}</p>
                        <p><span className="text-gray-400">Pitch Type:</span> {selectedVenue.pitchType}</p>
                        <p><span className="text-gray-400">Average Score:</span> {selectedVenue.averageScore}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Facilities</h4>
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-300">
                          {selectedVenue.floodlights ? (
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                          )}
                          Floodlights
                        </div>
                        <div className="flex items-center text-gray-300">
                          {selectedVenue.parking ? (
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                          )}
                          Parking Available
                        </div>
                        <div className="flex items-center text-gray-300">
                          {selectedVenue.publicTransport ? (
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                          )}
                          Public Transport Access
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Available Facilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedVenue.facilities.map((facility, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-2">Directions</h4>
                    <p className="text-gray-300">{selectedVenue.directions}</p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center text-gray-300">
                      <Phone className="w-4 h-4 mr-2 text-blue-400" />
                      <span className="text-sm">{selectedVenue.contactInfo.phone}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Navigation className="w-4 h-4 mr-2 text-blue-400" />
                      <span className="text-sm">{selectedVenue.contactInfo.website}</span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Weather & Conditions */}
              <div className="space-y-6">
                {/* Weather */}
                <AnimatedSection delay={0.3}>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Cloud className="w-5 h-5 mr-2 text-blue-400" />
                      Weather Conditions
                    </h3>
                    
                    {weather && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getWeatherIcon(weather.condition)}
                            <span className="ml-2 text-2xl font-bold text-white">{weather.temperature}°C</span>
                          </div>
                          <span className="text-gray-300 capitalize">{weather.condition}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-gray-300">
                            <Thermometer className="w-4 h-4 mr-1" />
                            Humidity: {weather.humidity}%
                          </div>
                          <div className="flex items-center text-gray-300">
                            <Wind className="w-4 h-4 mr-1" />
                            Wind: {weather.windSpeed} km/h
                          </div>
                        </div>

                        <div className="border-t border-slate-600 pt-4">
                          <h4 className="text-sm font-semibold text-white mb-2">Forecast</h4>
                          <ul className="space-y-1 text-sm text-gray-300">
                            {weather.forecast.map((item, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-400 mr-2">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="border-t border-slate-600 pt-4">
                          <h4 className="text-sm font-semibold text-white mb-2">Match Impact</h4>
                          <ul className="space-y-1 text-sm text-gray-300">
                            {weather.recommendations.map((item, index) => (
                              <li key={index} className="flex items-start">
                                <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </AnimatedSection>

                {/* Match Conditions */}
                <AnimatedSection delay={0.4}>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Eye className="w-5 h-5 mr-2 text-blue-400" />
                      Match Conditions
                    </h3>
                    
                    {conditions && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-1">Pitch Report</h4>
                          <p className="text-sm text-gray-300">{conditions.pitchReport}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white mb-1">Outfield</h4>
                          <p className="text-sm text-gray-300">{conditions.outfieldCondition}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white mb-1">Dew Factor</h4>
                          <span className={`text-sm font-medium ${getDewFactorColor(conditions.dewFactor)}`}>
                            {conditions.dewFactor.toUpperCase()}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white mb-1">Expected Behavior</h4>
                          <p className="text-sm text-gray-300">{conditions.expectedBehavior}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white mb-1">Toss Advantage</h4>
                          <p className="text-sm text-gray-300">{conditions.tossAdvantage}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </AnimatedSection>
              </div>
            </div>

            {/* Transport Options */}
            <AnimatedSection delay={0.5}>
              <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Getting to the Venue</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <Car className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                    <h4 className="font-semibold text-white mb-1">By Car</h4>
                    <p className="text-sm text-gray-300">Parking available on-site</p>
                  </div>
                  <div className="text-center">
                    <Train className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                    <h4 className="font-semibold text-white mb-1">By Train</h4>
                    <p className="text-sm text-gray-300">Nearest station: 2km away</p>
                  </div>
                  <div className="text-center">
                    <Navigation className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                    <h4 className="font-semibold text-white mb-1">By Bus</h4>
                    <p className="text-sm text-gray-300">Multiple bus routes available</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
