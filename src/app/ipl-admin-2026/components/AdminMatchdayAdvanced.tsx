'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud, MapPin, Wind, Droplets, Eye, Thermometer, Gauge,
  Brain, Sparkles, TrendingUp, AlertTriangle, Calendar, Settings,
  Activity, Zap, Target, BarChart3, Users, RefreshCw, Plus,
  Edit, Save, X, ChevronRight, ChevronDown, Filter, Search,
  Sun, CloudRain, CloudSnow, Navigation, Bell, Database
} from 'lucide-react';

// Add global styles to disable scrolling
const noScrollStyles = `
  html, body {
    overflow: hidden !important;
    height: 100vh !important;
    position: fixed !important;
    width: 100vw !important;
  }

  #__next {
    height: 100vh !important;
    overflow: hidden !important;
  }
`;

// Advanced interfaces with AI integration
interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  coordinates: { lat: number; lng: number };
  timezone: string;
  established: number;
  pitchType: string;
  floodlights: boolean;
  drainageSystem: string;
  avgFirstInnings: number;
  avgSecondInnings: number;
  highestTotal: number;
  lowestTotal: number;
  lastMatch: string;
  upcomingMatch: string;
  status: 'active' | 'maintenance' | 'inactive';
  aiInsights?: VenueAIInsights;
}

interface VenueAIInsights {
  crowdPrediction: number;
  weatherImpact: 'low' | 'medium' | 'high';
  optimalConditions: string[];
  strategicRecommendations: string[];
  riskFactors: string[];
  confidence: number;
}

interface WeatherData {
  venueId: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  condition: 'sunny' | 'cloudy' | 'partly-cloudy' | 'overcast' | 'rainy';
  description: string;
  timestamp: string;
  aiPrediction: WeatherAIPrediction;
}

interface WeatherAIPrediction {
  matchImpact: 'low' | 'medium' | 'high';
  pitchEffect: string;
  dewFactor: number;
  playingConditions: string;
  recommendations: string[];
  confidence: number;
}

interface MatchCondition {
  id: string;
  venueId: string;
  pitchReport: PitchReport;
  outfieldCondition: string;
  weatherForecast: string;
  recommendedTeam: 'bat-first' | 'bowl-first' | 'neutral';
  aiAnalysis: MatchAIAnalysis;
  lastUpdated: string;
}

interface PitchReport {
  hardness: number;
  grassCoverage: number;
  cracks: boolean;
  moisture: number;
  expectedBehavior: string;
  day1: string;
  day2: string;
  day3: string;
}

interface MatchAIAnalysis {
  battingConditions: string;
  bowlingConditions: string;
  fieldingConditions: string;
  strategicAdvice: string[];
  keyFactors: string[];
  winProbability: { bat: number; bowl: number };
  confidence: number;
}

