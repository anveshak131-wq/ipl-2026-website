'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogIn } from 'lucide-react';

interface AdminLoginProps {
  onLogin?: (token: string) => void;
  onSuccess?: (token: string) => void;
  redirectTo?: string;
}

const getDefaultRedirect = (pathname: string, role?: string) => {
  const isPlayersAdmin = role === 'players_admin';

  if (pathname.startsWith('/ops/wpl')) {
    return isPlayersAdmin ? '/ops/wpl/players' : '/ops/wpl/dashboard';
  }

  if (pathname.startsWith('/ops/ipl')) {
    return isPlayersAdmin ? '/ops/ipl/players' : '/ops/ipl/dashboard';
  }

  return isPlayersAdmin ? '/admin/ipl/players' : '/admin/ipl';
};

export default function AdminLogin({ redirectTo }: AdminLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const startGoogleSignIn = () => {
    setIsLoading(true);
    const returnTo = redirectTo || getDefaultRedirect(pathname);
    window.location.assign(`/api/admin/google/login?return_to=${encodeURIComponent(returnTo)}`);
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
            Sign in with the allowlisted Google account
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={startGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white text-gray-950 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-sm font-bold">
              G
            </span>
            {isLoading ? 'Opening Google...' : 'Continue with Google'}
            <LogIn size={18} />
          </button>

        </div>
      </div>
    </div>
  );
}
