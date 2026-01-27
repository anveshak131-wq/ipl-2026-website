"use client";

import { useState } from 'react';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';

const HEADERS = ['@Over','Ball','Innings','Striker','Non-Striker','Bowler','Runs','Extras','Wicket','Notes'];

export default function LiveScoreCSVPage() {
  const [rows, setRows] = useState<string[][]>([]);

  const updateCell = (rIdx: number, cIdx: number, value: string) => {
    setRows((prev) => {
      const copy = prev.map((r) => [...r]);
      copy[rIdx][cIdx] = value;
      return copy;
    });
  };

  const addRow = () => setRows((p) => [...p, Array(HEADERS.length).fill('')]);
  const removeRow = (idx: number) => setRows((p) => p.filter((_, i) => i !== idx));
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
            </div>

            <div className="shadow-sm overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full text-sm table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    {HEADERS.map((h) => (
                      <th key={h} className="px-3 py-3 text-left font-medium text-gray-700 sticky top-0 z-10 border-b border-gray-200">{h}</th>
                    ))}
                    <th className="px-3 py-3 sticky top-0 z-10 border-b border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, r) => (
                    <tr key={r} className={`transition-colors ${r % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                      {row.map((cell, c) => (
                        <td key={c} className="px-3 py-2 align-top border-b border-gray-100">
                          <input
                            value={cell}
                            onChange={(e) => updateCell(r, c, e.target.value)}
                            className="w-full border border-transparent focus:border-gray-300 rounded px-2 py-1 bg-white text-gray-900 placeholder-gray-400"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 align-top border-b border-gray-100 text-right">
                        <button onClick={() => removeRow(r)} title="Remove row" className="text-red-600 hover:text-red-800">Remove</button>
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
