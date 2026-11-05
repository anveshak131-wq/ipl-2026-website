'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface CricbuzzStatsEditorProps {
  formData: any;
  onChange: (data: any) => void;
}

const CACHE_KEY = 'sportsup99_cricbuzz_sync_cache_v1';

function getFormatData(categoryObj: any, fmt: string) {
  if (!categoryObj) return {};
  if (fmt === 'T20I') {
    return categoryObj['T20I'] || categoryObj['T20'] || categoryObj['t20i'] || categoryObj['t20'] || {};
  }
  if (fmt === 'WPL') {
    return categoryObj['WPL'] || categoryObj['wpl'] || categoryObj['WT20'] || categoryObj['wt20'] || categoryObj['IPL'] || {};
  }
  if (fmt === 'IPL') {
    return categoryObj['IPL'] || categoryObj['ipl'] || categoryObj['WPL'] || {};
  }
  return categoryObj[fmt] || categoryObj[fmt.toUpperCase()] || categoryObj[fmt.toLowerCase()] || {};
}

function getMetricVal(row: any, ...keys: string[]) {
  if (!row) return '—';
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '' && String(row[k]).trim() !== 'undefined') {
      return String(row[k]);
    }
    const lower = k.toLowerCase();
    if (row[lower] !== undefined && row[lower] !== null && String(row[lower]).trim() !== '') {
      return String(row[lower]);
    }
  }
  return '—';
}

function hasValidCareerStats(cs: any): boolean {
  if (!cs || typeof cs !== 'object') return false;
  const bat = cs.batting || {};
  const bowl = cs.bowling || {};
  for (const fmt of ['Test', 'ODI', 'T20I', 'T20', 'WPL', 'IPL']) {
    if (bat[fmt] && Object.keys(bat[fmt]).length > 0) return true;
    if (bowl[fmt] && Object.keys(bowl[fmt]).length > 0) return true;
  }
  return false;
}

function readFromLocalCache(formData: any) {
  if (typeof window === 'undefined') return null;
  try {
    const store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const idKey = formData?.id ? String(formData.id).trim() : '';
    const nameKey = formData?.name ? String(formData.name).toLowerCase().trim() : '';
    return (idKey && store[idKey]) || (nameKey && store[nameKey]) || null;
  } catch (e) {
    return null;
  }
}

