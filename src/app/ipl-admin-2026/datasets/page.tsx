'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

interface DatasetSummary {
  key: string;
  rowCount?: number;
  uploadedAt?: string;
  uploadedBy?: string;
}

function parseCsvSimple(text: string): ParsedCsv {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // Handle escaped quotes within quoted values
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current.trim());
    return cells;
  };

  const headers = parseLine(lines[0]);

  const rows = lines.slice(1).map((line) => {
    const cols = parseLine(line);
    // Normalize row length to headers length
    if (cols.length < headers.length) {
      return [...cols, ...Array(headers.length - cols.length).fill('')];
    }
    if (cols.length > headers.length) {
      return cols.slice(0, headers.length);
    }
    return cols;
  });

  return { headers, rows };
}

export default function AdminDatasetsPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv>({ headers: [], rows: [] });
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [datasetKey, setDatasetKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file');
      setParsed({ headers: [], rows: [] });
      setFileName(null);
      return;
    }

    setIsParsing(true);
    setError(null);
    setFileName(file.name);
    setSaveMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const result = parseCsvSimple(text);
        if (result.headers.length === 0) {
          setError('The CSV file appears to be empty.');
          setParsed({ headers: [], rows: [] });
          setDatasetKey('');
        } else {
          setParsed(result);
          const baseName = file.name.replace(/\.csv$/i, '');
          setDatasetKey(baseName || 'ipl_dataset');
        }
      } catch (e) {
        console.error('Error parsing CSV:', e);
        setError('Could not parse CSV file. Please check the format.');
        setParsed({ headers: [], rows: [] });
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setParsed({ headers: [], rows: [] });
      setDatasetKey('');
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  const fetchDatasets = async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
          : null;

      if (!token) {
        setListError('Sign in as admin to view saved datasets.');
        setDatasets([]);
        setIsLoadingList(false);
        return;
      }

      const res = await fetch('/api/admin/datasets', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.datasets) {
        setListError(data?.error || 'Could not load dataset list.');
        setDatasets([]);
      } else {
        setDatasets(data.datasets as DatasetSummary[]);
        setListError(null);
      }
    } catch (e) {
      console.error('Load dataset list error:', e);
      setListError('Unexpected error while loading dataset list.');
      setDatasets([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSaveToKv = async () => {
    if (!parsed.headers.length || !parsed.rows.length) {
      setError('No data to save. Please upload and parse a CSV first.');
      return;
    }

    const key = datasetKey.trim();
    if (!key) {
      setError('Please enter a dataset key before saving.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
          : null;

      if (!token) {
        setError('Admin session expired. Please sign in again.');
        setIsSaving(false);
        return;
      }

      const res = await fetch('/api/admin/datasets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          datasetKey: key,
          headers: parsed.headers,
          rows: parsed.rows,
          meta: {
            sourceFile: fileName || null,
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || 'Failed to save dataset to KV.');
      } else {
        setSaveMessage(
          `Saved dataset '${data.datasetKey}' with ${data.rowCount ?? parsed.rows.length} rows to KV.`,
        );
        fetchDatasets();
      }
    } catch (e) {
      console.error('Save dataset error:', e);
      setError('Unexpected error while saving dataset.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-ipl-dark text-white">
      <AdminSidebar currentPage="/ipl-admin-2026/datasets" />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Data Lab: CSV Upload</h1>
              <p className="text-sm text-gray-400 mt-1">
                Upload an IPL CSV file and preview it instantly in a table. Nothing is saved yet — this is a
                safe, local preview.
              </p>
            </div>
            {saveMessage && (
              <div className="mb-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg p-2 text-[11px] text-emerald-200">
                {saveMessage}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-[#111827] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-3">Upload CSV</h2>
              <p className="text-xs text-gray-400 mb-4">
                Recommended: exported IPL fixtures or results CSV with a header row.
              </p>

              <label className="block w-full border border-dashed border-gray-500/60 rounded-xl p-6 text-center cursor-pointer hover:border-ipl-gold/80 hover:bg-white/5 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ipl-gold/10 border border-ipl-gold/40 flex items-center justify-center text-ipl-gold">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4m0 0l-4 4m4-4v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Click to choose a .csv file</p>
                    <p className="text-xs text-gray-400 mt-1">We parse it directly in your browser.</p>
                  </div>
                  {fileName && (
                    <p className="text-xs text-gray-300 mt-2">
                      Selected file: <span className="font-mono text-ipl-gold">{fileName}</span>
                    </p>
                  )}
                </div>
              </label>

              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/40 rounded-lg p-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              {isParsing && (
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-300">
                  <span className="inline-flex h-3 w-3 animate-ping rounded-full bg-ipl-gold/70" />
                  Parsing CSV...
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="dataset-key">
                    Dataset key in KV
                  </label>
                  <input
                    id="dataset-key"
                    type="text"
                    value={datasetKey}
                    onChange={(e) => setDatasetKey(e.target.value)}
                    placeholder="e.g. ipl_2025_matches"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                  />
                  <p className="mt-1 text-[10px] text-gray-500">
                    Saved under <span className="font-mono text-ipl-gold">dataset:&#123;key&#125;</span> in SPORTS_KV.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToKv}
                  disabled={isSaving || !parsed.headers.length || !parsed.rows.length}
                  className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg bg-ipl-gold text-black text-xs font-semibold hover:bg-ipl-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving…' : 'Save to Workers KV'}
                </button>
              </div>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 text-xs text-gray-300 space-y-2">
              <h2 className="text-sm font-semibold text-white mb-2">Tips</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>First row should contain column names (e.g. match_id, date, venue, team1, team2, stage).</li>
                <li>Keep cells simple — this viewer assumes values do not contain commas.</li>
                <li>
                  Use this page as a quick sanity check before wiring the data into your prediction models or
                  dashboards.
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-[#020617] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Preview</h2>
              <p className="text-[11px] text-gray-400">
                {parsed.rows.length > 0
                  ? `Showing ${parsed.rows.length} rows — first ${Math.min(parsed.rows.length, 200)} displayed`
                  : 'No data loaded yet'}
              </p>
            </div>

            <div className="overflow-auto max-h-[480px] border border-white/5 rounded-xl">
              {parsed.headers.length > 0 ? (
                <table className="min-w-full text-xs">
                  <thead className="bg-white/5 sticky top-0 z-10">
                    <tr>
                      {parsed.headers.map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2 text-left font-semibold text-gray-200 border-b border-white/10 whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parsed.rows.slice(0, 200).map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-black/10' : ''}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-3 py-1.5 text-gray-200 whitespace-nowrap max-w-xs truncate"
                            title={cell}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-10 text-center text-sm text-gray-500">
                  Upload a CSV to see a table preview here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
