"use client";

import { useEffect, useState } from 'react';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';

export default function LiveScoreCSVPage() {
  const [rows, setRows] = useState<string[][]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/wpl-admin/live_score_template.csv');
        const text = await res.text();
        const parsed = text
          .trim()
          .split(/\r?\n/)
          .map((r) => r.split(','));
        setRows(parsed);
      } catch (err) {
        setRows([]);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen">
      <WPLAdminSidebarNew />

      <main className="p-8 lg:ml-64">
        <div className="max-w-6xl">
          <h1 className="text-3xl font-bold mb-4">Live Score CSV Template</h1>
          <p className="text-sm text-gray-500 mb-4">This page displays the CSV template used for ball-by-ball live score testing.</p>

          <a href="/wpl-admin/live_score_template.csv" download className="inline-block mb-4 px-4 py-2 bg-purple-600 text-white rounded-md">Download template</a>

          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {rows[0]?.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, r) => (
                  <tr key={r} className={r % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, c) => (
                      <td key={c} className="px-3 py-2 align-top">{cell}</td>
                    ))}
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
