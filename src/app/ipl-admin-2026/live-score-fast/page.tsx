'use client';

import { useMemo, useState } from 'react';
import { Activity, ChevronRight, Minus, Plus, RefreshCw, Undo2 } from 'lucide-react';

const WICKET_TYPES = [
  'Bowled',
  'Caught',
  'LBW',
  'Run Out',
  'Stumped',
  'Hit Wicket',
  'Caught & Bowled',
  'Obstructing the Field',
  'Hit the Ball Twice',
  'Retired Hurt',
  'Retired Out',
  'Timed Out',
  'Mankad (Run out at non-striker end)',
];

const NON_DELIVERY_WICKET_TYPES = new Set([
  'Mankad (Run out at non-striker end)',
  'Timed Out',
  'Retired Hurt',
  'Retired Out',
]);

const PLAYERS = [
  { id: 't1-p1', name: 'Faf du Plessis', team: 'RCB' },
  { id: 't1-p2', name: 'Virat Kohli', team: 'RCB' },
  { id: 't1-p3', name: 'Glenn Maxwell', team: 'RCB' },
  { id: 't1-p4', name: 'Rajat Patidar', team: 'RCB' },
  { id: 't1-p5', name: 'Cameron Green', team: 'RCB' },
  { id: 't1-p6', name: 'Mohammed Siraj', team: 'RCB' },
  { id: 't2-p1', name: 'Ruturaj Gaikwad', team: 'CSK' },
  { id: 't2-p2', name: 'Devon Conway', team: 'CSK' },
  { id: 't2-p3', name: 'Ravindra Jadeja', team: 'CSK' },
  { id: 't2-p4', name: 'MS Dhoni', team: 'CSK' },
  { id: 't2-p5', name: 'Deepak Chahar', team: 'CSK' },
  { id: 't2-p6', name: 'Matheesha Pathirana', team: 'CSK' },
];

type ExtrasRow = {
  hasWide: boolean;
  wideExtraRuns: number;
  hasNoBall: boolean;
  hasByes: boolean;
  byesRuns: number;
  hasLB: boolean;
  lbRuns: number;
};

type WicketRow = {
  hasWicket: boolean;
  wicketType: string;
  wicketTaker: string;
  wicketAssistant: string;
  outBatter: 'striker' | 'nonStriker';
};

type BallRow = {
  id: string;
  over: string;
  ball: string;
  innings: '1' | '2';
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  extras: ExtrasRow;
  wicket: WicketRow;
  notes: string;
};

const DEFAULT_EXTRAS: ExtrasRow = {
  hasWide: false,
  wideExtraRuns: 0,
  hasNoBall: false,
  hasByes: false,
  byesRuns: 0,
  hasLB: false,
  lbRuns: 0,
};

const DEFAULT_WICKET: WicketRow = {
  hasWicket: false,
  wicketType: '',
  wicketTaker: '',
  wicketAssistant: '',
  outBatter: 'striker',
};

function isLegalDelivery(extras: ExtrasRow, wicket: WicketRow) {
  if (extras.hasWide || extras.hasNoBall) return false;
  if (wicket.hasWicket && NON_DELIVERY_WICKET_TYPES.has(wicket.wicketType)) return false;
  return true;
}

function findPlayerName(id: string) {
  return PLAYERS.find((p) => p.id === id)?.name || '';
}

