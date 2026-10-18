'use client';

import React from 'react';

interface CricbuzzStatsEditorProps {
  formData: any;
  onChange: (updatedData: any) => void;
}

const FORMATS = ['Test', 'ODI', 'T20I', 'IPL'] as const;

// Helper to read property regardless of legacy vs modern casing
function getVal(row: any, ...keys: string[]): string {
  if (!row) return '';
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
      return String(row[k]);
    }
  }
  return '';
}

// Canonical getters for row values
function getBattingRow(career: any, fmt: string) {
  const altFmt = fmt === 'T20I' ? 'T20' : fmt;
  const raw = career?.batting?.[fmt] || career?.batting?.[altFmt] || {};
  return {
    raw,
    M: getVal(raw, 'M', 'Matches'),
    Inn: getVal(raw, 'Inn', 'Innings'),
    NO: getVal(raw, 'NO', 'NotOut'),
    Runs: getVal(raw, 'Runs'),
    HS: getVal(raw, 'HS', 'Highest'),
    Avg: getVal(raw, 'Avg', 'Average'),
    BF: getVal(raw, 'BF', 'Balls'),
    SR: getVal(raw, 'SR'),
    '100': getVal(raw, '100', '100s'),
    '200': getVal(raw, '200', '200s'),
    '50': getVal(raw, '50', '50s'),
    '4s': getVal(raw, '4s', 'Fours'),
    '6s': getVal(raw, '6s', 'Sixes'),
  };
}

function getBowlingRow(career: any, fmt: string) {
  const altFmt = fmt === 'T20I' ? 'T20' : fmt;
  const raw = career?.bowling?.[fmt] || career?.bowling?.[altFmt] || {};
  return {
    raw,
    M: getVal(raw, 'M', 'Matches'),
    Inn: getVal(raw, 'Inn', 'Innings'),
    B: getVal(raw, 'B', 'Balls'),
    Runs: getVal(raw, 'Runs'),
    Wkts: getVal(raw, 'Wkts', 'Wickets'),
    BBI: getVal(raw, 'BBI'),
    BBM: getVal(raw, 'BBM'),
    Econ: getVal(raw, 'Econ', 'Eco'),
    Avg: getVal(raw, 'Avg'),
    SR: getVal(raw, 'SR'),
    '5W': getVal(raw, '5W', '5w'),
    '10W': getVal(raw, '10W', '10w'),
  };
}

const BATTING_AUTO_FIELDS = ['Avg', 'SR'] as const;
const BOWLING_AUTO_FIELDS = ['Avg', 'SR', 'Econ'] as const;

