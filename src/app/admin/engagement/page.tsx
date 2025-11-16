'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'block' | 'delete'>('block');
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check authentication and verify admin role
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
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
          router.push('/admin');
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
        router.push('/admin');
      }
    };

    checkAuth();
  }, [router]);

  // Fetch active users
  useEffect(() => {
    if (!isAuthenticated) return;

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
        }
      } catch (error) {
        console.error('Error fetching active users:', error);
      }
    };

    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Fetch chat messages
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchChatMessages = async () => {
      try {
        const response = await fetch('/api/messages?matchId=current&limit=100');
        if (response.ok) {
          const data = await response.json();
          setChatMessages(data);
        }
      } catch (error) {
        console.error('Error fetching chat messages:', error);
      }
    };

    fetchChatMessages();
    const interval = setInterval(fetchChatMessages, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/messages/${messageId}?matchId=current`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove message from local state
        setChatMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      } else {
        alert('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message');
    }
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
    <div className="flex min-h-screen bg-slate-900">
      <AdminSidebar />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">User Engagement Management</h1>
            <p className="text-gray-400">Monitor active users and manage community engagement</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6">
              <p className="text-gray-400 text-sm mb-2">Total Active Users</p>
              <p className="text-4xl font-bold text-ipl-gold">{activeUsers.length}</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6">
              <p className="text-gray-400 text-sm mb-2">Live Chat Status</p>
              <p className="text-4xl font-bold text-green-400">{activeUsers.length > 0 ? 'Active' : 'Idle'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6">
              <p className="text-gray-400 text-sm mb-2">Last Updated</p>
              <p className="text-lg font-semibold text-white">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Active Users Table */}
          <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Active Users in Chat</h2>

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
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowActionModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg mx-4">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-white/10 flex items-start gap-3">
                <div
                  className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                    actionType === 'block'
                      ? 'border-yellow-400/40 bg-yellow-500/10 text-yellow-300'
                      : 'border-red-400/40 bg-red-500/10 text-red-300'
                  }`}
                >
                  {actionType === 'block' ? '!' : '×'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold text-white">
                      {actionType === 'block' ? 'Block user from chat' : 'Delete user account'}
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        actionType === 'block'
                          ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-400/30'
                          : 'bg-red-500/10 text-red-300 border border-red-400/30'
                      }`}
                    >
                      {actionType === 'block' ? 'Block action' : 'Danger action'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {actionType === 'block'
                      ? `This will prevent ${selectedUser.name} from sending messages or participating in chat.`
                      : `This will permanently remove ${selectedUser.name}'s account and related data. This action cannot be undone.`}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-400">
                    <span className="text-gray-500">User:</span>{' '}
                    <span className="text-white font-medium">{selectedUser.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[220px]">
                    {selectedUser.email}
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
                      className="w-full px-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ipl-gold/70 focus:border-transparent resize-none"
                    />
                    <div className="mt-1 text-xs text-gray-500 flex justify-between">
                      <span>Keep it short and factual. This is visible only to admins.</span>
                      <span>{actionReason.length}/200</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 bg-slate-800/60 text-sm font-medium text-gray-200 hover:bg-slate-700/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={isProcessing}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-900/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
