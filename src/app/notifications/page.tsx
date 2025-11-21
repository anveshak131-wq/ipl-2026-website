'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TeamMeta {
  id: string;
  name: string;
  shortName: string;
}

interface MatchMeta {
  id: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  status: string | null;
  team1: TeamMeta;
  team2: TeamMeta;
}

interface BaseNotification {
  id: string;
  type: 'match_reminder' | 'live_chat_event';
  matchId: string;
  startsAt: string;
  match?: MatchMeta;
}

interface LiveChatNotification extends BaseNotification {
  type: 'live_chat_event';
  eventId?: string;
  eventType?: string;
  title?: string;
  description?: string | null;
}

interface MatchReminderNotification extends BaseNotification {
  type: 'match_reminder';
}

type Notification = MatchReminderNotification | LiveChatNotification;

interface NotificationsResponse {
  notifications?: Notification[];
  windowHours?: number;
  error?: string;
}

export default function NotificationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [windowHours, setWindowHours] = useState<number>(48);

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
        const res = await fetch('/api/notifications?windowHours=48', {
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
          setError('Failed to load notifications');
          return;
        }

        const data = (await res.json()) as NotificationsResponse;
        const list = Array.isArray(data.notifications) ? data.notifications : [];

        list.sort((a, b) => {
          const ta = new Date(a.startsAt).getTime() || 0;
          const tb = new Date(b.startsAt).getTime() || 0;
          return ta - tb;
        });

        setNotifications(list);
        if (typeof data.windowHours === 'number') {
          setWindowHours(data.windowHours);
        }
        setError(null);
      } catch (e) {
        console.error('Error loading notifications:', e);
        setError('Error loading notifications');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ipl-dark">
      <Navbar />

      <main className="py-12 min-h-[70vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-ipl-gold mb-3">
              <Icon name="news" size={16} />
              <span>Notifications</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
              Notifications Center
            </h1>
            <p className="text-sm md:text-base text-gray-300 max-w-2xl">
              See match reminders and live chat events for your favourite teams over the next{' '}
              {windowHours} hours.
            </p>
          </header>

          {!hasToken && (
            <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-500/10 text-amber-100 px-4 py-3 text-sm">
              Sign in from the Live Score or chat page to receive personalized match reminders and
              live chat notifications.
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-100 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {notifications.length === 0 && !error ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-gray-300">
              <p className="text-base font-medium mb-2">No notifications right now</p>
              <p className="text-sm text-gray-400 mb-2">
                Once you pick your favourite teams and upcoming matches are scheduled, you&apos;ll see
                match reminders and live chat events here.
              </p>
              <p className="text-xs text-gray-500">
                Tip: Use the For You feed and your account page to select favourite teams.
              </p>
            </div>
          ) : null}

          {notifications.length > 0 && (
            <div className="space-y-4">
              {notifications.map((n) => {
                const isMatchReminder = n.type === 'match_reminder';
                const startsAt = new Date(n.startsAt);
                const hasMatch = !!n.match;
                const team1 = hasMatch ? n.match!.team1 : null;
                const team2 = hasMatch ? n.match!.team2 : null;

                const matchTitle = hasMatch
                  ? `${team1?.shortName || team1?.name || 'T1'} vs ${
                      team2?.shortName || team2?.name || 'T2'
                    }`
                  : `Match ${n.matchId}`;

                const statusLabel = hasMatch && n.match!.status ? n.match!.status : null;
                const venue = hasMatch ? n.match!.venue : null;

                const localDate = Number.isNaN(startsAt.getTime())
                  ? null
                  : startsAt.toLocaleString();

                const title = n.type === 'live_chat_event' && n.title ? n.title : matchTitle;
                const description =
                  n.type === 'live_chat_event' && n.description
                    ? n.description
                    : isMatchReminder
                    ? 'Upcoming fixture involving one of your favourite teams.'
                    : 'Special event in live chat.';

                return (
                  <article
                    key={n.id}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-800/80 p-5 md:p-6 shadow-lg shadow-black/30"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide ${
                            isMatchReminder
                              ? 'bg-blue-500/10 text-blue-300 border-blue-400/40'
                              : 'bg-purple-500/10 text-purple-300 border-purple-400/40'
                          }`}
                        >
                          {isMatchReminder ? 'MATCH REMINDER' : 'LIVE CHAT EVENT'}
                        </span>
                        {statusLabel && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/20 text-gray-200 uppercase">
                            {statusLabel}
                          </span>
                        )}
                      </div>

                      {localDate && (
                        <div className="text-xs text-gray-300 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-ipl-gold" />
                            Starts at
                          </span>
                          <span className="font-semibold text-white">{localDate}</span>
                        </div>
                      )}
                    </div>

                    <h2 className="text-lg md:text-xl font-bold text-white mb-1">{title}</h2>

                    <p className="text-sm text-gray-300 mb-3 max-w-2xl">{description}</p>

                    {hasMatch && (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/15">
                          <Icon name="cricket" size={14} />
                          <span>
                            {team1?.shortName || team1?.name} vs {team2?.shortName || team2?.name}
                          </span>
                        </div>
                        {venue && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/80 border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-ipl-gold" />
                            {venue}
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
