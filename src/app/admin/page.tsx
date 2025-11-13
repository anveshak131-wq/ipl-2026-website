'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminRouter from './AdminRouter';

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication on client side only
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('adminToken');
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
    } catch (error) {
      console.log('localStorage not available');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ipl-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // Show admin router for authenticated users
  return <AdminRouter />;
}
