/**
 * Achievements API - Manage admin-entered match achievements per season
 * GET: Fetch achievements (by league/season, optional matchId/teamId/playerId filters)
 * POST: Upsert achievements for a specific match (admin only)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function normalizeLeague(value) {
  return value === 'wpl' ? 'wpl' : 'ipl';
}

function parseSeason(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isFinite(parsed)) return parsed;
  return new Date().getFullYear();
}

function buildKey(league, season) {
  return `achievements:${league}:${season}`;
}

function makeId() {
  return `ach_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const league = normalizeLeague(searchParams.get('league') || 'ipl');
    const season = parseSeason(searchParams.get('season'));
    const matchId = searchParams.get('matchId');
    const teamId = searchParams.get('teamId');
    const playerId = searchParams.get('playerId');

    const key = buildKey(league, season);
    const raw = await context.env.IPL_CACHE.get(key, 'json');
    const entries = Array.isArray(raw) ? raw : (raw?.entries || []);

    let filtered = entries;
    if (matchId) {
      filtered = filtered.filter((entry) => String(entry.matchId) === String(matchId));
    }
    if (teamId) {
      filtered = filtered.filter((entry) => String(entry.teamId) === String(teamId));
    }
    if (playerId) {
      filtered = filtered.filter((entry) => String(entry.playerId) === String(playerId));
    }

    return json(filtered);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return json({ error: 'Failed to fetch achievements' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    // Authentication check
    const authHeader =
      context.request.headers.get('Authorization') ||
      context.request.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const userToken = await context.env.SPORTS_KV.get(`token:${token}`);

    let tokenData;
    if (userToken) {
      try {
        tokenData = JSON.parse(userToken);
      } catch {
        tokenData = { email: userToken, role: 'admin' };
      }
    } else {
      // Fallback: support base64 admin tokens from /api/admin/login
      try {
        const decoded = JSON.parse(atob(token));
        if (decoded && typeof decoded === 'object') {
          const exp = typeof decoded.exp === 'number' ? decoded.exp : null;
          if (!exp || exp > Date.now()) {
            tokenData = decoded;
          }
        }
      } catch {
        // ignore
      }
    }

    if (!tokenData) {
      return json({ error: 'Invalid token' }, 401);
    }

    if (tokenData.role !== 'admin' && tokenData.role !== 'super_admin') {
      return json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const payload = await context.request.json();
    const league = normalizeLeague(payload.league || 'ipl');
    const season = parseSeason(payload.season);
    const matchId = String(payload.matchId || '').trim();
    const matchLabel = payload.matchLabel ? String(payload.matchLabel) : '';
    const matchDate = payload.matchDate ? String(payload.matchDate) : '';

    if (!matchId) {
      return json({ error: 'matchId is required' }, 400);
    }

    const key = buildKey(league, season);
    const raw = await context.env.IPL_CACHE.get(key, 'json');
    const existing = Array.isArray(raw) ? raw : (raw?.entries || []);
    const existingById = new Map(existing.map((entry) => [String(entry.id), entry]));
    const now = new Date().toISOString();

    const incoming = Array.isArray(payload.achievements) ? payload.achievements : [];
    const normalized = incoming.map((entry) => {
      const entryId = entry.id ? String(entry.id) : makeId();
      const previous = existingById.get(entryId);
      return {
        id: entryId,
        league,
        season,
        matchId,
        matchLabel: entry.matchLabel || matchLabel || previous?.matchLabel || '',
        matchDate: entry.matchDate || matchDate || previous?.matchDate || '',
        target: entry.target === 'team' ? 'team' : 'player',
        teamId: entry.teamId ? String(entry.teamId) : previous?.teamId || '',
        playerId: entry.playerId ? String(entry.playerId) : previous?.playerId || '',
        title: entry.title ? String(entry.title).trim() : '',
        description: entry.description ? String(entry.description).trim() : '',
        value: entry.value ? String(entry.value).trim() : '',
        createdAt: previous?.createdAt || entry.createdAt || now,
        updatedAt: now,
      };
    });

    const filtered = existing.filter((entry) => String(entry.matchId) !== String(matchId));
    const updated = [...filtered, ...normalized];

    await context.env.IPL_CACHE.put(key, JSON.stringify(updated));

    // Track admin activity
    try {
      await fetch(`${new URL(context.request.url).origin}/api/admin/users/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          action: 'update_achievements',
          details: `Updated achievements for match ${matchId} (${league.toUpperCase()} ${season})`,
        }),
      });
    } catch (err) {
      console.error('Failed to track activity:', err);
    }

    return json({
      success: true,
      message: 'Achievements updated successfully',
      data: normalized,
    });
  } catch (error) {
    console.error('Error updating achievements:', error);
    return json({ error: 'Failed to update achievements' }, 500);
  }
}
