'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModernDialog from '@/components/admin/ModernDialog';
import { CustomEmoji } from '@/components/emoji/Emoji';

interface UploadSummary {
  totalParsed: number;
  added: number;
  skipped: number;
}

interface UploadResult {
  success: boolean;
  summary: UploadSummary & { existingPreserved?: number };
  added: any[] | Array<{ name: string; team?: string; role?: string }>;
  skipped: string[] | Array<{ name: string; reason?: string }>;
  error?: string;
  details?: string;
}

export default function UploadPlayersCSV() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/ops/ipl');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    setSelectedFile(file);
    setUploadResult(null);
    
    // Read and preview file
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n');
      if (lines.length < 2) return;
      
      const headerLine = lines[0].toLowerCase();
      const is2025Format = headerLine.includes('type') && headerLine.includes('sold');
      
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        if (is2025Format) {
          // 2025 format: Players, Team, Type, Base, Sold
          return {
            Player: values[0] || '',
            Team: values[1] || '',
            Type: values[2] || '',
            Base: values[3] || '',
            Sold: values[4] || ''
          };
        } else {
          // 2026 format: Player, Team, Price_Cr, Role, Category, Nationality
          return {
            Player: values[0] || '',
            Team: values[1] || '',
            Role: values[2] || '',
            Price_Cr: values[3] || '',
            Category: values[4] || '',
            Nationality: values[5] || ''
          };
        }
      });
      setPreviewData(preview);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Admin session expired. Please log in again.');
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/upload-players-csv', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result: UploadResult = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setUploadResult({
        success: false,
        summary: { totalParsed: 0, added: 0, skipped: 0 },
        added: [],
        skipped: [],
        error: error.message || 'Failed to upload CSV file',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <div className="flex-1">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
              Upload Players CSV
            </h1>
            <p className="text-gray-400 text-lg">
              Upload IPL player data from CSV file. New players will be added; existing players (by name) will be skipped.
            </p>
          </div>

          {/* Upload Section */}
          <div className="admin-card mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Select CSV File</h2>
              <p className="text-gray-400 text-sm">
                Expected format: Player, Team, Price_Cr, Role, Category, Nationality
              </p>
            </div>

            {/* File Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-ipl-gold bg-ipl-gold/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all"
                    >
                      Change File
                    </button>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                    >
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg mb-2">
                      Drag and drop your CSV file here
                    </p>
                    <p className="text-gray-400 text-sm mb-4">or</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="admin-btn-primary"
                    >
                      Browse Files
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Table */}
            {showPreview && previewData.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <h3 className="text-lg font-semibold text-white mb-4">CSV Preview (First 5 rows)</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-white/5">
                      {previewData[0]?.Type ? (
                        // 2025 format
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Player</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Team</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Base</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sold</th>
                        </>
                      ) : (
                        // 2026 format
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Player</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Team</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price (Cr)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nationality</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        {row.Type ? (
                          // 2025 format
                          <>
                            <td className="px-4 py-3 text-sm text-gray-300">{row.Player}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{row.Team || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{row.Type}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{row.Base}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{row.Sold}</td>
                          </>
                        ) : (
                          // 2026 format
                          <>
                            <td className="px-4 py-3 text-sm text-gray-300">{row.Player}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{row.Team}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{row.Role}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{row.Price_Cr}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{row.Category}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{row.Nationality}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Upload Button */}
            {selectedFile && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="admin-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload CSV
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Results Section */}
          {uploadResult && (
            <div className={`admin-card ${uploadResult.success ? 'border-green-500/30' : 'border-red-500/30'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  uploadResult.success ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {uploadResult.success ? (
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-4 ${
                    uploadResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                  </h3>

                      {uploadResult.success && uploadResult.summary && (
                    <div className="space-y-4">
                      <div className={`grid gap-4 ${uploadResult.summary.existingPreserved ? 'grid-cols-4' : 'grid-cols-3'}`}>
                        <div className="admin-glass p-4 rounded-lg">
                          <p className="text-gray-400 text-sm mb-1">Total Parsed</p>
                          <p className="text-2xl font-bold text-white">{uploadResult.summary.totalParsed}</p>
                        </div>
                        <div className="admin-glass p-4 rounded-lg border-green-500/30">
                          <p className="text-green-400 text-sm mb-1">Added</p>
                          <p className="text-2xl font-bold text-green-400">{uploadResult.summary.added}</p>
                        </div>
                        <div className="admin-glass p-4 rounded-lg border-yellow-500/30">
                          <p className="text-yellow-400 text-sm mb-1">Skipped (Duplicates)</p>
                          <p className="text-2xl font-bold text-yellow-400">{uploadResult.summary.skipped}</p>
                        </div>
                        {uploadResult.summary.existingPreserved !== undefined && (
                          <div className="admin-glass p-4 rounded-lg border-blue-500/30">
                            <p className="text-blue-400 text-sm mb-1">Existing Preserved</p>
                            <p className="text-2xl font-bold text-blue-400">{uploadResult.summary.existingPreserved}</p>
                          </div>
                        )}
                      </div>

                      {uploadResult.skipped && uploadResult.skipped.length > 0 && (
                        <div className="mt-4">
                          <p className="text-gray-400 text-sm mb-2">Skipped Players:</p>
                          <div className="max-h-48 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                              {uploadResult.skipped.map((item, idx) => {
                                const name = typeof item === 'string' ? item : item.name;
                                const reason = typeof item === 'object' ? item.reason : 'Duplicate';
                                return (
                                  <span key={idx} className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm" title={reason}>
                                    {name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {uploadResult.added && uploadResult.added.length > 0 && (
                        <div className="mt-4">
                          <p className="text-gray-400 text-sm mb-2">New Players Added:</p>
                          <div className="max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {uploadResult.added.map((player, idx) => {
                                const name = typeof player === 'string' ? player : player.name;
                                const team = typeof player === 'object' ? player.team : '';
                                const role = typeof player === 'object' ? player.role : '';
                                return (
                                  <div key={idx} className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <p className="text-white text-sm font-medium">{name}</p>
                                    {team && role && (
                                      <p className="text-gray-400 text-xs">{role} • {team}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!uploadResult.success && (
                    <div className="space-y-2">
                      <p className="text-red-300">{uploadResult.error}</p>
                      {uploadResult.details && (
                        <p className="text-gray-400 text-sm">{uploadResult.details}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => router.push('/ops/ipl/players')}
                      className="admin-btn-primary"
                    >
                      View Players
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all"
                    >
                      Upload Another File
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="admin-card mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">CSV Format Requirements</h3>
            <div className="space-y-3 text-gray-400 text-sm">
              <div className="flex items-start gap-2">
                <CustomEmoji type="check" size={16} />
                <p><strong className="text-white">2026 Format:</strong> <code className="text-gray-300">Player, Team, Price_Cr, Role, Category, Nationality</code></p>
              </div>
              <div className="flex items-start gap-2">
                <CustomEmoji type="check" size={16} />
                <p><strong className="text-white">2025 Format:</strong> <code className="text-gray-300">Players, Team, Type, Base, Sold</code></p>
              </div>
              <div className="flex items-start gap-2">
                <CustomEmoji type="check" size={16} />
                <p>Team abbreviations: RCB, MI, SRH, GT, PBKS, DC, LSG, RR, KKR, CSK</p>
              </div>
              <div className="flex items-start gap-2">
                <CustomEmoji type="check" size={16} />
                <p>2026 Roles: Batter, WK-Batter, Bowler, All-Rounder</p>
              </div>
              <div className="flex items-start gap-2">
                <CustomEmoji type="check" size={16} />
                <p>2025 Types: BAT, BOWL, AR, WK</p>
              </div>
              <div className="flex items-start gap-2">
                <CustomEmoji type="warning" size={16} />
                <p><strong className="text-yellow-400">Important:</strong> Players without teams (marked as "-" or empty) will be automatically skipped</p>
              </div>
              <div className="flex items-start gap-2">
                <CustomEmoji type="info" size={16} />
                <p>Players with matching names (case-insensitive) will be skipped to prevent duplicates</p>
              </div>
              <div className="flex items-start gap-2">
                <CustomEmoji type="info" size={16} />
                <p><strong className="text-blue-400">Data Protection:</strong> All existing players (including 2026 players) are preserved and never modified</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

