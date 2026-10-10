'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Save, 
  Lock, 
  RefreshCw,
  Radio
} from 'lucide-react';

interface DeliveryRecord {
  id: string;
  overNumber: number;
  ballNumber: number;
  displayLabel: string;
  runsBat: number;
  extras: number;
  extraType: 'WD' | 'NB' | 'B' | 'LB' | null;
  isWicket: boolean;
  wicketType: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | null;
  isDeadBall: boolean;
  striker: string;
  bowler: string;
}

export interface BallOverridePayload {
  matchId: string;
  deliveryId: string;
  overIndex: number;
  ballIndex: number;
  runsBat: number;
  extras: number;
  extraType?: 'WD' | 'NB' | 'B' | 'LB' | null;
  isWicket: boolean;
  wicketType?: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | null;
  isDeadBall?: boolean;
  overrideReason: string;
}

const INITIAL_OVER: DeliveryRecord[] = [
  { id: 'del_19_1', overNumber: 19, ballNumber: 1, displayLabel: '18.1', runsBat: 0, extras: 0, extraType: null, isWicket: false, wicketType: null, isDeadBall: false, striker: 'Shafali Verma', bowler: 'Renuka Singh' },
  { id: 'del_19_2', overNumber: 19, ballNumber: 2, displayLabel: '18.2', runsBat: 4, extras: 0, extraType: null, isWicket: false, wicketType: null, isDeadBall: false, striker: 'Shafali Verma', bowler: 'Renuka Singh' },
  { id: 'del_19_3', overNumber: 19, ballNumber: 3, displayLabel: '18.3', runsBat: 0, extras: 1, extraType: 'WD', isWicket: false, wicketType: null, isDeadBall: false, striker: 'Shafali Verma', bowler: 'Renuka Singh' },
  { id: 'del_19_4', overNumber: 19, ballNumber: 3, displayLabel: '18.3', runsBat: 0, extras: 0, extraType: null, isWicket: true, wicketType: 'lbw', isDeadBall: false, striker: 'Shafali Verma', bowler: 'Renuka Singh' },
  { id: 'del_19_5', overNumber: 19, ballNumber: 4, displayLabel: '18.4', runsBat: 1, extras: 0, extraType: null, isWicket: false, wicketType: null, isDeadBall: false, striker: 'Jemimah Rodrigues', bowler: 'Renuka Singh' },
  { id: 'del_19_6', overNumber: 19, ballNumber: 5, displayLabel: '18.5', runsBat: 6, extras: 0, extraType: null, isWicket: false, wicketType: null, isDeadBall: false, striker: 'Meg Lanning', bowler: 'Renuka Singh' },
];