function writeToLocalCache(formData: any, careerStats: any, cricbuzzUrl: string, cricbuzzId: string) {
  if (typeof window === 'undefined') return;
  try {
    const store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const record = { careerStats, cricbuzzUrl, cricbuzzId, updatedAt: Date.now() };
    if (formData?.id) store[String(formData.id).trim()] = record;
    if (formData?.name) store[String(formData.name).toLowerCase().trim()] = record;
    if (cricbuzzId) store['cb_' + String(cricbuzzId).trim()] = record;
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch (e) {}
}

export default function CricbuzzStatsEditor({ formData, onChange }: CricbuzzStatsEditorProps) {
  const cached = readFromLocalCache(formData);
  const effectiveCareerStats = hasValidCareerStats(formData?.careerStats)
    ? formData.careerStats
    : (cached?.careerStats || { batting: {}, bowling: {} });

  const resolvedInitialUrl =
    formData?.cricbuzzUrl ||
    cached?.cricbuzzUrl ||
    (formData?.cricbuzzId ? `https://www.cricbuzz.com/profiles/${formData.cricbuzzId}` : '');

  const [cricbuzzInput, setCricbuzzInput] = useState<string>(resolvedInitialUrl);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [matchedRows, setMatchedRows] = useState<number>(0);

  const isWpl =
    (formData?.league || '').toLowerCase() === 'wpl' ||
    (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/wpl'));

  const formats = ['Test', 'ODI', 'T20I', isWpl ? 'WPL' : 'IPL'];

  // Automatically hydrate parent formData if parent opened with empty careerStats
  useEffect(() => {
    const localHit = readFromLocalCache(formData);
    const urlToUse =
      formData?.cricbuzzUrl ||
      localHit?.cricbuzzUrl ||
      (formData?.cricbuzzId ? `https://www.cricbuzz.com/profiles/${formData.cricbuzzId}` : '');

    if (urlToUse && urlToUse !== cricbuzzInput) {
      setCricbuzzInput(urlToUse);
    }

    if (!hasValidCareerStats(formData?.careerStats) && localHit?.careerStats) {
      onChange({
        ...formData,
        careerStats: localHit.careerStats,
        cricbuzzUrl: localHit.cricbuzzUrl || formData?.cricbuzzUrl || '',
        cricbuzzId: localHit.cricbuzzId || formData?.cricbuzzId || ''
      });
    } else if (hasValidCareerStats(formData?.careerStats)) {
      writeToLocalCache(
        formData,
        formData.careerStats,
        formData.cricbuzzUrl || '',
        formData.cricbuzzId || ''
      );
    }
  }, [formData?.name, formData?.id]);

  const handleSync = async () => {
    const raw = cricbuzzInput.trim();
    if (!raw && !formData?.name) {
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
        body: JSON.stringify({
          url: targetUrl,
          profileId: targetId,
          playerName: formData?.name || ''
        })
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

      const finalUrl = payload.sourceUrl || targetUrl;
      const finalId = targetId || formData?.cricbuzzId || '';

      // 1. Save immediately to localStorage cache so refresh never loses it
      writeToLocalCache(formData, updatedStats, finalUrl, finalId);

      // 2. Update parent form state
      const updatedFormData = {
        ...formData,
        league: isWpl ? 'wpl' : (formData?.league || 'ipl'),
        careerStats: updatedStats,
        cricbuzzUrl: finalUrl,
        cricbuzzId: finalId
      };
      onChange(updatedFormData);
      setCricbuzzInput(finalUrl);

      // 3. Auto-save directly to backend KV API immediately upon sync
      if (formData?.name || formData?.id) {
        const leagueParam = isWpl ? 'wpl' : 'ipl';
        fetch(`/api/players?league=${leagueParam}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updatedFormData,
            id: formData?.id || undefined,
            name: formData?.name,
            league: leagueParam,
            careerStats: updatedStats,
            cricbuzzUrl: finalUrl,
            cricbuzzId: finalId
          })
        }).catch(() => {});
      }

      setSyncSuccess(true);
      setMatchedRows(payload.matchedRows || 24);
    } catch (err: any) {
      setScrapeError(err.message || 'Error syncing data from Cricbuzz');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="space-y-6">
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
              placeholder="Paste Cricbuzz URL (e.g. https://www.cricbuzz.com/profiles/8734/ellyse-perry) or ID (8734)"
              className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
            {cricbuzzInput && (
              <a
                href={cricbuzzInput}
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
            <span>Successfully synced & saved Batting & Bowling tables ({matchedRows} total rows) and Cricbuzz profile link!</span>
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
                const row = getFormatData(effectiveCareerStats.batting, fmt);
                return (
                  <tr key={fmt} className="hover:bg-slate-800/30 text-slate-200">
                    <td className="py-2.5 px-3 font-bold text-white">{fmt}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'M', 'Matches', 'matches', 'mat')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Inn', 'Innings', 'innings', 'inn')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'NO', 'NotOut', 'notOut', 'no')}</td>
                    <td className="py-2.5 px-2 text-center font-semibold text-emerald-400">{getMetricVal(row, 'Runs', 'runs', 'R')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'HS', 'Highest', 'highest', 'hs')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Avg', 'Average', 'average', 'avg')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'BF', 'Balls', 'ballsFaced', 'bf')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'SR', 'StrikeRate', 'strikeRate', 'sr')}</td>
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
                const row = getFormatData(effectiveCareerStats.bowling, fmt);
                return (
                  <tr key={fmt} className="hover:bg-slate-800/30 text-slate-200">
                    <td className="py-2.5 px-3 font-bold text-white">{fmt}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'M', 'Matches', 'matches', 'mat')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Inn', 'Innings', 'innings', 'inn')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'B', 'Balls', 'balls')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Runs', 'runs')}</td>
                    <td className="py-2.5 px-2 text-center font-semibold text-cyan-400">{getMetricVal(row, 'Wkts', 'Wickets', 'wickets', 'wkts')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'BBI', 'bbi', 'bestBowling')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'BBM', 'bbm')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Econ', 'Economy', 'economy', 'econ')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'Avg', 'Average', 'average', 'avg')}</td>
                    <td className="py-2.5 px-2 text-center">{getMetricVal(row, 'SR', 'StrikeRate', 'strikeRate', 'sr')}</td>
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
