'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { CustomEmoji } from '@/components/emoji/Emoji';
import { useRouter } from 'next/navigation';

export default function AdminSetup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [setupKey, setSetupKey] = useState('default-setup-key-change-me');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [adminToken, setAdminToken] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validation
    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setMessage('Password must be at least 8 characters with 1 uppercase letter and 1 number');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (!name.trim()) {
      setMessage('Please enter your name');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          setupKey,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Admin account created successfully! You can now login.');
        setMessageType('success');
        setAdminToken(data.token || '');
        
        // Store token for immediate login
        if (data.token) {
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('auth_token', data.token);
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push('/admin/ipl');
          }, 2000);
        }
      } else {
        setMessage(data.message || 'Setup failed. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please check your connection and try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CustomEmoji emoji="⚙️" className="text-3xl" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Admin Setup
          </h2>
          <p className="text-gray-400">
            Create your admin account to get started
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Create a strong password"
              />
              <p className="mt-1 text-xs text-gray-400">
                Must be 8+ characters with 1 uppercase letter and 1 number
              </p>
            </div>

            <div>
              <label htmlFor="setupKey" className="block text-sm font-medium text-gray-300 mb-2">
                Setup Key
              </label>
              <input
                id="setupKey"
                name="setupKey"
                type="text"
                required
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter setup key"
              />
            </div>
          </div>

          {message && (
            <div
              className={`rounded-lg p-3 flex items-center gap-2 ${
                messageType === 'success'
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-red-500/20 border border-red-500/30'
              }`}
            >
              {messageType === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <p className={`text-sm ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Admin Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/admin/ipl')}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
