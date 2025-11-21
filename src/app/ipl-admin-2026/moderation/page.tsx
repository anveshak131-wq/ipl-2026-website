'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

type ModerationStatus = 'idle' | 'loading' | 'ok' | 'error';
type FlagStatus = 'pending' | 'safe' | 'action_taken' | null;

type ActionType = 'delete' | 'blockUser' | 'markSafe';

interface ModerationMessage {
  id: string;
  userId?: string;
  userName?: string;
  text: string;
  timestamp?: string;
  matchId?: string;
  isFlagged?: boolean;
  flagReason?: string | null;
  flagStatus?: FlagStatus;
  flaggedAt?: string | null;
  flagDetails?: string | null;
}

export default function AdminModerationPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [messages, setMessages] = useState<ModerationMessage[]>([]);
  const [status, setStatus] = useState<ModerationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedMessage, setSelectedMessage] = useState<ModerationMessage | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType>('delete');
  const [isProcessing, setIsProcessing] = useState(false);

  const matchId = 'current';

  useEffect(() => {
    const checkAuth = async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
          : null;

      if (!token) {
        router.push('/ipl-admin-2026');
        return;
      }

      try {
        const res = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          try {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('auth_token');
          } catch {
          }
          router.push('/ipl-admin-2026');
          return;
        }

        const role = data.user?.role;
        if (role !== 'admin' && role !== 'super_admin') {
          alert('Access denied. Admin privileges required.');
          router.push('/');
          return;
        }

        setIsAuthenticated(true);
      } catch (e) {
        console.error('Auth verification error:', e);
        router.push('/ipl-admin-2026');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadMessages = async () => {
      setStatus('loading');
      setError(null);

      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
            : null;

        const params = new URLSearchParams();
        params.set('matchId', matchId);
        if (statusFilter === 'pending') {
          params.set('status', 'pending');
        } else {
          params.set('status', 'all');
        }

        const res = await fetch(`/api/admin/moderation?${params.toString()}`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });

        if (!res.ok) {
          setStatus('error');
          setError('Failed to load flagged messages');
          return;
        }

        const data = await res.json();
        const list = Array.isArray(data.messages) ? data.messages : [];
        setMessages(list);
        setStatus('ok');
      } catch (e) {
        console.error('Error loading moderation messages:', e);
        setStatus('error');
        setError('Error loading flagged messages');
      }
    };

    loadMessages();
  }, [isAuthenticated, statusFilter, refreshKey]);

  const openActionModal = (message: ModerationMessage, action: ActionType) => {
    setSelectedMessage(message);
    setSelectedAction(action);
  };

  const closeActionModal = () => {
    if (isProcessing) return;
    setSelectedMessage(null);
  };

  const confirmAction = async () => {
    if (!selectedMessage) return;

    setIsProcessing(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('auth_token') || localStorage.getItem('adminToken')
          : null;

      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          matchId,
          messageId: selectedMessage.id,
          action: selectedAction,
        }),
      });

      if (!res.ok) {
        alert('Failed to perform moderation action');
        return;
      }

      setSelectedMessage(null);
      setRefreshKey((key) => key + 1);
    } catch (e) {
      console.error('Error performing moderation action:', e);
      alert('Error performing moderation action');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-ipl-gold" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex min-h-screen bg-slate-900">
      <AdminSidebar />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Moderation Queue</h1>
              <p className="text-gray-400 text-sm max-w-xl">
                Review and act on chat messages that were flagged by automatic rules or manual
                reports.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-300">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-emerald-500/10 border-emerald-400/60 text-emerald-300'
                    : 'bg-slate-800/70 border-white/10 text-gray-300 hover:bg-slate-700/80'
                }`}
              >
                Pending only
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-slate-700/80 border-white/40 text-gray-50'
                    : 'bg-slate-800/70 border-white/10 text-gray-300 hover:bg-slate-700/80'
                }`}
              >
                All flagged
              </button>
              <button
                onClick={() => setRefreshKey((key) => key + 1)}
                className="px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium text-gray-200 bg-slate-800/70 hover:bg-slate-700/80"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-white/10">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    status === 'ok' ? '#22c55e' : status === 'error' ? '#ef4444' : '#eab308',
                }}
              />
              <span>
                Status:{' '}
                <span className={status === 'error' ? 'text-red-400' : 'text-gray-200'}>
                  {status === 'loading'
                    ? 'Loading'
                    : status === 'ok'
                    ? 'OK'
                    : status === 'error'
                    ? 'Error'
                    : 'Idle'}
                </span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-white/10">
              <span className="text-gray-400">Flagged messages:</span>
              <span className="text-gray-100 font-semibold">{messages.length}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-200">
              <span>{error}</span>
              <button
                onClick={() => setRefreshKey((key) => key + 1)}
                className="rounded-md bg-red-500/20 px-3 py-1 text-[11px] font-medium hover:bg-red-500/30"
              >
                Retry
              </button>
            </div>
          )}

          <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6">
            {hasMessages ? (
              <div className="space-y-3 max-h-[540px] overflow-y-auto">
                {messages.map((message) => {
                  const createdAt = message.flaggedAt || message.timestamp;
                  let reasonLabel = 'Flagged';
                  if (message.flagReason === 'bad_language') {
                    reasonLabel = 'Language';
                  } else if (message.flagReason === 'spam') {
                    reasonLabel = 'Spam';
                  } else if (message.flagReason === 'manual_report') {
                    reasonLabel = 'Report';
                  }

                  let statusLabel = 'Pending review';
                  if (message.flagStatus === 'safe') {
                    statusLabel = 'Marked safe';
                  } else if (message.flagStatus === 'action_taken') {
                    statusLabel = 'Action taken';
                  }

                  return (
                    <div
                      key={message.id}
                      className="bg-slate-900/70 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white truncate max-w-[200px]">
                              {message.userName || 'Unknown user'}
                            </span>
                            {createdAt && (
                              <span className="text-[11px] text-gray-400">
                                {new Date(createdAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-200 break-words whitespace-pre-wrap">
                            {message.text}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-slate-800/90 border border-white/10 text-gray-200">
                              Reason: {reasonLabel}
                            </span>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-slate-800/90 border border-white/10 text-gray-200">
                              {statusLabel}
                            </span>
                            {message.flagDetails && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-slate-800/90 border border-white/10 text-gray-300 max-w-full truncate">
                                Note: {message.flagDetails}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2 sm:mt-0 sm:items-end">
                          <button
                            onClick={() => openActionModal(message, 'delete')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40"
                          >
                            Delete message
                          </button>
                          <button
                            onClick={() => openActionModal(message, 'blockUser')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/40"
                          >
                            Block user
                          </button>
                          <button
                            onClick={() => openActionModal(message, 'markSafe')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/40"
                          >
                            Mark as safe
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-gray-300 text-sm mb-2">No flagged messages right now.</p>
                <p className="text-gray-500 text-xs max-w-sm mx-auto">
                  When messages are caught by automatic rules or reported by users, they will
                  appear here for review.
                </p>
              </div>
            )}
          </div>
        </div>

        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={closeActionModal}
            />
            <div className="relative z-10 w-full max-w-lg mx-4">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-white/10 flex items-start gap-3">
                  <div
                    className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                      selectedAction === 'delete'
                        ? 'border-red-400/40 bg-red-500/10 text-red-300'
                        : selectedAction === 'blockUser'
                        ? 'border-yellow-400/40 bg-yellow-500/10 text-yellow-300'
                        : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                    }`}
                  >
                    !
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white mb-1">
                      {selectedAction === 'delete'
                        ? 'Delete chat message'
                        : selectedAction === 'blockUser'
                        ? 'Block user from chat'
                        : 'Mark message as safe'}
                    </h2>
                    <p className="text-sm text-gray-300">
                      {selectedAction === 'delete'
                        ? 'This will permanently remove this message from chat history.'
                        : selectedAction === 'blockUser'
                        ? 'This will block the user from sending further messages.'
                        : 'This will remove the flag from this message.'}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-4 text-sm text-gray-200">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Message</div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-500">From:</span>{' '}
                        <span className="text-white font-medium">
                          {selectedMessage.userName || 'Unknown user'}
                        </span>
                      </div>
                      {selectedMessage.timestamp && (
                        <div className="text-[11px] text-gray-500 whitespace-nowrap">
                          {new Date(selectedMessage.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-100 whitespace-pre-wrap">
                      {selectedMessage.text}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-5 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                  <button
                    onClick={closeActionModal}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 bg-slate-800/60 text-sm font-medium text-gray-200 hover:bg-slate-700/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-900/40 bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing…' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
