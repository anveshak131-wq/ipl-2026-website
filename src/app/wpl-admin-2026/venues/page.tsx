'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Plus, Trash2, Edit3, Loader2, Check, X } from 'lucide-react';
import AnimatedSection from '@/components/ui/AnimatedSection';

interface Venue {
  id: string;
  name: string;
  city?: string;
  lat?: number;
  lng?: number;
  capacity?: number;
  pitchType?: string;
  floodlights?: boolean;
  dimensions?: string;
  established?: number;
  timezone?: string;
  country?: string;
}

interface VenueSearchResult {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  capacity?: number;
  established?: number;
  timezone: string;
}

export default function VenuesAdmin() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VenueSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/venues');
      const data = await response.json();
      setVenues(data.venues || []);
    } catch (error) {
      console.error('Failed to load venues:', error);
      setError('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const searchVenues = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      // Search using multiple APIs for comprehensive results
      const results = await Promise.allSettled([
        searchViaNominatim(searchQuery),
        searchViaOpenCage(searchQuery),
        searchStadiumDatabase(searchQuery)
      ]);

      const allResults = results
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => (result as PromiseFulfilledResult<VenueSearchResult[]>).value);

      // Remove duplicates based on coordinates
      const uniqueResults = allResults.filter((result, index, self) =>
        index === self.findIndex(r => 
          Math.abs(r.lat - result.lat) < 0.001 && Math.abs(r.lng - result.lng) < 0.001
        )
      );

      setSearchResults(uniqueResults.slice(0, 5)); // Limit to 5 results
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search venues');
    } finally {
      setIsSearching(false);
    }
  };

  const searchViaNominatim = async (query: string): Promise<VenueSearchResult[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)} stadium&limit=3`
      );
      const data = await response.json();
      
      return data.map((item: any) => ({
        name: item.display_name.split(',')[0],
        city: item.address?.city || item.address?.town || item.address?.village || 'Unknown',
        country: item.address?.country || 'Unknown',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        timezone: 'UTC' // Would need additional API call for timezone
      }));
    } catch (error) {
      return [];
    }
  };

  const searchViaOpenCage = async (query: string): Promise<VenueSearchResult[]> => {
    try {
      // Note: You'd need to add OPENCAGE_API_KEY to environment
      const response = await fetch(
        `/api/geocoding?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      return [];
    }
  };

  const searchStadiumDatabase = async (query: string): Promise<VenueSearchResult[]> => {
    // Mock stadium database - in production, this would query a real stadium database
    const stadiumDB: { [key: string]: VenueSearchResult } = {
      'wankhede': {
        name: 'Wankhede Stadium',
        city: 'Mumbai',
        country: 'India',
        lat: 19.0,
        lng: 72.9,
        capacity: 33000,
        established: 1974,
        timezone: 'Asia/Kolkata'
      },
      'chinnaswamy': {
        name: 'M. Chinnaswamy Stadium',
        city: 'Bengaluru',
        country: 'India',
        lat: 12.9,
        lng: 77.6,
        capacity: 38000,
        established: 1969,
        timezone: 'Asia/Kolkata'
      },
      'eden gardens': {
        name: 'Eden Gardens',
        city: 'Kolkata',
        country: 'India',
        lat: 22.6,
        lng: 88.4,
        capacity: 66000,
        established: 1864,
        timezone: 'Asia/Kolkata'
      },
      'chepauk': {
        name: 'M. A. Chidambaram Stadium',
        city: 'Chennai',
        country: 'India',
        lat: 13.1,
        lng: 80.3,
        capacity: 50000,
        established: 1916,
        timezone: 'Asia/Kolkata'
      },
      'arun jaitley': {
        name: 'Arun Jaitley Stadium',
        city: 'Delhi',
        country: 'India',
        lat: 28.6,
        lng: 77.2,
        capacity: 55000,
        established: 1883,
        timezone: 'Asia/Kolkata'
      }
    };

    const results: VenueSearchResult[] = [];
    for (const [key, stadium] of Object.entries(stadiumDB)) {
      if (query.toLowerCase().includes(key) || key.includes(query.toLowerCase())) {
        results.push(stadium);
      }
    }
    return results;
  };

  const addVenue = async (searchResult: VenueSearchResult) => {
    try {
      // First enrich the venue information
      const enrichedResponse = await fetch(`/api/stadium-info?venue=${encodeURIComponent(searchResult.name)}&city=${encodeURIComponent(searchResult.city)}`);
      const enrichedData = await enrichedResponse.json();
      
      const venueData = {
        ...searchResult,
        ...enrichedData,
        // Ensure required fields have defaults
        pitchType: enrichedData.pitchType || 'Red Soil',
        floodlights: enrichedData.floodlights !== undefined ? enrichedData.floodlights : true,
        dimensions: enrichedData.dimensions || '64m x 64m'
      };

      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venueData)
      });

      if (response.ok) {
        await loadVenues();
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to add venue:', error);
      setError('Failed to add venue');
    }
  };

  const updateVenue = async (venue: Venue) => {
    try {
      const response = await fetch('/api/venues', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venue)
      });

      if (response.ok) {
        await loadVenues();
        setEditingVenue(null);
      }
    } catch (error) {
      console.error('Failed to update venue:', error);
      setError('Failed to update venue');
    }
  };

  const deleteVenue = async (id: string) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;

    try {
      const response = await fetch('/api/venues', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        await loadVenues();
      }
    } catch (error) {
      console.error('Failed to delete venue:', error);
      setError('Failed to delete venue');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <AuroraBackground />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AnimatedSection>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Venue Management</h1>
              <p className="text-gray-300">Add and manage cricket venues with automatic information retrieval</p>
            </div>
          </AnimatedSection>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* Search Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Venue</h2>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchVenues()}
                placeholder="Enter venue name (e.g., Wankhede Stadium, Eden Gardens)"
                className="w-full pl-10 pr-4 py-3 bg-white/10 text-white placeholder-gray-400 border border-purple-400/20 rounded-lg focus:outline-none focus:border-purple-400"
              />
            </div>
            <button
              onClick={searchVenues}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Search size={20} />
              )}
              Search
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-medium">Search Results:</h3>
              {searchResults.map((result, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-purple-400/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{result.name}</h4>
                      <p className="text-gray-400 text-sm">
                        <MapPin size={14} className="inline mr-1" />
                        {result.city}, {result.country}
                      </p>
                      <p className="text-gray-500 text-xs">
                        Coordinates: {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                      </p>
                      {result.capacity && (
                        <p className="text-gray-500 text-xs">Capacity: {result.capacity.toLocaleString()}</p>
                      )}
                    </div>
                    <button
                      onClick={() => addVenue(result)}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Existing Venues */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20">
          <h2 className="text-xl font-semibold text-white mb-4">Existing Venues ({venues.length})</h2>
          
          {venues.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No venues added yet. Search and add venues above.</p>
          ) : (
            <div className="space-y-4">
              {venues.map((venue) => (
                <div key={venue.id} className="bg-white/5 rounded-lg p-4 border border-purple-400/10">
                  {editingVenue?.id === venue.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingVenue.name}
                        onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })}
                        className="w-full p-2 bg-white/10 text-white border border-purple-400/20 rounded"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editingVenue.city || ''}
                          onChange={(e) => setEditingVenue({ ...editingVenue, city: e.target.value })}
                          placeholder="City"
                          className="p-2 bg-white/10 text-white border border-purple-400/20 rounded"
                        />
                        <input
                          type="number"
                          value={editingVenue.capacity || ''}
                          onChange={(e) => setEditingVenue({ ...editingVenue, capacity: parseInt(e.target.value) })}
                          placeholder="Capacity"
                          className="p-2 bg-white/10 text-white border border-purple-400/20 rounded"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateVenue(editingVenue)}
                          className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Check size={20} />
                        </button>
                        <button
                          onClick={() => setEditingVenue(null)}
                          className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{venue.name}</h3>
                        <p className="text-gray-400 text-sm">
                          <MapPin size={14} className="inline mr-1" />
                          {venue.city} {venue.lat && venue.lng && `(${venue.lat.toFixed(4)}, ${venue.lng.toFixed(4)})`}
                        </p>
                        <div className="flex gap-4 text-xs text-gray-500 mt-1">
                          {venue.capacity && <span>Capacity: {venue.capacity.toLocaleString()}</span>}
                          {venue.established && <span>Est: {venue.established}</span>}
                          {venue.pitchType && <span>Pitch: {venue.pitchType}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingVenue(venue)}
                          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Edit3 size={20} />
                        </button>
                        <button
                          onClick={() => deleteVenue(venue.id)}
                          className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
