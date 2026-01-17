'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/data';

// Mark this page as dynamic to prevent pre-rendering
// Note: Removed for static export compatibility

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
  const [authLoading, setAuthLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({
    siteName: 'SportsUP18',
    siteDescription: 'The biggest cricket tournament in the world',
    maintenanceMode: false,
    aiPredictionsEnabled: false,
    aiModel: 'gpt-4',
    maxUploadSize: 50,
    emailNotifications: true,
    analyticsEnabled: true
  });

  useEffect(() => {
    // Check authentication on client side only
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/ipl-admin-2026');
          return;
        }
        setIsAuthenticated(true);
        fetchSettings();
      } catch (error) {
        // localStorage not available, redirect to login
        router.push('/ipl-admin-2026');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const fetchedSettings = await api.getSettings();
      if (fetchedSettings && Object.keys(fetchedSettings).length > 0) {
        setSettings(fetchedSettings);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await api.updateSettings(settings);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                  System Settings
                </h1>
                <p className="text-gray-400 text-lg">
                  Configure your platform settings and preferences
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${
                    !error && !success ? 'bg-green-500 animate-pulse' : error ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    !error && !success ? 'text-green-400' : error ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {!error && !success ? 'Ready' : error ? 'Error' : 'Saved'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 backdrop-blur-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl text-red-400 backdrop-blur-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-8">
            {/* General Settings */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">General Settings</h2>
                  <p className="text-gray-400">Basic platform configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Enter site name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300">
                    Max Upload Size (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.maxUploadSize}
                    onChange={(e) => setSettings({...settings, maxUploadSize: parseInt(e.target.value)})}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    min="1"
                    max="500"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Site Description
                </label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  placeholder="Enter site description"
                  rows={3}
                />
              </div>

              <div className="mt-6">
                <label className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-600/50 cursor-pointer hover:bg-slate-800/50 transition-all">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">Maintenance Mode</div>
                    <div className="text-sm text-gray-400">Put the site in maintenance mode for updates</div>
                  </div>
                  {settings.maintenanceMode && (
                    <div className="flex items-center gap-1 text-orange-400 text-xs font-semibold bg-orange-500/10 px-2 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Active
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* AI Settings */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">AI & Intelligence</h2>
                  <p className="text-gray-400">Configure AI-powered features</p>
                </div>
              </div>

              <div className="space-y-6">
                <label className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-600/50 cursor-pointer hover:bg-slate-800/50 transition-all">
                  <input
                    type="checkbox"
                    checked={settings.aiPredictionsEnabled}
                    onChange={(e) => setSettings({...settings, aiPredictionsEnabled: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/20 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">AI Match Predictions</div>
                    <div className="text-sm text-gray-400">Enable AI-powered match predictions and insights</div>
                  </div>
                  {settings.aiPredictionsEnabled && (
                    <div className="flex items-center gap-1 text-green-400 text-xs font-semibold bg-green-500/10 px-2 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Enabled
                    </div>
                  )}
                </label>

                {settings.aiPredictionsEnabled && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">
                      AI Model
                    </label>
                    <select
                      value={settings.aiModel}
                      onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="gpt-4">GPT-4 (Recommended)</option>
                      <option value="gpt-3.5">GPT-3.5 Turbo</option>
                      <option value="claude">Claude</option>
                      <option value="custom">Custom Model</option>
                    </select>
                  </div>
                )}

                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm text-purple-300 font-medium mb-1">AI Features Status</p>
                      <p className="text-sm text-gray-300">
                        AI predictions are currently in beta. Enable this feature to show AI-powered insights on match pages and enhance user experience with intelligent content.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 0112 21c7.962 0 12-1.21 12-2.683m-12 2.683a17.925 17.925 0 01-7.132-8.317M12 21V9m0 0l-4 4m4-4l4 4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Notifications & Analytics</h2>
                  <p className="text-gray-400">Manage communication and tracking preferences</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-600/50 cursor-pointer hover:bg-slate-800/50 transition-all">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-green-500/20 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">Email Notifications</div>
                    <div className="text-sm text-gray-400">Send automated emails for important events</div>
                  </div>
                  {settings.emailNotifications && (
                    <div className="flex items-center gap-1 text-green-400 text-xs font-semibold bg-green-500/10 px-2 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Active
                    </div>
                  )}
                </label>

                <label className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-600/50 cursor-pointer hover:bg-slate-800/50 transition-all">
                  <input
                    type="checkbox"
                    checked={settings.analyticsEnabled}
                    onChange={(e) => setSettings({...settings, analyticsEnabled: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">Analytics Tracking</div>
                    <div className="text-sm text-gray-400">Track user behavior and platform performance</div>
                  </div>
                  {settings.analyticsEnabled && (
                    <div className="flex items-center gap-1 text-blue-400 text-xs font-semibold bg-blue-500/10 px-2 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Enabled
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-gradient-to-br from-red-950/50 to-red-900/50 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-400">Danger Zone</h2>
                  <p className="text-red-300/80">Irreversible and destructive actions</p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-left transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-red-400 font-semibold">Clear Cache</div>
                      <div className="text-sm text-red-300/70">Clear all cached data and temporary files</div>
                    </div>
                    <svg className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                <button
                  type="button"
                  className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-left transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-red-400 font-semibold">Reset Database</div>
                      <div className="text-sm text-red-300/70">Reset all data to factory defaults</div>
                    </div>
                    <svg className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-slate-700/50">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                {isSaving ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Settings
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/ipl-admin-2026/dashboard')}
                className="px-6 py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 rounded-xl text-white font-semibold transition-all duration-200 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
