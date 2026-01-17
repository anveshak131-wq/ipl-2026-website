const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Verify admin token
function verifyAdminToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  const validToken = 'R_Karthik@7';
  
  return token === validToken;
}

export const onRequest = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Get the cleaned teams from request
    const { teams } = await request.json();

    if (!teams || !Array.isArray(teams)) {
      return new Response(JSON.stringify({ error: 'Invalid teams data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Update KV storage with deduplicated teams
    await env.IPL_CACHE.put('teams', JSON.stringify(teams));

    return new Response(JSON.stringify({
      success: true,
      message: 'Teams cleaned successfully',
      count: teams.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error cleaning teams:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to clean teams',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};