export default function LiveScoreFastTestPage() {
  const [innings, setInnings] = useState<'1' | '2'>('1');
  const [strikerId, setStrikerId] = useState('t1-p1');
  const [nonStrikerId, setNonStrikerId] = useState('t1-p2');
  const [bowlerId, setBowlerId] = useState('t2-p5');
  const [rows, setRows] = useState<BallRow[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [pendingRuns, setPendingRuns] = useState(0);
  const [pendingExtras, setPendingExtras] = useState<ExtrasRow>({ ...DEFAULT_EXTRAS });
  const [pendingWicket, setPendingWicket] = useState<WicketRow>({ ...DEFAULT_WICKET });
  const [pendingNotes, setPendingNotes] = useState('');

  const legalBalls = useMemo(() => {
    return rows
      .filter((row) => row.innings === innings)
      .filter((row) => isLegalDelivery(row.extras, row.wicket)).length;
  }, [rows, innings]);

  const nextBall = useMemo(() => {
    const over = Math.floor(legalBalls / 6);
    const ball = (legalBalls % 6) + 1;
    return { over: String(over), ball: String(ball) };
  }, [legalBalls]);

  const recentBalls = useMemo(() => {
    return rows.slice(-6).reverse();
  }, [rows]);

  const addRow = (data: Partial<BallRow>) => {
    const row: BallRow = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      over: data.over || nextBall.over,
      ball: data.ball || nextBall.ball,
      innings: data.innings || innings,
      strikerId: data.strikerId || strikerId,
      nonStrikerId: data.nonStrikerId || nonStrikerId,
      bowlerId: data.bowlerId || bowlerId,
      runs: data.runs ?? 0,
      extras: data.extras || { ...DEFAULT_EXTRAS },
      wicket: data.wicket || { ...DEFAULT_WICKET },
      notes: data.notes || '',
    };
    setRows((prev) => [...prev, row]);
  };

  const quickAddRuns = (runs: number) => {
    addRow({ runs, extras: { ...DEFAULT_EXTRAS }, wicket: { ...DEFAULT_WICKET } });
  };

  const addSpecialBall = () => {
    addRow({
      runs: pendingRuns,
      extras: { ...pendingExtras },
      wicket: { ...pendingWicket },
      notes: pendingNotes,
    });
    setPendingRuns(0);
    setPendingExtras({ ...DEFAULT_EXTRAS });
    setPendingWicket({ ...DEFAULT_WICKET });
    setPendingNotes('');
  };

  const undoLast = () => {
    setRows((prev) => prev.slice(0, -1));
  };

  const swapStrike = () => {
    setStrikerId((prev) => {
      setNonStrikerId(prev);
      return nonStrikerId;
    });
  };

  const editRow = editingIndex !== null ? rows[editingIndex] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <Activity className="h-7 w-7 text-purple-300" />
          <div>
            <h1 className="text-3xl font-semibold">Live Score Fast Test</h1>
            <p className="text-sm text-white/60">
              Manual per-ball scoring prototype with a fast scorer bar + full wicket/extras options.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2.1fr,1fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div>
                  <div className="text-xs uppercase text-white/40">Innings</div>
                  <div className="mt-2 flex items-center gap-2">
                    {(['1', '2'] as const).map((val) => (
                      <button
                        key={val}
                        onClick={() => setInnings(val)}
                        className={`rounded-full px-4 py-1 text-sm ${
                          innings === val ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-white/40">Striker</div>
                  <select
                    value={strikerId}
                    onChange={(e) => setStrikerId(e.target.value)}
                    className="mt-2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {PLAYERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.team})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs uppercase text-white/40">Non-Striker</div>
                  <select
                    value={nonStrikerId}
                    onChange={(e) => setNonStrikerId(e.target.value)}
                    className="mt-2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {PLAYERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.team})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs uppercase text-white/40">Bowler</div>
                  <select
                    value={bowlerId}
                    onChange={(e) => setBowlerId(e.target.value)}
                    className="mt-2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                  >
                    {PLAYERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.team})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={swapStrike}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm"
                >
                  <RefreshCw className="h-4 w-4" /> Swap Strike
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase text-white/40">Scorer Bar</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 6].map((run) => (
                        <button
                          key={run}
                          onClick={() => quickAddRuns(run)}
                          className="h-10 w-10 rounded-xl bg-white/10 text-sm font-semibold text-white hover:bg-purple-600"
                        >
                          {run}
                        </button>
                      ))}
                      <button
                        onClick={() => setPendingWicket((prev) => ({ ...prev, hasWicket: !prev.hasWicket }))}
                        className={`h-10 rounded-xl px-4 text-sm font-semibold ${
                          pendingWicket.hasWicket ? 'bg-red-500' : 'bg-white/10'
                        }`}
                      >
                        W
                      </button>
                      <button
                        onClick={() => setPendingExtras((prev) => ({ ...prev, hasWide: !prev.hasWide }))}
                        className={`h-10 rounded-xl px-4 text-sm font-semibold ${
                          pendingExtras.hasWide ? 'bg-amber-500' : 'bg-white/10'
                        }`}
                      >
                        WD
                      </button>
                      <button
                        onClick={() => setPendingExtras((prev) => ({ ...prev, hasNoBall: !prev.hasNoBall }))}
                        className={`h-10 rounded-xl px-4 text-sm font-semibold ${
                          pendingExtras.hasNoBall ? 'bg-amber-500' : 'bg-white/10'
                        }`}
                      >
                        NB
                      </button>
                      <button
                        onClick={() => setPendingExtras((prev) => ({ ...prev, hasByes: !prev.hasByes }))}
                        className={`h-10 rounded-xl px-4 text-sm font-semibold ${
                          pendingExtras.hasByes ? 'bg-sky-500' : 'bg-white/10'
                        }`}
                      >
                        B
                      </button>
                      <button
                        onClick={() => setPendingExtras((prev) => ({ ...prev, hasLB: !prev.hasLB }))}
                        className={`h-10 rounded-xl px-4 text-sm font-semibold ${
                          pendingExtras.hasLB ? 'bg-sky-500' : 'bg-white/10'
                        }`}
                      >
                        LB
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={undoLast}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm"
                  >
                    <Undo2 className="h-4 w-4" /> Undo Last
                  </button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,1fr,1.4fr]">
                  <div>
                    <div className="text-xs uppercase text-white/40">Runs</div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setPendingRuns(Math.max(0, pendingRuns - 1))}
                        className="rounded-lg border border-white/10 bg-white/5 px-2"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="rounded-lg border border-white/10 bg-slate-950 px-4 py-2 text-sm">
                        {pendingRuns}
                      </div>
                      <button
                        onClick={() => setPendingRuns(Math.min(6, pendingRuns + 1))}
                        className="rounded-lg border border-white/10 bg-white/5 px-2"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-white/50">Use this when adding WD/NB/B/LB or wicket balls.</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-white/40">Extras Detail</div>
                    <div className="mt-2 space-y-2 text-xs">
                      {pendingExtras.hasWide && (
                        <label className="flex items-center justify-between gap-2">
                          Wide extra runs
                          <select
                            value={pendingExtras.wideExtraRuns}
                            onChange={(e) =>
                              setPendingExtras((prev) => ({ ...prev, wideExtraRuns: Number(e.target.value) }))
                            }
                            className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1"
                          >
                            {[0, 1, 2, 3, 4].map((v) => (
                              <option key={v} value={v}>
                                +{v}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {pendingExtras.hasByes && (
                        <label className="flex items-center justify-between gap-2">
                          Byes runs
                          <select
                            value={pendingExtras.byesRuns}
                            onChange={(e) => setPendingExtras((prev) => ({ ...prev, byesRuns: Number(e.target.value) }))}
                            className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1"
                          >
                            {[0, 1, 2, 3, 4, 5, 6].map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {pendingExtras.hasLB && (
                        <label className="flex items-center justify-between gap-2">
                          Leg-byes runs
                          <select
                            value={pendingExtras.lbRuns}
                            onChange={(e) => setPendingExtras((prev) => ({ ...prev, lbRuns: Number(e.target.value) }))}
                            className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1"
                          >
                            {[0, 1, 2, 3, 4, 5, 6].map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-white/40">Wicket Detail</div>
                    <div className="mt-2 grid gap-2 text-xs">
                      {pendingWicket.hasWicket && (
                        <>
                          <select
                            value={pendingWicket.wicketType}
                            onChange={(e) => setPendingWicket((prev) => ({ ...prev, wicketType: e.target.value }))}
                            className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1"
                          >
                            <option value="">Wicket type...</option>
                            {WICKET_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <select
                            value={pendingWicket.outBatter}
                            onChange={(e) =>
                              setPendingWicket((prev) => ({
                                ...prev,
                                outBatter: e.target.value as 'striker' | 'nonStriker',
                              }))
                            }
                            className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1"
                          >
                            <option value="striker">Out: Striker</option>
                            <option value="nonStriker">Out: Non-striker</option>
                          </select>
                          <select
                            value={pendingWicket.wicketTaker}
                            onChange={(e) => setPendingWicket((prev) => ({ ...prev, wicketTaker: e.target.value }))}
                            className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1"
                          >
                            <option value="">Wicket taker...</option>
                            {PLAYERS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.team})
                              </option>
                            ))}
                          </select>
                          <select
                            value={pendingWicket.wicketAssistant}
                            onChange={(e) =>
                              setPendingWicket((prev) => ({ ...prev, wicketAssistant: e.target.value }))
                            }
                            className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1"
                          >
                            <option value="">Assistant (optional)</option>
                            {PLAYERS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.team})
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <input
                    value={pendingNotes}
                    onChange={(e) => setPendingNotes(e.target.value)}
                    placeholder="Notes"
                    className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={addSpecialBall}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold"
                  >
                    <ChevronRight className="h-4 w-4" /> Add Ball
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold">Ball-by-ball table</div>
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-sm">
                  <thead className="bg-white/5 text-xs uppercase text-white/50">
                    <tr>
                      {['Over', 'Ball', 'Inn', 'Striker', 'Non-Striker', 'Bowler', 'Runs', 'Wide', 'NB', 'Byes', 'LB', 'Wicket', 'Notes', ''].map(
                        (h) => (
                          <th key={h} className="px-3 py-3 text-left">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.id} className="border-t border-white/10">
                        <td className="px-3 py-2">{row.over}</td>
                        <td className="px-3 py-2">{row.ball}</td>
                        <td className="px-3 py-2">{row.innings}</td>
                        <td className="px-3 py-2">{findPlayerName(row.strikerId)}</td>
                        <td className="px-3 py-2">{findPlayerName(row.nonStrikerId)}</td>
                        <td className="px-3 py-2">{findPlayerName(row.bowlerId)}</td>
                        <td className="px-3 py-2">{row.runs}</td>
                        <td className="px-3 py-2">{row.extras.hasWide ? `+${row.extras.wideExtraRuns}` : '-'}</td>
                        <td className="px-3 py-2">{row.extras.hasNoBall ? 'NB' : '-'}</td>
                        <td className="px-3 py-2">{row.extras.hasByes ? row.extras.byesRuns : '-'}</td>
                        <td className="px-3 py-2">{row.extras.hasLB ? row.extras.lbRuns : '-'}</td>
                        <td className="px-3 py-2">{row.wicket.hasWicket ? row.wicket.wicketType || 'W' : '-'}</td>
                        <td className="px-3 py-2">{row.notes || '-'}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setEditingIndex(idx)}
                            className="rounded-lg border border-white/10 px-2 py-1 text-xs"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!rows.length && (
                      <tr>
                        <td colSpan={14} className="px-4 py-8 text-center text-sm text-white/50">
                          No balls yet. Use the scorer bar to add deliveries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Current ball</div>
              <div className="mt-3 grid gap-2 text-sm text-white/70">
                <div>Next: {nextBall.over}.{nextBall.ball}</div>
                <div>Striker: {findPlayerName(strikerId)}</div>
                <div>Non-striker: {findPlayerName(nonStrikerId)}</div>
                <div>Bowler: {findPlayerName(bowlerId)}</div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Recent balls</div>
              <div className="mt-3 space-y-2">
                {recentBalls.map((row) => (
                  <div key={row.id} className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>
                        {row.over}.{row.ball} · {row.innings}
                      </span>
                      <span className="text-white/60">{row.runs} runs</span>
                    </div>
                    <div className="text-white/50">
                      {findPlayerName(row.strikerId)} / {findPlayerName(row.bowlerId)}
                    </div>
                  </div>
                ))}
                {!recentBalls.length && <div className="text-xs text-white/40">No balls yet.</div>}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {editRow && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setEditingIndex(null)} />
          <div className="w-full max-w-lg overflow-y-auto bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ball details</h2>
              <button
                onClick={() => setEditingIndex(null)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-white/60">
                  Over
                  <input
                    value={editRow.over}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r, i) => (i === editingIndex ? { ...r, over: e.target.value } : r)))
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2"
                  />
                </label>
                <label className="text-xs text-white/60">
                  Ball
                  <input
                    value={editRow.ball}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r, i) => (i === editingIndex ? { ...r, ball: e.target.value } : r)))
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2"
                  />
                </label>
              </div>

              <label className="text-xs text-white/60">
                Runs
                <input
                  value={editRow.runs}
                  type="number"
                  min={0}
                  max={6}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r, i) => (i === editingIndex ? { ...r, runs: Number(e.target.value) } : r))
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2"
                />
              </label>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold text-white/70">Extras</div>
                <div className="mt-3 grid gap-3">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={editRow.extras.hasWide}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === editingIndex ? { ...r, extras: { ...r.extras, hasWide: e.target.checked } } : r
                          )
                        )
                      }
                    />
                    Wide
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={editRow.extras.hasNoBall}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === editingIndex ? { ...r, extras: { ...r.extras, hasNoBall: e.target.checked } } : r
                          )
                        )
                      }
                    />
                    No-ball (+1)
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={editRow.extras.hasByes}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === editingIndex ? { ...r, extras: { ...r.extras, hasByes: e.target.checked } } : r
                          )
                        )
                      }
                    />
                    Byes
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={editRow.extras.hasLB}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === editingIndex ? { ...r, extras: { ...r.extras, hasLB: e.target.checked } } : r
                          )
                        )
                      }
                    />
                    Leg byes
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold text-white/70">Wicket</div>
                <div className="mt-3 grid gap-3">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={editRow.wicket.hasWicket}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === editingIndex ? { ...r, wicket: { ...r.wicket, hasWicket: e.target.checked } } : r
                          )
                        )
                      }
                    />
                    Wicket
                  </label>
                  <select
                    value={editRow.wicket.wicketType}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === editingIndex ? { ...r, wicket: { ...r.wicket, wicketType: e.target.value } } : r
                        )
                      )
                    }
                    className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="">Type...</option>
                    {WICKET_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editRow.wicket.outBatter}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === editingIndex
                            ? {
                                ...r,
                                wicket: { ...r.wicket, outBatter: e.target.value as 'striker' | 'nonStriker' },
                              }
                            : r
                        )
                      )
                    }
                    className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="striker">Out: Striker</option>
                    <option value="nonStriker">Out: Non-striker</option>
                  </select>
                  <select
                    value={editRow.wicket.wicketTaker}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === editingIndex ? { ...r, wicket: { ...r.wicket, wicketTaker: e.target.value } } : r
                        )
                      )
                    }
                    className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="">Wicket taker...</option>
                    {PLAYERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.team})
                      </option>
                    ))}
                  </select>
                  <select
                    value={editRow.wicket.wicketAssistant}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === editingIndex ? { ...r, wicket: { ...r.wicket, wicketAssistant: e.target.value } } : r
                        )
                      )
                    }
                    className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="">Assistant (optional)</option>
                    {PLAYERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.team})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="text-xs text-white/60">
                Notes
                <input
                  value={editRow.notes}
                  onChange={(e) =>
                    setRows((prev) => prev.map((r, i) => (i === editingIndex ? { ...r, notes: e.target.value } : r)))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
