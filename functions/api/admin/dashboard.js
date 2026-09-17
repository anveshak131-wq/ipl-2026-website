import { getRecentAdminAuditLogs, requireAdmin } from '../_adminActivity.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function normalizeLeague(value) {
  return value === 'ipl' || value === 'wpl' ? value : 'ipl';
}

function toTimestamp(value) {
  const parsed = Date.parse(String(value || ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getDateKey(daysAgo = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function getLast24HourKeys() {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, index) => {
    const date = new Date(now - (23 - index) * 60 * 60 * 1000);
    return {
      dateKey: date.toISOString().slice(0, 10),
      hourKey: String(date.getUTCHours()).padStart(2, '0'),
      label: `${String(date.getHours()).padStart(2, '0')}:00`,
    };
  });
}

async function listKvJson(env, namespaceName, prefix, max = 500) {
  const namespace = env?.[namespaceName];
  if (!namespace) return [];

  const values = [];
  let cursor;

  do {
    const list = await namespace.list({ prefix, cursor });
    cursor = list.cursor;

    for (const key of list.keys || []) {
      if (values.length >= max) return values;
      const raw = await namespace.get(key.name);
      if (!raw) continue;

      try {
        values.push({ key: key.name, value: JSON.parse(raw) });
      } catch {
        values.push({ key: key.name, value: raw });
      }
    }
  } while (cursor);

  return values;
}

async function getActiveUsers(env) {
  const entries = await listKvJson(env, 'SPORTS_KV', 'active-users:', 100);
  const now = Date.now();
  const usersById = new Map();

  for (const entry of entries) {
    const users = Array.isArray(entry.value) ? entry.value : [];
    for (const user of users) {
      const lastActive = toTimestamp(user?.lastActive);
      if (!lastActive || now - lastActive > 15 * 60 * 1000) continue;

      usersById.set(String(user.id || user.email || user.name), {
        ...user,
        lastActive: user.lastActive,
      });
    }
  }

  return Array.from(usersById.values());
}

async function getRegisteredUserCount(env) {
  if (!env?.SPORTS_KV) return 0;

  let count = 0;
  let cursor;

  do {
    const list = await env.SPORTS_KV.list({ prefix: 'user:', cursor });
    cursor = list.cursor;
    count += (list.keys || []).length;
    if (count >= 5000) return count;
  } while (cursor);

  return count;
}

async function getTraffic(env) {
  const todayKey = getDateKey(0);
  const yesterdayKey = getDateKey(1);
  const [todayRaw, yesterdayRaw] = await Promise.all([
    env.SPORTS_KV.get(`traffic:${todayKey}`),
    env.SPORTS_KV.get(`traffic:${yesterdayKey}`),
  ]);

  const today = todayRaw ? JSON.parse(todayRaw) : {};
  const yesterday = yesterdayRaw ? JSON.parse(yesterdayRaw) : {};
  const hourKeys = getLast24HourKeys();
  const trafficByDate = {
    [todayKey]: today.hourly || {},
    [yesterdayKey]: yesterday.hourly || {},
  };

  const hourlyTraffic = hourKeys.map(({ dateKey, hourKey, label }) => ({
    hour: label,
    count: Number(trafficByDate[dateKey]?.[hourKey] || 0),
  }));

  return {
    today,
    hourlyTraffic,
    pageViewsToday: Number(today.pageViews || 0),
    publicPageViewsToday: Number(today.publicPageViews || 0),
    adminPageViewsToday: Number(today.adminPageViews || 0),
    uniqueVisitorsToday: Number(today.uniqueVisitors || Object.keys(today.visitors || {}).length || 0),
    topRoutes: Object.entries(today.routes || {})
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 5)
      .map(([path, views]) => ({ path, views: Number(views) })),
  };
}

async function getMessages(env) {
  const entries = await listKvJson(env, 'SPORTS_KV', 'messages:', 100);
  const messages = [];

  for (const entry of entries) {
    if (Array.isArray(entry.value)) {
      messages.push(...entry.value);
    }
  }

  return messages;
}

function buildHourlyMessages(messages) {
  const now = new Date();
  const last24Hours = now.getTime() - 24 * 60 * 60 * 1000;
  const hourly = {};

  for (let index = 23; index >= 0; index -= 1) {
    const hourTime = new Date(now.getTime() - index * 60 * 60 * 1000);
    hourly[hourTime.getHours().toString().padStart(2, '0')] = 0;
  }

  for (const message of messages) {
    const messageTime = new Date(message?.timestamp);
    if (Number.isNaN(messageTime.getTime()) || messageTime.getTime() < last24Hours) continue;
    const hourKey = messageTime.getHours().toString().padStart(2, '0');
    hourly[hourKey] = Number(hourly[hourKey] || 0) + 1;
  }

  return Object.entries(hourly).map(([hour, count]) => ({
    hour: `${hour}:00`,
    count,
  }));
}

function buildTimeOfDayBuckets(messages) {
  const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
  const buckets = { night: 0, morning: 0, afternoon: 0, evening: 0 };

  for (const message of messages) {
    const messageTime = new Date(message?.timestamp);
    if (Number.isNaN(messageTime.getTime()) || messageTime.getTime() < last24Hours) continue;
    const hour = messageTime.getHours();

    if (hour < 6) buckets.night += 1;
    else if (hour < 12) buckets.morning += 1;
    else if (hour < 18) buckets.afternoon += 1;
    else buckets.evening += 1;
  }

  return buckets;
}

async function getMatches(env, league) {
  const matches = await env.IPL_CACHE.get('matches', 'json');
  if (!Array.isArray(matches)) return [];
  return matches.filter((match) => (match?.league || 'ipl') === league);
}

async function getScorecards(env, league) {
  const entries = await listKvJson(env, 'IPL_CACHE', 'scorecard_', 500);
  return entries
    .map((entry) => entry.value)
    .filter((scorecard) => {
      if (!scorecard || typeof scorecard !== 'object') return false;
      const explicitLeague = scorecard.league || scorecard.matchInfo?.league;
      return (explicitLeague || league) === league;
    });
}

async function checkService(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    return {
      name,
      status: 'ok',
      latencyMs: Date.now() - started,
      detail: detail || 'OK',
    };
  } catch (error) {
    return {
      name,
      status: 'error',
      latencyMs: Date.now() - started,
      detail: error instanceof Error ? error.message : 'Failed',
    };
  }
}

