'use client';

import React from 'react';

interface CricbuzzStatsEditorProps {
  formData: any;
  onChange: (updatedData: any) => void;
}

const FORMATS = ['Test', 'ODI', 'T20I', 'IPL'] as const;

// Virat Kohli reference placeholders
const VIRAT_PLACEHOLDERS = {
  bio: {
    born: 'Nov 05, 1988 (37 years)',
    birthPlace: 'Delhi',
    height: '5 ft 9 in (175 cm)',
    role: 'Batsman',
    battingStyle: 'Right Handed Bat',
    bowlingStyle: 'Right-arm medium',
    teams: 'India, Royal Challengers Bengaluru, Delhi',
  },
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

export default function CricbuzzStatsEditor({ formData, onChange }: CricbuzzStatsEditorProps) {
  const bio = formData.bio || {};
  const career = formData.careerStats || { batting: {}, bowling: {} };

  const handleBioChange = (field: string, val: string) => {
    onChange({
      ...formData,
      bio: { ...bio, [field]: val },
    });
  };

  const handleStatsChange = (type: 'batting' | 'bowling', format: string, field: string, val: string) => {
    onChange({
      ...formData,
      careerStats: {
        ...career,
        [type]: {
          ...career[type],
          [format]: {
            ...(career[type]?.[format] || {}),
            [field]: val,
          },
        },
      },
    });
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. PERSONAL INFORMATION (BIO) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-3">
          1. Personal Information (Bio)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Born / Age</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
              placeholder={VIRAT_PLACEHOLDERS.bio.born}
              value={bio.born || ''}
              onChange={(e) => handleBioChange('born', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Birth Place</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
              placeholder={VIRAT_PLACEHOLDERS.bio.birthPlace}
              value={bio.birthPlace || ''}
              onChange={(e) => handleBioChange('birthPlace', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Height</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
              placeholder={VIRAT_PLACEHOLDERS.bio.height}
              value={bio.height || ''}
              onChange={(e) => handleBioChange('height', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
              placeholder={VIRAT_PLACEHOLDERS.bio.role}
              value={bio.role || ''}
              onChange={(e) => handleBioChange('role', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Batting Style</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
              placeholder={VIRAT_PLACEHOLDERS.bio.battingStyle}
              value={bio.battingStyle || ''}
              onChange={(e) => handleBioChange('battingStyle', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Bowling Style</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
              placeholder={VIRAT_PLACEHOLDERS.bio.bowlingStyle}
              value={bio.bowlingStyle || ''}
              onChange={(e) => handleBioChange('bowlingStyle', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. BATTING CAREER SUMMARY */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <h4 className="text-sm font-semibold text-sky-400 uppercase tracking-wide mb-3">
          2. Batting Career Summary
        </h4>
        <table className="w-full text-xs text-left min-w-[760px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th className="py-1 px-1.5 w-16">Format</th>
              <th className="py-1 px-1">M</th>
              <th className="py-1 px-1">Inn</th>
              <th className="py-1 px-1">NO</th>
              <th className="py-1 px-1">Runs</th>
              <th className="py-1 px-1">HS</th>
              <th className="py-1 px-1">Avg</th>
              <th className="py-1 px-1">BF</th>
              <th className="py-1 px-1">SR</th>
              <th className="py-1 px-1">100</th>
              <th className="py-1 px-1">200</th>
              <th className="py-1 px-1">50</th>
              <th className="py-1 px-1">4s</th>
              <th className="py-1 px-1">6s</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {FORMATS.map((fmt) => {
              const b = career.batting?.[fmt] || {};
              const p = VIRAT_PLACEHOLDERS.batting[fmt];
              return (
                <tr key={fmt}>
                  <td className="py-2 px-1.5 font-bold text-slate-300">{fmt}</td>
                  {(['M', 'Inn', 'NO', 'Runs', 'HS', 'Avg', 'BF', 'SR', '100', '200', '50', '4s', '6s'] as const).map((col) => (
                    <td key={col} className="p-1">
                      <input
                        type="text"
                        className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none text-center"
                        placeholder={p[col]}
                        value={b[col] ?? ''}
                        onChange={(e) => handleStatsChange('batting', fmt, col, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. BOWLING CAREER SUMMARY */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
          3. Bowling Career Summary
        </h4>
        <table className="w-full text-xs text-left min-w-[760px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th className="py-1 px-1.5 w-16">Format</th>
              <th className="py-1 px-1">M</th>
              <th className="py-1 px-1">Inn</th>
              <th className="py-1 px-1">B</th>
              <th className="py-1 px-1">Runs</th>
              <th className="py-1 px-1">Wkts</th>
              <th className="py-1 px-1">BBI</th>
              <th className="py-1 px-1">BBM</th>
              <th className="py-1 px-1">Econ</th>
              <th className="py-1 px-1">Avg</th>
              <th className="py-1 px-1">SR</th>
              <th className="py-1 px-1">5W</th>
              <th className="py-1 px-1">10W</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {FORMATS.map((fmt) => {
              const b = career.bowling?.[fmt] || {};
              const p = VIRAT_PLACEHOLDERS.bowling[fmt];
              return (
                <tr key={fmt}>
                  <td className="py-2 px-1.5 font-bold text-slate-300">{fmt}</td>
                  {(['M', 'Inn', 'B', 'Runs', 'Wkts', 'BBI', 'BBM', 'Econ', 'Avg', 'SR', '5W', '10W'] as const).map((col) => (
                    <td key={col} className="p-1">
                      <input
                        type="text"
                        className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none text-center"
                        placeholder={p[col]}
                        value={b[col] ?? ''}
                        onChange={(e) => handleStatsChange('bowling', fmt, col, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
