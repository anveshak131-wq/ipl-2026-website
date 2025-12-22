'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin' | 'players_admin';
  createdAt: string;
  lastLogin?: string;
  isBlocked?: boolean;
}

export default function AdminManagement() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'admin' as 'admin' | 'super_admin' | 'players_admin',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
        if (!token) {
          router.push('/ipl-admin-2026');
          return;
        }

        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          router.push('/ipl-admin-2026');
          return;
        }

        const role = data.user?.role;
        setUserRole(role);

        if (role !== 'super_admin') {
          alert('Access denied. Super admin privileges required.');
          router.push('/ipl-admin-2026/dashboard');
          return;
        }

        setIsAuthenticated(true);
        fetchAdmins();
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/ipl-admin-2026');
      }
    };

    checkAuth();
  }, [router]);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/admins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAdmins(data.admins);
        }
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.name || (!editingAdmin && !formData.password)) {
      setError('All fields are required');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      const url = editingAdmin ? `/api/admin/admins?id=${editingAdmin.id}` : '/api/admin/admins';
      const method = editingAdmin ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(editingAdmin ? 'Admin updated successfully' : 'Admin created successfully');
        setFormData({ email: '', name: '', role: 'admin', password: '' });
        setEditingAdmin(null);
        setShowCreateForm(false);
        fetchAdmins();
      } else {
        setError(data.error || `Failed to ${editingAdmin ? 'update' : 'create'} admin`);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Failed to ${editingAdmin ? 'update' : 'create'} admin`);
    }
  };

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      name: admin.name,
      role: admin.role,
      password: ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/admins?id=${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Admin deleted successfully');
        fetchAdmins();
      } else {
        setError(data.error || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      setError('Failed to delete admin');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar currentPage="/ipl-admin-2026/admins" />
      <div className="flex-1">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                  Admin Management
                </h1>
                <p className="text-gray-400 text-lg">
                  Create and manage admin accounts
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-ipl-blue text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Admin
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
              {success}
            </div>
          )}

          {/* Admins Table */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-4 text-gray-300 font-medium">Name</th>
                    <th className="text-left p-4 text-gray-300 font-medium">Email</th>
                    <th className="text-left p-4 text-gray-300 font-medium">Role</th>
                    <th className="text-left p-4 text-gray-300 font-medium">Created</th>
                    <th className="text-left p-4 text-gray-300 font-medium">Last Login</th>
                    <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-400">
                        No admins found
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-4 text-white">{admin.name}</td>
                        <td className="p-4 text-gray-300">{admin.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            admin.role === 'super_admin' 
                              ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                              : admin.role === 'players_admin'
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                          }`}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 
                             admin.role === 'players_admin' ? 'Players Admin' : 'Admin'}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-gray-400">
                          {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(admin)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              disabled={admin.role === 'super_admin'}
                            >
                              {admin.role === 'super_admin' ? 'Protected' : 'Edit'}
                            </button>
                            <button
                              onClick={() => handleDelete(admin.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              disabled={admin.role === 'super_admin'}
                            >
                              {admin.role === 'super_admin' ? 'Protected' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create/Edit Admin Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">
                      Password {editingAdmin && '(leave blank to keep current)'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      required={!editingAdmin}
                      placeholder={editingAdmin ? 'Leave blank to keep current password' : ''}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="players_admin">Players Admin (Limited Access)</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-ipl-blue text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {editingAdmin ? 'Update Admin' : 'Create Admin'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingAdmin(null);
                        setFormData({ email: '', name: '', role: 'admin', password: '' });
                      }}
                      className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
