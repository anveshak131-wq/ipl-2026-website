'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { wplTeams } from '@/data/wpl-teams';
import { api } from '@/lib/data';

export default function AddWPLTeamsPage() {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [results, setResults] = useState<Array<{ team: any; success: boolean; error?: string }>>([]);
  const [allAdded, setAllAdded] = useState(false);

  const handleAddAllTeams = async () => {
    setIsAdding(true);
    setResults([]);
    setAllAdded(false);

    const newResults: Array<{ team: any; success: boolean; error?: string }> = [];

    for (const team of wplTeams) {
      try {
        const createdTeam = await api.createTeam(team);
        newResults.push({ team: createdTeam, success: true });
      } catch (error: any) {
        newResults.push({ 
          team, 
          success: false, 
          error: error?.message || 'Failed to create team' 
        });
      }
    }

    setResults(newResults);
    setIsAdding(false);
    setAllAdded(true);
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F13]">
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Add WPL Teams</h1>
            <p className="text-gray-400">Add all 5 WPL teams to the system with their logos, colors, and descriptions</p>
          </div>

          <div className="bg-[#141A22] rounded-xl p-6 mb-6 border border-[#2A3440]">
            <h2 className="text-xl font-semibold text-white mb-4">WPL Teams to Add:</h2>
            <div className="space-y-3">
              {wplTeams.map((team, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-[#0B0F13] rounded-lg border border-[#2A3440]">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                    {team.shortName}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{team.name}</div>
                    <div className="text-sm text-gray-400">{team.description.substring(0, 80)}...</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: team.colors.primary }}></div>
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: team.colors.secondary }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddAllTeams}
            disabled={isAdding || allAdded}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Adding Teams...' : allAdded ? 'Teams Added!' : 'Add All WPL Teams'}
          </button>

          {results.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-xl font-semibold text-white mb-4">Results:</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{result.team.name}</div>
                      {result.success ? (
                        <div className="text-sm text-green-400">✅ Successfully added</div>
                      ) : (
                        <div className="text-sm text-red-400">❌ {result.error}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {allAdded && (
            <div className="mt-6">
              <button
                onClick={() => router.push('/ops/ipl/teams')}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                View All Teams
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

