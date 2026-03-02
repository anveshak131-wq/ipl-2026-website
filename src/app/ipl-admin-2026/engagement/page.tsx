'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ModernDialog from '@/components/admin/ModernDialog';

// Polling configuration
const POLL_INTERVAL_NORMAL = 5000; // 5 seconds
const POLL_INTERVAL_BACKOFF = 15000; // 15 seconds
const MAX_CONSECUTIVE_ERRORS = 3; // Trigger backoff after 3 errors

interface ActiveUser {
  id: string;
  name: string;
  email: string;
  lastActive: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  matchId: string;
}

export default function AdminEngagementPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usersStatus, setUsersStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [messagesStatus, setMessagesStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [usersLastUpdated, setUsersLastUpdated] = useState<string | null>(null);
  const [messagesLastUpdated, setMessagesLastUpdated] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [usersConsecutiveErrors, setUsersConsecutiveErrors] = useState(0);
  const [messagesConsecutiveErrors, setMessagesConsecutiveErrors] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [actionType, setActionType] = useState<'block' | 'delete'>('block');
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Check authentication and verify admin role
  const hasCheckedAuth = useRef(false);
  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current || isAuthenticated) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      if (!token) {
        router.push('/ipl-admin-2026');
        return;
      }

      try {
        // Verify token and check user role
        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          // Invalid token, redirect to login
          localStorage.removeItem('adminToken');
          localStorage.removeItem('auth_token');
          router.push('/ipl-admin-2026');
          return;
        }

        // Check if user has admin or super_admin role
        const userRole = data.user?.role;
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          // Not an admin, redirect to home
          alert('Access denied. Admin privileges required.');
          router.push('/');
          return;
        }

        // User is authenticated and has admin role
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth verification error:', error);
        router.push('/ipl-admin-2026');
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Fetch active users
  useEffect(() => {
    if (!isAuthenticated || !isTabVisible) return;

    const fetchActiveUsers = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/admin/users?matchId=current', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setActiveUsers(data.users);
          setUsersStatus('ok');
          setUsersError(null);
          setUsersLastUpdated(new Date().toLocaleTimeString());
          setUsersConsecutiveErrors(0); // Reset error count on success
        } else {
          setUsersStatus('error');
          setUsersError('Failed to load active users');
          setUsersConsecutiveErrors((prev) => prev + 1);
        }
      } catch (error) {
        console.error('Error fetching active users:', error);
        setUsersStatus('error');
        setUsersError('Error fetching active users');
        setUsersConsecutiveErrors((prev) => prev + 1);
      }
    };

    fetchActiveUsers();
    // Use backoff interval if too many consecutive errors
    const interval = usersConsecutiveErrors >= MAX_CONSECUTIVE_ERRORS 
      ? POLL_INTERVAL_BACKOFF 
      : POLL_INTERVAL_NORMAL;
    const intervalId = setInterval(fetchActiveUsers, interval);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, isTabVisible, usersConsecutiveErrors]);

  // Fetch chat messages
  useEffect(() => {
    if (!isAuthenticated || !isTabVisible) return;

    const fetchChatMessages = async () => {
      try {
        const response = await fetch('/api/messages?matchId=current&limit=100');
        if (response.ok) {
          const data = await response.json();
          setChatMessages(data);
          setMessagesStatus('ok');
          setMessagesError(null);
          setMessagesLastUpdated(new Date().toLocaleTimeString());
          setMessagesConsecutiveErrors(0); // Reset error count on success
        } else {
          setMessagesStatus('error');
          setMessagesError('Failed to load chat messages');
          setMessagesConsecutiveErrors((prev) => prev + 1);
        }
      } catch (error) {
        console.error('Error fetching chat messages:', error);
        setMessagesStatus('error');
        setMessagesError('Error fetching chat messages');
        setMessagesConsecutiveErrors((prev) => prev + 1);
      }
    };

    fetchChatMessages();
    // Use backoff interval if too many consecutive errors
    const interval = messagesConsecutiveErrors >= MAX_CONSECUTIVE_ERRORS 
      ? POLL_INTERVAL_BACKOFF 
      : POLL_INTERVAL_NORMAL;
    const intervalId = setInterval(fetchChatMessages, interval);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, isTabVisible, messagesConsecutiveErrors]);

  const handleDeleteMessage = async (messageId: string) => {
    const message = chatMessages.find((m) => m.id === messageId) || null;
    if (!message) return;

    setSelectedMessage(message);
    setShowMessageModal(true);
  };

  const handleBlockUser = async (user: ActiveUser) => {
    setSelectedUser(user);
    setActionType('block');
    setShowActionModal(true);
  };

  const handleDeleteUser = async (user: ActiveUser) => {
    setSelectedUser(user);
    setActionType('delete');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('auth_token');

      if (actionType === 'block') {
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            isBlocked: true,
            reason: actionReason || 'Violating community guidelines',
          }),
        });

        if (response.ok) {
          alert(`${selectedUser.name} has been blocked successfully.`);
          setShowActionModal(false);
          setSelectedUser(null);
          setActionReason('');
        } else {
          alert('Failed to block user');
        }
      } else if (actionType === 'delete') {
        const response = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: selectedUser.id }),
        });

        if (response.ok) {
          alert(`${selectedUser.name} has been deleted successfully.`);
          setActiveUsers(activeUsers.filter((u) => u.id !== selectedUser.id));
          setShowActionModal(false);
          setSelectedUser(null);
        } else {
          alert('Failed to delete user');
        }
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Error performing action');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDeleteMessage = async () => {
    if (!selectedMessage) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/messages/${selectedMessage.id}?matchId=current`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setChatMessages((prev) => prev.filter((msg) => msg.id !== selectedMessage.id));
        setShowMessageModal(false);
        setSelectedMessage(null);
      } else {
        alert('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-ipl-gold"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      <main className="flex-1 relative z-10">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                  User Engagement
                </h1>
                <p className="text-gray-400 text-lg">
                  Monitor active users and manage community interactions
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${
                    usersStatus === 'ok' && messagesStatus === 'ok' ? 'bg-green-500 animate-pulse' : (usersStatus === 'error' || messagesStatus === 'error') ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    usersStatus === 'ok' && messagesStatus === 'ok' ? 'text-green-400' : (usersStatus === 'error' || messagesStatus === 'error') ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {usersStatus === 'ok' && messagesStatus === 'ok' ? 'All systems OK' : (usersStatus === 'error' || messagesStatus === 'error') ? 'Service issues' : 'Loading...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="mt-6 flex flex-wrap gap-3">
              {!isTabVisible && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4-2a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Polling paused (tab hidden)</span>
                </div>
              )}
              {(usersConsecutiveErrors >= MAX_CONSECUTIVE_ERRORS || messagesConsecutiveErrors >= MAX_CONSECUTIVE_ERRORS) && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Slow polling active (15s interval)</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className={`w-2 h-2 rounded-full ${usersStatus === 'ok' ? 'bg-green-500' : usersStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-300">
                  Users: <span className={usersStatus === 'error' ? 'text-red-400' : usersStatus === 'ok' ? 'text-green-400' : 'text-gray-400'}>
                    {usersStatus === 'ok' ? 'Connected' : usersStatus === 'error' ? 'Error' : 'Loading'}
                  </span>
                  {usersLastUpdated && <span className="text-gray-500 ml-2">• {usersLastUpdated}</span>}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className={`w-2 h-2 rounded-full ${messagesStatus === 'ok' ? 'bg-green-500' : messagesStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-300">
                  Messages: <span className={messagesStatus === 'error' ? 'text-red-400' : messagesStatus === 'ok' ? 'text-green-400' : 'text-gray-400'}>
                    {messagesStatus === 'ok' ? 'Connected' : messagesStatus === 'error' ? 'Error' : 'Loading'}
                  </span>
                  {messagesLastUpdated && <span className="text-gray-500 ml-2">• {messagesLastUpdated}</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{activeUsers.length}</p>
                  <p className="text-xs text-gray-400">Active Users</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300 font-medium">Currently online</span>
                <div className="flex items-center text-xs text-blue-400 font-semibold bg-blue-500/10 px-2 py-1 rounded-full">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Live
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{activeUsers.length > 0 ? 'Active' : 'Idle'}</p>
                  <p className="text-xs text-gray-400">Chat Status</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300 font-medium">Live chat</span>
                <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                  activeUsers.length > 0
                    ? 'text-green-400 bg-green-500/10'
                    : 'text-gray-400 bg-gray-500/10'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${
                    activeUsers.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                  }`}></div>
                  {activeUsers.length > 0 ? 'Active' : 'Idle'}
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{new Date().toLocaleTimeString()}</p>
                  <p className="text-xs text-gray-400">Last Updated</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300 font-medium">Real-time sync</span>
                <div className="flex items-center text-xs text-purple-400 font-semibold bg-purple-500/10 px-2 py-1 rounded-full">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Auto
                </div>
              </div>
            </div>
          </div>

          {/* Active Users Table */}
          <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Active Users in Chat</h2>

            {usersError && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                <span>{usersError}</span>
                <button
                  onClick={() => {
                    setUsersError(null);
                    setUsersStatus('idle');
                    // trigger a one-off refresh
                    (async () => {
                      try {
                        const token = localStorage.getItem('auth_token');
                        const response = await fetch('/api/admin/users?matchId=current', {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                          },
                        });
                        if (response.ok) {
                          const data = await response.json();
                          setActiveUsers(data.users);
                          setUsersStatus('ok');
                          setUsersLastUpdated(new Date().toLocaleTimeString());
                          setUsersConsecutiveErrors(0);
                        } else {
                          setUsersStatus('error');
                          setUsersError('Failed to load active users');
                        }
                      } catch (err) {
                        console.error('Retry users error:', err);
                        setUsersStatus('error');
                        setUsersError('Error fetching active users');
                      }
                    })();
                  }}
                  className="rounded-md bg-red-500/20 px-3 py-1 text-[11px] font-medium hover:bg-red-500/30"
                >
                  Retry
                </button>
              </div>
            )}

            {activeUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Last Active</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 text-white font-semibold">{user.name}</td>
                        <td className="px-6 py-4 text-gray-300 text-sm">{user.email}</td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {new Date(user.lastActive).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleBlockUser(user)}
                              className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg text-sm transition-colors"
                            >
                              Block
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No active users in chat currently</p>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="mt-8 bg-slate-800/50 rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Live Chat Messages</h2>

            {messagesError && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                <span>{messagesError}</span>
                <button
                  onClick={() => {
                    setMessagesError(null);
                    setMessagesStatus('idle');
                    (async () => {
                      try {
                        const response = await fetch('/api/messages?matchId=current&limit=100');
                        if (response.ok) {
                          const data = await response.json();
                          setChatMessages(data);
                          setMessagesStatus('ok');
                          setMessagesLastUpdated(new Date().toLocaleTimeString());
                          setMessagesConsecutiveErrors(0);
                        } else {
                          setMessagesStatus('error');
                          setMessagesError('Failed to load chat messages');
                        }
                      } catch (err) {
                        console.error('Retry messages error:', err);
                        setMessagesStatus('error');
                        setMessagesError('Error fetching chat messages');
                      }
                    })();
                  }}
                  className="rounded-md bg-red-500/20 px-3 py-1 text-[11px] font-medium hover:bg-red-500/30"
                >
                  Retry
                </button>
              </div>
            )}

            {chatMessages.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className="bg-slate-700/30 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-white">{message.userName}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{message.text}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No chat messages yet</p>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-blue-400 mb-3">Community Guidelines</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Block users for violating chat guidelines or being disruptive</li>
              <li>• Delete users for severe violations or account takeover</li>
              <li>• Provide a reason when blocking for transparency</li>
              <li>• Monitor chat for spam, abuse, or inappropriate content</li>
              <li>• Blocked users cannot send messages or view other users</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Action Modal */}
      <ModernDialog
        isOpen={showActionModal && !!selectedUser}
        onClose={() => setShowActionModal(false)}
        title={actionType === 'block' ? 'Block user from chat' : 'Delete user account'}
        description={
          actionType === 'block'
            ? `This will prevent ${selectedUser?.name} from sending messages or participating in chat.`
            : `This will permanently remove ${selectedUser?.name}'s account and related data. This action cannot be undone.`
        }
        variant={actionType === 'block' ? 'warning' : 'danger'}
        size="lg"
        icon={actionType === 'block' ? '⚠️' : '🚨'}
        footer={
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
            <button
              onClick={() => setShowActionModal(false)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 bg-slate-800/60 text-sm font-medium text-gray-200 hover:bg-slate-700/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              disabled={isProcessing}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                actionType === 'block'
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {isProcessing
                ? 'Processing...'
                : actionType === 'block'
                ? 'Confirm block'
                : 'Confirm delete'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-400">
              <span className="text-gray-500">User:</span>{' '}
              <span className="text-white font-medium">{selectedUser?.name}</span>
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[220px]">
              {selectedUser?.email}
            </div>
          </div>

          {actionType === 'block' && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Reason for blocking <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                placeholder="Add a short note so other admins understand why this user was blocked..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent resize-none"
              />
              <div className="mt-1 text-xs text-gray-500 flex justify-between">
                <span>Keep it short and factual. This is visible only to admins.</span>
                <span>{actionReason.length}/200</span>
              </div>
            </div>
          )}
        </div>
      </ModernDialog>

      {/* Message Delete Modal */}
      <ModernDialog
        isOpen={showMessageModal && !!selectedMessage}
        onClose={() => {
          if (!isProcessing) {
            setShowMessageModal(false);
            setSelectedMessage(null);
          }
        }}
        title="Delete chat message"
        description="This will permanently remove this message from the live chat history. This action cannot be undone."
        variant="danger"
        size="lg"
        icon="🗑️"
        footer={
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
            <button
              onClick={() => {
                if (isProcessing) return;
                setShowMessageModal(false);
                setSelectedMessage(null);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 bg-slate-800/60 text-sm font-medium text-gray-200 hover:bg-slate-700/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteMessage}
              disabled={isProcessing}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Deleting…' : 'Delete message'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Message preview</div>
          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between mb-2 gap-3">
              <div className="text-sm text-gray-300">
                <span className="text-gray-500">From:</span>{' '}
                <span className="text-white font-medium">{selectedMessage?.userName}</span>
              </div>
              <div className="text-[11px] text-gray-500 whitespace-nowrap">
                {selectedMessage?.timestamp ? new Date(selectedMessage.timestamp).toLocaleString() : ''}
              </div>
            </div>
            <p className="text-sm text-gray-200 line-clamp-3">{selectedMessage?.text}</p>
          </div>
        </div>
      </ModernDialog>
    </div>
  );
}
