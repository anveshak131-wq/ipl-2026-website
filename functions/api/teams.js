/**
 * Cloudflare Pages Function for teams API
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Get teams from KV storage
    const teams = await env.IPL_CACHE.get('teams', 'json');
    
    if (!teams) {
      return new Response(JSON.stringify({ error: 'Teams not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(teams), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch teams' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
