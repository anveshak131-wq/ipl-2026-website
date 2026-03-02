"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/data";

/*
  Rewritten Scorecard admin page (focused on robust draft persistence):
  - Load matches + players
  - Determine active match from: query param `?matchId=...` -> localStorage `selectedIPLMatch` -> first match
  - Load remote scorecard (attempt with/without auth) and fallback to local draft at
    key `ipl_scorecard_draft_{matchId}` if remote missing or fetch fails
  - Auto-persist local draft to `localStorage` on every change (debounced)
  - Save (POST/PUT) using fetch and include `Authorization: Bearer <adminToken>` when available
  - Publish endpoint clears local draft
*/

interface Match {
  id: string;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
  venue?: string;
  date?: string;
  time?: string;
}

type AnyObj = Record<string, any>;

const DRAFT_KEY_PREFIX = "ipl_scorecard_draft_";

function getDraftKey(matchId: string) {
  return `${DRAFT_KEY_PREFIX}${matchId}`;
}

function nowISO() {
  return new Date().toISOString();
}

export default function ScorecardAdminPage(): JSX.Element {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<AnyObj[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const autoSaveTimer = useRef<number | null>(null);

  // Fetch matches + players on mount
  useEffect(() => {
    (async () => {
      try {
        const ms = await api.getMatches("ipl");
        setMatches(ms || []);
      } catch (e) {
        console.error("Failed to load matches", e);
        setMatches([]);
      }

      try {
        const ps = await api.getPlayers(undefined, "ipl");
        setPlayers(ps || []);
      } catch (e) {
        console.error("Failed to load players", e);
        setPlayers([]);
      }

      setLoading(false);
    })();
  }, []);

  // Determine active match when matches list changes or on first load
  useEffect(() => {
    if (matches.length === 0) return;

    // priority: URL query param ?matchId= -> localStorage selectedIPLMatch -> first match
    try {
      const url = new URL(window.location.href);
      const param = url.searchParams.get("matchId");
      if (param) {
        setSelectedMatchId(param);
        localStorage.setItem("selectedIPLMatch", JSON.stringify({ id: param }));
        return;
      }
    } catch (e) {}

    const saved = localStorage.getItem("selectedIPLMatch");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          setSelectedMatchId(parsed.id);
          return;
        }
      } catch (e) {}
    }

    // fallback to first match in the list
    setSelectedMatchId(matches[0].id);
    localStorage.setItem("selectedIPLMatch", JSON.stringify(matches[0]));
  }, [matches]);

  // Load scorecard for selectedMatchId: try remote then local draft
  useEffect(() => {
    if (!selectedMatchId) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      setMessage("");
      try {
        // Attempt remote fetch (no auth). If API returns empty, we'll try local draft.
        const res = await fetch(`/api/scorecards?matchId=${encodeURIComponent(selectedMatchId)}`);
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json && Array.isArray(json) && json.length > 0) {
            setScorecard(json[0]);
            // remote is authoritative; remove local draft if present
            try { localStorage.removeItem(getDraftKey(selectedMatchId)); } catch (e) {}
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Remote scorecard fetch failed, will try local draft", e);
      }

      // Try local draft
      try {
        const draft = localStorage.getItem(getDraftKey(selectedMatchId));
        if (draft) {
          const parsed = JSON.parse(draft);
          setScorecard(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Failed to parse local draft", e);
      }

      // No remote or local draft -> initialize minimal new scorecard
      const match = matches.find((m) => m.id === selectedMatchId);
      setScorecard({
        matchId: selectedMatchId,
        league: "ipl",
        matchInfo: match
          ? { team1: match.team1, team2: match.team2, venue: match.venue || "", date: match.date || "", time: match.time || "", toss: { winner: "", decision: "" } }
          : { team1: { id: "", name: "" }, team2: { id: "", name: "" }, venue: "", date: "", time: "", toss: { winner: "", decision: "" } },
        innings: [
          { inningsNumber: 1, battingTeamId: match ? parseInt(match.team1.id) : 0, batting: [], bowling: [], extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 } },
          { inningsNumber: 2, battingTeamId: match ? parseInt(match.team2.id) : 0, batting: [], bowling: [], extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 } }
        ],
        draft: true,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      });
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [selectedMatchId]);

  // Persist selected match when it changes
  useEffect(() => {
    if (!selectedMatchId) return;
    const match = matches.find((m) => m.id === selectedMatchId);
    try {
      if (match) localStorage.setItem("selectedIPLMatch", JSON.stringify(match));
    } catch (e) {}
  }, [selectedMatchId, matches]);

  // Auto-save draft to localStorage (debounced) whenever scorecard changes
  useEffect(() => {
    if (!scorecard || !scorecard.matchId) return;
    if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current);
    // debounce 1s
    autoSaveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(getDraftKey(scorecard.matchId), JSON.stringify(scorecard));
        console.log("[IPL] Auto-saved draft", getDraftKey(scorecard.matchId));
      } catch (e) {
        console.error("[IPL] Failed to auto-save draft", e);
      }
      autoSaveTimer.current = null;
    }, 1000) as unknown as number;

    return () => {
      if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current);
    };
  }, [scorecard]);

  const handleSelectMatch = (id: string) => {
    setSelectedMatchId(id);
  };

  // Basic updater helper for nested fields using dot notation like "matchInfo.toss.winner"
  const updateField = (path: string, value: any) => {
    if (!scorecard) return;
    const parts = path.split(".");
    const updated = JSON.parse(JSON.stringify(scorecard));
    let cur: any = updated;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!cur[p]) cur[p] = {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
    updated.updatedAt = nowISO();
    setScorecard(updated);
  };

  const handleSave = async () => {
    if (!scorecard) return;
    setSaving(true);
    setMessage("");
    try {
      const token = localStorage.getItem("adminToken");
      const endpoint = scorecard.id ? `/api/scorecards/${scorecard.id}` : "/api/scorecards";
      const method = scorecard.id ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(scorecard),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Save failed: ${res.status} ${res.statusText} ${body}`);
      }

      const saved = await res.json().catch(() => null);
      if (saved) {
        // persist local copy and update state
        try { localStorage.setItem(getDraftKey(saved.matchId), JSON.stringify(saved)); } catch (e) {}
        setScorecard(saved);
      }
      setMessage("✓ Saved");
      setTimeout(() => setMessage(""), 2500);
    } catch (e: any) {
      console.error("Save error", e);
      // ensure a local draft exists
      try { if (scorecard.matchId) localStorage.setItem(getDraftKey(scorecard.matchId), JSON.stringify(scorecard)); } catch (e) {}
      setMessage(`✗ Save failed: ${e?.message || e}`);
    }
    setSaving(false);
  };

  const handlePublish = async () => {
    if (!scorecard?.id) return setMessage("No saved scorecard to publish");
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("No admin token");
      const res = await fetch(`/api/scorecards/${scorecard.id}/publish`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Publish failed: ${res.status}`);
      const pub = await res.json().catch(() => null);
      if (pub) {
        // remove draft
        try { localStorage.removeItem(getDraftKey(pub.matchId)); } catch (e) {}
        setScorecard(pub);
        setMessage("✓ Published");
        setTimeout(() => setMessage(""), 2500);
      }
    } catch (e: any) {
      console.error(e);
      setMessage(`✗ Publish failed: ${e?.message || e}`);
    }
    setSaving(false);
  };

  // UI helpers
  const currentMatch = useMemo(() => matches.find((m) => m.id === selectedMatchId) || null, [matches, selectedMatchId]);

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">IPL Scorecard Admin (robust draft persistence)</h1>
      {message && <div className="mb-4">{message}</div>}

      <div className="mb-4">
        <label className="block mb-1">Select Match</label>
        <select value={selectedMatchId || ""} onChange={(e) => handleSelectMatch(e.target.value)} className="p-2 rounded">
          {matches.map((m) => (
            <option key={m.id} value={m.id}>{m.team1.name} vs {m.team2.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-1">Venue</label>
        <input value={scorecard?.matchInfo?.venue || ""} onChange={(e) => updateField("matchInfo.venue", e.target.value)} className="p-2 rounded text-black" />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Toss Winner</label>
        <select value={scorecard?.matchInfo?.toss?.winner || ""} onChange={(e) => { updateField("matchInfo.toss.winner", e.target.value); }} className="p-2 rounded">
          <option value="">(select)</option>
          <option value={currentMatch?.team1.name || ""}>{currentMatch?.team1.name}</option>
          <option value={currentMatch?.team2.name || ""}>{currentMatch?.team2.name}</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-1">Toss Decision</label>
        <select value={scorecard?.matchInfo?.toss?.decision || ""} onChange={(e) => { updateField("matchInfo.toss.decision", e.target.value); }} className="p-2 rounded">
          <option value="">(select)</option>
          <option value="bat">Bat</option>
          <option value="bowl">Bowl</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 rounded">{saving ? "Saving..." : "Save Draft"}</button>
        <button onClick={handlePublish} disabled={saving || !scorecard?.id} className="px-4 py-2 bg-green-600 rounded">Publish</button>
        <button onClick={() => { localStorage.removeItem(getDraftKey(selectedMatchId || "")); setMessage('Local draft removed'); setTimeout(()=>setMessage(''),2000); }} className="px-4 py-2 bg-red-600 rounded">Clear Local Draft</button>
      </div>

      <div className="mt-6 text-sm text-gray-300">
        <div>Match: {currentMatch ? `${currentMatch.team1.name} vs ${currentMatch.team2.name}` : selectedMatchId}</div>
        <div>Scorecard id: {scorecard?.id || '(unsaved)'}</div>
        <div>Local draft key: {selectedMatchId ? getDraftKey(selectedMatchId) : '(none)'}</div>
      </div>
    </div>
  );
}
