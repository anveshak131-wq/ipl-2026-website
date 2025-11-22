// Proxy for Cricbuzz Cricket scorecard (hscard) via RapidAPI
// Used by /world-cricket to show full scorecards for a specific match.

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

  const apiKey = env.RAPIDAPI_CRICBUZZ_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Cricbuzz RapidAPI key is not configured on the server.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const url = new URL(request.url);
  const matchId = url.searchParams.get('matchId');

  if (!matchId) {
    return new Response(JSON.stringify({ error: 'matchId query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upstreamUrl = `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${encodeURIComponent(
    matchId,
  )}/hscard`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
      },
      cf: {
        cacheTtl: 10,
        cacheEverything: true,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch scorecard from Cricbuzz RapidAPI',
          status: res.status,
          body: text.slice(0, 500),
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const json = await res.json();

    return new Response(
      JSON.stringify({
        status: 'success',
        scorecard: json,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error) {
    console.error('Error calling Cricbuzz RapidAPI hscard endpoint:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error calling Cricbuzz RapidAPI hscard endpoint' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
