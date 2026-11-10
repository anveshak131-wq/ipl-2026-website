'use client';
import React, { useState } from 'react';
import { ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CricbuzzStatsEditor({ formData, onChange }: { formData: any, onChange: (data: any) => void }) {
  const [cricbuzzInput, setCricbuzzInput] = useState<string>(formData?.cricbuzzUrl || '');
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!cricbuzzInput.trim()) {
      setScrapeError('Please enter a Cricbuzz URL');
      return;
    }
    
    let target = cricbuzzInput.trim();
    if (target.includes('8734/ellyse-perry')) {
      target = 'https://www.cricbuzz.com/profiles/9115/ellyse-perry';
      setCricbuzzInput(target);
    }
    
    setIsScraping(true);
    setScrapeError(null);
    setSyncSuccess(false);

    try {
      const res = await fetch('/api/admin/scrape-cricbuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target })
      });
      const payload = await res.json();
      
      if (!res.ok || !payload.success) throw new Error(payload.error || 'Fetch failed');

      const bio = payload.bio || {};
      const stats = payload.data || { batting: {}, bowling: {} };

      onChange({
        ...formData,
        cricbuzzUrl: payload.sourceUrl || cricbuzzInput,
        name: bio.name || formData.name || '',
        dateOfBirth: bio.dateOfBirth || formData.dateOfBirth || '',
        age: bio.age || formData.age || '',
        nationality: bio.nationality || formData.nationality || 'India',
        role: bio.role || formData.role || 'All-rounder',
        allrounderType: bio.allrounderType || formData.allrounderType || '',
        battingStyle: bio.battingStyle || formData.battingStyle || 'Right-hand bat',
        bowlingStyle: bio.bowlingStyle || formData.bowlingStyle || 'Right-arm medium-fast',
        careerStats: { batting: stats.batting || {}, bowling: stats.bowling || {} }
      });

      setSyncSuccess(true);
    } catch (err: any) {
      setScrapeError(err.message || 'Error extracting data');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-xl bg-slate-900 border border-slate-700">
      <h3 className="text-emerald-400 font-bold text-sm mb-2">⚡ Cricbuzz Team-Wise Auto-Fill</h3>
      <p className="text-xs text-slate-400 mb-4">Paste the Cricbuzz URL. This will instantly fill the player's Name, Age, DOB, Role, Styles, and Career Stats.</p>
      
      <div className="flex gap-3">
        <input 
          type="text" 
          value={cricbuzzInput} 
          onChange={(e) => setCricbuzzInput(e.target.value)}
          placeholder="https://www.cricbuzz.com/profiles/9115/ellyse-perry"
          className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white"
        />
        <button 
          onClick={handleSync} 
          disabled={isScraping}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold text-sm flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
          {isScraping ? 'Extracting...' : 'Extract All Data'}
        </button>
      </div>

      {syncSuccess && <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Success! All details extracted and applied to form.</p>}
      {scrapeError && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> {scrapeError}</p>}
    </div>
  );
}
