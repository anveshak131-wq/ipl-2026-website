'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Archive, Filter, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NotificationItem from '@/components/notifications/NotificationItem';
import NotificationPreferencesComponent from '@/components/notifications/NotificationPreferences';
import GradientText from '@/components/ui/GradientText';
import AnimatedSection from '@/components/ui/AnimatedSection';
import type { Notification, NotificationPreferences, NotificationGroup } from '@/types/notifications';

type NotificationCategory = 'all' | 'match' | 'news' | 'prediction';

export default function NotificationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    matches: { enabled: true, sound: true, vibration: false },
    news: { enabled: true, sound: false, vibration: false },
    predictions: { enabled: true, sound: false, vibration: false },
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Check notification permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      // Initialize match notifications after permission granted
      const { initializeMatchNotifications } = await import('@/services/matchNotificationScheduler');
      await initializeMatchNotifications();
    }
  };

  // Load preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('notificationPreferences');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    }
  }, []);

  // Load notifications from localStorage (mock data for now)
  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
        : null;

    if (!token) {
      setHasToken(false);
      setIsLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        // Try to load from API first
        const res = await fetch('/api/notifications?windowHours=168', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            setHasToken(false);
            setNotifications([]);
            setError(null);
            return;
          }
          // Fall through to localStorage
        } else {
          const data = await res.json();
          if (data.notifications && Array.isArray(data.notifications)) {
            // Convert API notifications to new format
            const converted = convertApiNotifications(data.notifications);
            setNotifications(converted);
            saveNotifications(converted);
            setIsLoading(false);
            return;
          }
        }

        // Load from localStorage as fallback
        const saved = loadNotificationsFromStorage();
        setNotifications(saved);
        setError(null);
      } catch (e) {
        console.error('Error loading notifications:', e);
        const saved = loadNotificationsFromStorage();
        setNotifications(saved);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Convert old API format to new format
  const convertApiNotifications = (apiNotifications: any[]): Notification[] => {
    return apiNotifications.map((n) => ({
      id: n.id,
      category: n.type === 'match_reminder' ? 'match' : 'news',
      title: n.title || (n.match ? `${n.match.team1?.shortName} vs ${n.match.team2?.shortName}` : 'Notification'),
      description: n.description || 'Upcoming event',
      link: n.matchId ? `/matches/${n.matchId}` : undefined,
      read: false,
      createdAt: n.startsAt || new Date().toISOString(),
      metadata: {
        matchId: n.matchId,
        match: n.match,
      },
    }));
  };

  // Load notifications from localStorage
  const loadNotificationsFromStorage = (): Notification[] => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing notifications:', e);
      }
    }
    return [];
  };

  // Save notifications to localStorage
  const saveNotifications = (notifs: Notification[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(notifs));
    }
  };

  // Filter and group notifications
  const filteredAndGrouped = useMemo(() => {
    let filtered = notifications.filter((n) => {
      if (showArchived) {
        // Show archived (read and older than 7 days)
        const daysAgo = (Date.now() - new Date(n.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return n.read && daysAgo > 7;
      } else {
        // Show active (unread or recent)
        const daysAgo = (Date.now() - new Date(n.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return !n.read || daysAgo <= 7;
      }
    });

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((n) => n.category === selectedCategory);
    }

    // Group by date
    const grouped: { [key: string]: Notification[] } = {};
    filtered.forEach((n) => {
      const date = new Date(n.createdAt);
      const dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(n);
    });

    // Convert to array and sort
    return Object.entries(grouped)
      .map(([date, notifs]) => ({
        date,
        notifications: notifs.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.notifications[0].createdAt).getTime();
        const dateB = new Date(b.notifications[0].createdAt).getTime();
        return dateB - dateA;
      });
  }, [notifications, selectedCategory, showArchived]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const handleMarkRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveNotifications(updated);
    playNotificationSound('read');
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
    playNotificationSound('read');
  };

  const handleDelete = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleArchive = () => {
    const now = Date.now();
    const updated = notifications.map((n) => {
      const daysAgo = (now - new Date(n.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (n.read && daysAgo > 7) {
        return { ...n, read: true };
      }
      return n;
    });
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handlePreferencesUpdate = (newPrefs: NotificationPreferences) => {
    setPreferences(newPrefs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationPreferences', JSON.stringify(newPrefs));
    }
  };

  const playNotificationSound = (type: 'read' | 'delete') => {
    if (typeof window === 'undefined') return;
    
    // Check if sound is enabled for any category
    const shouldPlay = preferences.matches.sound || preferences.news.sound || preferences.predictions.sound;
    if (!shouldPlay) return;

    try {
      // Create a simple beep sound using Web Audio API
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = type === 'read' ? 800 : 400;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      console.error('Error playing sound:', e);
    }

    // Vibration
    if ('vibrate' in navigator) {
      const shouldVibrate = preferences.matches.vibration || preferences.news.vibration || preferences.predictions.vibration;
      if (shouldVibrate) {
        try {
          navigator.vibrate(type === 'read' ? 50 : 100);
        } catch (e) {
          console.error('Error vibrating:', e);
        }
      }
    }
  };

  const categories: Array<{ value: NotificationCategory; label: string; count: number }> = [
    { value: 'all', label: 'All', count: notifications.length },
    {
      value: 'match',
      label: 'Matches',
      count: notifications.filter((n) => n.category === 'match').length,
    },
    {
      value: 'news',
      label: 'News',
      count: notifications.filter((n) => n.category === 'news').length,
    },
    {
      value: 'prediction',
      label: 'Predictions',
      count: notifications.filter((n) => n.category === 'prediction').length,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950">
      <Navbar />

      <main className="py-12 min-h-[70vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <AnimatedSection direction="down" delay={0.1}>
            <header className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-ipl-gold mb-3">
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                    <GradientText gradient="from-blue-400 via-purple-400 to-pink-400" animate>
                      Notifications Center
                    </GradientText>
                  </h1>
                  <p className="text-sm md:text-base text-gray-300 max-w-2xl">
                    Stay updated with match reminders, news updates, and prediction alerts.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <NotificationPreferencesComponent
                    preferences={preferences}
                    onUpdate={handlePreferencesUpdate}
                  />
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                      selectedCategory === cat.value
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    {cat.label}
                    {cat.count > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          selectedCategory === cat.value
                            ? 'bg-white/20 text-white'
                            : 'bg-white/10 text-gray-300'
                        }`}
                      >
                        {cat.count}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {unreadCount > 0 && (
                  <motion.button
                    onClick={handleMarkAllRead}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold border border-green-500/30 transition-all duration-300 flex items-center gap-2"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Mark All Read
                  </motion.button>
                )}
                <motion.button
                  onClick={() => setShowArchived(!showArchived)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                    showArchived
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  {showArchived ? 'Show Active' : 'Show Archived'}
                </motion.button>
              </div>
            </header>
          </AnimatedSection>

          {!hasToken && (
            <AnimatedSection direction="up" delay={0.2}>
              <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-500/10 text-amber-100 px-4 py-3 text-sm">
                Sign in to receive personalized notifications for your favorite teams, news, and predictions.
              </div>
            </AnimatedSection>
          )}

          {error && (
            <AnimatedSection direction="up" delay={0.2}>
              <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-100 px-4 py-3 text-sm">
                {error}
              </div>
            </AnimatedSection>
          )}

          {notificationPermission !== 'granted' && (
            <AnimatedSection direction="up" delay={0.2}>
              <div className="mb-6 rounded-2xl border border-blue-400/40 bg-blue-500/10 text-blue-100 px-4 py-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold mb-1">Enable Browser Notifications</p>
                    <p className="text-sm text-blue-200">
                      Get instant match reminders (1 day before, 30 min before, and at match start) directly in your browser.
                    </p>
                  </div>
                  <motion.button
                    onClick={requestPermission}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Bell className="w-4 h-4" />
                    {notificationPermission === 'denied' ? 'Enable in Settings' : 'Enable Notifications'}
                  </motion.button>
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Notifications List */}
          {filteredAndGrouped.length === 0 ? (
            <AnimatedSection direction="up" delay={0.3}>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-gray-300">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-base font-medium mb-2">No notifications {showArchived ? 'archived' : 'available'}</p>
                <p className="text-sm text-gray-400">
                  {showArchived
                    ? 'You have no archived notifications.'
                    : 'You\'ll see notifications here when there are updates for matches, news, or predictions.'}
                </p>
              </div>
            </AnimatedSection>
          ) : (
            <div className="space-y-8">
              {filteredAndGrouped.map((group, groupIndex) => (
                <AnimatedSection key={group.date} direction="up" delay={0.2 + groupIndex * 0.1}>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                      {group.date}
                    </h2>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {group.notifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkRead={handleMarkRead}
                            onDelete={handleDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
