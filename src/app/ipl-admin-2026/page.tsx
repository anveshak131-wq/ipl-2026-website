'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminLogin from '@/components/admin/AdminLogin';
import { useAdminData } from '@/contexts/AdminDataContext';

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { refreshData } = useAdminData();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    // Check authentication on client side only
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (token) {
          setIsAuthenticated(true);
          // Refresh admin data when authenticated
          refreshData();
        }
      } catch (error) {
        // localStorage not available, continue with login
        console.log('localStorage not available');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [refreshData]);

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    // Store token in localStorage
    try {
      localStorage.setItem('adminToken', token);
      // Refresh data after login
      refreshData();
    } catch (error) {
      console.log('localStorage not available');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ipl-dark to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // For authenticated users, let Next.js handle routing through layout.tsx
  // This page acts as the login page, other routes are handled by their respective page.tsx files
  if (pathname === '/ipl-admin-2026' || pathname === '/ipl-admin-2026/') {
    // Redirect to dashboard after login
    router.push('/ipl-admin-2026/dashboard');
    return (
      <div className="min-h-screen bg-gradient-to-br from-ipl-dark to-black flex items-center justify-center">
        <div className="text-white">Redirecting to dashboard...</div>
      </div>
    );
  }

  // This should not be reached for other routes as they have their own page.tsx files
  return null;
}