export const onRequest = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const auth = await requireAdmin(request, env);
  if (!auth.ok) {
    return json({ error: auth.error }, auth.status);
  }

  try {
    if (!env?.SPORTS_KV || !env?.IPL_CACHE) {
      return json({ error: 'KV not configured' }, 500);
    }

    const url = new URL(request.url);
    const league = normalizeLeague(url.searchParams.get('league'));
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      activeUsers,
      totalUsers,
      traffic,
      messages,
      matches,
      scorecards,
      recentActions,
      sportsKvHealth,
      iplCacheHealth,
      trafficHealth,
    ] = await Promise.all([
      getActiveUsers(env),
      getRegisteredUserCount(env),
      getTraffic(env),
      getMessages(env),
      getMatches(env, league),
      getScorecards(env, league),
      getRecentAdminAuditLogs(env, 7, 12),
      checkService('SPORTS_KV', async () => {
        await env.SPORTS_KV.get('healthcheck');
        return 'reachable';
      }),
      checkService('IPL_CACHE', async () => {
        await env.IPL_CACHE.get('matches');
        return 'reachable';
      }),
      checkService('Traffic Collector', async () => {
        await env.SPORTS_KV.get(`traffic:${getDateKey(0)}`);
        return 'recording';
      }),
    ]);

    const messagesToday = messages.filter((message) => toTimestamp(message?.timestamp) >= todayStart.getTime()).length;
    const hoursElapsed = Math.max(1, Math.floor((now.getTime() - todayStart.getTime()) / (1000 * 60 * 60)));
    const messagesPerHour = Math.round(messagesToday / hoursElapsed);
    const liveMatches = matches.filter((match) => match.status === 'live').length;
    const upcomingMatches = matches.filter((match) => new Date(match.date).getTime() > now.getTime()).length;
    const publishedScorecards = scorecards.filter((scorecard) => scorecard.draft === false).length;
    const draftScorecards = scorecards.filter((scorecard) => scorecard.draft !== false).length;
    const pageViewsForEngagement = Math.max(traffic.publicPageViewsToday || traffic.pageViewsToday, 0);
    const engagementRate = pageViewsForEngagement > 0
      ? Math.min(100, Math.round(((messagesToday + activeUsers.length) / pageViewsForEngagement) * 100))
      : 0;
    const apiServices = [sportsKvHealth, iplCacheHealth, trafficHealth];

    const peakKey = `dashboard:peak-active:${league}`;
    const storedPeakRaw = await env.SPORTS_KV.get(peakKey);
    const storedPeak = Number(storedPeakRaw || 0);
    const peakActiveUsers = Math.max(storedPeak, activeUsers.length);
    if (peakActiveUsers !== storedPeak) {
      await env.SPORTS_KV.put(peakKey, String(peakActiveUsers), {
        expirationTtl: 60 * 60 * 24 * 45,
      });
    }

    return json({
      generatedAt: now.toISOString(),
      league,
      stats: {
        totalUsers,
        activeUsers: activeUsers.length,
        peakActiveUsers,
        totalMatches: matches.length,
        liveMatches,
        upcomingMatches,
        totalMessages: messages.length,
        messagesToday,
        messagesPerHour,
        pageViews: traffic.publicPageViewsToday,
        totalPageViews: traffic.pageViewsToday,
        uniqueVisitors: traffic.uniqueVisitorsToday,
        engagementRate,
      },
      hourlyMessages: buildHourlyMessages(messages),
      hourlyTraffic: traffic.hourlyTraffic,
      timeOfDayBuckets: buildTimeOfDayBuckets(messages),
      publishStatus: {
        publishedScorecards,
        draftScorecards,
        totalScorecards: scorecards.length,
        lastPublishedAt: scorecards
          .filter((scorecard) => scorecard.publishedAt)
          .sort((a, b) => toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt))[0]?.publishedAt || null,
      },
      apiHealth: {
        overall: apiServices.every((service) => service.status === 'ok') ? 'ok' : 'error',
        services: apiServices,
      },
      traffic: {
        topRoutes: traffic.topRoutes,
        adminPageViewsToday: traffic.adminPageViewsToday,
      },
      recentActions,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return json({ error: 'Failed to build dashboard analytics' }, 500);
  }
};
