'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Plus, Trash2, Edit3, Loader2, Check, X } from 'lucide-react';
import AuroraBackground from '@/components/ui/AuroraBackground';
import AnimatedSection from '@/components/ui/AnimatedSection';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';

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
      <WPLAdminSidebarNew />
      <div className="lg:ml-64">
      <AuroraBackground />
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-4">Venue Management</h1>
          <p className="text-gray-300">Add and manage cricket venues with automatic information retrieval</p>
        </div>
      </div>
      </div>
    </div>
  );
}
