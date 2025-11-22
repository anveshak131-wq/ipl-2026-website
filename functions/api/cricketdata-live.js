// Proxy for CricketData.org eCricScore API
// Fetches last 7 days + next 7 days + live matches and exposes a simplified JSON
// NOTE: Configure env.CRICKETDATA_API_KEY in your Cloudflare Pages/Workers settings.

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method || 'GET';

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = env.CRICKETDATA_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'CricketData API key is not configured on the server.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const upstreamUrl = `https://api.cricapi.com/v1/cricScore?apikey=${encodeURIComponent(apiKey)}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      // Lightweight caching on the edge to avoid hammering CricketData
      cf: {
        cacheTtl: 20,
        cacheEverything: true,
      },
    });

    if (!upstreamResponse.ok) {
      const text = await upstreamResponse.text().catch(() => '');
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch scores from CricketData',
          status: upstreamResponse.status,
          body: text?.slice(0, 500),
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const json = await upstreamResponse.json();

    // Normalise a bit so the frontend has a predictable shape
    const data = Array.isArray(json?.data) ? json.data : [];

    const simplified = data.map((item) => {
      const id = item.id || item.unique_id || item.matchId || item.key || null;
      const name = item.name || item.matchType || '';
      const status = item.status || item.ms || item.state || '';
      const score = item.score || '';
      const teams = Array.isArray(item.teams) ? item.teams : [];
      const teamInfo = Array.isArray(item.teamInfo) ? item.teamInfo : [];
      const venue = item.venue || item.venueInfo || '';
      const dateTimeGMT = item.dateTimeGMT || item.dateTime || '';
      const matchType = item.matchType || item.type || '';

      return {
        id,
        name,
        status,
        score,
        teams,
        teamInfo,
        venue,
        dateTimeGMT,
        matchType,
      };
    });

    const responseBody = {
      status: json?.status || 'success',
      provider: 'cricketdata.org',
      source: 'cricScore',
      count: simplified.length,
      matches: simplified,
    };

    const response = new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    return response;
  } catch (error) {
    console.error('Error calling CricketData API:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error calling CricketData API' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
