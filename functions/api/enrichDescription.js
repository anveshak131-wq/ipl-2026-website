/**
 * Enrich Description API
 * Accepts GET ?teamName=... or POST { teamName }
 * Attempts to fetch a short summary from Wikipedia and returns a merged/enhanced suggestion.
 */
export async function onRequest(context) {
  const { request } = context;

  try {
    let teamName = '';
    if (request.method === 'POST') {
      const body = await request.json();
      teamName = body.teamName || '';
    } else {
      const url = new URL(request.url);
      teamName = url.searchParams.get('teamName') || '';
    }

    if (!teamName) {
      return new Response(JSON.stringify({ error: 'teamName required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Try Wikipedia summary API
    const title = encodeURIComponent(teamName.replace(/\s+\(.+\)$/, '').trim());
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;

    try {
      const wikiResp = await fetch(wikiUrl, { cf: { cacheTtl: 3600 } });
      if (wikiResp.ok) {
        const data = await wikiResp.json();
        if (data && data.extract) {
          const enhanced = data.extract.split('\n').slice(0, 3).join(' ');
          return new Response(JSON.stringify({ enhanced, source: 'wikipedia', url: data.content_urls?.desktop?.page || wikiUrl }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }
    } catch (err) {
      // ignore and fallback to heuristic
      console.error('Wikipedia fetch failed', err);
    }

    // Fallback heuristic: tidy up whitespace and sentence boundaries
    const heuristic = teamName + ' is a professional cricket franchise competing in the Indian Premier League. Known for its passionate fanbase and competitive performances.';
    return new Response(JSON.stringify({ enhanced: heuristic, source: 'heuristic' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('enrichDescription error', error);
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
