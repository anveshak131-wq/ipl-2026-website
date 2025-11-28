'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Bell, BellOff, Volume2, VolumeX, Vibrate } from 'lucide-react';
import type { NotificationPreferences } from '@/types/notifications';

interface NotificationPreferencesProps {
  preferences: NotificationPreferences;
  onUpdate: (preferences: NotificationPreferences) => void;
}

export default function NotificationPreferencesComponent({
  preferences,
  onUpdate,
}: NotificationPreferencesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleToggle = (category: keyof NotificationPreferences, field: 'enabled' | 'sound' | 'vibration') => {
    const updated = {
      ...localPrefs,
      [category]: {
        ...localPrefs[category],
        [field]: !localPrefs[category][field],
      },
    };
    setLocalPrefs(updated);
    onUpdate(updated);
  };

  const categories = [
    { key: 'matches' as const, label: 'Matches', icon: '🏏' },
    { key: 'news' as const, label: 'News', icon: '📰' },
    { key: 'predictions' as const, label: 'Predictions', icon: '🔮' },
  ];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300 flex items-center gap-2"
      >
        <Settings className="w-5 h-5 text-white" />
        <span className="text-white font-semibold">Preferences</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="absolute top-full right-0 mt-2 w-96 bg-[rgba(10,14,39,0.98)] backdrop-blur-2xl border border-white/20 rounded-xl p-6 shadow-2xl z-50"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Notification Preferences
              </h3>

              <div className="space-y-4">
                {categories.map((category) => {
                  const prefs = localPrefs[category.key];
                  return (
                    <div
                      key={category.key}
                      className="p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{category.icon}</span>
                          <span className="font-semibold text-white">{category.label}</span>
                        </div>
                        <button
                          onClick={() => handleToggle(category.key, 'enabled')}
                          className={`p-2 rounded-lg transition-all duration-300 ${
                            prefs.enabled
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {prefs.enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                        </button>
                      </div>

                      {prefs.enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pt-2 border-t border-white/10"
                        >
                          <button
                            onClick={() => handleToggle(category.key, 'sound')}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
                              prefs.sound
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-500/10 text-gray-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {prefs.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                              <span className="text-sm">Sound</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleToggle(category.key, 'vibration')}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
                              prefs.vibration
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-gray-500/10 text-gray-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Vibrate className="w-4 h-4" />
                              <span className="text-sm">Vibration</span>
                            </div>
                          </button>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

