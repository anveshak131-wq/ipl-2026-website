'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminLoginProps {
  onLogin: (token: string) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    totp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        onLogin(data.token);
        localStorage.setItem('adminToken', data.token);
        // Also set the generic auth token key so admin pages that
        // expect `auth_token` will recognize the session.
        try {
          localStorage.setItem('auth_token', data.token);
        } catch (e) {
          // ignore if localStorage isn't available
        }
        
        // Redirect based on user role
        if (data.user?.role === 'players_admin') {
          router.push('/admin/ipl/players');
        } else {
          router.push('/admin/ipl');
        }
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ipl-dark to-black">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-ipl-purple to-ipl-gold rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-2xl">IPL</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Admin Login
          </h2>
          <p className="text-gray-400">
            Sign in to access the admin panel
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ipl-gold focus:border-transparent transition-all duration-200"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={credentials.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ipl-gold focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label htmlFor="totp" className="block text-sm font-medium text-gray-300 mb-2">
                2FA Code
              </label>
              <input
                id="totp"
                name="totp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={credentials.totp}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ipl-gold focus:border-transparent transition-all duration-200"
                placeholder="Enter 6-digit code from your authenticator"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full ipl-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
