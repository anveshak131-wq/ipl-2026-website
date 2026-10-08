'use client';

import { useState, useEffect } from 'react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';

export default function WPLSettingsPage() {
  const [settings, setSettings] = useState({
    tournamentName: 'Women\'s Premier League 2026',
    season: '2026',
    startDate: '2026-03-15',
    endDate: '2026-04-20',
    teamsCount: 5,
    matchesPerTeam: 8,
    playoffTeams: 3
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <div className="lg:ml-64 p-6">
      <AnimatedSection>
        <GradientText className="text-4xl font-bold mb-8">
          WPL Settings
        </GradientText>
        
        {message && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
            {message}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 max-w-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Tournament Name
              </label>
              <input
                type="text"
                value={settings.tournamentName}
                onChange={(e) => setSettings({...settings, tournamentName: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Season
              </label>
              <input
                type="text"
                value={settings.season}
                onChange={(e) => setSettings({...settings, season: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => setSettings({...settings, startDate: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={settings.endDate}
                  onChange={(e) => setSettings({...settings, endDate: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Teams Count
                </label>
                <input
                  type="number"
                  value={settings.teamsCount}
                  onChange={(e) => setSettings({...settings, teamsCount: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Matches Per Team
                </label>
                <input
                  type="number"
                  value={settings.matchesPerTeam}
                  onChange={(e) => setSettings({...settings, matchesPerTeam: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Playoff Teams
                </label>
                <input
                  type="number"
                  value={settings.playoffTeams}
                  onChange={(e) => setSettings({...settings, playoffTeams: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </AnimatedSection>
      </div>
    </div>
  );
}
