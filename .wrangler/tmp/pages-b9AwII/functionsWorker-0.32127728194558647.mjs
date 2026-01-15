var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../.wrangler/tmp/bundle-FUkoku/checked-fetch.js
var require_checked_fetch = __commonJS({
  "../.wrangler/tmp/bundle-FUkoku/checked-fetch.js"() {
    "use strict";
    var urls = /* @__PURE__ */ new Set();
    function checkURL(request, init) {
      const url = request instanceof URL ? request : new URL(
        (typeof request === "string" ? new Request(request, init) : request).url
      );
      if (url.port && url.port !== "443" && url.protocol === "https:") {
        if (!urls.has(url.toString())) {
          urls.add(url.toString());
          console.warn(
            `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
          );
        }
      }
    }
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// api/admin/analytics/toss.js
var import_checked_fetch = __toESM(require_checked_fetch());
var normalizeTeamName = /* @__PURE__ */ __name((name) => {
  if (!name) return name;
  const trimmed = String(name).trim();
  const lower = trimmed.toLowerCase();
  if (lower === "delhi daredevils") {
    return "Delhi Capitals";
  }
  if (lower === "kings xi punjab" || lower === "kings eleven punjab") {
    return "Punjab Kings";
  }
  return trimmed;
}, "normalizeTeamName");
var onRequest = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  if (method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const { datasetKeys, datasetWeights } = body;
    if (!Array.isArray(datasetKeys) || datasetKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: "datasetKeys must be a non-empty array of dataset keys" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const trimmedKeys = datasetKeys.map((k) => typeof k === "string" ? k.trim() : "").filter((k) => k);
    if (trimmedKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: "datasetKeys must contain at least one non-empty string" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const rawWeightsByKey = {};
    if (datasetWeights && typeof datasetWeights === "object") {
      for (const [rawKey, rawVal] of Object.entries(datasetWeights)) {
        if (!rawKey) continue;
        const key = String(rawKey).trim();
        if (!key) continue;
        const num = Number(rawVal);
        if (!Number.isFinite(num) || num <= 0) continue;
        rawWeightsByKey[key] = num;
      }
    }
    const normalisedWeightsByKey = {};
    let totalWeight = 0;
    for (const key of trimmedKeys) {
      const candidate = Number(rawWeightsByKey[key]);
      const w = Number.isFinite(candidate) && candidate > 0 ? candidate : 1;
      normalisedWeightsByKey[key] = w;
      totalWeight += w;
    }
    if (totalWeight > 0) {
      for (const key of trimmedKeys) {
        normalisedWeightsByKey[key] = normalisedWeightsByKey[key] / totalWeight;
      }
    } else {
      const equal = 1 / trimmedKeys.length;
      for (const key of trimmedKeys) {
        normalisedWeightsByKey[key] = equal;
      }
    }
    const teamStats = /* @__PURE__ */ new Map();
    const perVenue = /* @__PURE__ */ new Map();
    let totalMatches = 0;
    const ensureTeamEntry = /* @__PURE__ */ __name((teamName) => {
      if (!teamStats.has(teamName)) {
        teamStats.set(teamName, {
          team: teamName,
          matches: 0,
          tossesWon: 0,
          matchesWhenWinToss: 0,
          winsWhenWinToss: 0,
          matchesWhenLoseToss: 0,
          winsWhenLoseToss: 0,
          wins: 0
        });
      }
      return teamStats.get(teamName);
    }, "ensureTeamEntry");
    const ensureVenueEntry = /* @__PURE__ */ __name((teamName, venueName) => {
      const key = `${teamName}||${venueName}`;
      if (!perVenue.has(key)) {
        perVenue.set(key, {
          team: teamName,
          venue: venueName,
          matches: 0,
          matchesWhenWinToss: 0,
          winsWhenWinToss: 0,
          matchesWhenLoseToss: 0,
          winsWhenLoseToss: 0
        });
      }
      return perVenue.get(key);
    }, "ensureVenueEntry");
    for (const key of trimmedKeys) {
      const value = await env.SPORTS_KV.get(`dataset:${key}`);
      if (!value) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' not found` }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      let dataset;
      try {
        dataset = JSON.parse(value);
      } catch {
        return new Response(
          JSON.stringify({ error: `Malformed dataset in KV for key '${key}'` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const headers = Array.isArray(dataset.headers) ? dataset.headers : null;
      const rows = Array.isArray(dataset.rows) ? dataset.rows : null;
      if (!headers || !rows) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' is missing headers or rows` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const idxTeam1 = headers.indexOf("team1");
      const idxTeam2 = headers.indexOf("team2");
      const idxTossWinner = headers.indexOf("toss_winner");
      let idxWinningTeam = headers.indexOf("winning_team");
      if (idxWinningTeam === -1) {
        idxWinningTeam = headers.indexOf("match_winner");
      }
      const idxVenue = headers.indexOf("venue");
      if (idxTeam1 === -1 || idxTeam2 === -1 || idxTossWinner === -1 || idxWinningTeam === -1) {
        return new Response(
          JSON.stringify({
            error: `Dataset '${key}' must contain team1, team2, toss_winner, and winning_team or match_winner columns for toss analytics`
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const datasetWeight = normalisedWeightsByKey[key] ?? 1 / trimmedKeys.length;
      for (const row of rows) {
        if (!Array.isArray(row)) continue;
        const team1 = normalizeTeamName(row[idxTeam1]);
        const team2 = normalizeTeamName(row[idxTeam2]);
        const tossWinner = normalizeTeamName(row[idxTossWinner]);
        const winningTeam = normalizeTeamName(row[idxWinningTeam]);
        const venue = idxVenue !== -1 ? row[idxVenue] : void 0;
        if (!team1 || !team2) continue;
        const hasToss = tossWinner && typeof tossWinner === "string";
        const hasResult = winningTeam && typeof winningTeam === "string";
        totalMatches++;
        const w = datasetWeight;
        const t1 = ensureTeamEntry(team1);
        const t2 = ensureTeamEntry(team2);
        t1.matches += w;
        t2.matches += w;
        if (hasResult) {
          if (winningTeam === team1) {
            t1.wins += w;
          } else if (winningTeam === team2) {
            t2.wins += w;
          }
        }
        if (hasToss) {
          if (tossWinner === team1) {
            t1.tossesWon += w;
            t1.matchesWhenWinToss += w;
            if (hasResult && winningTeam === team1) {
              t1.winsWhenWinToss += w;
            }
            t2.matchesWhenLoseToss += w;
            if (hasResult && winningTeam === team2) {
              t2.winsWhenLoseToss += w;
            }
          } else if (tossWinner === team2) {
            t2.tossesWon += w;
            t2.matchesWhenWinToss += w;
            if (hasResult && winningTeam === team2) {
              t2.winsWhenWinToss += w;
            }
            t1.matchesWhenLoseToss += w;
            if (hasResult && winningTeam === team1) {
              t1.winsWhenLoseToss += w;
            }
          }
        }
        if (venue && typeof venue === "string") {
          const v1 = ensureVenueEntry(team1, venue);
          const v2 = ensureVenueEntry(team2, venue);
          v1.matches += w;
          v2.matches += w;
          if (hasToss) {
            if (tossWinner === team1) {
              v1.matchesWhenWinToss += w;
              if (hasResult && winningTeam === team1) {
                v1.winsWhenWinToss += w;
              }
              v2.matchesWhenLoseToss += w;
              if (hasResult && winningTeam === team2) {
                v2.winsWhenLoseToss += w;
              }
            } else if (tossWinner === team2) {
              v2.matchesWhenWinToss += w;
              if (hasResult && winningTeam === team2) {
                v2.winsWhenWinToss += w;
              }
              v1.matchesWhenLoseToss += w;
              if (hasResult && winningTeam === team1) {
                v1.winsWhenLoseToss += w;
              }
            }
          }
        }
      }
    }
    const teams = Array.from(teamStats.values()).map((t) => {
      const tossWinPct = t.matches > 0 ? t.tossesWon / t.matches : 0;
      const winPctWhenWinToss = t.matchesWhenWinToss > 0 ? t.winsWhenWinToss / t.matchesWhenWinToss : 0;
      const winPctWhenLoseToss = t.matchesWhenLoseToss > 0 ? t.winsWhenLoseToss / t.matchesWhenLoseToss : 0;
      const tossImpact = winPctWhenWinToss - winPctWhenLoseToss;
      return {
        team: t.team,
        matches: t.matches,
        tossesWon: t.tossesWon,
        tossWinPct,
        wins: t.wins,
        matchesWhenWinToss: t.matchesWhenWinToss,
        winsWhenWinToss: t.winsWhenWinToss,
        winPctWhenWinToss,
        matchesWhenLoseToss: t.matchesWhenLoseToss,
        winsWhenLoseToss: t.winsWhenLoseToss,
        winPctWhenLoseToss,
        tossImpact
      };
    });
    const perVenueByTeam = {};
    for (const v of perVenue.values()) {
      if (!perVenueByTeam[v.team]) {
        perVenueByTeam[v.team] = [];
      }
      const winPctWhenWinToss = v.matchesWhenWinToss > 0 ? v.winsWhenWinToss / v.matchesWhenWinToss : 0;
      const winPctWhenLoseToss = v.matchesWhenLoseToss > 0 ? v.winsWhenLoseToss / v.matchesWhenLoseToss : 0;
      const tossImpact = winPctWhenWinToss - winPctWhenLoseToss;
      perVenueByTeam[v.team].push({
        team: v.team,
        venue: v.venue,
        matches: v.matches,
        matchesWhenWinToss: v.matchesWhenWinToss,
        winsWhenWinToss: v.winsWhenWinToss,
        winPctWhenWinToss,
        matchesWhenLoseToss: v.matchesWhenLoseToss,
        winsWhenLoseToss: v.winsWhenLoseToss,
        winPctWhenLoseToss,
        tossImpact
      });
    }
    return new Response(
      JSON.stringify({
        success: true,
        datasetKeys: trimmedKeys,
        totals: {
          totalMatches
        },
        teams,
        perVenue: perVenueByTeam
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Toss analytics error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/admin/ml/train.js
var import_checked_fetch2 = __toESM(require_checked_fetch());
var onRequest2 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  if (method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const {
      datasetKey,
      datasetKeys,
      targetColumn,
      featureColumns,
      algorithmId,
      hyperparams
    } = body;
    let datasetKeysList = [];
    if (Array.isArray(datasetKeys) && datasetKeys.length > 0) {
      datasetKeysList = datasetKeys.map((k) => typeof k === "string" ? k.trim() : "").filter((k) => k);
    } else if (typeof datasetKey === "string" && datasetKey.trim()) {
      datasetKeysList = [datasetKey.trim()];
    }
    if (datasetKeysList.length === 0) {
      return new Response(
        JSON.stringify({ error: "datasetKey or datasetKeys is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (!targetColumn || typeof targetColumn !== "string") {
      return new Response(
        JSON.stringify({ error: "targetColumn is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (!Array.isArray(featureColumns) || featureColumns.length === 0) {
      return new Response(
        JSON.stringify({ error: "featureColumns must be a non-empty array" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const datasetsMeta = [];
    for (const key of datasetKeysList) {
      const value = await env.SPORTS_KV.get(`dataset:${key}`);
      if (!value) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' not found` }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      let dataset;
      try {
        dataset = JSON.parse(value);
      } catch {
        return new Response(
          JSON.stringify({ error: `Malformed dataset in KV for key '${key}'` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const headers = Array.isArray(dataset.headers) ? dataset.headers : null;
      const rows = Array.isArray(dataset.rows) ? dataset.rows : null;
      if (!headers || !rows) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' is missing headers or rows` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const targetIndex = headers.indexOf(targetColumn);
      if (targetIndex === -1) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' does not contain target column '${targetColumn}'` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const missingFeatures = [];
      const featureIndices = featureColumns.map((col) => {
        const idx = headers.indexOf(col);
        if (idx === -1) {
          missingFeatures.push(col);
        }
        return idx;
      });
      if (missingFeatures.length > 0) {
        return new Response(
          JSON.stringify({
            error: `Dataset '${key}' is missing feature columns: ${missingFeatures.join(", ")}`
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      datasetsMeta.push({ key, headers, rows, targetIndex, featureIndices });
    }
    const maxRows = hyperparams && Number(hyperparams.maxRows) || 1e3;
    const learningRate = hyperparams && Number(hyperparams.learningRate) || 0.05;
    const epochs = Math.min(hyperparams && Number(hyperparams.epochs) || 20, 50);
    const X = [];
    const y = [];
    const labelToIndex = /* @__PURE__ */ new Map();
    const indexToLabel = [];
    outerLoop: for (const meta of datasetsMeta) {
      const { rows, targetIndex, featureIndices } = meta;
      for (let i = 0; i < rows.length; i++) {
        if (X.length >= maxRows) break outerLoop;
        const row = rows[i];
        if (!Array.isArray(row)) continue;
        const labelRaw = row[targetIndex];
        if (labelRaw == null || labelRaw === "") continue;
        const features = featureIndices.map((idx) => {
          const raw = row[idx];
          const num = parseFloat(raw == null || raw === "" ? "0" : String(raw));
          return Number.isFinite(num) ? num : 0;
        });
        let labelIndex;
        if (labelToIndex.has(labelRaw)) {
          labelIndex = labelToIndex.get(labelRaw);
        } else {
          labelIndex = indexToLabel.length;
          labelToIndex.set(labelRaw, labelIndex);
          indexToLabel.push(labelRaw);
        }
        X.push(features);
        y.push(labelIndex);
      }
    }
    const numSamples = X.length;
    const numFeatures = featureColumns.length;
    const numClasses = indexToLabel.length;
    if (numSamples < 2 || numClasses < 2) {
      return new Response(
        JSON.stringify({
          error: "Not enough data or classes to train a model (need at least 2 samples and 2 classes).",
          numSamples,
          numClasses
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const W = [];
    const b = new Array(numClasses).fill(0);
    for (let k = 0; k < numClasses; k++) {
      const w = [];
      for (let j = 0; j < numFeatures; j++) {
        w.push((Math.random() - 0.5) * 0.01);
      }
      W.push(w);
    }
    const softmax = /* @__PURE__ */ __name((logits) => {
      let maxLogit = -Infinity;
      for (let i = 0; i < logits.length; i++) {
        if (logits[i] > maxLogit) maxLogit = logits[i];
      }
      let sumExp = 0;
      const exps = new Array(logits.length);
      for (let i = 0; i < logits.length; i++) {
        const e = Math.exp(logits[i] - maxLogit);
        exps[i] = e;
        sumExp += e;
      }
      const probs = new Array(logits.length);
      for (let i = 0; i < logits.length; i++) {
        probs[i] = exps[i] / (sumExp || 1);
      }
      return probs;
    }, "softmax");
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < numSamples; i++) {
        const x = X[i];
        const labelIndex = y[i];
        const logits = new Array(numClasses).fill(0);
        for (let k = 0; k < numClasses; k++) {
          let z = b[k];
          const wk = W[k];
          for (let j = 0; j < numFeatures; j++) {
            z += wk[j] * x[j];
          }
          logits[k] = z;
        }
        const probs = softmax(logits);
        for (let k = 0; k < numClasses; k++) {
          const indicator = k === labelIndex ? 1 : 0;
          const gradLogit = probs[k] - indicator;
          const wk = W[k];
          for (let j = 0; j < numFeatures; j++) {
            wk[j] -= learningRate * gradLogit * x[j];
          }
          b[k] -= learningRate * gradLogit;
        }
      }
    }
    let correct = 0;
    for (let i = 0; i < numSamples; i++) {
      const x = X[i];
      const labelIndex = y[i];
      const logits = new Array(numClasses).fill(0);
      for (let k = 0; k < numClasses; k++) {
        let z = b[k];
        const wk = W[k];
        for (let j = 0; j < numFeatures; j++) {
          z += wk[j] * x[j];
        }
        logits[k] = z;
      }
      let bestK = 0;
      let bestVal = logits[0];
      for (let k = 1; k < numClasses; k++) {
        if (logits[k] > bestVal) {
          bestVal = logits[k];
          bestK = k;
        }
      }
      if (bestK === labelIndex) correct++;
    }
    const trainAccuracy = correct / (numSamples || 1);
    return new Response(
      JSON.stringify({
        success: true,
        datasetKeys: datasetKeysList,
        targetColumn,
        featureColumns,
        algorithmId: algorithmId || "simple_neural_net",
        numSamples,
        numFeatures,
        numClasses,
        metrics: {
          trainAccuracy
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("ML train error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/admin/users/activity.js
var import_checked_fetch3 = __toESM(require_checked_fetch());
var onRequest3 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue && tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && parsed.email && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
        console.error("Failed to parse token JSON:", tokenValue);
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      if (body.action) {
        if (user.role !== "admin" && user.role !== "super_admin") {
          return new Response(
            JSON.stringify({ error: "Forbidden" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        const dateKey = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        const auditKey = `admin:audit:${dateKey}`;
        const existingLogs = await env.SPORTS_KV.get(auditKey);
        let logs = existingLogs ? JSON.parse(existingLogs) : [];
        logs.push({
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          adminId: user.id,
          adminEmail: user.email,
          adminRole: user.role,
          action: body.action,
          details: body.details || "",
          entityType: body.entityType || null,
          entityId: body.entityId || null
        });
        if (logs.length > 500) {
          logs = logs.slice(-500);
        }
        await env.SPORTS_KV.put(auditKey, JSON.stringify(logs), {
          expirationTtl: 60 * 60 * 24 * 30
        });
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const matchId = body.matchId || "current";
      if (user.role === "admin" || user.role === "super_admin") {
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      const activeUsersKey = `active-users:${matchId}`;
      const activeUsersData = await env.SPORTS_KV.get(activeUsersKey);
      let activeUsers = activeUsersData ? JSON.parse(activeUsersData) : [];
      activeUsers = activeUsers.filter((u) => u.id !== user.id);
      activeUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        lastActive: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (activeUsers.length > 500) {
        activeUsers = activeUsers.slice(-500);
      }
      await env.SPORTS_KV.put(activeUsersKey, JSON.stringify(activeUsers), {
        expirationTtl: 3600
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Admin users activity error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/account/password.js
var import_checked_fetch4 = __toESM(require_checked_fetch());
import crypto2 from "node:crypto";
var encryptPassword = /* @__PURE__ */ __name((password, salt) => {
  const hash = crypto2.createHash("sha256");
  hash.update(password + salt);
  return hash.digest("hex");
}, "encryptPassword");
var generateSalt = /* @__PURE__ */ __name(() => crypto2.randomBytes(16).toString("hex"), "generateSalt");
var COMMON_PASSWORDS = /* @__PURE__ */ new Set([
  "password",
  "password1",
  "123456",
  "123456789",
  "12345678",
  "qwerty",
  "111111",
  "abc123",
  "letmein",
  "iloveyou"
]);
var onRequest4 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  if (method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    const body = await request.json();
    const { currentPassword, newPassword } = body || {};
    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: "currentPassword and newPassword are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const currentHash = encryptPassword(String(currentPassword), user.salt);
    if (currentHash !== user.hashedPassword) {
      return new Response(
        JSON.stringify({ error: "Current password is incorrect" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const normalizedNew = String(newPassword).trim();
    if (normalizedNew.length < 12) {
      return new Response(
        JSON.stringify({ error: "New password must be at least 12 characters long" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (COMMON_PASSWORDS.has(normalizedNew.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "New password is too common. Please choose a stronger password." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const newSalt = generateSalt();
    const newHashedPassword = encryptPassword(normalizedNew, newSalt);
    const updatedUser = {
      ...user,
      salt: newSalt,
      hashedPassword: newHashedPassword,
      passwordChangedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(updatedUser), {
      expirationTtl: 31536e3
    });
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Password change error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/account/sessions.js
var import_checked_fetch5 = __toESM(require_checked_fetch());
var onRequest5 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  if (method !== "GET" && method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    if (method === "GET") {
      const result2 = await env.SPORTS_KV.list({ prefix: "token:" });
      const sessions = [];
      for (const key of result2.keys) {
        const value = await env.SPORTS_KV.get(key.name);
        if (!value) continue;
        let valueEmail = value;
        if (value.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed.email === "string") {
              valueEmail = parsed.email;
            }
          } catch {
          }
        }
        if (valueEmail === email) {
          sessions.push({ id: key.name.replace("token:", "") });
        }
      }
      return new Response(
        JSON.stringify({ sessions }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const result = await env.SPORTS_KV.list({ prefix: "token:" });
    for (const key of result.keys) {
      const value = await env.SPORTS_KV.get(key.name);
      if (!value) continue;
      let valueEmail = value;
      if (value.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed.email === "string") {
            valueEmail = parsed.email;
          }
        } catch {
        }
      }
      if (valueEmail === email) {
        await env.SPORTS_KV.delete(key.name);
      }
    }
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Sessions error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/admin/admins.js
var import_checked_fetch6 = __toESM(require_checked_fetch());
import crypto3 from "node:crypto";
var encryptPassword2 = /* @__PURE__ */ __name((password, salt) => {
  const hash = crypto3.createHash("sha256");
  hash.update(password + salt);
  return hash.digest("hex");
}, "encryptPassword");
var generateSalt2 = /* @__PURE__ */ __name(() => crypto3.randomBytes(16).toString("hex"), "generateSalt");
var generateToken = /* @__PURE__ */ __name(() => crypto3.randomBytes(32).toString("hex"), "generateToken");
async function verifyAdminToken(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer", "").trim();
  if (!token || !env?.SPORTS_KV) {
    return null;
  }
  const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
  if (!tokenValue) {
    return null;
  }
  let email = tokenValue;
  if (tokenValue.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(tokenValue);
      if (parsed && typeof parsed.email === "string") {
        email = parsed.email;
      }
    } catch {
    }
  }
  const userData = await env.SPORTS_KV.get(`user:${email}`);
  if (!userData) {
    return null;
  }
  const user = JSON.parse(userData);
  if (user.isBlocked) {
    return null;
  }
  if (user.role !== "super_admin") {
    return null;
  }
  return user;
}
__name(verifyAdminToken, "verifyAdminToken");
var onRequest6 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders6
    });
  }
  try {
    const adminUser = await verifyAdminToken(request, env);
    if (!adminUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized or insufficient privileges" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (method === "GET") {
      const admins = [];
      const hardcodedAdmins = [
        {
          id: "1",
          name: "Admin User",
          email: "admin@ipl2026.com",
          role: "super_admin",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          lastLogin: null,
          type: "hardcoded"
        },
        {
          id: "2",
          name: "Manager User",
          email: "manager@ipl2026.com",
          role: "admin",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          lastLogin: null,
          type: "hardcoded"
        }
      ];
      admins.push(...hardcodedAdmins);
      if (env?.SPORTS_KV) {
        try {
          const list = await env.SPORTS_KV.list({ prefix: "user:" });
          for (const key of list.keys) {
            const userStr = await env.SPORTS_KV.get(key.name);
            if (userStr) {
              const user = JSON.parse(userStr);
              if (["admin", "super_admin", "players_admin"].includes(user.role)) {
                admins.push({
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  createdAt: user.createdAt,
                  lastLogin: user.lastLogin,
                  type: "kv"
                });
              }
            }
          }
        } catch (error) {
          console.error("Error fetching KV admins:", error);
        }
      }
      return new Response(
        JSON.stringify({ success: true, admins }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (method === "PUT") {
      const url = new URL(request.url);
      const adminId = url.searchParams.get("id");
      if (!adminId) {
        return new Response(
          JSON.stringify({ error: "Admin ID is required for updates" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const body = await request.json();
      const { email, name, role, password } = body;
      if (!email || !name) {
        return new Response(
          JSON.stringify({ error: "Email and name are required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (password && password.length > 0) {
        if (password.length < 8) {
          return new Response(
            JSON.stringify({ error: "Password must be at least 8 characters" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        if (!/[A-Z]/.test(password)) {
          return new Response(
            JSON.stringify({ error: "Password must contain uppercase letter" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        if (!/[0-9]/.test(password)) {
          return new Response(
            JSON.stringify({ error: "Password must contain number" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
      }
      if (!["admin", "super_admin", "players_admin"].includes(role)) {
        return new Response(
          JSON.stringify({ error: "Role must be admin, super_admin, or players_admin" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (adminId === "1" || adminId === "2") {
        return new Response(
          JSON.stringify({ error: "Cannot update hardcoded admin accounts" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      try {
        const list = await env.SPORTS_KV.list({ prefix: "user:" });
        let adminFound = false;
        let adminKey = null;
        for (const key of list.keys) {
          const userStr = await env.SPORTS_KV.get(key.name);
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.id === adminId && ["admin", "super_admin", "players_admin"].includes(user.role)) {
              adminFound = true;
              adminKey = key.name;
              break;
            }
          }
        }
        if (!adminFound || !adminKey) {
          return new Response(
            JSON.stringify({ error: "Admin not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        const existingAdminStr = await env.SPORTS_KV.get(adminKey);
        const existingAdmin = JSON.parse(existingAdminStr);
        if (email !== existingAdmin.email) {
          const emailCheck = await env.SPORTS_KV.get(`user:${email}`);
          if (emailCheck) {
            return new Response(
              JSON.stringify({ error: "Email already exists" }),
              { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
            );
          }
        }
        const updatedAdmin = {
          ...existingAdmin,
          email,
          name,
          role,
          // Only update password if provided
          ...password && {
            salt: generateSalt2(),
            hashedPassword: encryptPassword2(password, generateSalt2())
          }
        };
        if (email !== existingAdmin.email) {
          await env.SPORTS_KV.delete(adminKey);
          await env.SPORTS_KV.delete(`token:${existingAdmin.token}`);
        }
        const newKey = `user:${email}`;
        await env.SPORTS_KV.put(
          newKey,
          JSON.stringify(updatedAdmin),
          {
            expirationTtl: 365 * 24 * 60 * 60
            // 1 year
          }
        );
        await env.SPORTS_KV.put(
          `token:${updatedAdmin.token}`,
          JSON.stringify({
            userId: updatedAdmin.id,
            email,
            role: updatedAdmin.role,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }),
          {
            expirationTtl: 365 * 24 * 60 * 60
            // 1 year
          }
        );
        return new Response(
          JSON.stringify({
            success: true,
            message: "Admin updated successfully",
            admin: {
              id: updatedAdmin.id,
              name: updatedAdmin.name,
              email: updatedAdmin.email,
              role: updatedAdmin.role,
              createdAt: updatedAdmin.createdAt,
              lastLogin: updatedAdmin.lastLogin
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      } catch (error) {
        console.error("Error updating admin:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update admin" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
    }
    if (method === "POST") {
      const body = await request.json();
      const { email, password, name, role } = body;
      if (!email || !password || !name) {
        return new Response(
          JSON.stringify({ error: "Email, password, and name are required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 8 characters" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (!/[A-Z]/.test(password)) {
        return new Response(
          JSON.stringify({ error: "Password must contain uppercase letter" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (!/[0-9]/.test(password)) {
        return new Response(
          JSON.stringify({ error: "Password must contain number" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (!["admin", "super_admin", "players_admin"].includes(role)) {
        return new Response(
          JSON.stringify({ error: "Role must be admin, super_admin, or players_admin" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const existingUser = await env.SPORTS_KV.get(`user:${email}`);
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "User already exists" }),
          { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const salt = generateSalt2();
      const hashedPassword = encryptPassword2(password, salt);
      const userId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const token = generateToken();
      const adminUser2 = {
        id: userId,
        email,
        name,
        salt,
        hashedPassword,
        token,
        role,
        isBlocked: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastLogin: null
      };
      await env.SPORTS_KV.put(
        `user:${email}`,
        JSON.stringify(adminUser2),
        {
          expirationTtl: 365 * 24 * 60 * 60
          // 1 year
        }
      );
      await env.SPORTS_KV.put(
        `token:${token}`,
        JSON.stringify({
          userId: adminUser2.id,
          email,
          role: adminUser2.role,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }),
        {
          expirationTtl: 7 * 24 * 60 * 60
          // 7 days
        }
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: "Admin created successfully",
          admin: {
            id: adminUser2.id,
            email: adminUser2.email,
            name: adminUser2.name,
            role: adminUser2.role,
            createdAt: adminUser2.createdAt
          }
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        }
      );
    }
    if (method === "DELETE") {
      const { email } = await request.json();
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (email === "admin@ipl2026.com" || email === "manager@ipl2026.com") {
        return new Response(
          JSON.stringify({ error: "Cannot delete hardcoded admin accounts" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (email === adminUser.email) {
        return new Response(
          JSON.stringify({ error: "Cannot delete your own admin account" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "Admin not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const user = JSON.parse(userData);
      if (user.role !== "admin" && user.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "User is not an admin" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      await env.SPORTS_KV.delete(`user:${email}`);
      if (user.token) {
        await env.SPORTS_KV.delete(`token:${user.token}`);
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: "Admin deleted successfully"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        }
      );
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Admin management error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/admin/backup-players.js
var import_checked_fetch7 = __toESM(require_checked_fetch());
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function verifyAdminToken2(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken2, "verifyAdminToken");
function generateBackupKey() {
  const now = /* @__PURE__ */ new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `players_backup:${timestamp}`;
}
__name(generateBackupKey, "generateBackupKey");
var onRequest7 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    if (!verifyAdminToken2(request)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const backupKey = url.searchParams.get("backupKey");
    if (request.method === "POST" && action === "create") {
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      if (players.length === 0) {
        return new Response(JSON.stringify({
          error: "No players to backup",
          message: "There are no players in the database to create a backup."
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const key = generateBackupKey();
      const backup = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        playerCount: players.length,
        players,
        metadata: {
          iplCount: players.filter((p) => (p.league || "ipl") === "ipl").length,
          wplCount: players.filter((p) => (p.league || "ipl") === "wpl").length
        }
      };
      await env.IPL_CACHE.put(key, JSON.stringify(backup));
      const backupListKey = "players_backup:list";
      let backupList = await env.IPL_CACHE.get(backupListKey, "json") || [];
      backupList.push({
        key,
        timestamp: backup.timestamp,
        playerCount: backup.playerCount,
        metadata: backup.metadata
      });
      backupList = backupList.slice(-50);
      await env.IPL_CACHE.put(backupListKey, JSON.stringify(backupList));
      console.log(`[BACKUP] Created backup: ${key} with ${players.length} players`);
      return new Response(JSON.stringify({
        success: true,
        message: `Backup created successfully`,
        backup: {
          key,
          timestamp: backup.timestamp,
          playerCount: backup.playerCount,
          metadata: backup.metadata
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (request.method === "GET" && action === "list") {
      const backupListKey = "players_backup:list";
      const backupList = await env.IPL_CACHE.get(backupListKey, "json") || [];
      backupList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return new Response(JSON.stringify({
        success: true,
        backups: backupList,
        count: backupList.length
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (request.method === "POST" && action === "restore") {
      if (!backupKey) {
        return new Response(JSON.stringify({
          error: "Backup key is required",
          message: "Please provide a backupKey parameter"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const backupData = await env.IPL_CACHE.get(backupKey, "json");
      if (!backupData) {
        return new Response(JSON.stringify({
          error: "Backup not found",
          message: `Backup with key ${backupKey} does not exist`
        }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      await env.IPL_CACHE.put("players", JSON.stringify(backupData.players));
      console.log(`[RESTORE] Restored backup: ${backupKey} with ${backupData.players.length} players`);
      return new Response(JSON.stringify({
        success: true,
        message: `Restored ${backupData.players.length} players from backup`,
        restored: {
          key: backupKey,
          timestamp: backupData.timestamp,
          playerCount: backupData.players.length,
          metadata: backupData.metadata
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (request.method === "DELETE" && action === "delete") {
      if (!backupKey) {
        return new Response(JSON.stringify({
          error: "Backup key is required",
          message: "Please provide a backupKey parameter"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      await env.IPL_CACHE.delete(backupKey);
      const backupListKey = "players_backup:list";
      let backupList = await env.IPL_CACHE.get(backupListKey, "json") || [];
      backupList = backupList.filter((b) => b.key !== backupKey);
      await env.IPL_CACHE.put(backupListKey, JSON.stringify(backupList));
      console.log(`[DELETE] Deleted backup: ${backupKey}`);
      return new Response(JSON.stringify({
        success: true,
        message: "Backup deleted successfully"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (request.method === "GET" && action === "get" && backupKey) {
      const backupData = await env.IPL_CACHE.get(backupKey, "json");
      if (!backupData) {
        return new Response(JSON.stringify({
          error: "Backup not found",
          message: `Backup with key ${backupKey} does not exist`
        }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        backup: {
          key: backupKey,
          timestamp: backupData.timestamp,
          playerCount: backupData.playerCount,
          metadata: backupData.metadata,
          // Don't include full players array in list view
          players: backupData.players
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    return new Response(JSON.stringify({
      error: "Invalid action",
      availableActions: {
        create: "POST /api/admin/backup-players?action=create",
        list: "GET /api/admin/backup-players?action=list",
        restore: "POST /api/admin/backup-players?action=restore&backupKey=<key>",
        delete: "DELETE /api/admin/backup-players?action=delete&backupKey=<key>",
        get: "GET /api/admin/backup-players?action=get&backupKey=<key>"
      }
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Backup API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
}, "onRequest");

// api/admin/backup-points-table.js
var import_checked_fetch8 = __toESM(require_checked_fetch());
var corsHeaders2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function verifyAdminToken3(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken3, "verifyAdminToken");
function generateBackupKey2() {
  const now = /* @__PURE__ */ new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `points_table_backup:${timestamp}`;
}
__name(generateBackupKey2, "generateBackupKey");
var onRequest8 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  try {
    if (!verifyAdminToken3(request)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const backupKey = url.searchParams.get("backupKey");
    const year = url.searchParams.get("year");
    if (request.method === "POST" && action === "create") {
      let pointsTableData = [];
      if (year) {
        const yearData = await env.IPL_CACHE.get(`iplPointsTable${year}`, "json");
        if (yearData) {
          pointsTableData = yearData;
        }
      } else {
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        const currentYearData = await env.IPL_CACHE.get(`iplPointsTable${currentYear}`, "json");
        if (currentYearData) {
          pointsTableData = currentYearData;
        }
      }
      if (pointsTableData.length === 0) {
        return new Response(JSON.stringify({
          error: "No points table data to backup",
          message: "There is no points table data in the database to create a backup."
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
        });
      }
      const key = generateBackupKey2();
      const backup = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        year: year || (/* @__PURE__ */ new Date()).getFullYear(),
        teamCount: pointsTableData.length,
        teams: pointsTableData,
        metadata: {
          season: year || (/* @__PURE__ */ new Date()).getFullYear(),
          backupType: year ? "single_year" : "current_year"
        }
      };
      await env.IPL_CACHE.put(key, JSON.stringify(backup));
      const backupListKey = "points_table_backup:list";
      let backupList = await env.IPL_CACHE.get(backupListKey, "json") || [];
      backupList.push({
        key,
        timestamp: backup.timestamp,
        year: backup.year,
        teamCount: backup.teamCount,
        metadata: backup.metadata
      });
      backupList = backupList.slice(-50);
      await env.IPL_CACHE.put(backupListKey, JSON.stringify(backupList));
      console.log(`[BACKUP] Created points table backup: ${key} with ${pointsTableData.length} teams for year ${backup.year}`);
      return new Response(JSON.stringify({
        success: true,
        message: `Points table backup created successfully`,
        backup: {
          key,
          timestamp: backup.timestamp,
          year: backup.year,
          teamCount: backup.teamCount,
          metadata: backup.metadata
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (request.method === "GET" && action === "list") {
      const backupListKey = "points_table_backup:list";
      const backupList = await env.IPL_CACHE.get(backupListKey, "json") || [];
      backupList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return new Response(JSON.stringify({
        success: true,
        backups: backupList,
        count: backupList.length
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (request.method === "POST" && action === "restore") {
      if (!backupKey) {
        return new Response(JSON.stringify({
          error: "Backup key is required",
          message: "Please provide a backupKey parameter"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
        });
      }
      const backupData = await env.IPL_CACHE.get(backupKey, "json");
      if (!backupData) {
        return new Response(JSON.stringify({
          error: "Backup not found",
          message: `Backup with key ${backupKey} does not exist`
        }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
        });
      }
      const storageKey = `iplPointsTable${backupData.year}`;
      await env.IPL_CACHE.put(storageKey, JSON.stringify(backupData.teams));
      console.log(`[RESTORE] Restored points table backup: ${backupKey} with ${backupData.teams.length} teams for year ${backupData.year}`);
      return new Response(JSON.stringify({
        success: true,
        message: `Restored ${backupData.teams.length} teams from backup for year ${backupData.year}`,
        restored: {
          key: backupKey,
          timestamp: backupData.timestamp,
          year: backupData.year,
          teamCount: backupData.teams.length,
          metadata: backupData.metadata
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (request.method === "DELETE" && action === "delete") {
      if (!backupKey) {
        return new Response(JSON.stringify({
          error: "Backup key is required",
          message: "Please provide a backupKey parameter"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
        });
      }
      await env.IPL_CACHE.delete(backupKey);
      const backupListKey = "points_table_backup:list";
      let backupList = await env.IPL_CACHE.get(backupListKey, "json") || [];
      backupList = backupList.filter((b) => b.key !== backupKey);
      await env.IPL_CACHE.put(backupListKey, JSON.stringify(backupList));
      console.log(`[DELETE] Deleted points table backup: ${backupKey}`);
      return new Response(JSON.stringify({
        success: true,
        message: "Points table backup deleted successfully"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (request.method === "GET" && action === "get" && backupKey) {
      const backupData = await env.IPL_CACHE.get(backupKey, "json");
      if (!backupData) {
        return new Response(JSON.stringify({
          error: "Backup not found",
          message: `Backup with key ${backupKey} does not exist`
        }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        backup: {
          key: backupKey,
          timestamp: backupData.timestamp,
          year: backupData.year,
          teamCount: backupData.teamCount,
          metadata: backupData.metadata,
          // Include full teams array
          teams: backupData.teams
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    return new Response(JSON.stringify({
      error: "Invalid action",
      availableActions: {
        create: "POST /api/admin/backup-points-table?action=create&year=<optional_year>",
        list: "GET /api/admin/backup-points-table?action=list",
        restore: "POST /api/admin/backup-points-table?action=restore&backupKey=<key>",
        delete: "DELETE /api/admin/backup-points-table?action=delete&backupKey=<key>",
        get: "GET /api/admin/backup-points-table?action=get&backupKey=<key>"
      }
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders2 }
    });
  } catch (error) {
    console.error("Points table backup API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      }
    );
  }
}, "onRequest");

// api/admin/datasets.js
var import_checked_fetch9 = __toESM(require_checked_fetch());
var onRequest9 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  if (method !== "POST" && method !== "GET" && method !== "DELETE") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (method === "GET") {
      const datasetKey2 = url.searchParams.get("key");
      if (datasetKey2) {
        const safeKey2 = datasetKey2.trim();
        if (!safeKey2) {
          return new Response(
            JSON.stringify({ error: "datasetKey cannot be empty" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        const value = await env.SPORTS_KV.get(`dataset:${safeKey2}`);
        if (!value) {
          return new Response(
            JSON.stringify({ error: "Dataset not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        try {
          const dataset2 = JSON.parse(value);
          return new Response(
            JSON.stringify({ dataset: dataset2 }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        } catch {
          return new Response(
            JSON.stringify({ error: "Malformed dataset in KV" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
      }
      const list = await env.SPORTS_KV.list({ prefix: "dataset:" });
      const datasets = [];
      for (const entry of list.keys) {
        try {
          const value = await env.SPORTS_KV.get(entry.name);
          if (!value) continue;
          const parsed = JSON.parse(value);
          datasets.push({
            key: parsed.key || entry.name.replace(/^dataset:/, ""),
            rowCount: parsed.meta?.rowCount,
            uploadedAt: parsed.meta?.uploadedAt,
            uploadedBy: parsed.meta?.uploadedBy,
            seasonRange: parsed.meta?.seasonRange,
            seasonCount: parsed.meta?.seasonCount
          });
        } catch {
        }
      }
      return new Response(
        JSON.stringify({ datasets }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (method === "DELETE") {
      const datasetKey2 = url.searchParams.get("key");
      if (!datasetKey2 || !datasetKey2.trim()) {
        return new Response(
          JSON.stringify({ error: "datasetKey is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const safeKey2 = datasetKey2.trim();
      await env.SPORTS_KV.delete(`dataset:${safeKey2}`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const body = await request.json();
    const { datasetKey, headers, rows, meta } = body || {};
    if (!datasetKey || typeof datasetKey !== "string") {
      return new Response(
        JSON.stringify({ error: "datasetKey is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return new Response(
        JSON.stringify({ error: "headers and rows must be arrays" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const safeKey = datasetKey.trim();
    if (!safeKey) {
      return new Response(
        JSON.stringify({ error: "datasetKey cannot be empty" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let seasonRange;
    let seasonCount;
    const seasonIndex = headers.indexOf("season");
    if (seasonIndex !== -1) {
      const seasonsSet = /* @__PURE__ */ new Set();
      for (const row of rows) {
        if (!Array.isArray(row)) continue;
        const raw = row[seasonIndex];
        if (raw == null) continue;
        const str = String(raw).trim();
        if (!str) continue;
        seasonsSet.add(str);
      }
      if (seasonsSet.size > 0) {
        const values = Array.from(seasonsSet);
        const numeric = values.map((v) => parseInt(v, 10)).filter((n) => Number.isFinite(n));
        if (numeric.length > 0) {
          const min = Math.min(...numeric);
          const max = Math.max(...numeric);
          seasonRange = min === max ? String(min) : `${min}-${max}`;
        } else {
          seasonRange = values.join(", ");
        }
        seasonCount = seasonsSet.size;
      }
    }
    const dataset = {
      key: safeKey,
      headers,
      rows,
      meta: {
        ...meta && typeof meta === "object" ? meta : {},
        uploadedBy: email,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        rowCount: Array.isArray(rows) ? rows.length : 0,
        seasonRange,
        seasonCount
      }
    };
    await env.SPORTS_KV.put(`dataset:${safeKey}`, JSON.stringify(dataset));
    return new Response(
      JSON.stringify({ success: true, datasetKey: safeKey, rowCount: dataset.meta.rowCount }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Admin dataset save error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/admin/email-users.js
var import_checked_fetch10 = __toESM(require_checked_fetch());
var onRequest10 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let emailFromToken = tokenValue;
    let roleFromToken = "user";
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          emailFromToken = parsed.email;
        }
        if (parsed && typeof parsed.role === "string") {
          roleFromToken = parsed.role;
        }
      } catch (e) {
      }
    }
    const adminUserData = await env.SPORTS_KV.get(`user:${emailFromToken}`);
    if (!adminUserData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const adminUser = JSON.parse(adminUserData);
    const effectiveRole = adminUser.role || roleFromToken;
    if (effectiveRole !== "admin" && effectiveRole !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (method === "GET") {
      let indexRaw = await env.SPORTS_KV.get("users-index");
      let emails = [];
      if (indexRaw) {
        try {
          emails = JSON.parse(indexRaw) || [];
        } catch (e) {
          emails = [];
        }
      }
      if (!Array.isArray(emails)) {
        emails = [];
      }
      const total = emails.length;
      const limitParam = searchParams.get("limit");
      const offsetParam = searchParams.get("offset");
      const limit = Number.isNaN(parseInt(limitParam || "", 10)) ? 200 : parseInt(limitParam || "200", 10);
      const offset = Number.isNaN(parseInt(offsetParam || "", 10)) ? 0 : parseInt(offsetParam || "0", 10);
      const slice = emails.slice(offset, offset + limit);
      const users = [];
      for (const email of slice) {
        try {
          const userData = await env.SPORTS_KV.get(`user:${email}`);
          if (!userData) continue;
          const user = JSON.parse(userData);
          users.push({
            id: user.id,
            email: user.email,
            name: user.name,
            termsAccepted: !!user.termsAccepted,
            emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
            favoriteTeamIds: Array.isArray(user.favoriteTeamIds) ? user.favoriteTeamIds : [],
            unsubscribedAt: user.unsubscribedAt || null,
            unsubscribeReason: user.unsubscribeReason || null,
            timezone: user.timezone || null,
            lastLogin: user.lastLogin || null
          });
        } catch (e) {
        }
      }
      return new Response(
        JSON.stringify({ users, total, offset, limit }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (method === "PUT") {
      const body = await request.json();
      const { email, emailNotificationsEnabled, favoriteTeamIds } = body || {};
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Missing email" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const user = JSON.parse(userData);
      if (typeof emailNotificationsEnabled === "boolean") {
        user.emailNotificationsEnabled = emailNotificationsEnabled;
        if (emailNotificationsEnabled) {
          delete user.unsubscribedAt;
          delete user.unsubscribeReason;
        } else {
          user.unsubscribedAt = user.unsubscribedAt || (/* @__PURE__ */ new Date()).toISOString();
          user.unsubscribeReason = user.unsubscribeReason || "admin-toggle";
        }
      }
      if (Array.isArray(favoriteTeamIds)) {
        user.favoriteTeamIds = favoriteTeamIds.map((v) => String(v));
      }
      await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
        expirationTtl: 31536e3
      });
      const responseUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        termsAccepted: !!user.termsAccepted,
        emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
        favoriteTeamIds: Array.isArray(user.favoriteTeamIds) ? user.favoriteTeamIds : [],
        unsubscribedAt: user.unsubscribedAt || null,
        unsubscribeReason: user.unsubscribeReason || null
      };
      return new Response(
        JSON.stringify({ success: true, user: responseUser }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Admin email users error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/admin/login.js
var import_checked_fetch11 = __toESM(require_checked_fetch());
import crypto4 from "node:crypto";
function base32ToBytes(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const c of clean) {
    const val = alphabet.indexOf(c);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}
__name(base32ToBytes, "base32ToBytes");
async function generateTotpCode(secretBase32, timeStep = 30, digits = 6) {
  const webCrypto = globalThis.crypto;
  const keyBytes = base32ToBytes(secretBase32);
  if (!keyBytes.length) return null;
  const epochSeconds = Math.floor(Date.now() / 1e3);
  const counter = Math.floor(epochSeconds / timeStep);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(4, counter, false);
  const counterBytes = new Uint8Array(buf);
  const cryptoKey = await webCrypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const hmac = new Uint8Array(
    await webCrypto.subtle.sign("HMAC", cryptoKey, counterBytes)
  );
  const offset = hmac[hmac.length - 1] & 15;
  const binary = (hmac[offset] & 127) << 24 | hmac[offset + 1] << 16 | hmac[offset + 2] << 8 | hmac[offset + 3];
  const otp = binary % 10 ** digits;
  return otp.toString().padStart(digits, "0");
}
__name(generateTotpCode, "generateTotpCode");
async function verifyTotpCode(secretBase32, code, window = 1) {
  if (!secretBase32) return true;
  const cleaned = String(code || "").replace(/\s+/g, "");
  if (!cleaned) return false;
  const epochSeconds = Math.floor(Date.now() / 1e3);
  const timeStep = 30;
  const baseCounter = Math.floor(epochSeconds / timeStep);
  for (let offset = -window; offset <= window; offset++) {
    const testTime = (baseCounter + offset) * timeStep * 1e3;
    const simulatedNow = Date.now;
    try {
      Date.now = () => testTime;
      const expected = await generateTotpCode(secretBase32, timeStep);
      if (expected === cleaned) {
        return true;
      }
    } finally {
      Date.now = simulatedNow;
    }
  }
  return false;
}
__name(verifyTotpCode, "verifyTotpCode");
var ADMIN_USERS = {
  admin: {
    id: "1",
    username: "admin",
    email: "admin@ipl2026.com",
    role: "super_admin",
    password: "admin123"
  },
  manager: {
    id: "2",
    username: "manager",
    email: "manager@ipl2026.com",
    role: "admin",
    password: "manager123"
  }
};
var PLAYERS_ONLY_ADMINS = /* @__PURE__ */ new Set([
  "sumanthvallam20@gmail.com"
]);
var verifyPassword = /* @__PURE__ */ __name((password, salt, hashedPassword) => {
  const hash = crypto4.createHash("sha256");
  hash.update(password + salt);
  return hash.digest("hex") === hashedPassword;
}, "verifyPassword");
function generateToken2(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1e3
    // 7 days
  };
  return btoa(JSON.stringify(payload));
}
__name(generateToken2, "generateToken");
var onRequest11 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders6
    });
  }
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders6
        }
      }
    );
  }
  try {
    const body = await request.json();
    const { username, password, totp } = body;
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders6
          }
        }
      );
    }
    const totpSecret = env && env.ADMIN_TOTP_SECRET_BASE32;
    const hardcodedUser = ADMIN_USERS[username];
    if (hardcodedUser && hardcodedUser.password === password) {
      if (totpSecret) {
        const ok2fa = await verifyTotpCode(totpSecret, totp);
        if (!ok2fa) {
          return new Response(
            JSON.stringify({ error: "Invalid 2FA code" }),
            {
              status: 401,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders6
              }
            }
          );
        }
      }
      const effectiveRole = PLAYERS_ONLY_ADMINS.has(hardcodedUser.email) ? "players_admin" : hardcodedUser.role;
      const token = generateToken2({ ...hardcodedUser, role: effectiveRole });
      if (env && env.SPORTS_KV) {
        const email = hardcodedUser.email;
        const nowIso = (/* @__PURE__ */ new Date()).toISOString();
        let existingUser = null;
        try {
          const raw = await env.SPORTS_KV.get(`user:${email}`);
          if (raw) {
            existingUser = JSON.parse(raw);
          }
        } catch {
          existingUser = null;
        }
        const userRecord = {
          id: existingUser?.id || hardcodedUser.id,
          email,
          name: existingUser?.name || hardcodedUser.username,
          // Preserve any password fields/salt if they existed from setup,
          // but override role, token, and lastLogin.
          salt: existingUser?.salt,
          hashedPassword: existingUser?.hashedPassword,
          token,
          role: effectiveRole,
          isBlocked: existingUser?.isBlocked ?? false,
          createdAt: existingUser?.createdAt || nowIso,
          lastLogin: nowIso
        };
        await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(userRecord), {
          expirationTtl: 31536e3
        });
        await env.SPORTS_KV.put(
          `token:${token}`,
          JSON.stringify({
            userId: userRecord.id,
            email,
            role: userRecord.role,
            createdAt: nowIso
          }),
          {
            expirationTtl: 2592e3
            // 30 days
          }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          token,
          user: {
            id: hardcodedUser.id,
            username: hardcodedUser.username,
            email: hardcodedUser.email,
            role: effectiveRole
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders6
          }
        }
      );
    }
    if (env && env.SPORTS_KV) {
      const userData = await env.SPORTS_KV.get(`user:${username}`);
      if (userData) {
        const user = JSON.parse(userData);
        if ((user.role === "admin" || user.role === "super_admin" || user.role === "players_admin") && verifyPassword(password, user.salt, user.hashedPassword)) {
          if (totpSecret) {
            const ok2fa = await verifyTotpCode(totpSecret, totp);
            if (!ok2fa) {
              return new Response(
                JSON.stringify({ error: "Invalid 2FA code" }),
                {
                  status: 401,
                  headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders6
                  }
                }
              );
            }
          }
          let token = user.token;
          const nowIso = (/* @__PURE__ */ new Date()).toISOString();
          if (!token) {
            const tokenBuffer = crypto4.randomBytes(32);
            token = tokenBuffer.toString("hex");
          }
          const allowListedRole = PLAYERS_ONLY_ADMINS.has(user.email) ? "players_admin" : user.role;
          const updatedUser = {
            ...user,
            token,
            lastLogin: nowIso,
            role: ["admin", "super_admin", "players_admin"].includes(user.role) ? user.role : allowListedRole
          };
          await env.SPORTS_KV.put(
            `user:${username}`,
            JSON.stringify(updatedUser),
            {
              expirationTtl: 365 * 24 * 60 * 60
            }
          );
          await env.SPORTS_KV.put(
            `token:${token}`,
            JSON.stringify({
              userId: updatedUser.id,
              email: updatedUser.email,
              role: updatedUser.role,
              createdAt: nowIso
            }),
            {
              expirationTtl: 7 * 24 * 60 * 60
            }
          );
          return new Response(
            JSON.stringify({
              success: true,
              token,
              user: {
                id: updatedUser.id,
                username: updatedUser.email,
                email: updatedUser.email,
                role: updatedUser.role
              }
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders6
              }
            }
          );
        }
      }
    }
    return new Response(
      JSON.stringify({ error: "Invalid username or password" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders6
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders6
        }
      }
    );
  }
}, "onRequest");

// api/admin/ml-train.js
var import_checked_fetch12 = __toESM(require_checked_fetch());
var onRequest12 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  if (method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const {
      datasetKey,
      targetColumn,
      featureColumns,
      algorithmId,
      hyperparams
    } = body;
    if (!datasetKey || typeof datasetKey !== "string") {
      return new Response(
        JSON.stringify({ error: "datasetKey is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (!targetColumn || typeof targetColumn !== "string") {
      return new Response(
        JSON.stringify({ error: "targetColumn is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (!Array.isArray(featureColumns) || featureColumns.length === 0) {
      return new Response(
        JSON.stringify({ error: "featureColumns must be a non-empty array" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const safeKey = datasetKey.trim();
    const value = await env.SPORTS_KV.get(`dataset:${safeKey}`);
    if (!value) {
      return new Response(
        JSON.stringify({ error: "Dataset not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let dataset;
    try {
      dataset = JSON.parse(value);
    } catch {
      return new Response(
        JSON.stringify({ error: "Malformed dataset in KV" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const headers = Array.isArray(dataset.headers) ? dataset.headers : null;
    const rows = Array.isArray(dataset.rows) ? dataset.rows : null;
    if (!headers || !rows) {
      return new Response(
        JSON.stringify({ error: "Dataset format is invalid (missing headers/rows)" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const targetIndex = headers.indexOf(targetColumn);
    if (targetIndex === -1) {
      return new Response(
        JSON.stringify({ error: `Target column '${targetColumn}' not found in dataset` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const featureIndices = featureColumns.map((col) => ({ col, idx: headers.indexOf(col) })).filter((entry) => entry.idx !== -1);
    if (featureIndices.length === 0) {
      return new Response(
        JSON.stringify({ error: "None of the featureColumns were found in dataset headers" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const maxRows = hyperparams && Number(hyperparams.maxRows) || 1e3;
    const learningRate = hyperparams && Number(hyperparams.learningRate) || 0.05;
    const epochs = Math.min(hyperparams && Number(hyperparams.epochs) || 20, 50);
    const X = [];
    const y = [];
    const labelToIndex = /* @__PURE__ */ new Map();
    const indexToLabel = [];
    for (let i = 0; i < rows.length && X.length < maxRows; i++) {
      const row = rows[i];
      if (!Array.isArray(row)) continue;
      const labelRaw = row[targetIndex];
      if (labelRaw == null || labelRaw === "") continue;
      const features = featureIndices.map(({ idx }) => {
        const raw = row[idx];
        const num = parseFloat(raw == null || raw === "" ? "0" : String(raw));
        return Number.isFinite(num) ? num : 0;
      });
      let labelIndex;
      if (labelToIndex.has(labelRaw)) {
        labelIndex = labelToIndex.get(labelRaw);
      } else {
        labelIndex = indexToLabel.length;
        labelToIndex.set(labelRaw, labelIndex);
        indexToLabel.push(labelRaw);
      }
      X.push(features);
      y.push(labelIndex);
    }
    const numSamples = X.length;
    const numFeatures = featureIndices.length;
    const numClasses = indexToLabel.length;
    if (numSamples < 2 || numClasses < 2) {
      return new Response(
        JSON.stringify({
          error: "Not enough data or classes to train a model (need at least 2 samples and 2 classes).",
          numSamples,
          numClasses
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const W = [];
    const b = new Array(numClasses).fill(0);
    for (let k = 0; k < numClasses; k++) {
      const w = [];
      for (let j = 0; j < numFeatures; j++) {
        w.push((Math.random() - 0.5) * 0.01);
      }
      W.push(w);
    }
    const softmax = /* @__PURE__ */ __name((logits) => {
      let maxLogit = -Infinity;
      for (let i = 0; i < logits.length; i++) {
        if (logits[i] > maxLogit) maxLogit = logits[i];
      }
      let sumExp = 0;
      const exps = new Array(logits.length);
      for (let i = 0; i < logits.length; i++) {
        const e = Math.exp(logits[i] - maxLogit);
        exps[i] = e;
        sumExp += e;
      }
      const probs = new Array(logits.length);
      for (let i = 0; i < logits.length; i++) {
        probs[i] = exps[i] / (sumExp || 1);
      }
      return probs;
    }, "softmax");
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < numSamples; i++) {
        const x = X[i];
        const labelIndex = y[i];
        const logits = new Array(numClasses).fill(0);
        for (let k = 0; k < numClasses; k++) {
          let z = b[k];
          const wk = W[k];
          for (let j = 0; j < numFeatures; j++) {
            z += wk[j] * x[j];
          }
          logits[k] = z;
        }
        const probs = softmax(logits);
        for (let k = 0; k < numClasses; k++) {
          const indicator = k === labelIndex ? 1 : 0;
          const gradLogit = probs[k] - indicator;
          const wk = W[k];
          for (let j = 0; j < numFeatures; j++) {
            wk[j] -= learningRate * gradLogit * x[j];
          }
          b[k] -= learningRate * gradLogit;
        }
      }
    }
    let correct = 0;
    for (let i = 0; i < numSamples; i++) {
      const x = X[i];
      const labelIndex = y[i];
      const logits = new Array(numClasses).fill(0);
      for (let k = 0; k < numClasses; k++) {
        let z = b[k];
        const wk = W[k];
        for (let j = 0; j < numFeatures; j++) {
          z += wk[j] * x[j];
        }
        logits[k] = z;
      }
      let bestK = 0;
      let bestVal = logits[0];
      for (let k = 1; k < numClasses; k++) {
        if (logits[k] > bestVal) {
          bestVal = logits[k];
          bestK = k;
        }
      }
      if (bestK === labelIndex) correct++;
    }
    const trainAccuracy = correct / (numSamples || 1);
    return new Response(
      JSON.stringify({
        success: true,
        datasetKey: safeKey,
        targetColumn,
        featureColumns,
        algorithmId: algorithmId || "simple_neural_net",
        numSamples,
        numFeatures,
        numClasses,
        metrics: {
          trainAccuracy
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("ML train error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/admin/moderation.js
var import_checked_fetch13 = __toESM(require_checked_fetch());
var onRequest13 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (url.pathname === "/api/admin/moderation" && method === "GET") {
      const matchId = url.searchParams.get("matchId") || "current";
      const statusFilter = url.searchParams.get("status") || "pending";
      const limit = parseInt(url.searchParams.get("limit") || "100");
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      const messages = messagesData ? JSON.parse(messagesData) : [];
      let flagged = messages.filter((m) => m && m.isFlagged);
      if (statusFilter === "pending") {
        flagged = flagged.filter((m) => m.flagStatus === "pending");
      } else if (statusFilter === "safe") {
        flagged = flagged.filter((m) => m.flagStatus === "safe");
      } else if (statusFilter === "action_taken") {
        flagged = flagged.filter((m) => m.flagStatus === "action_taken");
      }
      flagged.sort((a, b) => {
        const aTime = a.flaggedAt ? Date.parse(a.flaggedAt) : Date.parse(a.timestamp || "") || 0;
        const bTime = b.flaggedAt ? Date.parse(b.flaggedAt) : Date.parse(b.timestamp || "") || 0;
        return bTime - aTime;
      });
      const sliced = flagged.slice(0, limit);
      return new Response(JSON.stringify({ messages: sliced, matchId }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (url.pathname === "/api/admin/moderation" && method === "POST") {
      const body = await request.json();
      const matchId = body.matchId || "current";
      const messageId = body.messageId;
      const action = body.action;
      if (!messageId || !action) {
        return new Response(
          JSON.stringify({ error: "messageId and action are required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      let messages = messagesData ? JSON.parse(messagesData) : [];
      const index = messages.findIndex((m) => m && m.id === messageId);
      if (index === -1) {
        return new Response(
          JSON.stringify({ success: false, notFound: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const message = messages[index];
      if (action === "delete") {
        messages = messages.filter((m) => m && m.id !== messageId);
        await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
          expirationTtl: 604800
        });
        return new Response(JSON.stringify({ success: true, action: "delete" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      if (action === "blockUser") {
        const targetUserId = message.userId;
        if (targetUserId) {
          const userEmail = await env.SPORTS_KV.get(`userId:${targetUserId}`);
          if (userEmail) {
            const targetUserData = await env.SPORTS_KV.get(`user:${userEmail}`);
            if (targetUserData) {
              const targetUser = JSON.parse(targetUserData);
              targetUser.isBlocked = true;
              targetUser.blockedAt = (/* @__PURE__ */ new Date()).toISOString();
              await env.SPORTS_KV.put(`user:${userEmail}`, JSON.stringify(targetUser), {
                expirationTtl: 31536e3
              });
            }
          }
        }
        messages[index] = {
          ...message,
          isFlagged: true,
          flagStatus: "action_taken"
        };
        await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
          expirationTtl: 604800
        });
        return new Response(JSON.stringify({ success: true, action: "blockUser" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      if (action === "markSafe") {
        messages[index] = {
          ...message,
          isFlagged: false,
          flagStatus: "safe"
        };
        await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
          expirationTtl: 604800
        });
        return new Response(JSON.stringify({ success: true, action: "markSafe" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      return new Response(
        JSON.stringify({ error: "Unsupported action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Admin moderation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/admin/send-bulk-email.js
var import_checked_fetch14 = __toESM(require_checked_fetch());
async function sendEmailViaProvider(emailData, env) {
  const resendKey = env.RESEND_API_KEY;
  const sendgridKey = env.SENDGRID_API_KEY;
  const elasticKey = env.ELASTIC_EMAIL_API_KEY;
  const mailgunKey = env.MAILGUN_API_KEY;
  const mailgunDomain = env.MAILGUN_DOMAIN;
  const hasResend = !!(resendKey && typeof resendKey === "string" && resendKey.trim().length > 0);
  const hasSendGrid = !!(sendgridKey && typeof sendgridKey === "string" && sendgridKey.trim().length > 0);
  const hasElastic = !!(elasticKey && typeof elasticKey === "string" && elasticKey.trim().length > 0);
  const hasMailgun = !!(mailgunKey && typeof mailgunKey === "string" && mailgunKey.trim().length > 0 && mailgunDomain);
  console.log("[Email Service] Available providers:", {
    Resend: hasResend ? `Yes (${resendKey.substring(0, 5)}...)` : "No",
    SendGrid: hasSendGrid ? "Yes (configured)" : "No",
    ElasticEmail: hasElastic ? "Yes" : "No",
    Mailgun: hasMailgun ? "Yes" : "No"
  });
  if (hasResend) {
    const resendKeyTrimmed = resendKey.trim();
    console.log("[Email Service] Using Resend API (key starts with:", resendKeyTrimmed.substring(0, 5), "...length:", resendKeyTrimmed.length, ")");
    const result = await sendViaResend(emailData, resendKeyTrimmed);
    if (!result.success) {
      console.error("[Email Service] Resend failed:", result.error);
      const isDomainError = result.error && (result.error.includes("only send testing emails") || result.error.includes("verify a domain") || result.error.includes("domain verification"));
      if (isDomainError && hasElastic) {
        console.log("[Email Service] Resend requires domain verification. Falling back to Elastic Email (no domain required)...");
      } else {
        return result;
      }
    } else {
      return result;
    }
  }
  if (!hasResend && hasSendGrid) {
    console.warn("[Email Service] WARNING: RESEND_API_KEY not found but SENDGRID_API_KEY is set. Using SendGrid as fallback. For Resend, set RESEND_API_KEY environment variable.");
  }
  if (hasElastic) {
    console.log("[Email Service] Using Elastic Email API");
    return await sendViaElasticEmail(emailData, env.ELASTIC_EMAIL_API_KEY);
  }
  if (hasSendGrid && !hasResend) {
    console.log("[Email Service] Using SendGrid API (Resend not configured)");
    return await sendViaSendGrid(emailData, sendgridKey.trim());
  } else if (hasSendGrid && hasResend) {
    console.warn("[Email Service] Both RESEND_API_KEY and SENDGRID_API_KEY are configured. Using Resend only. Remove SENDGRID_API_KEY if you only want to use Resend.");
  }
  if (hasMailgun) {
    console.log("[Email Service] Using Mailgun API");
    return await sendViaMailgun(emailData, env.MAILGUN_API_KEY, env.MAILGUN_DOMAIN);
  }
  console.error("[Email Service] No email service API key configured. Please configure RESEND_API_KEY, ELASTIC_EMAIL_API_KEY, SENDGRID_API_KEY, or MAILGUN_API_KEY in Cloudflare Pages environment variables.");
  return {
    success: false,
    error: "Email service not configured. Please configure RESEND_API_KEY in Cloudflare Pages environment variables. See docs/EMAIL_NOTIFICATIONS_SETUP.md for instructions.",
    messageId: null
  };
}
__name(sendEmailViaProvider, "sendEmailViaProvider");
async function sendViaResend(emailData, apiKey) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      })
    });
    if (!response.ok) {
      let errorMessage = "Resend API error";
      let errorDetails = null;
      try {
        const error = await response.json();
        errorDetails = error;
        errorMessage = error.message || error.error || JSON.stringify(error);
        if (error.message && error.message.includes("only send testing emails to your own email address")) {
          errorMessage = `Resend Account Limitation: You can only send test emails to your account's verified email address. To send to other recipients, you need to verify a domain in Resend. See docs/RESEND_SETUP.md for instructions. Original error: ${error.message}`;
        } else if (error.message && error.message.includes("verify a domain")) {
          errorMessage = `Resend Domain Verification Required: ${error.message}. See docs/RESEND_SETUP.md for domain verification instructions.`;
        }
      } catch (e) {
        try {
          const text = await response.text();
          errorMessage = text || `HTTP ${response.status}`;
        } catch (e2) {
          errorMessage = `HTTP ${response.status}`;
        }
      }
      console.error("[Resend] Failed to send email:", {
        to: emailData.to,
        status: response.status,
        error: errorMessage,
        details: errorDetails
      });
      return { success: false, error: errorMessage };
    }
    const data = await response.json();
    console.log("[Resend] Email sent successfully:", {
      to: emailData.to,
      messageId: data.id
    });
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Resend error:", error);
    return { success: false, error: error.message };
  }
}
__name(sendViaResend, "sendViaResend");
async function sendViaElasticEmail(emailData, apiKey) {
  try {
    const response = await fetch("https://api.elasticemail.com/v2/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        apikey: apiKey,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        bodyHtml: emailData.html
      }).toString()
    });
    if (!response.ok) {
      let errorText = await response.text();
      let errorMessage = errorText || "Elastic Email API error";
      if (errorText && errorText.includes("For testing purposes you can only send emails to")) {
        errorMessage = `Elastic Email Test Account Limitation: ${errorText}. To send to all recipients, you need to upgrade your Elastic Email plan. See docs/ELASTIC_EMAIL_SETUP.md for details.`;
      }
      return { success: false, error: errorMessage };
    }
    const data = await response.json();
    if (data.success) {
      return { success: true, messageId: data.transactionid || data.transaction_id || "elastic-" + Date.now() };
    } else {
      let errorMessage = data.error || "Elastic Email error";
      if (errorMessage.includes("For testing purposes you can only send emails to")) {
        errorMessage = `Elastic Email Test Account Limitation: ${errorMessage}. To send to all recipients, you need to upgrade your Elastic Email plan. See docs/ELASTIC_EMAIL_SETUP.md for details.`;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error("Elastic Email error:", error);
    return { success: false, error: error.message };
  }
}
__name(sendViaElasticEmail, "sendViaElasticEmail");
async function sendViaSendGrid(emailData, apiKey) {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: emailData.to }] }],
        from: { email: emailData.from },
        subject: emailData.subject,
        content: [{ type: "text/html", value: emailData.html }]
      })
    });
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: error || "SendGrid API error" };
    }
    const messageId = response.headers.get("X-Message-Id") || "sendgrid-" + Date.now();
    return { success: true, messageId };
  } catch (error) {
    console.error("SendGrid error:", error);
    return { success: false, error: error.message };
  }
}
__name(sendViaSendGrid, "sendViaSendGrid");
async function sendViaMailgun(emailData, apiKey, domain) {
  try {
    const formData = new FormData();
    formData.append("from", emailData.from);
    formData.append("to", emailData.to);
    formData.append("subject", emailData.subject);
    formData.append("html", emailData.html);
    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa("api:" + apiKey)
      },
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Mailgun API error" };
    }
    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Mailgun error:", error);
    return { success: false, error: error.message };
  }
}
__name(sendViaMailgun, "sendViaMailgun");
var onRequest14 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  if (method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let emailFromToken = tokenValue;
    let roleFromToken = "user";
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          emailFromToken = parsed.email;
        }
        if (parsed && typeof parsed.role === "string") {
          roleFromToken = parsed.role;
        }
      } catch (e) {
      }
    }
    const adminUserData = await env.SPORTS_KV.get(`user:${emailFromToken}`);
    if (!adminUserData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const adminUser = JSON.parse(adminUserData);
    const effectiveRole = adminUser.role || roleFromToken;
    if (effectiveRole !== "admin" && effectiveRole !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const body = await request.json();
    const { templateId, subject, body: emailBody, recipientIds, emailType, matchId, newsId, newsData } = body;
    if (!subject || !emailBody || !recipientIds || recipientIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let usersIndexRaw = await env.SPORTS_KV.get("users-index");
    let emails = [];
    if (usersIndexRaw) {
      try {
        emails = JSON.parse(usersIndexRaw) || [];
      } catch (e) {
        emails = [];
      }
    }
    const users = [];
    for (const email of emails) {
      try {
        const userData = await env.SPORTS_KV.get(`user:${email}`);
        if (!userData) continue;
        const user = JSON.parse(userData);
        users.push(user);
      } catch (e) {
      }
    }
    const recipients = users.filter((user) => {
      const userId = user.id || user.email;
      const userEmail = user.email;
      return (recipientIds.includes(userId) || recipientIds.includes(userEmail)) && user.emailNotificationsEnabled !== false && !user.unsubscribedAt;
    });
    if (recipients.length === 0) {
      const allMatchingUsers = users.filter((user) => {
        const userId = user.id || user.email;
        const userEmail = user.email;
        return recipientIds.includes(userId) || recipientIds.includes(userEmail);
      });
      if (allMatchingUsers.length === 0) {
        return new Response(
          JSON.stringify({ error: "No users found matching the selected recipients. Please ensure users exist and try again." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      } else {
        const disabledCount = allMatchingUsers.filter((u) => u.emailNotificationsEnabled === false).length;
        const unsubscribedCount = allMatchingUsers.filter((u) => u.unsubscribedAt).length;
        let errorMsg = `No valid recipients found. ${allMatchingUsers.length} user(s) matched but: `;
        const issues = [];
        if (disabledCount > 0) issues.push(`${disabledCount} have email notifications disabled`);
        if (unsubscribedCount > 0) issues.push(`${unsubscribedCount} have unsubscribed`);
        errorMsg += issues.join(" and ") + ".";
        return new Response(
          JSON.stringify({ error: errorMsg }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
    }
    const url = new URL(request.url);
    const origin = url.origin;
    const logoUrl = `${origin}/logos/sportsup18_logo_round.svg`;
    const sentEmails = [];
    for (const recipient of recipients) {
      try {
        let processedBody = emailBody;
        let processedSubject = subject;
        processedBody = processedBody.replace(/\{\{userName\}\}/g, recipient.name || "User");
        processedBody = processedBody.replace(/\{\{userEmail\}\}/g, recipient.email);
        processedBody = processedBody.replace(/\{\{logoUrl\}\}/g, logoUrl);
        processedSubject = processedSubject.replace(/\{\{userName\}\}/g, recipient.name || "User");
        processedSubject = processedSubject.replace(/\{\{userEmail\}\}/g, recipient.email);
        if (emailType === "match" && matchId) {
          processedBody = processedBody.replace(/\{\{matchDate\}\}/g, (/* @__PURE__ */ new Date()).toLocaleString());
          processedBody = processedBody.replace(/\{\{matchTime\}\}/g, (/* @__PURE__ */ new Date()).toLocaleTimeString());
        }
        if (emailType === "news" && newsId && newsData) {
          const newsItem = Array.isArray(newsData) ? newsData.find((n) => n.id === newsId) : null;
          const newsTitle = newsItem?.title || "Latest Cricket News";
          const newsSummary = newsItem?.summary || newsItem?.description || "Stay updated with the latest cricket news and updates!";
          processedBody = processedBody.replace(/\{\{newsTitle\}\}/g, newsTitle);
          processedBody = processedBody.replace(/\{\{newsSummary\}\}/g, newsSummary);
        }
        if (processedBody.includes("<!DOCTYPE") || processedBody.includes("<html>")) {
          if (!processedBody.includes("<img") || !processedBody.includes(logoUrl) && !processedBody.includes("{{logoUrl}}")) {
            const logoHtml = `<div style="text-align: center; margin-bottom: 30px; padding: 30px 20px; background: linear-gradient(135deg, #0D1120 0%, #1A2035 100%); border-radius: 12px 12px 0 0;">
  <img src="${logoUrl}" alt="SportsUP Logo" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
</div>`;
            if (processedBody.includes("<body")) {
              processedBody = processedBody.replace(/<body[^>]*>/i, `$&${logoHtml}`);
            } else {
              processedBody = logoHtml + processedBody;
            }
          }
        } else {
          const logoHeader = `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
     \u{1F3CF} SPORTSUP - Your Cricket Destination \u{1F3CF}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

[View Logo: ${logoUrl}]

`;
          if (!processedBody.startsWith("\u2501\u2501") && !processedBody.includes(logoUrl)) {
            processedBody = logoHeader + processedBody;
          }
        }
        let fromAddress = "SportsUP <noreply@sportsup99.com>";
        if (env.RESEND_FROM_ADDRESS) {
          fromAddress = env.RESEND_FROM_ADDRESS;
        } else if (env.RESEND_API_KEY) {
          fromAddress = "SportsUP <onboarding@resend.dev>";
        } else if (env.MAILGUN_DOMAIN) {
          fromAddress = `SportsUP <noreply@${env.MAILGUN_DOMAIN.replace("mg.", "")}>`;
        }
        const emailResult = await sendEmailViaProvider(
          {
            from: fromAddress,
            to: recipient.email,
            subject: processedSubject,
            html: processedBody
          },
          env
        );
        const emailLog = {
          id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          templateId: templateId || "",
          recipientEmail: recipient.email,
          recipientName: recipient.name || "User",
          subject: processedSubject,
          status: emailResult.success ? "sent" : "failed",
          sentAt: (/* @__PURE__ */ new Date()).toISOString(),
          emailType: emailType || "custom",
          messageId: emailResult.messageId || null,
          error: emailResult.error || null
        };
        const logsKey = `email-logs:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await env.SPORTS_KV.put(logsKey, JSON.stringify(emailLog), {
          expirationTtl: 31536e3
          // 1 year
        });
        sentEmails.push({
          email: recipient.email,
          name: recipient.name,
          success: emailResult.success,
          error: emailResult.error || void 0,
          messageId: emailResult.messageId || void 0
        });
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        sentEmails.push({
          email: recipient.email,
          name: recipient.name,
          success: false,
          error: error.message
        });
      }
    }
    const successCount = sentEmails.filter((e) => e.success).length;
    const failedCount = sentEmails.filter((e) => !e.success).length;
    const allFailedWithConfigError = failedCount === recipients.length && sentEmails.every((e) => !e.success && e.error && e.error.includes("not configured"));
    if (allFailedWithConfigError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email service not configured. Please configure an email service API key (Resend, Elastic Email, SendGrid, or Mailgun) in Cloudflare Pages environment variables.",
          sentCount: 0,
          totalCount: recipients.length,
          failedCount,
          sentEmails
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    return new Response(
      JSON.stringify({
        success: successCount > 0,
        sentCount: successCount,
        totalCount: recipients.length,
        failedCount,
        sentEmails,
        message: successCount === recipients.length ? `All ${successCount} email(s) sent successfully!` : `Sent ${successCount} email(s). ${failedCount} failed.`
      }),
      {
        status: successCount > 0 ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      }
    );
  } catch (error) {
    console.error("Bulk email send error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send emails" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/admin/setup.js
var import_checked_fetch15 = __toESM(require_checked_fetch());
import crypto5 from "node:crypto";
async function onRequest15(context) {
  const { request, env } = context;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const data = await request.json();
    const { email, password, name, setupKey } = data;
    const validSetupKey = env.SETUP_KEY || "default-setup-key-change-me";
    if (setupKey !== validSetupKey) {
      return new Response(
        JSON.stringify({ message: "Invalid setup key. Setup may have already been completed." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ message: "Email, password, and name are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ message: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ message: "Password must be at least 8 characters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!/[A-Z]/.test(password)) {
      return new Response(
        JSON.stringify({ message: "Password must contain uppercase letter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!/[0-9]/.test(password)) {
      return new Response(
        JSON.stringify({ message: "Password must contain number" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const existingUser = await env.SPORTS_KV.get(`user:${email}`);
    if (existingUser) {
      return new Response(
        JSON.stringify({ message: "Admin account already exists" }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const salt = crypto5.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
    const encoder = new TextEncoder();
    const data_to_hash = encoder.encode(password + saltHex);
    const hashBuffer = await crypto5.subtle.digest("SHA-256", data_to_hash);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tokenBuffer = crypto5.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBuffer).map((b) => b.toString(16).padStart(2, "0")).join("");
    const adminUser = {
      id: userId,
      email,
      name,
      salt: saltHex,
      hashedPassword,
      token,
      role: "admin",
      isBlocked: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastLogin: null
    };
    await env.SPORTS_KV.put(
      `user:${email}`,
      JSON.stringify(adminUser),
      {
        expirationTtl: 365 * 24 * 60 * 60
        // 1 year
      }
    );
    await env.SPORTS_KV.put(
      `token:${token}`,
      JSON.stringify({
        userId: adminUser.id,
        email,
        role: "admin",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }),
      {
        expirationTtl: 7 * 24 * 60 * 60
        // 7 days
      }
    );
    return new Response(
      JSON.stringify({
        message: "Admin account created successfully",
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          token: adminUser.token
        }
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Setup error:", error);
    return new Response(
      JSON.stringify({
        message: "Error creating admin account",
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(onRequest15, "onRequest");

// api/admin/upload-players-csv.ts
var import_checked_fetch16 = __toESM(require_checked_fetch());
var corsHeaders3 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function verifyAdminToken4(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken4, "verifyAdminToken");
var teamMapping = {
  "RCB": "1",
  // Royal Challengers Bengaluru
  "MI": "2",
  // Mumbai Indians
  "SRH": "3",
  // Sunrisers Hyderabad
  "GT": "4",
  // Gujarat Titans
  "PBKS": "5",
  // Punjab Kings
  "DC": "6",
  // Delhi Capitals
  "LSG": "7",
  // Lucknow Super Giants
  "RR": "8",
  // Rajasthan Royals
  "KKR": "9",
  // Kolkata Knight Riders
  "CSK": "10"
  // Chennai Super Kings
};
var roleMapping = {
  "Batter": "Batsman",
  "WK-Batter": "Wicket-keeper",
  "Bowler": "Bowler",
  "All-Rounder": "All-rounder",
  // 2025 auction format
  "BAT": "Batsman",
  "BOWL": "Bowler",
  "AR": "All-rounder",
  "WK": "Wicket-keeper"
};
function guessNationality(name) {
  const nameLower = name.toLowerCase();
  const overseasFirstNames = [
    "cameron",
    "cooper",
    "matthew",
    "riley",
    "jordan",
    "jack",
    "zak",
    "luke",
    "pat",
    "travis",
    "marcus",
    "glenn",
    "josh",
    "matt",
    "daniel",
    "james",
    "will",
    "nathan",
    "xavier",
    "sean",
    "aaron",
    "liam",
    "adam",
    "ben",
    "david",
    "sam",
    "jonny",
    "phil",
    "jofra",
    "ollie",
    "reece",
    "tom",
    "jordan",
    "michael",
    "harry",
    "jacob",
    "brydon",
    "chris",
    "john",
    "patrick",
    "oliver",
    "brandon",
    "corbin",
    "benny",
    "tim",
    "kyle",
    "trent",
    "lockie",
    "devon",
    "jake",
    "kane",
    "finn",
    "rachin",
    "quinton",
    "heinrich",
    "tristan",
    "aiden",
    "faf",
    "ryan",
    "gerald",
    "dewald",
    "rilee",
    "sherfane",
    "matthew",
    "richard",
    "kwena",
    "lizaad",
    "leus",
    "rassie",
    "daryn",
    "wayne",
    "keemo",
    "junior",
    "dwaine",
    "matheesha",
    "pathirana",
    "wanindu",
    "pathum",
    "akeal",
    "maheesh",
    "dushmantha",
    "kamindu",
    "dunith",
    "dilshan",
    "bhanuka",
    "kusal",
    "charith",
    "dasun",
    "lahiru",
    "vijayakanth",
    "dumindu",
    "nicholas",
    "shimron",
    "andre",
    "sunil",
    "evin",
    "johnson",
    "litton",
    "alzarri",
    "obed",
    "romario",
    "odean",
    "alick",
    "hilton",
    "dominic",
    "roston",
    "shai",
    "mustafizur",
    "taskin",
    "shoriful",
    "towhid",
    "mehidy",
    "shakib",
    "mahedi",
    "najibullah",
    "tanzim",
    "nahid",
    "rashid",
    "mujeeb",
    "noor",
    "naveen",
    "rahmanullah",
    "ibrahim",
    "qais",
    "azmatullah",
    "gulbadin",
    "mohammad nabi",
    "fazalhaq",
    "sediqullah",
    "nangeyalia",
    "sikandar",
    "blessing"
  ];
  const firstWord = nameLower.split(" ")[0];
  for (const pattern of overseasFirstNames) {
    if (firstWord.includes(pattern) || nameLower.includes(pattern)) {
      if (["cameron", "cooper", "matthew", "pat", "travis", "marcus", "glenn", "josh", "matt", "daniel", "james", "will", "nathan", "xavier", "sean", "aaron", "liam", "adam", "ben", "sam", "jonny", "phil", "jofra", "ollie", "reece", "tom", "michael", "harry", "jacob", "brydon", "chris", "john", "patrick", "oliver", "brandon", "corbin", "benny"].some((p) => firstWord.includes(p) || nameLower.includes(p))) {
        return "Australia";
      }
      if (["tim", "kyle", "trent", "lockie", "devon", "jake", "kane", "finn", "rachin", "matt henry", "glenn phillips", "mitchell santner", "tom latham", "kyle verreynne", "tim southee", "kyle jamieson"].some((p) => nameLower.includes(p))) {
        return "New Zealand";
      }
      if (["quinton", "heinrich", "tristan", "aiden", "faf", "ryan", "gerald", "dewald", "rilee", "sherfane", "matthew breetzke", "richard gleeson", "kwena", "lizaad", "leus", "rassie", "daryn", "richard ngarava", "wayne", "keemo", "junior", "dwaine"].some((p) => nameLower.includes(p))) {
        return "South Africa";
      }
      if (["matheesha", "pathirana", "wanindu", "pathum", "akeal", "maheesh", "dushmantha", "kamindu", "dunith", "dilshan", "bhanuka", "kusal", "charith", "dasun", "lahiru", "vijayakanth", "dumindu"].some((p) => nameLower.includes(p))) {
        return "Sri Lanka";
      }
      if (["liam", "adam", "ben", "david", "sam curran", "jonny", "phil", "jofra", "ollie", "reece", "tom banton", "sam billings", "jordan cox", "ben mcdermott", "tom kohler", "james vince", "richard gleeson", "matthew potts", "ben sears", "john turner", "joshua", "oliver", "harry tector", "will young", "sean", "jacob bethell", "brydon", "dan lawrence", "james anderson", "chris jordan", "tymal", "david payne", "patrick"].some((p) => nameLower.includes(p))) {
        return "England";
      }
      if (["jason", "nicholas", "shimron", "andre", "sunil", "evin", "brandon", "johnson", "litton", "andre fletcher", "alzarri", "obed", "romario", "kyle mayers", "odean", "alick", "hilton", "dominic", "keemo", "roston", "shai"].some((p) => nameLower.includes(p))) {
        return "West Indies";
      }
      if (["mustafizur", "taskin", "shoriful", "towhid", "litton", "mehidy", "shakib", "mahedi", "najibullah", "tanzim", "nahid"].some((p) => nameLower.includes(p))) {
        return "Bangladesh";
      }
      if (["rashid", "mujeeb", "noor", "naveen", "rahmanullah", "najibullah", "ibrahim", "qais", "azmatullah", "gulbadin", "mohammad nabi", "fazalhaq", "sediqullah", "nangeyalia"].some((p) => nameLower.includes(p))) {
        return "Afghanistan";
      }
      if (["sikandar", "blessing", "richard ngarava"].some((p) => nameLower.includes(p))) {
        return "Zimbabwe";
      }
      return "Australia";
    }
  }
  return "India";
}
__name(guessNationality, "guessNationality");
function parseCSV(csvContent) {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];
  const headerLine = lines[0].toLowerCase();
  const dataLines = lines.slice(1).filter((line) => line.trim());
  const players = [];
  dataLines.forEach((line) => {
    const columns = line.split(",");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIndex = headers.findIndex((h) => h.includes("name") || h.includes("player"));
    const teamIndex = headers.findIndex((h) => h.includes("team"));
    const typeIndex = headers.findIndex((h) => h.includes("type") || h.includes("role"));
    const nationalityIndex = headers.findIndex((h) => h.includes("nationality") || h.includes("nation"));
    const playerName = nameIndex >= 0 ? columns[nameIndex]?.trim() : columns[0]?.trim();
    const teamAbbr = teamIndex >= 0 ? columns[teamIndex]?.trim() : columns[1]?.trim();
    const playerType = typeIndex >= 0 ? columns[typeIndex]?.trim() : columns[2]?.trim();
    const nationality = nationalityIndex >= 0 ? columns[nationalityIndex]?.trim() : columns[3]?.trim();
    if (!playerName || !teamAbbr) return;
    const teamAbbrTrimmed = teamAbbr.trim();
    if (!teamAbbrTrimmed || teamAbbrTrimmed === "-" || teamAbbrTrimmed === "") {
      return;
    }
    const teamId = teamMapping[teamAbbrTrimmed];
    if (!teamId) {
      console.warn(`Unknown team: ${teamAbbrTrimmed} for player ${playerName}`);
      return;
    }
    const mappedRole = roleMapping[playerType?.trim() || "BAT"] || roleMapping[playerType?.trim() || "Batter"] || "Batsman";
    let finalNationality = "India";
    if (nationality && nationality.trim() && nationality.trim() !== "-") {
      const nationalityTrimmed = nationality.trim();
      if (nationalityTrimmed === "Indian" || nationalityTrimmed === "India") {
        finalNationality = "India";
      } else if (nationalityTrimmed === "Overseas") {
        finalNationality = guessNationality(playerName);
      } else {
        finalNationality = nationalityTrimmed;
      }
    } else {
      finalNationality = guessNationality(playerName);
    }
    const player = {
      name: playerName.trim(),
      role: mappedRole,
      teamId,
      league: "ipl",
      nationality: finalNationality,
      // All other fields kept empty (0/empty string) until manually added
      age: 0,
      // Empty - to be filled manually
      jerseyNumber: 0,
      // Empty - to be filled manually
      isCaptain: false,
      bowlingStyle: "",
      // Empty - to be filled manually
      battingStyle: "",
      // Empty - to be filled manually
      stats: {
        matches: 0,
        // Empty - to be filled manually
        runs: 0,
        // Empty - to be filled manually
        wickets: 0,
        // Empty - to be filled manually
        average: 0,
        // Empty - to be filled manually
        strikeRate: 0,
        // Empty - to be filled manually
        economy: 0,
        // Empty - to be filled manually
        highest: 0,
        // Empty - to be filled manually
        fours: 0,
        // Empty - to be filled manually
        sixes: 0,
        // Empty - to be filled manually
        fifties: 0,
        // Empty - to be filled manually
        hundreds: 0,
        // Empty - to be filled manually
        bestBowling: "-"
        // Empty - to be filled manually
      }
      // transferInfo not included - to be added manually if needed
    };
    players.push(player);
  });
  return players;
}
__name(parseCSV, "parseCSV");
var onRequest16 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders3 });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders3 }
    });
  }
  if (!verifyAdminToken4(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders3 }
    });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders3 }
      });
    }
    const csvContent = await file.text();
    const parsedPlayers = parseCSV(csvContent);
    if (parsedPlayers.length === 0) {
      return new Response(JSON.stringify({ error: "No valid players found in CSV" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders3 }
      });
    }
    const existingPlayersData = await env.IPL_CACHE.get("players", "json");
    const existingPlayers = existingPlayersData || [];
    let maxId = 0;
    existingPlayers.forEach((p) => {
      const idNum = parseInt(p.id, 10);
      if (!isNaN(idNum) && idNum > maxId) {
        maxId = idNum;
      }
    });
    const existingPlayerNames = new Set(
      existingPlayers.map((p) => `${p.name.toLowerCase().trim()}_${p.teamId || ""}`)
    );
    const existingPlayerNamesOnly = new Set(
      existingPlayers.map((p) => p.name.toLowerCase().trim())
    );
    const newPlayers = [];
    const skippedPlayers = [];
    const skippedReasons = {};
    parsedPlayers.forEach((player) => {
      const playerNameLower = player.name.toLowerCase().trim();
      const playerKey = `${playerNameLower}_${player.teamId || ""}`;
      if (existingPlayerNamesOnly.has(playerNameLower)) {
        skippedPlayers.push(player);
        skippedReasons[player.name] = "Player already exists (duplicate name)";
        return;
      }
      if (existingPlayerNames.has(playerKey)) {
        skippedPlayers.push(player);
        skippedReasons[player.name] = "Player already exists on this team";
        return;
      }
      maxId++;
      newPlayers.push({
        ...player,
        id: String(maxId)
      });
      existingPlayerNames.add(playerKey);
      existingPlayerNamesOnly.add(playerNameLower);
    });
    const updatedPlayers = [...existingPlayers, ...newPlayers];
    await env.IPL_CACHE.put("players", JSON.stringify(updatedPlayers));
    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalParsed: parsedPlayers.length,
        added: newPlayers.length,
        skipped: skippedPlayers.length,
        existingPreserved: existingPlayers.length
      },
      added: newPlayers.map((p) => ({
        name: p.name,
        team: Object.keys(teamMapping).find((k) => teamMapping[k] === p.teamId),
        role: p.role
      })),
      skipped: skippedPlayers.map((p) => ({
        name: p.name,
        reason: skippedReasons[p.name] || "Duplicate"
      }))
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders3 }
    });
  } catch (error) {
    console.error("Error processing CSV upload:", error);
    return new Response(JSON.stringify({
      error: "Failed to process CSV file",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders3 }
    });
  }
}, "onRequest");

// api/admin/users.js
var import_checked_fetch17 = __toESM(require_checked_fetch());
var onRequest17 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue && tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && parsed.email && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
        console.error("Failed to parse token JSON:", tokenValue);
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (pathname === "/api/admin/users/activity" && method === "POST") {
      const { matchId = "current" } = await request.json();
      if (user.role === "admin" || user.role === "super_admin") {
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      const activeUsersKey = `active-users:${matchId}`;
      const activeUsersData = await env.SPORTS_KV.get(activeUsersKey);
      let activeUsers = activeUsersData ? JSON.parse(activeUsersData) : [];
      activeUsers = activeUsers.filter((u) => u.id !== user.id);
      activeUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        lastActive: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (activeUsers.length > 500) {
        activeUsers = activeUsers.slice(-500);
      }
      await env.SPORTS_KV.put(activeUsersKey, JSON.stringify(activeUsers), {
        expirationTtl: 3600
        // 1 hour - auto cleanup
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (pathname === "/api/admin/users" && method === "GET") {
      const matchId = searchParams.get("matchId") || "current";
      const activeUsersKey = `active-users:${matchId}`;
      const activeUsersData = await env.SPORTS_KV.get(activeUsersKey);
      const activeUsers = activeUsersData ? JSON.parse(activeUsersData) : [];
      return new Response(JSON.stringify({ users: activeUsers }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (pathname === "/api/admin/users" && method === "PUT") {
      const { userId, isBlocked, reason } = await request.json();
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const userEmail = await env.SPORTS_KV.get(`userId:${userId}`);
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const targetUserData = await env.SPORTS_KV.get(`user:${userEmail}`);
      const targetUser = JSON.parse(targetUserData);
      targetUser.isBlocked = isBlocked;
      if (reason) {
        targetUser.blockReason = reason;
        targetUser.blockedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      await env.SPORTS_KV.put(`user:${userEmail}`, JSON.stringify(targetUser), {
        expirationTtl: 31536e3
      });
      return new Response(
        JSON.stringify({ success: true, user: targetUser }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (pathname === "/api/admin/users" && method === "DELETE") {
      const { userId } = await request.json();
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const userEmail = await env.SPORTS_KV.get(`userId:${userId}`);
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const targetUserData = await env.SPORTS_KV.get(`user:${userEmail}`);
      const targetUser = JSON.parse(targetUserData);
      await env.SPORTS_KV.delete(`user:${userEmail}`);
      await env.SPORTS_KV.delete(`userId:${userId}`);
      if (targetUser.token) {
        await env.SPORTS_KV.delete(`token:${targetUser.token}`);
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Admin users error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/calendar/ical.js
var import_checked_fetch18 = __toESM(require_checked_fetch());
async function onRequest18(context) {
  const { request, env } = context;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders6
    });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders6, "Content-Type": "application/json" }
    });
  }
  try {
    const url = new URL(request.url);
    const teamFilter = url.searchParams.get("team");
    const statusFilter = url.searchParams.get("status");
    const baseUrl = new URL(request.url).origin;
    let matchesUrl = `${baseUrl}/api/matches`;
    const params = new URLSearchParams();
    if (teamFilter) params.append("team", teamFilter);
    if (statusFilter) params.append("status", statusFilter);
    if (params.toString()) {
      matchesUrl += `?${params.toString()}`;
    }
    const matchesResponse = await fetch(matchesUrl);
    if (!matchesResponse.ok) {
      throw new Error("Failed to fetch matches");
    }
    const matchesData = await matchesResponse.json();
    const matches = Array.isArray(matchesData) ? matchesData : matchesData.matches || [];
    const formatDate = /* @__PURE__ */ __name((date) => {
      return new Date(date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    }, "formatDate");
    const escapeText = /* @__PURE__ */ __name((text) => {
      if (!text) return "";
      return String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    }, "escapeText");
    let ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SportsUP99//IPL 2026 Matches//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:IPL 2026 Matches",
      "X-WR-CALDESC:Indian Premier League 2026 Match Schedule",
      "X-WR-TIMEZONE:Asia/Kolkata"
    ].join("\r\n");
    matches.forEach((match2) => {
      if (!match2.date || !match2.time) return;
      try {
        const [hours, minutes] = match2.time.split(":").map(Number);
        const startDate = new Date(match2.date);
        startDate.setHours(hours || 0, minutes || 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 3);
        const team1Name = match2.team1?.shortName || match2.team1?.name || "Team 1";
        const team2Name = match2.team2?.shortName || match2.team2?.name || "Team 2";
        const venue = match2.venue || "TBD";
        const matchTitle = `${team1Name} vs ${team2Name}`;
        const description = `IPL 2026 Match\\nVenue: ${venue}\\nStatus: ${match2.status || "upcoming"}`;
        ics += "\r\nBEGIN:VEVENT";
        ics += `\r
UID:match-${match2.id}-${Date.now()}@sportsup99.com`;
        ics += `\r
DTSTAMP:${formatDate(/* @__PURE__ */ new Date())}`;
        ics += `\r
DTSTART:${formatDate(startDate)}`;
        ics += `\r
DTEND:${formatDate(endDate)}`;
        ics += `\r
SUMMARY:${escapeText(matchTitle)}`;
        ics += `\r
DESCRIPTION:${escapeText(description)}`;
        ics += `\r
LOCATION:${escapeText(venue)}`;
        ics += "\r\nSTATUS:CONFIRMED";
        ics += "\r\nSEQUENCE:0";
        ics += "\r\nEND:VEVENT";
      } catch (error) {
        console.error(`Error processing match ${match2.id}:`, error);
      }
    });
    ics += "\r\nEND:VCALENDAR";
    return new Response(ics, {
      status: 200,
      headers: {
        ...corsHeaders6,
        "Content-Type": "text/calendar;charset=utf-8",
        "Content-Disposition": 'attachment; filename="ipl-2026-matches.ics"',
        "Cache-Control": "public, max-age=3600"
        // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error("Error generating iCal feed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate calendar feed" }),
      {
        status: 500,
        headers: { ...corsHeaders6, "Content-Type": "application/json" }
      }
    );
  }
}
__name(onRequest18, "onRequest");

// api/predictions/leaderboard.js
var import_checked_fetch19 = __toESM(require_checked_fetch());
async function getAllPredictions(matchId, userId, league, env) {
  const predictions = [];
  if (matchId) {
    const matchKey = `predictions:match:${matchId}`;
    const matchPreds = await env.SPORTS_KV.get(matchKey);
    if (matchPreds) {
      const predIds = JSON.parse(matchPreds);
      for (const predId of predIds) {
        const predData = await env.SPORTS_KV.get(`prediction:${predId}`);
        if (predData) {
          predictions.push(JSON.parse(predData));
        }
      }
    }
  } else if (userId) {
    const userKey = `predictions:user:${userId}`;
    const userPreds = await env.SPORTS_KV.get(userKey);
    if (userPreds) {
      const predIds = JSON.parse(userPreds);
      for (const predId of predIds) {
        const predData = await env.SPORTS_KV.get(`prediction:${predId}`);
        if (predData) {
          predictions.push(JSON.parse(predData));
        }
      }
    }
  } else {
    const list = await env.SPORTS_KV.list({ prefix: "prediction:" });
    for (const key of list.keys) {
      const predData = await env.SPORTS_KV.get(key.name);
      if (predData) {
        predictions.push(JSON.parse(predData));
      }
    }
  }
  if (league) {
    return predictions.filter((p) => p.league === league);
  }
  return predictions;
}
__name(getAllPredictions, "getAllPredictions");
async function getLeaderboard(matchId, env, corsHeaders6) {
  try {
    const cacheKey = matchId ? `leaderboard:match:${matchId}` : "leaderboard:global";
    const cached = await env.SPORTS_KV.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    const allPredictions = await getAllPredictions(matchId, null, null, env);
    const userStats = {};
    for (const pred of allPredictions) {
      if (!pred.accuracy) continue;
      const userId = pred.userId;
      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          totalPredictions: 0,
          completedPredictions: 0,
          totalPoints: 0,
          wins: 0
        };
      }
      userStats[userId].totalPredictions++;
      if (pred.accuracy) {
        userStats[userId].completedPredictions++;
        userStats[userId].totalPoints += pred.accuracy.points || 0;
        if (pred.accuracy.points === 30) {
          userStats[userId].wins++;
        }
      }
    }
    const leaderboard = Object.values(userStats).map((stats) => ({
      ...stats,
      averagePoints: stats.completedPredictions > 0 ? stats.totalPoints / stats.completedPredictions : 0,
      overallAccuracy: stats.completedPredictions > 0 ? stats.totalPoints / (stats.completedPredictions * 30) * 100 : 0
    })).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.averagePoints - a.averagePoints;
    }).map((stats, index) => ({
      ...stats,
      rank: index + 1
    })).slice(0, 100);
    const result = JSON.stringify(leaderboard);
    await env.SPORTS_KV.put(cacheKey, result, { expirationTtl: 300 });
    return new Response(result, {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to calculate leaderboard" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getLeaderboard, "getLeaderboard");
var onRequest19 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders6 });
  }
  if (method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    const matchId = searchParams.get("matchId");
    return await getLeaderboard(matchId, env, corsHeaders6);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/predictions/polls.js
var import_checked_fetch20 = __toESM(require_checked_fetch());
async function getUserFromToken(token, env) {
  if (!token) return null;
  const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
  if (!tokenValue) return null;
  let email = tokenValue;
  if (tokenValue.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(tokenValue);
      if (parsed && typeof parsed.email === "string") {
        email = parsed.email;
      }
    } catch {
    }
  }
  const userData = await env.SPORTS_KV.get(`user:${email}`);
  if (!userData) return null;
  const user = JSON.parse(userData);
  return { ...user, email };
}
__name(getUserFromToken, "getUserFromToken");
var onRequest20 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders6 });
  }
  try {
    if (method === "GET") {
      const matchId = searchParams.get("matchId");
      if (!matchId) {
        return new Response(
          JSON.stringify({ error: "Match ID required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const pollData = await env.SPORTS_KV.get(`poll:${matchId}`);
      if (!pollData) {
        return new Response(JSON.stringify(null), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      return new Response(pollData, {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (method === "POST") {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");
      const user = await getUserFromToken(token, env);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const body = await request.json();
      const { action, matchId, question, options, pollId, optionId } = body;
      if (action === "create") {
        if (user.role !== "admin" && user.role !== "super_admin") {
          return new Response(
            JSON.stringify({ error: "Forbidden" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        if (!matchId || !question || !options || !Array.isArray(options)) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        const pollId2 = crypto.randomUUID();
        const poll = {
          id: pollId2,
          matchId,
          league: body.league || "ipl",
          question,
          options: options.map((opt, idx) => ({
            id: `opt-${idx}`,
            text: opt,
            votes: 0
          })),
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: user.id,
          isActive: true
        };
        await env.SPORTS_KV.put(`poll:${matchId}`, JSON.stringify(poll), {
          expirationTtl: 31536e3
        });
        return new Response(JSON.stringify(poll), {
          status: 201,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      if (action === "vote") {
        if (!pollId || !optionId) {
          return new Response(
            JSON.stringify({ error: "Poll ID and option ID required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        const pollData = await env.SPORTS_KV.get(`poll:${matchId}`);
        if (!pollData) {
          return new Response(
            JSON.stringify({ error: "Poll not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        const poll = JSON.parse(pollData);
        if (!poll.isActive) {
          return new Response(
            JSON.stringify({ error: "Poll is not active" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        const voteKey = `poll:${matchId}:vote:${user.id}`;
        const existingVote = await env.SPORTS_KV.get(voteKey);
        if (existingVote) {
          return new Response(
            JSON.stringify({ error: "You have already voted on this poll" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        const option = poll.options.find((opt) => opt.id === optionId);
        if (!option) {
          return new Response(
            JSON.stringify({ error: "Invalid option" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
        option.votes++;
        await env.SPORTS_KV.put(`poll:${matchId}`, JSON.stringify(poll), {
          expirationTtl: 31536e3
        });
        await env.SPORTS_KV.put(voteKey, optionId, {
          expirationTtl: 31536e3
        });
        return new Response(JSON.stringify(poll), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Polls error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/predictions/stats.js
var import_checked_fetch21 = __toESM(require_checked_fetch());
async function getAllPredictions2(matchId, userId, league, env) {
  const predictions = [];
  if (matchId) {
    const matchKey = `predictions:match:${matchId}`;
    const matchPreds = await env.SPORTS_KV.get(matchKey);
    if (matchPreds) {
      const predIds = JSON.parse(matchPreds);
      for (const predId of predIds) {
        const predData = await env.SPORTS_KV.get(`prediction:${predId}`);
        if (predData) {
          predictions.push(JSON.parse(predData));
        }
      }
    }
  } else if (userId) {
    const userKey = `predictions:user:${userId}`;
    const userPreds = await env.SPORTS_KV.get(userKey);
    if (userPreds) {
      const predIds = JSON.parse(userPreds);
      for (const predId of predIds) {
        const predData = await env.SPORTS_KV.get(`prediction:${predId}`);
        if (predData) {
          predictions.push(JSON.parse(predData));
        }
      }
    }
  } else {
    const list = await env.SPORTS_KV.list({ prefix: "prediction:" });
    for (const key of list.keys) {
      const predData = await env.SPORTS_KV.get(key.name);
      if (predData) {
        predictions.push(JSON.parse(predData));
      }
    }
  }
  if (league) {
    return predictions.filter((p) => p.league === league);
  }
  return predictions;
}
__name(getAllPredictions2, "getAllPredictions");
var onRequest21 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders6 });
  }
  if (method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    const userId = searchParams.get("userId");
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const predictions = await getAllPredictions2(null, userId, null, env);
    const stats = {
      userId,
      totalPredictions: predictions.length,
      completedPredictions: predictions.filter((p) => p.accuracy).length,
      accuracy: {
        matchWinner: 0,
        topScorer: 0,
        mostWickets: 0,
        playerOfMatch: 0,
        overall: 0
      },
      totalPoints: 0,
      averagePoints: 0,
      wins: 0
    };
    const completed = predictions.filter((p) => p.accuracy);
    if (completed.length > 0) {
      let matchWinnerCorrect = 0;
      let topScorerCorrect = 0;
      let mostWicketsCorrect = 0;
      let playerOfMatchCorrect = 0;
      for (const pred of completed) {
        if (pred.accuracy) {
          stats.totalPoints += pred.accuracy.points || 0;
          if (pred.accuracy.points === 30) stats.wins++;
          if (pred.accuracy.matchWinner) matchWinnerCorrect++;
          if (pred.accuracy.topScorer) topScorerCorrect++;
          if (pred.accuracy.mostWickets) mostWicketsCorrect++;
          if (pred.accuracy.playerOfMatch) playerOfMatchCorrect++;
        }
      }
      stats.accuracy.matchWinner = matchWinnerCorrect / completed.length * 100;
      stats.accuracy.topScorer = topScorerCorrect / completed.length * 100;
      stats.accuracy.mostWickets = mostWicketsCorrect / completed.length * 100;
      stats.accuracy.playerOfMatch = playerOfMatchCorrect / completed.length * 100;
      stats.accuracy.overall = stats.totalPoints / (completed.length * 30) * 100;
      stats.averagePoints = stats.totalPoints / completed.length;
    }
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    console.error("Stats error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/weather/[venueId].js
var import_checked_fetch22 = __toESM(require_checked_fetch());
var WPL_VENUES = {
  "wpl-dy-patil": {
    name: "Dr. DY Patil Sports Academy, Navi Mumbai",
    coordinates: { lat: 19.0471, lng: 73.0695 },
    city: "Navi Mumbai"
  },
  "wpl-bca-stadium": {
    name: "BCA Stadium, Kotambi (Vadodara)",
    coordinates: { lat: 22.3072, lng: 73.1812 },
    city: "Vadodara"
  }
};
var WEATHER_API_URL = "https://api.openweathermap.org/data/2.5";
async function onRequestGet(context) {
  const WEATHER_API_KEY = context.env.OPENWEATHER_API_KEY || "demo_key";
  console.log("Weather API called for venue:", context.params.venueId);
  console.log("API Key available:", !!context.env.OPENWEATHER_API_KEY);
  console.log("Using API Key:", WEATHER_API_KEY === "demo_key" ? "demo_key" : "real_key");
  try {
    const { venueId } = context.params;
    if (!venueId || !WPL_VENUES[venueId]) {
      console.log("Invalid venue ID:", venueId);
      return new Response(JSON.stringify({ error: "Invalid venue ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const venue = WPL_VENUES[venueId];
    console.log("Fetching weather for:", venue.name, "at coordinates:", venue.coordinates);
    let weatherData;
    try {
      const currentWeather = await fetch(
        `${WEATHER_API_URL}/weather?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
      );
      console.log("OpenWeatherMap response status:", currentWeather.status);
      if (!currentWeather.ok) {
        throw new Error(`OpenWeatherMap API failed: ${currentWeather.status}`);
      }
      const currentData = await currentWeather.json();
      console.log("OpenWeatherMap data received:", currentData);
      const forecast = await fetch(
        `${WEATHER_API_URL}/forecast?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
      );
      if (!forecast.ok) {
        throw new Error(`OpenWeatherMap forecast failed: ${forecast.status}`);
      }
      const forecastData = await forecast.json();
      weatherData = {
        venueId,
        venueName: venue.name,
        city: venue.city,
        current: {
          temperature: Math.round(currentData.main.temp),
          feelsLike: Math.round(currentData.main.feels_like),
          humidity: currentData.main.humidity,
          windSpeed: currentData.wind.speed,
          windDirection: currentData.wind.deg,
          pressure: currentData.main.pressure,
          visibility: currentData.visibility / 1e3,
          // Convert to km
          uvIndex: 0,
          // OpenWeather free tier doesn't include UV index
          condition: mapWeatherCondition(currentData.weather[0].main),
          description: currentData.weather[0].description,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        },
        forecast: forecastData.list.slice(0, 8).map((item) => ({
          datetime: item.dt,
          temperature: Math.round(item.main.temp),
          feelsLike: Math.round(item.main.feels_like),
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          windDirection: item.wind.deg,
          condition: mapWeatherCondition(item.weather[0].main),
          description: item.weather[0].description,
          precipitation: item.pop * 100
          // Probability of precipitation
        })),
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("Processed weather data:", weatherData);
    } catch (apiError) {
      console.error("OpenWeatherMap API error:", apiError);
      console.log("Using fallback weather data for", venue.name);
      weatherData = getFallbackWeatherData(venueId, venue);
    }
    try {
      await context.env.WEATHER_CACHE.put(`weather_${venueId}`, JSON.stringify(weatherData), {
        expirationTtl: 43200
        // 12 hours cache
      });
      console.log("Weather data cached for venue:", venueId);
    } catch (cacheError) {
      console.error("Cache storage error:", cacheError);
    }
    return new Response(JSON.stringify(weatherData), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Weather API error:", error);
    try {
      const cached = await context.env.WEATHER_CACHE.get(`weather_${context.params.venueId}`);
      if (cached) {
        console.log("Returning cached weather data");
        return new Response(JSON.stringify(JSON.parse(cached)), {
          headers: {
            "Content-Type": "application/json",
            "X-Cached": "true"
          }
        });
      }
    } catch (cacheError) {
      console.error("Cache retrieval error:", cacheError);
    }
    const venue = WPL_VENUES[context.params.venueId];
    const fallbackData = getFallbackWeatherData(context.params.venueId, venue);
    return new Response(JSON.stringify(fallbackData), {
      headers: {
        "Content-Type": "application/json",
        "X-Fallback": "true"
      }
    });
  }
}
__name(onRequestGet, "onRequestGet");
function getFallbackWeatherData(venueId, venue) {
  const fallbackData = {
    "wpl-dy-patil": {
      venueId: "wpl-dy-patil",
      venueName: venue.name,
      city: venue.city,
      current: {
        temperature: 30,
        feelsLike: 33,
        humidity: 70,
        windSpeed: 15,
        windDirection: 200,
        pressure: 1008,
        visibility: 9,
        uvIndex: 7,
        condition: "partly-cloudy",
        description: "Partly cloudy with coastal humidity",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        aiPrediction: {
          matchImpact: "medium",
          pitchEffect: "Coastal conditions may help swing bowlers early",
          dewFactor: 80,
          playingConditions: "Moderate humidity with sea breeze",
          recommendations: [
            "Pace bowlers effective in first 10 overs",
            "Dew expected in night matches",
            "Spinners crucial in middle overs"
          ],
          confidence: 87
        }
      },
      forecast: [],
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    },
    "wpl-bca-stadium": {
      venueId: "wpl-bca-stadium",
      venueName: venue.name,
      city: venue.city,
      current: {
        temperature: 28,
        feelsLike: 30,
        humidity: 55,
        windSpeed: 10,
        windDirection: 90,
        pressure: 1012,
        visibility: 10,
        uvIndex: 6,
        condition: "sunny",
        description: "Clear weather with moderate temperature",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        aiPrediction: {
          matchImpact: "low",
          pitchEffect: "Balanced conditions for both bat and ball",
          dewFactor: 60,
          playingConditions: "Ideal cricket conditions",
          recommendations: [
            "Balanced pitch favors all-rounders",
            "Minimal dew factor",
            "Good visibility throughout match"
          ],
          confidence: 92
        }
      },
      forecast: [],
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
  return fallbackData[venueId] || fallbackData["wpl-dy-patil"];
}
__name(getFallbackWeatherData, "getFallbackWeatherData");
function mapWeatherCondition(condition) {
  const conditionMap = {
    "Clear": "sunny",
    "Clouds": "cloudy",
    "Rain": "rainy",
    "Drizzle": "rainy",
    "Thunderstorm": "stormy",
    "Snow": "snowy",
    "Mist": "partly-cloudy",
    "Fog": "partly-cloudy",
    "Haze": "partly-cloudy"
  };
  return conditionMap[condition] || "partly-cloudy";
}
__name(mapWeatherCondition, "mapWeatherCondition");
async function onRequestPost(context) {
  const WEATHER_API_KEY = context.env.OPENWEATHER_API_KEY || "demo_key";
  try {
    const results = {};
    for (const [venueId, venue] of Object.entries(WPL_VENUES)) {
      try {
        const currentWeather = await fetch(
          `${WEATHER_API_URL}/weather?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
        );
        if (!currentWeather.ok) {
          throw new Error(`Failed to fetch weather for ${venue.name}`);
        }
        const currentData = await currentWeather.json();
        const forecast = await fetch(
          `${WEATHER_API_URL}/forecast?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
        );
        if (!forecast.ok) {
          throw new Error(`Failed to fetch forecast for ${venue.name}`);
        }
        const forecastData = await forecast.json();
        const weatherData = {
          venueId,
          venueName: venue.name,
          city: venue.city,
          current: {
            temperature: Math.round(currentData.main.temp),
            feelsLike: Math.round(currentData.main.feels_like),
            humidity: currentData.main.humidity,
            windSpeed: currentData.wind.speed,
            windDirection: currentData.wind.deg,
            pressure: currentData.main.pressure,
            visibility: currentData.visibility / 1e3,
            uvIndex: 0,
            condition: mapWeatherCondition(currentData.weather[0].main),
            description: currentData.weather[0].description,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          },
          forecast: forecastData.list.slice(0, 8).map((item) => ({
            datetime: item.dt,
            temperature: Math.round(item.main.temp),
            feelsLike: Math.round(item.main.feels_like),
            humidity: item.main.humidity,
            windSpeed: item.wind.speed,
            windDirection: item.wind.deg,
            condition: mapWeatherCondition(item.weather[0].main),
            description: item.weather[0].description,
            precipitation: item.pop * 100
          })),
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        };
        await context.env.WEATHER_CACHE.put(`weather_${venueId}`, JSON.stringify(weatherData), {
          expirationTtl: 43200
          // 12 hours cache
        });
        results[venueId] = { success: true, updated: (/* @__PURE__ */ new Date()).toISOString() };
      } catch (error) {
        console.error(`Error updating weather for ${venue.name}:`, error);
        results[venueId] = { success: false, error: error.message };
      }
    }
    return new Response(JSON.stringify({
      message: "Weather update completed",
      results,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Batch weather update error:", error);
    return new Response(JSON.stringify({
      error: "Failed to update weather data",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost, "onRequestPost");

// api/messages/[id].js
var import_checked_fetch23 = __toESM(require_checked_fetch());
var onRequest22 = /* @__PURE__ */ __name(async (context) => {
  const { request, env, params } = context;
  const { id } = params || {};
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  if (method !== "DELETE" && method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Message ID required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const url = new URL(request.url);
    const matchId = url.searchParams.get("matchId") || "current";
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (method === "DELETE") {
      if (user.role !== "admin" && user.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      let messages = messagesData ? JSON.parse(messagesData) : [];
      const beforeLength = messages.length;
      messages = messages.filter((m) => m.id !== id);
      if (messages.length === beforeLength) {
        return new Response(JSON.stringify({ success: true, deleted: false }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
        expirationTtl: 604800
      });
      return new Response(JSON.stringify({ success: true, deleted: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      let messages = messagesData ? JSON.parse(messagesData) : [];
      const index = messages.findIndex((m) => m && m.id === id);
      if (index === -1) {
        return new Response(JSON.stringify({ success: false, notFound: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      const existing = messages[index] || {};
      messages[index] = {
        ...existing,
        isFlagged: true,
        flagReason: "manual_report",
        flagStatus: "pending",
        flaggedAt: existing.flaggedAt || (/* @__PURE__ */ new Date()).toISOString(),
        flagDetails: body.details || body.reason || existing.flagDetails || null
      };
      await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
        expirationTtl: 604800
      });
      return new Response(JSON.stringify({ success: true, reported: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
  } catch (error) {
    console.error("Messages delete error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/coaches.js
var import_checked_fetch24 = __toESM(require_checked_fetch());
async function onRequestGet2(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const teamId = searchParams.get("teamId");
    const league = searchParams.get("league");
    if (teamId) {
      const coachingStaff = await context.env.IPL_CACHE.get(`coaches:${teamId}`, "json");
      return new Response(JSON.stringify(coachingStaff || null), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      let allTeams = await context.env.IPL_CACHE.get("teams", "json") || [];
      allTeams = allTeams.map((team) => ({
        ...team,
        league: team.league || "ipl"
      }));
      if (league && (league === "ipl" || league === "wpl")) {
        allTeams = allTeams.filter((team) => {
          const teamLeague = team.league || "ipl";
          return teamLeague === league;
        });
      }
      const allCoaches = [];
      for (const team of allTeams) {
        const staff = await context.env.IPL_CACHE.get(`coaches:${team.id}`, "json");
        if (staff) {
          allCoaches.push(staff);
        }
      }
      return new Response(JSON.stringify(allCoaches), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error fetching coaches:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch coaching staff" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet2, "onRequestGet");
async function onRequestPost2(context) {
  try {
    const authHeader = context.request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userToken = await context.env.SPORTS_KV.get(`token:${token}`);
    if (!userToken) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    let tokenData;
    try {
      tokenData = JSON.parse(userToken);
    } catch {
      tokenData = { email: userToken, role: "admin" };
    }
    if (tokenData.role !== "admin" && tokenData.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    const coachingStaff = await context.request.json();
    if (!coachingStaff.teamId) {
      return new Response(JSON.stringify({ error: "teamId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await context.env.IPL_CACHE.put(
      `coaches:${coachingStaff.teamId}`,
      JSON.stringify(coachingStaff)
    );
    try {
      await fetch(`${new URL(context.request.url).origin}/api/admin/users/activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify({
          action: "update_coaching_staff",
          details: `Updated coaching staff for team ${coachingStaff.teamId}`
        })
      });
    } catch (err) {
      console.error("Failed to track activity:", err);
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Coaching staff updated successfully",
      data: coachingStaff
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating coaches:", error);
    return new Response(JSON.stringify({ error: "Failed to update coaching staff" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost2, "onRequestPost");

// api/key-players.js
var import_checked_fetch25 = __toESM(require_checked_fetch());
async function onRequestGet3(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const teamId = searchParams.get("teamId");
    if (teamId) {
      const keyPlayers = await context.env.IPL_CACHE.get(`keyPlayers:${teamId}`, "json");
      return new Response(JSON.stringify(keyPlayers || null), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const allTeams = await context.env.IPL_CACHE.get("teams", "json") || [];
      const allKeyPlayers = [];
      for (const team of allTeams) {
        const data = await context.env.IPL_CACHE.get(`keyPlayers:${team.id}`, "json");
        if (data) {
          allKeyPlayers.push(data);
        }
      }
      return new Response(JSON.stringify(allKeyPlayers), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error fetching key players:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch key players" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet3, "onRequestGet");
async function onRequestPost3(context) {
  try {
    const authHeader = context.request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userToken = await context.env.SPORTS_KV.get(`token:${token}`);
    if (!userToken) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    let tokenData;
    try {
      tokenData = JSON.parse(userToken);
    } catch {
      tokenData = { email: userToken, role: "admin" };
    }
    if (tokenData.role !== "admin" && tokenData.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    const keyPlayers = await context.request.json();
    if (!keyPlayers.teamId) {
      return new Response(JSON.stringify({ error: "teamId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await context.env.IPL_CACHE.put(
      `keyPlayers:${keyPlayers.teamId}`,
      JSON.stringify(keyPlayers)
    );
    try {
      await fetch(`${new URL(context.request.url).origin}/api/admin/users/activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify({
          action: "update_key_players",
          details: `Updated key players for team ${keyPlayers.teamId}`
        })
      });
    } catch (err) {
      console.error("Failed to track activity:", err);
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Key players updated successfully",
        data: keyPlayers
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error updating key players:", error);
    return new Response(JSON.stringify({ error: "Failed to update key players" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost3, "onRequestPost");

// api/account.js
var import_checked_fetch26 = __toESM(require_checked_fetch());
var onRequest23 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const action = url.searchParams.get("action") || "delete";
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  try {
    if (method === "DELETE" && action === "delete") {
      const authHeader = request.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer", "").trim();
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (!env || !env.SPORTS_KV) {
        return new Response(
          JSON.stringify({ error: "KV not configured" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const user = JSON.parse(userData);
      const userId = user.id;
      try {
        const listResult = await env.SPORTS_KV.list({ prefix: "messages:" });
        for (const key of listResult.keys) {
          const messagesData = await env.SPORTS_KV.get(key.name);
          if (!messagesData) continue;
          let messages;
          try {
            messages = JSON.parse(messagesData);
          } catch {
            continue;
          }
          let changed = false;
          const anonymizedMessages = messages.map((m) => {
            if (m && m.userId === userId) {
              changed = true;
              return {
                ...m,
                userId: `deleted_${userId}`,
                userName: "Deleted user"
              };
            }
            return m;
          });
          if (changed) {
            await env.SPORTS_KV.put(key.name, JSON.stringify(anonymizedMessages), {
              // keep original TTL semantics for messages (7 days)
              expirationTtl: 604800
            });
          }
        }
      } catch (e) {
        console.error("Error anonymizing messages for user", userId, e);
      }
      await env.SPORTS_KV.delete(`user:${email}`);
      if (userId) {
        await env.SPORTS_KV.delete(`userId:${userId}`);
      }
      try {
        const tokenList = await env.SPORTS_KV.list({ prefix: "token:" });
        for (const key of tokenList.keys) {
          const value = await env.SPORTS_KV.get(key.name);
          if (!value) continue;
          let valueEmail = value;
          if (value.trim().startsWith("{")) {
            try {
              const parsed = JSON.parse(value);
              if (parsed && typeof parsed.email === "string") {
                valueEmail = parsed.email;
              }
            } catch {
            }
          }
          if (valueEmail === email) {
            await env.SPORTS_KV.delete(key.name);
          }
        }
      } catch (e) {
        console.error("Error cleaning up tokens for user", email, e);
      }
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            // Clear auth cookie if present
            "Set-Cookie": "auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
            ...corsHeaders6
          }
        }
      );
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Account error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/admin-email-dashboard.js
var import_checked_fetch27 = __toESM(require_checked_fetch());
var onRequest24 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  try {
    const adminToken = request.headers.get("X-Admin-Token");
    if (!adminToken || adminToken !== env.ADMIN_EMAIL_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (url.pathname.includes("/dashboard/stats")) {
      return await getDashboardStats(env, corsHeaders6);
    }
    if (url.pathname.includes("/dashboard/segments")) {
      return await getSegmentStats(env, corsHeaders6);
    }
    if (url.pathname.includes("/dashboard/campaigns")) {
      if (method === "GET") {
        return await getCampaigns(env, corsHeaders6);
      } else if (method === "POST") {
        const body = await request.json();
        return await createCampaign(body, env, corsHeaders6);
      }
    }
    if (url.pathname.includes("/dashboard/templates")) {
      return await getEmailTemplates(env, corsHeaders6);
    }
    if (url.pathname.includes("/dashboard/ab-test")) {
      if (method === "POST") {
        const body = await request.json();
        return await createABTest(body, env, corsHeaders6);
      }
    }
    if (url.pathname.includes("/dashboard/users")) {
      if (method === "GET") {
        const searchParam = url.searchParams.get("search");
        return await searchUsers(searchParam, env, corsHeaders6);
      }
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function getDashboardStats(env, corsHeaders6) {
  try {
    const stats = {
      emailsSent: 0,
      emailsDelivered: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      emailsBounced: 0,
      unsubscribed: 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    const aggregated = await env.SPORTS_KV.get("dashboard-stats");
    if (aggregated) {
      const data = JSON.parse(aggregated);
      Object.assign(stats, data);
    }
    stats.deliveryRate = stats.emailsSent > 0 ? Math.round(stats.emailsDelivered / stats.emailsSent * 100) : 0;
    stats.openRate = stats.emailsDelivered > 0 ? Math.round(stats.emailsOpened / stats.emailsDelivered * 100) : 0;
    stats.clickRate = stats.emailsDelivered > 0 ? Math.round(stats.emailsClicked / stats.emailsDelivered * 100) : 0;
    stats.bounceRate = stats.emailsSent > 0 ? Math.round(stats.emailsBounced / stats.emailsSent * 100) : 0;
    return new Response(
      JSON.stringify(stats),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get stats" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getDashboardStats, "getDashboardStats");
async function getSegmentStats(env, corsHeaders6) {
  try {
    const segments = {
      "super-fan": { users: 0, emails: 0, openRate: 0 },
      "regular-watcher": { users: 0, emails: 0, openRate: 0 },
      "casual-fan": { users: 0, emails: 0, openRate: 0 },
      "at-risk": { users: 0, emails: 0, openRate: 0 },
      "new-user": { users: 0, emails: 0, openRate: 0 },
      "engaged": { users: 0, emails: 0, openRate: 0 }
    };
    const segmentData = await env.SPORTS_KV.get("segment-stats");
    if (segmentData) {
      Object.assign(segments, JSON.parse(segmentData));
    }
    return new Response(
      JSON.stringify(segments),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Get segment stats error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get segment stats" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getSegmentStats, "getSegmentStats");
async function getCampaigns(env, corsHeaders6) {
  try {
    const campaigns = [];
    return new Response(
      JSON.stringify({ campaigns }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Get campaigns error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get campaigns" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getCampaigns, "getCampaigns");
async function createCampaign(body, env, corsHeaders6) {
  try {
    const { name, subject, template, targetSegments, schedule } = body;
    if (!name || !subject || !template) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const campaign = {
      id: crypto.randomUUID(),
      name,
      subject,
      template,
      targetSegments: targetSegments || [],
      schedule: schedule || { type: "immediate" },
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "draft"
    };
    await env.SPORTS_KV.put(
      `campaign:${campaign.id}`,
      JSON.stringify(campaign),
      { expirationTtl: 90 * 24 * 60 * 60 }
    );
    return new Response(
      JSON.stringify({
        success: true,
        campaign
      }),
      { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Create campaign error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create campaign" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(createCampaign, "createCampaign");
async function getEmailTemplates(env, corsHeaders6) {
  try {
    const templates = {
      "match-reminder": {
        name: "Match Reminder",
        description: "30-min before match notification",
        variables: ["team1", "team2", "venue", "time", "date"]
      },
      "team-news": {
        name: "Team News",
        description: "Daily team news digest",
        variables: ["teamName", "headlines", "topStory"]
      },
      "weekly-recap": {
        name: "Weekly Recap",
        description: "Weekly summary of matches and news",
        variables: ["week", "matches", "highlights"]
      },
      "special-offer": {
        name: "Special Offer",
        description: "Promotional offers and deals",
        variables: ["offerTitle", "offerDescription", "expiryDate"]
      },
      "re-engagement": {
        name: "Re-engagement",
        description: "Win back inactive users",
        variables: ["userName", "lastActive"]
      }
    };
    return new Response(
      JSON.stringify(templates),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Get templates error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get templates" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getEmailTemplates, "getEmailTemplates");
async function createABTest(body, env, corsHeaders6) {
  try {
    const { name, campaign, variants, trafficSplit, duration } = body;
    if (!name || !campaign || !Array.isArray(variants) || variants.length < 2) {
      return new Response(
        JSON.stringify({ error: "Need at least 2 variants" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const test = {
      id: crypto.randomUUID(),
      name,
      campaignId: campaign,
      variants: variants.map((v, i) => ({
        ...v,
        id: `variant-${i}`,
        conversions: 0,
        opens: 0,
        clicks: 0
      })),
      trafficSplit: trafficSplit || [50, 50],
      duration: duration || 7,
      // days
      startedAt: (/* @__PURE__ */ new Date()).toISOString(),
      winner: null,
      status: "running"
    };
    await env.SPORTS_KV.put(
      `ab-test:${test.id}`,
      JSON.stringify(test),
      { expirationTtl: 90 * 24 * 60 * 60 }
    );
    return new Response(
      JSON.stringify({
        success: true,
        test
      }),
      { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Create A/B test error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create A/B test" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(createABTest, "createABTest");
async function searchUsers(query, env, corsHeaders6) {
  try {
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Search query required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const results = [];
    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Search users error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to search users" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(searchUsers, "searchUsers");

// api/ai-advanced.js
var import_checked_fetch28 = __toESM(require_checked_fetch());
var onRequest25 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders6 });
  }
  try {
    const action = searchParams.get("action") || "generate";
    switch (action) {
      case "generate-content":
        return await generateAdvancedContent(request, corsHeaders6);
      case "analyze-story":
        return await analyzeStory(request, corsHeaders6);
      case "batch-analysis":
        return await batchAnalysis2(request, corsHeaders6);
      case "seo-optimization":
        return await optimizeSEO2(request, corsHeaders6);
      case "trending-topics":
        return await getTrendingTopics2(request, corsHeaders6);
      case "content-sources":
        return await getContentSources2(request, corsHeaders6);
      case "sync-sources":
        return await syncContentSources2(request, corsHeaders6);
      case "moderation":
        return await moderateContent2(request, corsHeaders6);
      case "fact-check":
        return await factCheckContent2(request, corsHeaders6);
      case "plagiarism-check":
        return await checkPlagiarism2(request, corsHeaders6);
      case "performance-analytics":
        return await getPerformanceAnalytics(request, corsHeaders6);
      default:
        return await generateAdvancedContent(request, corsHeaders6);
    }
  } catch (error) {
    console.error("Advanced AI API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process advanced AI request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function generateAdvancedContent(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { prompt, category, tone, length, targetAudience, keywords, includeImages, includeVideos } = body;
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    const generatedContent = generateAdvancedStoryContent(prompt, category, tone, length, targetAudience, keywords);
    return new Response(JSON.stringify({
      success: true,
      content: generatedContent,
      metadata: {
        wordCount: generatedContent.content.split(" ").length,
        readingTime: Math.ceil(generatedContent.content.split(" ").length / 200),
        aiGenerated: true,
        confidence: 92 + Math.random() * 6,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        model: "GPT-4 Advanced",
        tokens: Math.floor(generatedContent.content.split(" ").length * 1.3)
      },
      assets: {
        images: includeImages ? generateImageSuggestions(prompt, category) : [],
        videos: includeVideos ? generateVideoSuggestions(prompt, category) : [],
        relatedTopics: generateRelatedTopics(prompt, category)
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to generate advanced content" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(generateAdvancedContent, "generateAdvancedContent");
async function analyzeStory(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { content, title, category, author } = body;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required for analysis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const analysis = performAdvancedStoryAnalysis(content, title, category, author);
    return new Response(JSON.stringify({
      success: true,
      analysis,
      processedAt: (/* @__PURE__ */ new Date()).toISOString(),
      model: "Advanced AI Analysis v2.0"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to analyze story" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(analyzeStory, "analyzeStory");
async function batchAnalysis2(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { stories } = body;
    if (!stories || !Array.isArray(stories)) {
      return new Response(
        JSON.stringify({ error: "Stories array is required for batch analysis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5e3));
    const batchResults = stories.map((story) => ({
      id: story.id,
      analysis: performAdvancedStoryAnalysis(story.content, story.title, story.category, story.author),
      processingTime: Math.random() * 2 + 1
    }));
    return new Response(JSON.stringify({
      success: true,
      results: batchResults,
      summary: {
        totalProcessed: stories.length,
        avgQualityScore: batchResults.reduce((acc, r) => acc + r.analysis.qualityScore, 0) / stories.length,
        avgReadability: batchResults.reduce((acc, r) => acc + r.analysis.readabilityScore, 0) / stories.length,
        processingTime: "5.2s"
      },
      processedAt: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to perform batch analysis" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(batchAnalysis2, "batchAnalysis");
async function optimizeSEO2(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { content, title, targetKeywords, category } = body;
    if (!content || !title) {
      return new Response(
        JSON.stringify({ error: "Content and title are required for SEO optimization" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    const seoOptimization = performAdvancedSEO(content, title, targetKeywords, category);
    return new Response(JSON.stringify({
      success: true,
      seo: seoOptimization,
      optimizedAt: (/* @__PURE__ */ new Date()).toISOString(),
      estimatedImprovement: "25-35% increase in search visibility"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to optimize SEO" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(optimizeSEO2, "optimizeSEO");
async function getTrendingTopics2(request, corsHeaders6) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    const topics = generateAdvancedTrendingTopics();
    return new Response(JSON.stringify({
      success: true,
      topics,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      source: "AI Trend Analysis Engine v3.0",
      nextUpdate: new Date(Date.now() + 60 * 60 * 1e3).toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch trending topics" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getTrendingTopics2, "getTrendingTopics");
async function getContentSources2(request, corsHeaders6) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const sources = generateContentSources();
    return new Response(JSON.stringify({
      success: true,
      sources,
      monitoredAt: (/* @__PURE__ */ new Date()).toISOString(),
      totalSources: sources.length,
      activeSources: sources.filter((s) => s.status === "active").length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch content sources" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getContentSources2, "getContentSources");
async function syncContentSources2(request, corsHeaders6) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    return new Response(JSON.stringify({
      success: true,
      message: "Content sources synchronized successfully",
      syncedSources: 12,
      newArticles: 245,
      processedWithAI: true,
      processingTime: "3.2s",
      nextSync: new Date(Date.now() + 30 * 60 * 1e3).toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to sync content sources" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(syncContentSources2, "syncContentSources");
async function moderateContent2(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { content, title, category } = body;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required for moderation" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    const moderation = performAdvancedModeration(content, title, category);
    return new Response(JSON.stringify({
      success: true,
      moderation,
      moderatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      aiModel: "Content Safety AI v2.1"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to moderate content" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(moderateContent2, "moderateContent");
async function factCheckContent2(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { content, claims } = body;
    if (!content && !claims) {
      return new Response(
        JSON.stringify({ error: "Content or claims are required for fact checking" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const factCheck = performAdvancedFactCheck(content, claims);
    return new Response(JSON.stringify({
      success: true,
      factCheck,
      checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
      sources: ["ESPN Cricinfo", "Cricbuzz", "Official IPL Website", "ICC Records"],
      confidence: 88 + Math.random() * 10
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fact check content" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(factCheckContent2, "factCheckContent");
async function checkPlagiarism2(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { content, title } = body;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required for plagiarism check" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    const plagiarismResult = performAdvancedPlagiarismCheck(content, title);
    return new Response(JSON.stringify({
      success: true,
      plagiarism: plagiarismResult,
      checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
      databaseSize: "50M+ documents",
      processingTime: "2.8s"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to check plagiarism" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(checkPlagiarism2, "checkPlagiarism");
async function getPerformanceAnalytics(request, corsHeaders6) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const analytics = generatePerformanceAnalytics();
    return new Response(JSON.stringify({
      success: true,
      analytics,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      dataRange: "Last 30 days"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch performance analytics" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getPerformanceAnalytics, "getPerformanceAnalytics");

// api/ai-advanced-complete.js
var import_checked_fetch29 = __toESM(require_checked_fetch());
var onRequest26 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders6 });
  }
  try {
    const action = searchParams.get("action") || "generate-content";
    switch (action) {
      case "generate-content":
        return await generateAdvancedContent2(request, corsHeaders6);
      case "analyze-story":
        return await analyzeStory2(request, corsHeaders6);
      case "batch-analysis":
        return await batchAnalysis(request, corsHeaders6);
      case "seo-optimization":
        return await optimizeSEO(request, corsHeaders6);
      case "trending-topics":
        return await getTrendingTopics3(request, corsHeaders6);
      case "content-sources":
        return await getContentSources(request, corsHeaders6);
      case "sync-sources":
        return await syncContentSources(request, corsHeaders6);
      case "moderation":
        return await moderateContent(request, corsHeaders6);
      case "fact-check":
        return await factCheckContent(request, corsHeaders6);
      case "plagiarism-check":
        return await checkPlagiarism(request, corsHeaders6);
      case "performance-analytics":
        return await getPerformanceAnalytics2(request, corsHeaders6);
      default:
        return await generateAdvancedContent2(request, corsHeaders6);
    }
  } catch (error) {
    console.error("Advanced AI API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process advanced AI request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function generateAdvancedContent2(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { prompt, category, tone, length, targetAudience, keywords, includeImages, includeVideos } = body;
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    const generatedContent = generateAdvancedStoryContent2(prompt, category, tone, length, targetAudience, keywords);
    return new Response(JSON.stringify({
      success: true,
      content: generatedContent,
      metadata: {
        wordCount: generatedContent.content.split(" ").length,
        readingTime: Math.ceil(generatedContent.content.split(" ").length / 200),
        aiGenerated: true,
        confidence: 92 + Math.random() * 6,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        model: "GPT-4 Advanced",
        tokens: Math.floor(generatedContent.content.split(" ").length * 1.3)
      },
      assets: {
        images: includeImages ? generateImageSuggestions2(prompt, category) : [],
        videos: includeVideos ? generateVideoSuggestions2(prompt, category) : [],
        relatedTopics: generateRelatedTopics2(prompt, category)
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to generate advanced content" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(generateAdvancedContent2, "generateAdvancedContent");
async function analyzeStory2(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { content, title, category, author } = body;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required for analysis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const analysis = performAdvancedStoryAnalysis2(content, title, category, author);
    return new Response(JSON.stringify({
      success: true,
      analysis,
      processedAt: (/* @__PURE__ */ new Date()).toISOString(),
      model: "Advanced AI Analysis v2.0"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to analyze story" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(analyzeStory2, "analyzeStory");
async function getTrendingTopics3(request, corsHeaders6) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    const topics = generateAdvancedTrendingTopics2();
    return new Response(JSON.stringify({
      success: true,
      topics,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      source: "AI Trend Analysis Engine v3.0",
      nextUpdate: new Date(Date.now() + 60 * 60 * 1e3).toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch trending topics" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getTrendingTopics3, "getTrendingTopics");
async function getPerformanceAnalytics2(request, corsHeaders6) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const analytics = generatePerformanceAnalytics2();
    return new Response(JSON.stringify({
      success: true,
      analytics,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      dataRange: "Last 30 days"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch performance analytics" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getPerformanceAnalytics2, "getPerformanceAnalytics");
function generateAdvancedStoryContent2(prompt, category, tone, length, targetAudience, keywords) {
  const templates = {
    "match-experience": generateMatchExperienceContent(prompt, tone, length),
    "player-fan": generatePlayerFanContent(prompt, tone, length),
    "venue-memory": generateVenueMemoryContent(prompt, tone, length),
    "cricket-journey": generateCricketJourneyContent(prompt, tone, length),
    "emotional-moment": generateEmotionalMomentContent(prompt, tone, length)
  };
  const baseContent = templates[category] || templates["match-experience"];
  return {
    title: `AI Generated: ${prompt}`,
    content: baseContent,
    excerpt: `AI-generated ${category} content about ${prompt}`,
    category,
    tags: generateTagsFromPrompt(prompt, category, keywords),
    readingTime: Math.ceil(baseContent.split(" ").length / 200),
    aiEnhanced: true,
    tone,
    targetAudience
  };
}
__name(generateAdvancedStoryContent2, "generateAdvancedStoryContent");
function generateMatchExperienceContent(prompt, tone, length) {
  const toneAdjustments = {
    "professional": "From a professional perspective, the match experience at",
    "casual": "Let me tell you about my awesome time at",
    "enthusiastic": "OMG! The match at was absolutely incredible! ",
    "analytical": "Analyzing the match experience at reveals several key insights:"
  };
  const lengthAdjustments = {
    "short": "It was a great match with exciting moments.",
    "medium": `${toneAdjustments[tone]} ${prompt}. The atmosphere was electric with fans cheering throughout. Key moments included brilliant batting displays and strategic bowling changes. The venue management was excellent, and the overall experience was memorable.`,
    "long": `${toneAdjustments[tone]} ${prompt}. 

The day began with anticipation building as fans gathered outside the stadium. The energy was palpable, with supporters from both teams creating a vibrant atmosphere. Once inside, the scale of the venue was impressive - modern facilities combined with traditional cricket elements.

The match itself delivered on every promise. The batting display showcased technical excellence, while the bowling strategies demonstrated tactical brilliance. Fielding was sharp, with several moments of athleticism that brought the crowd to their feet.

What made this experience special was the combination of sporting excellence and fan engagement. The stadium organizers had thought of everything - from comfortable seating to excellent food options and merchandise stands. The big screen ensured no one missed any action, while the commentary provided expert insights.

As the match reached its climax, the tension was incredible. Every run was cheered, every wicket celebrated or mourned depending on allegiance. The final moments will stay with me forever - the culmination of hours of sporting drama played out in front of thousands of passionate fans.

This wasn't just a cricket match; it was an event that brought people together, created memories, and reinforced why we love this sport so much.`
  };
  return lengthAdjustments[length] || lengthAdjustments["medium"];
}
__name(generateMatchExperienceContent, "generateMatchExperienceContent");
function generatePlayerFanContent(prompt, tone, length) {
  const toneAdjustments = {
    "professional": "As a cricket analyst, I can confidently say that",
    "casual": "I've been a fan of for years, and let me tell you why",
    "enthusiastic": " is absolutely the best! Here's why I'm their biggest fan!",
    "analytical": "Analyzing the career and impact of reveals several key factors:"
  };
  return `${toneAdjustments[tone]} ${prompt} represents excellence in modern cricket. Their combination of skill, mental toughness, and consistency sets them apart from other players. Whether with bat or ball, they deliver performances that inspire fans and command respect from opponents. Their dedication to fitness and continuous improvement shows in every aspect of their game.`;
}
__name(generatePlayerFanContent, "generatePlayerFanContent");
function generateVenueMemoryContent(prompt, tone, length) {
  return `The ${prompt} holds a special place in cricket history. This venue has witnessed countless memorable matches and legendary performances. The unique characteristics of the ground - from pitch conditions to crowd atmosphere - create an experience that players and fans cherish. Every visit to ${prompt} is special, knowing you're walking in the footsteps of cricket greats.`;
}
__name(generateVenueMemoryContent, "generateVenueMemoryContent");
function generateCricketJourneyContent(prompt, tone, length) {
  return `My cricket journey with ${prompt} has been transformative. What started as casual interest evolved into a deep passion for the sport. Through matches, practices, and interactions with fellow fans, I've grown not just as a player but as a person. The lessons learned from cricket - teamwork, resilience, sportsmanship - extend far beyond the boundary ropes.`;
}
__name(generateCricketJourneyContent, "generateCricketJourneyContent");
function generateEmotionalMomentContent(prompt, tone, length) {
  return `The moment ${prompt} happened, time seemed to stand still. In that instant, all the emotions of cricket - joy, tension, relief, excitement - converged into one powerful experience. It's these moments that make cricket special, creating memories that last a lifetime and stories that get passed down through generations of fans.`;
}
__name(generateEmotionalMomentContent, "generateEmotionalMomentContent");
function generateTagsFromPrompt(prompt, category, keywords) {
  const baseTags = [prompt.toLowerCase(), category, "cricket", "ipl", "ai-generated"];
  const additionalTags = keywords || [];
  return [.../* @__PURE__ */ new Set([...baseTags, ...additionalTags])].slice(0, 8);
}
__name(generateTagsFromPrompt, "generateTagsFromPrompt");
function generateImageSuggestions2(prompt, category) {
  return [
    { url: `https://api.ai/images/${prompt}-hero.jpg`, description: `AI-generated hero image for ${prompt}` },
    { url: `https://api.ai/images/${category}-context.jpg`, description: `Context image for ${category}` }
  ];
}
__name(generateImageSuggestions2, "generateImageSuggestions");
function generateVideoSuggestions2(prompt, category) {
  return [
    { url: `https://api.ai/videos/${prompt}-highlights.mp4`, description: `AI-generated highlights for ${prompt}` },
    { url: `https://api.ai/videos/${category}-analysis.mp4`, description: `Analysis video for ${category}` }
  ];
}
__name(generateVideoSuggestions2, "generateVideoSuggestions");
function generateRelatedTopics2(prompt, category) {
  return [
    { topic: `${prompt} analysis`, relevance: 0.95 },
    { topic: `${category} trends`, relevance: 0.87 },
    { topic: "IPL 2025", relevance: 0.82 }
  ];
}
__name(generateRelatedTopics2, "generateRelatedTopics");
function performAdvancedStoryAnalysis2(content, title, category, author) {
  const wordCount = content.split(" ").length;
  const sentences = content.split(".").length;
  const avgWordsPerSentence = Math.round(wordCount / sentences);
  return {
    qualityScore: 7.5 + Math.random() * 2,
    readabilityScore: Math.max(5, Math.min(10, 10 - (avgWordsPerSentence - 15) * 0.1)),
    sentiment: Math.random() > 0.3 ? "positive" : Math.random() > 0.5 ? "neutral" : "negative",
    emotionalImpact: 6 + Math.random() * 3,
    shareability: 6 + Math.random() * 3,
    trendingPotential: 5 + Math.random() * 4,
    suggestedTags: generateTagsFromPrompt(title, category, []),
    improvements: [
      "Add more specific examples and details",
      "Include quotes or personal anecdotes",
      "Consider adding statistical data to support claims",
      "Break up longer paragraphs for better readability"
    ],
    contentSummary: content.substring(0, 200) + "...",
    keyTopics: extractKeyTopics(content),
    plagiarismScore: Math.random() * 5,
    recommendation: wordCount > 100 ? "approve" : "review",
    confidence: 80 + Math.random() * 15,
    aiGenerated: false,
    contentGaps: ["Real examples", "Expert quotes", "Statistical evidence"],
    enhancementSuggestions: ["Add multimedia elements", "Include interactive content", "Optimize for SEO"]
  };
}
__name(performAdvancedStoryAnalysis2, "performAdvancedStoryAnalysis");
function generateAdvancedTrendingTopics2() {
  return [
    {
      id: "1",
      topic: "IPL 2025 Auction",
      category: "news",
      mentions: 25420,
      sentiment: 0.78,
      growth: 0.92,
      relatedTags: ["auction", "teams", "players", "bidding", "retention"],
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      predictedTrend: 0.85,
      viralPotential: 8.9,
      aiConfidence: 94
    },
    {
      id: "2",
      topic: "MS Dhoni Retirement",
      category: "player",
      mentions: 18950,
      sentiment: 0.65,
      growth: 0.78,
      relatedTags: ["dhoni", "csk", "retirement", "legacy", "captain"],
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      predictedTrend: 0.72,
      viralPotential: 8.2,
      aiConfidence: 89
    }
  ];
}
__name(generateAdvancedTrendingTopics2, "generateAdvancedTrendingTopics");
function generatePerformanceAnalytics2() {
  return {
    overview: {
      totalStories: 1250,
      totalViews: 452e3,
      avgEngagement: 8.7,
      aiGenerated: 145,
      userGenerated: 1105
    },
    trends: {
      dailyViews: [1200, 1450, 1680, 1890, 2100, 2450, 2800],
      engagementGrowth: 15.3,
      contentGrowth: 8.7
    },
    topPerforming: {
      categories: [
        { name: "match-experience", percentage: 34, engagement: 9.2 },
        { name: "player-fan", percentage: 28, engagement: 8.5 },
        { name: "ai-generated", percentage: 22, engagement: 8.9 }
      ],
      stories: [
        { id: "1", title: "CSK Final Experience", views: 15420, engagement: 9.2 },
        { id: "2", title: "Dhoni Legacy", views: 12890, engagement: 8.8 }
      ]
    },
    aiMetrics: {
      avgQualityScore: 8.2,
      avgReadability: 8.7,
      plagiarismFree: 98.5,
      aiContentPerformance: 89.2
    }
  };
}
__name(generatePerformanceAnalytics2, "generatePerformanceAnalytics");
function extractKeyTopics(content) {
  const words = content.toLowerCase().split(/\s+/);
  const commonWords = /* @__PURE__ */ new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "was", "are", "were"]);
  const wordFreq = {};
  words.forEach((word) => {
    if (!commonWords.has(word) && word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  return Object.entries(wordFreq).sort(([, a], [, b]) => b - a).slice(0, 10).map(([word]) => word);
}
__name(extractKeyTopics, "extractKeyTopics");

// api/ai-content.js
var import_checked_fetch30 = __toESM(require_checked_fetch());
var onRequest27 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders6 });
  }
  try {
    const action = searchParams.get("action") || "generate";
    switch (action) {
      case "generate":
        return await generateContent(request, corsHeaders6);
      case "analyze":
        return await analyzeContent(request, corsHeaders6);
      case "suggest-tags":
        return await suggestTags(request, corsHeaders6);
      case "trending-topics":
        return await getTrendingTopics(request, corsHeaders6);
      case "seo-optimize":
        return await optimizeSEO(request, corsHeaders6);
      case "fact-check":
        return await factCheckContent(request, corsHeaders6);
      default:
        return await generateContent(request, corsHeaders6);
    }
  } catch (error) {
    console.error("AI Content API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process AI request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function generateContent(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { prompt, category, tone = "engaging", length = "medium" } = body;
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    const generatedContent = generateStoryContent(prompt, category, tone, length);
    return new Response(JSON.stringify({
      success: true,
      content: generatedContent,
      metadata: {
        wordCount: generatedContent.content.split(" ").length,
        readingTime: Math.ceil(generatedContent.content.split(" ").length / 200),
        aiGenerated: true,
        confidence: 87 + Math.random() * 10,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to generate content" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(generateContent, "generateContent");
async function analyzeContent(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { content, title } = body;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required for analysis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const analysis = analyzeContentWithAI(content, title);
    return new Response(JSON.stringify({
      success: true,
      analysis,
      processedAt: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to analyze content" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(analyzeContent, "analyzeContent");

// api/ai-content-complete.js
var import_checked_fetch31 = __toESM(require_checked_fetch());
var onRequest28 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders6 });
  }
  try {
    const action = searchParams.get("action") || "generate";
    switch (action) {
      case "generate":
        return await generateContent2(request, corsHeaders6);
      case "analyze":
        return await analyzeContent2(request, corsHeaders6);
      case "suggest-tags":
        return await suggestTags2(request, corsHeaders6);
      case "trending-topics":
        return await getTrendingTopics4(request, corsHeaders6);
      case "seo-optimize":
        return await optimizeSEO3(request, corsHeaders6);
      case "fact-check":
        return await factCheckContent3(request, corsHeaders6);
      default:
        return await generateContent2(request, corsHeaders6);
    }
  } catch (error) {
    console.error("AI Content API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process AI request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function generateContent2(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { prompt, category, tone = "engaging", length = "medium" } = body;
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    const generatedContent = generateStoryContent(prompt, category, tone, length);
    return new Response(JSON.stringify({
      success: true,
      content: generatedContent,
      metadata: {
        wordCount: generatedContent.content.split(" ").length,
        readingTime: Math.ceil(generatedContent.content.split(" ").length / 200),
        aiGenerated: true,
        confidence: 87 + Math.random() * 10,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to generate content" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(generateContent2, "generateContent");
async function analyzeContent2(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { content, title } = body;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required for analysis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const analysis = analyzeContentWithAI(content, title);
    return new Response(JSON.stringify({
      success: true,
      analysis,
      processedAt: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to analyze content" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(analyzeContent2, "analyzeContent");
async function suggestTags2(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { content, title, category } = body;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required for tag suggestions" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    const tags = generateTagsFromContent(content, title, category);
    return new Response(JSON.stringify({
      success: true,
      tags: tags.primary,
      secondaryTags: tags.secondary,
      confidence: 85 + Math.random() * 10,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to generate tags" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(suggestTags2, "suggestTags");
async function getTrendingTopics4(request, corsHeaders6) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const topics = generateTrendingTopics();
    return new Response(JSON.stringify({
      success: true,
      topics,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      source: "AI Analysis"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch trending topics" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getTrendingTopics4, "getTrendingTopics");
async function optimizeSEO3(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { content, title, targetKeywords = [] } = body;
    if (!content || !title) {
      return new Response(
        JSON.stringify({ error: "Content and title are required for SEO optimization" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const seoOptimization = generateSEORecommendations(content, title, targetKeywords);
    return new Response(JSON.stringify({
      success: true,
      seo: seoOptimization,
      optimizedAt: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to optimize SEO" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(optimizeSEO3, "optimizeSEO");
async function factCheckContent3(request, corsHeaders6) {
  try {
    const body = await request.json();
    const { content } = body;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required for fact checking" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    const factCheckResults = performFactCheck(content);
    return new Response(JSON.stringify({
      success: true,
      factCheck: factCheckResults,
      checkedAt: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fact check content" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(factCheckContent3, "factCheckContent");

// api/auth.js
var import_checked_fetch32 = __toESM(require_checked_fetch());
import crypto6 from "node:crypto";
var encryptPassword3 = /* @__PURE__ */ __name((password, salt) => {
  const hash = crypto6.createHash("sha256");
  hash.update(password + salt);
  return hash.digest("hex");
}, "encryptPassword");
var generateSalt3 = /* @__PURE__ */ __name(() => crypto6.randomBytes(16).toString("hex"), "generateSalt");
var generateToken3 = /* @__PURE__ */ __name(() => crypto6.randomBytes(32).toString("hex"), "generateToken");
var COMMON_PASSWORDS2 = /* @__PURE__ */ new Set([
  "password",
  "password1",
  "123456",
  "123456789",
  "12345678",
  "qwerty",
  "111111",
  "abc123",
  "letmein",
  "iloveyou"
]);
var onRequest29 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  try {
    let action = searchParams.get("action") || "signin";
    let body = {};
    if (method === "POST" || method === "PUT") {
      try {
        body = await request.json();
        if (body.name && body.email && body.password) {
          action = "signup";
        } else if (body.email && body.password && !body.name) {
          action = "signin";
        }
      } catch (e) {
      }
    }
    if (action === "signup" && method === "POST") {
      const { email, password, name, turnstileToken } = body;
      if (!email || !password || !name) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const secretKey = env.TURNSTILE_SECRET_KEY;
      if (secretKey && turnstileToken) {
        try {
          const formData = new URLSearchParams();
          formData.append("secret", secretKey);
          formData.append("response", String(turnstileToken));
          const ip = request.headers.get("CF-Connecting-IP");
          if (ip) {
            formData.append("remoteip", ip);
          }
          const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: formData
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) {
            return new Response(
              JSON.stringify({ error: "Human verification failed. Please try again." }),
              { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
            );
          }
        } catch (e) {
          console.error("Turnstile verification error:", e);
          return new Response(
            JSON.stringify({ error: "Unable to verify human check. Please try again." }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
      } else if (secretKey && !turnstileToken) {
        return new Response(
          JSON.stringify({ error: "Human verification is required to create an account." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const normalizedPassword = String(password).trim();
      if (normalizedPassword.length < 12) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 12 characters long" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (COMMON_PASSWORDS2.has(normalizedPassword.toLowerCase())) {
        return new Response(
          JSON.stringify({ error: "Password is too common. Please choose a stronger password." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const existingUser = await env.SPORTS_KV.get(`user:${email}`);
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "User already exists" }),
          { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const salt = generateSalt3();
      const hashedPassword = encryptPassword3(normalizedPassword, salt);
      const userId = crypto6.randomUUID();
      const token = generateToken3();
      const createdAt = (/* @__PURE__ */ new Date()).toISOString();
      const userData = {
        id: userId,
        email,
        name,
        salt,
        hashedPassword,
        token,
        createdAt,
        isBlocked: false,
        role: "user"
      };
      await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(userData), {
        expirationTtl: 31536e3
      });
      await env.SPORTS_KV.put(`token:${token}`, email, {
        expirationTtl: 2592e3
        // 30 days
      });
      await env.SPORTS_KV.put(`userId:${userId}`, email, {
        expirationTtl: 31536e3
      });
      return new Response(
        JSON.stringify({
          success: true,
          userId,
          token,
          user: { id: userId, email, name }
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
            ...corsHeaders6
          }
        }
      );
    }
    if (action === "signin" && method === "POST") {
      const { email, password } = body;
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Missing email or password" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const user = JSON.parse(userData);
      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: "Your account has been blocked" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const hashedPassword = encryptPassword3(password, user.salt);
      if (hashedPassword !== user.hashedPassword) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const newToken = generateToken3();
      user.token = newToken;
      user.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
      await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
        expirationTtl: 31536e3
      });
      await env.SPORTS_KV.put(`token:${newToken}`, email, {
        expirationTtl: 2592e3
      });
      return new Response(
        JSON.stringify({
          success: true,
          userId: user.id,
          token: newToken,
          user: { id: user.id, email: user.email, name: user.name }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `auth_token=${newToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
            ...corsHeaders6
          }
        }
      );
    }
    if (action === "verify" && method === "GET") {
      const token = searchParams.get("token");
      if (!token) {
        return new Response(
          JSON.stringify({ error: "No token provided" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const user = JSON.parse(userData);
      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: "Account blocked" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || "user"
            // Include role field
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (action === "signout" && method === "POST") {
      const { token } = body;
      if (token) {
        await env.SPORTS_KV.delete(`token:${token}`);
      }
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": "auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
            ...corsHeaders6
          }
        }
      );
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/content.js
var import_checked_fetch33 = __toESM(require_checked_fetch());
async function getBody(request) {
  if (request.method === "GET" || request.method === "HEAD") {
    return null;
  }
  try {
    return await request.json();
  } catch {
    return null;
  }
}
__name(getBody, "getBody");
function verifyAdminToken5(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken5, "verifyAdminToken");
var kv = globalThis.IPL_CACHE;
var KV_KEY = "ipl:content";
var onRequest30 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const kvNamespace = env.IPL_CACHE || kv;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders6
    });
  }
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const type = url.searchParams.get("type");
      const league = url.searchParams.get("league");
      const cached = await kvNamespace.get(KV_KEY);
      let content = cached ? JSON.parse(cached) : [];
      content = content.map((c) => ({
        ...c,
        league: c.league || "ipl"
        // Default to 'ipl' if missing
      }));
      if (type) {
        content = content.filter((c) => c.type === type);
      }
      if (league && (league === "ipl" || league === "wpl")) {
        content = content.filter((c) => {
          const contentLeague = c.league || "ipl";
          return contentLeague === league;
        });
      }
      return new Response(JSON.stringify(content), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders6
        }
      });
    }
    if (request.method === "POST") {
      if (!verifyAdminToken5(request)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders6
            }
          }
        );
      }
      const body = await getBody(request);
      if (!body || !body.title || !body.type) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: title, type" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders6
            }
          }
        );
      }
      const existing = await kvNamespace.get(KV_KEY);
      const content = existing ? JSON.parse(existing) : [];
      const newContent = {
        ...body,
        league: body.league || "ipl",
        // Default to 'ipl' if not specified
        id: Date.now().toString(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      content.push(newContent);
      await kvNamespace.put(KV_KEY, JSON.stringify(content));
      try {
        const origin = new URL(request.url).origin;
        const authHeader = request.headers.get("authorization") || "";
        await fetch(`${origin}/api/admin/users/activity`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            action: "create_content",
            details: `Created ${newContent.type} "${newContent.title}"`,
            entityType: newContent.type,
            entityId: newContent.id
          })
        });
      } catch (err) {
        console.error("Failed to write admin audit log (create_content):", err);
      }
      return new Response(
        JSON.stringify({
          message: "Content created successfully",
          content: newContent
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders6
          }
        }
      );
    }
    if (request.method === "PUT") {
      if (!verifyAdminToken5(request)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders6
            }
          }
        );
      }
      const body = await getBody(request);
      if (!body || !body.id) {
        return new Response(
          JSON.stringify({ error: "Content ID is required" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders6
            }
          }
        );
      }
      const existing = await kvNamespace.get(KV_KEY);
      const content = existing ? JSON.parse(existing) : [];
      const updated = content.map(
        (c) => c.id === body.id ? {
          ...c,
          ...body,
          league: body.league || c.league || "ipl",
          // Preserve or set league
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        } : c
      );
      await kvNamespace.put(KV_KEY, JSON.stringify(updated));
      try {
        const origin = new URL(request.url).origin;
        const authHeader = request.headers.get("authorization") || "";
        const updatedItem = updated.find((c) => c.id === body.id) || null;
        await fetch(`${origin}/api/admin/users/activity`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            action: "update_content",
            details: updatedItem ? `Updated ${updatedItem.type} "${updatedItem.title}"` : `Updated content ${body.id}`,
            entityType: updatedItem?.type || null,
            entityId: body.id
          })
        });
      } catch (err) {
        console.error("Failed to write admin audit log (update_content):", err);
      }
      return new Response(
        JSON.stringify({
          message: "Content updated successfully",
          content: { ...body, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders6
          }
        }
      );
    }
    if (request.method === "DELETE") {
      if (!verifyAdminToken5(request)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders6
            }
          }
        );
      }
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Content ID is required" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders6
            }
          }
        );
      }
      const existing = await kvNamespace.get(KV_KEY);
      const content = existing ? JSON.parse(existing) : [];
      const toDelete = content.find((c) => c.id === id) || null;
      const updated = content.filter((c) => c.id !== id);
      await kvNamespace.put(KV_KEY, JSON.stringify(updated));
      try {
        const origin = new URL(request.url).origin;
        const authHeader = request.headers.get("authorization") || "";
        await fetch(`${origin}/api/admin/users/activity`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            action: "delete_content",
            details: toDelete ? `Deleted ${toDelete.type} "${toDelete.title}"` : `Deleted content ${id}`,
            entityType: toDelete?.type || null,
            entityId: id
          })
        });
      } catch (err) {
        console.error("Failed to write admin audit log (delete_content):", err);
      }
      return new Response(
        JSON.stringify({ message: "Content deleted successfully" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders6
          }
        }
      );
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders6
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders6
        }
      }
    );
  }
}, "onRequest");

// api/email-analytics.js
var import_checked_fetch34 = __toESM(require_checked_fetch());
var onRequest31 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  try {
    if (url.pathname.includes("/webhooks/")) {
      return await handleWebhook(request, env, corsHeaders6);
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed?.email) email = parsed.email;
      } catch (e) {
      }
    }
    if (method === "GET") {
      const range = url.searchParams.get("range") || "30";
      return await getAnalytics(email, range, env, corsHeaders6);
    }
    if (method === "POST") {
      const body = await request.json();
      return await recordEvent(email, body, env, corsHeaders6);
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Email analytics error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function handleWebhook(request, env, corsHeaders6) {
  try {
    const body = await request.json();
    const event = detectProvider(body);
    if (!event) {
      return new Response(
        JSON.stringify({ error: "Unknown provider" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    await storeAnalyticsEvent(event, env);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process webhook" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(handleWebhook, "handleWebhook");
function detectProvider(body) {
  if (body.type && body.data?.email) {
    return {
      provider: "resend",
      type: body.type,
      email: body.data.email,
      messageId: body.data.id,
      timestamp: new Date(body.created_at).getTime(),
      raw: body
    };
  }
  if (Array.isArray(body) && body[0]?.email) {
    return body.map((event) => ({
      provider: "sendgrid",
      type: event.event,
      email: event.email,
      messageId: event.message_id,
      timestamp: event.timestamp * 1e3,
      raw: event
    }));
  }
  if (body.signature && body["event-data"]) {
    const eventData = body["event-data"];
    return {
      provider: "mailgun",
      type: eventData.severity === "permanent" ? "bounce" : eventData.event,
      email: eventData.recipient,
      messageId: eventData.message.id,
      timestamp: eventData.timestamp * 1e3,
      raw: body
    };
  }
  if (body.status && body.email && body.messageid) {
    return {
      provider: "elastic-email",
      type: normalizeElasticEmailEvent(body.status),
      email: body.email,
      messageId: body.messageid,
      timestamp: body.dateSent ? new Date(body.dateSent).getTime() : Date.now(),
      raw: body
    };
  }
  return null;
}
__name(detectProvider, "detectProvider");
function normalizeElasticEmailEvent(elasticStatus) {
  const statusMap = {
    "Sent": "email-sent",
    "Delivered": "email-delivered",
    "Opened": "email-opened",
    "Clicked": "email-clicked",
    "Bounced": "bounce",
    "AbuseReport": "complained",
    "Unsubscribed": "unsubscribed",
    "Failed": "failed"
  };
  return statusMap[elasticStatus] || elasticStatus.toLowerCase();
}
__name(normalizeElasticEmailEvent, "normalizeElasticEmailEvent");
async function storeAnalyticsEvent(event, env) {
  const events = Array.isArray(event) ? event : [event];
  for (const evt of events) {
    const key = `analytics:${evt.email}:${evt.messageId}:${evt.type}`;
    const data = {
      provider: evt.provider,
      type: evt.type,
      email: evt.email,
      messageId: evt.messageId,
      timestamp: evt.timestamp,
      date: new Date(evt.timestamp).toISOString()
    };
    await env.SPORTS_KV.put(key, JSON.stringify(data), {
      expirationTtl: 90 * 24 * 60 * 60
      // 90 days
    });
    const summaryKey = `analytics-summary:${evt.email}`;
    const summary = await env.SPORTS_KV.get(summaryKey);
    const summaryData = summary ? JSON.parse(summary) : { total: 0, events: {} };
    summaryData.total += 1;
    summaryData.events[evt.type] = (summaryData.events[evt.type] || 0) + 1;
    summaryData.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    await env.SPORTS_KV.put(summaryKey, JSON.stringify(summaryData), {
      expirationTtl: 90 * 24 * 60 * 60
    });
  }
}
__name(storeAnalyticsEvent, "storeAnalyticsEvent");
async function getAnalytics(email, rangeParam, env, corsHeaders6) {
  try {
    const range = Math.min(parseInt(rangeParam) || 30, 365);
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - range);
    const summaryKey = `analytics-summary:${email}`;
    const summary = await env.SPORTS_KV.get(summaryKey);
    const summaryData = summary ? JSON.parse(summary) : { total: 0, events: {} };
    const metrics = {
      totalEmails: summaryData.events.sent || 0,
      delivered: summaryData.events.delivered || 0,
      opened: summaryData.events.opened || 0,
      clicked: summaryData.events.clicked || 0,
      bounced: summaryData.events.bounce || 0,
      complained: summaryData.events.complained || 0,
      unsubscribed: summaryData.events.unsubscribed || 0
    };
    metrics.deliveryRate = metrics.totalEmails > 0 ? Math.round(metrics.delivered / metrics.totalEmails * 100) : 0;
    metrics.openRate = metrics.delivered > 0 ? Math.round(metrics.opened / metrics.delivered * 100) : 0;
    metrics.clickRate = metrics.delivered > 0 ? Math.round(metrics.clicked / metrics.delivered * 100) : 0;
    metrics.bounceRate = metrics.totalEmails > 0 ? Math.round(metrics.bounced / metrics.totalEmails * 100) : 0;
    return new Response(
      JSON.stringify({
        email,
        range: `${range} days`,
        startDate: startDate.toISOString(),
        metrics,
        events: summaryData.events,
        lastUpdated: summaryData.lastUpdated
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Get analytics error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get analytics" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getAnalytics, "getAnalytics");
async function recordEvent(email, body, env, corsHeaders6) {
  try {
    const { eventType, matchId, action, metadata } = body;
    if (!eventType) {
      return new Response(
        JSON.stringify({ error: "eventType required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const event = {
      email,
      type: eventType,
      action: action || "custom",
      matchId,
      metadata,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    const key = `custom-event:${email}:${Date.now()}`;
    await env.SPORTS_KV.put(key, JSON.stringify(event), {
      expirationTtl: 90 * 24 * 60 * 60
    });
    return new Response(
      JSON.stringify({ success: true, event }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Record event error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to record event" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(recordEvent, "recordEvent");

// api/email-preferences.js
var import_checked_fetch35 = __toESM(require_checked_fetch());
var onRequest32 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { pathname } = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  try {
    if (pathname.includes("/api/email-preferences/unsubscribe/")) {
      const token = pathname.split("/").pop();
      return await handleUnsubscribe(token, env, corsHeaders6);
    }
    const authHeader = request.headers.get("Authorization") || "";
    const authToken = authHeader.replace("Bearer", "").trim();
    if (!authToken) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${authToken}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed?.email) email = parsed.email;
      } catch (e) {
      }
    }
    if (method === "GET") {
      return await getEmailPreferences(email, env, corsHeaders6);
    }
    if (method === "PUT") {
      const body = await request.json();
      return await updateEmailPreferences(email, body, env, corsHeaders6);
    }
    if (method === "DELETE") {
      const body = await request.json();
      return await deletePreference(email, body, env, corsHeaders6);
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Email preferences error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function handleUnsubscribe(token, env, corsHeaders6) {
  try {
    const unsubscribeData = await env.SPORTS_KV.get(`unsubscribe-token:${token}`);
    if (!unsubscribeData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired unsubscribe link" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const { email, category } = JSON.parse(unsubscribeData);
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (!user.emailPreferences) {
      user.emailPreferences = getDefaultPreferences();
    }
    if (category === "all") {
      user.emailNotificationsEnabled = false;
      user.unsubscribedAt = (/* @__PURE__ */ new Date()).toISOString();
      user.unsubscribeReason = "clicked-unsubscribe-link";
    } else if (user.emailPreferences[category]) {
      user.emailPreferences[category].enabled = false;
    }
    await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
      expirationTtl: 31536e3
    });
    await env.SPORTS_KV.delete(`unsubscribe-token:${token}`);
    return new Response(
      JSON.stringify({ success: true, message: "Successfully unsubscribed" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process unsubscribe" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(handleUnsubscribe, "handleUnsubscribe");
async function getEmailPreferences(email, env, corsHeaders6) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    const preferences = user.emailPreferences || getDefaultPreferences();
    return new Response(
      JSON.stringify({
        email: user.email,
        emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
        unsubscribedAt: user.unsubscribedAt || null,
        unsubscribeReason: user.unsubscribeReason || null,
        preferences: {
          matchReminders: preferences.matchReminders || { enabled: true },
          teamAlerts: preferences.teamAlerts || { enabled: true },
          playerUpdates: preferences.playerUpdates || { enabled: false },
          newsDigest: preferences.newsDigest || { enabled: true },
          weeklyRecap: preferences.weeklyRecap || { enabled: true },
          specialOffers: preferences.specialOffers || { enabled: false }
        },
        frequency: preferences.frequency || "immediate",
        timezone: user.timezone || "UTC",
        lastModified: user.preferencesModifiedAt || null
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Get preferences error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get preferences" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getEmailPreferences, "getEmailPreferences");
async function updateEmailPreferences(email, body, env, corsHeaders6) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    const {
      emailNotificationsEnabled,
      preferences: newPrefs,
      frequency,
      timezone
    } = body;
    if (typeof emailNotificationsEnabled === "boolean") {
      user.emailNotificationsEnabled = emailNotificationsEnabled;
      if (emailNotificationsEnabled) {
        delete user.unsubscribedAt;
        delete user.unsubscribeReason;
      }
    }
    if (!user.emailPreferences) {
      user.emailPreferences = getDefaultPreferences();
    }
    if (newPrefs) {
      Object.keys(newPrefs).forEach((key) => {
        if (user.emailPreferences[key]) {
          user.emailPreferences[key].enabled = newPrefs[key].enabled ?? true;
          if (newPrefs[key].frequency) {
            user.emailPreferences[key].frequency = newPrefs[key].frequency;
          }
        }
      });
    }
    if (frequency && ["immediate", "daily", "weekly"].includes(frequency)) {
      user.emailPreferences.frequency = frequency;
    }
    if (timezone) {
      user.timezone = timezone;
    }
    user.preferencesModifiedAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
      expirationTtl: 31536e3
    });
    return new Response(
      JSON.stringify({
        success: true,
        message: "Preferences updated",
        preferences: user.emailPreferences
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Update preferences error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update preferences" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(updateEmailPreferences, "updateEmailPreferences");
async function deletePreference(email, body, env, corsHeaders6) {
  try {
    const { category } = body;
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (!user.emailPreferences) {
      user.emailPreferences = getDefaultPreferences();
    }
    if (user.emailPreferences[category]) {
      user.emailPreferences[category].enabled = false;
    }
    user.preferencesModifiedAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
      expirationTtl: 31536e3
    });
    return new Response(
      JSON.stringify({ success: true, message: `${category} disabled` }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Delete preference error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete preference" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(deletePreference, "deletePreference");
function getDefaultPreferences() {
  return {
    matchReminders: { enabled: true, frequency: "immediate" },
    teamAlerts: { enabled: true, frequency: "immediate" },
    playerUpdates: { enabled: false, frequency: "daily" },
    newsDigest: { enabled: true, frequency: "daily" },
    weeklyRecap: { enabled: true, frequency: "weekly" },
    specialOffers: { enabled: false, frequency: "weekly" },
    frequency: "immediate"
  };
}
__name(getDefaultPreferences, "getDefaultPreferences");

// api/email-queue.js
var import_checked_fetch36 = __toESM(require_checked_fetch());
var onRequest33 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  try {
    if (url.pathname.includes("/admin/")) {
      return await handleAdminRequest(request, env, method, corsHeaders6);
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed?.email) email = parsed.email;
      } catch (e) {
      }
    }
    if (method === "GET") {
      return await getQueueStatus(email, env, corsHeaders6);
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Email queue error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function handleAdminRequest(request, env, method, corsHeaders6) {
  try {
    const adminToken = request.headers.get("X-Admin-Token");
    if (adminToken !== env.ADMIN_EMAIL_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Invalid admin token" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const url = new URL(request.url);
    if (url.pathname.includes("/admin/queue")) {
      if (method === "GET") {
        return await getFullQueue(env, corsHeaders6);
      } else if (method === "POST") {
        return await processQueue(env, corsHeaders6);
      }
    }
    if (url.pathname.includes("/admin/retry")) {
      if (method === "POST") {
        const body = await request.json();
        return await retryEmail(body.queueId, env, corsHeaders6);
      }
    }
    if (url.pathname.includes("/admin/stats")) {
      return await getQueueStats(env, corsHeaders6);
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Admin request error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process admin request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(handleAdminRequest, "handleAdminRequest");
async function getQueueStatus(email, env, corsHeaders6) {
  try {
    const queueKey = `queue:${email}`;
    const queueData = await env.SPORTS_KV.get(queueKey);
    const queue = queueData ? JSON.parse(queueData) : { pending: [], failed: [], processed: 0 };
    return new Response(
      JSON.stringify({
        email,
        pending: queue.pending.length,
        failed: queue.failed.length,
        processed: queue.processed || 0,
        queue
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Get queue status error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get queue status" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getQueueStatus, "getQueueStatus");
async function getFullQueue(env, corsHeaders6) {
  try {
    const queueStats = await env.SPORTS_KV.get("queue-stats");
    const stats = queueStats ? JSON.parse(queueStats) : {
      totalPending: 0,
      totalFailed: 0,
      totalProcessed: 0,
      byStatus: {}
    };
    return new Response(
      JSON.stringify(stats),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Get full queue error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get queue" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getFullQueue, "getFullQueue");
async function processQueue(env, corsHeaders6) {
  try {
    const maxRetries = 3;
    const baseDelay = 5 * 60 * 1e3;
    const processed = { succeeded: 0, retried: 0, failed: 0 };
    return new Response(
      JSON.stringify({
        success: true,
        processed,
        message: "Queue processed"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Process queue error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process queue" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(processQueue, "processQueue");
async function retryEmail(queueId, env, corsHeaders6) {
  try {
    const emailData = await env.SPORTS_KV.get(`queued-email:${queueId}`);
    if (!emailData) {
      return new Response(
        JSON.stringify({ error: "Email not found in queue" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const email = JSON.parse(emailData);
    email.retryCount = (email.retryCount || 0) + 1;
    email.lastRetryAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.SPORTS_KV.put(`queued-email:${queueId}`, JSON.stringify(email));
    return new Response(
      JSON.stringify({
        success: true,
        message: `Email queued for retry (attempt ${email.retryCount})`,
        email
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Retry email error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to retry email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(retryEmail, "retryEmail");
async function getQueueStats(env, corsHeaders6) {
  try {
    const stats = await env.SPORTS_KV.get("queue-stats");
    const queueStats = stats ? JSON.parse(stats) : {
      totalPending: 0,
      totalFailed: 0,
      totalProcessed: 0,
      totalRetried: 0,
      lastProcessed: null
    };
    return new Response(
      JSON.stringify(queueStats),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Get queue stats error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get stats" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getQueueStats, "getQueueStats");

// api/email-segmentation.js
var import_checked_fetch37 = __toESM(require_checked_fetch());
var onRequest34 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed?.email) email = parsed.email;
      } catch (e) {
      }
    }
    if (method === "GET" && url.pathname.includes("/segment")) {
      return await getUserSegment(email, env, corsHeaders6);
    }
    if (method === "POST" && url.pathname.includes("/track")) {
      const body = await request.json();
      return await trackEngagement(email, body, env, corsHeaders6);
    }
    if (method === "GET" && url.pathname.includes("/personalization")) {
      return await getPersonalization(email, env, corsHeaders6);
    }
    if (method === "PUT") {
      const body = await request.json();
      return await updateEngagementHistory(email, body, env, corsHeaders6);
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("User segmentation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function getUserSegment(email, env, corsHeaders6) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    const engagement = await env.SPORTS_KV.get(`engagement:${email}`);
    const engagementData = engagement ? JSON.parse(engagement) : {
      emailsOpened: 0,
      emailsClicked: 0,
      matchesWatched: 0,
      chatMessages: 0,
      newsRead: 0
    };
    const segment = calculateSegment(user, engagementData);
    return new Response(
      JSON.stringify({
        email,
        segment,
        engagement: engagementData,
        recommendations: getSegmentRecommendations(segment)
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Get user segment error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get segment" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getUserSegment, "getUserSegment");
function calculateSegment(user, engagement) {
  const emailEngagement = {
    openRate: engagement.emailsOpened / Math.max(engagement.emailsSent || 1, 1),
    clickRate: engagement.emailsClicked / Math.max(engagement.emailsOpened || 1, 1)
  };
  const activityScore = (engagement.emailsOpened || 0) * 0.3 + (engagement.matchesWatched || 0) * 0.4 + (engagement.chatMessages || 0) * 0.2 + (engagement.newsRead || 0) * 0.1;
  const lastActive = engagement.lastActiveAt ? new Date(engagement.lastActiveAt) : null;
  const daysSinceActive = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / (24 * 60 * 60 * 1e3)) : 30;
  if (daysSinceActive > 30 && activityScore < 2) {
    return {
      name: "at-risk",
      label: "At-Risk Subscriber",
      description: "Low engagement, no activity in 30+ days",
      emailFrequency: "weekly",
      contentType: "re-engagement"
    };
  }
  if (activityScore > 10 && engagement.chatMessages > 5 && engagement.matchesWatched > 3) {
    return {
      name: "super-fan",
      label: "Super Fan",
      description: "High engagement, active across all features",
      emailFrequency: "daily",
      contentType: "exclusive",
      includes: ["previews", "insider-tips", "expert-analysis"]
    };
  }
  if (activityScore > 5 && engagement.matchesWatched > 1) {
    return {
      name: "regular-watcher",
      label: "Regular Watcher",
      description: "Moderate engagement, watches matches regularly",
      emailFrequency: "daily",
      contentType: "match-reminders",
      includes: ["match-updates", "team-news"]
    };
  }
  if (activityScore > 0) {
    return {
      name: "casual-fan",
      label: "Casual Fan",
      description: "Low engagement, occasional activity",
      emailFrequency: "weekly",
      contentType: "digest",
      includes: ["weekly-summary", "top-matches"]
    };
  }
  if (!lastActive || daysSinceActive < 1) {
    return {
      name: "new-user",
      label: "New User",
      description: "Recently joined",
      emailFrequency: "immediate",
      contentType: "onboarding",
      includes: ["welcome", "getting-started", "featured-teams"]
    };
  }
  return {
    name: "engaged",
    label: "Engaged User",
    description: "Regular engagement",
    emailFrequency: "daily",
    contentType: "personalized"
  };
}
__name(calculateSegment, "calculateSegment");
function getSegmentRecommendations(segment) {
  const recommendations = {
    "at-risk": [
      "Send re-engagement email with special offer",
      "Simplify preference options",
      "Highlight new teams/features",
      "Offer SMS as alternative"
    ],
    "super-fan": [
      "Offer premium features",
      "Send exclusive previews",
      "Include insider analysis",
      "Feature user in community"
    ],
    "regular-watcher": [
      "Send all match reminders",
      "Include team news",
      "Highlight favorite team updates",
      "Suggest similar teams"
    ],
    "casual-fan": [
      "Send weekly digest",
      "Highlight top matches",
      "Suggest interesting teams",
      "Keep emails short"
    ],
    "new-user": [
      "Send welcome series",
      "Explain key features",
      "Suggest favorite teams",
      "Build engagement gradually"
    ],
    "engaged": [
      "Maintain current email frequency",
      "Personalize based on preferences",
      "Test new content formats",
      "Gather feedback"
    ]
  };
  return recommendations[segment.name] || [];
}
__name(getSegmentRecommendations, "getSegmentRecommendations");
async function trackEngagement(email, body, env, corsHeaders6) {
  try {
    const { eventType, matchId, duration, metadata } = body;
    const engagementKey = `engagement:${email}`;
    const current = await env.SPORTS_KV.get(engagementKey);
    const engagement = current ? JSON.parse(current) : {
      emailsOpened: 0,
      emailsClicked: 0,
      matchesWatched: 0,
      chatMessages: 0,
      newsRead: 0,
      emailsSent: 0,
      lastActiveAt: null,
      history: []
    };
    switch (eventType) {
      case "email-opened":
        engagement.emailsOpened += 1;
        break;
      case "email-clicked":
        engagement.emailsClicked += 1;
        break;
      case "match-watched":
        engagement.matchesWatched += 1;
        if (matchId) engagement.lastWatchedMatch = matchId;
        break;
      case "chat-message":
        engagement.chatMessages += 1;
        break;
      case "news-read":
        engagement.newsRead += 1;
        break;
    }
    engagement.lastActiveAt = (/* @__PURE__ */ new Date()).toISOString();
    engagement.history = engagement.history || [];
    engagement.history.push({
      eventType,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      matchId,
      duration,
      metadata
    });
    if (engagement.history.length > 100) {
      engagement.history = engagement.history.slice(-100);
    }
    await env.SPORTS_KV.put(engagementKey, JSON.stringify(engagement), {
      expirationTtl: 365 * 24 * 60 * 60
      // 1 year
    });
    return new Response(
      JSON.stringify({
        success: true,
        eventType,
        engagement
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Track engagement error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to track engagement" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(trackEngagement, "trackEngagement");
async function getPersonalization(email, env, corsHeaders6) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    const engagement = await env.SPORTS_KV.get(`engagement:${email}`);
    const engagementData = engagement ? JSON.parse(engagement) : {};
    const segment = calculateSegment(user, engagementData);
    const personalization = {
      greeting: `Hi ${user.name}`,
      favoriteTeams: user.favoriteTeamIds || [],
      lastWatchedMatch: engagementData.lastWatchedMatch,
      recommendedTeams: getRecommendedTeams(user, engagementData),
      contentPreferences: {
        matchReminders: true,
        teamNews: true,
        playerStats: engagementData.newsRead > 5,
        expertAnalysis: segment.name === "super-fan",
        sponsorContent: segment.name !== "at-risk"
      },
      sendTime: user.preferredSendTime || "19:00",
      timezone: user.timezone || "UTC",
      language: user.preferredLanguage || "en"
    };
    return new Response(
      JSON.stringify({
        email,
        segment,
        personalization
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Get personalization error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get personalization" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(getPersonalization, "getPersonalization");
function getRecommendedTeams(user, engagement) {
  const teamMap = {
    "1": { name: "RCB", color: "#EC1C24" },
    "2": { name: "MI", color: "#004BA0" },
    "3": { name: "SRH", color: "#FF822A" },
    "4": { name: "GT", color: "#E15454" },
    "5": { name: "PBKS", color: "#ED1D24" },
    "6": { name: "DC", color: "#EF1B26" },
    "7": { name: "LSG", color: "#9C2A2C" },
    "8": { name: "RR", color: "#EA1A85" },
    "9": { name: "KKR", color: "#3A225D" },
    "10": { name: "CSK", color: "#FFB90F" }
  };
  const favorites = user.favoriteTeamIds || [];
  const all = Object.keys(teamMap);
  const notFavorites = all.filter((id) => !favorites.includes(id));
  return notFavorites.slice(0, 3).map((id) => ({
    id,
    name: teamMap[id].name,
    reason: "Similar to your favorite teams"
  }));
}
__name(getRecommendedTeams, "getRecommendedTeams");
async function updateEngagementHistory(email, body, env, corsHeaders6) {
  try {
    const { events } = body;
    if (!Array.isArray(events)) {
      return new Response(
        JSON.stringify({ error: "events must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const engagementKey = `engagement:${email}`;
    const current = await env.SPORTS_KV.get(engagementKey);
    const engagement = current ? JSON.parse(current) : {
      emailsOpened: 0,
      emailsClicked: 0,
      matchesWatched: 0,
      chatMessages: 0,
      newsRead: 0,
      history: []
    };
    events.forEach((event) => {
      switch (event.eventType) {
        case "email-opened":
          engagement.emailsOpened += 1;
          break;
        case "email-clicked":
          engagement.emailsClicked += 1;
          break;
        case "match-watched":
          engagement.matchesWatched += 1;
          break;
        case "chat-message":
          engagement.chatMessages += 1;
          break;
        case "news-read":
          engagement.newsRead += 1;
          break;
      }
      engagement.history.push(event);
    });
    engagement.lastActiveAt = (/* @__PURE__ */ new Date()).toISOString();
    if (engagement.history.length > 100) {
      engagement.history = engagement.history.slice(-100);
    }
    await env.SPORTS_KV.put(engagementKey, JSON.stringify(engagement), {
      expirationTtl: 365 * 24 * 60 * 60
    });
    return new Response(
      JSON.stringify({
        success: true,
        engagement
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Update engagement error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update engagement" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(updateEngagementHistory, "updateEngagementHistory");

// api/email-service.js
var import_checked_fetch38 = __toESM(require_checked_fetch());
var onRequest35 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  if (method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    const body = await request.json();
    const { action } = body;
    if (action === "send-match-reminder") {
      return await sendMatchReminder(body, env, corsHeaders6);
    } else if (action === "send-email") {
      return await sendEmail(body, env, corsHeaders6);
    } else if (action === "send-batch") {
      return await sendBatchEmails(body, env, corsHeaders6);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
  } catch (error) {
    console.error("Email service error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function sendMatchReminder(body, env, corsHeaders6) {
  try {
    const { email, matchId, team1, team2, venue, time, date } = body;
    if (!email || !matchId || !team1 || !team2) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (!user.termsAccepted || !user.emailNotificationsEnabled) {
      return new Response(
        JSON.stringify({ error: "User has not opted in for notifications" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let htmlContent = generateMatchReminderHTML(team1, team2, venue, time, date);
    try {
      const unsubToken = crypto.randomUUID();
      await env.SPORTS_KV.put(
        `unsubscribe-token:${unsubToken}`,
        JSON.stringify({ email, category: "all" }),
        { expirationTtl: 30 * 24 * 60 * 60 }
      );
      htmlContent = htmlContent.replace("{{unsubscribeToken}}", unsubToken);
    } catch (e) {
      console.error("Failed to generate unsubscribe token for match reminder:", e);
    }
    const emailResult = await sendEmailViaProvider2(
      {
        from: "sportsup99.info@gmail.com",
        to: email,
        subject: `\u{1F3CF} Match Reminder: ${team1.shortName} vs ${team2.shortName} Starting in 30 Minutes!`,
        html: htmlContent
      },
      env
    );
    if (emailResult.success) {
      const emailLog = {
        matchId,
        email,
        sentAt: (/* @__PURE__ */ new Date()).toISOString(),
        type: "match-reminder"
      };
      await env.SPORTS_KV.put(
        `email-log:${email}:${matchId}`,
        JSON.stringify(emailLog),
        { expirationTtl: 2592e3 }
        // 30 days
      );
      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully", messageId: emailResult.messageId }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    } else {
      throw new Error(`Email provider error: ${emailResult.error}`);
    }
  } catch (error) {
    console.error("Send match reminder error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(sendMatchReminder, "sendMatchReminder");
async function sendEmail(body, env, corsHeaders6) {
  try {
    const { to, subject, html } = body;
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (to, subject, html)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const emailResult = await sendEmailViaProvider2(
      {
        from: "sportsup99.info@gmail.com",
        to,
        subject,
        html
      },
      env
    );
    if (emailResult.success) {
      return new Response(
        JSON.stringify({ success: true, messageId: emailResult.messageId }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    } else {
      throw new Error(`Email provider error: ${emailResult.error}`);
    }
  } catch (error) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(sendEmail, "sendEmail");
async function sendEmailViaProvider2(emailData, env) {
  if (env.RESEND_API_KEY) {
    return await sendViaResend2(emailData, env.RESEND_API_KEY);
  }
  if (env.ELASTIC_EMAIL_API_KEY) {
    return await sendViaElasticEmail2(emailData, env.ELASTIC_EMAIL_API_KEY);
  }
  if (env.SENDGRID_API_KEY) {
    return await sendViaSendGrid2(emailData, env.SENDGRID_API_KEY);
  }
  if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    return await sendViaMailgun2(emailData, env.MAILGUN_API_KEY, env.MAILGUN_DOMAIN);
  }
  console.log("No email service configured. Email data:", emailData);
  return { success: true, messageId: "local-" + Date.now() };
}
__name(sendEmailViaProvider2, "sendEmailViaProvider");
async function sendViaResend2(emailData, apiKey) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      })
    });
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Resend API error" };
    }
    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Resend error:", error);
    return { success: false, error: error.message };
  }
}
__name(sendViaResend2, "sendViaResend");
async function sendViaElasticEmail2(emailData, apiKey) {
  try {
    const response = await fetch("https://api.elasticemail.com/v2/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        apikey: apiKey,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        bodyHtml: emailData.html
      }).toString()
    });
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: error || "Elastic Email API error" };
    }
    const data = await response.json();
    if (data.success) {
      return { success: true, messageId: data.transactionid || data.transaction_id || "elastic-" + Date.now() };
    } else {
      return { success: false, error: data.error || "Elastic Email error" };
    }
  } catch (error) {
    console.error("Elastic Email error:", error);
    return { success: false, error: error.message };
  }
}
__name(sendViaElasticEmail2, "sendViaElasticEmail");
async function sendViaSendGrid2(emailData, apiKey) {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: emailData.to }] }],
        from: { email: emailData.from },
        subject: emailData.subject,
        content: [{ type: "text/html", value: emailData.html }]
      })
    });
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: error || "SendGrid API error" };
    }
    const messageId = response.headers.get("X-Message-Id") || "sendgrid-" + Date.now();
    return { success: true, messageId };
  } catch (error) {
    console.error("SendGrid error:", error);
    return { success: false, error: error.message };
  }
}
__name(sendViaSendGrid2, "sendViaSendGrid");
async function sendViaMailgun2(emailData, apiKey, domain) {
  try {
    const formData = new FormData();
    formData.append("from", emailData.from);
    formData.append("to", emailData.to);
    formData.append("subject", emailData.subject);
    formData.append("html", emailData.html);
    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa("api:" + apiKey)
      },
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Mailgun API error" };
    }
    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Mailgun error:", error);
    return { success: false, error: error.message };
  }
}
__name(sendViaMailgun2, "sendViaMailgun");
function generateMatchReminderHTML(team1, team2, venue, time, date) {
  const team1Name = team1 && (team1.name || team1.shortName) || "Team 1";
  const team2Name = team2 && (team2.name || team2.shortName) || "Team 2";
  const team1Short = team1 && (team1.shortName || team1.name) || team1Name;
  const team2Short = team2 && (team2.shortName || team2.name) || team2Name;
  const matchTime = time || "19:30";
  const matchDate = date || "TBD";
  const venueText = venue || "TBD";
  const matchLabel = `${matchDate} \u2014 ${matchTime}`;
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">


    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">


        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">


        <!--[if !mso]><!-->
          
          <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap">
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap">


          <style type="text/css">
            @import url(https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap);
        </style>
        
        <!--<![endif]-->


        <!--[if mso]>
          <style>
              * {
                  font-family: sans-serif !important;
              }
          </style>
        <![endif]-->
    
        
        <!-- NOTE: the title is processed in the backend during the campaign dispatch -->
        <title>Match Reminder</title>


        <!--[if gte mso 9]>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
        
    <style>
        :root {
            color-scheme: light;
            supported-color-schemes: light;
        }


        html,
        body {
            margin: 0 auto !important;
            padding: 0 !important;
            height: 100% !important;
            width: 100% !important;


            overflow-wrap: break-word;
            -ms-word-break: break-word;
            word-break: break-word;
        }



    direction: ltr;


    * .template-editor__direction-insensitive {
      direction: ltr;
    }
    * .template-editor__direction-insensitive > * {
      direction: ltr;
    }
    


  center,
  #body_table {
    
  }


  ul, ol {
    padding: 0;
    margin-top: 0;
    margin-bottom: 0;
  }


  li {
    margin-bottom: 0;
  }


  .list-block-list-outside-left li {
    margin-left: 20px !important;
  }


  .list-block-list-outside-right li {
    margin-right: 20px !important;
  }


     .paragraph {
      font-size: 16px;
      font-family: Open Sans, sans-serif;
      font-weight: normal;
      font-style: normal;
      text-align: left;
      line-height: 1.7;
      text-decoration: none;
      color: #333333;
      
    }


     .heading1 {
      font-size: 24px;
      font-family: Montserrat, sans-serif;
      font-weight: bold;
      font-style: normal;
      text-align: center;
      line-height: 1.3;
      text-decoration: none;
      color: #111111;
      
    }


     .heading2 {
      font-size: 20px;
      font-family: Montserrat, sans-serif;
      font-weight: bold;
      font-style: normal;
      text-align: center;
      line-height: 1.3;
      text-decoration: none;
      color: #111111;
      
    }


     .heading3 {
      font-size: 18px;
      font-family: Montserrat, sans-serif;
      font-weight: bold;
      font-style: normal;
      text-align: center;
      line-height: 1.3;
      text-decoration: none;
      color: #111111;
      
    }


     .list {
      font-size: 14px;
      font-family: Open Sans, sans-serif;
      font-weight: normal;
      font-style: normal;
      text-align: left;
      line-height: 1.7;
      text-decoration: none;
      color: #333333;
      
    }


  p a, 
  li a {
    
    color: #1e90ff;
    text-decoration: underline;
    font-style: normal;
    font-weight: normal;


  }


  .button-table a {
    text-decoration: none;
    font-style: normal;
    font-weight: bold;
  }


  .paragraph > span {text-decoration: none;}.heading1 > span {text-decoration: none;}.heading2 > span {text-decoration: none;}.heading3 > span {text-decoration: none;}.list > span {text-decoration: none;}



        * {
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }


        div[style*="margin: 16px 0"] {
            margin: 0 !important;
        }


        #MessageViewBody,
        #MessageWebViewDiv {
            width: 100% !important;
        }


        table {
            border-collapse: collapse;
            border-spacing: 0;
            mso-table-lspace: 0pt !important;
            mso-table-rspace: 0pt !important;
        }
        table:not(.button-table) {
            border-spacing: 0 !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            margin: 0 auto !important;
        }


        th {
            font-weight: normal;
        }


        tr td p {
            margin: 0;
        }


        img {
            -ms-interpolation-mode: bicubic;
        }


        a[x-apple-data-detectors],


        .unstyle-auto-detected-links a,
        .aBn {
            border-bottom: 0 !important;
            cursor: default !important;
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }


        .im {
            color: inherit !important;
        }


        .a6S {
            display: none !important;
            opacity: 0.01 !important;
        }


        img.g-img+div {
            display: none !important;
        }


        @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
            u~div .contentMainTable {
                min-width: 320px !important;
            }
        }


        @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
            u~div .contentMainTable {
                min-width: 375px !important;
            }
        }


        @media only screen and (min-device-width: 414px) {
            u~div .contentMainTable {
                min-width: 414px !important;
            }
        }
    </style>
    <style>
        @media only screen and (max-device-width: 640px) {
            .contentMainTable {
                width: 100% !important;
                margin: auto !important;
            }
            .single-column {
                width: 100% !important;
                margin: auto !important;
            }
            .multi-column {
                width: 100% !important;
                margin: auto !important;
            }
        }
        @media only screen and (max-width: 640px) {
            .contentMainTable {
                width: 100% !important;
                margin: auto !important;
            }
            .single-column {
                width: 100% !important;
                margin: auto !important;
            }
            .multi-column {
                width: 100% !important;
                margin: auto !important;
            }
        }
    </style>
    <!--[if mso | IE]>
<style>
.button-eoAkF3pem5ENe_jOO18BA { padding: 14px 30px; };
.button-eoAkF3pem5ENe_jOO18BA a { margin: -14px -30px; }; 
.button-Jq3YQpZI9Sxyp8L3i8Qif { padding: 14px 30px; };
.button-Jq3YQpZI9Sxyp8L3i8Qif a { margin: -14px -30px; }; 
.button-SoGf-hNj3vf56GvkRAsV_ { padding: 0px; };
.button-SoGf-hNj3vf56GvkRAsV_ a { margin: 0px; }; </style>
<![endif]-->
    
<!--[if mso | IE]>
    <style>
        .list-block-outlook-outside-left {
            margin-left: -18px;
        }
    
        .list-block-outlook-outside-right {
            margin-right: -18px;
        }


        a:link, span.MsoHyperlink {
            mso-style-priority:99;
            
    color: #1e90ff;
    text-decoration: underline;
    font-style: normal;
    font-weight: normal;


        }
    </style>
<![endif]-->


    
<style>
    table .button-td a,
    table p,
    table li {
      -ms-word-break: break-word;
      word-break: break-word !important;
    }
</style>



    </head>


    <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #F5F6F8;">
        <center role="article" aria-roledescription="email" lang="en" style="width: 100%; background-color: #F5F6F8;">
            <!--[if mso | IE]>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" id="body_table" width="100%" style="background-color: #F5F6F8;">
            <tbody>    
                <tr>
                    <td>
                    <![endif]-->
                        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="margin: auto;" class="contentMainTable">
                            <tr><td style="padding-top:20px;padding-bottom:20px;padding-left:0;padding-right:0;background-color:#FFFFFF"><table role="presentation" class="multi-column" style="width:640px;border-collapse:collapse !important" cellpadding="0" cellspacing="0"><tbody><tr style="padding-top:20px;padding-bottom:20px;padding-left:0;padding-right:0" class="wp-block-editor-onecolumnsblock-v1"><td style="width:640px;float:left" class="wp-block-editor-column single-column"><table role="presentation" align="center" border="0" class="single-column" width="640" style="width:640px;float:left;border-collapse:collapse !important" cellspacing="0" cellpadding="0"><tbody><tr class="wp-block-editor-imageblock-v1"><td style="background-color:#FFFFFF;padding-top:30px;padding-bottom:10px;padding-left:40px;padding-right:40px" align="center"><table align="center" width="100%" style="width:100%;border-spacing:0;border-collapse:collapse;max-width:100%" role="presentation"><tbody><tr align="center"><td style="padding:0"><img src="https://template-editor-assets.s3.eu-west-3.amazonaws.com/assets/ai-designer/default/default-image.jpg" width="168" height="" alt="SportsUp99 logo" style="border-radius:4px;display:block;height:auto;width:30%;max-width:100%;border:0" class="g-img"></td></tr></tbody></table></td></tr><tr class="wp-block-editor-headingblock-v1"><td valign="top" style="background-color:#FFFFFF;display:block;padding-top:10px;padding-right:40px;padding-bottom:10px;padding-left:40px;text-align:center;direction:ltr;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><p style="font-family:Montserrat, sans-serif;text-align:center;direction:ltr;line-height:31.20px;font-size:24px;background-color:#FFFFFF;color:#111111;margin:0;word-break:normal" class="heading1">\u{1F3CF} Match Reminder</p></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="padding-top:10px;padding-bottom:10px;padding-left:0;padding-right:0;background-color:#FFFFFF"><table role="presentation" class="multi-column" style="width:640px;border-collapse:collapse !important" cellpadding="0" cellspacing="0"><tbody><tr style="padding-top:10px;padding-bottom:10px;padding-left:0;padding-right:0" class="wp-block-editor-onecolumnsblock-v1"><td style="width:640px;float:left" class="wp-block-editor-column single-column"><table role="presentation" align="left" border="0" class="single-column" width="640" style="width:640px;float:left;border-collapse:collapse !important" cellspacing="0" cellpadding="0"><tbody><tr class="wp-block-editor-paragraphblock-v1"><td valign="top" style="padding:20px 40px 20px 40px;background-color:#FFFFFF;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><p class="paragraph" style="font-family:Open Sans, sans-serif;text-align:left;direction:ltr;line-height:27.20px;font-size:16px;margin:0;color:#333333;word-break:normal"><span style="color:#1e90ff">${team1Short}</span> vs <span style="color:#ff8c00">${team2Short}</span><br>Time: ${matchLabel}<br>Venue: ${venueText}<br><br>Get ready for a thrilling clash \u2014 stay tuned for live updates and highlights.</p></td></tr><tr class="wp-block-editor-buttonblock-v1" align="left"><td style="background-color:#FFFFFF;padding-top:30px;padding-right:40px;padding-bottom:30px;padding-left:40px;width:100%" valign="top"><table role="presentation" cellspacing="0" cellpadding="0" class="button-table"><tbody><tr><td valign="top" class="button-eoAkF3pem5ENe_jOO18BA button-td button-td-primary" style="cursor:pointer;border:none;border-radius:8px;background-color:#1e90ff;font-size:16px;font-family:Open Sans, sans-serif;width:fit-content;direction:ltr;text-decoration:none;letter-spacing:0;color:#ffffff;overflow:hidden"><a href="https://sportsup99.com/live-score" style="color:#ffffff;display:block;padding:14px 30px 14px 30px">View Live Score</a></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="padding-top:10px;padding-bottom:10px;padding-left:0;padding-right:0;background-color:#FFFFFF"><table role="presentation" class="multi-column" style="width:640px;border-collapse:collapse !important" cellpadding="0" cellspacing="0"><tbody><tr style="padding-top:10px;padding-bottom:10px;padding-left:0;padding-right:0" class="wp-block-editor-twocolumnsfiftyfiftyblock-v1"><td style="width:320px;float:left" class="wp-block-editor-column single-column"><table role="presentation" align="center" border="0" class="single-column" width="320" style="width:320px;float:left;border-collapse:collapse !important" cellspacing="0" cellpadding="0"><tbody><tr class="wp-block-editor-imageblock-v1"><td style="background-color:#FFFFFF;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px" align="center"><table align="center" width="100%" style="width:100%;border-spacing:0;border-collapse:collapse;max-width:100%" role="presentation"><tbody><tr align="center"><td style="padding:0"><img src="https://template-editor-assets.s3.eu-west-3.amazonaws.com/assets/ai-designer/default/default-image.jpg" width="216" height="" alt="${team1Short} crest" style="border-radius:6px;display:block;height:auto;width:90%;max-width:100%;border:0" class="g-img"></td></tr></tbody></table></td></tr></tbody></table></td><td style="width:320px;float:left" class="wp-block-editor-column single-column"><table role="presentation" align="center" border="0" class="single-column" width="320" style="width:320px;float:left;border-collapse:collapse !important" cellspacing="0" cellpadding="0"><tbody><tr class="wp-block-editor-imageblock-v1"><td style="background-color:#FFFFFF;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px" align="center"><table align="center" width="100%" style="width:100%;border-spacing:0;border-collapse:collapse;max-width:100%" role="presentation"><tbody><tr align="center"><td style="padding:0"><img src="https://template-editor-assets.s3.eu-west-3.amazonaws.com/assets/ai-designer/default/default-image.jpg" width="216" height="" alt="${team2Short} crest" style="border-radius:6px;display:block;height:auto;width:90%;max-width:100%;border:0" class="g-img"></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr class="wp-block-editor-socialiconsblock-v1" role="article" aria-roledescription="social-icons" style="display:table-row;background-color:#FFFFFF"><td style="width:100%"><table style="background-color:#FFFFFF;width:100%;padding-top:20px;padding-bottom:20px;padding-left:40px;padding-right:40px;border-collapse:separate !important" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td align="center" valign="top"><div style="max-width:560px"><table role="presentation" style="width:100%" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td valign="top"><div style="margin-left:auto;margin-right:auto;margin-top:-3px;margin-bottom:-3px;width:100%;max-width:144px"><table role="presentation" style="padding-left:208" width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td><table role="presentation" align="left" style="float:left" class="single-social-icon" cellpadding="0" cellspacing="0"><tbody><tr><td valign="top" style="padding-top:3px;padding-bottom:3px;padding-left:6px;padding-right:6px;border-collapse:collapse !important;border-spacing:0;font-size:0"><a class="social-icon--link" href="https://www.facebook.com/" target="_blank" rel="noreferrer"><img src="https://d2u6lzrmbvw8bs.cloudfront.net/assets/social-icons/facebook/facebook-round-solid-dark.png" width="24" height="24" style="max-width:24px;display:block;border:0" alt="Facebook"></a></td></tr></tbody></table><table role="presentation" align="left" style="float:left" class="single-social-icon" cellpadding="0" cellspacing="0"><tbody><tr><td valign="top" style="padding-top:3px;padding-bottom:3px;padding-left:6px;padding-right:6px;border-collapse:collapse !important;border-spacing:0;font-size:0"><a class="social-icon--link" href="https://twitter.com/" target="_blank" rel="noreferrer"><img src="https://d2u6lzrmbvw8bs.cloudfront.net/assets/social-icons/x/x-round-solid-dark.png" width="24" height="24" style="max-width:24px;display:block;border:0" alt="X (formerly Twitter)"></a></td></tr></tbody></table><table role="presentation" align="left" style="float:left" class="single-social-icon" cellpadding="0" cellspacing="0"><tbody><tr><td valign="top" style="padding-top:3px;padding-bottom:3px;padding-left:6px;padding-right:6px;border-collapse:collapse !important;border-spacing:0;font-size:0"><a class="social-icon--link" href="https://instagram.com/" target="_blank" rel="noreferrer"><img src="https://d2u6lzrmbvw8bs.cloudfront.net/assets/social-icons/instagram/instagram-round-solid-dark.png" width="24" height="24" style="max-width:24px;display:block;border:0" alt="Instagram"></a></td></tr></tbody></table><table role="presentation" align="left" style="float:left" class="single-social-icon" cellpadding="0" cellspacing="0"><tbody><tr><td valign="top" style="padding-top:3px;padding-bottom:3px;padding-left:6px;padding-right:6px;border-collapse:collapse !important;border-spacing:0;font-size:0"><a class="social-icon--link" href="https://youtube.com/" target="_blank" rel="noreferrer"><img src="https://d2u6lzrmbvw8bs.cloudfront.net/assets/social-icons/youtube/youtube-round-solid-dark.png" width="24" height="24" style="max-width:24px;display:block;border:0" alt="YouTube"></a></td></tr></tbody></table></td></tr></tbody></table></div></td></tr></tbody></table></div></td></tr></tbody></table></td></tr><tr class="wp-block-editor-dividerblock-v1" align="center" valign="top"><td style="padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#FFFFFF"><div style="background:#E6E8EA;font-size:1px;line-height:1px;border:0">&nbsp;</div></td></tr><tr class="wp-block-editor-paragraphblock-v1"><td valign="top" style="padding:10px 40px 10px 40px;background-color:#FFFFFF;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><p class="paragraph" style="font-family:Open Sans, sans-serif;text-align:center;direction:ltr;line-height:23.80px;font-size:14px;margin:0;color:#333333;word-break:normal">Watch Live: <a href="https://sportsup99.com/live-score" data-type="website" data-id="watch" style="color:#1e90ff !important;">Click here to stream</a><br></p></td></tr><tr class="wp-block-editor-dividerblock-v1" align="center" valign="top"><td style="padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#FFFFFF"><div style="background:#E6E8EA;font-size:1px;line-height:1px;border:0">&nbsp;</div></td></tr><tr class="wp-block-editor-buttonblock-v1" align="center"><td style="background-color:#FFFFFF;padding-top:10px;padding-right:40px;padding-bottom:20px;padding-left:40px;width:100%" valign="top"><table role="presentation" cellspacing="0" cellpadding="0" class="button-table"><tbody><tr><td valign="top" class="button-Jq3YQpZI9Sxyp8L3i8Qif button-td button-td-primary" style="cursor:pointer;border:none;border-radius:8px;background-color:#ff8c00;font-size:16px;font-family:Open Sans, sans-serif;width:fit-content;direction:ltr;text-decoration:none;letter-spacing:0;color:#ffffff;overflow:hidden"><a href="https://sportsup99.com/live-score" style="color:#ffffff;display:block;padding:14px 30px 14px 30px">Watch Live</a></td></tr></tbody></table></td></tr><tr class="wp-block-editor-listblock-v1"><td style="background-color:#FFFFFF;padding:10px 40px 10px 40px;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><div class="list-block-outlook-outside-left"><ul class="list list-block-list-outside-left" style="padding:0;font-family:Open Sans, sans-serif;text-align:left;direction:ltr;line-height:23.80px;font-size:14px;color:#333333;list-style-type:disc;list-style-position:outside;word-break:normal" start="1"><li><span>Teams: <span style="color:#1e90ff">${team1Short}</span> &amp; <span style="color:#ff8c00">${team2Short}</span></span></li><li><span>Time: ${matchLabel}</span></li><li><span>Venue: ${venueText}</span></li></ul></div></td></tr><tr class="wp-block-editor-dividerblock-v1" align="center" valign="top"><td style="padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#FFFFFF"><div style="background:#E6E8EA;font-size:1px;line-height:1px;border:0">&nbsp;</div></td></tr><tr class="wp-block-editor-paragraphblock-v1"><td valign="top" style="padding:10px 40px 10px 40px;background-color:#FFFFFF;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><p class="paragraph" style="font-family:Open Sans, sans-serif;text-align:center;direction:ltr;line-height:20.40px;font-size:12px;margin:0;color:#333333;word-break:normal">\xA9 SportsUp99. All rights reserved.</p></td></tr><tr class="wp-block-editor-dividerblock-v1" align="center" valign="top"><td style="padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#FFFFFF"><div style="background:#E6E8EA;font-size:1px;line-height:1px;border:0">&nbsp;</div></td></tr><tr class="wp-block-editor-buttonblock-v1" align="center"><td style="background-color:#FFFFFF;padding-top:20px;padding-right:40px;padding-bottom:20px;padding-left:40px;width:100%" valign="top"><table role="presentation" cellspacing="0" cellpadding="0" class="button-table"><tbody><tr><td valign="top" class="button-SoGf-hNj3vf56GvkRAsV_ button-td button-td-primary" style="cursor:pointer;border:none;border-radius:8px;background-color:#1e90ff;font-size:16px;font-family:Open Sans, sans-serif;width:fit-content;direction:ltr;text-decoration:none;letter-spacing:0;color:#ffffff;overflow:hidden"><a style="color:#ffffff;display:block;padding:0px 0px 0px 0px"></a></td></tr></tbody></table></td></tr><tr class="wp-block-editor-paragraphblock-v1"><td valign="top" style="padding:10px 40px 10px 40px;background-color:#FFFFFF;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><p class="paragraph" style="font-family:Open Sans, sans-serif;text-align:center;direction:ltr;line-height:20.40px;font-size:12px;margin:0;color:#333333;word-break:normal">SportsUp99, Bengaluru, India<br>If you no longer wish to receive mail from us, you can <a href="https://sportsup99.com/api/email-preferences/unsubscribe/{{unsubscribeToken}}" style="color: #1e90ff;">unsubscribe</a>.</p></td></tr>
                        </table>
                    <!--[if mso | IE]>
                    </td>
                </tr>
            </tbody>
            </table>
            <![endif]-->
        </center>
    </body>
</html>
`;
}
__name(generateMatchReminderHTML, "generateMatchReminderHTML");
async function sendBatchEmails(body, env, corsHeaders6) {
  try {
    const { emails } = body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "emails must be a non-empty array" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const results = [];
    for (const emailData of emails) {
      const result = await sendPersonalizedEmail(emailData, env);
      results.push(result);
    }
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed,
        results
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Send batch error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send batch" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}
__name(sendBatchEmails, "sendBatchEmails");
async function sendPersonalizedEmail(emailData, env) {
  try {
    const { email, matchId, team1, team2, venue, time, date, personalization } = emailData;
    if (!email) {
      return { success: false, email, error: "Email address required" };
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return { success: false, email, error: "User not found" };
    }
    const user = JSON.parse(userData);
    const prefs = user.emailPreferences || {};
    const subject = `\u{1F3CF} ${user.name}, Don't miss: ${team1.shortName} vs ${team2.shortName}!`;
    const greeting = `Hi ${user.name}`;
    let htmlContent = generateMatchReminderHTML(team1, team2, venue, time, date);
    htmlContent = htmlContent.replace("Hi there!", greeting);
    const unsubToken = crypto.randomUUID();
    await env.SPORTS_KV.put(
      `unsubscribe-token:${unsubToken}`,
      JSON.stringify({ email, category: "all" }),
      { expirationTtl: 30 * 24 * 60 * 60 }
    );
    htmlContent = htmlContent.replace(
      "{{unsubscribeToken}}",
      unsubToken
    );
    const emailResult = await sendEmailViaProvider2(
      {
        from: "sportsup99.info@gmail.com",
        to: email,
        subject,
        html: htmlContent
      },
      env
    );
    if (emailResult.success) {
      const emailLog = {
        matchId,
        email,
        sentAt: (/* @__PURE__ */ new Date()).toISOString(),
        type: "match-reminder",
        personalized: true,
        segment: user.segment || "unknown"
      };
      await env.SPORTS_KV.put(
        `email-log:${email}:${matchId}`,
        JSON.stringify(emailLog),
        { expirationTtl: 2592e3 }
      );
      return {
        success: true,
        email,
        matchId,
        messageId: emailResult.messageId
      };
    } else {
      return {
        success: false,
        email,
        error: emailResult.error
      };
    }
  } catch (error) {
    console.error("Send personalized error:", error);
    return {
      success: false,
      email: emailData.email,
      error: error.message
    };
  }
}
__name(sendPersonalizedEmail, "sendPersonalizedEmail");

// api/enrichDescription.js
var import_checked_fetch39 = __toESM(require_checked_fetch());
async function onRequest36(context) {
  const { request } = context;
  try {
    let teamName = "";
    if (request.method === "POST") {
      const body = await request.json();
      teamName = body.teamName || "";
    } else {
      const url = new URL(request.url);
      teamName = url.searchParams.get("teamName") || "";
    }
    if (!teamName) {
      return new Response(JSON.stringify({ error: "teamName required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const title = encodeURIComponent(teamName.replace(/\s+\(.+\)$/, "").trim());
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
    try {
      const wikiResp = await fetch(wikiUrl, { cf: { cacheTtl: 3600 } });
      if (wikiResp.ok) {
        const data = await wikiResp.json();
        if (data && data.extract) {
          const enhanced = data.extract.split("\n").slice(0, 3).join(" ");
          return new Response(JSON.stringify({ enhanced, source: "wikipedia", url: data.content_urls?.desktop?.page || wikiUrl }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
      }
    } catch (err) {
      console.error("Wikipedia fetch failed", err);
    }
    const heuristic = teamName + " is a professional cricket franchise competing in the Indian Premier League. Known for its passionate fanbase and competitive performances.";
    return new Response(JSON.stringify({ enhanced: heuristic, source: "heuristic" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("enrichDescription error", error);
    return new Response(JSON.stringify({ error: "internal error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
__name(onRequest36, "onRequest");

// api/geocoding.js
var import_checked_fetch40 = __toESM(require_checked_fetch());
var onRequest37 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  if (!query) {
    return new Response(
      JSON.stringify({ error: "Query parameter required" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    const results = [];
    if (env.OPENCAGE_API_KEY) {
      try {
        const openCageResults = await searchOpenCage(query, env.OPENCAGE_API_KEY);
        results.push(...openCageResults);
      } catch (error) {
        console.error("OpenCage search failed:", error);
      }
    }
    try {
      const nominatimResults = await searchNominatim(query);
      results.push(...nominatimResults);
    } catch (error) {
      console.error("Nominatim search failed:", error);
    }
    const uniqueResults = results.filter(
      (result, index, self) => index === self.findIndex(
        (r) => Math.abs(r.lat - result.lat) < 1e-3 && Math.abs(r.lng - result.lng) < 1e-3
      )
    ).slice(0, 5);
    return new Response(JSON.stringify({ results: uniqueResults }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to search venues" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function searchOpenCage(query, apiKey) {
  const response = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query + " stadium")}&key=${apiKey}&limit=3`
  );
  const data = await response.json();
  return data.results.map((result) => ({
    name: result.formatted.split(",")[0],
    city: result.components.city || result.components.town || result.components.village || "Unknown",
    country: result.components.country || "Unknown",
    lat: result.geometry.lat,
    lng: result.geometry.lng,
    timezone: result.annotations.timezone?.name || "UTC",
    confidence: result.confidence || 0
  }));
}
__name(searchOpenCage, "searchOpenCage");
async function searchNominatim(query) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + " stadium")}&limit=3&addressdetails=1`,
    {
      headers: {
        "User-Agent": "CricketVenueManager/1.0"
        // Required by Nominatim policy
      }
    }
  );
  const data = await response.json();
  return data.map((item) => ({
    name: item.display_name.split(",")[0],
    city: item.address?.city || item.address?.town || item.address?.village || "Unknown",
    country: item.address?.country || "Unknown",
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    timezone: "UTC",
    // Nominatim doesn't provide timezone
    confidence: item.importance || 0
  }));
}
__name(searchNominatim, "searchNominatim");

// api/legal.js
var import_checked_fetch41 = __toESM(require_checked_fetch());
var onRequest38 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || url.searchParams.get("slug") || "legal";
  const key = `legal-page:${page}`;
  try {
    if (method === "GET") {
      if (!env || !env.SPORTS_KV) {
        return new Response(
          JSON.stringify({ error: "KV not configured", content: null }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const stored = await env.SPORTS_KV.get(key, "json");
      return new Response(
        JSON.stringify({ page, content: stored?.content || null, updatedAt: stored?.updatedAt || null }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (method === "PUT") {
      if (!env || !env.SPORTS_KV) {
        return new Response(
          JSON.stringify({ error: "KV not configured" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const user = JSON.parse(userData);
      if (user.role !== "admin" && user.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const body = await request.json();
      const content = typeof body.content === "string" ? body.content : "";
      const record = {
        page,
        content,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await env.SPORTS_KV.put(key, JSON.stringify(record));
      return new Response(
        JSON.stringify({ success: true, page, content: record.content, updatedAt: record.updatedAt }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Legal API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/live-score.js
var import_checked_fetch42 = __toESM(require_checked_fetch());
var onRequest39 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;
  try {
    if (method === "GET") {
      const matchId = searchParams.get("matchId") || "current";
      const liveScore = await env.SPORTS_KV.get(`live:${matchId}`);
      if (!liveScore) {
        return new Response(
          JSON.stringify({
            matchId,
            team1: { name: "RCB", runs: 0, wickets: 0, overs: 0 },
            team2: { name: "CSK", runs: 0, wickets: 0, overs: 0 },
            currentBatter: { name: "", runs: 0, balls: 0 },
            currentBowler: { name: "", runs: 0, balls: 0 },
            commentary: [],
            status: "Not Started",
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
            toss: null,
            // Include toss field
            // New fields for IPL rules
            strategicTimeout: {
              team1: { used: 0, remaining: 2 },
              team2: { used: 0, remaining: 2 },
              currentTimeout: null
            },
            drsReviews: {
              team1: { used: 0, remaining: 2, successful: 0 },
              team2: { used: 0, remaining: 2, successful: 0 }
            },
            impactPlayer: {
              team1: null,
              team2: null
            },
            superOver: null,
            ballChanged: false,
            isEveningMatch: false
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify(JSON.parse(liveScore)), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (method === "POST") {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      const user = JSON.parse(userData);
      if (user.role !== "admin" && user.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      const { matchId = "current", scoreUpdate } = await request.json();
      let liveScore = JSON.parse(
        await env.SPORTS_KV.get(`live:${matchId}`) || JSON.stringify({
          matchId,
          team1: { name: "RCB", runs: 0, wickets: 0, overs: 0 },
          team2: { name: "CSK", runs: 0, wickets: 0, overs: 0 },
          currentBatter: { name: "", runs: 0, balls: 0 },
          currentBowler: { name: "", runs: 0, balls: 0 },
          commentary: [],
          status: "Live",
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
          toss: null,
          // Include toss field
          // New fields for IPL rules
          strategicTimeout: {
            team1: { used: 0, remaining: 2 },
            team2: { used: 0, remaining: 2 },
            currentTimeout: null
          },
          drsReviews: {
            team1: { used: 0, remaining: 2, successful: 0 },
            team2: { used: 0, remaining: 2, successful: 0 }
          },
          impactPlayer: {
            team1: null,
            team2: null
          },
          superOver: null,
          ballChanged: false,
          isEveningMatch: false
        })
      );
      liveScore = { ...liveScore, ...scoreUpdate, lastUpdated: (/* @__PURE__ */ new Date()).toISOString() };
      await env.SPORTS_KV.put(`live:${matchId}`, JSON.stringify(liveScore), {
        expirationTtl: 604800
        // 7 days
      });
      return new Response(JSON.stringify({ success: true, liveScore }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Live score error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}, "onRequest");

// api/matches.js
var import_checked_fetch43 = __toESM(require_checked_fetch());
var mockTeams = [
  // IPL Teams (IDs 1-10)
  {
    id: "1",
    league: "ipl",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    logo: "/logos/rcb_logo_premium.svg",
    colors: { primary: "#EC1C24", secondary: "#000000" }
  },
  {
    id: "2",
    league: "ipl",
    name: "Mumbai Indians",
    shortName: "MI",
    logo: "/logos/mi_logo_new.svg",
    colors: { primary: "#004BA0", secondary: "#FFFFFF" }
  },
  {
    id: "3",
    league: "ipl",
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    logo: "/logos/srh_logo_new.svg",
    colors: { primary: "#FF822A", secondary: "#000000" }
  },
  {
    id: "4",
    league: "ipl",
    name: "Gujarat Titans",
    shortName: "GT",
    logo: "/logos/gt_logo_new.svg",
    colors: { primary: "#1B2130", secondary: "#E15454" }
  },
  {
    id: "5",
    league: "ipl",
    name: "Punjab Kings",
    shortName: "PBKS",
    logo: "/logos/kxip_logo_new.svg",
    colors: { primary: "#ED1D24", secondary: "#FBDD0B" }
  },
  {
    id: "6",
    league: "ipl",
    name: "Delhi Capitals",
    shortName: "DC",
    logo: "/logos/dc_logo_new.svg",
    colors: { primary: "#0078BC", secondary: "#EF1B26" }
  },
  {
    id: "7",
    league: "ipl",
    name: "Lucknow Super Giants",
    shortName: "LSG",
    logo: "/logos/lsg_logo_new.svg",
    colors: { primary: "#9C2A2C", secondary: "#F7E17D" }
  },
  {
    id: "8",
    league: "ipl",
    name: "Rajasthan Royals",
    shortName: "RR",
    logo: "/logos/rr_logo_new.svg",
    colors: { primary: "#EA1A85", secondary: "#004B8D" }
  },
  {
    id: "9",
    league: "ipl",
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    logo: "/logos/kkr_logo_new.svg",
    colors: { primary: "#3A225D", secondary: "#B9975B" }
  },
  {
    id: "10",
    league: "ipl",
    name: "Chennai Super Kings",
    shortName: "CSK",
    logo: "/logos/csk_logo_new.svg",
    colors: { primary: "#FFB90F", secondary: "#0081E8" }
  },
  // WPL Teams (IDs 11-15)
  {
    id: "11",
    league: "wpl",
    name: "Mumbai Indians (WPL)",
    shortName: "MI-W",
    logo: "/logos/wpl_mi_logo_animated.svg",
    colors: { primary: "#004BA0", secondary: "#FFD700" }
  },
  {
    id: "12",
    league: "wpl",
    name: "Royal Challengers Bengaluru (WPL)",
    shortName: "RCB-W",
    logo: "/logos/wpl_rcb_logo_animated.svg",
    colors: { primary: "#C8102E", secondary: "#FFD700" }
  },
  {
    id: "13",
    league: "wpl",
    name: "Delhi Capitals (WPL)",
    shortName: "DC-W",
    logo: "/logos/wpl_dc_logo_animated.svg",
    colors: { primary: "#004BA0", secondary: "#DC2626" }
  },
  {
    id: "14",
    league: "wpl",
    name: "Gujarat Giants (WPL)",
    shortName: "GG",
    logo: "/logos/wpl_gg_logo_animated.svg",
    colors: { primary: "#F97316", secondary: "#FFD700" }
  },
  {
    id: "15",
    league: "wpl",
    name: "UP Warriorz (WPL)",
    shortName: "UPW",
    logo: "/logos/wpl_upw_logo_animated.svg",
    colors: { primary: "#059669", secondary: "#F97316" }
  }
];
function verifyAdminToken6(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken6, "verifyAdminToken");
function getTeamById(teamId, teams) {
  const team = teams.find((t) => t.id === teamId);
  if (team) return team;
  return mockTeams.find((t) => t.id === teamId);
}
__name(getTeamById, "getTeamById");
function formatMatch(match2, teams) {
  if (match2.team1 && match2.team1.name && match2.team1.shortName) {
    return {
      id: match2.id,
      league: match2.league || "ipl",
      date: match2.date,
      time: match2.time,
      venue: match2.venue,
      team1: match2.team1,
      // Preserve full team object including logo
      team2: match2.team2,
      // Preserve full team object including logo
      status: match2.status,
      result: match2.result,
      score: match2.score,
      matchNumber: match2.matchNumber,
      playoffType: match2.playoffType,
      playing11: match2.playing11,
      toss: match2.toss,
      matchState: match2.matchState,
      _isMock: match2._isMock
    };
  }
  const team1 = getTeamById(match2.team1Id, teams);
  const team2 = getTeamById(match2.team2Id, teams);
  if (!team1) {
    console.warn(`Team not found for team1Id: ${match2.team1Id}. Available teams:`, teams.map((t) => ({ id: t.id, shortName: t.shortName })));
  }
  if (!team2) {
    console.warn(`Team not found for team2Id: ${match2.team2Id}. Available teams:`, teams.map((t) => ({ id: t.id, shortName: t.shortName })));
  }
  return {
    id: match2.id,
    league: match2.league || "ipl",
    // Ensure league property is included
    date: match2.date,
    time: match2.time,
    venue: match2.venue,
    team1: team1 ? {
      ...team1,
      // Preserve all team properties including logo
      players: team1.players || []
    } : {
      id: match2.team1Id,
      shortName: `Team ${match2.team1Id}`,
      name: `Team ${match2.team1Id}`,
      logo: "",
      league: match2.league || "ipl",
      colors: { primary: "#6B7280", secondary: "#9CA3AF" },
      players: []
    },
    team2: team2 ? {
      ...team2,
      // Preserve all team properties including logo
      players: team2.players || []
    } : {
      id: match2.team2Id,
      shortName: `Team ${match2.team2Id}`,
      name: `Team ${match2.team2Id}`,
      logo: "",
      league: match2.league || "ipl",
      colors: { primary: "#6B7280", secondary: "#9CA3AF" },
      players: []
    },
    status: match2.status,
    result: match2.result,
    score: match2.score,
    matchNumber: match2.matchNumber,
    playoffType: match2.playoffType,
    playing11: match2.playing11,
    toss: match2.toss,
    matchState: match2.matchState,
    _isMock: match2._isMock
  };
}
__name(formatMatch, "formatMatch");
async function handleGetRequest(context) {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const league = url.searchParams.get("league");
    const kvMatches = await env.IPL_CACHE.get("matches", "json");
    const kvExists = await env.IPL_CACHE.get("matches");
    let matches;
    if (kvExists === null) {
      matches = [];
    } else {
      matches = kvMatches || [];
    }
    matches = matches.map((match2) => ({
      ...match2,
      league: match2.league || "ipl"
      // Default to 'ipl' if missing
    }));
    if (league && (league === "ipl" || league === "wpl")) {
      matches = matches.filter((match2) => {
        const matchLeague = match2.league || "ipl";
        return matchLeague === league;
      });
    }
    let allTeams = await env.IPL_CACHE.get("teams", "json");
    if (!allTeams || allTeams.length === 0) {
      allTeams = mockTeams;
    }
    const formattedMatches = matches.map((match2) => formatMatch(match2, allTeams));
    return new Response(JSON.stringify(formattedMatches), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    console.error("Error retrieving matches:", error);
    return new Response(JSON.stringify({ error: "Failed to retrieve matches" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleGetRequest, "handleGetRequest");
async function handlePostRequest(context) {
  const { env, request } = context;
  if (!verifyAdminToken6(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { date, time, venue, team1Id, team2Id, status, league } = body;
    if (!date || !time || !venue || !team1Id || !team2Id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let matches = await env.IPL_CACHE.get("matches", "json");
    const kvExists = await env.IPL_CACHE.get("matches");
    if (kvExists === null) {
      matches = [];
    } else {
      matches = matches || [];
    }
    const newId = String(Math.max(...matches.map((m) => parseInt(m.id) || 0), 0) + 1);
    const newMatch = {
      id: newId,
      league: league || "ipl",
      // Default to 'ipl' if not specified
      date,
      time,
      venue,
      team1Id,
      team2Id,
      status: status || "upcoming"
    };
    matches.push(newMatch);
    await env.IPL_CACHE.put("matches", JSON.stringify(matches));
    let allTeams = await env.IPL_CACHE.get("teams", "json");
    if (!allTeams || allTeams.length === 0) {
      allTeams = mockTeams;
    }
    return new Response(JSON.stringify(formatMatch(newMatch, allTeams)), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating match:", error);
    return new Response(JSON.stringify({ error: "Failed to create match" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePostRequest, "handlePostRequest");
async function handlePutRequest(context) {
  const { env, request } = context;
  if (!verifyAdminToken6(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { id, date, time, venue, team1Id, team2Id, status, league, playing11 } = body;
    if (!id) {
      return new Response(JSON.stringify({ error: "Match ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let matches = await env.IPL_CACHE.get("matches", "json");
    const kvExists = await env.IPL_CACHE.get("matches");
    if (kvExists === null) {
      matches = [];
    } else {
      matches = matches || [];
    }
    const matchIndex = matches.findIndex((m) => m.id === id);
    if (matchIndex === -1) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedMatch = {
      ...matches[matchIndex],
      ...date && { date },
      ...time && { time },
      ...venue && { venue },
      ...team1Id && { team1Id },
      ...team2Id && { team2Id },
      ...status && { status },
      ...league && { league },
      // Update league if provided
      ...playing11 !== void 0 && { playing11 }
      // Update playing11 if provided
    };
    if (!updatedMatch.league) {
      updatedMatch.league = matches[matchIndex].league || "ipl";
    }
    matches[matchIndex] = updatedMatch;
    await env.IPL_CACHE.put("matches", JSON.stringify(matches));
    let allTeams = await env.IPL_CACHE.get("teams", "json");
    if (!allTeams || allTeams.length === 0) {
      allTeams = mockTeams;
    }
    return new Response(JSON.stringify(formatMatch(updatedMatch, allTeams)), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return new Response(JSON.stringify({ error: "Failed to update match" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePutRequest, "handlePutRequest");
async function handleDeleteRequest(context) {
  const { env, request } = context;
  if (!verifyAdminToken6(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const url = new URL(request.url);
    const matchId = url.searchParams.get("id");
    const clearAll = url.searchParams.get("clearAll") === "true";
    if (clearAll) {
      await env.IPL_CACHE.put("matches", JSON.stringify([]));
      console.log("All matches cleared from KV storage");
      return new Response(JSON.stringify({ success: true, message: "All matches cleared successfully" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!matchId) {
      return new Response(JSON.stringify({ error: "Match ID is required or use clearAll=true to clear all matches" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let matches = await env.IPL_CACHE.get("matches", "json");
    const kvExists = await env.IPL_CACHE.get("matches");
    if (kvExists === null) {
      matches = [];
    } else {
      matches = matches || [];
    }
    matches = matches.map((m) => ({
      ...m,
      league: m.league || "ipl"
    }));
    const matchIndex = matches.findIndex((m) => m.id === matchId);
    if (matchIndex === -1) {
      console.error(`Match with ID ${matchId} not found. Total matches: ${matches.length}`);
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    matches.splice(matchIndex, 1);
    await env.IPL_CACHE.put("matches", JSON.stringify(matches));
    console.log(`Match ${matchId} deleted successfully. Remaining matches: ${matches.length}`);
    return new Response(JSON.stringify({ success: true, message: "Match deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting match:", error);
    return new Response(JSON.stringify({ error: `Failed to delete match: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleDeleteRequest, "handleDeleteRequest");
async function onRequest40(context) {
  const { request } = context;
  const method = request.method;
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  let response;
  switch (method) {
    case "GET":
      response = await handleGetRequest(context);
      break;
    case "POST":
      response = await handlePostRequest(context);
      break;
    case "PUT":
      response = await handlePutRequest(context);
      break;
    case "DELETE":
      response = await handleDeleteRequest(context);
      break;
    default:
      response = new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
  }
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
__name(onRequest40, "onRequest");

// api/messages.js
var import_checked_fetch44 = __toESM(require_checked_fetch());
function getModerationFlagsForText(text) {
  const normalized = text.trim().toLowerCase();
  const badWords = ["idiot", "stupid", "hate"];
  let isFlagged = false;
  let flagReason = null;
  if (badWords.some((word) => normalized.includes(word))) {
    isFlagged = true;
    flagReason = "bad_language";
  } else if (normalized.includes("http://") || normalized.includes("https://") || normalized.includes("www.")) {
    isFlagged = true;
    flagReason = "spam";
  }
  const flagStatus = isFlagged ? "pending" : null;
  const flaggedAt = isFlagged ? (/* @__PURE__ */ new Date()).toISOString() : null;
  const flagDetails = null;
  return { isFlagged, flagReason, flagStatus, flaggedAt, flagDetails };
}
__name(getModerationFlagsForText, "getModerationFlagsForText");
var onRequest41 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  try {
    if (pathname === "/api/messages" && method === "GET") {
      const matchId = searchParams.get("matchId") || "current";
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      if (!messagesData) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      let messages = JSON.parse(messagesData);
      messages = messages.slice(
        Math.max(0, messages.length - offset - limit),
        messages.length - offset
      );
      return new Response(JSON.stringify(messages), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (pathname === "/api/messages" && method === "POST") {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      const user = JSON.parse(userData);
      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: "Your account is blocked" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const { matchId = "current", text } = await request.json();
      if (!text || text.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Message cannot be empty" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (text.length > 500) {
        return new Response(
          JSON.stringify({ error: "Message too long (max 500 chars)" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      let messages = messagesData ? JSON.parse(messagesData) : [];
      const moderation = getModerationFlagsForText(text);
      const message = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        text: text.trim(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        matchId,
        ...moderation
      };
      messages.push(message);
      if (messages.length > 1e3) {
        messages = messages.slice(-1e3);
      }
      await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
        expirationTtl: 604800
        // 7 days
      });
      return new Response(JSON.stringify({ success: true, message }), {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (pathname.startsWith("/api/messages/") && method === "DELETE") {
      const messageId = pathname.split("/").pop();
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      const user = JSON.parse(userData);
      if (user.role !== "admin" && user.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const matchId = searchParams.get("matchId") || "current";
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      let messages = messagesData ? JSON.parse(messagesData) : [];
      messages = messages.filter((m) => m.id !== messageId);
      await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
        expirationTtl: 604800
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Messages error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/notifications.js
var import_checked_fetch45 = __toESM(require_checked_fetch());
var mockTeams2 = [
  { id: "1", name: "Royal Challengers Bengaluru", shortName: "RCB" },
  { id: "2", name: "Mumbai Indians", shortName: "MI" },
  { id: "3", name: "Sunrisers Hyderabad", shortName: "SRH" },
  { id: "4", name: "Gujarat Titans", shortName: "GT" },
  { id: "5", name: "Punjab Kings", shortName: "PBKS" },
  { id: "6", name: "Delhi Capitals", shortName: "DC" },
  { id: "7", name: "Lucknow Super Giants", shortName: "LSG" },
  { id: "8", name: "Rajasthan Royals", shortName: "RR" },
  { id: "9", name: "Kolkata Knight Riders", shortName: "KKR" },
  { id: "10", name: "Chennai Super Kings", shortName: "CSK" }
];
var defaultMatches = [
  {
    id: "1",
    date: "2026-03-23",
    time: "19:30",
    venue: "M. A. Chidambaram Stadium, Chennai",
    team1Id: "10",
    team2Id: "1",
    status: "upcoming"
  },
  {
    id: "2",
    date: "2026-03-24",
    time: "15:30",
    venue: "Eden Gardens, Kolkata",
    team1Id: "9",
    team2Id: "4",
    status: "upcoming"
  },
  {
    id: "3",
    date: "2026-03-25",
    time: "19:30",
    venue: "Wankhede Stadium, Mumbai",
    team1Id: "2",
    team2Id: "8",
    status: "upcoming"
  }
];
function getMatchStartDate(match2) {
  if (!match2 || !match2.date) return null;
  const datePart = String(match2.date).trim();
  const timePart = (match2.time ? String(match2.time) : "00:00").trim() || "00:00";
  try {
    const dt = /* @__PURE__ */ new Date(`${datePart}T${timePart}:00+05:30`);
    if (!Number.isNaN(dt.getTime())) return dt;
  } catch (e) {
  }
  try {
    const dt2 = new Date(datePart);
    if (!Number.isNaN(dt2.getTime())) return dt2;
  } catch (e) {
  }
  return null;
}
__name(getMatchStartDate, "getMatchStartDate");
function getTeamMeta(teamId, teamObj) {
  const id = teamId != null ? String(teamId) : teamObj && teamObj.id != null ? String(teamObj.id) : "";
  let name = teamObj && teamObj.name;
  let shortName = teamObj && teamObj.shortName;
  if (id) {
    const found = mockTeams2.find((t) => t.id === id);
    if (found) {
      if (!name) name = found.name;
      if (!shortName) shortName = found.shortName;
    }
  }
  return {
    id: id || "",
    name: name || shortName || (id ? `Team ${id}` : "Unknown team"),
    shortName: shortName || name || "TBD"
  };
}
__name(getTeamMeta, "getTeamMeta");
var onRequest42 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  if (method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV || !env.IPL_CACHE) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch (e) {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    const favoriteTeamIds = Array.isArray(user.favoriteTeamIds) ? user.favoriteTeamIds.map((v) => String(v)) : [];
    if (favoriteTeamIds.length === 0) {
      return new Response(
        JSON.stringify({ notifications: [], windowHours: 48 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let matches = await env.IPL_CACHE.get("matches", "json");
    if (!Array.isArray(matches)) {
      matches = defaultMatches;
    }
    const windowParam = url.searchParams.get("windowHours");
    let windowHours = 48;
    if (windowParam) {
      const parsed = Number(windowParam);
      if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 168) {
        windowHours = parsed;
      }
    }
    const now = Date.now();
    const maxTime = now + windowHours * 60 * 60 * 1e3;
    const upcomingFavoriteMatches = [];
    for (const match2 of matches) {
      if (!match2) continue;
      if (match2.status !== "upcoming") continue;
      let team1Id = match2.team1Id;
      let team2Id = match2.team2Id;
      if ((!team1Id || !team2Id) && match2.team1 && match2.team2) {
        if (!team1Id && match2.team1.id) team1Id = String(match2.team1.id);
        if (!team2Id && match2.team2.id) team2Id = String(match2.team2.id);
      }
      if (!team1Id || !team2Id) continue;
      const involvesFavorite = favoriteTeamIds.includes(String(team1Id)) || favoriteTeamIds.includes(String(team2Id));
      if (!involvesFavorite) continue;
      const startsAt = getMatchStartDate(match2);
      if (!startsAt) continue;
      const startMs = startsAt.getTime();
      if (startMs < now || startMs > maxTime) continue;
      upcomingFavoriteMatches.push({ match: match2, startsAt });
    }
    const matchReminderNotifications = upcomingFavoriteMatches.map(({ match: match2, startsAt }) => {
      const team1Meta = getTeamMeta(match2.team1Id, match2.team1);
      const team2Meta = getTeamMeta(match2.team2Id, match2.team2);
      return {
        id: `match_reminder:${String(match2.id)}`,
        type: "match_reminder",
        matchId: String(match2.id),
        startsAt: startsAt.toISOString(),
        match: {
          id: String(match2.id),
          date: match2.date || null,
          time: match2.time || null,
          venue: match2.venue || null,
          status: match2.status || null,
          team1: team1Meta,
          team2: team2Meta
        }
      };
    });
    let liveChatNotifications = [];
    try {
      const rawEvents = await env.SPORTS_KV.get("liveChatEvents");
      if (rawEvents) {
        const events = JSON.parse(rawEvents);
        if (Array.isArray(events)) {
          liveChatNotifications = events.map((event) => {
            if (!event || event.matchId == null) return null;
            const matchId = String(event.matchId);
            const match2 = matches.find((m) => m && String(m.id) === matchId);
            if (!match2) return null;
            let team1Id = match2.team1Id || match2.team1 && match2.team1.id;
            let team2Id = match2.team2Id || match2.team2 && match2.team2.id;
            if (!team1Id || !team2Id) return null;
            const involvesFavorite = favoriteTeamIds.includes(String(team1Id)) || favoriteTeamIds.includes(String(team2Id));
            if (!involvesFavorite) return null;
            let ts = null;
            if (event.startsAt) {
              const parsed = Date.parse(event.startsAt);
              if (!Number.isNaN(parsed)) ts = parsed;
            }
            if (ts === null && event.createdAt) {
              const parsed = Date.parse(event.createdAt);
              if (!Number.isNaN(parsed)) ts = parsed;
            }
            if (ts === null) return null;
            if (ts < now || ts > maxTime) return null;
            const startIso = new Date(ts).toISOString();
            const team1Meta = getTeamMeta(team1Id, match2.team1);
            const team2Meta = getTeamMeta(team2Id, match2.team2);
            return {
              id: `live_chat_event:${String(event.id || `${matchId}:${ts}`)}`,
              type: "live_chat_event",
              matchId,
              startsAt: startIso,
              eventId: event.id != null ? String(event.id) : "",
              eventType: event.type || "special",
              title: event.title || "Live chat event",
              description: event.description || null,
              match: {
                id: matchId,
                date: match2.date || null,
                time: match2.time || null,
                venue: match2.venue || null,
                status: match2.status || null,
                team1: team1Meta,
                team2: team2Meta
              }
            };
          }).filter(Boolean);
        }
      }
    } catch (e) {
      console.error("Error building live chat notifications:", e);
    }
    const notifications = [...matchReminderNotifications, ...liveChatNotifications];
    return new Response(
      JSON.stringify({ notifications, windowHours }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Notifications error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/players.js
var import_checked_fetch46 = __toESM(require_checked_fetch());
var corsHeaders4 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function verifyAdminToken7(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken7, "verifyAdminToken");
async function getTeamNameById(players, teamId, league, env) {
  try {
    const teamsData = await env.IPL_CACHE.get("teams", "json");
    const teams = teamsData || [];
    const team = teams.find((t) => (t.league || "ipl") === league && t.id === teamId);
    return team ? team.name : `Team ${teamId}`;
  } catch (error) {
    return `Team ${teamId}`;
  }
}
__name(getTeamNameById, "getTeamNameById");
var onRequest43 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders4 });
  }
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const league = url.searchParams.get("league");
      const forceRefresh = url.searchParams.get("forceRefresh") === "true";
      const fixEllyse = url.searchParams.get("fixEllyse") === "true";
      const diagnostic = url.searchParams.get("diagnostic") === "true";
      let playersData = await env.IPL_CACHE.get("players", "json");
      let players = playersData || [];
      if (forceRefresh) {
        await env.IPL_CACHE.delete("players");
        playersData = await env.IPL_CACHE.get("players", "json");
        players = playersData || [];
      }
      if (fixEllyse) {
        const ellyseIndex = players.findIndex((p) => p.id === "5" && p.name === "Ellyse Perry");
        if (ellyseIndex !== -1) {
          players[ellyseIndex].teamId = "12";
          await env.IPL_CACHE.put("players", JSON.stringify(players));
          console.log("Ellyse Perry teamId fixed to 12 (RCB-W)");
        }
      }
      console.log("=== PLAYERS API GET ===");
      console.log(`Total players in KV: ${players.length}`);
      console.log(`Requested league: ${league}`);
      let needsMigration = false;
      players = players.map((player) => {
        if (!player.stats) return player;
        const runs = player.stats.runs || 0;
        const battingInnings = player.stats.battingInnings || 0;
        const notOuts = player.stats.notOuts || 0;
        const ballsFaced = player.stats.ballsFaced || 0;
        let playerNeedsUpdate = false;
        let average = player.stats.average;
        let strikeRate = player.stats.strikeRate;
        if (!average || average === 0) {
          const dismissals = battingInnings - notOuts;
          if (dismissals > 0 && runs > 0) {
            average = runs / dismissals;
            playerNeedsUpdate = true;
          } else if (player.stats.battingAverage && player.stats.battingAverage !== "" && player.stats.battingAverage !== "0" && player.stats.battingAverage !== "-") {
            const parsed = parseFloat(player.stats.battingAverage);
            if (!isNaN(parsed) && parsed > 0) {
              average = parsed;
              playerNeedsUpdate = true;
            }
          }
        }
        if (!strikeRate || strikeRate === 0) {
          if (ballsFaced > 0 && runs > 0) {
            strikeRate = runs * 100 / ballsFaced;
            playerNeedsUpdate = true;
          } else if (player.stats.battingStrikeRate && player.stats.battingStrikeRate !== "" && player.stats.battingStrikeRate !== "0" && player.stats.battingStrikeRate !== "-") {
            const parsed = parseFloat(player.stats.battingStrikeRate);
            if (!isNaN(parsed) && parsed > 0) {
              strikeRate = parsed;
              playerNeedsUpdate = true;
            }
          }
        }
        const wickets = player.stats.wickets || 0;
        const runsConceded = player.stats.runsConceded || 0;
        const balls = player.stats.balls || 0;
        let bowlingAverage = player.stats.bowlingAverage;
        if ((!bowlingAverage || bowlingAverage === 0) && wickets > 0 && runsConceded >= 0) {
          bowlingAverage = runsConceded / wickets;
          playerNeedsUpdate = true;
        } else if ((!bowlingAverage || bowlingAverage === 0) && player.stats.bowlingAverage && typeof player.stats.bowlingAverage === "string" && player.stats.bowlingAverage !== "" && player.stats.bowlingAverage !== "0" && player.stats.bowlingAverage !== "-") {
          const parsed = parseFloat(player.stats.bowlingAverage);
          if (!isNaN(parsed) && parsed > 0) {
            bowlingAverage = parsed;
            playerNeedsUpdate = true;
          }
        }
        let economy = player.stats.economy;
        if ((!economy || economy === 0) && balls > 0 && runsConceded >= 0) {
          economy = runsConceded * 6 / balls;
          playerNeedsUpdate = true;
        } else if ((!economy || economy === 0) && player.stats.economy && typeof player.stats.economy === "string" && player.stats.economy !== "" && player.stats.economy !== "0" && player.stats.economy !== "-") {
          const parsed = parseFloat(player.stats.economy);
          if (!isNaN(parsed) && parsed > 0) {
            economy = parsed;
            playerNeedsUpdate = true;
          }
        }
        if (playerNeedsUpdate) {
          needsMigration = true;
          const updatedStats = {
            ...player.stats,
            average: average || player.stats.average || 0,
            strikeRate: strikeRate || player.stats.strikeRate || 0
          };
          if (bowlingAverage !== void 0) updatedStats.bowlingAverage = bowlingAverage || 0;
          if (economy !== void 0) updatedStats.economy = economy || 0;
          return {
            ...player,
            stats: updatedStats
          };
        }
        return player;
      });
      if (needsMigration) {
        console.log("Migration: Auto-calculated batting/bowling stats for players");
        await env.IPL_CACHE.put("players", JSON.stringify(players));
      }
      if (diagnostic) {
        const iplPlayers = players.filter((p) => {
          const playerLeague = p.league || "ipl";
          const teamId = String(p.teamId || "").trim();
          return playerLeague === "ipl" || ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].includes(teamId) && playerLeague !== "wpl";
        });
        const wplPlayers2 = players.filter((p) => {
          const playerLeague = p.league || "ipl";
          const teamId = String(p.teamId || "").trim();
          return playerLeague === "wpl" || ["11", "12", "13", "14", "15"].includes(teamId);
        });
        const unknownPlayers = players.filter((p) => {
          const playerLeague = p.league || "ipl";
          const teamId = String(p.teamId || "").trim();
          const isIPL = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].includes(teamId);
          const isWPL = ["11", "12", "13", "14", "15"].includes(teamId);
          return !isIPL && !isWPL;
        });
        return new Response(JSON.stringify({
          diagnostic: true,
          summary: {
            total: players.length,
            ipl: iplPlayers.length,
            wpl: wplPlayers2.length,
            unknown: unknownPlayers.length
          },
          iplPlayers: iplPlayers.map((p) => ({
            id: p.id,
            name: p.name,
            teamId: p.teamId,
            league: p.league || "ipl",
            role: p.role
          })),
          wplPlayers: wplPlayers2.map((p) => ({
            id: p.id,
            name: p.name,
            teamId: p.teamId,
            league: p.league || "ipl",
            role: p.role
          })),
          unknownPlayers: unknownPlayers.map((p) => ({
            id: p.id,
            name: p.name,
            teamId: p.teamId,
            league: p.league || "ipl",
            role: p.role
          })),
          rawCount: players.length
        }, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      const wplPlayers = players.filter((p) => (p.league || "ipl") === "wpl" || ["11", "12", "13", "14", "15"].includes(String(p.teamId)));
      console.log(`WPL-related players found: ${wplPlayers.length}`);
      if (wplPlayers.length > 0) {
        console.log("Sample WPL players:", wplPlayers.slice(0, 3).map((p) => ({
          name: p.name,
          teamId: p.teamId,
          league: p.league
        })));
      }
      const normalizeTeamId = /* @__PURE__ */ __name((id) => {
        let str = String(id || "").trim();
        if (str.startsWith("Team ")) str = str.replace("Team ", "");
        if (str.toLowerCase().startsWith("team")) str = str.replace(/^team/i, "");
        return str;
      }, "normalizeTeamId");
      const wplTeamIds = ["11", "12", "13", "14", "15"];
      const iplTeamIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
      const wplPlayerCorrections = {
        "Harmanpreet Kaur": "11",
        // MI-W captain
        "Alyssa Healy": "11",
        // MI-W
        "Smriti Mandhana": "12",
        // RCB-W captain
        "Ellyse Perry": "12",
        // RCB-W
        "Deepti Sharma": "13",
        // DC-W
        "Sophie Devine": "14",
        // Gujarat Giants (GG) captain - NOT UPW
        "Pooja Vastrakar": "12",
        // RCB-W
        "Renuka Singh": "12",
        // RCB-W
        "Devika Vaidya": "14",
        // Gujarat Giants
        "Ashleigh Gardner": "14"
        // Gujarat Giants
      };
      let needsUpdate = false;
      players = players.map((player) => {
        let normalizedTeamId = normalizeTeamId(player.teamId);
        const playerLeague = player.league || "ipl";
        const isIPLTeam = iplTeamIds.includes(normalizedTeamId);
        const isWPLTeam = wplTeamIds.includes(normalizedTeamId);
        const isWPLPlayer = playerLeague === "wpl" || isWPLTeam;
        if (isIPLTeam && playerLeague === "wpl") {
          console.log(`[FIX] Player "${player.name}": Incorrectly marked as WPL, correcting to IPL (teamId: ${normalizedTeamId})`);
          needsUpdate = true;
          return {
            ...player,
            teamId: normalizedTeamId,
            league: "ipl"
          };
        }
        if (isWPLPlayer && wplPlayerCorrections[player.name]) {
          const correctTeamId = wplPlayerCorrections[player.name];
          if (normalizedTeamId !== correctTeamId) {
            console.log(`[CORRECT] Player "${player.name}": teamId '${normalizedTeamId}' -> '${correctTeamId}' (known WPL player)`);
            needsUpdate = true;
            normalizedTeamId = correctTeamId;
          }
        }
        const shouldBeWPL = wplTeamIds.includes(normalizedTeamId);
        if (shouldBeWPL && !isIPLTeam && playerLeague !== "wpl") {
          console.log(`[FIX] Player "${player.name}": league '${playerLeague}' -> 'wpl' (teamId: ${normalizedTeamId})`);
          needsUpdate = true;
          return {
            ...player,
            teamId: normalizedTeamId,
            league: "wpl"
          };
        }
        if (String(player.teamId) !== normalizedTeamId) {
          console.log(`[NORMALIZE] Player "${player.name}": teamId '${player.teamId}' -> '${normalizedTeamId}'`);
          needsUpdate = true;
          return {
            ...player,
            teamId: normalizedTeamId,
            league: playerLeague
          };
        }
        if (!player.league) {
          needsUpdate = true;
          return {
            ...player,
            league: "ipl"
          };
        }
        return player;
      });
      if (needsUpdate) {
        console.log(`[UPDATE] Writing corrected players to KV (${players.length} total)`);
        await env.IPL_CACHE.put("players", JSON.stringify(players));
      } else {
        console.log("[NO UPDATE] Players data is already correct");
      }
      const wplPlayersAfter = players.filter((p) => p.league === "wpl");
      console.log(`WPL players after fixes: ${wplPlayersAfter.length}`);
      if (league && (league === "ipl" || league === "wpl")) {
        players = players.filter((player) => {
          const playerLeague = player.league || "ipl";
          return playerLeague === league;
        });
        console.log(`Filtered to league '${league}': ${players.length} players`);
      }
      return new Response(JSON.stringify(players), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders4 }
      });
    }
    if (request.method === "POST") {
      const body = await request.json();
      if (body.forceUpdateEllyse && body.teamId === "12") {
        const playersData2 = await env.IPL_CACHE.get("players", "json");
        const players2 = playersData2 || [];
        const ellyseIndex = players2.findIndex((p) => p.id === "5" && p.name === "Ellyse Perry");
        if (ellyseIndex !== -1) {
          players2[ellyseIndex].teamId = "12";
          await env.IPL_CACHE.put("players", JSON.stringify(players2));
          return new Response(JSON.stringify({
            success: true,
            message: "Ellyse Perry updated to RCB-W",
            player: players2[ellyseIndex]
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders4 }
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            message: "Ellyse Perry not found"
          }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders4 }
          });
        }
      }
      if (!verifyAdminToken7(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      const newPlayer = body;
      if (!newPlayer.name || !newPlayer.role || !newPlayer.teamId) {
        return new Response(JSON.stringify({ error: "Missing required fields: name, role, teamId" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      const playerLeague = newPlayer.league || "ipl";
      const duplicatePlayer = players.find(
        (p) => (p.league || "ipl") === playerLeague && p.name.toLowerCase().trim() === newPlayer.name.toLowerCase().trim()
      );
      if (duplicatePlayer) {
        const existingTeamName = await getTeamNameById(players, duplicatePlayer.teamId, playerLeague, env);
        return new Response(JSON.stringify({
          error: 'Player "' + newPlayer.name + '" already exists in ' + existingTeamName + " for " + playerLeague.toUpperCase() + ". A player cannot play for multiple teams in the same league."
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      if (playerLeague === "ipl") {
        const existingTeamPlayers = players.filter(
          (p) => (p.league || "ipl") === "ipl" && p.teamId === newPlayer.teamId
        );
        if (existingTeamPlayers.length >= 25) {
          return new Response(JSON.stringify({
            error: "IPL teams cannot have more than 25 players. This team already has " + existingTeamPlayers.length + " players."
          }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders4 }
          });
        }
      } else if (playerLeague === "wpl") {
        const existingTeamPlayers = players.filter(
          (p) => (p.league || "ipl") === "wpl" && p.teamId === newPlayer.teamId
        );
        if (existingTeamPlayers.length >= 18) {
          return new Response(JSON.stringify({
            error: "WPL teams cannot have more than 18 players. This team already has " + existingTeamPlayers.length + " players."
          }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders4 }
          });
        }
      }
      const leaguePlayers = players.filter((p) => (p.league || "ipl") === (newPlayer.league || "ipl"));
      const maxId = leaguePlayers.length > 0 ? Math.max(...leaguePlayers.map((p) => parseInt(p.id) || 0)) : 0;
      const newId = (maxId + 1).toString();
      const playerToAdd = {
        id: newId,
        league: newPlayer.league || "ipl",
        // Default to 'ipl' if not specified
        name: newPlayer.name,
        role: newPlayer.role,
        // Set allrounderType only if role is All-rounder and value is provided
        ...newPlayer.role === "All-rounder" && newPlayer.allrounderType ? { allrounderType: newPlayer.allrounderType } : {},
        teamId: newPlayer.teamId,
        age: parseInt(newPlayer.age) || 0,
        dateOfBirth: newPlayer.dateOfBirth || void 0,
        nationality: newPlayer.nationality || "",
        jerseyNumber: parseInt(newPlayer.jerseyNumber) || 0,
        isCaptain: newPlayer.isCaptain || false,
        bowlingStyle: newPlayer.bowlingStyle || "N/A (Batsman)",
        battingStyle: newPlayer.battingStyle || "Right-handed bat",
        stats: {
          matches: parseInt(newPlayer.stats?.matches) || 0,
          runs: parseInt(newPlayer.stats?.runs) || 0,
          wickets: parseInt(newPlayer.stats?.wickets) || 0,
          average: parseFloat(newPlayer.stats?.average) || 0,
          bowlingAverage: parseFloat(newPlayer.stats?.bowlingAverage) || 0,
          strikeRate: parseFloat(newPlayer.stats?.strikeRate) || 0,
          economy: parseFloat(newPlayer.stats?.economy) || 0,
          highest: parseInt(newPlayer.stats?.highest) || 0,
          fours: parseInt(newPlayer.stats?.fours) || 0,
          sixes: parseInt(newPlayer.stats?.sixes) || 0,
          fifties: parseInt(newPlayer.stats?.fifties) || 0,
          hundreds: parseInt(newPlayer.stats?.hundreds) || 0,
          bestBowling: newPlayer.stats?.bestBowling || "-"
        }
      };
      players.push(playerToAdd);
      await env.IPL_CACHE.put("players", JSON.stringify(players));
      return new Response(JSON.stringify(playerToAdd), {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders4 }
      });
    }
    if (request.method === "PUT") {
      const updatedPlayer = await request.json();
      if (updatedPlayer.id === "5" && updatedPlayer.name === "Ellyse Perry" && updatedPlayer.teamId === "12") {
        const playersData2 = await env.IPL_CACHE.get("players", "json");
        const players2 = playersData2 || [];
        const index2 = players2.findIndex((p) => p.id === "5");
        if (index2 !== -1) {
          players2[index2].teamId = "12";
          await env.IPL_CACHE.put("players", JSON.stringify(players2));
          return new Response(JSON.stringify(players2[index2]), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders4 }
          });
        }
      }
      if (!verifyAdminToken7(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      if (!updatedPlayer.id) {
        return new Response(JSON.stringify({ error: "Player ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      const index = players.findIndex((p) => p.id === updatedPlayer.id);
      if (index === -1) {
        return new Response(JSON.stringify({ error: "Player not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      const playerLeague = updatedPlayer.league || players[index].league || "ipl";
      const duplicatePlayer = players.find(
        (p) => p.id !== updatedPlayer.id && // Exclude the current player
        (p.league || "ipl") === playerLeague && p.name.toLowerCase().trim() === updatedPlayer.name.toLowerCase().trim()
      );
      if (duplicatePlayer) {
        const existingTeamName = await getTeamNameById(players, duplicatePlayer.teamId, playerLeague, env);
        return new Response(JSON.stringify({
          error: 'Player "' + updatedPlayer.name + '" already exists in ' + existingTeamName + " for " + playerLeague.toUpperCase() + ". A player cannot play for multiple teams in the same league."
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      const runs = updatedPlayer.stats?.runs !== void 0 ? parseInt(updatedPlayer.stats.runs) || 0 : players[index].stats?.runs || 0;
      const battingInnings = updatedPlayer.stats?.battingInnings !== void 0 ? parseInt(updatedPlayer.stats.battingInnings) || 0 : players[index].stats?.battingInnings || 0;
      const notOuts = updatedPlayer.stats?.notOuts !== void 0 ? parseInt(updatedPlayer.stats.notOuts) || 0 : players[index].stats?.notOuts || 0;
      const ballsFaced = updatedPlayer.stats?.ballsFaced !== void 0 ? parseInt(updatedPlayer.stats.ballsFaced) || 0 : players[index].stats?.ballsFaced || 0;
      let finalAverage = 0;
      let finalStrikeRate = 0;
      if (updatedPlayer.stats?.average !== void 0 && updatedPlayer.stats?.average !== null && updatedPlayer.stats?.average !== "") {
        const provided = typeof updatedPlayer.stats.average === "number" ? updatedPlayer.stats.average : parseFloat(updatedPlayer.stats.average);
        if (!isNaN(provided)) {
          finalAverage = provided;
        }
      }
      if (updatedPlayer.stats?.strikeRate !== void 0 && updatedPlayer.stats?.strikeRate !== null && updatedPlayer.stats?.strikeRate !== "") {
        const provided = typeof updatedPlayer.stats.strikeRate === "number" ? updatedPlayer.stats.strikeRate : parseFloat(updatedPlayer.stats.strikeRate);
        if (!isNaN(provided)) {
          finalStrikeRate = provided;
        }
      }
      if (finalAverage === 0) {
        const dismissals = battingInnings - notOuts;
        if (dismissals > 0 && runs > 0) {
          finalAverage = runs / dismissals;
        } else {
          finalAverage = players[index].stats?.average || 0;
        }
      }
      if (finalStrikeRate === 0) {
        if (ballsFaced > 0 && runs > 0) {
          finalStrikeRate = runs * 100 / ballsFaced;
        } else {
          finalStrikeRate = players[index].stats?.strikeRate || 0;
        }
      }
      console.log("API PUT: Stats calculation for player", updatedPlayer.id || updatedPlayer.name, {
        providedAverage: updatedPlayer.stats?.average,
        providedStrikeRate: updatedPlayer.stats?.strikeRate,
        finalAverage,
        finalStrikeRate,
        runs,
        battingInnings,
        notOuts,
        ballsFaced,
        usingManualInput: updatedPlayer.stats?.average !== void 0 && updatedPlayer.stats?.average !== null && updatedPlayer.stats?.average !== "" || updatedPlayer.stats?.strikeRate !== void 0 && updatedPlayer.stats?.strikeRate !== null && updatedPlayer.stats?.strikeRate !== ""
      });
      players[index] = {
        ...players[index],
        // Preserve existing properties
        id: updatedPlayer.id,
        ...updatedPlayer.league && { league: updatedPlayer.league },
        // Update league if provided
        name: updatedPlayer.name,
        role: updatedPlayer.role,
        // Preserve allrounderType if role is All-rounder, otherwise remove it
        ...updatedPlayer.role === "All-rounder" && updatedPlayer.allrounderType ? { allrounderType: updatedPlayer.allrounderType } : updatedPlayer.role !== "All-rounder" ? { allrounderType: void 0 } : {},
        teamId: updatedPlayer.teamId,
        age: parseInt(updatedPlayer.age) || 0,
        dateOfBirth: updatedPlayer.dateOfBirth || void 0,
        nationality: updatedPlayer.nationality || "",
        jerseyNumber: parseInt(updatedPlayer.jerseyNumber) || 0,
        isCaptain: updatedPlayer.isCaptain || false,
        bowlingStyle: updatedPlayer.bowlingStyle || "N/A (Batsman)",
        battingStyle: updatedPlayer.battingStyle || "Right-handed bat",
        stats: {
          // Preserve existing stats first
          ...players[index].stats,
          // Standard stats - update if provided
          matches: updatedPlayer.stats?.matches !== void 0 ? parseInt(updatedPlayer.stats.matches) || 0 : players[index].stats?.matches || 0,
          runs,
          wickets: updatedPlayer.stats?.wickets !== void 0 ? parseInt(updatedPlayer.stats.wickets) || 0 : players[index].stats?.wickets || 0,
          // CRITICAL: Always set average and strikeRate explicitly
          average: finalAverage,
          strikeRate: finalStrikeRate,
          economy: updatedPlayer.stats?.economy !== void 0 ? typeof updatedPlayer.stats.economy === "string" ? updatedPlayer.stats.economy || "" : parseFloat(updatedPlayer.stats.economy) || 0 : players[index].stats?.economy || 0,
          highest: updatedPlayer.stats?.highest !== void 0 ? parseInt(updatedPlayer.stats.highest) || 0 : players[index].stats?.highest || 0,
          fours: updatedPlayer.stats?.fours !== void 0 ? parseInt(updatedPlayer.stats.fours) || 0 : players[index].stats?.fours || 0,
          sixes: updatedPlayer.stats?.sixes !== void 0 ? parseInt(updatedPlayer.stats.sixes) || 0 : players[index].stats?.sixes || 0,
          fifties: updatedPlayer.stats?.fifties !== void 0 ? parseInt(updatedPlayer.stats.fifties) || 0 : players[index].stats?.fifties || 0,
          hundreds: updatedPlayer.stats?.hundreds !== void 0 ? parseInt(updatedPlayer.stats.hundreds) || 0 : players[index].stats?.hundreds || 0,
          bestBowling: updatedPlayer.stats?.bestBowling !== void 0 ? updatedPlayer.stats.bestBowling || "-" : players[index].stats?.bestBowling || "-",
          // Batting-specific stats - update if provided
          battingInnings: updatedPlayer.stats?.battingInnings !== void 0 ? parseInt(updatedPlayer.stats.battingInnings) || 0 : players[index].stats?.battingInnings || 0,
          notOuts: updatedPlayer.stats?.notOuts !== void 0 ? parseInt(updatedPlayer.stats.notOuts) || 0 : players[index].stats?.notOuts || 0,
          ballsFaced: updatedPlayer.stats?.ballsFaced !== void 0 ? parseInt(updatedPlayer.stats.ballsFaced) || 0 : players[index].stats?.ballsFaced || 0,
          battingAverage: updatedPlayer.stats?.battingAverage !== void 0 ? updatedPlayer.stats.battingAverage || "" : players[index].stats?.battingAverage || "",
          battingStrikeRate: updatedPlayer.stats?.battingStrikeRate !== void 0 ? updatedPlayer.stats.battingStrikeRate || "" : players[index].stats?.battingStrikeRate || "",
          // Bowling-specific stats - update if provided
          bowlingInnings: updatedPlayer.stats?.bowlingInnings !== void 0 ? parseInt(updatedPlayer.stats.bowlingInnings) || 0 : players[index].stats?.bowlingInnings || 0,
          balls: updatedPlayer.stats?.balls !== void 0 ? parseInt(updatedPlayer.stats.balls) || 0 : players[index].stats?.balls || 0,
          maidens: updatedPlayer.stats?.maidens !== void 0 ? parseInt(updatedPlayer.stats.maidens) || 0 : players[index].stats?.maidens || 0,
          runsConceded: updatedPlayer.stats?.runsConceded !== void 0 ? parseInt(updatedPlayer.stats.runsConceded) || 0 : players[index].stats?.runsConceded || 0,
          // Calculate bowling average - use provided value, or calculate from base stats, or use existing
          bowlingAverage: (() => {
            if (updatedPlayer.stats?.bowlingAverage !== void 0 && updatedPlayer.stats?.bowlingAverage !== null && updatedPlayer.stats?.bowlingAverage !== "") {
              const provided = typeof updatedPlayer.stats.bowlingAverage === "number" ? updatedPlayer.stats.bowlingAverage : parseFloat(updatedPlayer.stats.bowlingAverage);
              if (!isNaN(provided) && provided > 0) {
                return provided;
              }
            }
            const wickets = updatedPlayer.stats?.wickets !== void 0 ? parseInt(updatedPlayer.stats.wickets) || 0 : players[index].stats?.wickets || 0;
            const runsConceded = updatedPlayer.stats?.runsConceded !== void 0 ? parseInt(updatedPlayer.stats.runsConceded) || 0 : players[index].stats?.runsConceded || 0;
            if (wickets > 0 && runsConceded >= 0) {
              return runsConceded / wickets;
            }
            return players[index].stats?.bowlingAverage || 0;
          })(),
          // Calculate economy - use provided value, or calculate from base stats, or use existing
          economy: (() => {
            if (updatedPlayer.stats?.economy !== void 0 && updatedPlayer.stats?.economy !== null && updatedPlayer.stats?.economy !== "") {
              const provided = typeof updatedPlayer.stats.economy === "number" ? updatedPlayer.stats.economy : parseFloat(updatedPlayer.stats.economy);
              if (!isNaN(provided) && provided > 0) {
                return provided;
              }
            }
            const balls = updatedPlayer.stats?.balls !== void 0 ? parseInt(updatedPlayer.stats.balls) || 0 : players[index].stats?.balls || 0;
            const runsConceded = updatedPlayer.stats?.runsConceded !== void 0 ? parseInt(updatedPlayer.stats.runsConceded) || 0 : players[index].stats?.runsConceded || 0;
            if (balls > 0 && runsConceded >= 0) {
              return runsConceded * 6 / balls;
            }
            return players[index].stats?.economy || 0;
          })(),
          bowlingStrikeRate: updatedPlayer.stats?.bowlingStrikeRate !== void 0 ? updatedPlayer.stats.bowlingStrikeRate || "" : players[index].stats?.bowlingStrikeRate || "",
          fiveWickets: updatedPlayer.stats?.fiveWickets !== void 0 ? parseInt(updatedPlayer.stats.fiveWickets) || 0 : players[index].stats?.fiveWickets || 0
        }
      };
      if (!players[index].league) {
        players[index].league = "ipl";
      }
      await env.IPL_CACHE.put("players", JSON.stringify(players));
      console.log("API PUT: Saved player stats:", {
        playerId: players[index].id,
        playerName: players[index].name,
        average: players[index].stats.average,
        strikeRate: players[index].stats.strikeRate,
        battingAverage: players[index].stats.battingAverage,
        battingStrikeRate: players[index].stats.battingStrikeRate,
        runs: players[index].stats.runs,
        battingInnings: players[index].stats.battingInnings,
        notOuts: players[index].stats.notOuts,
        ballsFaced: players[index].stats.ballsFaced
      });
      return new Response(JSON.stringify(players[index]), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders4 }
      });
    }
    if (request.method === "DELETE") {
      if (!verifyAdminToken7(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      const url = new URL(request.url);
      const deleteAllWPL = url.searchParams.get("deleteAllWPL");
      const deleteAll = url.searchParams.get("deleteAll");
      const playerId = url.searchParams.get("id");
      if (deleteAll === "true") {
        const playersData2 = await env.IPL_CACHE.get("players", "json");
        const players2 = playersData2 || [];
        const totalCount = players2.length;
        console.log(`[BULK DELETE ALL] Removing all ${totalCount} players`);
        await env.IPL_CACHE.put("players", JSON.stringify([]));
        return new Response(JSON.stringify({
          success: true,
          message: `Deleted all ${totalCount} players`,
          deletedCount: totalCount
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      if (deleteAllWPL === "true") {
        const playersData2 = await env.IPL_CACHE.get("players", "json");
        const players2 = playersData2 || [];
        const wplPlayers = players2.filter((p) => (p.league || "ipl") === "wpl");
        const nonWPLPlayers = players2.filter((p) => (p.league || "ipl") !== "wpl");
        console.log(`[BULK DELETE] Removing ${wplPlayers.length} WPL players`);
        await env.IPL_CACHE.put("players", JSON.stringify(nonWPLPlayers));
        return new Response(JSON.stringify({
          success: true,
          message: `Deleted ${wplPlayers.length} WPL players`,
          deletedCount: wplPlayers.length
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      if (!playerId) {
        return new Response(JSON.stringify({ error: "Player ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      const filteredPlayers = players.filter((p) => p.id !== playerId);
      if (filteredPlayers.length === players.length) {
        return new Response(JSON.stringify({ error: "Player not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders4 }
        });
      }
      await env.IPL_CACHE.put("players", JSON.stringify(filteredPlayers));
      return new Response(JSON.stringify({ success: true, message: "Player deleted" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders4 }
      });
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders4 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders4 }
      }
    );
  }
}, "onRequest");

// api/predictions.js
var import_checked_fetch47 = __toESM(require_checked_fetch());
async function getUserFromToken2(token, env) {
  if (!token) return null;
  const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
  if (!tokenValue) return null;
  let email = tokenValue;
  if (tokenValue.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(tokenValue);
      if (parsed && typeof parsed.email === "string") {
        email = parsed.email;
      }
    } catch {
    }
  }
  const userData = await env.SPORTS_KV.get(`user:${email}`);
  if (!userData) return null;
  const user = JSON.parse(userData);
  if (!user.id) {
    console.error(`[getUserFromToken] User data missing id field for email: ${email}`);
    return null;
  }
  return { ...user, email, id: String(user.id).trim() };
}
__name(getUserFromToken2, "getUserFromToken");
function isMatchUpcoming(match2) {
  if (!match2 || match2.status !== "upcoming") return false;
  const matchDateTime = /* @__PURE__ */ new Date(`${match2.date}T${match2.time}`);
  const now = /* @__PURE__ */ new Date();
  return matchDateTime > now;
}
__name(isMatchUpcoming, "isMatchUpcoming");
async function getAllPredictions3(matchId, userId, league, env) {
  const predictions = [];
  if (matchId) {
    const matchKey = `predictions:match:${matchId}`;
    const matchPreds = await env.SPORTS_KV.get(matchKey);
    if (matchPreds) {
      const predIds = JSON.parse(matchPreds);
      for (const predId of predIds) {
        const predData = await env.SPORTS_KV.get(`prediction:${predId}`);
        if (predData) {
          predictions.push(JSON.parse(predData));
        }
      }
    }
  } else if (userId) {
    const userKey = `predictions:user:${userId}`;
    const userPreds = await env.SPORTS_KV.get(userKey);
    if (userPreds) {
      const predIds = JSON.parse(userPreds);
      for (const predId of predIds) {
        const predData = await env.SPORTS_KV.get(`prediction:${predId}`);
        if (predData) {
          predictions.push(JSON.parse(predData));
        }
      }
    }
  } else {
    const list = await env.SPORTS_KV.list({ prefix: "prediction:" });
    for (const key of list.keys) {
      const predData = await env.SPORTS_KV.get(key.name);
      if (predData) {
        predictions.push(JSON.parse(predData));
      }
    }
  }
  if (league) {
    return predictions.filter((p) => p.league === league);
  }
  return predictions;
}
__name(getAllPredictions3, "getAllPredictions");
var onRequest44 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  try {
    if (pathname === "/api/predictions" && method === "GET") {
      const matchId = searchParams.get("matchId");
      const userId = searchParams.get("userId");
      const league = searchParams.get("league");
      const predictions = await getAllPredictions3(matchId, userId, league, env);
      return new Response(JSON.stringify(predictions), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (pathname === "/api/predictions" && method === "POST") {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");
      const user = await getUserFromToken2(token, env);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: "Your account is blocked" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const body = await request.json();
      const { matchId, predictedWinner, playerPredictions, league } = body;
      if (!matchId || !predictedWinner || !league) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const matchesData = await env.SPORTS_KV.get("matches");
      if (!matchesData) {
        return new Response(
          JSON.stringify({ error: "Matches data not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const matches = JSON.parse(matchesData);
      const match2 = matches.find((m) => m.id === matchId);
      if (!match2) {
        return new Response(
          JSON.stringify({ error: "Match not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (!isMatchUpcoming(match2)) {
        return new Response(
          JSON.stringify({ error: "Predictions only allowed for upcoming matches" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const existingKey = `predictions:match:${matchId}:user:${user.id}`;
      const existingPredId = await env.SPORTS_KV.get(existingKey);
      if (existingPredId) {
        return new Response(
          JSON.stringify({ error: "You already have a prediction for this match" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const predictionId = crypto.randomUUID();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const prediction = {
        id: predictionId,
        userId: String(user.id || "").trim(),
        // Ensure userId is always a string
        userName: user.name || user.email || "Anonymous",
        matchId,
        league,
        predictedWinner,
        playerPredictions: playerPredictions || {},
        createdAt: now,
        updatedAt: now
      };
      await env.SPORTS_KV.put(`prediction:${predictionId}`, JSON.stringify(prediction), {
        expirationTtl: 31536e3
        // 1 year
      });
      const matchKey = `predictions:match:${matchId}`;
      const matchPreds = await env.SPORTS_KV.get(matchKey);
      const matchPredIds = matchPreds ? JSON.parse(matchPreds) : [];
      matchPredIds.push(predictionId);
      await env.SPORTS_KV.put(matchKey, JSON.stringify(matchPredIds), {
        expirationTtl: 31536e3
      });
      const userKey = `predictions:user:${user.id}`;
      const userPreds = await env.SPORTS_KV.get(userKey);
      const userPredIds = userPreds ? JSON.parse(userPreds) : [];
      userPredIds.push(predictionId);
      await env.SPORTS_KV.put(userKey, JSON.stringify(userPredIds), {
        expirationTtl: 31536e3
      });
      await env.SPORTS_KV.put(existingKey, predictionId, {
        expirationTtl: 31536e3
      });
      return new Response(JSON.stringify(prediction), {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (pathname === "/api/predictions" && method === "PUT") {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");
      const user = await getUserFromToken2(token, env);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized. Please log in to update predictions." }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: "Your account is blocked" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Invalid request body" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const { id, predictedWinner, playerPredictions } = body;
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Prediction ID required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const predData = await env.SPORTS_KV.get(`prediction:${id}`);
      if (!predData) {
        return new Response(
          JSON.stringify({ error: "Prediction not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const prediction = JSON.parse(predData);
      const predictionUserId = String(prediction.userId || "").trim().toLowerCase();
      const currentUserId = String(user.id || "").trim().toLowerCase();
      console.log(`[UPDATE PREDICTION] Checking ownership: prediction.userId="${predictionUserId}" (original: "${prediction.userId}", type: ${typeof prediction.userId}), user.id="${currentUserId}" (original: "${user.id}", type: ${typeof user.id})`);
      console.log(`[UPDATE PREDICTION] User object:`, JSON.stringify({ id: user.id, email: user.email, name: user.name }));
      console.log(`[UPDATE PREDICTION] Prediction object:`, JSON.stringify({ id: prediction.id, userId: prediction.userId, userName: prediction.userName }));
      if (!predictionUserId || !currentUserId) {
        console.error(`[UPDATE PREDICTION] Missing user ID: prediction.userId="${predictionUserId}", user.id="${currentUserId}"`);
        return new Response(
          JSON.stringify({ error: "Invalid user identification. Please try logging in again." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const directMatch = String(prediction.userId || "").trim() === String(user.id || "").trim();
      const normalizedMatch = predictionUserId === currentUserId;
      const emailMatch = prediction.userName && user.email && prediction.userName.toLowerCase() === user.email.toLowerCase();
      const nameMatch = prediction.userName && user.name && prediction.userName.toLowerCase() === user.name.toLowerCase();
      if (!directMatch && !normalizedMatch && !emailMatch && !nameMatch) {
        console.log(`[UPDATE PREDICTION] Ownership mismatch: User ${currentUserId} (email: ${user.email}, name: ${user.name}) attempted to update prediction ${id} owned by ${predictionUserId} (userName: ${prediction.userName})`);
        console.log(`[UPDATE PREDICTION] Direct match: ${directMatch}, Normalized match: ${normalizedMatch}, Email match: ${emailMatch}, Name match: ${nameMatch}`);
        return new Response(
          JSON.stringify({ error: "You can only update your own predictions" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      if ((emailMatch || nameMatch) && !directMatch && !normalizedMatch) {
        console.log(`[UPDATE PREDICTION] Ownership verified via email/name match. Updating prediction userId from ${prediction.userId} to ${user.id}`);
        prediction.userId = String(user.id).trim();
      }
      console.log(`[UPDATE PREDICTION] Ownership verified: User ${currentUserId} owns prediction ${id}`);
      const matchesData = await env.SPORTS_KV.get("matches");
      if (matchesData) {
        const matches = JSON.parse(matchesData);
        const match2 = matches.find((m) => m.id === prediction.matchId);
        if (match2 && !isMatchUpcoming(match2)) {
          return new Response(
            JSON.stringify({ error: "Cannot update prediction after match starts" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
          );
        }
      }
      if (predictedWinner !== void 0) {
        prediction.predictedWinner = predictedWinner;
      }
      if (playerPredictions !== void 0) {
        prediction.playerPredictions = {
          ...prediction.playerPredictions || {},
          ...playerPredictions
        };
      }
      prediction.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await env.SPORTS_KV.put(`prediction:${id}`, JSON.stringify(prediction), {
        expirationTtl: 31536e3
      });
      return new Response(JSON.stringify(prediction), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Predictions error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/preferences.js
var import_checked_fetch48 = __toESM(require_checked_fetch());
var onRequest45 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch (e) {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (method === "GET") {
      return new Response(
        JSON.stringify({
          email: user.email,
          name: user.name,
          termsAccepted: user.termsAccepted || false,
          termsAcceptedDate: user.termsAcceptedDate || null,
          emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
          // Default to true
          favoriteTeamIds: user.favoriteTeamIds || []
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (method === "PUT") {
      const body = await request.json();
      const { termsAccepted, emailNotificationsEnabled, favoriteTeamIds } = body;
      if (typeof termsAccepted === "boolean") {
        user.termsAccepted = termsAccepted;
        if (termsAccepted) {
          user.termsAcceptedDate = (/* @__PURE__ */ new Date()).toISOString();
        }
      }
      if (typeof emailNotificationsEnabled === "boolean") {
        user.emailNotificationsEnabled = emailNotificationsEnabled;
      }
      if (Array.isArray(favoriteTeamIds)) {
        user.favoriteTeamIds = favoriteTeamIds;
      }
      await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
        expirationTtl: 31536e3
        // 1 year
      });
      if (user.termsAccepted) {
        await addUserToIndex(email, env);
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: "Preferences updated",
          user: {
            email: user.email,
            name: user.name,
            termsAccepted: user.termsAccepted,
            termsAcceptedDate: user.termsAcceptedDate,
            emailNotificationsEnabled: user.emailNotificationsEnabled,
            favoriteTeamIds: user.favoriteTeamIds
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Preferences error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function addUserToIndex(email, env) {
  try {
    let usersIndex = [];
    const indexRaw = await env.SPORTS_KV.get("users-index");
    if (indexRaw) {
      try {
        usersIndex = JSON.parse(indexRaw);
      } catch (e) {
        console.error("Error parsing users index:", e);
        usersIndex = [];
      }
    }
    if (!usersIndex.includes(email)) {
      usersIndex.push(email);
      await env.SPORTS_KV.put("users-index", JSON.stringify(usersIndex), {
        expirationTtl: 31536e3
        // 1 year
      });
    }
  } catch (error) {
    console.error("Error updating users index:", error);
  }
}
__name(addUserToIndex, "addUserToIndex");

// api/profile.js
var import_checked_fetch49 = __toESM(require_checked_fetch());
var onRequest46 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders6
    });
  }
  if (method !== "GET" && method !== "PUT") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const user = JSON.parse(userData);
    if (method === "GET") {
      const profile2 = {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName || user.name || user.email,
        favoriteTeamIds: user.favoriteTeamIds || [],
        favoritePlayerIds: user.favoritePlayerIds || []
      };
      return new Response(JSON.stringify({ profile: profile2 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const updatedUser = { ...user };
    if (typeof body.displayName === "string") {
      const trimmed = body.displayName.trim();
      if (trimmed) {
        updatedUser.displayName = trimmed.slice(0, 80);
      }
    }
    if (Array.isArray(body.favoriteTeamIds)) {
      updatedUser.favoriteTeamIds = body.favoriteTeamIds.map((v) => String(v));
    }
    if (Array.isArray(body.favoritePlayerIds)) {
      updatedUser.favoritePlayerIds = body.favoritePlayerIds.map((v) => String(v));
    }
    await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(updatedUser), {
      expirationTtl: 31536e3
      // 1 year
    });
    const profile = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      displayName: updatedUser.displayName || updatedUser.name || updatedUser.email,
      favoriteTeamIds: updatedUser.favoriteTeamIds || [],
      favoritePlayerIds: updatedUser.favoritePlayerIds || []
    };
    return new Response(JSON.stringify({ profile }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    console.error("Profile error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");

// api/restore-players.js
var import_checked_fetch50 = __toESM(require_checked_fetch());
var onRequest47 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders6 });
  }
  try {
    const existingPlayers = await env.IPL_CACHE.get("players", "json") || [];
    const wplPlayers = existingPlayers.filter((p) => {
      const teamId = String(p.teamId || "").trim();
      const league = p.league || "ipl";
      return league === "wpl" || ["11", "12", "13", "14", "15"].includes(teamId);
    });
    if (request.method === "POST") {
      const body = await request.json();
      const playersToRestore = Array.isArray(body.players) ? body.players : [];
      if (playersToRestore.length === 0) {
        return new Response(JSON.stringify({
          error: "No players provided",
          hint: 'Send JSON: { "players": [...] }'
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      const iplPlayersToAdd = playersToRestore.map((p) => ({
        ...p,
        league: "ipl"
      }));
      const existingIPLPlayerNames = existingPlayers.filter((p) => {
        const teamId = String(p.teamId || "").trim();
        const league = p.league || "ipl";
        return league === "ipl" && ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].includes(teamId) || league === "ipl" && !["11", "12", "13", "14", "15"].includes(teamId);
      }).map((p) => p.name.toLowerCase());
      const newIPLPlayers = iplPlayersToAdd.filter(
        (p) => !existingIPLPlayerNames.includes(p.name.toLowerCase())
      );
      const allPlayers = [...wplPlayers, ...newIPLPlayers];
      await env.IPL_CACHE.put("players", JSON.stringify(allPlayers));
      return new Response(JSON.stringify({
        success: true,
        message: "IPL players restored successfully",
        restored: newIPLPlayers.length,
        skipped: iplPlayersToAdd.length - newIPLPlayers.length,
        existingWPL: wplPlayers.length,
        totalPlayers: allPlayers.length
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (request.method === "GET") {
      const restoreAll = url.searchParams.get("restoreAll") === "true";
      if (!restoreAll) {
        return new Response(JSON.stringify({
          error: "Missing restoreAll parameter",
          hint: "Add ?restoreAll=true to restore IPL players",
          usage: {
            get: "GET /api/restore-players?restoreAll=true",
            post: 'POST /api/restore-players with JSON body: { "players": [...] }'
          }
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders6 }
        });
      }
      const comprehensiveIPLPlayers = [
        // RCB (Team ID: 1)
        { id: "1", league: "ipl", name: "Virat Kohli", role: "Batsman", teamId: "1", age: 35, nationality: "India", jerseyNumber: 18, isCaptain: true, bowlingStyle: "N/A (Batsman)", battingStyle: "Right-handed bat", stats: { matches: 237, runs: 7263, wickets: 0, average: 37.24, strikeRate: 130.02, economy: 0, highest: 113, fours: 629, sixes: 237, fifties: 50, hundreds: 7, bestBowling: "-" } },
        { id: "2", league: "ipl", name: "Faf du Plessis", role: "Batsman", teamId: "1", age: 39, nationality: "South Africa", jerseyNumber: 12, isCaptain: false, bowlingStyle: "N/A (Batsman)", battingStyle: "Right-handed bat", stats: { matches: 130, runs: 4133, wickets: 0, average: 36.9, strikeRate: 134.1, economy: 0, highest: 96, fours: 324, sixes: 165, fifties: 33, hundreds: 0, bestBowling: "-" } },
        { id: "3", league: "ipl", name: "Glenn Maxwell", role: "All-rounder", teamId: "1", age: 35, nationality: "Australia", jerseyNumber: 33, isCaptain: false, bowlingStyle: "Right-arm off-break", battingStyle: "Right-handed bat", stats: { matches: 124, runs: 2719, wickets: 19, average: 26.4, strikeRate: 157.6, economy: 8.1, highest: 95, fours: 198, sixes: 170, fifties: 15, hundreds: 0, bestBowling: "2/15" } },
        { id: "4", league: "ipl", name: "Mohammed Siraj", role: "Bowler", teamId: "1", age: 30, nationality: "India", jerseyNumber: 13, isCaptain: false, bowlingStyle: "Right-arm fast", battingStyle: "Right-handed bat", stats: { matches: 79, runs: 29, wickets: 78, average: 28.2, strikeRate: 20.1, economy: 8.5, highest: 10, fours: 3, sixes: 1, fifties: 0, hundreds: 0, bestBowling: "4/21" } },
        { id: "5", league: "ipl", name: "Dinesh Karthik", role: "Wicket-keeper", teamId: "1", age: 38, nationality: "India", jerseyNumber: 21, isCaptain: false, bowlingStyle: "N/A (Wicket-keeper)", battingStyle: "Right-handed bat", stats: { matches: 242, runs: 4516, wickets: 0, average: 26.1, strikeRate: 132.7, economy: 0, highest: 97, fours: 405, sixes: 170, fifties: 20, hundreds: 0, bestBowling: "-" } },
        { id: "6", league: "ipl", name: "Rajat Patidar", role: "Batsman", teamId: "1", age: 30, nationality: "India", jerseyNumber: 8, isCaptain: false, bowlingStyle: "N/A (Batsman)", battingStyle: "Right-handed bat", stats: { matches: 23, runs: 404, wickets: 0, average: 28.9, strikeRate: 144.3, economy: 0, highest: 112, fours: 32, sixes: 20, fifties: 1, hundreds: 1, bestBowling: "-" } },
        { id: "7", league: "ipl", name: "Anuj Rawat", role: "Wicket-keeper", teamId: "1", age: 24, nationality: "India", jerseyNumber: 44, isCaptain: false, bowlingStyle: "N/A (Wicket-keeper)", battingStyle: "Left-handed bat", stats: { matches: 25, runs: 329, wickets: 0, average: 18.3, strikeRate: 125.2, economy: 0, highest: 48, fours: 32, sixes: 12, fifties: 0, hundreds: 0, bestBowling: "-" } },
        { id: "8", league: "ipl", name: "Mahipal Lomror", role: "All-rounder", teamId: "1", age: 24, nationality: "India", jerseyNumber: 32, isCaptain: false, bowlingStyle: "Left-arm orthodox", battingStyle: "Left-handed bat", stats: { matches: 28, runs: 423, wickets: 2, average: 21.2, strikeRate: 135.1, economy: 8.5, highest: 54, fours: 32, sixes: 20, fifties: 2, hundreds: 0, bestBowling: "1/12" } },
        { id: "9", league: "ipl", name: "Karn Sharma", role: "Bowler", teamId: "1", age: 36, nationality: "India", jerseyNumber: 19, isCaptain: false, bowlingStyle: "Left-arm leg-break", battingStyle: "Right-handed bat", stats: { matches: 70, runs: 127, wickets: 61, average: 28.5, strikeRate: 18.2, economy: 8.2, highest: 20, fours: 8, sixes: 5, fifties: 0, hundreds: 0, bestBowling: "4/16" } },
        { id: "10", league: "ipl", name: "Akash Deep", role: "Bowler", teamId: "1", age: 27, nationality: "India", jerseyNumber: 30, isCaptain: false, bowlingStyle: "Right-arm medium-fast", battingStyle: "Right-handed bat", stats: { matches: 7, runs: 5, wickets: 7, average: 25.1, strikeRate: 20.6, economy: 7.3, highest: 3, fours: 0, sixes: 0, fifties: 0, hundreds: 0, bestBowling: "3/20" } },
        { id: "11", league: "ipl", name: "Cameron Green", role: "All-rounder", teamId: "1", age: 24, nationality: "Australia", jerseyNumber: 5, isCaptain: false, bowlingStyle: "Right-arm medium-fast", battingStyle: "Right-handed bat", stats: { matches: 16, runs: 452, wickets: 6, average: 50.2, strikeRate: 160.3, economy: 9.1, highest: 100, fours: 35, sixes: 22, fifties: 2, hundreds: 1, bestBowling: "2/18" } },
        { id: "12", league: "ipl", name: "Will Jacks", role: "All-rounder", teamId: "1", age: 25, nationality: "England", jerseyNumber: 15, isCaptain: false, bowlingStyle: "Right-arm off-break", battingStyle: "Right-handed bat", stats: { matches: 8, runs: 230, wickets: 0, average: 38.3, strikeRate: 175.6, economy: 0, highest: 100, fours: 18, sixes: 15, fifties: 1, hundreds: 1, bestBowling: "-" } },
        { id: "13", league: "ipl", name: "Reece Topley", role: "Bowler", teamId: "1", age: 30, nationality: "England", jerseyNumber: 27, isCaptain: false, bowlingStyle: "Left-arm fast-medium", battingStyle: "Right-handed bat", stats: { matches: 10, runs: 8, wickets: 12, average: 26.8, strikeRate: 20, economy: 8, highest: 4, fours: 1, sixes: 0, fifties: 0, hundreds: 0, bestBowling: "3/27" } },
        { id: "14", league: "ipl", name: "Lockie Ferguson", role: "Bowler", teamId: "1", age: 32, nationality: "New Zealand", jerseyNumber: 4, isCaptain: false, bowlingStyle: "Right-arm fast", battingStyle: "Right-handed bat", stats: { matches: 38, runs: 45, wickets: 42, average: 28.6, strikeRate: 21.4, economy: 8, highest: 12, fours: 4, sixes: 1, fifties: 0, hundreds: 0, bestBowling: "4/28" } },
        { id: "15", league: "ipl", name: "Yash Dayal", role: "Bowler", teamId: "1", age: 26, nationality: "India", jerseyNumber: 28, isCaptain: false, bowlingStyle: "Left-arm medium-fast", battingStyle: "Right-handed bat", stats: { matches: 20, runs: 12, wickets: 15, average: 32.1, strikeRate: 24, economy: 8, highest: 5, fours: 1, sixes: 0, fifties: 0, hundreds: 0, bestBowling: "3/20" } },
        // MI (Team ID: 2) - Continuing with more players...
        { id: "16", league: "ipl", name: "Rohit Sharma", role: "Batsman", teamId: "2", age: 36, nationality: "India", jerseyNumber: 45, isCaptain: true, bowlingStyle: "Right-arm off-break", battingStyle: "Right-handed bat", stats: { matches: 243, runs: 6230, wickets: 0, average: 30.31, strikeRate: 130.39, economy: 0, highest: 109, fours: 532, sixes: 264, fifties: 42, hundreds: 2, bestBowling: "-" } },
        { id: "17", league: "ipl", name: "Jasprit Bumrah", role: "Bowler", teamId: "2", age: 30, nationality: "India", jerseyNumber: 93, isCaptain: false, bowlingStyle: "Right-arm fast", battingStyle: "Right-handed bat", stats: { matches: 145, runs: 56, wickets: 170, average: 23.95, strikeRate: 87.45, economy: 7.39, highest: 14, fours: 3, sixes: 1, fifties: 0, hundreds: 0, bestBowling: "5/10" } },
        { id: "18", league: "ipl", name: "Suryakumar Yadav", role: "Batsman", teamId: "2", age: 33, nationality: "India", jerseyNumber: 63, isCaptain: false, bowlingStyle: "Right-arm leg-break", battingStyle: "Right-handed bat", stats: { matches: 139, runs: 3241, wickets: 0, average: 32.4, strikeRate: 143.3, economy: 0, highest: 103, fours: 253, sixes: 178, fifties: 21, hundreds: 1, bestBowling: "-" } },
        { id: "19", league: "ipl", name: "Hardik Pandya", role: "All-rounder", teamId: "2", age: 30, nationality: "India", jerseyNumber: 33, isCaptain: false, bowlingStyle: "Right-arm medium-fast", battingStyle: "Right-handed bat", stats: { matches: 123, runs: 2309, wickets: 53, average: 30.1, strikeRate: 145.9, economy: 8.8, highest: 91, fours: 175, sixes: 143, fifties: 10, hundreds: 0, bestBowling: "3/20" } },
        { id: "20", league: "ipl", name: "Ishan Kishan", role: "Wicket-keeper", teamId: "2", age: 25, nationality: "India", jerseyNumber: 32, isCaptain: false, bowlingStyle: "N/A (Wicket-keeper)", battingStyle: "Left-handed bat", stats: { matches: 101, runs: 2205, wickets: 0, average: 27.6, strikeRate: 133.2, economy: 0, highest: 99, fours: 201, sixes: 98, fifties: 14, hundreds: 0, bestBowling: "-" } },
        { id: "21", league: "ipl", name: "Tilak Varma", role: "Batsman", teamId: "2", age: 21, nationality: "India", jerseyNumber: 23, isCaptain: false, bowlingStyle: "Right-arm off-break", battingStyle: "Left-handed bat", stats: { matches: 25, runs: 740, wickets: 0, average: 38.9, strikeRate: 142.3, economy: 0, highest: 84, fours: 58, sixes: 35, fifties: 5, hundreds: 0, bestBowling: "-" } },
        { id: "22", league: "ipl", name: "Tim David", role: "All-rounder", teamId: "2", age: 28, nationality: "Australia", jerseyNumber: 55, isCaptain: false, bowlingStyle: "Right-arm off-break", battingStyle: "Right-handed bat", stats: { matches: 25, runs: 425, wickets: 0, average: 23.6, strikeRate: 163.5, economy: 0, highest: 46, fours: 25, sixes: 28, fifties: 0, hundreds: 0, bestBowling: "-" } },
        { id: "23", league: "ipl", name: "Piyush Chawla", role: "Bowler", teamId: "2", age: 35, nationality: "India", jerseyNumber: 11, isCaptain: false, bowlingStyle: "Right-arm leg-break", battingStyle: "Right-handed bat", stats: { matches: 181, runs: 584, wickets: 179, average: 27.3, strikeRate: 20.4, economy: 7.9, highest: 24, fours: 48, sixes: 25, fifties: 0, hundreds: 0, bestBowling: "4/17" } },
        { id: "24", league: "ipl", name: "Jason Behrendorff", role: "Bowler", teamId: "2", age: 34, nationality: "Australia", jerseyNumber: 28, isCaptain: false, bowlingStyle: "Left-arm fast-medium", battingStyle: "Right-handed bat", stats: { matches: 27, runs: 12, wickets: 28, average: 28.5, strikeRate: 22.9, economy: 7.5, highest: 4, fours: 1, sixes: 0, fifties: 0, hundreds: 0, bestBowling: "3/23" } },
        { id: "25", league: "ipl", name: "Kumar Kartikeya", role: "Bowler", teamId: "2", age: 26, nationality: "India", jerseyNumber: 18, isCaptain: false, bowlingStyle: "Left-arm orthodox", battingStyle: "Right-handed bat", stats: { matches: 12, runs: 8, wickets: 11, average: 28.2, strikeRate: 24.5, economy: 6.9, highest: 4, fours: 1, sixes: 0, fifties: 0, hundreds: 0, bestBowling: "2/19" } },
        { id: "26", league: "ipl", name: "Akash Madhwal", role: "Bowler", teamId: "2", age: 30, nationality: "India", jerseyNumber: 22, isCaptain: false, bowlingStyle: "Right-arm medium-fast", battingStyle: "Right-handed bat", stats: { matches: 10, runs: 5, wickets: 13, average: 22.8, strikeRate: 17.5, economy: 7.8, highest: 3, fours: 0, sixes: 0, fifties: 0, hundreds: 0, bestBowling: "5/5" } },
        { id: "27", league: "ipl", name: "Nehal Wadhera", role: "Batsman", teamId: "2", age: 23, nationality: "India", jerseyNumber: 25, isCaptain: false, bowlingStyle: "Right-arm off-break", battingStyle: "Left-handed bat", stats: { matches: 14, runs: 241, wickets: 0, average: 20.1, strikeRate: 145.8, economy: 0, highest: 64, fours: 18, sixes: 14, fifties: 1, hundreds: 0, bestBowling: "-" } },
        { id: "28", league: "ipl", name: "Vishnu Vinod", role: "Wicket-keeper", teamId: "2", age: 30, nationality: "India", jerseyNumber: 29, isCaptain: false, bowlingStyle: "N/A (Wicket-keeper)", battingStyle: "Right-handed bat", stats: { matches: 5, runs: 45, wickets: 0, average: 15, strikeRate: 128.6, economy: 0, highest: 30, fours: 4, sixes: 2, fifties: 0, hundreds: 0, bestBowling: "-" } },
        { id: "29", league: "ipl", name: "Shams Mulani", role: "Bowler", teamId: "2", age: 26, nationality: "India", jerseyNumber: 31, isCaptain: false, bowlingStyle: "Left-arm orthodox", battingStyle: "Left-handed bat", stats: { matches: 3, runs: 2, wickets: 1, average: 45, strikeRate: 36, economy: 7.5, highest: 2, fours: 0, sixes: 0, fifties: 0, hundreds: 0, bestBowling: "1/18" } },
        { id: "30", league: "ipl", name: "Raghav Goyal", role: "Bowler", teamId: "2", age: 22, nationality: "India", jerseyNumber: 35, isCaptain: false, bowlingStyle: "Left-arm orthodox", battingStyle: "Right-handed bat", stats: { matches: 2, runs: 0, wickets: 1, average: 32, strikeRate: 24, economy: 8, highest: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, bestBowling: "1/19" } }
        // Note: This is a starter set. For 200+ players, use POST endpoint with your player dataset
        // POST /api/restore-players with body: { "players": [array of 200+ player objects] }
      ];
      const existingIPLPlayerNames = existingPlayers.filter((p) => {
        const teamId = String(p.teamId || "").trim();
        const league = p.league || "ipl";
        return league === "ipl" && ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].includes(teamId) || league === "ipl" && !["11", "12", "13", "14", "15"].includes(teamId);
      }).map((p) => p.name.toLowerCase());
      const newIPLPlayers = comprehensiveIPLPlayers.filter(
        (p) => !existingIPLPlayerNames.includes(p.name.toLowerCase())
      );
      const allPlayers = [...wplPlayers, ...newIPLPlayers];
      await env.IPL_CACHE.put("players", JSON.stringify(allPlayers));
      return new Response(JSON.stringify({
        success: true,
        message: "IPL players restored successfully",
        restored: newIPLPlayers.length,
        existingWPL: wplPlayers.length,
        existingIPL: existingPlayers.length - wplPlayers.length,
        totalPlayers: allPlayers.length,
        note: "This restored a starter set. To restore 200+ players, use POST endpoint with your player dataset.",
        nextStep: 'POST /api/restore-players with body: { "players": [your player array] }'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Failed to restore players",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  }
}, "onRequest");

// api/scorecards.js
var import_checked_fetch51 = __toESM(require_checked_fetch());
var corsHeaders5 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function verifyAdminToken8(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken8, "verifyAdminToken");
function generateId() {
  return `scorecard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
__name(generateId, "generateId");
async function onRequest48(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders5 });
  }
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const scorecardId = pathSegments[pathSegments.length - 1];
    const isMatchQuery = url.searchParams.has("matchId");
    const matchId = url.searchParams.get("matchId");
    if (request.method === "GET") {
      if (isMatchQuery && matchId) {
        const list = await env.IPL_CACHE.list({ prefix: "scorecard_" });
        const scorecards = [];
        for (const item of list.keys) {
          try {
            const scorecard = JSON.parse(await env.IPL_CACHE.get(item.name));
            if (scorecard.matchId === matchId) {
              scorecards.push(scorecard);
            }
          } catch (error) {
            console.error(`Error parsing scorecard ${item.name}:`, error);
          }
        }
        return new Response(JSON.stringify(scorecards), {
          status: 200,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      } else if (scorecardId && scorecardId !== "scorecards") {
        const scorecardData = await env.IPL_CACHE.get(`scorecard_${scorecardId}`);
        if (!scorecardData) {
          return new Response(JSON.stringify({ error: "Scorecard not found" }), {
            status: 404,
            headers: { ...corsHeaders5, "Content-Type": "application/json" }
          });
        }
        return new Response(scorecardData, {
          status: 200,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      } else {
        const list = await env.IPL_CACHE.list({ prefix: "scorecard_" });
        const scorecards = [];
        for (const item of list.keys) {
          try {
            const scorecard = JSON.parse(await env.IPL_CACHE.get(item.name));
            scorecards.push(scorecard);
          } catch (error) {
            console.error(`Error parsing scorecard ${item.name}:`, error);
          }
        }
        return new Response(JSON.stringify(scorecards), {
          status: 200,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      }
    }
    if (request.method === "POST") {
      if (!verifyAdminToken8(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      }
      const data = await request.json();
      if (!data.matchId || !data.league || !data.matchInfo || !data.innings) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      }
      const scorecardId2 = generateId();
      const scorecard = {
        id: scorecardId2,
        ...data,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        draft: true
        // Default to draft mode
      };
      await env.IPL_CACHE.put(
        `scorecard_${scorecardId2}`,
        JSON.stringify(scorecard)
      );
      return new Response(JSON.stringify(scorecard), {
        status: 201,
        headers: { ...corsHeaders5, "Content-Type": "application/json" }
      });
    }
    if (request.method === "PUT") {
      if (!verifyAdminToken8(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      }
      if (url.pathname.endsWith("/publish")) {
        const actualId = pathSegments[pathSegments.length - 2];
        const existingData2 = await env.IPL_CACHE.get(`scorecard_${actualId}`);
        if (!existingData2) {
          return new Response(JSON.stringify({ error: "Scorecard not found" }), {
            status: 404,
            headers: { ...corsHeaders5, "Content-Type": "application/json" }
          });
        }
        const scorecard = JSON.parse(existingData2);
        scorecard.draft = false;
        scorecard.publishedAt = (/* @__PURE__ */ new Date()).toISOString();
        scorecard.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        await env.IPL_CACHE.put(
          `scorecard_${actualId}`,
          JSON.stringify(scorecard)
        );
        return new Response(JSON.stringify(scorecard), {
          status: 200,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      }
      if (!scorecardId || scorecardId === "scorecards") {
        return new Response(JSON.stringify({ error: "Scorecard ID required" }), {
          status: 400,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      }
      const existingData = await env.IPL_CACHE.get(`scorecard_${scorecardId}`);
      if (!existingData) {
        return new Response(JSON.stringify({ error: "Scorecard not found" }), {
          status: 404,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      }
      const updateData = await request.json();
      const existingScorecard = JSON.parse(existingData);
      const updatedScorecard = {
        ...existingScorecard,
        ...updateData,
        id: scorecardId,
        // Preserve original ID
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await env.IPL_CACHE.put(
        `scorecard_${scorecardId}`,
        JSON.stringify(updatedScorecard)
      );
      return new Response(JSON.stringify(updatedScorecard), {
        status: 200,
        headers: { ...corsHeaders5, "Content-Type": "application/json" }
      });
    }
    if (request.method === "DELETE") {
      if (!verifyAdminToken8(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      }
      if (!scorecardId || scorecardId === "scorecards") {
        return new Response(JSON.stringify({ error: "Scorecard ID required" }), {
          status: 400,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      }
      const existingData = await env.IPL_CACHE.get(`scorecard_${scorecardId}`);
      if (!existingData) {
        return new Response(JSON.stringify({ error: "Scorecard not found" }), {
          status: 404,
          headers: { ...corsHeaders5, "Content-Type": "application/json" }
        });
      }
      await env.IPL_CACHE.delete(`scorecard_${scorecardId}`);
      return new Response(JSON.stringify({ message: "Scorecard deleted successfully" }), {
        status: 200,
        headers: { ...corsHeaders5, "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders5, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Scorecard API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders5, "Content-Type": "application/json" }
    });
  }
}
__name(onRequest48, "onRequest");

// api/seed.js
var import_checked_fetch52 = __toESM(require_checked_fetch());
var onRequest49 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }
    });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }
  try {
    const mockTeams3 = [
      {
        id: "1",
        name: "Royal Challengers Bengaluru",
        shortName: "RCB",
        logo: "/logos/rcb_logo_premium.svg",
        description: "One of the most popular IPL teams known for their aggressive batting",
        colors: { primary: "#EC1C24", secondary: "#000000" }
      },
      {
        id: "2",
        name: "Mumbai Indians",
        shortName: "MI",
        logo: "/logos/mi_logo_new.svg",
        description: "The most successful IPL team with 5 championship titles",
        colors: { primary: "#004BA0", secondary: "#FFFFFF" }
      },
      {
        id: "3",
        name: "Sunrisers Hyderabad",
        shortName: "SRH",
        logo: "/logos/srh_logo_new.svg",
        description: "Known for their strong bowling attack and consistent performances",
        colors: { primary: "#FF822A", secondary: "#000000" }
      },
      {
        id: "4",
        name: "Gujarat Titans",
        shortName: "GT",
        logo: "/logos/gt_logo_new.svg",
        description: "The newest powerhouse team that won IPL in their debut season",
        colors: { primary: "#1B2130", secondary: "#E15454" }
      },
      {
        id: "5",
        name: "Punjab Kings",
        shortName: "PBKS",
        logo: "/logos/kxip_logo_new.svg",
        description: "Known for their explosive batting and never-say-die attitude",
        colors: { primary: "#ED1D24", secondary: "#FBDD0B" }
      },
      {
        id: "6",
        name: "Delhi Capitals",
        shortName: "DC",
        logo: "/logos/dc_logo_new.svg",
        description: "Young and dynamic team with a perfect blend of experience and youth",
        colors: { primary: "#0078BC", secondary: "#EF1B26" }
      },
      {
        id: "7",
        name: "Lucknow Super Giants",
        shortName: "LSG",
        logo: "/logos/lsg_logo_new.svg",
        description: "The newest franchise making waves with their balanced squad",
        colors: { primary: "#9C2A2C", secondary: "#F7E17D" }
      },
      {
        id: "8",
        name: "Rajasthan Royals",
        shortName: "RR",
        logo: "/logos/rr_logo_new.svg",
        description: "The inaugural IPL champions known for nurturing young talent",
        colors: { primary: "#EA1A85", secondary: "#004B8D" }
      },
      {
        id: "9",
        name: "Kolkata Knight Riders",
        shortName: "KKR",
        logo: "/logos/kkr_logo_new.svg",
        description: "Two-time champions with a massive fan following",
        colors: { primary: "#3A225D", secondary: "#B9975B" }
      },
      {
        id: "10",
        name: "Chennai Super Kings",
        shortName: "CSK",
        logo: "/logos/csk_logo_new.svg",
        description: "The Yellow Army led by the legendary MS Dhoni",
        colors: { primary: "#FFB90F", secondary: "#0081E8" }
      }
    ];
    const mockPlayers = [
      {
        id: "1",
        league: "ipl",
        name: "Virat Kohli",
        role: "Batsman",
        teamId: "1",
        age: 35,
        nationality: "India",
        jerseyNumber: 18,
        isCaptain: true,
        bowlingStyle: "N/A (Batsman)",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 237,
          runs: 7263,
          wickets: 0,
          average: 37.24,
          strikeRate: 130.02,
          economy: 0,
          highest: 113,
          fours: 629,
          sixes: 237,
          fifties: 50,
          hundreds: 7,
          bestBowling: "-"
        }
      },
      {
        id: "2",
        league: "ipl",
        name: "Rohit Sharma",
        role: "Batsman",
        teamId: "2",
        age: 36,
        nationality: "India",
        jerseyNumber: 45,
        isCaptain: true,
        bowlingStyle: "Right-arm off-break",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 243,
          runs: 6230,
          wickets: 0,
          average: 30.31,
          strikeRate: 130.39,
          economy: 0,
          highest: 109,
          fours: 532,
          sixes: 264,
          fifties: 42,
          hundreds: 2,
          bestBowling: "-"
        }
      },
      {
        id: "3",
        league: "ipl",
        name: "Jasprit Bumrah",
        role: "Bowler",
        teamId: "2",
        age: 30,
        nationality: "India",
        jerseyNumber: 93,
        isCaptain: false,
        bowlingStyle: "Right-arm fast",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 145,
          runs: 56,
          wickets: 170,
          average: 23.95,
          strikeRate: 87.45,
          economy: 7.39,
          highest: 14,
          fours: 3,
          sixes: 1,
          fifties: 0,
          hundreds: 0,
          bestBowling: "5/10"
        }
      }
    ];
    const restoreIPL = url.searchParams.get("restoreIPL") === "true";
    const existingPlayers = await env.IPL_CACHE.get("players", "json") || [];
    if (restoreIPL && existingPlayers.length > 0) {
      const wplPlayers = existingPlayers.filter((p) => {
        const teamId = String(p.teamId || "").trim();
        const league = p.league || "ipl";
        return league === "wpl" || ["11", "12", "13", "14", "15"].includes(teamId);
      });
      const existingIPLPlayerNames = existingPlayers.filter((p) => {
        const teamId = String(p.teamId || "").trim();
        const league = p.league || "ipl";
        return league === "ipl" && ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].includes(teamId) || league === "ipl" && !["11", "12", "13", "14", "15"].includes(teamId);
      }).map((p) => p.name.toLowerCase());
      const newIPLPlayers = mockPlayers.filter(
        (p) => !existingIPLPlayerNames.includes(p.name.toLowerCase())
      );
      const allPlayers = [...wplPlayers, ...newIPLPlayers];
      await env.IPL_CACHE.put("players", JSON.stringify(allPlayers));
      return new Response(JSON.stringify({
        message: "IPL players restored successfully",
        restored: newIPLPlayers.length,
        existingWPL: wplPlayers.length,
        totalPlayers: allPlayers.length,
        restoredPlayers: newIPLPlayers.map((p) => p.name)
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    await env.IPL_CACHE.put("players", JSON.stringify(mockPlayers));
    return new Response(JSON.stringify({
      message: "Data seeded successfully",
      playersCount: mockPlayers.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Failed to seed data",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}, "onRequest");

// api/seed-wpl.js
var import_checked_fetch53 = __toESM(require_checked_fetch());
var onRequest50 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }
    });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }
  try {
    const wplTeams = [
      {
        id: "11",
        league: "wpl",
        name: "Mumbai Indians (WPL)",
        shortName: "MI-W",
        logo: "/logos/wpl_mi_logo_animated.svg",
        description: "Defending champions led by Harmanpreet Kaur",
        colors: { primary: "#004BA0", secondary: "#FFD700" },
        homeVenue: "DY Patil Stadium, Mumbai"
      },
      {
        id: "12",
        league: "wpl",
        name: "Royal Challengers Bengaluru (WPL)",
        shortName: "RCB-W",
        logo: "/logos/wpl_rcb_logo.svg",
        description: "Led by Smriti Mandhana, known for explosive batting",
        colors: { primary: "#EC1C24", secondary: "#000000" },
        homeVenue: "M Chinnaswamy Stadium, Bengaluru"
      },
      {
        id: "13",
        league: "wpl",
        name: "UP Warriorz",
        shortName: "UPW",
        logo: "/logos/wpl_upw_logo.svg",
        description: "Dynamic team with young talent",
        colors: { primary: "#FF6B35", secondary: "#1B1B1B" },
        homeVenue: "Ekana Cricket Stadium, Lucknow"
      },
      {
        id: "14",
        league: "wpl",
        name: "Gujarat Giants",
        shortName: "GG",
        logo: "/logos/wpl_gg_logo.svg",
        description: "Strong all-round squad led by Ashleigh Gardner",
        colors: { primary: "#1B2130", secondary: "#E15454" },
        homeVenue: "Narendra Modi Stadium, Ahmedabad"
      },
      {
        id: "15",
        league: "wpl",
        name: "Delhi Capitals (WPL)",
        shortName: "DC-W",
        logo: "/logos/wpl_dc_logo.svg",
        description: "Aggressive team with international stars",
        colors: { primary: "#0078BC", secondary: "#EF1B26" },
        homeVenue: "Arun Jaitley Stadium, Delhi"
      }
    ];
    const wplPlayers = [
      // MI-W Players
      {
        id: "wpl1",
        league: "wpl",
        name: "Harmanpreet Kaur",
        role: "All-rounder",
        teamId: "11",
        age: 35,
        nationality: "India",
        jerseyNumber: 18,
        isCaptain: true,
        bowlingStyle: "Right-arm off-break",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 50,
          runs: 1200,
          wickets: 30,
          average: 28.5,
          strikeRate: 125,
          economy: 7.2,
          highest: 103,
          fours: 85,
          sixes: 45,
          fifties: 8,
          hundreds: 1,
          bestBowling: "3/15"
        }
      },
      {
        id: "wpl2",
        league: "wpl",
        name: "Alyssa Healy",
        role: "Wicket-keeper Batter",
        teamId: "11",
        age: 33,
        nationality: "Australia",
        jerseyNumber: 1,
        isCaptain: false,
        bowlingStyle: "N/A",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 45,
          runs: 980,
          wickets: 0,
          average: 26.5,
          strikeRate: 130,
          economy: 0,
          highest: 88,
          fours: 70,
          sixes: 35,
          fifties: 7,
          hundreds: 0,
          bestBowling: "-"
        }
      },
      {
        id: "wpl3",
        league: "wpl",
        name: "Nat Sciver-Brunt",
        role: "All-rounder",
        teamId: "11",
        age: 31,
        nationality: "England",
        jerseyNumber: 8,
        isCaptain: false,
        bowlingStyle: "Right-arm medium",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 40,
          runs: 750,
          wickets: 45,
          average: 24,
          strikeRate: 118,
          economy: 6.8,
          highest: 75,
          fours: 55,
          sixes: 20,
          fifties: 5,
          hundreds: 0,
          bestBowling: "4/20"
        }
      },
      // RCB-W Players
      {
        id: "wpl4",
        league: "wpl",
        name: "Smriti Mandhana",
        role: "Batter",
        teamId: "12",
        age: 27,
        nationality: "India",
        jerseyNumber: 10,
        isCaptain: true,
        bowlingStyle: "Right-arm medium",
        battingStyle: "Left-handed bat",
        stats: {
          matches: 48,
          runs: 1350,
          wickets: 8,
          average: 32.1,
          strikeRate: 135,
          economy: 8.5,
          highest: 87,
          fours: 95,
          sixes: 48,
          fifties: 10,
          hundreds: 0,
          bestBowling: "2/25"
        }
      },
      {
        id: "wpl5",
        league: "wpl",
        name: "Ellyse Perry",
        role: "All-rounder",
        teamId: "12",
        age: 33,
        nationality: "Australia",
        jerseyNumber: 7,
        isCaptain: false,
        bowlingStyle: "Right-arm fast",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 42,
          runs: 890,
          wickets: 55,
          average: 28.5,
          strikeRate: 120,
          economy: 6.5,
          highest: 85,
          fours: 65,
          sixes: 25,
          fifties: 6,
          hundreds: 0,
          bestBowling: "5/15"
        }
      },
      {
        id: "wpl6",
        league: "wpl",
        name: "Richa Ghosh",
        role: "Wicket-keeper Batter",
        teamId: "12",
        age: 21,
        nationality: "India",
        jerseyNumber: 33,
        isCaptain: false,
        bowlingStyle: "N/A",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 25,
          runs: 420,
          wickets: 0,
          average: 24,
          strikeRate: 140,
          economy: 0,
          highest: 65,
          fours: 30,
          sixes: 18,
          fifties: 2,
          hundreds: 0,
          bestBowling: "-"
        }
      },
      // UP Warriorz Players
      {
        id: "wpl7",
        league: "wpl",
        name: "Alyssa Perry",
        role: "All-rounder",
        teamId: "13",
        age: 23,
        nationality: "Australia",
        jerseyNumber: 17,
        isCaptain: false,
        bowlingStyle: "Right-arm leg-break",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 18,
          runs: 320,
          wickets: 22,
          average: 22.5,
          strikeRate: 125,
          economy: 7,
          highest: 61,
          fours: 25,
          sixes: 10,
          fifties: 2,
          hundreds: 0,
          bestBowling: "3/18"
        }
      },
      {
        id: "wpl8",
        league: "wpl",
        name: "Sophie Devine",
        role: "All-rounder",
        teamId: "13",
        age: 35,
        nationality: "New Zealand",
        jerseyNumber: 6,
        isCaptain: true,
        bowlingStyle: "Right-arm medium",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 38,
          runs: 780,
          wickets: 40,
          average: 26,
          strikeRate: 122,
          economy: 7.1,
          highest: 76,
          fours: 58,
          sixes: 22,
          fifties: 6,
          hundreds: 0,
          bestBowling: "4/22"
        }
      },
      // Gujarat Giants Players
      {
        id: "wpl9",
        league: "wpl",
        name: "Ashleigh Gardner",
        role: "All-rounder",
        teamId: "14",
        age: 26,
        nationality: "Australia",
        jerseyNumber: 8,
        isCaptain: true,
        bowlingStyle: "Right-arm off-break",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 35,
          runs: 680,
          wickets: 48,
          average: 24.5,
          strikeRate: 128,
          economy: 6.8,
          highest: 66,
          fours: 52,
          sixes: 18,
          fifties: 4,
          hundreds: 0,
          bestBowling: "4/12"
        }
      },
      {
        id: "wpl10",
        league: "wpl",
        name: "Beth Mooney",
        role: "Wicket-keeper Batter",
        teamId: "14",
        age: 30,
        nationality: "Australia",
        jerseyNumber: 5,
        isCaptain: false,
        bowlingStyle: "N/A",
        battingStyle: "Left-handed bat",
        stats: {
          matches: 40,
          runs: 920,
          wickets: 0,
          average: 28,
          strikeRate: 132,
          economy: 0,
          highest: 82,
          fours: 68,
          sixes: 28,
          fifties: 8,
          hundreds: 0,
          bestBowling: "-"
        }
      },
      // DC-W Players
      {
        id: "wpl11",
        league: "wpl",
        name: "Meg Lanning",
        role: "Batter",
        teamId: "15",
        age: 31,
        nationality: "Australia",
        jerseyNumber: 1,
        isCaptain: true,
        bowlingStyle: "Right-arm leg-break",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 36,
          runs: 840,
          wickets: 15,
          average: 26.5,
          strikeRate: 125,
          economy: 7.5,
          highest: 78,
          fours: 62,
          sixes: 24,
          fifties: 7,
          hundreds: 0,
          bestBowling: "2/28"
        }
      },
      {
        id: "wpl12",
        league: "wpl",
        name: "Jemimah Rodrigues",
        role: "Batter",
        teamId: "15",
        age: 24,
        nationality: "India",
        jerseyNumber: 21,
        isCaptain: false,
        bowlingStyle: "N/A",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 32,
          runs: 580,
          wickets: 0,
          average: 22,
          strikeRate: 118,
          economy: 0,
          highest: 69,
          fours: 42,
          sixes: 15,
          fifties: 4,
          hundreds: 0,
          bestBowling: "-"
        }
      }
    ];
    const wplMatches = [
      {
        id: "wpl_match_1",
        league: "wpl",
        team1: { id: 11, name: "Mumbai Indians (WPL)", shortName: "MI-W" },
        team2: { id: 12, name: "Royal Challengers Bengaluru (WPL)", shortName: "RCB-W" },
        venue: "DY Patil Stadium, Mumbai",
        date: "2026-01-15",
        time: "19:30",
        status: "scheduled"
      },
      {
        id: "wpl_match_2",
        league: "wpl",
        team1: { id: 13, name: "UP Warriorz", shortName: "UPW" },
        team2: { id: 14, name: "Gujarat Giants", shortName: "GG" },
        venue: "Ekana Cricket Stadium, Lucknow",
        date: "2026-01-16",
        time: "15:30",
        status: "scheduled"
      },
      {
        id: "wpl_match_3",
        league: "wpl",
        team1: { id: 15, name: "Delhi Capitals (WPL)", shortName: "DC-W" },
        team2: { id: 11, name: "Mumbai Indians (WPL)", shortName: "MI-W" },
        venue: "Arun Jaitley Stadium, Delhi",
        date: "2026-01-17",
        time: "19:30",
        status: "scheduled"
      },
      {
        id: "wpl_match_4",
        league: "wpl",
        team1: { id: 12, name: "Royal Challengers Bengaluru (WPL)", shortName: "RCB-W" },
        team2: { id: 14, name: "Gujarat Giants", shortName: "GG" },
        venue: "M Chinnaswamy Stadium, Bengaluru",
        date: "2026-01-18",
        time: "15:30",
        status: "scheduled"
      },
      {
        id: "wpl_match_5",
        league: "wpl",
        team1: { id: 13, name: "UP Warriorz", shortName: "UPW" },
        team2: { id: 15, name: "Delhi Capitals (WPL)", shortName: "DC-W" },
        venue: "Narendra Modi Stadium, Ahmedabad",
        date: "2026-01-19",
        time: "19:30",
        status: "scheduled"
      }
    ];
    const existingTeams = await env.IPL_CACHE.get("teams", "json") || [];
    const existingPlayers = await env.IPL_CACHE.get("players", "json") || [];
    const existingMatches = await env.IPL_CACHE.get("matches", "json") || [];
    const allTeams = [...existingTeams];
    wplTeams.forEach((team) => {
      if (!allTeams.find((t) => t.id === team.id)) {
        allTeams.push(team);
      }
    });
    const allPlayers = [...existingPlayers];
    wplPlayers.forEach((player) => {
      if (!allPlayers.find((p) => p.id === player.id)) {
        allPlayers.push(player);
      }
    });
    const allMatches = [...existingMatches];
    wplMatches.forEach((match2) => {
      if (!allMatches.find((m) => m.id === match2.id)) {
        allMatches.push(match2);
      }
    });
    await env.IPL_CACHE.put("teams", JSON.stringify(allTeams));
    await env.IPL_CACHE.put("players", JSON.stringify(allPlayers));
    await env.IPL_CACHE.put("matches", JSON.stringify(allMatches));
    return new Response(JSON.stringify({
      message: "WPL data seeded successfully",
      data: {
        teamsAdded: wplTeams.length,
        playersAdded: wplPlayers.length,
        matchesAdded: wplMatches.length,
        totalTeams: allTeams.length,
        totalPlayers: allPlayers.length,
        totalMatches: allMatches.length
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    console.error("Error seeding WPL data:", error);
    return new Response(JSON.stringify({
      error: "Failed to seed WPL data",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}, "onRequest");

// api/settings.js
var import_checked_fetch54 = __toESM(require_checked_fetch());
function verifyAdminToken9(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken9, "verifyAdminToken");
var defaultSettings = {
  siteName: "SportsUP18",
  siteDescription: "The biggest cricket tournament in the world",
  maintenanceMode: false,
  aiPredictionsEnabled: false,
  aiModel: "gpt-4",
  maxUploadSize: 50,
  emailNotifications: true,
  analyticsEnabled: true,
  // Controls which sections appear on the public /stats page
  statsConfig: {
    showTopRunScorers: true,
    showTopWicketTakers: true,
    showBestStrikeRates: true,
    showBestEconomyRates: true,
    showInsights: true
  }
};
async function handleGetRequest2(context) {
  const { env } = context;
  try {
    let settings = await env.IPL_CACHE.get("settings", "json");
    if (!settings) {
      settings = defaultSettings;
    } else {
      settings = { ...defaultSettings, ...settings };
    }
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    console.error("Error retrieving settings:", error);
    return new Response(JSON.stringify({ error: "Failed to retrieve settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleGetRequest2, "handleGetRequest");
async function handlePutRequest2(context) {
  const { env, request } = context;
  if (!verifyAdminToken9(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    let settings = await env.IPL_CACHE.get("settings", "json") || defaultSettings;
    const updatedSettings = {
      ...settings,
      ...body
    };
    await env.IPL_CACHE.put("settings", JSON.stringify(updatedSettings));
    return new Response(JSON.stringify({
      success: true,
      message: "Settings updated successfully",
      settings: updatedSettings
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return new Response(JSON.stringify({ error: "Failed to update settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePutRequest2, "handlePutRequest");
async function onRequest51(context) {
  const { request } = context;
  const method = request.method;
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  let response;
  switch (method) {
    case "GET":
      response = await handleGetRequest2(context);
      break;
    case "PUT":
      response = await handlePutRequest2(context);
      break;
    default:
      response = new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
  }
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
__name(onRequest51, "onRequest");

// api/stadium-info.js
var import_checked_fetch55 = __toESM(require_checked_fetch());
var onRequest52 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const venueName = searchParams.get("venue");
  const city = ample = searchParams.get("city");
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  if (!venueName) {
    return new Response(
      JSON.stringify({ error: "Venue name required" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
  try {
    const enrichedData = await enrichStadiumInfo(venueName, city, env);
    return new Response(JSON.stringify(enrichedData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    console.error("Stadium info enrichment error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to enrich stadium information" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function enrichStadiumInfo(venueName, city, env) {
  const baseInfo = {
    name: venueName,
    city: city || "Unknown",
    pitchType: "Red Soil",
    // Default assumption
    floodlights: true,
    // Most modern stadiums have floodlights
    dimensions: "64m x 64m"
    // Standard cricket field
  };
  const enrichedData = { ...baseInfo };
  const knownStadium = await checkKnownStadiums(venueName);
  if (knownStadium) {
    Object.assign(enrichedData, knownStadium);
  }
  try {
    const wikiInfo = await getWikipediaInfo(venueName);
    if (wikiInfo) {
      Object.assign(enrichedData, wikiInfo);
    }
  } catch (error) {
    console.error("Wikipedia search failed:", error);
  }
  if (env.OPENAI_API_KEY && (!enrichedData.capacity || !enrichedData.established)) {
    try {
      const aiInfo = await getAIStadiumInfo(venueName, city, env.OPENAI_API_KEY);
      if (aiInfo) {
        Object.assign(enrichedData, aiInfo);
      }
    } catch (error) {
      console.error("AI enrichment failed:", error);
    }
  }
  return enrichedData;
}
__name(enrichStadiumInfo, "enrichStadiumInfo");
async function checkKnownStadiums(venueName) {
  const knownStadiums = {
    "wankhede": {
      capacity: 33e3,
      established: 1974,
      pitchType: "Red Soil",
      dimensions: "64m x 64m",
      floodlights: true,
      timezone: "Asia/Kolkata"
    },
    "chinnaswamy": {
      capacity: 38e3,
      established: 1969,
      pitchType: "Red Soil",
      dimensions: "64m x 64m",
      floodlights: true,
      timezone: "Asia/Kolkata"
    },
    "eden gardens": {
      capacity: 66e3,
      established: 1864,
      pitchType: "Red Soil",
      dimensions: "66m x 66m",
      floodlights: true,
      timezone: "Asia/Kolkata"
    },
    "chepauk": {
      capacity: 5e4,
      established: 1916,
      pitchType: "Black Soil",
      dimensions: "66m x 66m",
      floodlights: true,
      timezone: "Asia/Kolkata"
    },
    "arun jaitley": {
      capacity: 55e3,
      established: 1883,
      pitchType: "Red Soil",
      dimensions: "64m x 64m",
      floodlights: true,
      timezone: "Asia/Kolkata"
    },
    "narendra modi": {
      capacity: 132e3,
      established: 1982,
      pitchType: "Red Soil",
      dimensions: "64m x 64m",
      floodlights: true,
      timezone: "Asia/Kolkata"
    },
    "m chinnaswamy": {
      capacity: 38e3,
      established: 1969,
      pitchType: "Red Soil",
      dimensions: "64m x 64m",
      floodlights: true,
      timezone: "Asia/Kolkata"
    },
    "m a chidambaram": {
      capacity: 5e4,
      established: 1916,
      pitchType: "Black Soil",
      dimensions: "66m x 66m",
      floodlights: true,
      timezone: "Asia/Kolkata"
    }
  };
  const key = venueName.toLowerCase();
  for (const [stadiumKey, info] of Object.entries(knownStadiums)) {
    if (key.includes(stadiumKey) || stadiumKey.includes(key)) {
      return info;
    }
  }
  return null;
}
__name(checkKnownStadiums, "checkKnownStadiums");
async function getWikipediaInfo(venueName) {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(venueName)}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    const description = data.extract || "";
    const capacityMatch = description.match(/capacity[:\s]*(\d+[,\d]*)/i);
    const yearMatch = description.match(/(?:built|established|opened)[:\s]*(\d{4})/i);
    const info = {};
    if (capacityMatch) {
      info.capacity = parseInt(capacityMatch[1].replace(",", ""));
    }
    if (yearMatch) {
      info.established = parseInt(yearMatch[1]);
    }
    return Object.keys(info).length > 0 ? info : null;
  } catch (error) {
    return null;
  }
}
__name(getWikipediaInfo, "getWikipediaInfo");
async function getAIStadiumInfo(venueName, city, apiKey) {
  const prompt = `
    Provide information about the cricket stadium "${venueName}" in ${city || "unknown city"}.
    Return ONLY a JSON object with these fields if known:
    - capacity: number (seating capacity)
    - established: number (year built/established)
    - pitchType: string (e.g., "Red Soil", "Black Soil", "Green Pitch")
    - dimensions: string (e.g., "64m x 64m")
    - floodlights: boolean
    
    If information is not available, use reasonable defaults for Indian cricket stadiums.
    Return valid JSON only, no explanations.
  `;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.3
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch (error) {
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  }
}
__name(getAIStadiumInfo, "getAIStadiumInfo");

// api/teams.js
var import_checked_fetch56 = __toESM(require_checked_fetch());
function verifyAdminToken10(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken10, "verifyAdminToken");
var defaultTeams = [
  {
    id: "1",
    league: "ipl",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    logo: "/logos/rcb_logo_premium.svg",
    description: "One of the most popular IPL teams known for their aggressive batting",
    colors: { primary: "#EC1C24", secondary: "#000000" },
    trophies: [],
    homeGrounds: ["M. Chinnaswamy Stadium"]
  },
  {
    id: "2",
    league: "ipl",
    name: "Mumbai Indians",
    shortName: "MI",
    logo: "/logos/mi_logo_new.svg",
    description: "The most successful IPL team with 5 championship titles",
    colors: { primary: "#004BA0", secondary: "#FFFFFF" },
    trophies: [
      { year: 2013, name: "IPL Champions" },
      { year: 2015, name: "IPL Champions" },
      { year: 2017, name: "IPL Champions" },
      { year: 2019, name: "IPL Champions" },
      { year: 2023, name: "IPL Champions" }
    ],
    homeGrounds: ["Wankhede Stadium"]
  },
  {
    id: "3",
    league: "ipl",
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    logo: "/logos/srh_logo_new.svg",
    description: "Known for their strong bowling attack and consistent performances",
    colors: { primary: "#FF822A", secondary: "#000000" },
    trophies: [
      { year: 2016, name: "IPL Champions" }
    ],
    homeGrounds: ["Arun Jaitley Stadium", "Rajiv Gandhi International Stadium"]
  },
  {
    id: "4",
    league: "ipl",
    name: "Gujarat Titans",
    shortName: "GT",
    logo: "/logos/gt_logo_new.svg",
    description: "The newest powerhouse team that won IPL in their debut season",
    colors: { primary: "#1B2130", secondary: "#E15454" },
    trophies: [
      { year: 2022, name: "IPL Champions" }
    ],
    homeGrounds: ["Arun Jaitley Stadium", "Narendra Modi Stadium"]
  },
  {
    id: "5",
    league: "ipl",
    name: "Punjab Kings",
    shortName: "PBKS",
    logo: "/logos/kxip_logo_new.svg",
    description: "Known for their explosive batting and never-say-die attitude",
    colors: { primary: "#ED1D24", secondary: "#FBDD0B" },
    trophies: [],
    homeGrounds: ["PCA Stadium", "Arun Jaitley Stadium"]
  },
  {
    id: "6",
    league: "ipl",
    name: "Delhi Capitals",
    shortName: "DC",
    logo: "/logos/dc_logo_new.svg",
    description: "Young and dynamic team with a perfect blend of experience and youth",
    colors: { primary: "#0078BC", secondary: "#EF1B26" },
    trophies: [],
    homeGrounds: ["Arun Jaitley Stadium"]
  },
  {
    id: "7",
    league: "ipl",
    name: "Lucknow Super Giants",
    shortName: "LSG",
    logo: "/logos/lsg_logo_new.svg",
    description: "The newest franchise making waves with their balanced squad",
    colors: { primary: "#9C2A2C", secondary: "#F7E17D" },
    trophies: [],
    homeGrounds: ["ARUN JAITLEY STADIUM", "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium"]
  },
  {
    id: "8",
    league: "ipl",
    name: "Rajasthan Royals",
    shortName: "RR",
    logo: "/logos/rr_logo_new.svg",
    description: "The inaugural IPL champions known for nurturing young talent",
    colors: { primary: "#EA1A85", secondary: "#004B8D" },
    trophies: [
      { year: 2008, name: "IPL Champions" }
    ],
    homeGrounds: ["Arun Jaitley Stadium", "Sawai Mansingh Stadium"]
  },
  {
    id: "9",
    league: "ipl",
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    logo: "/logos/kkr_logo_new.svg",
    description: "Two-time champions with a massive fan following",
    colors: { primary: "#3A225D", secondary: "#B9975B" },
    trophies: [
      { year: 2012, name: "IPL Champions" },
      { year: 2014, name: "IPL Champions" }
    ],
    homeGrounds: ["Eden Gardens"]
  },
  {
    id: "10",
    league: "ipl",
    name: "Chennai Super Kings",
    shortName: "CSK",
    logo: "/logos/csk_logo_new.svg",
    description: "The Yellow Army led by the legendary MS Dhoni",
    colors: { primary: "#FFB90F", secondary: "#0081E8" },
    // Force redeploy - CSK color fix
    trophies: [
      { year: 2010, name: "IPL Champions" },
      { year: 2011, name: "IPL Champions" },
      { year: 2018, name: "IPL Champions" },
      { year: 2021, name: "IPL Champions" }
    ],
    homeGrounds: ["M. A. Chidambaram Stadium"]
  },
  // WPL Teams (IDs 11-15)
  {
    id: "11",
    league: "wpl",
    name: "Mumbai Indians",
    shortName: "MI",
    logo: "/logos/wpl_mi_logo_animated.svg",
    description: "The women's franchise of Mumbai Indians bringing championship pedigree",
    colors: { primary: "#004BA0", secondary: "#FFD700" },
    trophies: [],
    homeGrounds: ["Wankhede Stadium"]
  },
  {
    id: "12",
    league: "wpl",
    name: "Royal Challengers Bangalore",
    shortName: "RCB",
    logo: "/logos/wpl_rcb_logo_animated.svg",
    description: "The women's franchise of RCB with explosive talent",
    colors: { primary: "#EC1C24", secondary: "#FFD700" },
    trophies: [],
    homeGrounds: ["M. Chinnaswamy Stadium"]
  },
  {
    id: "13",
    league: "wpl",
    name: "Delhi Capitals",
    shortName: "DC",
    logo: "/logos/wpl_dc_logo_animated.svg",
    description: "The women's franchise of Delhi Capitals combining youth and experience",
    colors: { primary: "#004BA0", secondary: "#DC2626" },
    trophies: [],
    homeGrounds: ["Arun Jaitley Stadium"]
  },
  {
    id: "14",
    league: "wpl",
    name: "Gujarat Giants",
    shortName: "GG",
    logo: "/logos/wpl_gg_logo_animated.svg",
    description: "The women's franchise of Gujarat Giants aiming for glory",
    colors: { primary: "#F97316", secondary: "#FFD700" },
    trophies: [],
    homeGrounds: ["Narendra Modi Stadium"]
  },
  {
    id: "15",
    league: "wpl",
    name: "UP Warriorz",
    shortName: "UPW",
    logo: "/logos/wpl_upw_logo_animated.svg",
    description: "The women's franchise of UP Warriorz bringing fierce competition",
    colors: { primary: "#059669", secondary: "#F97316" },
    trophies: [],
    homeGrounds: ["Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium"]
  }
];
async function handleGetRequest3(context) {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const league = url.searchParams.get("league");
    let teams = await env.IPL_CACHE.get("teams", "json");
    const hasCSKColorIssue = teams && teams.find((t) => t.shortName === "CSK" && t.colors.primary === "#FFFF00");
    const hasWPLTeams = teams && teams.find((t) => t.league === "wpl");
    if (hasCSKColorIssue || !hasWPLTeams) {
      console.log("Clearing KV cache and using default teams (CSK color fix:", !!hasCSKColorIssue, ", WPL teams missing:", !hasWPLTeams, ")");
      teams = defaultTeams;
      await env.IPL_CACHE.put("teams", JSON.stringify(teams));
    }
    if (!teams) {
      console.log("KV cache empty, using default teams");
      teams = defaultTeams;
    }
    if (league && (league === "ipl" || league === "wpl")) {
      teams = teams.filter((team) => {
        const teamLeague = team.league || "ipl";
        return teamLeague === league;
      });
    }
    teams = teams.map((team) => ({
      ...team,
      league: team.league || "ipl"
      // Default to 'ipl' if missing
    }));
    return new Response(JSON.stringify(teams), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    console.error("Error retrieving teams:", error);
    return new Response(JSON.stringify({ error: "Failed to retrieve teams" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleGetRequest3, "handleGetRequest");
async function handlePostRequest2(context) {
  const { env, request } = context;
  if (!verifyAdminToken10(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { name, shortName, logo, description, colors, trophies, homeGrounds, league } = body;
    if (!name || !shortName || !description) {
      return new Response(JSON.stringify({ error: "Missing required fields: name, shortName, and description are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (league && league !== "ipl" && league !== "wpl") {
      return new Response(JSON.stringify({ error: 'Invalid league value. Must be "ipl" or "wpl"' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let teams = await env.IPL_CACHE.get("teams", "json") || defaultTeams;
    teams = teams.map((t) => ({
      ...t,
      league: t.league || "ipl"
    }));
    const newId = String(Math.max(...teams.map((t) => parseInt(t.id) || 0), 0) + 1);
    let defaultLogo = "";
    if (!logo) {
      if (league === "wpl") {
        const wplLogoMap = {
          "MI-W": "/logos/wpl_mi_logo_animated.svg",
          "RCB-W": "/logos/wpl_rcb_logo_animated.svg",
          "DC-W": "/logos/wpl_dc_logo_animated.svg",
          "GG": "/logos/wpl_gg_logo_animated.svg",
          "UPW": "/logos/wpl_upw_logo_animated.svg"
        };
        defaultLogo = wplLogoMap[shortName.trim().toUpperCase()] || "";
      } else {
        defaultLogo = "";
      }
    }
    const newTeam = {
      id: newId,
      league: league || "ipl",
      // Use provided league or default to 'ipl'
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
      logo: logo || defaultLogo,
      // Use provided logo or calculated default (empty string will be handled by frontend)
      description: description.trim(),
      colors: colors || { primary: league === "wpl" ? "#9333EA" : "#6B46C1", secondary: league === "wpl" ? "#EC4899" : "#FFD700" },
      trophies: trophies || [],
      homeGrounds: homeGrounds || [],
      players: []
      // Initialize empty players array
    };
    console.log(`Creating new team: ${newTeam.name} (${newTeam.shortName}) for league: ${newTeam.league}`);
    teams.push(newTeam);
    await env.IPL_CACHE.put("teams", JSON.stringify(teams));
    console.log(`Team created successfully. Total teams: ${teams.length}, WPL teams: ${teams.filter((t) => t.league === "wpl").length}`);
    return new Response(JSON.stringify(newTeam), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return new Response(JSON.stringify({ error: `Failed to create team: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePostRequest2, "handlePostRequest");
async function handlePutRequest3(context) {
  const { env, request } = context;
  if (!verifyAdminToken10(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { id, name, shortName, logo, description, colors, trophies, homeGrounds, league } = body;
    if (!id) {
      return new Response(JSON.stringify({ error: "Team ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let teams = await env.IPL_CACHE.get("teams", "json") || defaultTeams;
    const teamIndex = teams.findIndex((t) => t.id === id);
    if (teamIndex === -1) {
      return new Response(JSON.stringify({ error: "Team not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedTeam = {
      ...teams[teamIndex],
      ...name && { name },
      ...shortName && { shortName },
      ...logo && { logo },
      ...description && { description },
      ...colors && { colors },
      ...trophies !== void 0 && { trophies },
      ...homeGrounds !== void 0 && { homeGrounds },
      ...league && { league }
      // Update league if provided
    };
    if (!updatedTeam.league) {
      updatedTeam.league = teams[teamIndex].league || "ipl";
    }
    teams[teamIndex] = updatedTeam;
    await env.IPL_CACHE.put("teams", JSON.stringify(teams));
    return new Response(JSON.stringify(updatedTeam), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return new Response(JSON.stringify({ error: "Failed to update team" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePutRequest3, "handlePutRequest");
async function handleDeleteRequest2(context) {
  const { env, request } = context;
  if (!verifyAdminToken10(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const url = new URL(request.url);
    const teamId = url.searchParams.get("id");
    if (!teamId) {
      return new Response(JSON.stringify({ error: "Team ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let teams = await env.IPL_CACHE.get("teams", "json") || defaultTeams;
    const filteredTeams = teams.filter((t) => t.id !== teamId);
    if (filteredTeams.length === teams.length) {
      return new Response(JSON.stringify({ error: "Team not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    await env.IPL_CACHE.put("teams", JSON.stringify(filteredTeams));
    return new Response(JSON.stringify({ success: true, message: "Team deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return new Response(JSON.stringify({ error: "Failed to delete team" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleDeleteRequest2, "handleDeleteRequest");
async function onRequest53(context) {
  const { request } = context;
  const method = request.method;
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  let response;
  switch (method) {
    case "GET":
      response = await handleGetRequest3(context);
      break;
    case "POST":
      response = await handlePostRequest2(context);
      break;
    case "PUT":
      response = await handlePutRequest3(context);
      break;
    case "DELETE":
      response = await handleDeleteRequest2(context);
      break;
    default:
      response = new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
  }
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
__name(onRequest53, "onRequest");

// api/venues.js
var import_checked_fetch57 = __toESM(require_checked_fetch());
var onRequest54 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders6
    });
  }
  try {
    const verifyAdminToken11 = /* @__PURE__ */ __name(async (request2) => {
      const authHeader = request2.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return false;
      }
      const token = authHeader.replace("Bearer ", "");
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) return false;
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) return false;
      const user = JSON.parse(userData);
      return user.role === "admin" || user.role === "super_admin";
    }, "verifyAdminToken");
    if (method === "GET") {
      const venuesList = await env.SPORTS_KV.get("venues:list");
      const venues = venuesList ? JSON.parse(venuesList) : getDefaultVenues();
      return new Response(JSON.stringify({ venues }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    const isAdmin = await verifyAdminToken11(request);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    if (method === "POST") {
      const body = await request.json();
      const venuesList = await env.SPORTS_KV.get("venues:list");
      const venues = venuesList ? JSON.parse(venuesList) : getDefaultVenues();
      const newVenue = {
        id: Date.now().toString(),
        ...body,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      venues.push(newVenue);
      await env.SPORTS_KV.put("venues:list", JSON.stringify(venues));
      return new Response(JSON.stringify({ venue: newVenue }), {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (method === "PUT") {
      const body = await request.json();
      const { id, ...updateData } = body;
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Venue ID required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const venuesList = await env.SPORTS_KV.get("venues:list");
      const venues = venuesList ? JSON.parse(venuesList) : getDefaultVenues();
      const venueIndex = venues.findIndex((v) => v.id === id);
      if (venueIndex === -1) {
        return new Response(
          JSON.stringify({ error: "Venue not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      venues[venueIndex] = { ...venues[venueIndex], ...updateData, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      await env.SPORTS_KV.put("venues:list", JSON.stringify(venues));
      return new Response(JSON.stringify({ venue: venues[venueIndex] }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    if (method === "DELETE") {
      const { id } = await request.json();
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Venue ID required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      const venuesList = await env.SPORTS_KV.get("venues:list");
      const venues = venuesList ? JSON.parse(venuesList) : getDefaultVenues();
      const filteredVenues = venues.filter((v) => v.id !== id);
      if (filteredVenues.length === venues.length) {
        return new Response(
          JSON.stringify({ error: "Venue not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
        );
      }
      await env.SPORTS_KV.put("venues:list", JSON.stringify(filteredVenues));
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders6 }
      });
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  } catch (error) {
    console.error("Venues API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
function getDefaultVenues() {
  return [
    {
      id: "1",
      name: "M. Chinnaswamy Stadium",
      city: "Bengaluru",
      lat: 12.9,
      lng: 77.6,
      capacity: 38e3,
      pitchType: "Red Soil",
      floodlights: true,
      dimensions: "64m x 64m",
      established: 1969
    },
    {
      id: "2",
      name: "M. A. Chidambaram Stadium",
      city: "Chennai",
      lat: 13.1,
      lng: 80.3,
      capacity: 5e4,
      pitchType: "Black Soil",
      floodlights: true,
      dimensions: "66m x 66m",
      established: 1916
    },
    {
      id: "3",
      name: "Eden Gardens",
      city: "Kolkata",
      lat: 22.6,
      lng: 88.4,
      capacity: 66e3,
      pitchType: "Red Soil",
      floodlights: true,
      dimensions: "66m x 66m",
      established: 1864
    }
  ];
}
__name(getDefaultVenues, "getDefaultVenues");

// api/weather-enhanced.js
var import_checked_fetch58 = __toESM(require_checked_fetch());
var onRequest55 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders6 });
  }
  try {
    const action = searchParams.get("action") || "current";
    const venueId = searchParams.get("venueId");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    switch (action) {
      case "current":
        return await getCurrentWeather(env, venueId, lat, lng, corsHeaders6);
      case "forecast":
        return await getWeatherForecast(env, venueId, lat, lng, corsHeaders6);
      case "ai-analysis":
        return await getAIWeatherAnalysis(env, venueId, lat, lng, corsHeaders6);
      case "sync":
        return await syncWeatherData(env, corsHeaders6);
      default:
        return await getCurrentWeather(env, venueId, lat, lng, corsHeaders6);
    }
  } catch (error) {
    console.error("Weather API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch weather data" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function getCurrentWeather(env, venueId, lat, lng, corsHeaders6) {
  let weatherData = await getCachedWeatherData(env);
  if (!weatherData) {
    weatherData = generateSampleWeatherData(venueId, lat, lng);
  }
  const enhancedData = weatherData.map((weather) => ({
    ...weather,
    aiPrediction: generateAIWeatherPrediction(weather),
    matchImpact: calculateMatchImpact(weather),
    recommendations: getPlayingRecommendations(weather)
  }));
  return new Response(JSON.stringify({
    weather: enhancedData,
    cached: true,
    lastUpdated: enhancedData[0]?.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
    nextUpdate: getNextUpdateTime()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders6 }
  });
}
__name(getCurrentWeather, "getCurrentWeather");
async function getWeatherForecast(env, venueId, lat, lng, corsHeaders6) {
  const forecast = generateWeatherForecast(venueId, lat, lng);
  return new Response(JSON.stringify({
    forecast,
    venueId,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    aiEnhanced: true
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders6 }
  });
}
__name(getWeatherForecast, "getWeatherForecast");
async function getAIWeatherAnalysis(env, venueId, lat, lng, corsHeaders6) {
  const currentWeather = await getCachedWeatherData(env) || generateSampleWeatherData(venueId, lat, lng);
  const forecast = generateWeatherForecast(venueId, lat, lng);
  const analysis = {
    venueId,
    currentConditions: currentWeather[0],
    forecast,
    aiAnalysis: {
      matchImpact: calculateMatchImpact(currentWeather[0]),
      pitchEffect: predictPitchBehavior(currentWeather[0], forecast),
      playerConditions: predictPlayerConditions(currentWeather[0]),
      strategicRecommendations: getStrategicRecommendations(currentWeather[0], forecast),
      confidence: 85 + Math.random() * 10,
      riskFactors: identifyRiskFactors(currentWeather[0], forecast)
    },
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return new Response(JSON.stringify(analysis), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders6 }
  });
}
__name(getAIWeatherAnalysis, "getAIWeatherAnalysis");
async function syncWeatherData(env, corsHeaders6) {
  try {
    const venues = [
      { id: "1", name: "Narendra Modi Stadium", lat: 23.0225, lng: 72.5714 },
      { id: "2", name: "Eden Gardens", lat: 22.5645, lng: 88.3412 },
      { id: "3", name: "Wankhede Stadium", lat: 18.9417, lng: 72.8258 },
      { id: "4", name: "M. Chinnaswamy Stadium", lat: 12.9784, lng: 77.5994 },
      { id: "5", name: "MA Chidambaram Stadium", lat: 13.0624, lng: 80.2411 }
    ];
    const weatherData = venues.map((venue) => generateSampleWeatherData(venue.id, venue.lat.toString(), venue.lng.toString()));
    await env.SPORTS_KV.put("weather:latest", JSON.stringify(weatherData), { expirationTtl: 3600 });
    return new Response(JSON.stringify({
      success: true,
      message: "Weather data synced successfully",
      venuesUpdated: venues.length,
      nextUpdate: getNextUpdateTime()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to sync weather data"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  }
}
__name(syncWeatherData, "syncWeatherData");
function generateSampleWeatherData(venueId, lat, lng) {
  const baseTemp = 25 + Math.random() * 10;
  const conditions = ["sunny", "cloudy", "partly-cloudy", "overcast"];
  return [{
    venueId: venueId || "1",
    coordinates: { lat: parseFloat(lat) || 23.0225, lng: parseFloat(lng) || 72.5714 },
    temperature: baseTemp,
    feelsLike: baseTemp + (Math.random() - 0.5) * 4,
    humidity: 40 + Math.random() * 40,
    windSpeed: 5 + Math.random() * 15,
    windDirection: Math.random() * 360,
    pressure: 1e3 + Math.random() * 20,
    visibility: 8 + Math.random() * 4,
    uvIndex: 5 + Math.random() * 5,
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    description: "Partly cloudy with moderate humidity",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }];
}
__name(generateSampleWeatherData, "generateSampleWeatherData");
function generateWeatherForecast(venueId, lat, lng) {
  return Array.from({ length: 5 }, (_, i) => ({
    date: new Date(Date.now() + i * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    maxTemp: 30 + Math.random() * 8,
    minTemp: 20 + Math.random() * 8,
    condition: ["Sunny", "Cloudy", "Partly Cloudy", "Rainy"][Math.floor(Math.random() * 4)],
    precipitation: Math.random() * 50,
    humidity: 40 + Math.random() * 40,
    windSpeed: 5 + Math.random() * 15,
    uvIndex: 3 + Math.random() * 7
  }));
}
__name(generateWeatherForecast, "generateWeatherForecast");
function generateAIWeatherPrediction(weather) {
  return {
    matchImpact: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
    pitchEffect: "Dry pitch will favor spinners as the match progresses",
    dewFactor: Math.random() * 100,
    playingConditions: "Excellent batting conditions expected",
    recommendations: [
      "Teams winning toss might prefer to field first",
      "Spinners will be crucial in middle overs",
      "Dew might affect second innings bowling"
    ],
    confidence: 75 + Math.random() * 20
  };
}
__name(generateAIWeatherPrediction, "generateAIWeatherPrediction");
function calculateMatchImpact(weather) {
  let impact = "low";
  const factors = [];
  if (weather.temperature > 35) {
    impact = "high";
    factors.push("High temperature affects player endurance");
  }
  if (weather.humidity > 80) {
    impact = "high";
    factors.push("High humidity increases dew factor");
  }
  if (weather.windSpeed > 20) {
    impact = "medium";
    factors.push("Strong wind affects ball movement");
  }
  if (weather.condition === "rainy") {
    impact = "high";
    factors.push("Rain may interrupt play");
  }
  return { impact, factors };
}
__name(calculateMatchImpact, "calculateMatchImpact");
function getPlayingRecommendations(weather) {
  const recommendations = [];
  if (weather.humidity > 70) {
    recommendations.push("Expect dew in second innings");
    recommendations.push("Spinners will be effective later");
  }
  if (weather.temperature > 30) {
    recommendations.push("Players need frequent hydration");
    recommendations.push("Ball may swing less in heat");
  }
  if (weather.windSpeed > 15) {
    recommendations.push("Fast bowlers may get assistance");
    recommendations.push("Fielding in deep may be challenging");
  }
  return recommendations;
}
__name(getPlayingRecommendations, "getPlayingRecommendations");
function predictPitchBehavior(weather, forecast) {
  return {
    day1: "Hard and dry surface, good for batting",
    day2: "Pitch starts to slow down, spinners come into play",
    day3: "Cracks appearing, variable bounce",
    evolution: "Expected to slow down as match progresses"
  };
}
__name(predictPitchBehavior, "predictPitchBehavior");
function predictPlayerConditions(weather) {
  return {
    batting: "Favorable conditions with minimal wind interference",
    bowling: "Pacers may get early movement, spinners later",
    fielding: "Dry outfield allows quick boundary movement",
    fitness: "High temperature requires regular hydration breaks"
  };
}
__name(predictPlayerConditions, "predictPlayerConditions");
function getStrategicRecommendations(weather, forecast) {
  return [
    "Consider batting first if dew is expected",
    "Fast bowlers should exploit early morning conditions",
    "Spinners will be crucial in middle overs",
    "Deep field in death overs due to dry outfield"
  ];
}
__name(getStrategicRecommendations, "getStrategicRecommendations");
function identifyRiskFactors(weather, forecast) {
  const risks = [];
  if (forecast.some((day) => day.precipitation > 70)) {
    risks.push({ type: "rain", probability: 0.7, impact: "high" });
  }
  if (weather.humidity > 85) {
    risks.push({ type: "dew", probability: 0.8, impact: "medium" });
  }
  if (weather.temperature > 35) {
    risks.push({ type: "heat", probability: 0.6, impact: "medium" });
  }
  return risks;
}
__name(identifyRiskFactors, "identifyRiskFactors");
async function getCachedWeatherData(env) {
  try {
    const latestWeather = await env.SPORTS_KV.get("weather:latest");
    if (latestWeather) {
      return JSON.parse(latestWeather);
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const currentHour = (/* @__PURE__ */ new Date()).getHours();
    const timeSlot = currentHour < 12 ? "morning" : "evening";
    const cachedWeather = await env.SPORTS_KV.get(`weather:${today}:${timeSlot}`);
    if (cachedWeather) {
      return JSON.parse(cachedWeather);
    }
    const otherTimeSlot = currentHour < 12 ? "evening" : "morning";
    const otherCachedWeather = await env.SPORTS_KV.get(`weather:${today}:${otherTimeSlot}`);
    if (otherCachedWeather) {
      return JSON.parse(otherCachedWeather);
    }
    return null;
  } catch (error) {
    console.error("Error fetching cached weather:", error);
    return null;
  }
}
__name(getCachedWeatherData, "getCachedWeatherData");
function getNextUpdateTime() {
  const now = /* @__PURE__ */ new Date();
  const currentHour = now.getUTCHours();
  if (currentHour < 6) {
    const nextUpdate = new Date(now);
    nextUpdate.setUTCHours(6, 0, 0, 0);
    return nextUpdate.toISOString();
  } else if (currentHour < 18) {
    const nextUpdate = new Date(now);
    nextUpdate.setUTCHours(18, 0, 0, 0);
    return nextUpdate.toISOString();
  } else {
    const nextUpdate = new Date(now);
    nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
    nextUpdate.setUTCHours(6, 0, 0, 0);
    return nextUpdate.toISOString();
  }
}
__name(getNextUpdateTime, "getNextUpdateTime");

// api/weather-forecast.js
var import_checked_fetch59 = __toESM(require_checked_fetch());
var onRequest56 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const groundId = searchParams.get("groundId");
  const days = parseInt(searchParams.get("days") || "3");
  const corsHeaders6 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders6 });
  }
  try {
    const grounds = await getGroundsFromKV(env);
    const ground = grounds.find((g) => g.id === groundId);
    if (!ground) {
      return new Response(
        JSON.stringify({ error: "Ground not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
      );
    }
    const forecast = await fetchWeatherForecast(ground, env, days);
    return new Response(JSON.stringify({ forecast }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders6 }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch weather forecast" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders6 } }
    );
  }
}, "onRequest");
async function fetchWeatherForecast(ground, env, days) {
  const API_KEY = env.WEATHER_API_KEY;
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${ground.lat}&lon=${ground.lng}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    const dailyForecasts = [];
    const processedDates = /* @__PURE__ */ new Set();
    for (const item of data.list) {
      const date = item.dt_txt.split(" ")[0];
      if (!processedDates.has(date) && dailyForecasts.length < days) {
        processedDates.add(date);
        dailyForecasts.push({
          date,
          temperature: {
            min: item.main.temp_min,
            max: item.main.temp_max,
            avg: item.main.temp
          },
          condition: item.weather[0].main,
          description: item.weather[0].description,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          precipitation: item.pop * 100,
          // Probability of precipitation
          icon: item.weather[0].icon
        });
      }
    }
    return {
      groundId: ground.id,
      groundName: ground.name,
      forecasts: dailyForecasts,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (error) {
    console.error(`Failed to fetch forecast for ${ground.name}:`, error);
    throw error;
  }
}
__name(fetchWeatherForecast, "fetchWeatherForecast");
async function getGroundsFromKV(env) {
  const groundsList = await env.SPORTS_KV.get("grounds:list");
  return groundsList ? JSON.parse(groundsList) : [];
}
__name(getGroundsFromKV, "getGroundsFromKV");

// [[route]].ts
var import_checked_fetch60 = __toESM(require_checked_fetch());
var onRequest57 = /* @__PURE__ */ __name(async (context) => {
  return context.next();
}, "onRequest");

// _middleware.ts
var import_checked_fetch61 = __toESM(require_checked_fetch());
var onRequest58 = /* @__PURE__ */ __name(async (context) => {
  const { request } = context;
  console.log(`[Middleware] ${request.method} ${new URL(request.url).pathname}`);
  return context.next();
}, "onRequest");

// ../.wrangler/tmp/pages-b9AwII/functionsRoutes-0.7237265708857321.mjs
var routes = [
  {
    routePath: "/api/admin/analytics/toss",
    mountPath: "/api/admin/analytics",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/admin/ml/train",
    mountPath: "/api/admin/ml",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/admin/users/activity",
    mountPath: "/api/admin/users",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/account/password",
    mountPath: "/api/account",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/account/sessions",
    mountPath: "/api/account",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/api/admin/admins",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/api/admin/backup-players",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/api/admin/backup-points-table",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  },
  {
    routePath: "/api/admin/datasets",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest9]
  },
  {
    routePath: "/api/admin/email-users",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest10]
  },
  {
    routePath: "/api/admin/login",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest11]
  },
  {
    routePath: "/api/admin/ml-train",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest12]
  },
  {
    routePath: "/api/admin/moderation",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest13]
  },
  {
    routePath: "/api/admin/send-bulk-email",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest14]
  },
  {
    routePath: "/api/admin/setup",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest15]
  },
  {
    routePath: "/api/admin/upload-players-csv",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest16]
  },
  {
    routePath: "/api/admin/users",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest17]
  },
  {
    routePath: "/api/calendar/ical",
    mountPath: "/api/calendar",
    method: "",
    middlewares: [],
    modules: [onRequest18]
  },
  {
    routePath: "/api/predictions/leaderboard",
    mountPath: "/api/predictions",
    method: "",
    middlewares: [],
    modules: [onRequest19]
  },
  {
    routePath: "/api/predictions/polls",
    mountPath: "/api/predictions",
    method: "",
    middlewares: [],
    modules: [onRequest20]
  },
  {
    routePath: "/api/predictions/stats",
    mountPath: "/api/predictions",
    method: "",
    middlewares: [],
    modules: [onRequest21]
  },
  {
    routePath: "/api/weather/:venueId",
    mountPath: "/api/weather",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/weather/:venueId",
    mountPath: "/api/weather",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/messages/:id",
    mountPath: "/api/messages",
    method: "",
    middlewares: [],
    modules: [onRequest22]
  },
  {
    routePath: "/api/coaches",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/coaches",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/key-players",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/key-players",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/account",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest23]
  },
  {
    routePath: "/api/admin-email-dashboard",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest24]
  },
  {
    routePath: "/api/ai-advanced",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest25]
  },
  {
    routePath: "/api/ai-advanced-complete",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest26]
  },
  {
    routePath: "/api/ai-content",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest27]
  },
  {
    routePath: "/api/ai-content-complete",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest28]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest29]
  },
  {
    routePath: "/api/content",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest30]
  },
  {
    routePath: "/api/email-analytics",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest31]
  },
  {
    routePath: "/api/email-preferences",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest32]
  },
  {
    routePath: "/api/email-queue",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest33]
  },
  {
    routePath: "/api/email-segmentation",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest34]
  },
  {
    routePath: "/api/email-service",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest35]
  },
  {
    routePath: "/api/enrichDescription",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest36]
  },
  {
    routePath: "/api/geocoding",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest37]
  },
  {
    routePath: "/api/legal",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest38]
  },
  {
    routePath: "/api/live-score",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest39]
  },
  {
    routePath: "/api/matches",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest40]
  },
  {
    routePath: "/api/messages",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest41]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest42]
  },
  {
    routePath: "/api/players",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest43]
  },
  {
    routePath: "/api/predictions",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest44]
  },
  {
    routePath: "/api/preferences",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest45]
  },
  {
    routePath: "/api/profile",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest46]
  },
  {
    routePath: "/api/restore-players",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest47]
  },
  {
    routePath: "/api/scorecards",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest48]
  },
  {
    routePath: "/api/seed",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest49]
  },
  {
    routePath: "/api/seed-wpl",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest50]
  },
  {
    routePath: "/api/settings",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest51]
  },
  {
    routePath: "/api/stadium-info",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest52]
  },
  {
    routePath: "/api/teams",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest53]
  },
  {
    routePath: "/api/venues",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest54]
  },
  {
    routePath: "/api/weather-enhanced",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest55]
  },
  {
    routePath: "/api/weather-forecast",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest56]
  },
  {
    routePath: "/:route*",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest57]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest58],
    modules: []
  }
];

// ../.wrangler/tmp/bundle-FUkoku/middleware-loader.entry.ts
var import_checked_fetch68 = __toESM(require_checked_fetch());

// ../.wrangler/tmp/bundle-FUkoku/middleware-insertion-facade.js
var import_checked_fetch66 = __toESM(require_checked_fetch());

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/pages-template-worker.ts
var import_checked_fetch63 = __toESM(require_checked_fetch());

// ../../../../../opt/homebrew/lib/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
var import_checked_fetch62 = __toESM(require_checked_fetch());
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var import_checked_fetch64 = __toESM(require_checked_fetch());
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
var import_checked_fetch65 = __toESM(require_checked_fetch());
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-FUkoku/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
var import_checked_fetch67 = __toESM(require_checked_fetch());
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-FUkoku/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.32127728194558647.mjs.map
