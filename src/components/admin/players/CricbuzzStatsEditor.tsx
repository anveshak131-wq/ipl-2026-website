'use client';

import React from 'react';

interface CricbuzzStatsEditorProps {
  formData: any;
  onChange: (updatedData: any) => void;
}

const FORMATS = ['Test', 'ODI', 'T20I', 'IPL'] as const;

const VIRAT_PLACEHOLDERS = {
  batting: {
    Test: { M: '123', Inn: '210', NO: '21', Runs: '9230', HS: '254*', Avg: '48.83', BF: '16634', SR: '55.49', '100': '30', '200': '7', '50': '31', '4s': '1018', '6s': '26' },
    ODI:  { M: '313', Inn: '301', NO: '47', Runs: '14867', HS: '183',  Avg: '58.53', BF: '15958', SR: '93.16', '100': '55', '200': '0', '50': '75', '4s': '1350', '6s': '156' },
    T20I: { M: '125', Inn: '117', NO: '31', Runs: '4188',  HS: '122*', Avg: '48.69', BF: '3040',  SR: '137.04', '100': '1',  '200': '0', '50': '38', '4s': '361',  '6s': '124' },
    IPL:  { M: '283', Inn: '275', NO: '44', Runs: '9336',  HS: '113*', Avg: '40.42', BF: '6926',  SR: '134.80', '100': '9',  '200': '0', '50': '68', '4s': '844',  '6s': '316' },
  },
  bowling: {
    Test: { M: '123', Inn: '11', B: '175', Runs: '84',  Wkts: '0', BBI: '-',    BBM: '-',    Econ: '2.88', Avg: '-',    SR: '-',    '5W': '0', '10W': '0' },
    ODI:  { M: '313', Inn: '50', B: '668', Runs: '680', Wkts: '5', BBI: '1/15', BBM: '1/15', Econ: '6.10', Avg: '136.00', SR: '133.60', '5W': '0', '10W': '0' },
    T20I: { M: '125', Inn: '13', B: '152', Runs: '204', Wkts: '4', BBI: '1/13', BBM: '1/13', Econ: '8.05', Avg: '51.00',  SR: '38.00',  '5W': '0', '10W': '0' },
    IPL:  { M: '283', Inn: '26', B: '251', Runs: '368', Wkts: '4', BBI: '2/25', BBM: '2/25', Econ: '8.80', Avg: '92.00',  SR: '62.75',  '5W': '0', '10W': '0' },
  },
};

const BATTING_AUTO_FIELDS = ['Avg', 'SR'] as const;
const BOWLING_AUTO_FIELDS = ['Avg', 'SR', 'Econ'] as const;

export default function CricbuzzStatsEditor({ formData, onChange }: CricbuzzStatsEditorProps) {
  const career = formData.careerStats || { batting: {}, bowling: {} };

  const handleStatsChange = (type: 'batting' | 'bowling', format: string, field: string, val: string) => {
    const existingRow = { ...(career[type]?.[format] || {}) };
    existingRow[field] = val;

    // Real-time automatic calculations
    if (type === 'batting') {
      const runs = Number(existingRow.Runs);
      const inn = Number(existingRow.Inn);
      const no = Number(existingRow.NO);
      const bf = Number(existingRow.BF);

      if (!isNaN(runs) && !isNaN(inn) && !isNaN(no)) {
        const dismissals = inn - no;
        if (dismissals > 0) {
          existingRow.Avg = (runs / dismissals).toFixed(2);
        } else if (dismissals === 0 && runs > 0) {
          existingRow.Avg = runs.toFixed(2);
        } else if (existingRow.Runs !== undefined && existingRow.Inn !== undefined) {
          existingRow.Avg = '-';
        }
      }

      if (!isNaN(runs) && !isNaN(bf)) {
        if (bf > 0) {
          existingRow.SR = ((runs / bf) * 100).toFixed(2);
        } else if (existingRow.BF !== undefined) {
          existingRow.SR = '-';
        }
      }
    } else if (type === 'bowling') {
      const runs = Number(existingRow.Runs);
      const balls = Number(existingRow.B);
      const wkts = Number(existingRow.Wkts);

      if (!isNaN(runs) && !isNaN(wkts)) {
        existingRow.Avg = wkts > 0 ? (runs / wkts).toFixed(2) : '-';
      }

      if (!isNaN(balls) && !isNaN(wkts)) {
        existingRow.SR = wkts > 0 ? (balls / wkts).toFixed(2) : '-';
      }

      if (!isNaN(runs) && !isNaN(balls)) {
        existingRow.Econ = balls > 0 ? ((runs * 6) / balls).toFixed(2) : '-';
      }
    }

    onChange({
      ...formData,
      careerStats: {
        ...career,
        [type]: {
          ...career[type],
          [format]: existingRow,
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
              const b = career.batting?.[fmt] || {};
              const p = VIRAT_PLACEHOLDERS.batting[fmt];
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
                          placeholder={p[col]}
                          value={b[col] ?? ''}
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
              const b = career.bowling?.[fmt] || {};
              const p = VIRAT_PLACEHOLDERS.bowling[fmt];
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
                          placeholder={p[col]}
                          value={b[col] ?? ''}
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
