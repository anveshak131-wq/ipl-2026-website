/**
 * Cloudflare Pages Function for publishing scorecards
 * Handles PUT request to /api/scorecards/[id]/publish
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper: basic admin token check
function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const scorecardId = params.id;

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // PUT publish scorecard
    if (request.method === 'PUT') {
      if (!verifyAdminToken(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const existingData = await env.IPL_CACHE.get(`scorecard_${scorecardId}`);
      
      if (!existingData) {
        return new Response(JSON.stringify({ error: 'Scorecard not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const scorecard = JSON.parse(existingData);
      scorecard.draft = false;
      scorecard.publishedAt = new Date().toISOString();
      scorecard.updatedAt = new Date().toISOString();

      await env.IPL_CACHE.put(
        `scorecard_${scorecardId}`,
        JSON.stringify(scorecard)
      );

      return new Response(JSON.stringify(scorecard), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Publish scorecard error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
