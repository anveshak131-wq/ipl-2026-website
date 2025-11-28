'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Palette, Download, Save, User, Mail, Moon, Sun } from 'lucide-react';

interface AdminPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  itemsPerPage: number;
  autoSave: boolean;
  showTooltips: boolean;
}

interface NotificationPreferences {
  email: {
    enabled: boolean;
    onCreate: boolean;
    onUpdate: boolean;
    onDelete: boolean;
    onError: boolean;
  };
  inApp: {
    enabled: boolean;
    onCreate: boolean;
    onUpdate: boolean;
    onDelete: boolean;
    onError: boolean;
  };
  sound: {
    enabled: boolean;
    volume: number;
  };
}

interface ExportSettings {
  defaultFormat: 'csv' | 'excel' | 'json' | 'pdf';
  includeHeaders: boolean;
  dateFormat: string;
  delimiter: string;
  autoDownload: boolean;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'preferences' | 'notifications' | 'theme' | 'export'>('preferences');
  const [preferences, setPreferences] = useState<AdminPreferences>({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    itemsPerPage: 25,
    autoSave: true,
    showTooltips: true,
  });
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      onCreate: true,
      onUpdate: false,
      onDelete: true,
      onError: true,
    },
    inApp: {
      enabled: true,
      onCreate: true,
      onUpdate: true,
      onDelete: true,
      onError: true,
    },
    sound: {
      enabled: false,
      volume: 50,
    },
  });
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    defaultFormat: 'csv',
    includeHeaders: true,
    dateFormat: 'MM/DD/YYYY',
    delimiter: ',',
    autoDownload: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('admin_preferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      }

      const storedNotifications = localStorage.getItem('admin_notifications');
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }

      const storedExport = localStorage.getItem('admin_export_settings');
      if (storedExport) {
        setExportSettings(JSON.parse(storedExport));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('admin_preferences', JSON.stringify(preferences));
      localStorage.setItem('admin_notifications', JSON.stringify(notifications));
      localStorage.setItem('admin_export_settings', JSON.stringify(exportSettings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const tabs = [
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'export', label: 'Export', icon: Download },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-[#2F6FED]" />
          <h2 className="text-2xl font-bold text-[#E6EDF3]">Admin Settings</h2>
        </div>
        <button
          onClick={saveSettings}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-[#2F6FED] text-white hover:bg-[#2563EB]'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{saved ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2A3440]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#2F6FED] text-[#E6EDF3]'
                  : 'border-transparent text-[#AEBAC7] hover:text-[#E6EDF3]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6 bg-[#141A22] border border-[#2A3440] rounded-lg">
        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Timezone</label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="w-full px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Asia/Kolkata">India Standard Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Date Format</label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                className="w-full px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-2">
                Items Per Page
              </label>
              <input
                type="number"
                value={preferences.itemsPerPage}
                onChange={(e) =>
                  setPreferences({ ...preferences, itemsPerPage: parseInt(e.target.value) || 25 })
                }
                min="10"
                max="100"
                className="w-full px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-[#E6EDF3]">Auto-save</label>
                <p className="text-xs text-[#AEBAC7] mt-1">Automatically save changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.autoSave}
                  onChange={(e) => setPreferences({ ...preferences, autoSave: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#2A3440] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2F6FED] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2F6FED]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-[#E6EDF3]">Show Tooltips</label>
                <p className="text-xs text-[#AEBAC7] mt-1">Display helpful tooltips</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.showTooltips}
                  onChange={(e) =>
                    setPreferences({ ...preferences, showTooltips: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#2A3440] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2F6FED] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2F6FED]"></div>
              </label>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#E6EDF3] mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </h3>
              <div className="space-y-4 pl-7">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#E6EDF3]">Enable Email Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.email.enabled}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          email: { ...notifications.email, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#2A3440] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2F6FED] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2F6FED]"></div>
                  </label>
                </div>
                {notifications.email.enabled && (
                  <div className="space-y-3 pl-4 border-l border-[#2A3440]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#AEBAC7]">On Create</span>
                      <input
                        type="checkbox"
                        checked={notifications.email.onCreate}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            email: { ...notifications.email, onCreate: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2F6FED] bg-[#0B0F13] border-[#2A3440] rounded focus:ring-[#2F6FED]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#AEBAC7]">On Update</span>
                      <input
                        type="checkbox"
                        checked={notifications.email.onUpdate}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            email: { ...notifications.email, onUpdate: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2F6FED] bg-[#0B0F13] border-[#2A3440] rounded focus:ring-[#2F6FED]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#AEBAC7]">On Delete</span>
                      <input
                        type="checkbox"
                        checked={notifications.email.onDelete}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            email: { ...notifications.email, onDelete: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2F6FED] bg-[#0B0F13] border-[#2A3440] rounded focus:ring-[#2F6FED]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#AEBAC7]">On Error</span>
                      <input
                        type="checkbox"
                        checked={notifications.email.onError}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            email: { ...notifications.email, onError: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2F6FED] bg-[#0B0F13] border-[#2A3440] rounded focus:ring-[#2F6FED]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#E6EDF3] mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                In-App Notifications
              </h3>
              <div className="space-y-4 pl-7">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#E6EDF3]">Enable In-App Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.inApp.enabled}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          inApp: { ...notifications.inApp, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#2A3440] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2F6FED] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2F6FED]"></div>
                  </label>
                </div>
                {notifications.inApp.enabled && (
                  <div className="space-y-3 pl-4 border-l border-[#2A3440]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#AEBAC7]">On Create</span>
                      <input
                        type="checkbox"
                        checked={notifications.inApp.onCreate}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            inApp: { ...notifications.inApp, onCreate: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2F6FED] bg-[#0B0F13] border-[#2A3440] rounded focus:ring-[#2F6FED]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#AEBAC7]">On Update</span>
                      <input
                        type="checkbox"
                        checked={notifications.inApp.onUpdate}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            inApp: { ...notifications.inApp, onUpdate: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2F6FED] bg-[#0B0F13] border-[#2A3440] rounded focus:ring-[#2F6FED]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#AEBAC7]">On Delete</span>
                      <input
                        type="checkbox"
                        checked={notifications.inApp.onDelete}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            inApp: { ...notifications.inApp, onDelete: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2F6FED] bg-[#0B0F13] border-[#2A3440] rounded focus:ring-[#2F6FED]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#AEBAC7]">On Error</span>
                      <input
                        type="checkbox"
                        checked={notifications.inApp.onError}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            inApp: { ...notifications.inApp, onError: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2F6FED] bg-[#0B0F13] border-[#2A3440] rounded focus:ring-[#2F6FED]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#E6EDF3] mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Sound Settings
              </h3>
              <div className="space-y-4 pl-7">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#E6EDF3]">Enable Sound</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.sound.enabled}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          sound: { ...notifications.sound, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#2A3440] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2F6FED] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2F6FED]"></div>
                  </label>
                </div>
                {notifications.sound.enabled && (
                  <div>
                    <label className="block text-sm text-[#AEBAC7] mb-2">
                      Volume: {notifications.sound.volume}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={notifications.sound.volume}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          sound: { ...notifications.sound, volume: parseInt(e.target.value) },
                        })
                      }
                      className="w-full h-2 bg-[#2A3440] rounded-lg appearance-none cursor-pointer accent-[#2F6FED]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Theme Tab */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-4">Theme</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'auto', label: 'Auto', icon: Settings },
                ].map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <button
                      key={theme.value}
                      onClick={() => setPreferences({ ...preferences, theme: theme.value as any })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        preferences.theme === theme.value
                          ? 'border-[#2F6FED] bg-[#1A2332]'
                          : 'border-[#2A3440] bg-[#0B0F13] hover:border-[#2F6FED]/50'
                      }`}
                    >
                      <Icon className="w-6 h-6 text-[#E6EDF3] mx-auto mb-2" />
                      <div className="text-sm font-medium text-[#E6EDF3]">{theme.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-4">Accent Color</label>
              <div className="grid grid-cols-6 gap-3">
                {[
                  '#2F6FED',
                  '#7B61FF',
                  '#10B981',
                  '#F59E0B',
                  '#EF4444',
                  '#EC4899',
                ].map((color) => (
                  <button
                    key={color}
                    className="w-12 h-12 rounded-lg border-2 border-[#2A3440] hover:border-[#2F6FED] transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-2">
                Default Export Format
              </label>
              <select
                value={exportSettings.defaultFormat}
                onChange={(e) =>
                  setExportSettings({
                    ...exportSettings,
                    defaultFormat: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Date Format</label>
              <select
                value={exportSettings.dateFormat}
                onChange={(e) =>
                  setExportSettings({ ...exportSettings, dateFormat: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="ISO">ISO 8601</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-2">CSV Delimiter</label>
              <select
                value={exportSettings.delimiter}
                onChange={(e) => setExportSettings({ ...exportSettings, delimiter: e.target.value })}
                className="w-full px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-[#E6EDF3]">Include Headers</label>
                <p className="text-xs text-[#AEBAC7] mt-1">Include column headers in exports</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportSettings.includeHeaders}
                  onChange={(e) =>
                    setExportSettings({ ...exportSettings, includeHeaders: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#2A3440] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2F6FED] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2F6FED]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-[#E6EDF3]">Auto Download</label>
                <p className="text-xs text-[#AEBAC7] mt-1">Automatically download exports</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportSettings.autoDownload}
                  onChange={(e) =>
                    setExportSettings({ ...exportSettings, autoDownload: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#2A3440] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2F6FED] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2F6FED]"></div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

