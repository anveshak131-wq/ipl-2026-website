'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Globe, AlertTriangle, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react';

interface CricbuzzStatsEditorProps {
  formData: any;
  onChange: (updatedFormData: any) => void;
}

export default function CricbuzzStatsEditor({ formData, onChange }: CricbuzzStatsEditorProps) {
  const initialUrl = formData?.cricbuzzUrl || (formData?.cricbuzzId ? `https://www.cricbuzz.com/profiles/${formData.cricbuzzId}` : '');
  const [cricbuzzInput, setCricbuzzInput] = useState<string>(initialUrl);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeSuccess, setScrapeSuccess] = useState<string | null>(null);

  // Sync state if a different player is selected
  useEffect(() => {
    const url = formData?.cricbuzzUrl || (formData?.cricbuzzId ? `https://www.cricbuzz.com/profiles/${formData.cricbuzzId}` : '');
    setCricbuzzInput(url);
    setScrapeError(null);
    setScrapeSuccess(null);
  }, [formData?.id, formData?.cricbuzzUrl, formData?.cricbuzzId]);

  const careerStats = formData.careerStats || {
    batting: { Test: {}, ODI: {}, T20I: {}, IPL: {} },
    bowling: { Test: {}, ODI: {}, T20I: {}, IPL: {} },
  };

  const handleStatChange = (type: 'batting' | 'bowling', format: string, key: string, value: string) => {
    const updated = {
      ...formData,
      careerStats: {
        ...careerStats,
        [type]: {
          ...careerStats[type],
          [format]: {
            ...(careerStats[type]?.[format] || {}),
            [key]: value,
          },
        },
      },
    };
    onChange(updated);
  };

  const handleInputChange = (val: string) => {
    setCricbuzzInput(val);
    const cleaned = val.trim();
    const extractedId = cleaned.match(/\/profiles\/(\d+)/)?.[1] || (/^\d+$/.test(cleaned) ? cleaned : undefined);

    // Save URL and ID to player formData immediately
    onChange({
      ...formData,
      cricbuzzUrl: cleaned.startsWith('http') ? cleaned : (extractedId ? `https://www.cricbuzz.com/profiles/${extractedId}` : formData.cricbuzzUrl),
      cricbuzzId: extractedId || formData.cricbuzzId,
    });
  };

  const handleSyncCricbuzz = async () => {
    const input = cricbuzzInput.trim();
    if (!input) {
      setScrapeError('Please enter a Cricbuzz profile URL or Player ID.');
      return;
    }

    setIsScraping(true);
    setScrapeError(null);
    setScrapeSuccess(null);

    try {
      const res = await fetch('/api/admin/scrape-cricbuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUrl: input.startsWith('http') ? input : undefined,
          playerId: /^\d+$/.test(input) ? input : undefined,
          playerName: formData.name || 'player',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract data from Cricbuzz.');
      }

      // Merge batting & bowling into careerStats
      const mergedCareerStats = {
        batting: {
          ...(careerStats.batting || {}),
          ...(data.data.batting || {}),
        },
        bowling: {
          ...(careerStats.bowling || {}),
          ...(data.data.bowling || {}),
        },
      };

      const finalUrl = data.sourceUrl || input;
      const finalId = data.cricbuzzId || input.match(/\/profiles\/(\d+)/)?.[1] || (/^\d+$/.test(input) ? input : formData.cricbuzzId);

      const updated = {
        ...formData,
        cricbuzzUrl: finalUrl,
        cricbuzzId: finalId,
        careerStats: mergedCareerStats,
      };

      onChange(updated);
      setScrapeSuccess(`✓ Successfully synced Batting & Bowling tables (${data.matchedRows} total rows) and saved Cricbuzz profile link!`);
    } catch (err: any) {
      setScrapeError(err.message || 'Network error while contacting scraper endpoint.');
    } finally {
      setIsScraping(false);
    }
  };

  const battingCols = [
    { key: 'M', label: 'Mat' },
    { key: 'Inn', label: 'Inn' },
    { key: 'NO', label: 'NO' },
    { key: 'Runs', label: 'Runs' },
    { key: 'HS', label: 'HS' },
    { key: 'Avg', label: 'Avg' },
    { key: 'BF', label: 'BF' },
    { key: 'SR', label: 'SR' },
    { key: '100', label: '100s' },
    { key: '200', label: '200s' },
    { key: '50', label: '50s' },
    { key: '4s', label: '4s' },
    { key: '6s', label: '6s' },
  ];

  const bowlingCols = [
    { key: 'M', label: 'Mat' },
    { key: 'Inn', label: 'Inn' },
    { key: 'B', label: 'Balls' },
    { key: 'Runs', label: 'Runs' },
    { key: 'Wkts', label: 'Wkts' },
    { key: 'BBI', label: 'BBI' },
    { key: 'BBM', label: 'BBM' },
    { key: 'Econ', label: 'Econ' },
    { key: 'Avg', label: 'Avg' },
    { key: 'SR', label: 'SR' },
    { key: '5W', label: '5W' },
    { key: '10W', label: '10W' },
  ];

  const formats = ['Test', 'ODI', 'T20I', 'IPL'];

  return (
    <div className="space-y-6">
      {/* Cricbuzz 1-Click Sync Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Live Cricbuzz Auto-Fill</span>
                {formData?.cricbuzzUrl && (
                  <a
                    href={formData.cricbuzzUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-normal inline-flex items-center gap-1 underline"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </h4>
              <p className="text-[11px] text-slate-400">Extracts and saves career tables for Test, ODI, T20I, and IPL permanently</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 self-start sm:self-auto">
            100% Non-Destructive
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={cricbuzzInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Paste Cricbuzz URL (e.g. https://www.cricbuzz.com/profiles/1413/virat-kohli) or ID (1413)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="button"
            onClick={handleSyncCricbuzz}
            disabled={isScraping}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all shrink-0"
          >
            {isScraping ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Tables</span>
              </>
            )}
          </button>
        </div>

        {scrapeSuccess && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{scrapeSuccess}</span>
          </div>
        )}

        {scrapeError && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{scrapeError}</span>
          </div>
        )}
      </div>

      {/* Batting Career Summary */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
        <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>🏏</span> Batting Career Summary
        </h4>
        <table className="w-full text-xs text-left min-w-[700px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800 font-medium">
              <th className="py-2 px-2">Format</th>
              {battingCols.map((col) => (
                <th key={col.key} className="py-2 px-1 text-center font-mono">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {formats.map((fmt) => (
              <tr key={fmt} className="hover:bg-slate-800/30">
                <td className="py-2 px-2 font-sans font-bold text-white">{fmt}</td>
                {battingCols.map((col) => {
                  const val = careerStats?.batting?.[fmt]?.[col.key] || '';
                  return (
                    <td key={col.key} className="p-1">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleStatChange('batting', fmt, col.key, e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-slate-950/60 border border-slate-800 rounded px-1 py-1 text-white text-xs focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bowling Career Summary */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
        <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>🎯</span> Bowling Career Summary
        </h4>
        <table className="w-full text-xs text-left min-w-[700px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800 font-medium">
              <th className="py-2 px-2">Format</th>
              {bowlingCols.map((col) => (
                <th key={col.key} className="py-2 px-1 text-center font-mono">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {formats.map((fmt) => (
              <tr key={fmt} className="hover:bg-slate-800/30">
                <td className="py-2 px-2 font-sans font-bold text-white">{fmt}</td>
                {bowlingCols.map((col) => {
                  const val = careerStats?.bowling?.[fmt]?.[col.key] || '';
                  return (
                    <td key={col.key} className="p-1">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleStatChange('bowling', fmt, col.key, e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-slate-950/60 border border-slate-800 rounded px-1 py-1 text-white text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
