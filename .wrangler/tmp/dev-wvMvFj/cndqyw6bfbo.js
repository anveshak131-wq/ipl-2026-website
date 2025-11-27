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

// .wrangler/tmp/bundle-FADqrw/checked-fetch.js
var require_checked_fetch = __commonJS({
  ".wrangler/tmp/bundle-FADqrw/checked-fetch.js"() {
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

// .wrangler/tmp/bundle-FADqrw/middleware-loader.entry.ts
var import_checked_fetch55 = __toESM(require_checked_fetch());

// wrangler-modules-watch:wrangler:modules-watch
var import_checked_fetch = __toESM(require_checked_fetch());

// .wrangler/tmp/bundle-FADqrw/middleware-insertion-facade.js
var import_checked_fetch53 = __toESM(require_checked_fetch());

// .wrangler/tmp/pages-0xxRMs/cndqyw6bfbo.js
var import_checked_fetch50 = __toESM(require_checked_fetch());

// .wrangler/tmp/pages-0xxRMs/functionsWorker-0.40230143262853435.mjs
var import_checked_fetch2 = __toESM(require_checked_fetch(), 1);
import crypto2 from "node:crypto";
import crypto3 from "node:crypto";
import crypto4 from "node:crypto";
import crypto5 from "node:crypto";
var __create2 = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
var __getOwnPropNames2 = Object.getOwnPropertyNames;
var __getProtoOf2 = Object.getPrototypeOf;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __commonJS2 = /* @__PURE__ */ __name((cb, mod) => /* @__PURE__ */ __name(function __require() {
  return mod || (0, cb[__getOwnPropNames2(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
}, "__require"), "__commonJS");
var __copyProps2 = /* @__PURE__ */ __name((to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames2(from))
      if (!__hasOwnProp2.call(to, key) && key !== except)
        __defProp2(to, key, { get: /* @__PURE__ */ __name(() => from[key], "get"), enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
  }
  return to;
}, "__copyProps");
var __toESM2 = /* @__PURE__ */ __name((mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
  mod
)), "__toESM");
var require_checked_fetch2 = __commonJS2({
  "../.wrangler/tmp/bundle-lHv9v4/checked-fetch.js"() {
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
    __name2(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});
var import_checked_fetch3 = __toESM2(require_checked_fetch2());
var normalizeTeamName = /* @__PURE__ */ __name2((name) => {
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
var onRequest = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  if (method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const { datasetKeys, datasetWeights } = body;
    if (!Array.isArray(datasetKeys) || datasetKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: "datasetKeys must be a non-empty array of dataset keys" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const trimmedKeys = datasetKeys.map((k) => typeof k === "string" ? k.trim() : "").filter((k) => k);
    if (trimmedKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: "datasetKeys must contain at least one non-empty string" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
    const ensureTeamEntry = /* @__PURE__ */ __name2((teamName) => {
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
    const ensureVenueEntry = /* @__PURE__ */ __name2((teamName, venueName) => {
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
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      let dataset;
      try {
        dataset = JSON.parse(value);
      } catch {
        return new Response(
          JSON.stringify({ error: `Malformed dataset in KV for key '${key}'` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const headers = Array.isArray(dataset.headers) ? dataset.headers : null;
      const rows = Array.isArray(dataset.rows) ? dataset.rows : null;
      if (!headers || !rows) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' is missing headers or rows` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Toss analytics error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch22 = __toESM2(require_checked_fetch2());
var onRequest2 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  if (method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!targetColumn || typeof targetColumn !== "string") {
      return new Response(
        JSON.stringify({ error: "targetColumn is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!Array.isArray(featureColumns) || featureColumns.length === 0) {
      return new Response(
        JSON.stringify({ error: "featureColumns must be a non-empty array" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const datasetsMeta = [];
    for (const key of datasetKeysList) {
      const value = await env.SPORTS_KV.get(`dataset:${key}`);
      if (!value) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' not found` }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      let dataset;
      try {
        dataset = JSON.parse(value);
      } catch {
        return new Response(
          JSON.stringify({ error: `Malformed dataset in KV for key '${key}'` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const headers = Array.isArray(dataset.headers) ? dataset.headers : null;
      const rows = Array.isArray(dataset.rows) ? dataset.rows : null;
      if (!headers || !rows) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' is missing headers or rows` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const targetIndex = headers.indexOf(targetColumn);
      if (targetIndex === -1) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' does not contain target column '${targetColumn}'` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
    const softmax = /* @__PURE__ */ __name2((logits) => {
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("ML train error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch32 = __toESM2(require_checked_fetch2());
var onRequest3 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
    });
  }
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const matchId = body.matchId || "current";
      if (user.role === "admin" || user.role === "super_admin") {
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
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
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Admin users activity error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch4 = __toESM2(require_checked_fetch2());
var encryptPassword = /* @__PURE__ */ __name2((password, salt) => {
  const hash = crypto2.createHash("sha256");
  hash.update(password + salt);
  return hash.digest("hex");
}, "encryptPassword");
var generateSalt = /* @__PURE__ */ __name2(() => crypto2.randomBytes(16).toString("hex"), "generateSalt");
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
var onRequest4 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  if (method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    const body = await request.json();
    const { currentPassword, newPassword } = body || {};
    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: "currentPassword and newPassword are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const currentHash = encryptPassword(String(currentPassword), user.salt);
    if (currentHash !== user.hashedPassword) {
      return new Response(
        JSON.stringify({ error: "Current password is incorrect" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const normalizedNew = String(newPassword).trim();
    if (normalizedNew.length < 12) {
      return new Response(
        JSON.stringify({ error: "New password must be at least 12 characters long" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (COMMON_PASSWORDS.has(normalizedNew.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "New password is too common. Please choose a stronger password." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Password change error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch5 = __toESM2(require_checked_fetch2());
var onRequest5 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  if (method !== "GET" && method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Sessions error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch6 = __toESM2(require_checked_fetch2());
var onRequest6 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  if (method !== "POST" && method !== "GET" && method !== "DELETE") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (method === "GET") {
      const datasetKey2 = url.searchParams.get("key");
      if (datasetKey2) {
        const safeKey2 = datasetKey2.trim();
        if (!safeKey2) {
          return new Response(
            JSON.stringify({ error: "datasetKey cannot be empty" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
          );
        }
        const value = await env.SPORTS_KV.get(`dataset:${safeKey2}`);
        if (!value) {
          return new Response(
            JSON.stringify({ error: "Dataset not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
          );
        }
        try {
          const dataset2 = JSON.parse(value);
          return new Response(
            JSON.stringify({ dataset: dataset2 }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
          );
        } catch {
          return new Response(
            JSON.stringify({ error: "Malformed dataset in KV" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (method === "DELETE") {
      const datasetKey2 = url.searchParams.get("key");
      if (!datasetKey2 || !datasetKey2.trim()) {
        return new Response(
          JSON.stringify({ error: "datasetKey is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const safeKey2 = datasetKey2.trim();
      await env.SPORTS_KV.delete(`dataset:${safeKey2}`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const body = await request.json();
    const { datasetKey, headers, rows, meta } = body || {};
    if (!datasetKey || typeof datasetKey !== "string") {
      return new Response(
        JSON.stringify({ error: "datasetKey is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return new Response(
        JSON.stringify({ error: "headers and rows must be arrays" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const safeKey = datasetKey.trim();
    if (!safeKey) {
      return new Response(
        JSON.stringify({ error: "datasetKey cannot be empty" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Admin dataset save error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch7 = __toESM2(require_checked_fetch2());
var onRequest7 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
    });
  }
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const adminUser = JSON.parse(adminUserData);
    const effectiveRole = adminUser.role || roleFromToken;
    if (effectiveRole !== "admin" && effectiveRole !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (method === "PUT") {
      const body = await request.json();
      const { email, emailNotificationsEnabled, favoriteTeamIds } = body || {};
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Missing email" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Admin email users error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch8 = __toESM2(require_checked_fetch2());
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
__name2(base32ToBytes, "base32ToBytes");
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
__name2(generateTotpCode, "generateTotpCode");
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
__name2(verifyTotpCode, "verifyTotpCode");
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
var verifyPassword = /* @__PURE__ */ __name2((password, salt, hashedPassword) => {
  const hash = crypto3.createHash("sha256");
  hash.update(password + salt);
  return hash.digest("hex") === hashedPassword;
}, "verifyPassword");
function generateToken(user) {
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
__name(generateToken, "generateToken");
__name2(generateToken, "generateToken");
var onRequest8 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders2
    });
  }
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
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
            ...corsHeaders2
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
                ...corsHeaders2
              }
            }
          );
        }
      }
      const token = generateToken(hardcodedUser);
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
          role: hardcodedUser.role,
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
            role: hardcodedUser.role
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders2
          }
        }
      );
    }
    if (env && env.SPORTS_KV) {
      const userData = await env.SPORTS_KV.get(`user:${username}`);
      if (userData) {
        const user = JSON.parse(userData);
        if (user.role === "admin" && verifyPassword(password, user.salt, user.hashedPassword)) {
          if (totpSecret) {
            const ok2fa = await verifyTotpCode(totpSecret, totp);
            if (!ok2fa) {
              return new Response(
                JSON.stringify({ error: "Invalid 2FA code" }),
                {
                  status: 401,
                  headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders2
                  }
                }
              );
            }
          }
          let token = user.token;
          const nowIso = (/* @__PURE__ */ new Date()).toISOString();
          if (!token) {
            const tokenBuffer = crypto3.randomBytes(32);
            token = tokenBuffer.toString("hex");
          }
          const updatedUser = {
            ...user,
            token,
            lastLogin: nowIso
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
                ...corsHeaders2
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
          ...corsHeaders2
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
          ...corsHeaders2
        }
      }
    );
  }
}, "onRequest");
var import_checked_fetch9 = __toESM2(require_checked_fetch2());
var onRequest9 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  if (method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!targetColumn || typeof targetColumn !== "string") {
      return new Response(
        JSON.stringify({ error: "targetColumn is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!Array.isArray(featureColumns) || featureColumns.length === 0) {
      return new Response(
        JSON.stringify({ error: "featureColumns must be a non-empty array" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const safeKey = datasetKey.trim();
    const value = await env.SPORTS_KV.get(`dataset:${safeKey}`);
    if (!value) {
      return new Response(
        JSON.stringify({ error: "Dataset not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    let dataset;
    try {
      dataset = JSON.parse(value);
    } catch {
      return new Response(
        JSON.stringify({ error: "Malformed dataset in KV" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const headers = Array.isArray(dataset.headers) ? dataset.headers : null;
    const rows = Array.isArray(dataset.rows) ? dataset.rows : null;
    if (!headers || !rows) {
      return new Response(
        JSON.stringify({ error: "Dataset format is invalid (missing headers/rows)" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const targetIndex = headers.indexOf(targetColumn);
    if (targetIndex === -1) {
      return new Response(
        JSON.stringify({ error: `Target column '${targetColumn}' not found in dataset` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const featureIndices = featureColumns.map((col) => ({ col, idx: headers.indexOf(col) })).filter((entry) => entry.idx !== -1);
    if (featureIndices.length === 0) {
      return new Response(
        JSON.stringify({ error: "None of the featureColumns were found in dataset headers" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
    const softmax = /* @__PURE__ */ __name2((logits) => {
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("ML train error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch10 = __toESM2(require_checked_fetch2());
var onRequest10 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
    });
  }
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
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
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      let messages = messagesData ? JSON.parse(messagesData) : [];
      const index = messages.findIndex((m) => m && m.id === messageId);
      if (index === -1) {
        return new Response(
          JSON.stringify({ success: false, notFound: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
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
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
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
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
        });
      }
      return new Response(
        JSON.stringify({ error: "Unsupported action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Admin moderation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch11 = __toESM2(require_checked_fetch2());
async function onRequest11(context) {
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
    const salt = crypto4.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
    const encoder = new TextEncoder();
    const data_to_hash = encoder.encode(password + saltHex);
    const hashBuffer = await crypto4.subtle.digest("SHA-256", data_to_hash);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tokenBuffer = crypto4.getRandomValues(new Uint8Array(32));
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
__name(onRequest11, "onRequest11");
__name2(onRequest11, "onRequest");
var import_checked_fetch12 = __toESM2(require_checked_fetch2());
var onRequest12 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
    });
  }
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    if (pathname === "/api/admin/users/activity" && method === "POST") {
      const { matchId = "current" } = await request.json();
      if (user.role === "admin" || user.role === "super_admin") {
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
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
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (pathname === "/api/admin/users" && method === "GET") {
      const matchId = searchParams.get("matchId") || "current";
      const activeUsersKey = `active-users:${matchId}`;
      const activeUsersData = await env.SPORTS_KV.get(activeUsersKey);
      const activeUsers = activeUsersData ? JSON.parse(activeUsersData) : [];
      return new Response(JSON.stringify({ users: activeUsers }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (pathname === "/api/admin/users" && method === "PUT") {
      const { userId, isBlocked, reason } = await request.json();
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const userEmail = await env.SPORTS_KV.get(`userId:${userId}`);
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (pathname === "/api/admin/users" && method === "DELETE") {
      const { userId } = await request.json();
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const userEmail = await env.SPORTS_KV.get(`userId:${userId}`);
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Admin users error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch13 = __toESM2(require_checked_fetch2());
var onRequest13 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env, params } = context;
  const { id } = params || {};
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
    });
  }
  if (method !== "DELETE" && method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
  try {
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Message ID required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const url = new URL(request.url);
    const matchId = url.searchParams.get("matchId") || "current";
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    if (method === "DELETE") {
      if (user.role !== "admin" && user.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
        });
      }
      await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
        expirationTtl: 604800
      });
      return new Response(JSON.stringify({ success: true, deleted: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
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
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
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
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
  } catch (error) {
    console.error("Messages delete error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch14 = __toESM2(require_checked_fetch2());
async function onRequestGet(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const teamId = searchParams.get("teamId");
    if (teamId) {
      const coachingStaff = await context.env.IPL_CACHE.get(`coaches:${teamId}`, "json");
      return new Response(JSON.stringify(coachingStaff || null), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const allTeams = await context.env.IPL_CACHE.get("teams", "json") || [];
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
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function onRequestPost(context) {
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
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
var import_checked_fetch15 = __toESM2(require_checked_fetch2());
async function onRequestGet2(context) {
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
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
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
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
var import_checked_fetch16 = __toESM2(require_checked_fetch2());
var onRequest14 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const action = url.searchParams.get("action") || "delete";
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
    });
  }
  try {
    if (method === "DELETE" && action === "delete") {
      const authHeader = request.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer", "").trim();
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      if (!env || !env.SPORTS_KV) {
        return new Response(
          JSON.stringify({ error: "KV not configured" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
            ...corsHeaders2
          }
        }
      );
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Account error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch17 = __toESM2(require_checked_fetch2());
var onRequest15 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  try {
    const adminToken = request.headers.get("X-Admin-Token");
    if (!adminToken || adminToken !== env.ADMIN_EMAIL_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (url.pathname.includes("/dashboard/stats")) {
      return await getDashboardStats(env, corsHeaders2);
    }
    if (url.pathname.includes("/dashboard/segments")) {
      return await getSegmentStats(env, corsHeaders2);
    }
    if (url.pathname.includes("/dashboard/campaigns")) {
      if (method === "GET") {
        return await getCampaigns(env, corsHeaders2);
      } else if (method === "POST") {
        const body = await request.json();
        return await createCampaign(body, env, corsHeaders2);
      }
    }
    if (url.pathname.includes("/dashboard/templates")) {
      return await getEmailTemplates(env, corsHeaders2);
    }
    if (url.pathname.includes("/dashboard/ab-test")) {
      if (method === "POST") {
        const body = await request.json();
        return await createABTest(body, env, corsHeaders2);
      }
    }
    if (url.pathname.includes("/dashboard/users")) {
      if (method === "GET") {
        const searchParam = url.searchParams.get("search");
        return await searchUsers(searchParam, env, corsHeaders2);
      }
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
async function getDashboardStats(env, corsHeaders2) {
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get stats" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(getDashboardStats, "getDashboardStats");
__name2(getDashboardStats, "getDashboardStats");
async function getSegmentStats(env, corsHeaders2) {
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Get segment stats error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get segment stats" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(getSegmentStats, "getSegmentStats");
__name2(getSegmentStats, "getSegmentStats");
async function getCampaigns(env, corsHeaders2) {
  try {
    const campaigns = [];
    return new Response(
      JSON.stringify({ campaigns }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Get campaigns error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get campaigns" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(getCampaigns, "getCampaigns");
__name2(getCampaigns, "getCampaigns");
async function createCampaign(body, env, corsHeaders2) {
  try {
    const { name, subject, template, targetSegments, schedule } = body;
    if (!name || !subject || !template) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Create campaign error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create campaign" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(createCampaign, "createCampaign");
__name2(createCampaign, "createCampaign");
async function getEmailTemplates(env, corsHeaders2) {
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Get templates error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get templates" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(getEmailTemplates, "getEmailTemplates");
__name2(getEmailTemplates, "getEmailTemplates");
async function createABTest(body, env, corsHeaders2) {
  try {
    const { name, campaign, variants, trafficSplit, duration } = body;
    if (!name || !campaign || !Array.isArray(variants) || variants.length < 2) {
      return new Response(
        JSON.stringify({ error: "Need at least 2 variants" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Create A/B test error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create A/B test" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(createABTest, "createABTest");
__name2(createABTest, "createABTest");
async function searchUsers(query, env, corsHeaders2) {
  try {
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Search query required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const results = [];
    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Search users error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to search users" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(searchUsers, "searchUsers");
__name2(searchUsers, "searchUsers");
var import_checked_fetch18 = __toESM2(require_checked_fetch2());
var encryptPassword2 = /* @__PURE__ */ __name2((password, salt) => {
  const hash = crypto5.createHash("sha256");
  hash.update(password + salt);
  return hash.digest("hex");
}, "encryptPassword");
var generateSalt2 = /* @__PURE__ */ __name2(() => crypto5.randomBytes(16).toString("hex"), "generateSalt");
var generateToken2 = /* @__PURE__ */ __name2(() => crypto5.randomBytes(32).toString("hex"), "generateToken");
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
var onRequest16 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
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
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
              { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
            );
          }
        } catch (e) {
          console.error("Turnstile verification error:", e);
          return new Response(
            JSON.stringify({ error: "Unable to verify human check. Please try again." }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
          );
        }
      } else if (secretKey && !turnstileToken) {
        return new Response(
          JSON.stringify({ error: "Human verification is required to create an account." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const normalizedPassword = String(password).trim();
      if (normalizedPassword.length < 12) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 12 characters long" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      if (COMMON_PASSWORDS2.has(normalizedPassword.toLowerCase())) {
        return new Response(
          JSON.stringify({ error: "Password is too common. Please choose a stronger password." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const existingUser = await env.SPORTS_KV.get(`user:${email}`);
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "User already exists" }),
          { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const salt = generateSalt2();
      const hashedPassword = encryptPassword2(normalizedPassword, salt);
      const userId = crypto5.randomUUID();
      const token = generateToken2();
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
            ...corsHeaders2
          }
        }
      );
    }
    if (action === "signin" && method === "POST") {
      const { email, password } = body;
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Missing email or password" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const user = JSON.parse(userData);
      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: "Your account has been blocked" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const hashedPassword = encryptPassword2(password, user.salt);
      if (hashedPassword !== user.hashedPassword) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const newToken = generateToken2();
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
            ...corsHeaders2
          }
        }
      );
    }
    if (action === "verify" && method === "GET") {
      const token = searchParams.get("token");
      if (!token) {
        return new Response(
          JSON.stringify({ error: "No token provided" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const user = JSON.parse(userData);
      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: "Account blocked" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
            ...corsHeaders2
          }
        }
      );
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch19 = __toESM2(require_checked_fetch2());
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
__name2(getBody, "getBody");
function verifyAdminToken(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken, "verifyAdminToken");
__name2(verifyAdminToken, "verifyAdminToken");
var kv = globalThis.IPL_CACHE;
var KV_KEY = "ipl:content";
var onRequest17 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const kvNamespace = env.IPL_CACHE || kv;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders2
    });
  }
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const type = url.searchParams.get("type");
      const cached = await kvNamespace.get(KV_KEY);
      let content = cached ? JSON.parse(cached) : [];
      if (type) {
        content = content.filter((c) => c.type === type);
      }
      return new Response(JSON.stringify(content), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    if (request.method === "POST") {
      if (!verifyAdminToken(request)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders2
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
              ...corsHeaders2
            }
          }
        );
      }
      const existing = await kvNamespace.get(KV_KEY);
      const content = existing ? JSON.parse(existing) : [];
      const newContent = {
        ...body,
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
            ...corsHeaders2
          }
        }
      );
    }
    if (request.method === "PUT") {
      if (!verifyAdminToken(request)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders2
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
              ...corsHeaders2
            }
          }
        );
      }
      const existing = await kvNamespace.get(KV_KEY);
      const content = existing ? JSON.parse(existing) : [];
      const updated = content.map(
        (c) => c.id === body.id ? { ...c, ...body, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : c
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
            ...corsHeaders2
          }
        }
      );
    }
    if (request.method === "DELETE") {
      if (!verifyAdminToken(request)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders2
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
              ...corsHeaders2
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
            ...corsHeaders2
          }
        }
      );
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
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
          ...corsHeaders2
        }
      }
    );
  }
}, "onRequest");
var import_checked_fetch20 = __toESM2(require_checked_fetch2());
async function onRequest18(context) {
  const { request, env } = context;
  const method = request.method || "GET";
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
  const apiKey = env.RAPIDAPI_CRICBUZZ_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "Cricbuzz RapidAPI key is not configured on the server."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  const commonHeaders = {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com"
  };
  async function fetchMatches(path) {
    const upstreamUrl = `https://cricbuzz-cricket.p.rapidapi.com${path}`;
    const res = await fetch(upstreamUrl, {
      headers: commonHeaders,
      cf: {
        cacheTtl: 20,
        cacheEverything: true
      }
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Failed to fetch ${path}: ${res.status} ${text.slice(0, 300)}`);
    }
    return res.json();
  }
  __name(fetchMatches, "fetchMatches");
  __name2(fetchMatches, "fetchMatches");
  function normaliseMatches(json) {
    const results = [];
    const typeMatches = Array.isArray(json?.typeMatches) ? json.typeMatches : [];
    for (const typeBlock of typeMatches) {
      const matchTypeLabel = typeBlock?.matchType || "";
      const seriesMatches = Array.isArray(typeBlock?.seriesMatches) ? typeBlock.seriesMatches : [];
      for (const seriesMatch of seriesMatches) {
        const wrapper = seriesMatch?.seriesAdWrapper || seriesMatch;
        const seriesName = wrapper?.seriesName || "";
        const games = Array.isArray(wrapper?.matches) ? wrapper.matches : [];
        for (const game of games) {
          let formatTeamScore2 = /* @__PURE__ */ __name(function(teamScore) {
            if (!teamScore || typeof teamScore !== "object") return "";
            const anyScore = teamScore;
            let inngs = anyScore.inngs1 || anyScore.innings1 || null;
            if (!inngs) {
              const keys = Object.keys(anyScore);
              if (keys.length > 0 && typeof anyScore[keys[0]] === "object") {
                inngs = anyScore[keys[0]];
              }
            }
            if (!inngs) return "";
            const runs = inngs.runs ?? inngs.runsScored;
            const wickets = inngs.wickets ?? inngs.wkts;
            const overs = inngs.overs ?? inngs.oversBowled;
            let s = "";
            if (typeof runs === "number") s += String(runs);
            if (typeof wickets === "number") {
              s += s ? `/${wickets}` : String(wickets);
            }
            if (overs !== void 0 && overs !== null) {
              s += s ? ` (${overs})` : String(overs);
            }
            return s;
          }, "formatTeamScore2");
          var formatTeamScore = formatTeamScore2;
          __name2(formatTeamScore2, "formatTeamScore");
          const info = game?.matchInfo || {};
          const score = game?.matchScore || {};
          const matchId = info?.matchId !== void 0 && info?.matchId !== null ? String(info.matchId) : null;
          if (!matchId) continue;
          const team1 = info?.team1 || {};
          const team2 = info?.team2 || {};
          const team1Short = team1.teamSName || team1.teamName || "";
          const team2Short = team2.teamSName || team2.teamName || "";
          const teams = [];
          if (team1Short) teams.push(team1Short);
          if (team2Short) teams.push(team2Short);
          const teamInfo = [
            {
              name: team1.teamName || void 0,
              shortname: team1.teamSName || void 0
            },
            {
              name: team2.teamName || void 0,
              shortname: team2.teamSName || void 0
            }
          ];
          const venueInfo = info?.venueInfo || {};
          const venueParts = [];
          if (venueInfo.ground) venueParts.push(venueInfo.ground);
          if (venueInfo.city) venueParts.push(venueInfo.city);
          if (venueInfo.country) venueParts.push(venueInfo.country);
          const venue = venueParts.join(", ");
          let dateTimeGMT = "";
          const rawStart = info?.startDate;
          const startMs = rawStart !== void 0 && rawStart !== null ? Number(rawStart) : NaN;
          if (!Number.isNaN(startMs) && startMs > 0) {
            dateTimeGMT = new Date(startMs).toISOString();
          }
          const status = info?.status || "";
          const matchFormat = info?.matchFormat || info?.matchType || "";
          const team1ScoreStr = formatTeamScore2(score?.team1Score);
          const team2ScoreStr = formatTeamScore2(score?.team2Score);
          let scoreStr = "";
          if (team1Short && team1ScoreStr) {
            scoreStr += `${team1Short} ${team1ScoreStr}`;
          }
          if (team2Short && team2ScoreStr) {
            scoreStr += scoreStr ? " vs " : "";
            scoreStr += `${team2Short} ${team2ScoreStr}`;
          }
          let name = "";
          if (team1Short && team2Short) {
            name = `${team1Short} vs ${team2Short}`;
          } else if (info?.matchDesc) {
            name = info.matchDesc;
          } else if (seriesName) {
            name = seriesName;
          } else {
            name = "Cricket match";
          }
          results.push({
            id: matchId,
            name,
            status,
            score: scoreStr,
            teams,
            teamInfo,
            venue,
            dateTimeGMT,
            matchType: matchFormat || matchTypeLabel,
            team1ScoreText: team1ScoreStr || "",
            team2ScoreText: team2ScoreStr || "",
            seriesName
          });
        }
      }
    }
    return results;
  }
  __name(normaliseMatches, "normaliseMatches");
  __name2(normaliseMatches, "normaliseMatches");
  try {
    const [liveJson, upcomingJson, recentJson] = await Promise.all([
      fetchMatches("/matches/v1/live"),
      fetchMatches("/matches/v1/upcoming"),
      fetchMatches("/matches/v1/recent")
    ]);
    const allMatches = [
      ...normaliseMatches(liveJson),
      ...normaliseMatches(upcomingJson),
      ...normaliseMatches(recentJson)
    ];
    const seen = /* @__PURE__ */ new Set();
    const deduped = [];
    for (const m of allMatches) {
      if (!m.id || seen.has(m.id)) continue;
      seen.add(m.id);
      deduped.push(m);
    }
    const responseBody = {
      status: "success",
      provider: "cricbuzz",
      source: "matches-v1",
      count: deduped.length,
      matches: deduped
    };
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    console.error("Error calling Cricbuzz RapidAPI matches endpoints:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error calling Cricbuzz RapidAPI matches endpoints" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(onRequest18, "onRequest18");
__name2(onRequest18, "onRequest");
var import_checked_fetch21 = __toESM2(require_checked_fetch2());
async function onRequest19(context) {
  const { request, env } = context;
  const method = request.method || "GET";
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
  const apiKey = env.RAPIDAPI_CRICBUZZ_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Cricbuzz RapidAPI key is not configured on the server." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  const url = new URL(request.url);
  const matchId = url.searchParams.get("matchId");
  if (!matchId) {
    return new Response(JSON.stringify({ error: "matchId query parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const upstreamUrl = `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${encodeURIComponent(
    matchId
  )}/hscard`;
  try {
    const res = await fetch(upstreamUrl, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com"
      },
      cf: {
        cacheTtl: 10,
        cacheEverything: true
      }
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error: "Failed to fetch scorecard from Cricbuzz RapidAPI",
          status: res.status,
          body: text.slice(0, 500)
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const json = await res.json();
    return new Response(
      JSON.stringify({
        status: "success",
        scorecard: json
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  } catch (error) {
    console.error("Error calling Cricbuzz RapidAPI hscard endpoint:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error calling Cricbuzz RapidAPI hscard endpoint" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(onRequest19, "onRequest19");
__name2(onRequest19, "onRequest");
var import_checked_fetch222 = __toESM2(require_checked_fetch2());
async function onRequest20(context) {
  const { request, env } = context;
  const method = request.method || "GET";
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
  const apiKey = env.CRICKETDATA_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "CricketData API key is not configured on the server."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  const upstreamUrl = `https://api.cricapi.com/v1/cricScore?apikey=${encodeURIComponent(apiKey)}`;
  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      // Lightweight caching on the edge to avoid hammering CricketData
      cf: {
        cacheTtl: 20,
        cacheEverything: true
      }
    });
    if (!upstreamResponse.ok) {
      const text = await upstreamResponse.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error: "Failed to fetch scores from CricketData",
          status: upstreamResponse.status,
          body: text?.slice(0, 500)
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const json = await upstreamResponse.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    const simplified = data.map((item) => {
      const id = item.id || item.unique_id || item.matchId || item.key || null;
      const name = item.name || item.matchType || "";
      const status = item.status || item.ms || item.state || "";
      const score = item.score || "";
      const teams = Array.isArray(item.teams) ? item.teams : [];
      const teamInfo = Array.isArray(item.teamInfo) ? item.teamInfo : [];
      const venue = item.venue || item.venueInfo || "";
      const dateTimeGMT = item.dateTimeGMT || item.dateTime || "";
      const matchType = item.matchType || item.type || "";
      return {
        id,
        name,
        status,
        score,
        teams,
        teamInfo,
        venue,
        dateTimeGMT,
        matchType
      };
    });
    const responseBody = {
      status: json?.status || "success",
      provider: "cricketdata.org",
      source: "cricScore",
      count: simplified.length,
      matches: simplified
    };
    const response = new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
    return response;
  } catch (error) {
    console.error("Error calling CricketData API:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error calling CricketData API" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(onRequest20, "onRequest20");
__name2(onRequest20, "onRequest");
var import_checked_fetch23 = __toESM2(require_checked_fetch2());
var onRequest21 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  try {
    if (url.pathname.includes("/webhooks/")) {
      return await handleWebhook(request, env, corsHeaders2);
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      return await getAnalytics(email, range, env, corsHeaders2);
    }
    if (method === "POST") {
      const body = await request.json();
      return await recordEvent(email, body, env, corsHeaders2);
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Email analytics error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
async function handleWebhook(request, env, corsHeaders2) {
  try {
    const body = await request.json();
    const event = detectProvider(body);
    if (!event) {
      return new Response(
        JSON.stringify({ error: "Unknown provider" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    await storeAnalyticsEvent(event, env);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process webhook" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(handleWebhook, "handleWebhook");
__name2(handleWebhook, "handleWebhook");
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
__name2(detectProvider, "detectProvider");
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
__name2(normalizeElasticEmailEvent, "normalizeElasticEmailEvent");
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
__name2(storeAnalyticsEvent, "storeAnalyticsEvent");
async function getAnalytics(email, rangeParam, env, corsHeaders2) {
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Get analytics error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get analytics" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(getAnalytics, "getAnalytics");
__name2(getAnalytics, "getAnalytics");
async function recordEvent(email, body, env, corsHeaders2) {
  try {
    const { eventType, matchId, action, metadata } = body;
    if (!eventType) {
      return new Response(
        JSON.stringify({ error: "eventType required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Record event error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to record event" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(recordEvent, "recordEvent");
__name2(recordEvent, "recordEvent");
var import_checked_fetch24 = __toESM2(require_checked_fetch2());
var onRequest22 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const { pathname } = new URL(request.url);
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  try {
    if (pathname.includes("/api/email-preferences/unsubscribe/")) {
      const token = pathname.split("/").pop();
      return await handleUnsubscribe(token, env, corsHeaders2);
    }
    const authHeader = request.headers.get("Authorization") || "";
    const authToken = authHeader.replace("Bearer", "").trim();
    if (!authToken) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${authToken}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      return await getEmailPreferences(email, env, corsHeaders2);
    }
    if (method === "PUT") {
      const body = await request.json();
      return await updateEmailPreferences(email, body, env, corsHeaders2);
    }
    if (method === "DELETE") {
      const body = await request.json();
      return await deletePreference(email, body, env, corsHeaders2);
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Email preferences error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
async function handleUnsubscribe(token, env, corsHeaders2) {
  try {
    const unsubscribeData = await env.SPORTS_KV.get(`unsubscribe-token:${token}`);
    if (!unsubscribeData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired unsubscribe link" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const { email, category } = JSON.parse(unsubscribeData);
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process unsubscribe" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(handleUnsubscribe, "handleUnsubscribe");
__name2(handleUnsubscribe, "handleUnsubscribe");
async function getEmailPreferences(email, env, corsHeaders2) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Get preferences error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get preferences" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(getEmailPreferences, "getEmailPreferences");
__name2(getEmailPreferences, "getEmailPreferences");
async function updateEmailPreferences(email, body, env, corsHeaders2) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Update preferences error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update preferences" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(updateEmailPreferences, "updateEmailPreferences");
__name2(updateEmailPreferences, "updateEmailPreferences");
async function deletePreference(email, body, env, corsHeaders2) {
  try {
    const { category } = body;
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Delete preference error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete preference" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(deletePreference, "deletePreference");
__name2(deletePreference, "deletePreference");
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
__name2(getDefaultPreferences, "getDefaultPreferences");
var import_checked_fetch25 = __toESM2(require_checked_fetch2());
var onRequest23 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  try {
    if (url.pathname.includes("/admin/")) {
      return await handleAdminRequest(request, env, method, corsHeaders2);
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      return await getQueueStatus(email, env, corsHeaders2);
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Email queue error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
async function handleAdminRequest(request, env, method, corsHeaders2) {
  try {
    const adminToken = request.headers.get("X-Admin-Token");
    if (adminToken !== env.ADMIN_EMAIL_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Invalid admin token" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const url = new URL(request.url);
    if (url.pathname.includes("/admin/queue")) {
      if (method === "GET") {
        return await getFullQueue(env, corsHeaders2);
      } else if (method === "POST") {
        return await processQueue(env, corsHeaders2);
      }
    }
    if (url.pathname.includes("/admin/retry")) {
      if (method === "POST") {
        const body = await request.json();
        return await retryEmail(body.queueId, env, corsHeaders2);
      }
    }
    if (url.pathname.includes("/admin/stats")) {
      return await getQueueStats(env, corsHeaders2);
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Admin request error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process admin request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(handleAdminRequest, "handleAdminRequest");
__name2(handleAdminRequest, "handleAdminRequest");
async function getQueueStatus(email, env, corsHeaders2) {
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Get queue status error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get queue status" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(getQueueStatus, "getQueueStatus");
__name2(getQueueStatus, "getQueueStatus");
async function getFullQueue(env, corsHeaders2) {
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Get full queue error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get queue" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(getFullQueue, "getFullQueue");
__name2(getFullQueue, "getFullQueue");
async function processQueue(env, corsHeaders2) {
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Process queue error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process queue" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(processQueue, "processQueue");
__name2(processQueue, "processQueue");
async function retryEmail(queueId, env, corsHeaders2) {
  try {
    const emailData = await env.SPORTS_KV.get(`queued-email:${queueId}`);
    if (!emailData) {
      return new Response(
        JSON.stringify({ error: "Email not found in queue" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Retry email error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to retry email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(retryEmail, "retryEmail");
__name2(retryEmail, "retryEmail");
async function getQueueStats(env, corsHeaders2) {
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Get queue stats error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get stats" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(getQueueStats, "getQueueStats");
__name2(getQueueStats, "getQueueStats");
var import_checked_fetch26 = __toESM2(require_checked_fetch2());
var onRequest24 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      return await getUserSegment(email, env, corsHeaders2);
    }
    if (method === "POST" && url.pathname.includes("/track")) {
      const body = await request.json();
      return await trackEngagement(email, body, env, corsHeaders2);
    }
    if (method === "GET" && url.pathname.includes("/personalization")) {
      return await getPersonalization(email, env, corsHeaders2);
    }
    if (method === "PUT") {
      const body = await request.json();
      return await updateEngagementHistory(email, body, env, corsHeaders2);
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("User segmentation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
async function getUserSegment(email, env, corsHeaders2) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Get user segment error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get segment" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(getUserSegment, "getUserSegment");
__name2(getUserSegment, "getUserSegment");
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
__name2(calculateSegment, "calculateSegment");
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
__name2(getSegmentRecommendations, "getSegmentRecommendations");
async function trackEngagement(email, body, env, corsHeaders2) {
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Track engagement error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to track engagement" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(trackEngagement, "trackEngagement");
__name2(trackEngagement, "trackEngagement");
async function getPersonalization(email, env, corsHeaders2) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Get personalization error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get personalization" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(getPersonalization, "getPersonalization");
__name2(getPersonalization, "getPersonalization");
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
    "10": { name: "CSK", color: "#FFFF00" }
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
__name2(getRecommendedTeams, "getRecommendedTeams");
async function updateEngagementHistory(email, body, env, corsHeaders2) {
  try {
    const { events } = body;
    if (!Array.isArray(events)) {
      return new Response(
        JSON.stringify({ error: "events must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Update engagement error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update engagement" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(updateEngagementHistory, "updateEngagementHistory");
__name2(updateEngagementHistory, "updateEngagementHistory");
var import_checked_fetch27 = __toESM2(require_checked_fetch2());
var onRequest25 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  if (method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
  try {
    const body = await request.json();
    const { action } = body;
    if (action === "send-match-reminder") {
      return await sendMatchReminder(body, env, corsHeaders2);
    } else if (action === "send-email") {
      return await sendEmail(body, env, corsHeaders2);
    } else if (action === "send-batch") {
      return await sendBatchEmails(body, env, corsHeaders2);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
  } catch (error) {
    console.error("Email service error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
async function sendMatchReminder(body, env, corsHeaders2) {
  try {
    const { email, matchId, team1, team2, venue, time, date } = body;
    if (!email || !matchId || !team1 || !team2) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    if (!user.termsAccepted || !user.emailNotificationsEnabled) {
      return new Response(
        JSON.stringify({ error: "User has not opted in for notifications" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
    const emailResult = await sendEmailViaProvider(
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
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    } else {
      throw new Error(`Email provider error: ${emailResult.error}`);
    }
  } catch (error) {
    console.error("Send match reminder error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(sendMatchReminder, "sendMatchReminder");
__name2(sendMatchReminder, "sendMatchReminder");
async function sendEmail(body, env, corsHeaders2) {
  try {
    const { to, subject, html } = body;
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (to, subject, html)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const emailResult = await sendEmailViaProvider(
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
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    } else {
      throw new Error(`Email provider error: ${emailResult.error}`);
    }
  } catch (error) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(sendEmail, "sendEmail");
__name2(sendEmail, "sendEmail");
async function sendEmailViaProvider(emailData, env) {
  if (env.RESEND_API_KEY) {
    return await sendViaResend(emailData, env.RESEND_API_KEY);
  }
  if (env.ELASTIC_EMAIL_API_KEY) {
    return await sendViaElasticEmail(emailData, env.ELASTIC_EMAIL_API_KEY);
  }
  if (env.SENDGRID_API_KEY) {
    return await sendViaSendGrid(emailData, env.SENDGRID_API_KEY);
  }
  if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    return await sendViaMailgun(emailData, env.MAILGUN_API_KEY, env.MAILGUN_DOMAIN);
  }
  console.log("No email service configured. Email data:", emailData);
  return { success: true, messageId: "local-" + Date.now() };
}
__name(sendEmailViaProvider, "sendEmailViaProvider");
__name2(sendEmailViaProvider, "sendEmailViaProvider");
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
__name(sendViaResend, "sendViaResend");
__name2(sendViaResend, "sendViaResend");
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
__name(sendViaElasticEmail, "sendViaElasticEmail");
__name2(sendViaElasticEmail, "sendViaElasticEmail");
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
__name2(sendViaSendGrid, "sendViaSendGrid");
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
__name2(sendViaMailgun, "sendViaMailgun");
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
__name2(generateMatchReminderHTML, "generateMatchReminderHTML");
async function sendBatchEmails(body, env, corsHeaders2) {
  try {
    const { emails } = body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "emails must be a non-empty array" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Send batch error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send batch" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}
__name(sendBatchEmails, "sendBatchEmails");
__name2(sendBatchEmails, "sendBatchEmails");
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
    const emailResult = await sendEmailViaProvider(
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
__name2(sendPersonalizedEmail, "sendPersonalizedEmail");
var import_checked_fetch28 = __toESM2(require_checked_fetch2());
async function onRequest26(context) {
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
__name(onRequest26, "onRequest26");
__name2(onRequest26, "onRequest");
var import_checked_fetch29 = __toESM2(require_checked_fetch2());
var onRequest27 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
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
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const stored = await env.SPORTS_KV.get(key, "json");
      return new Response(
        JSON.stringify({ page, content: stored?.content || null, updatedAt: stored?.updatedAt || null }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (method === "PUT") {
      if (!env || !env.SPORTS_KV) {
        return new Response(
          JSON.stringify({ error: "KV not configured" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const user = JSON.parse(userData);
      if (user.role !== "admin" && user.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Legal API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch30 = __toESM2(require_checked_fetch2());
var onRequest28 = /* @__PURE__ */ __name2(async (context) => {
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
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
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
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
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
var import_checked_fetch31 = __toESM2(require_checked_fetch2());
var mockTeams = [
  {
    id: "1",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    logo: "/logos/rcb_logo_new.svg",
    colors: { primary: "#EC1C24", secondary: "#000000" }
  },
  {
    id: "2",
    name: "Mumbai Indians",
    shortName: "MI",
    logo: "/logos/mi_logo_new.svg",
    colors: { primary: "#004BA0", secondary: "#FFFFFF" }
  },
  {
    id: "3",
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    logo: "/logos/srh_logo_new.svg",
    colors: { primary: "#FF822A", secondary: "#000000" }
  },
  {
    id: "4",
    name: "Gujarat Titans",
    shortName: "GT",
    logo: "/logos/gt_logo_new.svg",
    colors: { primary: "#1B2130", secondary: "#E15454" }
  },
  {
    id: "5",
    name: "Punjab Kings",
    shortName: "PBKS",
    logo: "/logos/kxip_logo_new.svg",
    colors: { primary: "#ED1D24", secondary: "#FBDD0B" }
  },
  {
    id: "6",
    name: "Delhi Capitals",
    shortName: "DC",
    logo: "/logos/dc_logo_new.svg",
    colors: { primary: "#0078BC", secondary: "#EF1B26" }
  },
  {
    id: "7",
    name: "Lucknow Super Giants",
    shortName: "LSG",
    logo: "/logos/lsg_logo_new.svg",
    colors: { primary: "#9C2A2C", secondary: "#F7E17D" }
  },
  {
    id: "8",
    name: "Rajasthan Royals",
    shortName: "RR",
    logo: "/logos/rr_logo_new.svg",
    colors: { primary: "#EA1A85", secondary: "#004B8D" }
  },
  {
    id: "9",
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    logo: "/logos/kkr_logo_new.svg",
    colors: { primary: "#3A225D", secondary: "#B9975B" }
  },
  {
    id: "10",
    name: "Chennai Super Kings",
    shortName: "CSK",
    logo: "/logos/csk_logo_new.svg",
    colors: { primary: "#FFFF00", secondary: "#0081E8" }
  }
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
function verifyAdminToken2(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken2, "verifyAdminToken2");
__name2(verifyAdminToken2, "verifyAdminToken");
function getTeamById(teamId) {
  return mockTeams.find((t) => t.id === teamId);
}
__name(getTeamById, "getTeamById");
__name2(getTeamById, "getTeamById");
function formatMatch(match2) {
  const team1 = getTeamById(match2.team1Id);
  const team2 = getTeamById(match2.team2Id);
  return {
    id: match2.id,
    date: match2.date,
    time: match2.time,
    venue: match2.venue,
    team1: team1 || { id: match2.team1Id, shortName: "Unknown" },
    team2: team2 || { id: match2.team2Id, shortName: "Unknown" },
    status: match2.status
  };
}
__name(formatMatch, "formatMatch");
__name2(formatMatch, "formatMatch");
async function handleGetRequest(context) {
  const { env } = context;
  try {
    let matches = await env.IPL_CACHE.get("matches", "json");
    if (!matches) {
      matches = defaultMatches;
    }
    const formattedMatches = matches.map(formatMatch);
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
__name2(handleGetRequest, "handleGetRequest");
async function handlePostRequest(context) {
  const { env, request } = context;
  if (!verifyAdminToken2(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { date, time, venue, team1Id, team2Id, status } = body;
    if (!date || !time || !venue || !team1Id || !team2Id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let matches = await env.IPL_CACHE.get("matches", "json") || defaultMatches;
    const newId = String(Math.max(...matches.map((m) => parseInt(m.id) || 0), 0) + 1);
    const newMatch = {
      id: newId,
      date,
      time,
      venue,
      team1Id,
      team2Id,
      status: status || "upcoming"
    };
    matches.push(newMatch);
    await env.IPL_CACHE.put("matches", JSON.stringify(matches));
    return new Response(JSON.stringify(formatMatch(newMatch)), {
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
__name2(handlePostRequest, "handlePostRequest");
async function handlePutRequest(context) {
  const { env, request } = context;
  if (!verifyAdminToken2(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { id, date, time, venue, team1Id, team2Id, status } = body;
    if (!id) {
      return new Response(JSON.stringify({ error: "Match ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let matches = await env.IPL_CACHE.get("matches", "json") || defaultMatches;
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
      ...status && { status }
    };
    matches[matchIndex] = updatedMatch;
    await env.IPL_CACHE.put("matches", JSON.stringify(matches));
    return new Response(JSON.stringify(formatMatch(updatedMatch)), {
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
__name2(handlePutRequest, "handlePutRequest");
async function handleDeleteRequest(context) {
  const { env, request } = context;
  if (!verifyAdminToken2(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const url = new URL(request.url);
    const matchId = url.searchParams.get("id");
    if (!matchId) {
      return new Response(JSON.stringify({ error: "Match ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let matches = await env.IPL_CACHE.get("matches", "json") || defaultMatches;
    const filteredMatches = matches.filter((m) => m.id !== matchId);
    if (filteredMatches.length === matches.length) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    await env.IPL_CACHE.put("matches", JSON.stringify(filteredMatches));
    return new Response(JSON.stringify({ success: true, message: "Match deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting match:", error);
    return new Response(JSON.stringify({ error: "Failed to delete match" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleDeleteRequest, "handleDeleteRequest");
__name2(handleDeleteRequest, "handleDeleteRequest");
async function onRequest29(context) {
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
__name(onRequest29, "onRequest29");
__name2(onRequest29, "onRequest");
var import_checked_fetch322 = __toESM2(require_checked_fetch2());
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
__name2(getModerationFlagsForText, "getModerationFlagsForText");
var onRequest30 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
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
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
        });
      }
      let messages = JSON.parse(messagesData);
      messages = messages.slice(
        Math.max(0, messages.length - offset - limit),
        messages.length - offset
      );
      return new Response(JSON.stringify(messages), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (pathname === "/api/messages" && method === "POST") {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const { matchId = "current", text } = await request.json();
      if (!text || text.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Message cannot be empty" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      if (text.length > 500) {
        return new Response(
          JSON.stringify({ error: "Message too long (max 500 chars)" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (pathname.startsWith("/api/messages/") && method === "DELETE") {
      const messageId = pathname.split("/").pop();
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Messages error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch33 = __toESM2(require_checked_fetch2());
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
var defaultMatches2 = [
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
__name2(getMatchStartDate, "getMatchStartDate");
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
__name2(getTeamMeta, "getTeamMeta");
var onRequest31 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  if (method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV || !env.IPL_CACHE) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    const favoriteTeamIds = Array.isArray(user.favoriteTeamIds) ? user.favoriteTeamIds.map((v) => String(v)) : [];
    if (favoriteTeamIds.length === 0) {
      return new Response(
        JSON.stringify({ notifications: [], windowHours: 48 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    let matches = await env.IPL_CACHE.get("matches", "json");
    if (!Array.isArray(matches)) {
      matches = defaultMatches2;
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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Notifications error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch34 = __toESM2(require_checked_fetch2());
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function verifyAdminToken3(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken3, "verifyAdminToken3");
__name2(verifyAdminToken3, "verifyAdminToken");
var onRequest32 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    if (request.method === "GET") {
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      return new Response(JSON.stringify(players), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (request.method === "POST") {
      if (!verifyAdminToken3(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const newPlayer = await request.json();
      if (!newPlayer.name || !newPlayer.role || !newPlayer.teamId) {
        return new Response(JSON.stringify({ error: "Missing required fields: name, role, teamId" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      const newId = (players.length + 1).toString();
      const playerToAdd = {
        id: newId,
        name: newPlayer.name,
        role: newPlayer.role,
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
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (request.method === "PUT") {
      if (!verifyAdminToken3(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const updatedPlayer = await request.json();
      if (!updatedPlayer.id) {
        return new Response(JSON.stringify({ error: "Player ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      const index = players.findIndex((p) => p.id === updatedPlayer.id);
      if (index === -1) {
        return new Response(JSON.stringify({ error: "Player not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      players[index] = {
        id: updatedPlayer.id,
        name: updatedPlayer.name,
        role: updatedPlayer.role,
        teamId: updatedPlayer.teamId,
        age: parseInt(updatedPlayer.age) || 0,
        dateOfBirth: updatedPlayer.dateOfBirth || void 0,
        nationality: updatedPlayer.nationality || "",
        jerseyNumber: parseInt(updatedPlayer.jerseyNumber) || 0,
        isCaptain: updatedPlayer.isCaptain || false,
        bowlingStyle: updatedPlayer.bowlingStyle || "N/A (Batsman)",
        battingStyle: updatedPlayer.battingStyle || "Right-handed bat",
        stats: {
          matches: parseInt(updatedPlayer.stats?.matches) || 0,
          runs: parseInt(updatedPlayer.stats?.runs) || 0,
          wickets: parseInt(updatedPlayer.stats?.wickets) || 0,
          average: parseFloat(updatedPlayer.stats?.average) || 0,
          bowlingAverage: parseFloat(updatedPlayer.stats?.bowlingAverage) || 0,
          strikeRate: parseFloat(updatedPlayer.stats?.strikeRate) || 0,
          economy: parseFloat(updatedPlayer.stats?.economy) || 0,
          highest: parseInt(updatedPlayer.stats?.highest) || 0,
          fours: parseInt(updatedPlayer.stats?.fours) || 0,
          sixes: parseInt(updatedPlayer.stats?.sixes) || 0,
          fifties: parseInt(updatedPlayer.stats?.fifties) || 0,
          hundreds: parseInt(updatedPlayer.stats?.hundreds) || 0,
          bestBowling: updatedPlayer.stats?.bestBowling || "-"
        }
      };
      await env.IPL_CACHE.put("players", JSON.stringify(players));
      return new Response(JSON.stringify(players[index]), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (request.method === "DELETE") {
      if (!verifyAdminToken3(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const url = new URL(request.url);
      const playerId = url.searchParams.get("id");
      if (!playerId) {
        return new Response(JSON.stringify({ error: "Player ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      const filteredPlayers = players.filter((p) => p.id !== playerId);
      if (filteredPlayers.length === players.length) {
        return new Response(JSON.stringify({ error: "Player not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      await env.IPL_CACHE.put("players", JSON.stringify(filteredPlayers));
      return new Response(JSON.stringify({ success: true, message: "Player deleted" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
}, "onRequest");
var import_checked_fetch35 = __toESM2(require_checked_fetch2());
var onRequest33 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Preferences error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
__name2(addUserToIndex, "addUserToIndex");
var import_checked_fetch36 = __toESM2(require_checked_fetch2());
var onRequest34 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders2
    });
  }
  if (method !== "GET" && method !== "PUT") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
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
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
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
      headers: { "Content-Type": "application/json", ...corsHeaders2 }
    });
  } catch (error) {
    console.error("Profile error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch37 = __toESM2(require_checked_fetch2());
var onRequest35 = /* @__PURE__ */ __name2(async (context) => {
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
    const mockTeams3 = [
      {
        id: "1",
        name: "Royal Challengers Bengaluru",
        shortName: "RCB",
        logo: "/logos/rcb_logo_new.svg",
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
        colors: { primary: "#FFFF00", secondary: "#0081E8" }
      }
    ];
    const mockPlayers = [
      {
        id: "1",
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
    const existingTeams = await env.IPL_CACHE.get("teams", "json");
    if (existingTeams && existingTeams.length > 0) {
      return new Response(JSON.stringify({
        message: "Teams data already exists",
        teamsCount: existingTeams.length
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    await env.IPL_CACHE.put("teams", JSON.stringify(mockTeams3));
    const existingPlayers = await env.IPL_CACHE.get("players", "json");
    if (existingPlayers && existingPlayers.length > 0) {
      return new Response(JSON.stringify({
        message: "Data already exists",
        playersCount: existingPlayers.length
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
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
var import_checked_fetch38 = __toESM2(require_checked_fetch2());
function verifyAdminToken4(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken4, "verifyAdminToken4");
__name2(verifyAdminToken4, "verifyAdminToken");
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
__name(handleGetRequest2, "handleGetRequest2");
__name2(handleGetRequest2, "handleGetRequest");
async function handlePutRequest2(context) {
  const { env, request } = context;
  if (!verifyAdminToken4(request)) {
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
__name(handlePutRequest2, "handlePutRequest2");
__name2(handlePutRequest2, "handlePutRequest");
async function onRequest36(context) {
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
__name(onRequest36, "onRequest36");
__name2(onRequest36, "onRequest");
var import_checked_fetch39 = __toESM2(require_checked_fetch2());
function verifyAdminToken5(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken5, "verifyAdminToken5");
__name2(verifyAdminToken5, "verifyAdminToken");
var defaultTeams = [
  {
    id: "1",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    logo: "/logos/rcb_logo_new.svg",
    description: "One of the most popular IPL teams known for their aggressive batting",
    colors: { primary: "#EC1C24", secondary: "#000000" },
    trophies: [],
    homeGrounds: ["M. Chinnaswamy Stadium"]
  },
  {
    id: "2",
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
    name: "Chennai Super Kings",
    shortName: "CSK",
    logo: "/logos/csk_logo_new.svg",
    description: "The Yellow Army led by the legendary MS Dhoni",
    colors: { primary: "#FFFF00", secondary: "#0081E8" },
    trophies: [
      { year: 2010, name: "IPL Champions" },
      { year: 2011, name: "IPL Champions" },
      { year: 2018, name: "IPL Champions" },
      { year: 2021, name: "IPL Champions" }
    ],
    homeGrounds: ["M. A. Chidambaram Stadium"]
  }
];
async function handleGetRequest3(context) {
  const { env } = context;
  try {
    let teams = await env.IPL_CACHE.get("teams", "json");
    if (!teams) {
      teams = defaultTeams;
    }
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
__name(handleGetRequest3, "handleGetRequest3");
__name2(handleGetRequest3, "handleGetRequest");
async function handlePostRequest2(context) {
  const { env, request } = context;
  if (!verifyAdminToken5(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { name, shortName, logo, description, colors, trophies, homeGrounds } = body;
    if (!name || !shortName || !logo || !description) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let teams = await env.IPL_CACHE.get("teams", "json") || defaultTeams;
    const newId = String(Math.max(...teams.map((t) => parseInt(t.id) || 0), 0) + 1);
    const newTeam = {
      id: newId,
      name,
      shortName,
      logo,
      description,
      colors: colors || { primary: "#6B46C1", secondary: "#FFD700" },
      trophies: trophies || [],
      homeGrounds: homeGrounds || []
    };
    teams.push(newTeam);
    await env.IPL_CACHE.put("teams", JSON.stringify(teams));
    return new Response(JSON.stringify(newTeam), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return new Response(JSON.stringify({ error: "Failed to create team" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePostRequest2, "handlePostRequest2");
__name2(handlePostRequest2, "handlePostRequest");
async function handlePutRequest3(context) {
  const { env, request } = context;
  if (!verifyAdminToken5(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { id, name, shortName, logo, description, colors, trophies, homeGrounds } = body;
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
      ...homeGrounds !== void 0 && { homeGrounds }
    };
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
__name(handlePutRequest3, "handlePutRequest3");
__name2(handlePutRequest3, "handlePutRequest");
async function handleDeleteRequest2(context) {
  const { env, request } = context;
  if (!verifyAdminToken5(request)) {
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
__name(handleDeleteRequest2, "handleDeleteRequest2");
__name2(handleDeleteRequest2, "handleDeleteRequest");
async function onRequest37(context) {
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
__name(onRequest37, "onRequest37");
__name2(onRequest37, "onRequest");
var import_checked_fetch40 = __toESM2(require_checked_fetch2());
var onRequest38 = /* @__PURE__ */ __name2(async (context) => {
  return context.next();
}, "onRequest");
var import_checked_fetch41 = __toESM2(require_checked_fetch2());
var onRequest39 = /* @__PURE__ */ __name2(async (context) => {
  const { request } = context;
  console.log(`[Middleware] ${request.method} ${new URL(request.url).pathname}`);
  return context.next();
}, "onRequest");
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
    routePath: "/api/admin/datasets",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/api/admin/email-users",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/api/admin/login",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  },
  {
    routePath: "/api/admin/ml-train",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest9]
  },
  {
    routePath: "/api/admin/moderation",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest10]
  },
  {
    routePath: "/api/admin/setup",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest11]
  },
  {
    routePath: "/api/admin/users",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest12]
  },
  {
    routePath: "/api/messages/:id",
    mountPath: "/api/messages",
    method: "",
    middlewares: [],
    modules: [onRequest13]
  },
  {
    routePath: "/api/coaches",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/coaches",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/key-players",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/key-players",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/account",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest14]
  },
  {
    routePath: "/api/admin-email-dashboard",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest15]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest16]
  },
  {
    routePath: "/api/content",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest17]
  },
  {
    routePath: "/api/cricbuzz-matches",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest18]
  },
  {
    routePath: "/api/cricbuzz-scorecard",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest19]
  },
  {
    routePath: "/api/cricketdata-live",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest20]
  },
  {
    routePath: "/api/email-analytics",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest21]
  },
  {
    routePath: "/api/email-preferences",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest22]
  },
  {
    routePath: "/api/email-queue",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest23]
  },
  {
    routePath: "/api/email-segmentation",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest24]
  },
  {
    routePath: "/api/email-service",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest25]
  },
  {
    routePath: "/api/enrichDescription",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest26]
  },
  {
    routePath: "/api/legal",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest27]
  },
  {
    routePath: "/api/live-score",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest28]
  },
  {
    routePath: "/api/matches",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest29]
  },
  {
    routePath: "/api/messages",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest30]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest31]
  },
  {
    routePath: "/api/players",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest32]
  },
  {
    routePath: "/api/preferences",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest33]
  },
  {
    routePath: "/api/profile",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest34]
  },
  {
    routePath: "/api/seed",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest35]
  },
  {
    routePath: "/api/settings",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest36]
  },
  {
    routePath: "/api/teams",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest37]
  },
  {
    routePath: "/:route*",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest38]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest39],
    modules: []
  }
];
var import_checked_fetch48 = __toESM2(require_checked_fetch2());
var import_checked_fetch46 = __toESM2(require_checked_fetch2());
var import_checked_fetch43 = __toESM2(require_checked_fetch2());
var import_checked_fetch42 = __toESM2(require_checked_fetch2());
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
__name2(lexer, "lexer");
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
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
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
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
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
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
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
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
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
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
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
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
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
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
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
          passThroughOnException: /* @__PURE__ */ __name2(() => {
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
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var import_checked_fetch44 = __toESM2(require_checked_fetch2());
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
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
var import_checked_fetch45 = __toESM2(require_checked_fetch2());
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
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
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var import_checked_fetch47 = __toESM2(require_checked_fetch2());
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
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
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
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
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
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
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
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
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-dev-util.ts
var import_checked_fetch49 = __toESM(require_checked_fetch());
function isRoutingRuleMatch(pathname, routingRule) {
  if (!pathname) {
    throw new Error("Pathname is undefined.");
  }
  if (!routingRule) {
    throw new Error("Routing rule is undefined.");
  }
  const ruleRegExp = transformRoutingRuleToRegExp(routingRule);
  return pathname.match(ruleRegExp) !== null;
}
__name(isRoutingRuleMatch, "isRoutingRuleMatch");
function transformRoutingRuleToRegExp(rule) {
  let transformedRule;
  if (rule === "/" || rule === "/*") {
    transformedRule = rule;
  } else if (rule.endsWith("/*")) {
    transformedRule = `${rule.substring(0, rule.length - 2)}(/*)?`;
  } else if (rule.endsWith("/")) {
    transformedRule = `${rule.substring(0, rule.length - 1)}(/)?`;
  } else if (rule.endsWith("*")) {
    transformedRule = rule;
  } else {
    transformedRule = `${rule}(/)?`;
  }
  transformedRule = `^${transformedRule.replaceAll(/\./g, "\\.").replaceAll(/\*/g, ".*")}$`;
  return new RegExp(transformedRule);
}
__name(transformRoutingRuleToRegExp, "transformRoutingRuleToRegExp");

// .wrangler/tmp/pages-0xxRMs/cndqyw6bfbo.js
var define_ROUTES_default = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: []
};
var routes2 = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes2.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes2.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = middleware_loader_entry_default;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var import_checked_fetch51 = __toESM(require_checked_fetch());
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
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
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
var import_checked_fetch52 = __toESM(require_checked_fetch());
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-FADqrw/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = pages_dev_pipeline_default;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var import_checked_fetch54 = __toESM(require_checked_fetch());
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-FADqrw/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
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
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
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
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
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
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=cndqyw6bfbo.js.map
