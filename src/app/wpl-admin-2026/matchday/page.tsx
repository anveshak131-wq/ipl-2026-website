'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Thermometer, Wind, Droplets, Eye, Edit, Trash2, Plus, Save, X } from 'lucide-react';
import AuroraBackground from '@/components/ui/AuroraBackground';
import GradientText from '@/components/ui/GradientText';
import AnimatedSection from '@/components/ui/AnimatedSection';

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
    <>
      <AnimatedSection>
        <div className="text-center mb-8">
          <GradientText className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400">
            WPL Match Day Admin
          </GradientText>
          <p className="text-gray-300 text-lg">
            Manage venues, weather data, and match conditions for Women's Premier League
          </p>
        </div>
      </AnimatedSection>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {['venues', 'weather', 'conditions'].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Venues Tab */}
          {activeTab === 'venues' && (
            <AnimatedSection>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Venue Management</h2>
                  <motion.button
                    onClick={() => setEditingVenue({
                      id: '',
                      name: '',
                      city: '',
                      capacity: 0,
                      pitchType: '',
                      floodlights: false,
                      dimensions: '',
                      established: new Date().getFullYear()
                    })}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={20} />
                    Add Venue
                  </motion.button>
                </div>

                <div className="grid gap-4">
                  {venues.map((venue) => (
                    <motion.div
                      key={venue.id}
                      className="bg-white/5 rounded-lg p-4 border border-purple-400/10"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{venue.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300">
                            <div className="flex items-center gap-2">
                              <MapPin size={16} />
                              {venue.city}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={16} />
                              Est. {venue.established}
                            </div>
                            <div>Capacity: {venue.capacity.toLocaleString()}</div>
                            <div>Pitch: {venue.pitchType}</div>
                            <div>Dimensions: {venue.dimensions}</div>
                            <div>Floodlights: {venue.floodlights ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => setEditingVenue(venue)}
                            className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Edit size={16} />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteVenue(venue.id)}
                            className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
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
            </AnimatedSection>
          )}

          {/* Weather Tab */}
          {activeTab === 'weather' && (
            <AnimatedSection>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Weather Management</h2>
                  <motion.button
                    onClick={() => setEditingWeather({
                      id: '',
                      venueId: '',
                      temperature: 0,
                      humidity: 0,
                      windSpeed: 0,
                      condition: 'sunny',
                      lastUpdated: new Date().toISOString()
                    })}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={20} />
                    Add Weather
                  </motion.button>
                </div>

                <div className="grid gap-4">
                  {weatherData.map((weather) => (
                    <motion.div
                      key={weather.id}
                      className="bg-white/5 rounded-lg p-4 border border-purple-400/10"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-300">
                            <div className="flex items-center gap-2">
                              <Thermometer size={16} />
                              {weather.temperature}°C
                            </div>
                            <div className="flex items-center gap-2">
                              <Droplets size={16} />
                              {weather.humidity}%
                            </div>
                            <div className="flex items-center gap-2">
                              <Wind size={16} />
                              {weather.windSpeed} km/h
                            </div>
                            <div>Condition: {weather.condition}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => setEditingWeather(weather)}
                            className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Edit size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Match Conditions Tab */}
          {activeTab === 'conditions' && (
            <AnimatedSection>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Match Conditions</h2>
                  <motion.button
                    onClick={() => setEditingConditions({
                      id: '',
                      venueId: '',
                      matchId: '',
                      pitchReport: '',
                      outfieldCondition: '',
                      expectedDew: false,
                      avgFirstInnings: 0,
                      avgChasing: 0,
                      tossImpact: ''
                    })}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={20} />
                    Add Conditions
                  </motion.button>
                </div>

                <div className="grid gap-4">
                  {matchConditions.map((conditions) => (
                    <motion.div
                      key={conditions.id}
                      className="bg-white/5 rounded-lg p-4 border border-purple-400/10"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2">Match: {conditions.matchId}</h3>
                          <div className="space-y-2 text-gray-300">
                            <div><strong>Pitch Report:</strong> {conditions.pitchReport}</div>
                            <div><strong>Outfield:</strong> {conditions.outfieldCondition}</div>
                            <div><strong>Dew Expected:</strong> {conditions.expectedDew ? 'Yes' : 'No'}</div>
                            <div><strong>Avg 1st Innings:</strong> {conditions.avgFirstInnings}</div>
                            <div><strong>Avg Chasing:</strong> {conditions.avgChasing}</div>
                            <div><strong>Toss Impact:</strong> {conditions.tossImpact}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => setEditingConditions(conditions)}
                            className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Edit size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Edit Modals */}
          {editingVenue && (
            <VenueEditModal
              venue={editingVenue}
              onSave={handleSaveVenue}
              onCancel={() => setEditingVenue(null)}
            />
          )}
          {editingWeather && (
            <WeatherEditModal
              weather={editingWeather}
              venues={venues}
              onSave={handleSaveWeather}
              onCancel={() => setEditingWeather(null)}
            />
          )}
          {editingConditions && (
            <ConditionsEditModal
              conditions={editingConditions}
              venues={venues}
              onSave={handleSaveConditions}
              onCancel={() => setEditingConditions(null)}
            />
          )}
        </div>
      </>
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
