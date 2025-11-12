'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Mark this page as dynamic to prevent pre-rendering
export const dynamic = 'force-dynamic';
import { Match } from '@/types';
import { api } from '@/lib/data';

export default function AdminMatches() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);
    fetchMatches();
  }, [router]);

  const fetchMatches = async () => {
    try {
      const matchesData = await api.getMatches();
      setMatches(matchesData);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <AdminSidebar currentPage="/admin/matches" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ipl-dark">
      <AdminSidebar currentPage="/admin/matches" />
      
      <div className="flex-1">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              Manage Matches
            </h1>
            <button className="ipl-button">
              Add New Match
            </button>
          </div>

          {/* Matches Table */}
          <div className="glass-effect rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Teams
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {matches.map((match) => (
                    <tr key={match.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {match.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {match.team1.shortName} vs {match.team2.shortName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {match.venue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          match.status === 'live' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : match.status === 'completed'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {match.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex space-x-2">
                          <button className="text-ipl-gold hover:text-ipl-purple transition-colors">
                            Edit
                          </button>
                          <button className="text-red-400 hover:text-red-300 transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TODO: Add match form modal */}
          <div className="mt-8 text-center">
            <div className="glass-effect rounded-xl p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-white mb-4">
                Match Management
              </h3>
              <p className="text-gray-300 mb-6">
                Add, edit, and manage IPL match schedules, venues, and results.
              </p>
              <div className="flex space-x-4 justify-center">
                <button className="ipl-button">
                  Import Schedule
                </button>
                <button className="glass-effect text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-all duration-200">
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
