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
import { useLeague } from '@/contexts/LeagueContext';
import { weatherService, VenueWeatherData } from '@/lib/weatherService';

// Add global styles to disable scrolling
// Removed noScrollStyles to allow proper scrolling

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
  lastUpdated: string;
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
  const { currentLeague, isWPL } = useLeague();
  console.log('AdminMatchdayAdvanced - currentLeague:', currentLeague, 'isWPL:', isWPL);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [matchConditions, setMatchConditions] = useState<MatchCondition[]>([]);
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'venues' | 'weather' | 'conditions' | 'ai-insights'>('overview');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'maintenance' | 'inactive'>('all');
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueForm, setVenueForm] = useState({
    name: '',
    city: '',
    capacity: '',
    latitude: '',
    longitude: '',
    pitchType: 'Red Soil'
  });
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isWPL) return;

    refreshWeatherData();

    const weatherInterval = setInterval(() => {
      refreshWeatherData();
    }, 12 * 60 * 60 * 1000); // 12 hours in milliseconds

    return () => clearInterval(weatherInterval);
  }, [isWPL]);

  const getVenueName = (venueId: string) => {
    const venueNames: Record<string, string> = {
      'wpl-dy-patil': 'Dr. DY Patil Sports Academy, Navi Mumbai',
      'wpl-bca-stadium': 'BCA Stadium, Kotambi (Vadodara)',
      
      // IPL venues (matching matches page)
      'wankhede': 'Wankhede Stadium, Mumbai',
      'chennai': 'M. A. Chidambaram Stadium, Chennai',
      'bengaluru': 'M. Chinnaswamy Stadium, Bengaluru',
      'kolkata': 'Eden Gardens, Kolkata',
      'delhi': 'Arun Jaitley Stadium, Delhi',
      'jaipur': 'Sawai Mansingh Stadium, Jaipur',
      'ahmedabad': 'Narendra Modi Stadium, Ahmedabad',
      'hyderabad': 'Rajiv Gandhi International Stadium, Hyderabad',
      'mohali': 'Punjab Cricket Association Stadium, Mohali',
      'dharamsala': 'Himachal Pradesh Cricket Association Stadium, Dharamsala',
      'visakhapatnam': 'Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium, Visakhapatnam',
      'lucknow': 'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow',
      'pune': 'Maharashtra Cricket Association Stadium, Pune',
      'mullanpur': 'Maharaja Yadavindra Singh International Cricket Stadium, Mullanpur',
      'guwahati': 'Barsapara Cricket Stadium, Guwahati',
      'indore': 'Holkar Cricket Stadium, Indore',
      'ranchi': 'JSCA International Stadium Complex, Ranchi',
      'kanpur': 'Green Park, Kanpur',
      'cuttack': 'Barabati Stadium, Cuttack',
      'barsapara': 'ACA Stadium, Barsapara',
      
      // Legacy IDs for compatibility
      '1': 'Narendra Modi Stadium, Ahmedabad',
      '2': 'Eden Gardens, Kolkata'
    };
    return venueNames[venueId] || venueId;
  };

  const loadWeatherData = async (venueId: string) => {
    try {
      const response = await fetch(`/api/weather/${venueId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      
      console.log('Weather API response for', venueId, ':', apiResponse);
      
      // Extract current weather data from API response
      // API returns nested structure, but component expects flat structure
      if (apiResponse && apiResponse.current) {
        const weatherData = {
          venueId: apiResponse.venueId || venueId,
          temperature: apiResponse.current.temperature,
          feelsLike: apiResponse.current.feelsLike,
          humidity: apiResponse.current.humidity,
          windSpeed: apiResponse.current.windSpeed,
          windDirection: apiResponse.current.windDirection,
          pressure: apiResponse.current.pressure,
          visibility: apiResponse.current.visibility,
          uvIndex: apiResponse.current.uvIndex,
          condition: apiResponse.current.condition,
          description: apiResponse.current.description,
          timestamp: apiResponse.current.timestamp,
          aiPrediction: apiResponse.current.aiPrediction || {
            matchImpact: 'medium',
            pitchEffect: 'Balanced conditions expected',
            dewFactor: 50,
            playingConditions: 'Good cricket conditions',
            recommendations: ['Standard play recommended'],
            confidence: 75
          }
        };
        console.log('Processed weather data:', weatherData);
        return weatherData;
      }
      
      // Fallback: try to use the response directly if it's already flat
      if (apiResponse && apiResponse.temperature) {
        console.log('Using flat weather data structure');
        return apiResponse;
      }
      
      console.log('No valid weather data structure found');
      return null;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  };

  const refreshWeatherData = async () => {
    if (isWPL) return;
    
    setWeatherLoading(true);
    try {
      const freshWeatherData = await weatherService.fetchWeatherForAllVenues();
      const updatedWeatherData = freshWeatherData.map(weather => ({
        ...weather,
        outfieldCondition: 'Good',
        pitchCondition: 'Excellent',
        expectedRunRate: 8.5,
        bowlingConditions: 'Balanced',
        battingConditions: 'Favorable',
        fieldingConditions: 'Good'
      }));
      
      setWeather(updatedWeatherData);
      addNotification('Weather data updated successfully');
    } catch (error) {
      console.error('Error refreshing weather data:', error);
      addNotification('Failed to update weather data', 'error');
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load enhanced sample data with AI insights
      let sampleVenues: Venue[] = [];

      // Add WPL-specific venues for WPL filtering
      if (isWPL) {
        sampleVenues = [
          {
            id: 'wpl-dy-patil',
            name: 'Dr. DY Patil Sports Academy, Navi Mumbai',
            city: 'Navi Mumbai',
            capacity: 55000,
            coordinates: { lat: 19.0471, lng: 73.0695 },
            timezone: 'Asia/Kolkata',
            established: 2008,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Advanced',
            avgFirstInnings: 165,
            avgSecondInnings: 155,
            highestTotal: 218,
            lowestTotal: 89,
            lastMatch: 'MI-W vs RCB-W - 2024-03-15',
            upcomingMatch: 'MI-W vs DC-W - 2025-03-22',
            status: 'active' as const,
            lastUpdated: new Date().toISOString(),
            aiInsights: {
              crowdPrediction: 48000,
              weatherImpact: 'medium' as const,
              optimalConditions: ['Evening matches', 'Moderate humidity'],
              strategicRecommendations: ['Pace-friendly conditions', 'Dew factor in night games'],
              riskFactors: ['High humidity', 'Coastal conditions'],
              confidence: 88
            }
          },
          {
            id: 'wpl-bca-stadium',
            name: 'BCA Stadium, Kotambi (Vadodara)',
            city: 'Vadodara',
            capacity: 35000,
            coordinates: { lat: 22.3072, lng: 73.1812 },
            timezone: 'Asia/Kolkata',
            established: 2023,
            pitchType: 'Hybrid',
            floodlights: true,
            drainageSystem: 'State-of-the-art',
            avgFirstInnings: 160,
            avgSecondInnings: 150,
            highestTotal: 205,
            lowestTotal: 82,
            lastMatch: 'GG vs UPW - 2024-03-20',
            upcomingMatch: 'RCB-W vs GG - 2025-03-25',
            status: 'active' as const,
            lastUpdated: new Date().toISOString(),
            aiInsights: {
              crowdPrediction: 32000,
              weatherImpact: 'low' as const,
              optimalConditions: ['Clear weather', 'Balanced pitch'],
              strategicRecommendations: ['Balanced conditions', 'Spinners effective'],
              riskFactors: ['Variable bounce', 'Evening conditions'],
              confidence: 91
            }
          }
        ];
      } else {
        // IPL venues - load all official IPL venues
        sampleVenues = [
          {
            id: 'wankhede',
            name: 'Wankhede Stadium',
            city: 'Mumbai',
            capacity: 33000,
            coordinates: { lat: 19.0, lng: 72.85 },
            timezone: 'Asia/Kolkata',
            established: 1974,
            pitchType: 'Clay Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 160,
            avgSecondInnings: 150,
            highestTotal: 235,
            lowestTotal: 87,
            lastMatch: '2024-05-27',
            upcomingMatch: '2025-03-23',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'chennai',
            name: 'M. A. Chidambaram Stadium',
            city: 'Chennai',
            capacity: 50000,
            coordinates: { lat: 13.0827, lng: 80.2707 },
            timezone: 'Asia/Kolkata',
            established: 1916,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 155,
            avgSecondInnings: 145,
            highestTotal: 246,
            lowestTotal: 70,
            lastMatch: '2024-05-29',
            upcomingMatch: '2025-03-21',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'bengaluru',
            name: 'M. Chinnaswamy Stadium',
            city: 'Bengaluru',
            capacity: 38000,
            coordinates: { lat: 12.9784, lng: 77.5998 },
            timezone: 'Asia/Kolkata',
            established: 1969,
            pitchType: 'Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 165,
            avgSecondInnings: 155,
            highestTotal: 263,
            lowestTotal: 82,
            lastMatch: '2024-05-25',
            upcomingMatch: '2025-03-25',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'kolkata',
            name: 'Eden Gardens',
            city: 'Kolkata',
            capacity: 66000,
            coordinates: { lat: 22.5697, lng: 88.3697 },
            timezone: 'Asia/Kolkata',
            established: 1864,
            pitchType: 'Black Cotton Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 158,
            avgSecondInnings: 148,
            highestTotal: 264,
            lowestTotal: 77,
            lastMatch: '2024-05-26',
            upcomingMatch: '2025-03-24',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'ahmedabad',
            name: 'Narendra Modi Stadium',
            city: 'Ahmedabad',
            capacity: 132000,
            coordinates: { lat: 23.0225, lng: 72.5714 },
            timezone: 'Asia/Kolkata',
            established: 1982,
            pitchType: 'Mixed Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 165,
            avgSecondInnings: 145,
            highestTotal: 239,
            lowestTotal: 85,
            lastMatch: '2024-05-29',
            upcomingMatch: '2025-03-15',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'delhi',
            name: 'Arun Jaitley Stadium',
            city: 'Delhi',
            capacity: 41000,
            coordinates: { lat: 28.6369, lng: 77.2447 },
            timezone: 'Asia/Kolkata',
            established: 1883,
            pitchType: 'Black Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 162,
            avgSecondInnings: 152,
            highestTotal: 257,
            lowestTotal: 83,
            lastMatch: '2024-05-24',
            upcomingMatch: '2025-03-22',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'jaipur',
            name: 'Sawai Mansingh Stadium',
            city: 'Jaipur',
            capacity: 30000,
            coordinates: { lat: 26.9236, lng: 75.8235 },
            timezone: 'Asia/Kolkata',
            established: 1869,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 160,
            avgSecondInnings: 150,
            highestTotal: 224,
            lowestTotal: 89,
            lastMatch: '2024-05-28',
            upcomingMatch: '2025-03-26',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'hyderabad',
            name: 'Rajiv Gandhi International Stadium',
            city: 'Hyderabad',
            capacity: 55000,
            coordinates: { lat: 17.3850, lng: 78.4867 },
            timezone: 'Asia/Kolkata',
            established: 2003,
            pitchType: 'Black Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 168,
            avgSecondInnings: 158,
            highestTotal: 231,
            lowestTotal: 87,
            lastMatch: '2024-05-30',
            upcomingMatch: '2025-03-27',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'mohali',
            name: 'Punjab Cricket Association Stadium',
            city: 'Mohali',
            capacity: 26950,
            coordinates: { lat: 30.6967, lng: 76.7394 },
            timezone: 'Asia/Kolkata',
            established: 1993,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 170,
            avgSecondInnings: 160,
            highestTotal: 232,
            lowestTotal: 78,
            lastMatch: '2024-05-31',
            upcomingMatch: '2025-03-28',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'dharamsala',
            name: 'Himachal Pradesh Cricket Association Stadium',
            city: 'Dharamsala',
            capacity: 23000,
            coordinates: { lat: 32.2401, lng: 76.3294 },
            timezone: 'Asia/Kolkata',
            established: 2005,
            pitchType: 'Black Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 155,
            avgSecondInnings: 145,
            highestTotal: 206,
            lowestTotal: 92,
            lastMatch: '2024-06-01',
            upcomingMatch: '2025-03-29',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'visakhapatnam',
            name: 'Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium',
            city: 'Visakhapatnam',
            capacity: 27500,
            coordinates: { lat: 17.7274, lng: 83.3191 },
            timezone: 'Asia/Kolkata',
            established: 2003,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 158,
            avgSecondInnings: 148,
            highestTotal: 229,
            lowestTotal: 84,
            lastMatch: '2024-06-02',
            upcomingMatch: '2025-03-30',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'lucknow',
            name: 'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium',
            city: 'Lucknow',
            capacity: 50000,
            coordinates: { lat: 26.7606, lng: 80.9394 },
            timezone: 'Asia/Kolkata',
            established: 2017,
            pitchType: 'Coarse Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 163,
            avgSecondInnings: 153,
            highestTotal: 195,
            lowestTotal: 88,
            lastMatch: '2024-06-03',
            upcomingMatch: '2025-03-31',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'pune',
            name: 'Maharashtra Cricket Association Stadium',
            city: 'Pune',
            capacity: 37000,
            coordinates: { lat: 18.5408, lng: 73.8394 },
            timezone: 'Asia/Kolkata',
            established: 2012,
            pitchType: 'Black Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 166,
            avgSecondInnings: 156,
            highestTotal: 212,
            lowestTotal: 91,
            lastMatch: '2024-06-04',
            upcomingMatch: '2025-04-01',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'mullanpur',
            name: 'Maharaja Yadavindra Singh International Cricket Stadium',
            city: 'Mullanpur',
            capacity: 40000,
            coordinates: { lat: 30.7173, lng: 76.5806 },
            timezone: 'Asia/Kolkata',
            established: 2022,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 159,
            avgSecondInnings: 149,
            highestTotal: 201,
            lowestTotal: 86,
            lastMatch: '2024-06-05',
            upcomingMatch: '2025-04-02',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'guwahati',
            name: 'Barsapara Cricket Stadium',
            city: 'Guwahati',
            capacity: 40000,
            coordinates: { lat: 26.1258, lng: 91.7394 },
            timezone: 'Asia/Kolkata',
            established: 2017,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 161,
            avgSecondInnings: 151,
            highestTotal: 228,
            lowestTotal: 93,
            lastMatch: '2024-06-06',
            upcomingMatch: '2025-04-03',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'indore',
            name: 'Holkar Cricket Stadium',
            city: 'Indore',
            capacity: 30000,
            coordinates: { lat: 22.7186, lng: 75.8577 },
            timezone: 'Asia/Kolkata',
            established: 2006,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 167,
            avgSecondInnings: 157,
            highestTotal: 260,
            lowestTotal: 94,
            lastMatch: '2024-06-07',
            upcomingMatch: '2025-04-04',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'ranchi',
            name: 'JSCA International Stadium Complex',
            city: 'Ranchi',
            capacity: 35000,
            coordinates: { lat: 23.3441, lng: 85.3096 },
            timezone: 'Asia/Kolkata',
            established: 2011,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 164,
            avgSecondInnings: 154,
            highestTotal: 199,
            lowestTotal: 95,
            lastMatch: '2024-06-08',
            upcomingMatch: '2025-04-05',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'kanpur',
            name: 'Green Park',
            city: 'Kanpur',
            capacity: 45000,
            coordinates: { lat: 26.4750, lng: 80.3319 },
            timezone: 'Asia/Kolkata',
            established: 1945,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 156,
            avgSecondInnings: 146,
            highestTotal: 218,
            lowestTotal: 96,
            lastMatch: '2024-06-09',
            upcomingMatch: '2025-04-06',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'cuttack',
            name: 'Barabati Stadium',
            city: 'Cuttack',
            capacity: 45000,
            coordinates: { lat: 20.4625, lng: 85.8828 },
            timezone: 'Asia/Kolkata',
            established: 1958,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 157,
            avgSecondInnings: 147,
            highestTotal: 202,
            lowestTotal: 98,
            lastMatch: '2024-06-10',
            upcomingMatch: '2025-04-07',
            status: 'active',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'barsapara',
            name: 'ACA Stadium, Barsapara',
            city: 'Guwahati',
            capacity: 40000,
            coordinates: { lat: 26.1258, lng: 91.7394 },
            timezone: 'Asia/Kolkata',
            established: 2017,
            pitchType: 'Clay and Red Soil',
            floodlights: true,
            drainageSystem: 'Sand-based',
            avgFirstInnings: 160,
            avgSecondInnings: 150,
            highestTotal: 222,
            lowestTotal: 99,
            lastMatch: '2024-06-11',
            upcomingMatch: '2025-04-08',
            status: 'active',
            lastUpdated: new Date().toISOString()
          }
        ];
      }

      // Load real-time weather data using weather service
      let sampleWeather: WeatherData[] = [];
      
      if (!isWPL) {
        try {
          // Fetch real weather data for all IPL venues
          const realWeatherData = await weatherService.fetchWeatherForAllVenues();
          sampleWeather = realWeatherData.map(weather => ({
            ...weather,
            // Ensure compatibility with existing WeatherData interface
            outfieldCondition: 'Good',
            pitchCondition: 'Excellent',
            expectedRunRate: 8.5,
            bowlingConditions: 'Balanced',
            battingConditions: 'Favorable',
            fieldingConditions: 'Good'
          }));
        } catch (error) {
          console.error('Error fetching real weather data, using fallback:', error);
          // Fallback to static data if API fails
          sampleWeather = [
            {
              venueId: 'wankhede',
              temperature: 30,
              feelsLike: 33,
              humidity: 75,
              windSpeed: 18,
              windDirection: 220,
              pressure: 1008,
              visibility: 8,
              uvIndex: 8,
              condition: 'partly-cloudy' as const,
              description: 'Coastal Mumbai with high humidity and sea breeze',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'high' as const,
                pitchEffect: 'Clay soil provides good bounce, sea breeze aids swing bowling',
                dewFactor: 85,
                playingConditions: 'Humid coastal conditions favor swing bowlers early',
                recommendations: [
                  'Pace bowlers will get swing with sea breeze',
                  'High dew factor in night matches',
                  'Clay soil offers good batting conditions'
                ],
                confidence: 89
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'chennai',
              temperature: 35,
              feelsLike: 39,
              humidity: 80,
              windSpeed: 10,
              windDirection: 170,
              pressure: 1009,
              visibility: 7,
              uvIndex: 9,
              condition: 'sunny' as const,
              description: 'Hot and humid Chennai with clay-red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'high' as const,
                pitchEffect: 'Clay and red soil mixture helps spinners as match progresses',
                dewFactor: 88,
                playingConditions: 'Very hot and humid, spin-friendly pitch',
                recommendations: [
                  'Spinners will dominate middle to death overs',
                  'High dew factor affects second innings',
                  'Batting first preferred due to humidity'
                ],
                confidence: 91
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'bengaluru',
              temperature: 27,
              feelsLike: 29,
              humidity: 55,
              windSpeed: 20,
              windDirection: 90,
              pressure: 1013,
              visibility: 10,
              uvIndex: 7,
              condition: 'sunny' as const,
              description: 'Pleasant Bengaluru weather with red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Red soil provides good batting conditions with moderate bounce',
                dewFactor: 65,
                playingConditions: 'Ideal weather with good outfield conditions',
                recommendations: [
                  'Red soil offers balanced conditions',
                  'Good weather for high-scoring matches',
                  'Moderate dew factor in evening'
                ],
                confidence: 88
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'kolkata',
              temperature: 32,
              feelsLike: 35,
              humidity: 75,
              windSpeed: 8,
              windDirection: 140,
              pressure: 1008,
              visibility: 8,
              uvIndex: 8,
              condition: 'partly-cloudy' as const,
              description: 'Humid Kolkata with black cotton soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Black cotton soil provides balanced wicket with traditional behavior',
                dewFactor: 82,
                playingConditions: 'Humid conditions with balanced pitch characteristics',
                recommendations: [
                  'Black cotton soil offers balanced conditions',
                  'High dew factor in night matches',
                  'Traditional Kolkata pitch behavior'
                ],
                confidence: 89
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'ahmedabad',
              temperature: 34,
              feelsLike: 37,
              humidity: 50,
              windSpeed: 12,
              windDirection: 200,
              pressure: 1012,
              visibility: 10,
              uvIndex: 9,
              condition: 'sunny' as const,
              description: 'Dry Ahmedabad conditions with mixed soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Mixed soil surface provides balanced conditions favoring batsmen',
                dewFactor: 70,
                playingConditions: 'Dry conditions with excellent batting surface',
                recommendations: [
                  'Mixed soil offers balanced pitch behavior',
                  'Excellent conditions for high scores',
                  'Moderate dew factor in evening'
                ],
                confidence: 90
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'delhi',
              temperature: 35,
              feelsLike: 38,
              humidity: 45,
              windSpeed: 12,
              windDirection: 180,
              pressure: 1010,
              visibility: 10,
              uvIndex: 9,
              condition: 'sunny' as const,
              description: 'Hot and dry Delhi with black soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'high' as const,
                pitchEffect: 'Black soil provides dry conditions favoring batsmen initially',
                dewFactor: 70,
                playingConditions: 'Very hot with low humidity, batting-friendly',
                recommendations: [
                  'Black soil offers good bounce and carry',
                  'Batting first preferred in hot conditions',
                  'Spinners will be crucial in middle overs'
                ],
                confidence: 91
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'jaipur',
              temperature: 34,
              feelsLike: 37,
              humidity: 50,
              windSpeed: 16,
              windDirection: 220,
              pressure: 1009,
              visibility: 10,
              uvIndex: 8,
              condition: 'sunny' as const,
              description: 'Dry Jaipur conditions with red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Red soil provides traditional Rajasthan conditions favoring spinners',
                dewFactor: 72,
                playingConditions: 'Dry with moderate wind, spin-friendly',
                recommendations: [
                  'Red soil offers traditional spin-friendly conditions',
                  'Spinners will dominate middle overs',
                  'Dew expected in evening matches'
                ],
                confidence: 88
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'hyderabad',
              temperature: 32,
              feelsLike: 35,
              humidity: 65,
              windSpeed: 10,
              windDirection: 160,
              pressure: 1012,
              visibility: 9,
              uvIndex: 7,
              condition: 'partly-cloudy' as const,
              description: 'Humid Hyderabad with black soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Black soil provides balanced conditions in humid weather',
                dewFactor: 78,
                playingConditions: 'Humid with balanced conditions for bat and ball',
                recommendations: [
                  'Black soil offers balanced conditions',
                  'High dew factor in night matches',
                  'Both pace and spin effective'
                ],
                confidence: 87
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'mohali',
              temperature: 30,
              feelsLike: 32,
              humidity: 60,
              windSpeed: 18,
              windDirection: 240,
              pressure: 1013,
              visibility: 10,
              uvIndex: 6,
              condition: 'sunny' as const,
              description: 'Pleasant Mohali weather with red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'low' as const,
                pitchEffect: 'Red soil provides balanced conditions in Punjab climate',
                dewFactor: 68,
                playingConditions: 'Ideal cricket conditions with good breeze',
                recommendations: [
                  'Red soil offers balanced conditions',
                  'Good weather for all-round performance',
                  'Minimal dew factor expected'
                ],
                confidence: 90
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'dharamsala',
              temperature: 25,
              feelsLike: 27,
              humidity: 65,
              windSpeed: 20,
              windDirection: 120,
              pressure: 1010,
              visibility: 8,
              uvIndex: 6,
              condition: 'cloudy' as const,
              description: 'Cool mountain Dharamsala with black soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Black soil in mountain conditions favors balanced cricket',
                dewFactor: 60,
                playingConditions: 'Cool with good breeze, excellent conditions',
                recommendations: [
                  'Mountain conditions favor pace bowling',
                  'Even bounce expected throughout',
                  'Minimal dew factor in cool weather'
                ],
                confidence: 86
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'visakhapatnam',
              temperature: 29,
              feelsLike: 32,
              humidity: 70,
              windSpeed: 14,
              windDirection: 160,
              pressure: 1009,
              visibility: 8,
              uvIndex: 7,
              condition: 'partly-cloudy' as const,
              description: 'Coastal Visakhapatnam with red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Red soil with coastal conditions provides balanced wicket',
                dewFactor: 78,
                playingConditions: 'Coastal humidity with sea breeze effects',
                recommendations: [
                  'Coastal conditions favor swing bowling early',
                  'High dew factor in night matches',
                  'Red soil offers balanced conditions'
                ],
                confidence: 87
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'lucknow',
              temperature: 33,
              feelsLike: 36,
              humidity: 58,
              windSpeed: 11,
              windDirection: 200,
              pressure: 1010,
              visibility: 10,
              uvIndex: 8,
              condition: 'sunny' as const,
              description: 'Warm Lucknow with coarse soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Coarse soil provides balanced conditions for modern stadium',
                dewFactor: 74,
                playingConditions: 'Warm with moderate humidity, good facilities',
                recommendations: [
                  'Coarse soil offers balanced pitch behavior',
                  'Modern facilities with excellent conditions',
                  'Moderate dew factor in evening'
                ],
                confidence: 88
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'pune',
              temperature: 29,
              feelsLike: 31,
              humidity: 62,
              windSpeed: 13,
              windDirection: 170,
              pressure: 1011,
              visibility: 9,
              uvIndex: 6,
              condition: 'sunny' as const,
              description: 'Pleasant Pune with black soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'low' as const,
                pitchEffect: 'Black soil provides balanced conditions in Pune climate',
                dewFactor: 70,
                playingConditions: 'Ideal weather with balanced pitch characteristics',
                recommendations: [
                  'Black soil offers balanced conditions',
                  'Perfect weather for cricket',
                  'Moderate dew factor expected'
                ],
                confidence: 89
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'mullanpur',
              temperature: 30,
              feelsLike: 32,
              humidity: 55,
              windSpeed: 14,
              windDirection: 190,
              pressure: 1012,
              visibility: 10,
              uvIndex: 7,
              condition: 'sunny' as const,
              description: 'Modern Mullanpur with red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'low' as const,
                pitchEffect: 'Red soil in modern stadium provides balanced conditions',
                dewFactor: 68,
                playingConditions: 'Modern facilities with excellent weather',
                recommendations: [
                  'Modern pitch offers good bounce and carry',
                  'Balanced conditions for all players',
                  'Good drainage system in place'
                ],
                confidence: 87
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'guwahati',
              temperature: 31,
              feelsLike: 34,
              humidity: 73,
              windSpeed: 9,
              windDirection: 140,
              pressure: 1008,
              visibility: 7,
              uvIndex: 7,
              condition: 'partly-cloudy' as const,
              description: 'Humid Guwahati with clay and red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Clay and red soil provides balanced conditions in northeast',
                dewFactor: 80,
                playingConditions: 'High humidity with modern facilities',
                recommendations: [
                  'Clay and red soil offers balanced conditions',
                  'High humidity favors spinners in middle overs',
                  'High dew factor expected'
                ],
                confidence: 86
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'indore',
              temperature: 32,
              feelsLike: 35,
              humidity: 52,
              windSpeed: 10,
              windDirection: 210,
              pressure: 1011,
              visibility: 10,
              uvIndex: 8,
              condition: 'sunny' as const,
              description: 'Dry Indore with red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Red soil provides batting-friendly conditions in central India',
                dewFactor: 65,
                playingConditions: 'Warm and dry conditions favor batsmen',
                recommendations: [
                  'Red soil offers good batting conditions',
                  'High scores possible in dry conditions',
                  'Spinners important in middle overs'
                ],
                confidence: 88
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'ranchi',
              temperature: 30,
              feelsLike: 33,
              humidity: 61,
              windSpeed: 12,
              windDirection: 170,
              pressure: 1010,
              visibility: 9,
              uvIndex: 7,
              condition: 'partly-cloudy' as const,
              description: 'Central Ranchi with red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Red soil provides balanced conditions in eastern India',
                dewFactor: 72,
                playingConditions: 'Moderate humidity with good conditions',
                recommendations: [
                  'Red soil offers balanced conditions',
                  'Both bat and ball competitive',
                  'Moderate dew factor expected'
                ],
                confidence: 87
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'kanpur',
              temperature: 31,
              feelsLike: 34,
              humidity: 64,
              windSpeed: 11,
              windDirection: 180,
              pressure: 1009,
              visibility: 8,
              uvIndex: 7,
              condition: 'partly-cloudy' as const,
              description: 'Traditional Kanpur with red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Red soil provides traditional UP conditions',
                dewFactor: 74,
                playingConditions: 'Traditional conditions with modern facilities',
                recommendations: [
                  'Red soil offers traditional pitch behavior',
                  'Both bat and ball equally competitive',
                  'Moderate dew factor in evening'
                ],
                confidence: 86
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'cuttack',
              temperature: 32,
              feelsLike: 35,
              humidity: 68,
              windSpeed: 13,
              windDirection: 160,
              pressure: 1008,
              visibility: 8,
              uvIndex: 7,
              condition: 'partly-cloudy' as const,
              description: 'Coastal Cuttack with red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Red soil with coastal conditions provides balanced wicket',
                dewFactor: 76,
                playingConditions: 'Coastal humidity with moderate conditions',
                recommendations: [
                  'Red soil offers balanced coastal conditions',
                  'Coastal conditions favor swing bowling',
                  'Moderate dew factor expected'
                ],
                confidence: 85
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
              expectedRunRate: 8.5,
              bowlingConditions: 'Balanced',
              battingConditions: 'Favorable',
              fieldingConditions: 'Good'
            },
            {
              venueId: 'barsapara',
              temperature: 31,
              feelsLike: 34,
              humidity: 71,
              windSpeed: 12,
              windDirection: 150,
              pressure: 1009,
              visibility: 8,
              uvIndex: 7,
              condition: 'partly-cloudy' as const,
              description: 'Northeast Barsapara with clay and red soil pitch',
              timestamp: new Date().toISOString(),
              aiPrediction: {
                matchImpact: 'medium' as const,
                pitchEffect: 'Clay and red soil provides balanced conditions in modern stadium',
                dewFactor: 76,
                playingConditions: 'Humid with modern facilities and good conditions',
                recommendations: [
                  'Clay and red soil offers balanced conditions',
                  'Modern pitch with excellent facilities',
                  'Moderate dew factor expected'
                ],
                confidence: 87
              },
              outfieldCondition: 'Good',
              pitchCondition: 'Excellent',
            }
          ]; // Removed extra comma here
        }
      }

      // Add weather data for WPL venues
      if (isWPL) {
        sampleWeather.push(
          {
            venueId: 'wpl-dy-patil',
            temperature: 30,
            feelsLike: 33,
            humidity: 70,
            windSpeed: 15,
            windDirection: 200,
            pressure: 1008,
            visibility: 9,
            uvIndex: 7,
            condition: 'partly-cloudy',
            description: 'Partly cloudy with coastal humidity',
            timestamp: new Date().toISOString(),
            aiPrediction: {
              matchImpact: 'medium',
              pitchEffect: 'Coastal conditions may help swing bowlers early',
              dewFactor: 80,
              playingConditions: 'Moderate humidity with sea breeze',
              recommendations: [
                'Pace bowlers effective in first 10 overs',
                'Dew expected in night matches',
                'Spinners crucial in middle overs'
              ],
              confidence: 87
            }
          },
          {
            venueId: 'wpl-bca-stadium',
            temperature: 28,
            feelsLike: 30,
            humidity: 55,
            windSpeed: 10,
            windDirection: 90,
            pressure: 1012,
            visibility: 10,
            uvIndex: 6,
            condition: 'sunny',
            description: 'Clear weather with moderate temperature',
            timestamp: new Date().toISOString(),
            aiPrediction: {
              matchImpact: 'low',
              pitchEffect: 'Balanced conditions for both bat and ball',
              dewFactor: 60,
              playingConditions: 'Ideal cricket conditions',
              recommendations: [
                'Balanced pitch favors all-rounders',
                'Minimal dew factor',
                'Good visibility throughout match'
              ],
              confidence: 92
            }
          }
        );
      } else {
        // IPL weather data
        sampleWeather.push(
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
        );
      }

      setVenues(sampleVenues);
      
      // Load real weather data for each venue
      console.log('Loading weather data for venues:', sampleVenues.map(v => v.id));
      const weatherPromises = sampleVenues.map(async (venue) => {
        const weatherData = await loadWeatherData(venue.id);
        return weatherData;
      });
      
      const weatherResults = await Promise.allSettled(weatherPromises);
      console.log('Weather results:', weatherResults);
      
      const validWeatherData = weatherResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
      
      console.log('Valid weather data:', validWeatherData);
      setWeatherData(validWeatherData);
      
      // Load match conditions
      const sampleConditions: MatchCondition[] = [];
      
      // Add match conditions for WPL venues
      if (isWPL) {
        sampleConditions.push(
          {
            id: 'wpl-dy-patil-conditions',
            venueId: 'wpl-dy-patil',
            pitchReport: {
              hardness: 7,
              grassCoverage: 70,
              cracks: false,
              moisture: 20,
              expectedBehavior: 'Coastal pitch with good carry and swing',
              day1: 'Fresh pitch, pace bowlers get assistance',
              day2: 'Pitch settles, balanced conditions',
              day3: 'Spin starts to play, variable bounce'
            },
            outfieldCondition: 'Fast with coastal moisture',
            weatherForecast: 'Partly cloudy with moderate humidity',
            recommendedTeam: 'bowl-first',
            aiAnalysis: {
              battingConditions: 'Good for stroke play early, spin later',
              bowlingConditions: 'Pace and swing effective early, spin crucial later',
              fieldingConditions: 'Quick outfield, dew factor in evening',
              strategicAdvice: [
                'Bowl first to exploit early moisture',
                'Pace attack crucial in powerplay',
                'Spinners dominate middle overs'
              ],
              keyFactors: ['Coastal conditions', 'Dew factor', 'Pitch wear'],
              winProbability: { bat: 45, bowl: 55 },
              confidence: 88
            },
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'wpl-bca-stadium-conditions',
            venueId: 'wpl-bca-stadium',
            pitchReport: {
              hardness: 8,
              grassCoverage: 60,
              cracks: false,
              moisture: 12,
              expectedBehavior: 'Balanced hybrid surface',
              day1: 'Hard and true, excellent for batting',
              day2: 'Slight wear, balanced conditions',
              day3: 'Even wear, consistent bounce'
            },
            outfieldCondition: 'Perfect and fast',
            weatherForecast: 'Clear and sunny',
            recommendedTeam: 'bat-first',
            aiAnalysis: {
              battingConditions: 'Excellent with true bounce',
              bowlingConditions: 'Pacers get some movement, spinners effective',
              fieldingConditions: 'Ideal conditions, no moisture',
              strategicAdvice: [
                'Bat first on true surface',
                'Build partnerships on flat pitch',
                'Death overs bowling crucial'
              ],
              keyFactors: ['True pitch', 'Clear weather', 'Fast outfield'],
              winProbability: { bat: 60, bowl: 40 },
              confidence: 92
            },
            lastUpdated: new Date().toISOString()
          }
        );
      } else {
        // IPL match conditions
        sampleConditions.push(
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
        );
      }
      
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
      // Actually refresh the data
      await loadInitialData();
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
      // Actually refresh weather data for AI insights
      const weatherPromises = venues.map(async (venue) => {
        const weatherData = await loadWeatherData(venue.id);
        return weatherData;
      });
      
      const weatherResults = await Promise.allSettled(weatherPromises);
      const validWeatherData = weatherResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
      
      setWeatherData(validWeatherData);
      addNotification('AI insights generated successfully');
    } catch (error) {
      addNotification('AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  // Handle venue form input changes
  const handleVenueFormChange = (field: string, value: string) => {
    setVenueForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save venue (add new or update existing)
  const saveVenue = () => {
    if (!venueForm.name || !venueForm.city) {
      addNotification('Please fill in required fields');
      return;
    }

    if (editingVenue) {
      // Update existing venue
      setVenues(prev => prev.map(venue => 
        venue.id === editingVenue.id 
          ? { ...venue, ...venueForm, capacity: parseInt(venueForm.capacity) || 0 }
          : venue
      ));
      addNotification('Venue updated successfully');
    } else {
      // Add new venue
      const newVenue: Venue = {
        id: Date.now().toString(),
        name: venueForm.name,
        city: venueForm.city,
        capacity: parseInt(venueForm.capacity) || 0,
        coordinates: {
          lat: parseFloat(venueForm.latitude) || 0,
          lng: parseFloat(venueForm.longitude) || 0
        },
        timezone: 'Asia/Kolkata',
        established: new Date().getFullYear(),
        pitchType: venueForm.pitchType,
        floodlights: true,
        drainageSystem: 'Standard',
        avgFirstInnings: 160,
        avgSecondInnings: 150,
        highestTotal: 200,
        lowestTotal: 100,
        lastMatch: '',
        upcomingMatch: '',
        status: 'active' as const,
        lastUpdated: new Date().toISOString()
      };
      setVenues(prev => [...prev, newVenue]);
      addNotification('Venue added successfully');
    }

    // Reset form and close modal
    setVenueForm({
      name: '',
      city: '',
      capacity: '',
      latitude: '',
      longitude: '',
      pitchType: 'Red Soil'
    });
    setEditingVenue(null);
    setShowVenueModal(false);
  };

  // Open venue modal for adding or editing
  const openVenueModal = (venue?: Venue) => {
    if (venue) {
      setEditingVenue(venue);
      setVenueForm({
        name: venue.name,
        city: venue.city,
        capacity: venue.capacity.toString(),
        latitude: venue.coordinates.lat.toString(),
        longitude: venue.coordinates.lng.toString(),
        pitchType: venue.pitchType
      });
    } else {
      setEditingVenue(null);
      setVenueForm({
        name: '',
        city: '',
        capacity: '',
        latitude: '',
        longitude: '',
        pitchType: 'Red Soil'
      });
    }
    setShowVenueModal(true);
  };

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          venue.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || venue.status === filterStatus;
    
    // WPL venue filtering - only show WPL-specific venues in WPL mode
    const isWPLVenue = isWPL && (
      venue.name.toLowerCase().includes('dy patil') || 
      venue.name.toLowerCase().includes('bca') ||
      venue.name.toLowerCase().includes('kotambi') ||
      venue.name.toLowerCase().includes('vadodara') ||
      venue.name.toLowerCase().includes('navi mumbai')
    );
    
    console.log('Filtering venue:', venue.name, 'isWPL:', isWPL, 'isWPLVenue:', isWPLVenue, 'matchesFilter:', matchesFilter, 'matchesSearch:', matchesSearch);
    
    return matchesSearch && matchesFilter && (!isWPL || isWPLVenue);
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
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
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
                  onClick={() => openVenueModal()}
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
                      onClick={() => openVenueModal(venue)}
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Weather Conditions</h2>
                <p className="text-blue-300">Real-time weather data for all IPL venues</p>
              </div>
              <button
                onClick={refreshWeatherData}
                disabled={weatherLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${weatherLoading ? 'animate-spin' : ''}`} />
                {weatherLoading ? 'Updating...' : 'Refresh Weather'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {weatherData.map((weather) => (
                <motion.div
                  key={weather.venueId}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">Weather Conditions</h3>
                      <p className="text-sm text-blue-300 font-medium">
                        {getVenueName(weather.venueId)}
                      </p>
                    </div>
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
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">Match Conditions Analysis</h3>
                      <p className="text-sm text-green-300 font-medium">
                        {getVenueName(condition.venueId)}
                      </p>
                    </div>
                  </div>

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
                <h3 className="text-xl font-bold text-white">
                  {editingVenue ? 'Edit Venue' : 'Add New Venue'}
                </h3>
                <button onClick={() => setShowVenueModal(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  placeholder="Venue Name" 
                  value={venueForm.name}
                  onChange={(e) => handleVenueFormChange('name', e.target.value)}
                  className="p-3 bg-slate-700 text-white rounded-lg" 
                />
                <input 
                  placeholder="City" 
                  value={venueForm.city}
                  onChange={(e) => handleVenueFormChange('city', e.target.value)}
                  className="p-3 bg-slate-700 text-white rounded-lg" 
                />
                <input 
                  placeholder="Capacity" 
                  type="number" 
                  value={venueForm.capacity}
                  onChange={(e) => handleVenueFormChange('capacity', e.target.value)}
                  className="p-3 bg-slate-700 text-white rounded-lg" 
                />
                <input 
                  placeholder="Latitude" 
                  type="number" 
                  value={venueForm.latitude}
                  onChange={(e) => handleVenueFormChange('latitude', e.target.value)}
                  className="p-3 bg-slate-700 text-white rounded-lg" 
                />
                <input 
                  placeholder="Longitude" 
                  type="number" 
                  value={venueForm.longitude}
                  onChange={(e) => handleVenueFormChange('longitude', e.target.value)}
                  className="p-3 bg-slate-700 text-white rounded-lg" 
                />
                <select 
                  value={venueForm.pitchType}
                  onChange={(e) => handleVenueFormChange('pitchType', e.target.value)}
                  className="p-3 bg-slate-700 text-white rounded-lg"
                >
                  <option value="Red Soil">Red Soil</option>
                  <option value="Black Soil">Black Soil</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowVenueModal(false)} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  Cancel
                </button>
                <motion.button
                  onClick={saveVenue}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Save size={18} />
                  {editingVenue ? 'Update Venue' : 'Add Venue'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}