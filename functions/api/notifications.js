// Cloudflare Pages Function for user notifications (match reminders and live chat events)

const mockTeams = [
  { id: '1', name: 'Royal Challengers Bengaluru', shortName: 'RCB' },
  { id: '2', name: 'Mumbai Indians', shortName: 'MI' },
  { id: '3', name: 'Sunrisers Hyderabad', shortName: 'SRH' },
  { id: '4', name: 'Gujarat Titans', shortName: 'GT' },
  { id: '5', name: 'Punjab Kings', shortName: 'PBKS' },
  { id: '6', name: 'Delhi Capitals', shortName: 'DC' },
  { id: '7', name: 'Lucknow Super Giants', shortName: 'LSG' },
  { id: '8', name: 'Rajasthan Royals', shortName: 'RR' },
  { id: '9', name: 'Kolkata Knight Riders', shortName: 'KKR' },
  { id: '10', name: 'Chennai Super Kings', shortName: 'CSK' },
];

const defaultMatches = [
  {
    id: '1',
    date: '2026-03-23',
    time: '19:30',
    venue: 'M. A. Chidambaram Stadium, Chennai',
    team1Id: '10',
    team2Id: '1',
    status: 'upcoming',
  },
  {
    id: '2',
    date: '2026-03-24',
    time: '15:30',
    venue: 'Eden Gardens, Kolkata',
    team1Id: '9',
    team2Id: '4',
    status: 'upcoming',
  },
  {
    id: '3',
    date: '2026-03-25',
    time: '19:30',
    venue: 'Wankhede Stadium, Mumbai',
    team1Id: '2',
    team2Id: '8',
    status: 'upcoming',
  },
];

function getMatchStartDate(match) {
  if (!match || !match.date) return null;

  const datePart = String(match.date).trim();
  const timePart = (match.time ? String(match.time) : '00:00').trim() || '00:00';

  try {
    const dt = new Date(`${datePart}T${timePart}:00+05:30`);
    if (!Number.isNaN(dt.getTime())) return dt;
  } catch (e) {
    // fall through
  }

  try {
    const dt2 = new Date(datePart);
    if (!Number.isNaN(dt2.getTime())) return dt2;
  } catch (e) {
    // ignore
  }

  return null;
}

function getTeamMeta(teamId, teamObj) {
  const id = teamId != null ? String(teamId) : teamObj && teamObj.id != null ? String(teamObj.id) : '';
  let name = teamObj && teamObj.name;
  let shortName = teamObj && teamObj.shortName;

  if (id) {
    const found = mockTeams.find((t) => t.id === id);
    if (found) {
      if (!name) name = found.name;
      if (!shortName) shortName = found.shortName;
    }
  }

  return {
    id: id || '',
    name: name || shortName || (id ? `Team ${id}` : 'Unknown team'),
    shortName: shortName || name || 'TBD',
  };
}

export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  try {
    if (!env || !env.SPORTS_KV || !env.IPL_CACHE) {
      return new Response(
        JSON.stringify({ error: 'KV not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer', '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    let email = tokenValue;
    if (tokenValue.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === 'string') {
          email = parsed.email;
        }
      } catch (e) {
        // fall back to tokenValue as-is
      }
    }

    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const user = JSON.parse(userData);
    const favoriteTeamIds = Array.isArray(user.favoriteTeamIds)
      ? user.favoriteTeamIds.map((v) => String(v))
      : [];

    if (favoriteTeamIds.length === 0) {
      return new Response(
        JSON.stringify({ notifications: [], windowHours: 48 }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    let matches = await env.IPL_CACHE.get('matches', 'json');
    if (!Array.isArray(matches)) {
      matches = defaultMatches;
    }

    const windowParam = url.searchParams.get('windowHours');
    let windowHours = 48;
    if (windowParam) {
      const parsed = Number(windowParam);
      if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 168) {
        windowHours = parsed;
      }
    }

    const now = Date.now();
    const maxTime = now + windowHours * 60 * 60 * 1000;

    const upcomingFavoriteMatches = [];

    for (const match of matches) {
      if (!match) continue;
      if (match.status !== 'upcoming') continue;

      let team1Id = match.team1Id;
      let team2Id = match.team2Id;

      if ((!team1Id || !team2Id) && match.team1 && match.team2) {
        if (!team1Id && match.team1.id) team1Id = String(match.team1.id);
        if (!team2Id && match.team2.id) team2Id = String(match.team2.id);
      }

      if (!team1Id || !team2Id) continue;

      const involvesFavorite =
        favoriteTeamIds.includes(String(team1Id)) || favoriteTeamIds.includes(String(team2Id));
      if (!involvesFavorite) continue;

      const startsAt = getMatchStartDate(match);
      if (!startsAt) continue;

      const startMs = startsAt.getTime();
      if (startMs < now || startMs > maxTime) continue;

      upcomingFavoriteMatches.push({ match, startsAt });
    }

    const matchReminderNotifications = upcomingFavoriteMatches.map(({ match, startsAt }) => {
      const team1Meta = getTeamMeta(match.team1Id, match.team1);
      const team2Meta = getTeamMeta(match.team2Id, match.team2);

      return {
        id: `match_reminder:${String(match.id)}`,
        type: 'match_reminder',
        matchId: String(match.id),
        startsAt: startsAt.toISOString(),
        match: {
          id: String(match.id),
          date: match.date || null,
          time: match.time || null,
          venue: match.venue || null,
          status: match.status || null,
          team1: team1Meta,
          team2: team2Meta,
        },
      };
    });

    let liveChatNotifications = [];
    try {
      const rawEvents = await env.SPORTS_KV.get('liveChatEvents');
      if (rawEvents) {
        const events = JSON.parse(rawEvents);
        if (Array.isArray(events)) {
          liveChatNotifications = events
            .map((event) => {
              if (!event || event.matchId == null) return null;
              const matchId = String(event.matchId);
              const match = matches.find((m) => m && String(m.id) === matchId);
              if (!match) return null;

              let team1Id = match.team1Id || (match.team1 && match.team1.id);
              let team2Id = match.team2Id || (match.team2 && match.team2.id);
              if (!team1Id || !team2Id) return null;

              const involvesFavorite =
                favoriteTeamIds.includes(String(team1Id)) ||
                favoriteTeamIds.includes(String(team2Id));
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
              const team1Meta = getTeamMeta(team1Id, match.team1);
              const team2Meta = getTeamMeta(team2Id, match.team2);

              return {
                id: `live_chat_event:${String(event.id || `${matchId}:${ts}`)}`,
                type: 'live_chat_event',
                matchId,
                startsAt: startIso,
                eventId: event.id != null ? String(event.id) : '',
                eventType: event.type || 'special',
                title: event.title || 'Live chat event',
                description: event.description || null,
                match: {
                  id: matchId,
                  date: match.date || null,
                  time: match.time || null,
                  venue: match.venue || null,
                  status: match.status || null,
                  team1: team1Meta,
                  team2: team2Meta,
                },
              };
            })
            .filter(Boolean);
        }
      }
    } catch (e) {
      console.error('Error building live chat notifications:', e);
    }

    const notifications = [...matchReminderNotifications, ...liveChatNotifications];

    return new Response(
      JSON.stringify({ notifications, windowHours }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    console.error('Notifications error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};