export default function CricbuzzStatsEditor({ formData, onChange }: CricbuzzStatsEditorProps) {
  const career = formData.careerStats || { batting: {}, bowling: {} };

  const handleStatsChange = (type: 'batting' | 'bowling', format: string, field: string, val: string) => {
    const altFormat = format === 'T20I' ? 'T20' : format;
    const existing = { ...(career[type]?.[format] || career[type]?.[altFormat] || {}) };
    
    // Store both canonical and legacy keys for compatibility
    existing[field] = val;
    if (field === 'M') existing.Matches = Number(val) || val;
    if (field === 'Inn') existing.Innings = Number(val) || val;
    if (field === 'NO') existing.NotOut = Number(val) || val;
    if (field === 'HS') existing.Highest = val;
    if (field === 'BF') existing.Balls = Number(val) || val;
    if (field === 'B') existing.Balls = Number(val) || val;
    if (field === 'Wkts') existing.Wickets = Number(val) || val;
    if (field === '50') existing['50s'] = Number(val) || val;
    if (field === '100') existing['100s'] = Number(val) || val;
    if (field === '4s') existing.Fours = Number(val) || val;
    if (field === '6s') existing.Sixes = Number(val) || val;
    if (field === '5W') existing['5w'] = Number(val) || val;
    if (field === '10W') existing['10w'] = Number(val) || val;

    // Real-time automatic calculations
    if (type === 'batting') {
      const runs = Number(existing.Runs ?? val);
      const inn = Number(existing.Inn ?? existing.Innings);
      const no = Number(existing.NO ?? existing.NotOut);
      const bf = Number(existing.BF ?? existing.Balls);

      if (!isNaN(runs) && !isNaN(inn) && !isNaN(no)) {
        const dismissals = inn - no;
        const avg = dismissals > 0 ? (runs / dismissals).toFixed(2) : runs > 0 ? runs.toFixed(2) : '-';
        existing.Avg = avg;
        existing.Average = avg !== '-' ? Number(avg) : 0;
      }

      if (!isNaN(runs) && !isNaN(bf)) {
        const sr = bf > 0 ? ((runs / bf) * 100).toFixed(2) : '-';
        existing.SR = sr;
      }
    } else if (type === 'bowling') {
      const runs = Number(existing.Runs ?? val);
      const balls = Number(existing.B ?? existing.Balls);
      const wkts = Number(existing.Wkts ?? existing.Wickets);

      if (!isNaN(runs) && !isNaN(wkts)) {
        const avg = wkts > 0 ? (runs / wkts).toFixed(2) : '-';
        existing.Avg = avg;
      }

      if (!isNaN(balls) && !isNaN(wkts)) {
        const sr = wkts > 0 ? (balls / wkts).toFixed(2) : '-';
        existing.SR = sr;
      }

      if (!isNaN(runs) && !isNaN(balls)) {
        const econ = balls > 0 ? ((runs * 6) / balls).toFixed(2) : '-';
        existing.Econ = econ;
        existing.Eco = econ !== '-' ? Number(econ) : 0;
      }
    }

    onChange({
      ...formData,
      careerStats: {
        ...career,
        [type]: {
          ...career[type],
          [format]: existing,
          ...(format === 'T20I' ? { T20: existing } : {}),
        },
      },
    });
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. BATTING CAREER SUMMARY */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-sky-400 uppercase tracking-wide">
            1. Batting Career Summary
          </h4>
          <span className="text-[11px] font-medium text-sky-400/80 bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded">
            ✦ Avg &amp; SR auto-calculate from Runs, Inn, NO, BF
          </span>
        </div>
        <table className="w-full text-xs text-left min-w-[760px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th className="py-1 px-1.5 w-16">Format</th>
              <th className="py-1 px-1 text-center">M</th>
              <th className="py-1 px-1 text-center">Inn</th>
              <th className="py-1 px-1 text-center">NO</th>
              <th className="py-1 px-1 text-center">Runs</th>
              <th className="py-1 px-1 text-center">HS</th>
              <th className="py-1 px-1 text-center text-sky-400 font-semibold">Avg 🔒</th>
              <th className="py-1 px-1 text-center">BF</th>
              <th className="py-1 px-1 text-center text-sky-400 font-semibold">SR 🔒</th>
              <th className="py-1 px-1 text-center">100</th>
              <th className="py-1 px-1 text-center">200</th>
              <th className="py-1 px-1 text-center">50</th>
              <th className="py-1 px-1 text-center">4s</th>
              <th className="py-1 px-1 text-center">6s</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {FORMATS.map((fmt) => {
              const row = getBattingRow(career, fmt);
              return (
                <tr key={fmt}>
                  <td className="py-2 px-1.5 font-bold text-slate-300">{fmt}</td>
                  {(['M', 'Inn', 'NO', 'Runs', 'HS', 'Avg', 'BF', 'SR', '100', '200', '50', '4s', '6s'] as const).map((col) => {
                    const isAuto = (BATTING_AUTO_FIELDS as readonly string[]).includes(col);
                    return (
                      <td key={col} className="p-1">
                        <input
                          type="text"
                          readOnly={isAuto}
                          title={isAuto ? 'Auto-calculated' : undefined}
                          className={`w-14 border rounded px-1.5 py-1 text-xs text-center focus:outline-none ${
                            isAuto
                              ? 'bg-sky-950/40 border-sky-900/60 text-sky-300 font-semibold cursor-not-allowed select-none'
                              : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-sky-500'
                          }`}
                          value={row[col] ?? ''}
                          onChange={(e) => !isAuto && handleStatsChange('batting', fmt, col, e.target.value)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. BOWLING CAREER SUMMARY */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
            2. Bowling Career Summary
          </h4>
          <span className="text-[11px] font-medium text-amber-400/80 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
            ✦ Econ, Avg &amp; SR auto-calculate from B, Runs, Wkts
          </span>
        </div>
        <table className="w-full text-xs text-left min-w-[760px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th className="py-1 px-1.5 w-16">Format</th>
              <th className="py-1 px-1 text-center">M</th>
              <th className="py-1 px-1 text-center">Inn</th>
              <th className="py-1 px-1 text-center">B</th>
              <th className="py-1 px-1 text-center">Runs</th>
              <th className="py-1 px-1 text-center">Wkts</th>
              <th className="py-1 px-1 text-center">BBI</th>
              <th className="py-1 px-1 text-center">BBM</th>
              <th className="py-1 px-1 text-center text-amber-400 font-semibold">Econ 🔒</th>
              <th className="py-1 px-1 text-center text-amber-400 font-semibold">Avg 🔒</th>
              <th className="py-1 px-1 text-center text-amber-400 font-semibold">SR 🔒</th>
              <th className="py-1 px-1 text-center">5W</th>
              <th className="py-1 px-1 text-center">10W</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {FORMATS.map((fmt) => {
              const row = getBowlingRow(career, fmt);
              return (
                <tr key={fmt}>
                  <td className="py-2 px-1.5 font-bold text-slate-300">{fmt}</td>
                  {(['M', 'Inn', 'B', 'Runs', 'Wkts', 'BBI', 'BBM', 'Econ', 'Avg', 'SR', '5W', '10W'] as const).map((col) => {
                    const isAuto = (BOWLING_AUTO_FIELDS as readonly string[]).includes(col);
                    return (
                      <td key={col} className="p-1">
                        <input
                          type="text"
                          readOnly={isAuto}
                          title={isAuto ? 'Auto-calculated' : undefined}
                          className={`w-14 border rounded px-1.5 py-1 text-xs text-center focus:outline-none ${
                            isAuto
                              ? 'bg-amber-950/40 border-amber-900/60 text-amber-300 font-semibold cursor-not-allowed select-none'
                              : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500'
                          }`}
                          value={row[col] ?? ''}
                          onChange={(e) => !isAuto && handleStatsChange('bowling', fmt, col, e.target.value)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
