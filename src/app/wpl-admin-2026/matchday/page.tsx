'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Thermometer, Wind, Droplets, Eye, Edit, Trash2, Plus, Save, X } from 'lucide-react';
import AuroraBackground from '@/components/ui/AuroraBackground';
import GradientText from '@/components/ui/GradientText';
import AnimatedSection from '@/components/ui/AnimatedSection';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';

interface VenueInfo {
  id: string;
  name: string;
  city: string;
  capacity: number;
  pitchType: string;
  floodlights: boolean;
  dimensions: string;
  established: number;
}

interface WeatherInfo {
  id: string;
  venueId: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'overcast';
  lastUpdated: string;
}

interface MatchConditions {
  id: string;
  venueId: string;
  matchId: string;
  pitchReport: string;
  outfieldCondition: string;
  expectedDew: boolean;
  avgFirstInnings: number;
  avgChasing: number;
  tossImpact: string;
}

export default function WPLMatchDayAdmin() {
  const [venues, setVenues] = useState<VenueInfo[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherInfo[]>([]);
  const [matchConditions, setMatchConditions] = useState<MatchConditions[]>([]);
  const [editingVenue, setEditingVenue] = useState<VenueInfo | null>(null);
  const [editingWeather, setEditingWeather] = useState<WeatherInfo | null>(null);
  const [editingConditions, setEditingConditions] = useState<MatchConditions | null>(null);
  const [activeTab, setActiveTab] = useState<'venues' | 'weather' | 'conditions'>('venues');

  useEffect(() => {
    // Load WPL-specific mock data
    setVenues([
      {
        id: '1',
        name: 'M. Chinnaswamy Stadium',
        city: 'Bengaluru',
        capacity: 38000,
        pitchType: 'Red Soil',
        floodlights: true,
        dimensions: '64m x 64m',
        established: 1969
      },
      {
        id: '2',
        name: 'M. A. Chidambaram Stadium',
        city: 'Chennai',
        capacity: 50000,
        pitchType: 'Black Soil',
        floodlights: true,
        dimensions: '66m x 66m',
        established: 1916
      },
      {
        id: '3',
        name: 'Eden Gardens',
        city: 'Kolkata',
        capacity: 66000,
        pitchType: 'Red Soil',
        floodlights: true,
        dimensions: '66m x 66m',
        established: 1864
      }
    ]);

    setWeatherData([
      {
        id: '1',
        venueId: '1',
        temperature: 28,
        humidity: 70,
        windSpeed: 15,
        condition: 'cloudy',
        lastUpdated: new Date().toISOString()
      }
    ]);

    setMatchConditions([
      {
        id: '1',
        venueId: '1',
        matchId: 'wpl-match-001',
        pitchReport: 'Balanced pitch with good bounce, expected to assist both batters and bowlers equally in women\'s cricket',
        outfieldCondition: 'Excellent and well-maintained',
        expectedDew: true,
        avgFirstInnings: 145,
        avgChasing: 135,
        tossImpact: 'Team winning toss likely to bowl first due to expected dew in the evening'
      }
    ]);
  }, []);

  const handleSaveVenue = (venue: VenueInfo) => {
    if (editingVenue) {
      setVenues(venues.map(v => v.id === venue.id ? venue : v));
      setEditingVenue(null);
    } else {
      setVenues([...venues, { ...venue, id: Date.now().toString() }]);
    }
  };

  const handleDeleteVenue = (id: string) => {
    setVenues(venues.filter(v => v.id !== id));
  };

  const handleSaveWeather = (weather: WeatherInfo) => {
    if (editingWeather) {
      setWeatherData(weatherData.map(w => w.id === weather.id ? weather : w));
      setEditingWeather(null);
    } else {
      setWeatherData([...weatherData, { ...weather, id: Date.now().toString() }]);
    }
  };

  const handleSaveConditions = (conditions: MatchConditions) => {
    if (editingConditions) {
      setMatchConditions(matchConditions.map(c => c.id === conditions.id ? conditions : c));
      setEditingConditions(null);
    } else {
      setMatchConditions([...matchConditions, { ...conditions, id: Date.now().toString() }]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <WPLAdminSidebarNew />
      <AuroraBackground />
      <div className="relative z-10 lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-4">WPL Match Day Admin</h1>
          <p className="text-gray-300">Manage venues, weather data, and match conditions for Women's Premier League</p>
        </div>
      </div>
    </div>
  );
}

// Venue Edit Modal
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
        className="bg-purple-900/90 backdrop-blur-md rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-purple-400/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Edit Venue</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Venue Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          />
          <input
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          />
          <input
            type="number"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          />
          <input
            type="text"
            placeholder="Pitch Type"
            value={formData.pitchType}
            onChange={(e) => setFormData({ ...formData, pitchType: e.target.value })}
            className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          />
          <input
            type="text"
            placeholder="Dimensions"
            value={formData.dimensions}
            onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
            className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          />
          <input
            type="number"
            placeholder="Established Year"
            value={formData.established}
            onChange={(e) => setFormData({ ...formData, established: parseInt(e.target.value) })}
            className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          />
          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={formData.floodlights}
              onChange={(e) => setFormData({ ...formData, floodlights: e.target.checked })}
              className="rounded"
            />
            Floodlights Available
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
          <motion.button
            onClick={() => onSave(formData)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Save size={16} />
            Save
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Weather Edit Modal
function WeatherEditModal({ weather, venues, onSave, onCancel }: {
  weather: WeatherInfo;
  venues: VenueInfo[];
  onSave: (weather: WeatherInfo) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(weather);

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-purple-900/90 backdrop-blur-md rounded-xl p-6 w-full max-w-md border border-purple-400/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Edit Weather</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <select
            value={formData.venueId}
            onChange={(e) => setFormData({ ...formData, venueId: e.target.value })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          >
            <option value="">Select Venue</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Temperature (°C)"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: parseInt(e.target.value) })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          />
          <input
            type="number"
            placeholder="Humidity (%)"
            value={formData.humidity}
            onChange={(e) => setFormData({ ...formData, humidity: parseInt(e.target.value) })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          />
          <input
            type="number"
            placeholder="Wind Speed (km/h)"
            value={formData.windSpeed}
            onChange={(e) => setFormData({ ...formData, windSpeed: parseInt(e.target.value) })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          />
          <select
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          >
            <option value="sunny">Sunny</option>
            <option value="cloudy">Cloudy</option>
            <option value="rainy">Rainy</option>
            <option value="overcast">Overcast</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
          <motion.button
            onClick={() => onSave(formData)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Save size={16} />
            Save
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Conditions Edit Modal
function ConditionsEditModal({ conditions, venues, onSave, onCancel }: {
  conditions: MatchConditions;
  venues: VenueInfo[];
  onSave: (conditions: MatchConditions) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(conditions);

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-purple-900/90 backdrop-blur-md rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-purple-400/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Edit Match Conditions</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <select
            value={formData.venueId}
            onChange={(e) => setFormData({ ...formData, venueId: e.target.value })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          >
            <option value="">Select Venue</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Match ID"
            value={formData.matchId}
            onChange={(e) => setFormData({ ...formData, matchId: e.target.value })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          />
          <textarea
            placeholder="Pitch Report"
            value={formData.pitchReport}
            onChange={(e) => setFormData({ ...formData, pitchReport: e.target.value })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 h-24 border border-purple-400/20"
          />
          <textarea
            placeholder="Outfield Condition"
            value={formData.outfieldCondition}
            onChange={(e) => setFormData({ ...formData, outfieldCondition: e.target.value })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 h-20 border border-purple-400/20"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Avg First Innings Score"
              value={formData.avgFirstInnings}
              onChange={(e) => setFormData({ ...formData, avgFirstInnings: parseInt(e.target.value) })}
              className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
            />
            <input
              type="number"
              placeholder="Avg Chasing Score"
              value={formData.avgChasing}
              onChange={(e) => setFormData({ ...formData, avgChasing: parseInt(e.target.value) })}
              className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
            />
          </div>
          <textarea
            placeholder="Toss Impact Analysis"
            value={formData.tossImpact}
            onChange={(e) => setFormData({ ...formData, tossImpact: e.target.value })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 h-20 border border-purple-400/20"
          />
          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={formData.expectedDew}
              onChange={(e) => setFormData({ ...formData, expectedDew: e.target.checked })}
              className="rounded"
            />
            Dew Expected
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
          <motion.button
            onClick={() => onSave(formData)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Save size={16} />
            Save
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
