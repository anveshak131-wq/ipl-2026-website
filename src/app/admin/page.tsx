'use client';

import { useState, useEffect } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';

// Mark this page as dynamic (not pre-rendered) to ensure client-side redirects work
// Note: Removed for static export compatibility

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // TODO: Verify token validity
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // Redirect to dashboard if already authenticated
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/dashboard';
    return null;
  }

  return null;
}
