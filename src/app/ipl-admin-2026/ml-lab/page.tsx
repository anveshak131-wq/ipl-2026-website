'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface DatasetSummary {
  key: string;
  rowCount?: number;
  uploadedAt?: string;
  uploadedBy?: string;
}

interface AlgorithmOption {
  id: string;
  name: string;
  family: string;
  description: string;
  idealFor: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
}

const ALGORITHMS: AlgorithmOption[] = [
  {
    id: 'logistic_regression',
    name: 'Logistic Regression',
    family: 'Classification',
    description: 'Baseline model for predicting binary outcomes like match winner (Team A vs Team B).',
    idealFor: 'Tabular match-level features, quick baselines, interpretable coefficients.',
    complexity: 'Beginner',
  },
  {
    id: 'random_forest',
    name: 'Random Forest',
    family: 'Ensemble Trees',
    description: 'Non-linear tree ensemble that can capture interactions between features.',
    idealFor: 'Rich tabular data where feature interactions matter, robust baselines.',
    complexity: 'Intermediate',
  },
  {
    id: 'gradient_boosted_trees',
    name: 'Gradient Boosted Trees',
    family: 'Ensemble Trees',
    description: 'Boosted trees (XGBoost-style) well-suited for structured match & player stats.',
    idealFor: 'High-performance tabular models for win probability or score prediction.',
    complexity: 'Intermediate',
  },
  {
    id: 'simple_neural_net',
    name: 'Simple Neural Network',
    family: 'Neural Networks',
    description: 'Fully-connected network for learning non-linear relationships in match data.',
    idealFor: 'When you want to experiment beyond tree models on normalized features.',
    complexity: 'Advanced',
  },
  {
    id: 'time_series_baseline',
    name: 'Time-series Baseline',
    family: 'Time Series',
    description: 'Rolling-average style baseline for over/under runs, form, or streak metrics.',
    idealFor: 'Score forecasting and trend-based features across multiple matches.',
    complexity: 'Intermediate',
  },
];