export default function WPLLiveScoreAdminPage() {
  const matchId = 'WPL-2026-M14';

  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(INITIAL_OVER);
  const [selectedBall, setSelectedBall] = useState<DeliveryRecord | null>(INITIAL_OVER[3]);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [editRuns, setEditRuns] = useState<number>(0);
  const [editExtraType, setEditExtraType] = useState<'WD' | 'NB' | 'B' | 'LB' | null>(null);
  const [editExtras, setEditExtras] = useState<number>(0);
  const [editIsWicket, setEditIsWicket] = useState<boolean>(false);
  const [editWicketType, setEditWicketType] = useState<any>('caught');
  const [editIsDeadBall, setEditIsDeadBall] = useState<boolean>(false);

  const selectBallForEdit = (ball: DeliveryRecord) => {
    setSelectedBall(ball);
    setEditRuns(ball.runsBat);
    setEditExtraType(ball.extraType);
    setEditExtras(ball.extras);
    setEditIsWicket(ball.isWicket);
    setEditWicketType(ball.wicketType || 'caught');
    setEditIsDeadBall(ball.isDeadBall);
    setOverrideReason('');
    setStatusMessage(null);
  };

  const handleApplyOverride = async () => {
    if (!selectedBall) return;
    if (!overrideReason.trim()) {
      setStatusMessage('Error: You must provide an audit reason for manual override.');
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const payload: BallOverridePayload = {
      matchId,
      deliveryId: selectedBall.id,
      overIndex: selectedBall.overNumber,
      ballIndex: selectedBall.ballNumber,
      runsBat: editRuns,
      extras: editExtraType ? (editExtras > 0 ? editExtras : 1) : 0,
      extraType: editExtraType,
      isWicket: editIsWicket,
      wicketType: editIsWicket ? editWicketType : null,
      isDeadBall: editIsDeadBall,
      overrideReason: overrideReason.trim(),
    };

    try {
      // Simulate client-side update (can be swapped with your REST / API route fetch)
      await new Promise((resolve) => setTimeout(resolve, 500));

      setDeliveries((prev) =>
        prev.map((b) =>
          b.id === selectedBall.id
            ? {
                ...b,
                runsBat: payload.runsBat,
                extras: payload.extras,
                extraType: payload.extraType || null,
                isWicket: payload.isWicket,
                wicketType: payload.wicketType || null,
                isDeadBall: !!payload.isDeadBall,
              }
            : b
        )
      );

      setStatusMessage('Override logged & cache invalidated successfully.');
    } catch (err: any) {
      setStatusMessage(`Failed to apply override: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full text-slate-100 p-6 font-sans">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide uppercase">
              WPL Live Scoring & Match Scorer Console
            </h1>
            <p className="text-xs text-slate-400">
              Match: <span className="text-slate-200 font-semibold">{matchId}</span> (RCB-W vs DC-W) • Admin Restricted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Scorer Feed Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Over 19 Delivery Strip
              </span>
              <span className="text-xs text-slate-400 font-mono">Bowler: Renuka Singh</span>
            </div>

            <div className="flex gap-3">
              {deliveries.map((b) => {
                const isSelected = selectedBall?.id === b.id;
                let badgeClass = 'bg-slate-800 text-slate-200 border-slate-700';

                if (b.isDeadBall) {
                  badgeClass = 'bg-slate-800 text-slate-500 line-through border-slate-700';
                } else if (b.isWicket) {
                  badgeClass = 'bg-rose-600 text-white border-rose-500 shadow-sm';
                } else if (b.extraType) {
                  badgeClass = 'bg-amber-500 text-slate-950 font-bold border-amber-400';
                } else if (b.runsBat >= 4) {
                  badgeClass = 'bg-emerald-600 text-white font-bold border-emerald-500';
                }

                return (
                  <button
                    key={b.id}
                    onClick={() => selectBallForEdit(b)}
                    className={`flex-1 h-14 rounded-lg border flex flex-col items-center justify-center transition-all ${badgeClass} ${
                      isSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950' : 'hover:scale-105'
                    }`}
                  >
                    <span className="text-sm font-black">
                      {b.isDeadBall ? 'DB' : b.isWicket ? 'W' : b.extraType ? `${b.extras}${b.extraType}` : b.runsBat}
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">{b.displayLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Ball-By-Ball Audit Ledger
              </span>
              <span className="text-xs text-slate-500">Live CDN Stream</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                  <th className="py-2.5 px-4 font-medium">Ball</th>
                  <th className="py-2.5 px-4 font-medium">Batter</th>
                  <th className="py-2.5 px-4 font-medium">Runs</th>
                  <th className="py-2.5 px-4 font-medium">Extras</th>
                  <th className="py-2.5 px-4 font-medium">Dismissal</th>
                  <th className="py-2.5 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {deliveries.map((b) => (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-800/40 transition cursor-pointer ${
                      selectedBall?.id === b.id ? 'bg-indigo-950/20' : ''
                    }`}
                    onClick={() => selectBallForEdit(b)}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-300">{b.displayLabel}</td>
                    <td className="py-3 px-4 text-slate-300">{b.striker}</td>
                    <td className="py-3 px-4 font-bold">{b.runsBat}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {b.extraType ? `${b.extras} (${b.extraType})` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {b.isWicket ? (
                        <span className="text-rose-400 font-semibold">{b.wicketType?.toUpperCase()}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-indigo-400 hover:underline">Select</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-5">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Delivery Override
                </h2>
                <p className="text-xs text-slate-400">Selected: {selectedBall?.displayLabel}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 mb-2">Bat Runs</label>
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 6].map((run) => (
                  <button
                    key={run}
                    type="button"
                    onClick={() => {
                      setEditRuns(run);
                      setEditIsWicket(false);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      editRuns === run && !editIsWicket
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {run}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 mb-2">Extras</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'None', val: null },
                  { label: 'WD', val: 'WD' },
                  { label: 'NB', val: 'NB' },
                  { label: 'LB', val: 'LB' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setEditExtraType(item.val as any);
                      if (item.val && editExtras === 0) setEditExtras(1);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      editExtraType === item.val
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={editIsWicket}
                  onChange={(e) => setEditIsWicket(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-0"
                />
                <span className="text-xs font-bold text-rose-400">Wicket Dismissal</span>
              </label>

              {editIsWicket && (
                <select
                  value={editWicketType}
                  onChange={(e) => setEditWicketType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 mt-1"
                >
                  <option value="caught">Caught</option>
                  <option value="bowled">Bowled</option>
                  <option value="lbw">LBW</option>
                  <option value="run_out">Run Out</option>
                  <option value="stumped">Stumped</option>
                </select>
              )}
            </div>

            <div className="mb-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsDeadBall}
                  onChange={(e) => setEditIsDeadBall(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Mark as Dead Ball (Void legal count)</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Override Reason (Required)
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. DRS overturned LBW decision to Not Out"
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {statusMessage && (
              <div className={`p-2.5 rounded text-xs mb-4 ${
                statusMessage.startsWith('Error') 
                  ? 'bg-rose-950/60 border border-rose-800 text-rose-300' 
                  : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              }`}>
                {statusMessage}
              </div>
            )}
          </div>

          <button
            onClick={handleApplyOverride}
            disabled={isSaving}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Publish Live Scorecard
          </button>
        </div>
      </div>
    </div>
  );
}
