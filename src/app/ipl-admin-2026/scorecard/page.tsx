"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/data";

/*
  IPL Scorecard Admin - Robust draft persistence:
  - Save Draft: ALWAYS writes to localStorage first (sync), then tries API (async)
  - Load: Checks localStorage first; prefers local draft over remote when local is newer
  - Auto-save to localStorage on edits (debounced)
  - Prevents data loss on refresh regardless of API auth/status
*/

interface Match {
  id: string;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
  venue?: string;
  date?: string;
  time?: string;
}

type AnyObj = Record<string, unknown>;

const DRAFT_KEY_PREFIX = "ipl_scorecard_draft_";
const SELECTED_MATCH_KEY = "selectedIPLMatch";

function getDraftKey(matchId: string): string {
  return `${DRAFT_KEY_PREFIX}${matchId}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function getApiBase(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function parseUpdatedAt(obj: AnyObj | null): number {
  if (!obj?.updatedAt) return 0;
  const t = new Date(obj.updatedAt as string).getTime();
  return isNaN(t) ? 0 : t;
}

export default function ScorecardAdminPage(): JSX.Element {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<AnyObj[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch matches + players on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ms = await api.getMatches("ipl");
        if (!cancelled) setMatches(ms || []);
      } catch {
        if (!cancelled) setMatches([]);
      }
      try {
        const ps = await api.getPlayers(undefined, "ipl");
        if (!cancelled) setPlayers(ps || []);
      } catch {
        if (!cancelled) setPlayers([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Determine active match when matches load
  useEffect(() => {
    if (matches.length === 0) return;

    try {
      const url = new URL(window.location.href);
      const param = url.searchParams.get("matchId");
      if (param) {
        setSelectedMatchId(param);
        localStorage.setItem(SELECTED_MATCH_KEY, JSON.stringify({ id: param }));
        return;
      }
    } catch {
      /* ignore */
    }

    const saved = localStorage.getItem(SELECTED_MATCH_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { id?: string };
        if (parsed?.id && matches.some((m) => m.id === parsed.id)) {
          setSelectedMatchId(parsed.id);
          return;
        }
      } catch {
        /* ignore */
      }
    }

    setSelectedMatchId(matches[0].id);
    localStorage.setItem(SELECTED_MATCH_KEY, JSON.stringify(matches[0]));
  }, [matches]);

  // Persist selected match when user changes it
  useEffect(() => {
    if (!selectedMatchId) return;
    const match = matches.find((m) => m.id === selectedMatchId);
    try {
      if (match) localStorage.setItem(SELECTED_MATCH_KEY, JSON.stringify(match));
    } catch {
      /* ignore */
    }
  }, [selectedMatchId, matches]);

  // Load scorecard: prefer localStorage draft when newer; merge with remote intelligently
  useEffect(() => {
    if (!selectedMatchId) return;
    let mounted = true;
    const draftKey = getDraftKey(selectedMatchId);
    const match = matches.find((m) => m.id === selectedMatchId);

    const createEmptyScorecard = (): AnyObj => ({
      matchId: selectedMatchId,
      league: "ipl",
      matchInfo: match
        ? {
            team1: match.team1,
            team2: match.team2,
            venue: match.venue || "",
            date: match.date || "",
            time: match.time || "",
            toss: { winner: "", decision: "" },
          }
        : {
            team1: { id: "", name: "" },
            team2: { id: "", name: "" },
            venue: "",
            date: "",
            time: "",
            toss: { winner: "", decision: "" },
          },
      innings: [
        {
          inningsNumber: 1,
          battingTeamId: match ? parseInt(match.team1.id, 10) : 0,
          batting: [],
          bowling: [],
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
        },
        {
          inningsNumber: 2,
          battingTeamId: match ? parseInt(match.team2.id, 10) : 0,
          batting: [],
          bowling: [],
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
        },
      ],
      draft: true,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });

    (async () => {
      setLoading(true);
      setMessage("");

      // 1. Read local draft first (sync)
      let localDraft: AnyObj | null = null;
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw) as AnyObj;
          if (parsed && typeof parsed.matchId === "string") localDraft = parsed;
        }
      } catch {
        /* ignore parse errors */
      }

      // 2. Fetch remote
      let remoteScorecard: AnyObj | null = null;
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/api/scorecards?matchId=${encodeURIComponent(selectedMatchId)}`);
        if (!mounted) return;
        if (res.ok) {
          const json = (await res.json()) as unknown;
          if (Array.isArray(json) && json.length > 0) remoteScorecard = json[0] as AnyObj;
        }
      } catch {
        /* fallback to local only */
      }

      if (!mounted) return;

      // 3. Decide which to use: prefer local when newer; otherwise remote; otherwise create new
      const localTime = parseUpdatedAt(localDraft);
      const remoteTime = parseUpdatedAt(remoteScorecard);

      if (localDraft && localTime >= remoteTime) {
        // Local draft is newer or same; keep local (do not overwrite with stale remote)
        setScorecard(localDraft);
      } else if (remoteScorecard) {
        // Remote is newer or local absent
        setScorecard(remoteScorecard);
        // Optionally clear local draft to avoid confusion (remote is source of truth)
        try {
          localStorage.removeItem(draftKey);
        } catch {
          /* ignore */
        }
      } else if (localDraft) {
        setScorecard(localDraft);
      } else {
        setScorecard(createEmptyScorecard());
      }

      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [selectedMatchId, matches]);

  // Auto-save draft to localStorage (debounced)
  useEffect(() => {
    if (!scorecard || typeof scorecard.matchId !== "string") return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(getDraftKey(scorecard.matchId as string), JSON.stringify(scorecard));
      } catch {
        /* ignore */
      }
      autoSaveTimer.current = null;
    }, 1000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [scorecard]);

  const handleSelectMatch = useCallback((id: string) => {
    setSelectedMatchId(id);
  }, []);

  const updateField = useCallback(
    (path: string, value: unknown) => {
      if (!scorecard) return;
      const parts = path.split(".");
      const updated = JSON.parse(JSON.stringify(scorecard)) as AnyObj;
      let cur: AnyObj = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
        cur = cur[p] as AnyObj;
      }
      cur[parts[parts.length - 1] as string] = value;
      (updated as Record<string, unknown>).updatedAt = nowISO();
      setScorecard(updated);
    },
    [scorecard]
  );

  const handleSave = useCallback(async () => {
    if (!scorecard) return;
    setSaving(true);
    setMessage("");

    const matchId = scorecard.matchId as string;
    const draftKey = getDraftKey(matchId);

    // CRITICAL: Always persist to localStorage FIRST (sync) - guarantees no data loss on refresh
    try {
      localStorage.setItem(draftKey, JSON.stringify(scorecard));
    } catch {
      setMessage("✗ Could not save draft locally");
      setSaving(false);
      return;
    }

    // Then try API (optional - for server backup)
    const token = localStorage.getItem("adminToken");
    const base = getApiBase();
    const endpoint = scorecard.id ? `/api/scorecards/${scorecard.id}` : "/api/scorecards";
    const method = scorecard.id ? "PUT" : "POST";

    try {
      const res = await fetch(`${base}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(scorecard),
      });

      if (res.ok) {
        const saved = (await res.json()) as AnyObj;
        if (saved?.matchId) {
          try {
            localStorage.setItem(getDraftKey(saved.matchId as string), JSON.stringify(saved));
          } catch {
            /* ignore */
          }
          setScorecard(saved);
        }
        setMessage("✓ Saved to server and local");
      } else {
        setMessage("✓ Saved to local (server unavailable - data persists on refresh)");
      }
    } catch {
      setMessage("✓ Saved to local (server unavailable - data persists on refresh)");
    }

    setTimeout(() => setMessage(""), 2500);
    setSaving(false);
  }, [scorecard]);

  const handlePublish = useCallback(async () => {
    if (!scorecard?.id) {
      setMessage("No saved scorecard to publish. Save Draft first.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setMessage("✗ Admin login required to publish");
        setSaving(false);
        return;
      }
      const base = getApiBase();
      const res = await fetch(`${base}/api/scorecards/${scorecard.id}/publish`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Publish failed: ${res.status}`);
      const pub = (await res.json()) as AnyObj;
      if (pub?.matchId) {
        try {
          localStorage.removeItem(getDraftKey(pub.matchId as string));
        } catch {
          /* ignore */
        }
        setScorecard(pub);
        setMessage("✓ Published");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(`✗ Publish failed: ${msg}`);
    }
    setTimeout(() => setMessage(""), 2500);
    setSaving(false);
  }, [scorecard]);

  const handleClearLocalDraft = useCallback(() => {
    if (!selectedMatchId) return;
    try {
      localStorage.removeItem(getDraftKey(selectedMatchId));
      setMessage("Local draft cleared");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      /* ignore */
    }
  }, [selectedMatchId]);

  const currentMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) ?? null,
    [matches, selectedMatchId]
  );

  if (loading && !scorecard) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">IPL Scorecard Admin</h1>
      {message && (
        <div className="mb-4 p-3 rounded bg-white/10 text-sm">{message}</div>
      )}

      <div className="mb-4">
        <label className="block mb-1">Select Match</label>
        <select
          value={selectedMatchId ?? ""}
          onChange={(e) => handleSelectMatch(e.target.value)}
          className="p-2 rounded text-black"
        >
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.team1.name} vs {m.team2.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-1">Venue</label>
        <input
          value={(scorecard?.matchInfo as AnyObj)?.venue ?? ""}
          onChange={(e) => updateField("matchInfo.venue", e.target.value)}
          className="p-2 rounded text-black w-full max-w-md"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Toss Winner</label>
        <select
          value={(scorecard?.matchInfo as AnyObj)?.toss && typeof (scorecard.matchInfo as AnyObj).toss === "object"
            ? ((scorecard.matchInfo as AnyObj).toss as AnyObj).winner ?? ""
            : ""}
          onChange={(e) => updateField("matchInfo.toss.winner", e.target.value)}
          className="p-2 rounded text-black"
        >
          <option value="">(select)</option>
          {currentMatch && (
            <>
              <option value={currentMatch.team1.name}>{currentMatch.team1.name}</option>
              <option value={currentMatch.team2.name}>{currentMatch.team2.name}</option>
            </>
          )}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-1">Toss Decision</label>
        <select
          value={(scorecard?.matchInfo as AnyObj)?.toss && typeof (scorecard.matchInfo as AnyObj).toss === "object"
            ? ((scorecard.matchInfo as AnyObj).toss as AnyObj).decision ?? ""
            : ""}
          onChange={(e) => updateField("matchInfo.toss.decision", e.target.value)}
          className="p-2 rounded text-black"
        >
          <option value="">(select)</option>
          <option value="bat">Bat</option>
          <option value="bowl">Bowl</option>
        </select>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={handlePublish}
          disabled={saving || !scorecard?.id}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
        >
          Publish
        </button>
        <button
          onClick={handleClearLocalDraft}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
        >
          Clear Local Draft
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-300">
        <div>
          Match: {currentMatch ? `${currentMatch.team1.name} vs ${currentMatch.team2.name}` : selectedMatchId ?? "-"}
        </div>
        <div>Scorecard id: {scorecard?.id ?? "(unsaved)"}</div>
        <div>Draft key: {selectedMatchId ? getDraftKey(selectedMatchId) : "-"}</div>
      </div>
    </div>
  );
}
