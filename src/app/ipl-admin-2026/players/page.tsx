'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { LoadingSpinner } from '@/components/admin/animations';

export default function AdminPlayers() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/ipl-admin-2026');
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-ipl-dark to-black">
        <AuroraBackground />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" color="#FFD700" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ipl-dark to-black">
      <AuroraBackground />
      <AdminSidebar currentPage="/ipl-admin-2026/players" />
      
      <main className="flex-1 relative z-10 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Players Management</h1>
            <p className="text-gray-400 text-lg">Manage player information and statistics</p>
          </div>
          
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-3H7a3 3 0 00-5.356 3v2m16 0v2m0-6v4a2 2 0 00-2 2H6a2 2 0 00-2-2V6a2 2 0 012-2h8a2 2 0 012 2v4m-5 4h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Players Module</h3>
              <p className="text-gray-400 text-sm">This section is under development. Player management features will be available soon.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
