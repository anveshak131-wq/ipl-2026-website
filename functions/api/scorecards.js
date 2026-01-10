/**
 * Cloudflare Pages Function for scorecards API
 * Handles GET, POST, PUT operations for cricket scorecards
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper: basic admin token check (presence of Bearer token)
function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

// Helper: generate unique ID
function generateId() {
  return `scorecard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function onRequest(context) {
  const { request, env } = context;

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const scorecardId = pathSegments[pathSegments.length - 1];
    const isMatchQuery = url.searchParams.has('matchId');
    const matchId = url.searchParams.get('matchId');

    // GET scorecard(s)
    if (request.method === 'GET') {
      if (isMatchQuery && matchId) {
        // Get all scorecards for a specific match
        const list = await env.IPL_CACHE.list({ prefix: 'scorecard_' });
        const scorecards = [];
        
        for (const item of list.keys) {
          try {
            const scorecard = JSON.parse(await env.IPL_CACHE.get(item.name));
            if (scorecard.matchId === matchId) {
              scorecards.push(scorecard);
            }
          } catch (error) {
            console.error(`Error parsing scorecard ${item.name}:`, error);
          }
        }
        
        return new Response(JSON.stringify(scorecards), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (scorecardId && scorecardId !== 'scorecards') {
        // Get specific scorecard by ID
        const scorecardData = await env.IPL_CACHE.get(`scorecard_${scorecardId}`);
        if (!scorecardData) {
          return new Response(JSON.stringify({ error: 'Scorecard not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(scorecardData, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        // Get all scorecards
        const list = await env.IPL_CACHE.list({ prefix: 'scorecard_' });
        const scorecards = [];
        
        for (const item of list.keys) {
          try {
            const scorecard = JSON.parse(await env.IPL_CACHE.get(item.name));
            scorecards.push(scorecard);
          } catch (error) {
            console.error(`Error parsing scorecard ${item.name}:`, error);
          }
        }
        
        return new Response(JSON.stringify(scorecards), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // POST new scorecard
    if (request.method === 'POST') {
      if (!verifyAdminToken(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await request.json();
      
      // Validate required fields
      if (!data.matchId || !data.league || !data.matchInfo || !data.innings) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const scorecardId = generateId();
      const scorecard = {
        id: scorecardId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        draft: true // Default to draft mode
      };

      await env.IPL_CACHE.put(
        `scorecard_${scorecardId}`,
        JSON.stringify(scorecard)
      );

      return new Response(JSON.stringify(scorecard), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PUT update scorecard
    if (request.method === 'PUT') {
      if (!verifyAdminToken(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if this is a publish request
      if (url.pathname.endsWith('/publish')) {
        const actualId = pathSegments[pathSegments.length - 2]; // Get ID before 'publish'
        const existingData = await env.IPL_CACHE.get(`scorecard_${actualId}`);
        
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
          `scorecard_${actualId}`,
          JSON.stringify(scorecard)
        );

        return new Response(JSON.stringify(scorecard), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Regular update
      if (!scorecardId || scorecardId === 'scorecards') {
        return new Response(JSON.stringify({ error: 'Scorecard ID required' }), {
          status: 400,
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

      const updateData = await request.json();
      const existingScorecard = JSON.parse(existingData);
      
      const updatedScorecard = {
        ...existingScorecard,
        ...updateData,
        id: scorecardId, // Preserve original ID
        updatedAt: new Date().toISOString()
      };

      await env.IPL_CACHE.put(
        `scorecard_${scorecardId}`,
        JSON.stringify(updatedScorecard)
      );

      return new Response(JSON.stringify(updatedScorecard), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE scorecard
    if (request.method === 'DELETE') {
      if (!verifyAdminToken(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!scorecardId || scorecardId === 'scorecards') {
        return new Response(JSON.stringify({ error: 'Scorecard ID required' }), {
          status: 400,
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

      await env.IPL_CACHE.delete(`scorecard_${scorecardId}`);

      return new Response(JSON.stringify({ message: 'Scorecard deleted successfully' }), {
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
    console.error('Scorecard API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
