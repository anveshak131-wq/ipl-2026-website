/**
 * Cloudflare Pages Function for publishing scorecards
 * Handles PUT request to /api/scorecards/[id]/publish
 */

import { appendAdminAuditLog } from '../../_adminActivity.js';
import { validateScorecardForPublish } from '../../_scorecardValidation.js';

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

      const body = await request.json().catch(() => ({}));
      const url = new URL(request.url);
      const validationOverride =
        body?.validationOverride === true ||
        url.searchParams.get('validationOverride') === '1';

      const scorecard = JSON.parse(existingData);
      scorecard.draft = false;
      scorecard.publishedAt = new Date().toISOString();
      scorecard.updatedAt = new Date().toISOString();

      const validation = await validateScorecardForPublish(scorecard, env, {
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

      await env.IPL_CACHE.put(
        `scorecard_${scorecardId}`,
        JSON.stringify(scorecard)
      );

      await appendAdminAuditLog(request, env, {
        action: 'publish_scorecard',
        details: `Published scorecard for match ${scorecard.matchId || scorecardId}`,
        entityType: 'scorecard',
        entityId: scorecardId,
      });

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
