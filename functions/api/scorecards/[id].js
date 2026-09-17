/**
 * Cloudflare Pages Function for individual scorecard operations
 * Handles GET, PUT, DELETE for specific scorecard by ID
 */

import { appendAdminAuditLog } from '../_adminActivity.js';
import { validateScorecardForPublish } from '../_scorecardValidation.js';

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
    const url = new URL(request.url);

    // GET specific scorecard
    if (request.method === 'GET') {
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
    }

    // PUT update scorecard
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

      const rawUpdateData = await request.json();
      const validationOverride =
        rawUpdateData?.validationOverride === true ||
        url.searchParams.get('validationOverride') === '1';
      const { validationOverride: _validationOverride, ...updateData } = rawUpdateData;
      const existingScorecard = JSON.parse(existingData);
      
      const updatedScorecard = {
        ...existingScorecard,
        ...updateData,
        id: scorecardId, // Preserve original ID
        updatedAt: new Date().toISOString()
      };

      if (existingScorecard.draft !== false && updatedScorecard.draft === false) {
        const validation = await validateScorecardForPublish(updatedScorecard, env, {
          currentScorecardId: scorecardId,
        });

        if (validation.errors.length > 0) {
          return new Response(JSON.stringify({
            error: 'Scorecard cannot be published',
            validation,
          }), {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (validation.warnings.length > 0 && !validationOverride) {
          return new Response(JSON.stringify({
            error: 'Publish validation warnings',
            validation,
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      await env.IPL_CACHE.put(
        `scorecard_${scorecardId}`,
        JSON.stringify(updatedScorecard)
      );

      if (existingScorecard.draft !== false && updatedScorecard.draft === false) {
        await appendAdminAuditLog(request, env, {
          action: 'publish_scorecard',
          details: `Published scorecard for match ${updatedScorecard.matchId || scorecardId}`,
          entityType: 'scorecard',
          entityId: scorecardId,
        });
      } else {
        await appendAdminAuditLog(request, env, {
          action: 'update_scorecard',
          details: `Updated scorecard for match ${updatedScorecard.matchId || scorecardId}`,
          entityType: 'scorecard',
          entityId: scorecardId,
        });
      }

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
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
