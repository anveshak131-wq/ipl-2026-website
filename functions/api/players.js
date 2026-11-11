import { fallbackIplPlayers } from "../data/comprehensivePlayers.js";
import { fallbackWplPlayers } from "../data/wplPlayers.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
};

export const onRequest = async (context) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const league = (url.searchParams.get("league") || "ipl").toLowerCase();

  try {
    const kv = env?.SPORTS_KV || env?.IPL_CACHE;

    // -------------------------------------------------------------
    // GET /api/players?league=ipl OR league=wpl
    // -------------------------------------------------------------
    if (request.method === "GET") {
      const kvKey = league === "wpl" ? "players:wpl" : "players:ipl";
      let players = [];

      if (kv) {
        players = (await kv.get(kvKey, "json")) || [];
      }

      // AUTO-HEALING: If KV contains rotated/corrupted team IDs (e.g. Beth Mooney in 14), reset to fallback
      if (league === "wpl") {
        const isCorrupted = Array.isArray(players) && players.some(p =>
          (String(p.name).includes('Mooney') && String(p.teamId) === '14') ||
          (String(p.name).includes('Harmanpreet') && String(p.teamId) === '11') ||
          (String(p.name).includes('Mandhana') && String(p.teamId) === '12') ||
          (String(p.id).includes('wpl_gg') && String(p.teamId) === '14') ||
          (String(p.id).includes('wpl-gg') && String(p.teamId) === '14')
        );

        if (isCorrupted || !Array.isArray(players) || players.length === 0 || url.searchParams.get("realign") === "true") {
          players = fallbackWplPlayers;
          if (kv) context.waitUntil(kv.put(kvKey, JSON.stringify(fallbackWplPlayers)).catch(() => {}));
        } else {
          const seedById = new Map(fallbackWplPlayers.map(sp => [String(sp.id), sp]));
          const seedByName = new Map(fallbackWplPlayers.map(sp => [String(sp.name || "").trim().toLowerCase(), sp]));
          let healedAny = false;
          players = players.map(p => {
            if (p.updatedAt) return p;
            const seed = seedById.get(String(p.id)) || seedByName.get(String(p.name || "").trim().toLowerCase());
            if (!seed) return p;
            const hasCareer = Object.keys(p.careerStats?.batting || {}).length > 0 || Object.keys(p.careerStats?.bowling || {}).length > 0;
            const wrongId = p.cricbuzzId && seed.cricbuzzId && String(p.cricbuzzId) !== String(seed.cricbuzzId);
            if (!hasCareer || !p.dateOfBirth || wrongId) {
              healedAny = true;
              const refreshMeta = !hasCareer || wrongId;
              return {
                ...seed,
                ...p,
                cricbuzzId: wrongId || !p.cricbuzzId ? seed.cricbuzzId : p.cricbuzzId,
                cricbuzzUrl: wrongId || !p.cricbuzzUrl ? seed.cricbuzzUrl : p.cricbuzzUrl,
                dateOfBirth: p.dateOfBirth || seed.dateOfBirth || '',
                age: refreshMeta ? seed.age : p.age,
                nationality: refreshMeta ? seed.nationality : p.nationality,
                role: refreshMeta ? seed.role : (p.role || seed.role),
                allrounderType: refreshMeta ? seed.allrounderType : (p.allrounderType ?? seed.allrounderType),
                battingStyle: refreshMeta ? seed.battingStyle : p.battingStyle,
                bowlingStyle: refreshMeta ? seed.bowlingStyle : p.bowlingStyle,
                careerStats: hasCareer ? p.careerStats : seed.careerStats,
                stats: hasCareer ? p.stats : seed.stats,
              };
            }
            return p;
          });
          if (healedAny && kv) {
            context.waitUntil(kv.put(kvKey, JSON.stringify(players)).catch(() => {}));
          }
        }
      } else if (league === "ipl" && (!Array.isArray(players) || players.length === 0)) {
        players = fallbackIplPlayers;
        if (kv) context.waitUntil(kv.put(kvKey, JSON.stringify(fallbackIplPlayers)).catch(() => {}));
      }

      return new Response(JSON.stringify(players), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          ...corsHeaders
        }
      });
    }

    // -------------------------------------------------------------
    // POST / PUT /api/players
    // -------------------------------------------------------------
    if (request.method === "POST" || request.method === "PUT") {
      const body = await request.json().catch(() => ({}));
      const targetLeague = (body.league || league || "ipl").toLowerCase();
      const kvKey = targetLeague === "wpl" ? "players:wpl" : "players:ipl";

      // Explicit Squad Re-alignment action
      if (body.action === "realign" || body.realign === true) {
        const resetData = targetLeague === "wpl" ? fallbackWplPlayers : fallbackIplPlayers;
        if (kv) await kv.put(kvKey, JSON.stringify(resetData));
        return new Response(JSON.stringify({ success: true, count: resetData.length, players: resetData }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders }
        });
      }

      let currentPlayers = [];
      if (kv) {
        currentPlayers = (await kv.get(kvKey, "json")) || [];
      }

      if (!currentPlayers || currentPlayers.length === 0) {
        currentPlayers = targetLeague === "wpl" ? [...fallbackWplPlayers] : [...fallbackIplPlayers];
      }

      if (body.bulk && Array.isArray(body.players)) {
        if (kv) await kv.put(kvKey, JSON.stringify(body.players));
        return new Response(JSON.stringify({ success: true, count: body.players.length }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders }
        });
      }

      const incoming = body;
      const id = String(incoming.id || Date.now());
      const incomingName = (incoming.name || '').trim().toLowerCase();
      const playerIndex = currentPlayers.findIndex(p =>
        String(p.id) === id ||
        (incomingName && p.name && p.name.trim().toLowerCase() === incomingName)
      );

      let savedPlayer;
      const nowIso = new Date().toISOString();
      if (playerIndex >= 0) {
        const existing = currentPlayers[playerIndex];
        savedPlayer = {
          ...existing,
          ...incoming,
          id: incoming.id || existing.id || id,
          careerStats: incoming.careerStats && (Object.keys(incoming.careerStats.batting || {}).length > 0 || Object.keys(incoming.careerStats.bowling || {}).length > 0)
            ? incoming.careerStats
            : (existing.careerStats || { batting: {}, bowling: {} }),
          stats: {
            ...(existing.stats || {}),
            ...(incoming.stats || {}),
          },
          dateOfBirth: incoming.dateOfBirth || existing.dateOfBirth || '',
          cricbuzzUrl: incoming.cricbuzzUrl || existing.cricbuzzUrl || '',
          cricbuzzId: incoming.cricbuzzId || existing.cricbuzzId || '',
          updatedAt: incoming.updatedAt || nowIso,
        };
        currentPlayers[playerIndex] = savedPlayer;
      } else {
        savedPlayer = {
          ...incoming,
          id,
          careerStats: incoming.careerStats || { batting: {}, bowling: {} },
          stats: incoming.stats || {},
          cricbuzzUrl: incoming.cricbuzzUrl || '',
          cricbuzzId: incoming.cricbuzzId || '',
          updatedAt: incoming.updatedAt || nowIso,
        };
        currentPlayers.push(savedPlayer);
      }

      if (kv) {
        await kv.put(kvKey, JSON.stringify(currentPlayers));
      }

      return new Response(JSON.stringify({ success: true, kvSaved: Boolean(kv), player: savedPlayer, count: currentPlayers.length }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders }
      });
    }

    // -------------------------------------------------------------
    // DELETE /api/players?id=...&league=...
    // -------------------------------------------------------------
    if (request.method === "DELETE") {
      const playerId = url.searchParams.get("id");
      const kvKey = league === "wpl" ? "players:wpl" : "players:ipl";

      let players = [];
      if (kv) players = (await kv.get(kvKey, "json")) || [];
      if (!players || players.length === 0) {
        players = league === "wpl" ? [...fallbackWplPlayers] : [...fallbackIplPlayers];
      }

      const filtered = players.filter(p => String(p.id) !== String(playerId));
      if (kv) await kv.put(kvKey, JSON.stringify(filtered));

      return new Response(JSON.stringify({ success: true, remaining: filtered.length }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};
