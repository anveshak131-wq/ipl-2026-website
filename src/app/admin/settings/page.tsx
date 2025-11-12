'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface Settings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  aiPredictionsEnabled: boolean;
  aiModel: string;
  maxUploadSize: number;
  emailNotifications: boolean;
  analyticsEnabled: boolean;
}

export default function AdminSettings() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    siteName: 'IPL 2026',
    siteDescription: 'The biggest cricket tournament in the world',
    maintenanceMode: false,
    aiPredictionsEnabled: false,
    aiModel: 'gpt-4',
    maxUploadSize: 50,
    emailNotifications: true,
    analyticsEnabled: true
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      // TODO: Replace with API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // TODO: Send to API
      console.log('Saving settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <AdminSidebar currentPage="/admin/settings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ipl-dark">
      <AdminSidebar currentPage="/admin/settings" />
      
      <div className="flex-1">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white mb-8">
            System Settings
          </h1>

          <form onSubmit={handleSaveSettings} className="space-y-8">
            {/* General Settings */}
            <div className="glass-effect rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                General Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    placeholder="Enter site name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    placeholder="Enter site description"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Enable Maintenance Mode
                  </label>
                </div>
              </div>
            </div>

            {/* AI Settings */}
            <div className="glass-effect rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                🤖 AI Settings
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                  <input
                    type="checkbox"
                    id="aiPredictions"
                    checked={settings.aiPredictionsEnabled}
                    onChange={(e) => setSettings({...settings, aiPredictionsEnabled: e.target.checked})}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="aiPredictions" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Enable AI-Powered Match Predictions
                  </label>
                </div>

                {settings.aiPredictionsEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      AI Model
                    </label>
                    <select
                      value={settings.aiModel}
                      onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5">GPT-3.5 Turbo</option>
                      <option value="claude">Claude</option>
                      <option value="custom">Custom Model</option>
                    </select>
                  </div>
                )}

                <div className="p-4 bg-ipl-purple/10 border border-ipl-purple/30 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-ipl-gold">Note:</span> AI predictions are currently in beta. Enable this feature to show AI-powered insights on match pages.
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Settings */}
            <div className="glass-effect rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Upload Settings
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Upload Size (MB)
                </label>
                <input
                  type="number"
                  value={settings.maxUploadSize}
                  onChange={(e) => setSettings({...settings, maxUploadSize: parseInt(e.target.value)})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                  min="1"
                  max="500"
                />
              </div>
            </div>

            {/* Notification Settings */}
            <div className="glass-effect rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Notification Settings
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Enable Email Notifications
                  </label>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                  <input
                    type="checkbox"
                    id="analytics"
                    checked={settings.analyticsEnabled}
                    onChange={(e) => setSettings({...settings, analyticsEnabled: e.target.checked})}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="analytics" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Enable Analytics Tracking
                  </label>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-effect rounded-xl p-8 border border-red-500/30">
              <h2 className="text-2xl font-bold text-red-400 mb-6">
                ⚠️ Danger Zone
              </h2>
              
              <div className="space-y-4">
                <button
                  type="button"
                  className="w-full px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition-all duration-200 border border-red-500/30"
                >
                  Clear Cache
                </button>
                <button
                  type="button"
                  className="w-full px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition-all duration-200 border border-red-500/30"
                >
                  Reset Database
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSaving}
                className="ipl-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/dashboard')}
                className="flex-1 glass-effect text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
