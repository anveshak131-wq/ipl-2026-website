"use client";

import { useState, useEffect } from "react";
import ModernDialog from "@/components/admin/ModernDialog";

interface DatasetSummary {
  key: string;
  rowCount?: number;
  uploadedAt?: string;
  uploadedBy?: string;
}

interface DatasetMeta {
  [key: string]: unknown;
}

interface Dataset {
  key: string;
  headers: string[];
  rows: string[][];
  meta?: DatasetMeta;
}

export default function AdminDatasetManagerPage() {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoadingDataset, setIsLoadingDataset] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnError, setNewColumnError] = useState<string | null>(null);

  const loadDatasets = async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken") || localStorage.getItem("auth_token")
          : null;

      if (!token) {
        setListError("Sign in as admin to view datasets.");
        setDatasets([]);
        setIsLoadingList(false);
        return;
      }

      const res = await fetch("/api/admin/datasets", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.datasets) {
        setListError(data?.error || "Could not load dataset list.");
        setDatasets([]);
      } else {
        setDatasets(data.datasets as DatasetSummary[]);
        setListError(null);
      }
    } catch (e) {
      console.error("Load dataset list error:", e);
      setListError("Unexpected error while loading dataset list.");
      setDatasets([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadDataset = async (key: string) => {
    setSelectedKey(key);
    setDataset(null);
    setIsLoadingDataset(true);
    setError(null);
    setSuccessMessage(null);
    setIsDirty(false);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken") || localStorage.getItem("auth_token")
          : null;

      if (!token) {
        setError("Admin session expired. Please sign in again.");
        setIsLoadingDataset(false);
        return;
      }

      const res = await fetch(`/api/admin/datasets?key=${encodeURIComponent(key)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.dataset) {
        setError(data?.error || "Could not load dataset.");
        setDataset(null);
      } else {
        const loaded = data.dataset as Dataset;
        if (!Array.isArray(loaded.headers) || !Array.isArray(loaded.rows)) {
          setError("Dataset format is invalid.");
          setDataset(null);
        } else {
          setDataset({
            key: loaded.key || key,
            headers: loaded.headers,
            rows: loaded.rows,
            meta: loaded.meta,
          });
        }
      }
    } catch (e) {
      console.error("Load dataset error:", e);
      setError("Unexpected error while loading dataset.");
      setDataset(null);
    } finally {
      setIsLoadingDataset(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setDataset((current) => {
      if (!current) return current;
      const nextRows = current.rows.map((row, r) => {
        if (r !== rowIndex) return row;
        return row.map((cell, c) => (c === colIndex ? value : cell));
      });
      return { ...current, rows: nextRows };
    });
    setIsDirty(true);
  };

  const handleAddRow = () => {
    setDataset((current) => {
      if (!current) return current;
      const newRow = Array.from({ length: current.headers.length }, () => "");
      return { ...current, rows: [...current.rows, newRow] };
    });
    setIsDirty(true);
  };

  const handleAddColumn = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setDataset((current) => {
      if (!current) return current;
      const newHeaders = [...current.headers, trimmed];
      const newRows = current.rows.map((row) => [...row, ""]);
      return { ...current, headers: newHeaders, rows: newRows };
    });
    setIsDirty(true);
  };

  const openAddColumnDialog = () => {
    if (!dataset) return;
    setNewColumnName("");
    setNewColumnError(null);
    setIsAddColumnDialogOpen(true);
  };

  const closeAddColumnDialog = () => {
    setIsAddColumnDialogOpen(false);
    setNewColumnError(null);
  };

  const confirmAddColumnDialog = () => {
    const trimmed = newColumnName.trim();

    if (!trimmed) {
      setNewColumnError("Please enter a column name.");
      return;
    }

    if (dataset && dataset.headers.includes(trimmed)) {
      setNewColumnError("A column with this name already exists.");
      return;
    }

    handleAddColumn(trimmed);
    setIsAddColumnDialogOpen(false);
  };

  const handleDeleteRow = (rowIndex: number) => {
    setDataset((current) => {
      if (!current) return current;
      const nextRows = current.rows.filter((_, idx) => idx !== rowIndex);
      return { ...current, rows: nextRows };
    });
    setIsDirty(true);
  };

  const handleSaveChanges = async () => {
    if (!dataset) return;
    if (!dataset.headers.length) {
      setError("Dataset has no headers and cannot be saved.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken") || localStorage.getItem("auth_token")
          : null;

      if (!token) {
        setError("Admin session expired. Please sign in again.");
        setIsSaving(false);
        return;
      }

      const res = await fetch("/api/admin/datasets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          datasetKey: dataset.key,
          headers: dataset.headers,
          rows: dataset.rows,
          meta: dataset.meta || {},
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || "Failed to save dataset.");
      } else {
        setSuccessMessage(
          `Saved changes to '${dataset.key}' with ${data.rowCount ?? dataset.rows.length} rows.`,
        );
        setIsDirty(false);
        loadDatasets();
      }
    } catch (e) {
      console.error("Save dataset error:", e);
      setError("Unexpected error while saving dataset.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDataset = async () => {
    if (!selectedKey) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete dataset '${selectedKey}' from KV? This cannot be undone.`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken") || localStorage.getItem("auth_token")
          : null;

      if (!token) {
        setError("Admin session expired. Please sign in again.");
        setIsDeleting(false);
        return;
      }

      const res = await fetch(`/api/admin/datasets?key=${encodeURIComponent(selectedKey)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || "Failed to delete dataset.");
      } else {
        setSuccessMessage(`Deleted dataset '${selectedKey}'.`);
        setDataset(null);
        setSelectedKey(null);
        setIsDirty(false);
        loadDatasets();
      }
    } catch (e) {
      console.error("Delete dataset error:", e);
      setError("Unexpected error while deleting dataset.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-ipl-dark text-white">
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Data Lab: Manage Datasets</h1>
              <p className="text-sm text-gray-400 mt-1">
                View, edit, and clean the CSV datasets you have already saved into Workers KV.
              </p>
            </div>
            {successMessage && (
              <div className="mb-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg p-2 text-[11px] text-emerald-200">
                {successMessage}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 text-xs text-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Saved Datasets</h2>
                <button
                  type="button"
                  onClick={loadDatasets}
                  disabled={isLoadingList}
                  className="px-2 py-1 rounded-md bg-black/40 border border-white/10 text-[11px] hover:bg-white/5 disabled:opacity-50"
                >
                  {isLoadingList ? "Refreshing" : "Refresh"}
                </button>
              </div>

              {listError && (
                <div className="mb-3 bg-red-500/10 border border-red-500/40 rounded-md p-2 text-[11px] text-red-300">
                  {listError}
                </div>
              )}

              {datasets.length === 0 && !listError && (
                <p className="text-[11px] text-gray-400">
                  No datasets found. Save one from the CSV upload page.
                </p>
              )}

              <div className="space-y-1 max-h-[360px] overflow-auto mt-2">
                {datasets.map((d) => {
                  const isActive = selectedKey === d.key;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => loadDataset(d.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-[11px] transition-colors border ${
                        isActive
                          ? "bg-ipl-gold/10 border-ipl-gold/60 text-ipl-gold"
                          : "bg-black/30 border-white/5 text-gray-200 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-semibold truncate">{d.key}</div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {d.rowCount != null ? `${d.rowCount} rows` : "Row count unknown"}
                          {d.uploadedAt && ` • ${new Date(d.uploadedAt).toLocaleString()}`}
                        </div>
                      </div>
                      <span className="ml-2 text-[10px] text-gray-400">Edit</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#020617] border border-white/10 rounded-2xl p-4 text-xs text-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">Dataset Editor</h2>
                  <p className="text-[11px] text-gray-400">
                    {selectedKey
                      ? `Editing dataset '${selectedKey}'.`
                      : "Select a dataset on the left to start editing."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openAddColumnDialog}
                    disabled={!dataset || isSaving || isDeleting}
                    className="px-3 py-1.5 rounded-md bg-slate-700 text-gray-100 text-[11px] font-semibold hover:bg-slate-600 disabled:opacity-50"
                  >
                    Add column
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    disabled={!dataset || isSaving || isDeleting}
                    className="px-3 py-1.5 rounded-md bg-ipl-gold text-black text-[11px] font-semibold hover:bg-ipl-gold/90 disabled:opacity-50"
                  >
                    Add row
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={!dataset || isSaving || !isDirty}
                    className="px-3 py-1.5 rounded-md bg-emerald-500 text-black text-[11px] font-semibold hover:bg-emerald-500/90 disabled:opacity-50"
                  >
                    {isSaving ? "Saving" : isDirty ? "Save changes" : "Saved"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteDataset}
                    disabled={!selectedKey || isDeleting}
                    className="px-3 py-1.5 rounded-md bg-red-500/20 text-red-300 text-[11px] font-semibold border border-red-500/40 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting" : "Delete dataset"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-3 bg-red-500/10 border border-red-500/40 rounded-md p-2 text-[11px] text-red-300">
                  {error}
                </div>
              )}

              {isLoadingDataset && (
                <div className="mb-3 flex items-center gap-2 text-[11px] text-gray-300">
                  <span className="inline-flex h-3 w-3 animate-ping rounded-full bg-ipl-gold/70" />
                  Loading dataset...
                </div>
              )}

              {!dataset && !isLoadingDataset && (
                <div className="py-12 text-center text-sm text-gray-500">
                  Select a dataset from the left to view and edit its rows.
                </div>
              )}

              {dataset && (
                <div className="overflow-auto max-h-[520px] border border-white/5 rounded-xl mt-2">
                  <table className="min-w-full text-[11px]">
                    <thead className="bg-white/5 sticky top-0 z-10">
                      <tr>
                        {dataset.headers.map((header) => (
                          <th
                            key={header}
                            className="px-3 py-2 text-left font-semibold text-gray-200 border-b border-white/10 whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-left font-semibold text-gray-200 border-b border-white/10 whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dataset.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-black/10" : ""}>
                          {dataset.headers.map((_, colIndex) => (
                            <td
                              key={colIndex}
                              className="px-3 py-1.5 text-gray-200 whitespace-nowrap min-w-[120px]"
                            >
                              <input
                                type="text"
                                value={row[colIndex] ?? ""}
                                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                className="w-full px-2 py-1 rounded-md bg-black/40 border border-white/10 text-[11px] text-gray-100 placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                              />
                            </td>
                          ))}
                          <td className="px-3 py-1.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(rowIndex)}
                              className="px-2 py-1 rounded-md bg-red-500/10 text-red-300 border border-red-500/40 hover:bg-red-500/20 text-[11px]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ModernDialog
        isOpen={isAddColumnDialogOpen}
        onClose={closeAddColumnDialog}
        title="Add new column"
        description="Give this column a clear, machine-friendly name you can reuse in models and charts."
        variant="info"
        size="sm"
        icon="➕"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeAddColumnDialog}
              className="px-4 py-2 rounded-lg text-sm text-gray-200 bg-transparent border border-white/10 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmAddColumnDialog}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              Add column
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-gray-300 mb-2"
              htmlFor="dataset-manager-new-column-name"
            >
              Column name
            </label>
            <input
              id="dataset-manager-new-column-name"
              type="text"
              value={newColumnName}
              onChange={(e) => {
                setNewColumnName(e.target.value);
                if (newColumnError) setNewColumnError(null);
              }}
              placeholder="e.g. win_probability, venue_alt, phase"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {newColumnError && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/40 rounded-lg px-4 py-3">
              {newColumnError}
            </div>
          )}
        </div>
      </ModernDialog>
    </div>
  );
}
