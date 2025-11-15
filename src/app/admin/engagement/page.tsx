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

export default function AdminEngagementPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'block' | 'delete'>('block');
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify?token=${token}`);
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          router.push('/admin');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin');
      } finally {
        setIsLoading(false);
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowActionModal(false)}
          />
          <div className="relative z-10 w-full max-w-md mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              {actionType === 'block' ? 'Block User' : 'Delete User'}
            </h2>

            <p className="text-gray-300 mb-6">
              {actionType === 'block'
                ? `Are you sure you want to block ${selectedUser.name}? They won't be able to send messages or chat.`
                : `Are you sure you want to delete ${selectedUser.name}? This action is permanent.`}
            </p>

            {actionType === 'block' && (
              <textarea
                placeholder="Reason for blocking (optional)..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold mb-4 resize-none"
              />
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionType === 'block'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isProcessing ? 'Processing...' : actionType === 'block' ? 'Block User' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