export default function AdminMatchdayAdvanced() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [matchConditions, setMatchConditions] = useState<MatchCondition[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'venues' | 'weather' | 'conditions' | 'ai-insights'>('overview');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'maintenance' | 'inactive'>('all');
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Inject styles to disable scrolling
    const styleElement = document.createElement('style');
    styleElement.textContent = noScrollStyles;
    document.head.appendChild(styleElement);

    loadInitialData();

    // Cleanup styles on unmount
    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load enhanced sample data with AI insights
      const sampleVenues: Venue[] = [
        {
          id: '1',
          name: 'Narendra Modi Stadium',
          city: 'Ahmedabad',
          capacity: 132000,
          coordinates: { lat: 23.0225, lng: 72.5714 },
          timezone: 'Asia/Kolkata',
          established: 1982,
          pitchType: 'Red Soil',
          floodlights: true,
          drainageSystem: 'Sand-based',
          avgFirstInnings: 165,
          avgSecondInnings: 145,
          highestTotal: 239,
          lowestTotal: 85,
          lastMatch: '2024-05-29',
          upcomingMatch: '2025-03-15',
          status: 'active',
          aiInsights: {
            crowdPrediction: 95000,
            weatherImpact: 'medium',
            optimalConditions: ['Clear weather', 'Low humidity', 'Moderate temperature'],
            strategicRecommendations: [
              'Favor spinners in middle overs',
              'Dew factor expected in second innings',
              'Boundary fielding recommended'
            ],
            riskFactors: ['High humidity may affect bowling', 'Dew could impact second innings'],
            confidence: 87
          }
        },
        {
          id: '2',
          name: 'Eden Gardens',
          city: 'Kolkata',
          capacity: 66000,
          coordinates: { lat: 22.5645, lng: 88.3412 },
          timezone: 'Asia/Kolkata',
          established: 1864,
          pitchType: 'Traditional Red Soil',
          floodlights: true,
          drainageSystem: 'Improved with Super Sopper',
          avgFirstInnings: 155,
          avgSecondInnings: 140,
          highestTotal: 204,
          lowestTotal: 90,
          lastMatch: '2024-05-01',
          upcomingMatch: '2025-03-20',
          status: 'active',
          aiInsights: {
            crowdPrediction: 58000,
            weatherImpact: 'low',
            optimalConditions: ['Overcast conditions', 'Moderate breeze'],
            strategicRecommendations: [
              'Pacers expected to get early movement',
              'Spinners crucial in middle overs',
              'Traditional cricket conditions'
            ],
            riskFactors: ['Rain possibility', 'Variable bounce'],
            confidence: 92
          }
        }
      ];

      const sampleWeather: WeatherData[] = [
        {
          venueId: '1',
          temperature: 32,
          feelsLike: 35,
          humidity: 65,
          windSpeed: 12,
          windDirection: 180,
          pressure: 1010,
          visibility: 10,
          uvIndex: 8,
          condition: 'sunny',
          description: 'Clear skies with moderate humidity',
          timestamp: new Date().toISOString(),
          aiPrediction: {
            matchImpact: 'medium',
            pitchEffect: 'Dry pitch will favor batsmen initially, spinners later',
            dewFactor: 75,
            playingConditions: 'Excellent batting conditions with moderate humidity',
            recommendations: [
              'Teams winning toss might prefer to field first',
              'Spinners will be crucial in middle overs',
              'Dew might affect second innings bowling'
            ],
            confidence: 89
          }
        }
      ];

      const sampleConditions: MatchCondition[] = [
        {
          id: '1',
          venueId: '1',
          pitchReport: {
            hardness: 8,
            grassCoverage: 65,
            cracks: false,
            moisture: 15,
            expectedBehavior: 'Balanced surface with good pace and bounce',
            day1: 'Hard and dry, excellent for batting',
            day2: 'Slight wear, spinners come into play',
            day3: 'Cracks appearing, variable bounce'
          },
          outfieldCondition: 'Fast and dry',
          weatherForecast: 'Clear with moderate humidity',
          recommendedTeam: 'bat-first',
          aiAnalysis: {
            battingConditions: 'Excellent with true bounce and pace',
            bowlingConditions: 'Pacers may get early movement, spinners effective later',
            fieldingConditions: 'Fast outfield allows quick boundary movement',
            strategicAdvice: [
              'Bat first if dew expected',
              'Fast bowlers exploit early conditions',
              'Spinners crucial in middle overs'
            ],
            keyFactors: ['Dew factor', 'Pitch wear', 'Wind conditions'],
            winProbability: { bat: 65, bowl: 35 },
            confidence: 91
          },
          lastUpdated: new Date().toISOString()
        }
      ];

      setVenues(sampleVenues);
      setWeatherData(sampleWeather);
      setMatchConditions(sampleConditions);
    } catch (error) {
      console.error('Error loading data:', error);
      addNotification('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  }, []);

  const syncAllData = async () => {
    setSyncing(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
      addNotification('All data synced successfully');
    } catch (error) {
      addNotification('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const generateAIInsights = async () => {
    setAiGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      addNotification('AI insights generated successfully');
    } catch (error) {
      addNotification('AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          venue.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || venue.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'sunny';
      case 'cloudy': return 'cloudy';
      case 'partly-cloudy': return 'partly-cloudy';
      case 'overcast': return 'overcast';
      case 'rainy': return 'rainy';
      default: return 'sunny';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'maintenance': return 'text-yellow-400 bg-yellow-400/20';
      case 'inactive': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Advanced Header */}
      <motion.header
        className="bg-black/40 backdrop-blur-xl border-b border-blue-500/20 flex-shrink-0"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Brain className="text-blue-400" />
                AI Matchday Command Center
              </h1>
              <p className="text-gray-300">Advanced venue and weather management with AI-powered insights</p>
            </div>
            <div className="flex gap-3">
              <motion.button
                onClick={syncAllData}
                disabled={syncing}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync All'}
              </motion.button>
              <motion.button
                onClick={generateAIInsights}
                disabled={aiGenerating}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className={`w-4 h-4 ${aiGenerating ? 'animate-pulse' : ''}`} />
                {aiGenerating ? 'AI Analyzing...' : 'AI Insights'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={index}
            className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3 }}
          >
            {notification}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Advanced Navigation */}
      <div className="px-6 py-4 flex-shrink-0">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: <Gauge className="w-4 h-4" /> },
            { id: 'venues', label: 'Venues', icon: <MapPin className="w-4 h-4" /> },
            { id: 'weather', label: 'Weather', icon: <Cloud className="w-4 h-4" /> },
            { id: 'conditions', label: 'Conditions', icon: <Activity className="w-4 h-4" /> },
            { id: 'ai-insights', label: 'AI Insights', icon: <Brain className="w-4 h-4" /> }
          ].map((view) => (
            <motion.button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeView === view.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {view.icon}
              {view.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content Area - Scrollable within viewport */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Overview Dashboard */}
        {activeView === 'overview' && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Active Venues</h3>
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {venues.filter(v => v.status === 'active').length}
              </div>
              <div className="text-sm text-gray-400">Ready for matches</div>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-green-400/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Weather Updates</h3>
                <Cloud className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">
                {weatherData.length}
              </div>
              <div className="text-sm text-gray-400">Real-time data</div>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">AI Predictions</h3>
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {matchConditions.length}
              </div>
              <div className="text-sm text-gray-400">Match conditions analyzed</div>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-yellow-400/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">System Status</h3>
                <Activity className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">
                Online
              </div>
              <div className="text-sm text-gray-400">All systems operational</div>
            </motion.div>
          </motion.div>
        )}

        {/* Venues Management */}
        {activeView === 'venues' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Search and Filters */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search venues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800/50 text-white rounded-lg pl-10 pr-4 py-3 border border-blue-400/20"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-slate-800/50 text-white rounded-lg px-4 py-3 border border-blue-400/20"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
                <motion.button
                  onClick={() => setShowVenueModal(true)}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={20} />
                  Add Venue
                </motion.button>
              </div>
            </div>

            {/* Venues Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVenues.map((venue) => (
                <motion.div
                  key={venue.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20"
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{venue.name}</h3>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <MapPin size={14} />
                        {venue.city}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(venue.status)}`}>
                      {venue.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Capacity:</span>
                      <span className="text-white">{venue.capacity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Pitch:</span>
                      <span className="text-white">{venue.pitchType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Avg Score:</span>
                      <span className="text-white">{venue.avgFirstInnings}/{venue.avgSecondInnings}</span>
                    </div>
                  </div>

                  {/* AI Insights Preview */}
                  {venue.aiInsights && (
                    <div className="bg-purple-600/10 rounded-lg p-3 border border-purple-400/20 mb-4">
                      <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                        <Brain size={14} />
                        AI Insights
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-purple-400">Crowd:</span>
                          <span className="text-white ml-1">{venue.aiInsights.crowdPrediction.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-purple-400">Impact:</span>
                          <span className="text-white ml-1">{venue.aiInsights.weatherImpact}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setSelectedVenue(venue)}
                      className="flex-1 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Details
                    </motion.button>
                    <motion.button
                      onClick={() => setEditingVenue(venue)}
                      className="flex-1 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Weather Dashboard */}
        {activeView === 'weather' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {weatherData.map((weather) => (
                <motion.div
                  key={weather.venueId}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Weather Conditions</h3>
                    {getWeatherIcon(weather.condition)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Thermometer className="w-5 h-5 text-red-400" />
                        <div>
                          <div className="text-2xl font-bold text-white">{weather.temperature}°C</div>
                          <div className="text-sm text-gray-400">Temperature</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Droplets className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-lg font-semibold text-white">{weather.humidity}%</div>
                          <div className="text-sm text-gray-400">Humidity</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Wind className="w-5 h-5 text-green-400" />
                        <div>
                          <div className="text-lg font-semibold text-white">{weather.windSpeed} km/h</div>
                          <div className="text-sm text-gray-400">Wind Speed</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-purple-400" />
                        <div>
                          <div className="text-lg font-semibold text-white">{weather.visibility} km</div>
                          <div className="text-sm text-gray-400">Visibility</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Predictions */}
                  <div className="bg-blue-600/10 rounded-lg p-4 border border-blue-400/20">
                    <h4 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      AI Predictions
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400">Match Impact:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          weather.aiPrediction.matchImpact === 'high' ? 'bg-red-600/30 text-red-300' :
                          weather.aiPrediction.matchImpact === 'medium' ? 'bg-yellow-600/30 text-yellow-300' :
                          'bg-green-600/30 text-green-300'
                        }`}>
                          {weather.aiPrediction.matchImpact.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="text-blue-400">Pitch Effect:</span> {weather.aiPrediction.pitchEffect}
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="text-blue-400">Dew Factor:</span> {weather.aiPrediction.dewFactor}%
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="text-blue-400">Confidence:</span> {weather.aiPrediction.confidence}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Match Conditions */}
        {activeView === 'conditions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-6">
              {matchConditions.map((condition) => (
                <motion.div
                  key={condition.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-green-400/20"
                  whileHover={{ scale: 1.01 }}
                >
                  <h3 className="text-xl font-bold text-white mb-6">Match Conditions Analysis</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-green-300">Pitch Report</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Hardness:</span>
                          <span className="text-white">{condition.pitchReport.hardness}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Grass Coverage:</span>
                          <span className="text-white">{condition.pitchReport.grassCoverage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Moisture:</span>
                          <span className="text-white">{condition.pitchReport.moisture}%</span>
                        </div>
                        <div className="text-gray-300 mt-2">
                          <span className="text-gray-400">Expected:</span> {condition.pitchReport.expectedBehavior}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-blue-300">AI Analysis</h4>
                      <div className="space-y-3 text-sm">
                        <div className="text-gray-300">
                          <span className="text-blue-400">Batting:</span> {condition.aiAnalysis.battingConditions}
                        </div>
                        <div className="text-gray-300">
                          <span className="text-blue-400">Bowling:</span> {condition.aiAnalysis.bowlingConditions}
                        </div>
                        <div className="text-gray-300">
                          <span className="text-blue-400">Fielding:</span> {condition.aiAnalysis.fieldingConditions}
                        </div>
                        <div className="flex justify-between mt-3">
                          <span className="text-blue-400">Win Probability:</span>
                          <div className="flex gap-2">
                            <span className="text-white">Bat: {condition.aiAnalysis.winProbability.bat}%</span>
                            <span className="text-white">Bowl: {condition.aiAnalysis.winProbability.bowl}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Insights */}
        {activeView === 'ai-insights' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="text-purple-400" />
                  Predictive Analytics
                </h3>
                <div className="space-y-4">
                  <div className="bg-purple-600/10 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-purple-300 mb-3">Match Outcomes</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-400">Bat First Win Rate:</span>
                        <span className="text-white font-bold">68%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-400">Average Total:</span>
                        <span className="text-white font-bold">165 runs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-400">High Score Probability:</span>
                        <span className="text-white font-bold">23%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-yellow-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Target className="text-yellow-400" />
                  Strategic Recommendations
                </h3>
                <div className="space-y-3">
                  {[
                    'Consider venue weather patterns when selecting playing XI',
                    'Monitor pitch wear throughout the match',
                    'Adapt field placements based on conditions',
                    'Use AI insights for toss decisions'
                  ].map((rec, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-yellow-600/10 rounded-lg"
                      whileHover={{ scale: 1.02 }}
                    >
                      <AlertTriangle className="w-4 h-4 text-yellow-400 mt-1" />
                      <span className="text-sm text-gray-300">{rec}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Venue Modal */}
      <AnimatePresence>
        {showVenueModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Add New Venue</h3>
                <button onClick={() => setShowVenueModal(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Venue Name" className="p-3 bg-slate-700 text-white rounded-lg" />
                <input placeholder="City" className="p-3 bg-slate-700 text-white rounded-lg" />
                <input placeholder="Capacity" type="number" className="p-3 bg-slate-700 text-white rounded-lg" />
                <input placeholder="Latitude" type="number" className="p-3 bg-slate-700 text-white rounded-lg" />
                <input placeholder="Longitude" type="number" className="p-3 bg-slate-700 text-white rounded-lg" />
                <select className="p-3 bg-slate-700 text-white rounded-lg">
                  <option>Red Soil</option>
                  <option>Black Soil</option>
                  <option>Mixed</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowVenueModal(false)} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  Cancel
                </button>
                <motion.button
                  onClick={() => setShowVenueModal(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Save size={20} />
                  Save Venue
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}