export default function AdminMlLabPage() {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [datasetsError, setDatasetsError] = useState<string | null>(null);
  const [selectedDatasetKeys, setSelectedDatasetKeys] = useState<string[]>([]);
  const [selectedAlgorithmId, setSelectedAlgorithmId] = useState<string | null>(null);
  const [datasetHeaders, setDatasetHeaders] = useState<string[]>([]);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [targetColumn, setTargetColumn] = useState<string | null>(null);
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [trainingMetrics, setTrainingMetrics] = useState<{
    numSamples: number;
    numFeatures: number;
    numClasses: number;
    trainAccuracy: number;
  } | null>(null);

  const loadDatasets = async () => {
    setIsLoadingDatasets(true);
    setDatasetsError(null);

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
          : null;

      if (!token) {
        setDatasetsError('Sign in as admin to view datasets.');
        setDatasets([]);
        setIsLoadingDatasets(false);
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
        setDatasetsError(data?.error || 'Could not load dataset list.');
        setDatasets([]);
      } else {
        setDatasets(data.datasets as DatasetSummary[]);
        setDatasetsError(null);
      }
    } catch (e) {
      console.error('Load dataset list error (ML Lab):', e);
      setDatasetsError('Unexpected error while loading dataset list.');
      setDatasets([]);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const primaryDatasetKey = selectedDatasetKeys.length > 0 ? selectedDatasetKeys[0] : null;

  useEffect(() => {
    const loadSchema = async () => {
      if (!primaryDatasetKey) {
        setDatasetHeaders([]);
        setTargetColumn(null);
        setFeatureColumns([]);
        setSchemaError(null);
        return;
      }

      setIsLoadingSchema(true);
      setSchemaError(null);

      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
            : null;

        if (!token) {
          setSchemaError('Sign in as admin to view dataset structure.');
          setDatasetHeaders([]);
          setFeatureColumns([]);
          setIsLoadingSchema(false);
          return;
        }

        const res = await fetch(`/api/admin/datasets?key=${encodeURIComponent(primaryDatasetKey)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.dataset || !Array.isArray(data.dataset.headers)) {
          setSchemaError(data?.error || 'Could not load dataset headers.');
          setDatasetHeaders([]);
          setFeatureColumns([]);
        } else {
          const headers = data.dataset.headers as string[];
          setDatasetHeaders(headers);

          let resolvedTarget: string | null = null;
          if (targetColumn && headers.includes(targetColumn)) {
            resolvedTarget = targetColumn;
          } else if (headers.includes('toss_winner')) {
            resolvedTarget = 'toss_winner';
          }

          setTargetColumn(resolvedTarget);

          const defaultFeatures = headers.filter((h) => h !== resolvedTarget);
          setFeatureColumns((prev) => {
            const validPrev = prev.filter((h) => headers.includes(h) && h !== resolvedTarget);
            return validPrev.length > 0 ? validPrev : defaultFeatures;
          });
        }
      } catch (e) {
        console.error('Load dataset schema error (ML Lab):', e);
        setSchemaError('Unexpected error while loading dataset columns.');
        setDatasetHeaders([]);
        setFeatureColumns([]);
      } finally {
        setIsLoadingSchema(false);
      }
    
    return undefined;};

    loadSchema();
  }, [primaryDatasetKey, targetColumn]);

  const selectedAlgorithm =
    selectedAlgorithmId != null
      ? ALGORITHMS.find((alg) => alg.id === selectedAlgorithmId) || null
      : null;

  const hasSelectedDatasets = selectedDatasetKeys.length > 0;

  const canContinue =
    !!selectedAlgorithm && hasSelectedDatasets && !!targetColumn && featureColumns.length > 0;

  const handleTrainModel = async () => {
    if (!canContinue || !selectedAlgorithm || !targetColumn || selectedDatasetKeys.length === 0)
      return;

    setIsTraining(true);
    setTrainingError(null);
    setTrainingMetrics(null);

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
          : null;

      if (!token) {
        setTrainingError('Admin session expired. Please sign in again.');
        setIsTraining(false);
        return;
      }

      const res = await fetch('/api/admin/ml/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          datasetKeys: selectedDatasetKeys,
          targetColumn,
          featureColumns,
          algorithmId: selectedAlgorithm.id,
          hyperparams: {},
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setTrainingError(data?.error || 'Failed to train model.');
      } else {
        setTrainingMetrics({
          numSamples: data.numSamples,
          numFeatures: data.numFeatures,
          numClasses: data.numClasses,
          trainAccuracy: data.metrics?.trainAccuracy ?? 0,
        });
      }
    } catch (e) {
      console.error('Train model error (ML Lab):', e);
      setTrainingError('Unexpected error while training model.');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-ipl-dark text-white">
      <AdminSidebar currentPage="/ipl-admin-2026/ml-lab" />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">ML Lab: Models</h1>
              <p className="text-sm text-gray-400 mt-1">
                Choose one or more datasets from Data Lab and an algorithm you want to train. Then
                configure target &amp; features and run lightweight experiments directly from this admin
                page.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 text-xs text-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">1. Pick a dataset</h2>
                <button
                  type="button"
                  onClick={loadDatasets}
                  disabled={isLoadingDatasets}
                  className="px-2 py-1 rounded-md bg-black/40 border border-white/10 text-[11px] hover:bg-white/5 disabled:opacity-50"
                >
                  {isLoadingDatasets ? 'Refreshing' : 'Refresh'}
                </button>
              </div>

              {datasetsError && (
                <div className="mb-3 bg-red-500/10 border border-red-500/40 rounded-md p-2 text-[11px] text-red-300">
                  {datasetsError}
                </div>
              )}

              {datasets.length === 0 && !datasetsError && (
                <p className="text-[11px] text-gray-400">
                  No datasets found. Save one from the CSV Data Lab first.
                </p>
              )}

              <div className="space-y-1 max-h-[360px] overflow-auto mt-2">
                {datasets.map((d) => {
                  const isActive = selectedDatasetKeys.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() =>
                        setSelectedDatasetKeys((prev) =>
                          prev.includes(d.key)
                            ? prev.filter((key) => key !== d.key)
                            : [...prev, d.key],
                        )
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-[11px] transition-colors border ${
                        isActive
                          ? 'bg-ipl-gold/10 border-ipl-gold/60 text-ipl-gold'
                          : 'bg-black/30 border-white/5 text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-semibold truncate">{d.key}</div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {d.rowCount != null ? `${d.rowCount} rows` : 'Row count unknown'}
                          {d.uploadedAt && ` • ${new Date(d.uploadedAt).toLocaleString()}`}
                        </div>
                      </div>
                      {isActive && (
                        <span className="ml-2 text-[10px] text-ipl-gold">Selected</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#020617] border border-white/10 rounded-2xl p-4 text-xs text-gray-200">
              <h2 className="text-sm font-semibold text-white mb-3">2. Choose an algorithm</h2>
              <p className="text-[11px] text-gray-400 mb-3">
                Start with a simple baseline, or jump straight to ensembles / neural nets. We&apos;ll use your
                choice to design the training & inference flow.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ALGORITHMS.map((alg) => {
                  const isActive = selectedAlgorithmId === alg.id;
                  return (
                    <button
                      key={alg.id}
                      type="button"
                      onClick={() => setSelectedAlgorithmId(alg.id)}
                      className={`text-left rounded-xl border px-3 py-3 text-xs transition-colors ${
                        isActive
                          ? 'border-ipl-gold/70 bg-ipl-gold/10 text-ipl-gold'
                          : 'border-white/10 bg-black/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-white">{alg.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
                          {alg.family}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 mb-1.5">{alg.description}</p>
                      <p className="text-[10px] text-gray-400">
                        <span className="font-semibold text-gray-300">Ideal for:</span> {alg.idealFor}
                      </p>
                      <div className="mt-1.5 text-[10px] text-gray-400">
                        Complexity: <span className="text-gray-200">{alg.complexity}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-3 flex flex-col gap-2 text-[11px] text-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">Selection summary</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      canContinue ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    {canContinue
                      ? 'Config ready (dataset + algorithm + target + features)'
                      : 'Pick dataset, algorithm, target, and features'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <div className="text-[10px] text-gray-400">Dataset</div>
                    <div className="text-[11px] text-gray-100 truncate">
                      {selectedDatasetKeys.length === 0
                        ? 'None selected'
                        : selectedDatasetKeys.length === 1
                        ? selectedDatasetKeys[0]
                        : `${selectedDatasetKeys[0]} + ${selectedDatasetKeys.length - 1} more`}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Algorithm</div>
                    <div className="text-[11px] text-gray-100 truncate">
                      {selectedAlgorithm ? selectedAlgorithm.name : 'None selected'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Target & features</div>
                    <div className="text-[11px] text-gray-100 truncate">
                      {targetColumn || 'No target selected'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Features: {featureColumns.length > 0 ? featureColumns.length : '0'}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400">
                  When you&apos;re happy with the selection, use the Training controls below to run a small
                  experiment directly from this admin page.
                </p>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-[11px] text-gray-200 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">4. Train model</h3>
                    <p className="text-[10px] text-gray-400">
                      Runs a lightweight training loop inside a Cloudflare Worker using your selected
                      dataset, target, features, and algorithm.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTrainModel}
                    disabled={!canContinue || isTraining}
                    className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-ipl-gold text-black hover:bg-ipl-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTraining ? 'Training…' : 'Train model'}
                  </button>
                </div>

                {trainingError && (
                  <div className="mt-1 bg-red-500/10 border border-red-500/40 rounded-md px-3 py-2 text-[11px] text-red-300">
                    {trainingError}
                  </div>
                )}

                {trainingMetrics && !trainingError && (
                  <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-gray-300">
                    <div>
                      <div className="text-gray-400">Samples used</div>
                      <div className="text-gray-100 font-semibold">{trainingMetrics.numSamples}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Features</div>
                      <div className="text-gray-100 font-semibold">{trainingMetrics.numFeatures}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Classes</div>
                      <div className="text-gray-100 font-semibold">{trainingMetrics.numClasses}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Train accuracy</div>
                      <div className="text-gray-100 font-semibold">
                        {(trainingMetrics.trainAccuracy * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-3 text-[11px] text-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">3. Select target and features</h3>
                    <p className="text-[10px] text-gray-400">
                      Choose one column as the target label (e.g. <code>toss_winner</code>) and mark the
                      input feature columns you want the model to learn from.
                    </p>
                  </div>
                </div>

                {!primaryDatasetKey && (
                  <div className="text-[11px] text-gray-400">
                    Pick a dataset in step 1 to see its columns here.
                  </div>
                )}

                {primaryDatasetKey && isLoadingSchema && (
                  <div className="flex items-center gap-2 text-[11px] text-gray-300">
                    <span className="inline-flex h-3 w-3 animate-ping rounded-full bg-ipl-gold/70" />
                    Loading columns for <span className="font-mono text-ipl-gold">{primaryDatasetKey}</span>
                    ...
                  </div>
                )}

                {primaryDatasetKey && schemaError && !isLoadingSchema && (
                  <div className="mt-2 bg-red-500/10 border border-red-500/40 rounded-md px-3 py-2 text-[11px] text-red-300">
                    {schemaError}
                  </div>
                )}

                {primaryDatasetKey && !isLoadingSchema && !schemaError && datasetHeaders.length === 0 && (
                  <div className="text-[11px] text-gray-400">
                    No headers found for this dataset. Make sure it was uploaded with a header row.
                  </div>
                )}

                {primaryDatasetKey && !isLoadingSchema && !schemaError && datasetHeaders.length > 0 && (
                  <div className="mt-2 max-h-64 overflow-auto border border-white/5 rounded-lg divide-y divide-white/5">
                    {datasetHeaders.map((header) => {
                      const isTarget = targetColumn === header;
                      const isFeature = featureColumns.includes(header);
                      return (
                        <div
                          key={header}
                          className="flex items-center justify-between gap-2 px-3 py-1.5 bg-black/20 hover:bg-white/5"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] text-gray-100 truncate">{header}</div>
                          </div>
                          <div className="flex items-center gap-3 text-[10px]">
                            <label className="inline-flex items-center gap-1">
                              <input
                                type="radio"
                                name="target-column"
                                checked={isTarget}
                                onChange={() => {
                                  setTargetColumn(header);
                                  setFeatureColumns((prev) => {
                                    const withoutNewTarget = prev.filter((h) => h !== header);
                                    if (withoutNewTarget.length > 0) return withoutNewTarget;
                                    return datasetHeaders.filter((h) => h !== header);
                                  });
                                }}
                                className="h-3 w-3 accent-ipl-gold"
                              />
                              <span className="text-gray-300">Target</span>
                            </label>
                            <label className="inline-flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={isFeature}
                                disabled={isTarget}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFeatureColumns((prev) => {
                                    if (checked) {
                                      if (prev.includes(header)) return prev;
                                      return [...prev, header];
                                    }
                                    return prev.filter((h) => h !== header);
                                  });
                                }}
                                className="h-3 w-3 accent-ipl-gold"
                              />
                              <span className="text-gray-300">Feature</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
