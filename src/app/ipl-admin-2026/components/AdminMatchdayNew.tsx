'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, MapPin, Thermometer, Wind, Droplets, Eye, Edit, Trash2, Plus, Save, X,
  Cloud, Sun, CloudRain, CloudSnow, Activity, Zap, TrendingUp, AlertCircle,
  RefreshCw, Download, Upload, Settings, Globe, Clock, BarChart3, Target,
  Sparkles, Brain, Database, Wifi, Satellite
} from 'lucide-react';

// Enhanced interfaces with AI and online data features
interface VenueInfo {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  capacity: number;
  pitchType: string;
  floodlights: boolean;
  dimensions: string;
  established: number;
  timezone: string;
  coordinates: { lat: number; lng: number };
  elevation: number;
  avgFirstInnings: number;
  avgChasing: number;
  homeTeam?: string;
  lastUpdated: string;
  weatherData?: WeatherData;
  aiInsights?: VenueAIInsights;
}

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'overcast' | 'partly-cloudy' | 'stormy';
  description: string;
  lastUpdated: string;
  forecast: WeatherForecast[];
  aiPrediction?: WeatherAI;
}

interface WeatherForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

interface WeatherAI {
  matchImpact: 'low' | 'medium' | 'high';
  pitchEffect: string;
  dewFactor: number;
  playingConditions: string;
  recommendations: string[];
  confidence: number;
}

interface MatchConditions {
  id: string;
  venueId: string;
  matchId: string;
  matchDate: string;
  teams: { home: string; away: string };
  pitchReport: string;
  outfieldCondition: string;
  expectedDew: boolean;
  avgFirstInnings: number;
  avgChasing: number;
  tossImpact: string;
  weatherImpact: string;
  aiAnalysis?: MatchAI;
  lastUpdated: string;
}

interface MatchAI {
  winProbability: { home: number; away: number };
  keyFactors: string[];
  pitchEvolution: string;
  weatherInfluence: number;
  strategicRecommendations: string[];
  playerConditions: string[];
  confidence: number;
}

interface VenueAIInsights {
  pitchCharacteristics: {
    pace: 'slow' | 'medium' | 'fast';
    bounce: 'low' | 'medium' | 'high';
    turn: 'minimal' | 'moderate' | 'high';
  };
  historicalPatterns: {
    dayNightDifference: string;
    seasonTrends: string;
    scorePatterns: string;
  };
  weatherCorrelations: {
    temperature: number;
    humidity: number;
    wind: number;
  };
  optimization: {
    bestBattingTime: string;
    bestBowlingTime: string;
    tossDecision: string;
  };
}

