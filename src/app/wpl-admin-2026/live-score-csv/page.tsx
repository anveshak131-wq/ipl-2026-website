"use client";

import { useState } from 'react';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';

const HEADERS = ['@Over','Ball','Innings','Striker','Non-Striker','Bowler','Runs','Extras','Wicket','Notes'];

const SAMPLE_ROWS: string[][] = [
  ['1','1','1','Asha Kumar','Bela Roy','Imran Khan','0','0','','Good length defended'],
  ['1','2','1','Asha Kumar','Bela Roy','Imran Khan','4','0','','Driven through covers'],
  ['1','3','1','Asha Kumar','Bela Roy','Imran Khan','1','0','','Single to midwicket'],
  ['1','4','1','Bela Roy','Asha Kumar','Imran Khan','0','0','','Dot ball'],
  ['1','5','1','Bela Roy','Asha Kumar','Imran Khan','2','0','','Two runs through point'],
  ['1','6','1','Bela Roy','Asha Kumar','Imran Khan','0','0','','Good yorker'],
  ['2','1','1','Asha Kumar','Bela Roy','Sharma','6','0','','Six over long-on'],
  ['2','2','1','Asha Kumar','Bela Roy','Sharma','0','1','wide','Wide down the leg side'],
  ['2','3','1','Asha Kumar','Bela Roy','Sharma','3','0','','Quick boundary'],
  ['2','4','1','Bela Roy','Asha Kumar','Sharma','0','0','','Defended'],
  ['2','5','1','Bela Roy','Asha Kumar','Sharma','1','0','','Pushed for a single'],
  ['2','6','1','Asha Kumar','Bela Roy','Sharma','0','0','','End of over'],
];

export default function LiveScoreCSVPage() {
  const [rows, setRows] = useState<string[][]>(SAMPLE_ROWS);

  const updateCell = (rIdx: number, cIdx: number, value: string) => {
    setRows((prev) => {
      const copy = prev.map((r) => [...r]);
      copy[rIdx][cIdx] = value;
      return copy;
    });
  };

  const addRow = () => setRows((p) => [...p, Array(HEADERS.length).fill('')]);
  const removeRow = (idx: number) => setRows((p) => p.filter((_, i) => i !== idx));

  return (
    <div className="min-h-screen">
      <WPLAdminSidebarNew />

      <main className="p-8 lg:ml-64">
        <div className="max-w-6xl">
          <h1 className="text-3xl font-bold mb-4">Live Score CSV — Editable Table</h1>
          <p className="text-sm text-gray-500 mb-4">Edit rows inline for testing. Use the + button to add rows and the trash button to remove.</p>

          <div className="mb-4">
            <button onClick={addRow} className="px-3 py-2 bg-purple-600 text-white rounded-md">+ Add Row</button>
          </div>

          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {HEADERS.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr key={r} className={r % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, c) => (
                      <td key={c} className="px-3 py-2 align-top">
                        <input
                          value={cell}
                          onChange={(e) => updateCell(r, c, e.target.value)}
                          className="w-full bg-transparent focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2">
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
