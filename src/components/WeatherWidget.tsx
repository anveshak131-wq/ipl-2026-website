'use client';

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Clock, AlertCircle } from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: string;
  conditionCode: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: number;
  uvIndex: number;
  timestamp: string;
}

interface Venue {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export default function WeatherWidget({ venue }: { venue: Venue }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [nextUpdate, setNextUpdate] = useState<string>('');
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    fetchWeatherForVenue(venue);
  }, [venue]);

  const fetchWeatherForVenue = async (venue: Venue) => {
    try {
      // Check cache first (12-hour cache)
      const cacheKey = `weather_widget_cache_${venue.id}`;
      const lastUpdateKey = `weather_widget_last_update_${venue.id}`;
      const cached = localStorage.getItem(cacheKey);
      const lastUpdate = localStorage.getItem(lastUpdateKey);
      const now = Date.now();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 hours
      
      if (cached && lastUpdate && (now - parseInt(lastUpdate)) < TWELVE_HOURS) {
        try {
          const parsed = JSON.parse(cached);
          setWeather(parsed.weather);
          setLastUpdated(parsed.lastUpdated || '');
          setNextUpdate(parsed.nextUpdate || '');
          setIsCached(true);
          setLoading(false);
          console.log('Using cached weather data for widget');
          return;
        } catch (e) {
          console.error('Error parsing cached weather:', e);
        }
      }
      
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/weather`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.message || 'Weather data unavailable');
        setNextUpdate(data.nextUpdate || '');
        return;
      }
      
      if (data.weather) {
        const venueWeather = data.weather.find((w: any) => w.venueId === venue.id);
        if (venueWeather?.weather) {
          setWeather(venueWeather.weather);
          setLastUpdated(data.lastUpdated || '');
          setNextUpdate(data.nextUpdate || '');
          setIsCached(data.cached || false);
          
          // Cache the result
          localStorage.setItem(cacheKey, JSON.stringify({
            weather: venueWeather.weather,
            lastUpdated: data.lastUpdated || '',
            nextUpdate: data.nextUpdate || ''
          }));
          localStorage.setItem(lastUpdateKey, now.toString());
        } else {
          setError('Weather data not available for this venue');
        }
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string, conditionCode?: number) => {
    // WeatherAPI condition codes mapping
    if (conditionCode) {
      if (conditionCode === 1000) return <Sun className="text-yellow-400" size={24} />; // Sunny
      if (conditionCode >= 1003 && conditionCode <= 1009) return <Cloud className="text-gray-400" size={24} />; // Partly cloudy to cloudy
      if (conditionCode >= 1063 && conditionCode <= 1087) return <CloudRain className="text-blue-400" size={24} />; // Rain
      if (conditionCode >= 1114 && conditionCode <= 1117) return <Cloud className="text-gray-300" size={24} />; // Snow
    }
    
    // Fallback to condition text
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="text-yellow-400" size={24} />;
      case 'cloudy':
      case 'partly cloudy':
      case 'overcast':
        return <Cloud className="text-gray-400" size={24} />;
      case 'rain':
      case 'light rain':
      case 'moderate rain':
      case 'heavy rain':
        return <CloudRain className="text-blue-400" size={24} />;
      default:
        return <Cloud className="text-gray-400" size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-purple-400/20">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-3 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-purple-400/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="text-yellow-400" size={20} />
          <h4 className="text-white font-semibold">Weather Unavailable</h4>
        </div>
        <p className="text-gray-300 text-sm mb-2">{error}</p>
        {nextUpdate && (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={12} />
            Next update: {new Date(nextUpdate).toLocaleString()}
          </div>
        )}
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-purple-400/20">
        <p className="text-gray-400 text-sm">Weather data unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-purple-400/20">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-semibold">Weather</h4>
        <div className="flex items-center gap-2">
          {isCached && (
            <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
              Cached
            </div>
          )}
          {getWeatherIcon(weather.condition, weather.conditionCode)}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-white">
            {Math.round(weather.temperature)}°C
          </span>
          <span className="text-gray-300 text-sm capitalize">
            {weather.condition}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Droplets className="text-blue-400" size={16} />
            <span className="text-gray-300">{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="text-gray-400" size={16} />
            <span className="text-gray-300">{weather.windSpeed} km/h</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
          <div>Wind: {weather.windDirection}</div>
          <div>UV: {weather.uvIndex}</div>
        </div>
        
        <div className="text-xs text-gray-400 border-t border-white/10 pt-2">
          <div className="flex items-center justify-between">
            <span>Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
            <span>Next: {new Date(nextUpdate).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
