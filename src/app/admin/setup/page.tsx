import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function AdminSetup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email || !password || !name) {
      setMessage('All fields are required');
      setMessageType('error');
      return;
    }

    if (!validateEmail(email)) {
      setMessage('Invalid email format');
      setMessageType('error');
      return;
    }

    if (!validatePassword(password)) {
      setMessage(
        'Password must be at least 8 characters with uppercase and numbers'
      );
      setMessageType('error');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');

      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          setupKey: process.env.NEXT_PUBLIC_SETUP_KEY, // Should be set as env var
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Failed to create admin account');
        setMessageType('error');
        return;
      }

      setMessage('Admin account created successfully!');
      setMessageType('success');
      setEmail('');
      setPassword('');
      setName('');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 2000);
    } catch (error) {
      setMessage('Error creating admin account: ' + error.message);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🏏 IPL 2026 Admin Setup
          </h1>
          <p className="text-slate-400">Create your initial admin account</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
          {/* Status Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                messageType === 'success'
                  ? 'bg-emerald-950 border border-emerald-700'
                  : 'bg-red-950 border border-red-700'
              }`}
            >
              {messageType === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <p
                className={
                  messageType === 'success'
                    ? 'text-emerald-200 text-sm'
                    : 'text-red-200 text-sm'
                }
              >
                {message}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin User"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                disabled={isLoading}
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ipl2026.com"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-400 mt-2">
                Minimum 8 characters, uppercase letter, and number required
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <span>Create Admin Account</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <p className="text-xs text-slate-300 mb-2 font-semibold">
              ⚙️ Setup Instructions:
            </p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>✓ Enter your admin credentials above</li>
              <li>✓ This creates your first admin account</li>
              <li>✓ Change password after first login</li>
              <li>✓ Keep credentials secure</li>
            </ul>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-slate-500 text-xs mt-6">
          This setup page should be secured and disabled after initial deployment
        </p>
      </div>
    </div>
  );
}
