'use client';

import { useState, useEffect } from 'react';
import WeatherWidget from '@/components/WeatherWidget';

// Sample venue data - matching your existing venue structure
const sampleVenues = [
  {
    id: '1',
    name: 'M. Chinnaswamy Stadium',
    city: 'Bengaluru',
    lat: 12.9,
    lng: 77.6
  },
  {
    id: '2',
    name: 'M. A. Chidambaram Stadium',
    city: 'Chennai',
    lat: 13.1,
    lng: 80.3
  },
  {
    id: '3',
    name: 'Eden Gardens',
    city: 'Kolkata',
    lat: 22.6,
    lng: 88.4
  }
];

export default function WeatherDemo() {
  const [selectedVenue, setSelectedVenue] = useState(sampleVenues[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Stadium Weather Monitor
        </h1>
        
        {/* Venue Selector */}
        <div className="mb-8">
          <label className="block text-white mb-2">Select Venue:</label>
          <select 
            value={selectedVenue.id}
            onChange={(e) => {
              const venue = sampleVenues.find(v => v.id === e.target.value);
              if (venue) setSelectedVenue(venue);
            }}
            className="w-full p-3 rounded-lg bg-white/10 text-white border border-purple-400/20"
          >
            {sampleVenues.map(venue => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>

        {/* Weather Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeatherWidget venue={selectedVenue} />
          
          {/* Additional Weather Info */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-purple-400/20">
            <h3 className="text-xl font-semibold text-white mb-4">
              Weather Impact Assessment
            </h3>
            <div className="space-y-3 text-gray-300">
              <p>• Temperature: Optimal for cricket (20-30°C)</p>
              <p>• Humidity: Moderate levels expected</p>
              <p>• Wind Speed: Minimal impact on gameplay</p>
              <p>• Rain Risk: Check precipitation probability</p>
            </div>
          </div>
        </div>

        {/* All Venues Weather */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">All Venues Weather</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleVenues.map(venue => (
              <div key={venue.id}>
                <h3 className="text-white font-medium mb-2">{venue.name}</h3>
                <WeatherWidget venue={venue} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
