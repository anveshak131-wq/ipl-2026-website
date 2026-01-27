"use client";

import { useState, useEffect } from 'react';
import type { SaveStatus } from './saveStatus';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';

const HEADERS = ['Overs','Ball','Innings','Striker','Non-Striker','Bowler','Runs','Extras','Wicket','Notes'];

export default function LiveScoreCSVPage() {
  const [rows, setRows] = useState<string[][]>([]);
  // Load saved rows from KV on mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/wpl-live-score/save');
        if (resp.ok) {
          const data = await resp.json();
          // Accept both {rows: [...]} and [...] (raw array)
          if (Array.isArray(data.rows)) {
            setRows(data.rows);
          } else if (Array.isArray(data)) {
            setRows(data);
          } else {
            // For debugging: log unexpected data
            // eslint-disable-next-line no-console
            console.log('Unexpected data from KV:', data);
          }
        } else {
          // eslint-disable-next-line no-console
          console.log('Failed to fetch saved rows:', resp.status);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Error loading saved rows:', e);
      }
    })();
  }, []);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const updateCell = (rIdx: number, cIdx: number, value: string) => {
    setRows((prev) => {
      const copy = prev.map((r) => [...r]);
      copy[rIdx][cIdx] = value;
      return copy;
    });
  };

  const addRow = () => setRows((p) => [...p, Array(HEADERS.length).fill('')]);
  const removeRow = async (idx: number) => {
    setRows((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      // Save immediately after removing
      (async () => {
        setSaveStatus('saving');
        try {
          const resp = await fetch('/api/wpl-live-score/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: updated }),
          });
          if (resp.ok) {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
          } else {
            setSaveStatus('error');
          }
        } catch {
          setSaveStatus('error');
        }
      })();
      return updated;
    });
  };
  const exportCSV = () => {
    const headerLine = HEADERS.join(',');
    const body = rows
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csv = [headerLine, body].filter(Boolean).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'live_score.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveRows = async () => {
    setSaveStatus('saving');
    try {
      const resp = await fetch('/api/wpl-live-score/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      if (resp.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <div className="min-h-screen">
      <WPLAdminSidebarNew />
      <main className="p-8 lg:ml-64">
        <div className="max-w-6xl">
          <h1 className="text-3xl font-bold mb-4">Live Score CSV — Editable Table</h1>
          <p className="text-sm text-gray-500 mb-4">Edit rows inline for testing. Use the + button to add rows and the trash button to remove.</p>
          <div className="mb-4 flex gap-3 items-center">
            <button onClick={addRow} className="px-3 py-2 bg-purple-600 text-white rounded-md">+ Add Row</button>
            <button onClick={exportCSV} className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-700 shadow-sm hover:bg-gray-50">Export CSV</button>
            <button onClick={saveRows} className="px-3 py-2 bg-green-600 text-white rounded-md disabled:opacity-60" disabled={saveStatus==='saving'}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save'}
            </button>
          </div>
          <div className="shadow-lg overflow-hidden rounded-lg border border-gray-300 bg-gray-900">
            <table className="min-w-full text-sm table-fixed bg-gray-900">
              <thead className="bg-gray-800">
                <tr>
                  {HEADERS.map((h) => (
                    <th key={h} className="px-3 py-3 text-left font-semibold text-gray-100 sticky top-0 z-10 border-b border-gray-700 uppercase tracking-wide bg-gray-800">{h}</th>
                  ))}
                  <th className="px-3 py-3 sticky top-0 z-10 border-b border-gray-700 bg-gray-800 text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr key={r} className={`transition-colors ${r % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'} hover:bg-gray-700`}>
                    {row.map((cell, c) => (
                      <td key={c} className="px-3 py-2 align-top border-b border-gray-800">
                        {c === 0 ? (
                          <select
                            value={cell}
                            onChange={e => updateCell(r, c, e.target.value)}
                            className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100"
                          >
                            <option value="">Overs</option>
                            {Array.from({ length: 20 }, (_, i) => (
                              <option key={i+1} value={String(i+1)}>{i+1}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={cell}
                            onChange={(e) => updateCell(r, c, e.target.value)}
                            placeholder={HEADERS[c]}
                            className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100 placeholder-gray-400"
                          />
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 align-top border-b border-gray-800 text-right">
                      <button onClick={() => removeRow(r)} title="Remove row" className="text-red-400 hover:text-red-200">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