export default function AdminMatchdayNew() {
  const [venues, setVenues] = useState<VenueInfo[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [matchConditions, setMatchConditions] = useState<MatchConditions[]>([]);
  const [editingVenue, setEditingVenue] = useState<VenueInfo | null>(null);
  const [editingWeather, setEditingWeather] = useState<WeatherData | null>(null);
  const [editingConditions, setEditingConditions] = useState<MatchConditions | null>(null);
  const [activeTab, setActiveTab] = useState<'venues' | 'weather' | 'conditions' | 'ai-insights'>('venues');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<VenueInfo | null>(null);

  // Initialize with real IPL 2025 venues data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Real IPL 2025 venues with enhanced data
      const iplVenues: VenueInfo[] = [
        {
          id: '1',
          name: 'Narendra Modi Stadium',
          city: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          capacity: 132000,
          pitchType: 'Balanced',
          floodlights: true,
          dimensions: '180m x 150m',
          established: 1982,
          timezone: 'Asia/Kolkata',
          coordinates: { lat: 23.0225, lng: 72.5714 },
          elevation: 49,
          avgFirstInnings: 165,
          avgChasing: 158,
          homeTeam: 'Gujarat Titans',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Eden Gardens',
          city: 'Kolkata',
          state: 'West Bengal',
          country: 'India',
          capacity: 66000,
          pitchType: 'Spin-friendly',
          floodlights: true,
          dimensions: '157m x 135m',
          established: 1864,
          timezone: 'Asia/Kolkata',
          coordinates: { lat: 22.5645, lng: 88.3412 },
          elevation: 6,
          avgFirstInnings: 160,
          avgChasing: 155,
          homeTeam: 'Kolkata Knight Riders',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Wankhede Stadium',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          capacity: 33000,
          pitchType: 'Batting-friendly',
          floodlights: true,
          dimensions: '150m x 140m',
          established: 1974,
          timezone: 'Asia/Kolkata',
          coordinates: { lat: 18.9417, lng: 72.8258 },
          elevation: 14,
          avgFirstInnings: 175,
          avgChasing: 168,
          homeTeam: 'Mumbai Indians',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '4',
          name: 'M. Chinnaswamy Stadium',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          capacity: 38000,
          pitchType: 'High-scoring',
          floodlights: true,
          dimensions: '160m x 140m',
          established: 1969,
          timezone: 'Asia/Kolkata',
          coordinates: { lat: 12.9784, lng: 77.5994 },
          elevation: 920,
          avgFirstInnings: 180,
          avgChasing: 172,
          homeTeam: 'Royal Challengers Bangalore',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '5',
          name: 'MA Chidambaram Stadium',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          capacity: 50000,
          pitchType: 'Spin-friendly',
          floodlights: true,
          dimensions: '150m x 125m',
          established: 1916,
          timezone: 'Asia/Kolkata',
          coordinates: { lat: 13.0624, lng: 80.2411 },
          elevation: 6,
          avgFirstInnings: 155,
          avgChasing: 148,
          homeTeam: 'Chennai Super Kings',
          lastUpdated: new Date().toISOString()
        }
      ];

      setVenues(iplVenues);
      
      // Load sample weather data
      const sampleWeather: WeatherData[] = iplVenues.map(venue => ({
        temperature: 28 + Math.random() * 10,
        feelsLike: 30 + Math.random() * 8,
        humidity: 40 + Math.random() * 40,
        windSpeed: 5 + Math.random() * 15,
        windDirection: Math.random() * 360,
        pressure: 1000 + Math.random() * 20,
        visibility: 8 + Math.random() * 4,
        uvIndex: 5 + Math.random() * 5,
        condition: ['sunny', 'cloudy', 'partly-cloudy'][Math.floor(Math.random() * 3)] as any,
        description: 'Partly cloudy with moderate humidity',
        lastUpdated: new Date().toISOString(),
        forecast: generateSampleForecast(),
        aiPrediction: generateAIWeatherPrediction()
      }));

      setWeatherData(sampleWeather);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleForecast = (): WeatherForecast[] => {
    return Array.from({ length: 5 }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxTemp: 30 + Math.random() * 10,
      minTemp: 20 + Math.random() * 8,
      condition: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
      precipitation: Math.random() * 50,
      humidity: 40 + Math.random() * 40,
      windSpeed: 5 + Math.random() * 15
    }));
  };

  const generateAIWeatherPrediction = (): WeatherAI => ({
    matchImpact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
    pitchEffect: 'Dry pitch will favor spinners as the match progresses',
    dewFactor: Math.random() * 100,
    playingConditions: 'Excellent batting conditions expected',
    recommendations: [
      'Teams winning toss might prefer to field first',
      'Spinners will be crucial in middle overs',
      'Dew might affect second innings bowling'
    ],
    confidence: 75 + Math.random() * 20
  });

  const syncWeatherData = async () => {
    setSyncing(true);
    try {
      // Simulate API call to weather service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update weather data with fresh information
      const updatedWeather = weatherData.map(weather => ({
        ...weather,
        temperature: weather.temperature + (Math.random() - 0.5) * 2,
        humidity: Math.max(20, Math.min(100, weather.humidity + (Math.random() - 0.5) * 10)),
        lastUpdated: new Date().toISOString()
      }));
      
      setWeatherData(updatedWeather);
    } catch (error) {
      console.error('Error syncing weather data:', error);
    } finally {
      setSyncing(false);
    }
  };

  const generateAIInsights = async (venueId: string) => {
    setAiGenerating(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const venue = venues.find(v => v.id === venueId);
      if (venue) {
        const aiInsights: VenueAIInsights = {
          pitchCharacteristics: {
            pace: ['slow', 'medium', 'fast'][Math.floor(Math.random() * 3)] as any,
            bounce: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
            turn: ['minimal', 'moderate', 'high'][Math.floor(Math.random() * 3)] as any
          },
          historicalPatterns: {
            dayNightDifference: 'Night matches tend to have 15% higher scores due to dew',
            seasonTrends: 'March-April shows batting-friendly conditions',
            scorePatterns: 'First innings average: 165-175'
          },
          weatherCorrelations: {
            temperature: 0.7,
            humidity: 0.6,
            wind: 0.3
          },
          optimization: {
            bestBattingTime: 'Evening session (6-9 PM)',
            bestBowlingTime: 'Morning session (10-1 PM)',
            tossDecision: 'Field first due to expected dew'
          }
        };

        const updatedVenues = venues.map(v => 
          v.id === venueId ? { ...v, aiInsights } : v
        );
        setVenues(updatedVenues);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="text-yellow-400" />;
      case 'cloudy': return <Cloud className="text-gray-400" />;
      case 'rainy': return <CloudRain className="text-blue-400" />;
      case 'partly-cloudy': return <Cloud className="text-gray-300" />;
      default: return <Sun className="text-yellow-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="px-6">
      <div className="mb-8 pt-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <Activity className="text-blue-400" />
              AI-Powered Match Day Admin
            </h1>
            <p className="text-gray-300 max-w-3xl">
              Advanced venue management with real-time weather data, AI predictions, and intelligent insights for IPL 2025 matches
            </p>
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={syncWeatherData}
              disabled={syncing}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync Weather
            </motion.button>
            <motion.button
              onClick={() => {/* Export functionality */}}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-4 h-4" />
              Export Data
            </motion.button>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['venues', 'weather', 'conditions', 'ai-insights'].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab === 'venues' && <MapPin size={18} />}
            {tab === 'weather' && <Cloud size={18} />}
            {tab === 'conditions' && <Activity size={18} />}
            {tab === 'ai-insights' && <Brain size={18} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </motion.button>
        ))}
      </div>

      {/* Venues Tab with AI Integration */}
      {activeTab === 'venues' && (
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-blue-400/20">
            <div className="flex justify-between items-center mb-6 pt-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MapPin className="text-blue-400" />
                Venue Management ({venues.length} venues)
              </h2>
              <motion.button
                onClick={() => setEditingVenue({
                  id: '',
                  name: '',
                  city: '',
                  state: '',
                  country: 'India',
                  capacity: 0,
                  pitchType: '',
                  floodlights: false,
                  dimensions: '',
                  established: new Date().getFullYear(),
                  timezone: 'Asia/Kolkata',
                  coordinates: { lat: 0, lng: 0 },
                  elevation: 0,
                  avgFirstInnings: 0,
                  avgChasing: 0,
                  lastUpdated: new Date().toISOString()
                })}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={20} />
                Add Venue
              </motion.button>
            </div>

            <div className="grid gap-6 pb-6">
              {venues.map((venue) => (
                <motion.div
                  key={venue.id}
                  className="bg-white/5 rounded-xl p-6 border border-blue-400/10 hover:border-blue-400/30 transition-all"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-white">{venue.name}</h3>
                        {venue.aiInsights && (
                          <span className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs flex items-center gap-1">
                            <Sparkles size={10} />
                            AI Enhanced
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-300 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-blue-400" />
                          {venue.city}, {venue.state}
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe size={16} className="text-green-400" />
                          {venue.country}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-yellow-400" />
                          Est. {venue.established}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-purple-400" />
                          {venue.capacity.toLocaleString()} seats
                        </div>
                        <div className="flex items-center gap-2">
                          <Target size={16} className="text-red-400" />
                          {venue.pitchType} pitch
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-yellow-400" />
                          {venue.floodlights ? 'Floodlights' : 'No lights'}
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 size={16} className="text-blue-400" />
                          1st: {venue.avgFirstInnings} | Chase: {venue.avgChasing}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" />
                          {venue.timezone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Satellite size={16} className="text-green-400" />
                          {venue.coordinates.lat.toFixed(4)}, {venue.coordinates.lng.toFixed(4)}
                        </div>
                      </div>

                      {/* AI Insights Preview */}
                      {venue.aiInsights && (
                        <div className="bg-purple-600/10 rounded-lg p-4 border border-purple-400/20">
                          <h4 className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                            <Brain size={16} />
                            AI Insights
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                            <div>
                              <span className="text-purple-400">Pitch Pace:</span> {venue.aiInsights.pitchCharacteristics.pace}
                            </div>
                            <div>
                              <span className="text-purple-400">Bounce:</span> {venue.aiInsights.pitchCharacteristics.bounce}
                            </div>
                            <div>
                              <span className="text-purple-400">Turn:</span> {venue.aiInsights.pitchCharacteristics.turn}
                            </div>
                            <div>
                              <span className="text-purple-400">Best Batting:</span> {venue.aiInsights.optimization.bestBattingTime}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <motion.button
                        onClick={() => setSelectedVenue(venue)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Eye size={16} />
                      </motion.button>
                      <motion.button
                        onClick={() => setEditingVenue(venue)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit size={16} />
                      </motion.button>
                      <motion.button
                        onClick={() => generateAIInsights(venue.id)}
                        disabled={aiGenerating}
                        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Brain size={16} />
                      </motion.button>
                      <motion.button
                        onClick={() => {/* Delete functionality */}}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weather Tab with Real-time Data */}
      {activeTab === 'weather' && (
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-blue-400/20">
            <div className="flex justify-between items-center mb-6 pt-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Cloud className="text-blue-400" />
                Real-time Weather Intelligence
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Wifi className="w-4 h-4" />
                Last synced: {new Date().toLocaleTimeString()}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
              {venues.map((venue) => {
                const weather = weatherData.find(w => venue.id === '1'); // Simplified for demo
                return (
                  <motion.div
                    key={venue.id}
                    className="bg-white/5 rounded-xl p-6 border border-blue-400/10"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-white">{venue.name}</h3>
                      {weather && getWeatherIcon(weather.condition)}
                    </div>

                    {weather && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-blue-600/20 rounded-lg p-3">
                            <Thermometer className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                            <div className="text-white font-bold">{weather.temperature.toFixed(1)}°C</div>
                            <div className="text-gray-400 text-xs">Feels like {weather.feelsLike.toFixed(1)}°C</div>
                          </div>
                          <div className="bg-green-600/20 rounded-lg p-3">
                            <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                            <div className="text-white font-bold">{weather.humidity.toFixed(0)}%</div>
                            <div className="text-gray-400 text-xs">Humidity</div>
                          </div>
                          <div className="bg-purple-600/20 rounded-lg p-3">
                            <Wind className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                            <div className="text-white font-bold">{weather.windSpeed.toFixed(1)} km/h</div>
                            <div className="text-gray-400 text-xs">Wind Speed</div>
                          </div>
                        </div>

                        {/* AI Weather Prediction */}
                        {weather.aiPrediction && (
                          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-4 border border-purple-400/20">
                            <h4 className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                              <Brain size={16} />
                              AI Match Impact Analysis
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(weather.aiPrediction.matchImpact)}`}>
                                Impact: {weather.aiPrediction.matchImpact.toUpperCase()}
                              </span>
                              <span className="text-gray-400 text-xs">
                                Confidence: {weather.aiPrediction.confidence.toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm mb-2">{weather.aiPrediction.pitchEffect}</p>
                            <div className="text-xs text-gray-400">
                              <div>Dew Factor: {weather.aiPrediction.dewFactor.toFixed(0)}%</div>
                              <div className="mt-1">
                                <strong>Recommendations:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {weather.aiPrediction.recommendations.slice(0, 2).map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 5-Day Forecast */}
                        <div className="mt-4">
                          <h4 className="text-gray-300 font-semibold mb-2 text-sm">5-Day Forecast</h4>
                          <div className="grid grid-cols-5 gap-2">
                            {weather.forecast.slice(0, 5).map((day, i) => (
                              <div key={i} className="text-center bg-white/5 rounded p-2">
                                <div className="text-xs text-gray-400">
                                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                                </div>
                                <div className="text-white font-bold text-sm">
                                  {day.maxTemp.toFixed(0)}°
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {day.minTemp.toFixed(0)}°
                                </div>
                                {day.precipitation > 0 && (
                                  <div className="text-blue-400 text-xs">
                                    {day.precipitation.toFixed(0)}mm
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Match Conditions Tab */}
      {activeTab === 'conditions' && (
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-blue-400/20">
            <div className="flex justify-between items-center mb-6 pt-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="text-blue-400" />
                Match Conditions Analysis
              </h2>
              <motion.button
                onClick={() => setEditingConditions({
                  id: '',
                  venueId: '',
                  matchId: '',
                  matchDate: new Date().toISOString().split('T')[0],
                  teams: { home: '', away: '' },
                  pitchReport: '',
                  outfieldCondition: '',
                  expectedDew: false,
                  avgFirstInnings: 0,
                  avgChasing: 0,
                  tossImpact: '',
                  weatherImpact: '',
                  lastUpdated: new Date().toISOString()
                })}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={20} />
                Add Match Conditions
              </motion.button>
            </div>

            <div className="grid gap-6 pb-6">
              {/* Sample match conditions with AI analysis */}
              <motion.div
                className="bg-white/5 rounded-xl p-6 border border-blue-400/10"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      GT vs MI - Match 23
                    </h3>
                    <div className="flex items-center gap-4 text-gray-300 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        March 25, 2025
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        Narendra Modi Stadium
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setEditingConditions({
                        id: '1',
                        venueId: '1',
                        matchId: 'GTvsMI_23',
                        matchDate: '2025-03-25',
                        teams: { home: 'Gujarat Titans', away: 'Mumbai Indians' },
                        pitchReport: 'Balanced surface with even bounce. Expected to stay true throughout the match.',
                        outfieldCondition: 'Fast and well-maintained outfield with minimal grass cover.',
                        expectedDew: true,
                        avgFirstInnings: 175,
                        avgChasing: 168,
                        tossImpact: 'Teams might prefer to chase due to dew factor in evening.',
                        weatherImpact: 'Clear skies expected. Temperature around 28°C with low humidity.',
                        lastUpdated: new Date().toISOString()
                      })}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit size={16} />
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-gray-400 font-semibold mb-2">Pitch Report</h4>
                      <p className="text-gray-300 text-sm">
                        Balanced surface with even bounce. Expected to stay true throughout the match. 
                        Pacers might get some movement early, while spinners could come into play in the middle overs.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 font-semibold mb-2">Outfield Condition</h4>
                      <p className="text-gray-300 text-sm">
                        Fast and well-maintained outfield with minimal grass cover. 
                        Boundaries will be easy to come by for well-timed shots.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-600/20 rounded-lg p-3">
                        <div className="text-blue-300 font-semibold">Avg 1st Innings</div>
                        <div className="text-white font-bold text-lg">175</div>
                      </div>
                      <div className="bg-green-600/20 rounded-lg p-3">
                        <div className="text-green-300 font-semibold">Avg Chasing</div>
                        <div className="text-white font-bold text-lg">168</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* AI Match Analysis */}
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-400/20">
                      <h4 className="text-purple-300 font-semibold mb-3 flex items-center gap-2">
                        <Brain size={16} />
                        AI Match Analysis
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Win Probability:</span>
                          <div className="flex gap-4">
                            <span className="text-blue-300">GT: 52%</span>
                            <span className="text-green-300">MI: 48%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-300">Key Factors:</span>
                          <ul className="text-gray-400 mt-1 list-disc list-inside space-y-1">
                            <li>Dew factor in second innings</li>
                            <li>Strong batting lineup of both teams</li>
                            <li>Pace-friendly conditions for fast bowlers</li>
                          </ul>
                        </div>
                        <div>
                          <span className="text-gray-300">Strategic Recommendations:</span>
                          <ul className="text-gray-400 mt-1 list-disc list-inside space-y-1">
                            <li>Field first if dew is expected</li>
                            <li>Use pace attack in powerplay</li>
                            <li>Target 180+ for competitive total</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'ai-insights' && (
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-blue-400/20">
            <div className="mb-6 pt-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                <Brain className="text-purple-400" />
                AI-Powered Insights & Predictions
              </h2>
              <p className="text-gray-300">
                Advanced machine learning analysis for venue optimization, weather impact, and match predictions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
              {/* Venue Performance Analysis */}
              <div className="bg-white/5 rounded-xl p-6 border border-purple-400/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-purple-400" />
                  Venue Performance Analysis
                </h3>
                <div className="space-y-4">
                  <div className="bg-purple-600/10 rounded-lg p-4">
                    <h4 className="text-purple-300 font-semibold mb-2">Top Performing Venues</h4>
                    <div className="space-y-2">
                      {venues.slice(0, 3).map((venue, index) => (
                        <div key={venue.id} className="flex justify-between items-center">
                          <span className="text-gray-300">{index + 1}. {venue.name}</span>
                          <span className="text-purple-300 font-bold">
                            {((venue.avgFirstInnings + venue.avgChasing) / 2).toFixed(0)} avg score
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-purple-600/10 rounded-lg p-4">
                    <h4 className="text-purple-300 font-semibold mb-2">Pitch Type Distribution</h4>
                    <div className="space-y-2">
                      {['Batting-friendly', 'Balanced', 'Spin-friendly'].map((type, index) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-gray-300">{type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-purple-400 h-2 rounded-full"
                                style={{ width: `${[40, 35, 25][index]}%` }}
                              />
                            </div>
                            <span className="text-purple-300 text-sm">{[40, 35, 25][index]}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Impact Analysis */}
              <div className="bg-white/5 rounded-xl p-6 border border-blue-400/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Cloud className="text-blue-400" />
                  Weather Impact Analysis
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-600/10 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">Weather Patterns</h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Average Temperature:</span>
                        <span className="text-blue-300">28°C - 35°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Humidity Range:</span>
                        <span className="text-blue-300">40% - 80%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precipitation Risk:</span>
                        <span className="text-blue-300">15% (March-April)</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-600/10 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">Match Impact Predictions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300">Low impact days: 45%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span className="text-gray-300">Medium impact days: 35%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span className="text-gray-300">High impact days: 20%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Predictions Dashboard */}
              <div className="bg-white/5 rounded-xl p-6 border border-green-400/20 lg:col-span-2">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="text-green-400" />
                  AI Predictions Dashboard
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-600/10 rounded-lg p-4">
                    <h4 className="text-green-300 font-semibold mb-2">Toss Decisions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Field First:</span>
                        <span className="text-green-300">65%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Bat First:</span>
                        <span className="text-green-300">35%</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Based on dew patterns and pitch analysis
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-600/10 rounded-lg p-4">
                    <h4 className="text-yellow-300 font-semibold mb-2">Score Predictions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">First Innings:</span>
                        <span className="text-yellow-300">165-185</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Chasing Target:</span>
                        <span className="text-yellow-300">150-175</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        AI-powered statistical analysis
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-600/10 rounded-lg p-4">
                    <h4 className="text-red-300 font-semibold mb-2">Key Factors</h4>
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-300">• Dew Factor (30%)</div>
                      <div className="text-gray-300">• Pitch Type (25%)</div>
                      <div className="text-gray-300">• Weather (20%)</div>
                      <div className="text-gray-300">• Team Strength (25%)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modals */}
      {editingVenue && (
        <VenueEditModal
          venue={editingVenue}
          onSave={(venue) => {
            if (editingVenue.id) {
              setVenues(venues.map(v => v.id === venue.id ? venue : v));
            } else {
              setVenues([...venues, { ...venue, id: Date.now().toString() }]);
            }
            setEditingVenue(null);
          }}
          onCancel={() => setEditingVenue(null)}
        />
      )}
    </div>
  );
}

// Enhanced Venue Edit Modal
function VenueEditModal({ venue, onSave, onCancel }: {
  venue: VenueInfo;
  onSave: (venue: VenueInfo) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(venue);

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-slate-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-blue-400" />
            {venue.id ? 'Edit Venue' : 'Add New Venue'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Venue Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="text"
            placeholder="State"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="text"
            placeholder="Country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="number"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="text"
            placeholder="Pitch Type"
            value={formData.pitchType}
            onChange={(e) => setFormData({ ...formData, pitchType: e.target.value })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="text"
            placeholder="Dimensions"
            value={formData.dimensions}
            onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="number"
            placeholder="Established Year"
            value={formData.established}
            onChange={(e) => setFormData({ ...formData, established: parseInt(e.target.value) })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="text"
            placeholder="Timezone"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="number"
            placeholder="Latitude"
            value={formData.coordinates.lat}
            onChange={(e) => setFormData({ ...formData, coordinates: { ...formData.coordinates, lat: parseFloat(e.target.value) } })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="number"
            placeholder="Longitude"
            value={formData.coordinates.lng}
            onChange={(e) => setFormData({ ...formData, coordinates: { ...formData.coordinates, lng: parseFloat(e.target.value) } })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="number"
            placeholder="Elevation (m)"
            value={formData.elevation}
            onChange={(e) => setFormData({ ...formData, elevation: parseInt(e.target.value) })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="number"
            placeholder="Avg First Innings"
            value={formData.avgFirstInnings}
            onChange={(e) => setFormData({ ...formData, avgFirstInnings: parseInt(e.target.value) })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="number"
            placeholder="Avg Chasing Score"
            value={formData.avgChasing}
            onChange={(e) => setFormData({ ...formData, avgChasing: parseInt(e.target.value) })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={formData.floodlights}
            onChange={(e) => setFormData({ ...formData, floodlights: e.target.checked })}
            className="w-4 h-4"
          />
          <label className="text-white">Floodlights Available</label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
          <motion.button
            onClick={() => onSave(formData)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Save size={16} />
            Save Venue
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
