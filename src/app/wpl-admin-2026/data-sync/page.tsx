'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { WPLColors } from '@/lib/wplColors';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { Database, Copy, CheckCircle, AlertCircle } from 'lucide-react';

export default function DataSyncPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useState(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/wpl-admin-2026');
      return;
    }
    setIsAuthenticated(true);
  });

  const handleSyncDeeptiSharma = async () => {
    setSyncing(true);
    setStatus('idle');
    setMessage('Syncing Deepti Sharma to WPL...');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'sync',
          playerName: 'Deepti Sharma',
          teamId: 'upw',
          league: 'wpl',
          isCaptain: true,
        }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('✅ Deepti Sharma successfully synced to WPL as UPW captain');
      } else {
        setStatus('error');
        setMessage('❌ Failed to sync player');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const bgStyle = {
    background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen" style={bgStyle}>
      <AuroraBackground />
      <AdminSidebar currentPage="/wpl-admin-2026/data-sync" />
      
      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-8 h-8" style={{ color: WPLColors.pink }} />
              <h1 
                className="text-4xl font-bold"
                style={{
                  background: `linear-gradient(to right, ${WPLColors.textPrimary}, ${WPLColors.purple}, ${WPLColors.pink})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Data Sync
              </h1>
            </div>
            <p style={{ color: WPLColors.textSecondary }}>
              Manage player data synchronization
            </p>
          </div>

          {/* Sync Card */}
          <div 
            className="rounded-2xl p-8 backdrop-blur-xl border"
            style={{
              background: WPLColors.purpleRGBA[10],
              borderColor: WPLColors.purpleRGBA[30],
            }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: WPLColors.textPrimary }}>
              Sync Deepti Sharma to WPL
            </h2>
            
            <p className="mb-6" style={{ color: WPLColors.textSecondary }}>
              Sync Deepti Sharma as a UPW (Uttar Pradesh Women) player and captain for the WPL league.
            </p>

            <button
              onClick={handleSyncDeeptiSharma}
              disabled={syncing}
              className="w-full px-6 py-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: syncing ? WPLColors.purpleRGBA[50] : `linear-gradient(to right, ${WPLColors.purple}, ${WPLColors.pink})`,
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Copy className="w-5 h-5" />
                {syncing ? 'Syncing...' : 'Sync Deepti Sharma to WPL'}
              </div>
            </button>

            {message && (
              <div className="mt-6 p-4 rounded-lg flex items-center gap-3" style={{
                background: status === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${status === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: status === 'success' ? '#22c55e' : '#ef4444',
              }}>
                {status === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p>{message}</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div 
            className="mt-6 rounded-2xl p-6 backdrop-blur-xl border"
            style={{
              background: WPLColors.purpleRGBA[5],
              borderColor: WPLColors.purpleRGBA[20],
            }}
          >
            <h3 className="font-semibold mb-2" style={{ color: WPLColors.textPrimary }}>
              What happens when you sync?
            </h3>
            <ul className="space-y-2" style={{ color: WPLColors.textSecondary }}>
              <li>✓ Deepti Sharma will be added to the WPL database</li>
              <li>✓ She will be assigned to UPW (Uttar Pradesh Women)</li>
              <li>✓ She will be marked as team captain</li>
              <li>✓ You can then edit her details in the WPL Players Management page</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
