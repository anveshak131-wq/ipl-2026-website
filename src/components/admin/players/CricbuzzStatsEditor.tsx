'use client';

import React, { useState } from 'react';
import { ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface CricbuzzStatsEditorProps {
  formData: any;
  onChange: (data: any) => void;
}

function getFormatData(categoryObj: any, fmt: string) {
  if (!categoryObj) return {};
  if (fmt === 'T20I') return categoryObj['T20I'] || categoryObj['T20'] || {};
  if (fmt === 'WPL') return categoryObj['WPL'] || categoryObj['WT20'] || categoryObj['IPL'] || {};
  return categoryObj[fmt] || {};
}

function getMetricVal(row: any, ...keys: string[]) {
  if (!row) return '—';
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return String(row[k]);
    }
  }
  return '—';
}

export default function CricbuzzStatsEditor({ formData, onChange }: CricbuzzStatsEditorProps) {
  const initialUrl = formData?.cricbuzzUrl || (formData?.cricbuzzId ? `https://www.cricbuzz.com/profiles/${formData.cricbuzzId}` : '');
  const [cricbuzzInput, setCricbuzzInput] = useState<string>(initialUrl);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [matchedRows, setMatchedRows] = useState<number>(0);

  const isWpl = (formData?.league || '').toLowerCase() === 'wpl';
  const formats = ['Test', 'ODI', 'T20I', isWpl ? 'WPL' : 'IPL'];
  const careerStats = formData?.careerStats || { batting: {}, bowling: {} };

  const handleSync = async () => {
    const raw = cricbuzzInput.trim();
    if (!raw) {
      setScrapeError('Please enter a Cricbuzz profile URL or ID');
      return;
    }

    setIsScraping(true);
    setScrapeError(null);
    setSyncSuccess(false);

    let targetUrl = raw;
    let targetId = '';
    if (/^\d+$/.test(raw)) {
      targetId = raw;
      targetUrl = `https://www.cricbuzz.com/profiles/${raw}`;
    } else {
      const match = raw.match(/profiles\/(\d+)/);
      if (match) targetId = match[1];
    }

    try {
      const res = await fetch('/api/admin/scrape-cricbuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: targetUrl, profileId: targetId, playerName: formData?.name || "" })
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || `Scrape failed with status ${res.status}`);
      }

      const stats = payload.data?.result || payload.data || payload.result || {
        batting: payload.batting || {},
        bowling: payload.bowling || {}
      };

      const updatedStats = {
        batting: stats.batting || {},
        bowling: stats.bowling || {}
      };

      onChange({
        ...formData,
        careerStats: updatedStats,
        cricbuzzUrl: payload.sourceUrl || targetUrl,
        cricbuzzId: targetId || formData.cricbuzzId || ''
      });

      setSyncSuccess(true);
      setMatchedRows(payload.matchedRows || 20);
    } catch (err: any) {
      setScrapeError(err.message || 'Error syncing data from Cricbuzz');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Sync Header */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={cricbuzzInput}
              onChange={(e) => {
                setCricbuzzInput(e.target.value);
                setSyncSuccess(false);
                setScrapeError(null);
              }}
              placeholder="Paste Cricbuzz URL (e.g. https://www.cricbuzz.com/profiles/9115/ellyse-perry) or ID (9115)"
              className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
            {initialUrl && (
              <a
                href={initialUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400"
                title="View Cricbuzz Profile"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={isScraping}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
          >
            <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
            {isScraping ? 'Syncing...' : 'Sync Tables'}
          </button>
        </div>

        {syncSuccess && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Successfully synced Batting & Bowling tables ({matchedRows} total rows) and saved Cricbuzz profile link!</span>
          </div>
        )}

        {scrapeError && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{scrapeError}</span>
          </div>
        )}
      </div>

      {/* Batting Career Summary */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 overflow-hidden">
        <h4 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
          <span>🏏</span> BATTING CAREER SUMMARY
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2 px-3">Format</th>
                <th className="py-2 px-2 text-center">Mat</th>
                <th className="py-2 px-2 text-center">Inn</th>
                <th className="py-2 px-2 text-center">NO</th>
                <th className="py-2 px-2 text-center">Runs</th>
                <th className="py-2 px-2 text-center">HS</th>
                <th className="py-2 px-2 text-center">Avg</th>
                <th className="py-2 px-2 text-center">BF</th>
                <th className="py-2 px-2 text-center">SR</th>
                <th className="py-2 px-2 text-center">100s</th>
                <th className="py-2 px-2 text-center">200s</th>
                <th className="py-2 px-2 text-center">50s</th>
                <th className="py-2 px-2 text-center">4s</th>
                <th className="py-2 px-2 text-center">6s</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {formats.map((fmt) => {
                const row = getFormatData(careerStats.batting, fmt);
                return (
                  <tr key={fmt} className="hover:bg-slate-800/30 text-slate-200">
                    <td className="py-2.5 px-3 font-bold text-white">{fmt}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'M', 'Matches', 'mat')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Inn', 'Innings', 'inn')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'NO', 'NotOuts', 'no')}</td>
                    <td className="py-2.5 px-2 text-center font-semibold text-emerald-400">{getMetricVal(row, 'Runs', 'runs')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'HS', 'Highest', 'hs')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Avg', 'Average', 'avg')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'BF', 'BallsFaced', 'bf')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'SR', 'StrikeRate', 'sr')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, '100', '100s', 'hundreds')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, '200', '200s')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, '50', '50s', 'fifties')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, '4s', 'Fours', 'fours')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, '6s', 'Sixes', 'sixes')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bowling Career Summary */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 overflow-hidden">
        <h4 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
          <span>🎯</span> BOWLING CAREER SUMMARY
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2 px-3">Format</th>
                <th className="py-2 px-2 text-center">Mat</th>
                <th className="py-2 px-2 text-center">Inn</th>
                <th className="py-2 px-2 text-center">Balls</th>
                <th className="py-2 px-2 text-center">Runs</th>
                <th className="py-2 px-2 text-center">Wkts</th>
                <th className="py-2 px-2 text-center">BBI</th>
                <th className="py-2 px-2 text-center">BBM</th>
                <th className="py-2 px-2 text-center">Econ</th>
                <th className="py-2 px-2 text-center">Avg</th>
                <th className="py-2 px-2 text-center">SR</th>
                <th className="py-2 px-2 text-center">5W</th>
                <th className="py-2 px-2 text-center">10W</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {formats.map((fmt) => {
                const row = getFormatData(careerStats.bowling, fmt);
                return (
                  <tr key={fmt} className="hover:bg-slate-800/30 text-slate-200">
                    <td className="py-2.5 px-3 font-bold text-white">{fmt}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'M', 'Matches', 'mat')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Inn', 'Innings', 'inn')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'B', 'Balls', 'balls')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Runs', 'runs')}</td>
                    <td className="py-2.5 px-2 text-center font-semibold text-cyan-400">{getMetricVal(row, 'Wkts', 'Wickets', 'wkts')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'BBI', 'bbi')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'BBM', 'bbm')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Econ', 'Economy', 'econ')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Avg', 'Average', 'avg')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'SR', 'StrikeRate', 'sr')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, '5W', 'fiveWickets', '5w')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, '10W', '10w')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
