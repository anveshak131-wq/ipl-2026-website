'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminLogin from '@/components/admin/AdminLogin';
import WPLAdminRouter from './WPLAdminRouter';

export default function WPLAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    // Check authentication on client side only
    const checkAuth = async () => {
      try {
        const sessionResponse = await fetch('/api/admin/session', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (sessionResponse.ok) {
          const data = await sessionResponse.json();
          if (data.success && data.token) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('authToken', data.token);
            setIsAuthenticated(true);
            return;
          }
        }

        const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        // localStorage not available, continue with login
        console.log('localStorage not available');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    // Store token in localStorage
    try {
      localStorage.setItem('adminToken', token);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('authToken', token);
    } catch (error) {
      console.log('localStorage not available');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // Show WPL admin router for authenticated users
  return <WPLAdminRouter />;
}
