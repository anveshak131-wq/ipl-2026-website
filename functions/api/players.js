import { fallbackIplPlayers } from "../data/comprehensivePlayers.js";
import { fallbackWplPlayers } from "../data/wplPlayers.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const onRequest = async (context) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const league = (url.searchParams.get("league") || "ipl").toLowerCase();

  try {
    // -------------------------------------------------------------
    // GET /api/players?league=ipl OR league=wpl
    // -------------------------------------------------------------
    if (request.method === "GET") {
      const kvKey = league === "wpl" ? "players:wpl" : "players:ipl";
      let players = [];

      if (env?.SPORTS_KV) {
        players = (await env.SPORTS_KV.get(kvKey, "json")) || [];
      } else if (env?.IPL_CACHE && league === "ipl") {
        players = (await env.IPL_CACHE.get("players", "json")) || [];
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
          if (env?.SPORTS_KV) context.waitUntil(env.SPORTS_KV.put(kvKey, JSON.stringify(fallbackWplPlayers)).catch(() => {}));
        }
      } else if (league === "ipl" && (!Array.isArray(players) || players.length === 0)) {
        players = fallbackIplPlayers;
        if (env?.SPORTS_KV) context.waitUntil(env.SPORTS_KV.put(kvKey, JSON.stringify(fallbackIplPlayers)).catch(() => {}));
        if (env?.IPL_CACHE) context.waitUntil(env.IPL_CACHE.put("players", JSON.stringify(fallbackIplPlayers)).catch(() => {}));
      }

      return new Response(JSON.stringify(players), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
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
        if (env?.SPORTS_KV) await env.SPORTS_KV.put(kvKey, JSON.stringify(resetData));
        return new Response(JSON.stringify({ success: true, count: resetData.length, players: resetData }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      let currentPlayers = [];
      if (env?.SPORTS_KV) {
        currentPlayers = (await env.SPORTS_KV.get(kvKey, "json")) || [];
      } else if (env?.IPL_CACHE && targetLeague === "ipl") {
        currentPlayers = (await env.IPL_CACHE.get("players", "json")) || [];
      }

      if (!currentPlayers || currentPlayers.length === 0) {
        currentPlayers = targetLeague === "wpl" ? [...fallbackWplPlayers] : [...fallbackIplPlayers];
      }

      if (body.bulk && Array.isArray(body.players)) {
        if (env?.SPORTS_KV) await env.SPORTS_KV.put(kvKey, JSON.stringify(body.players));
        return new Response(JSON.stringify({ success: true, count: body.players.length }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const incoming = body;
      const id = String(incoming.id || Date.now());
      const playerIndex = currentPlayers.findIndex(p => String(p.id) === id);

      if (playerIndex >= 0) {
        const existing = currentPlayers[playerIndex];
        currentPlayers[playerIndex] = {
          ...existing,
          ...incoming,
          id,
          careerStats: incoming.careerStats && Object.keys(incoming.careerStats).length > 0
            ? incoming.careerStats
            : (existing.careerStats || { batting: {}, bowling: {} }),
          cricbuzzUrl: incoming.cricbuzzUrl || existing.cricbuzzUrl || '',
          cricbuzzId: incoming.cricbuzzId || existing.cricbuzzId || '',
        };
      } else {
        currentPlayers.push({ ...incoming, id });
      }

      if (env?.SPORTS_KV) await env.SPORTS_KV.put(kvKey, JSON.stringify(currentPlayers));

      return new Response(JSON.stringify({ success: true, player: incoming }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // -------------------------------------------------------------
    // DELETE /api/players?id=...&league=...
    // -------------------------------------------------------------
    if (request.method === "DELETE") {
      const playerId = url.searchParams.get("id");
      const kvKey = league === "wpl" ? "players:wpl" : "players:ipl";

      let players = [];
      if (env?.SPORTS_KV) players = (await env.SPORTS_KV.get(kvKey, "json")) || [];
      if (!players || players.length === 0) {
        players = league === "wpl" ? [...fallbackWplPlayers] : [...fallbackIplPlayers];
      }

      const filtered = players.filter(p => String(p.id) !== String(playerId));
      if (env?.SPORTS_KV) await env.SPORTS_KV.put(kvKey, JSON.stringify(filtered));

      return new Response(JSON.stringify({ success: true, remaining: filtered.length }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
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
