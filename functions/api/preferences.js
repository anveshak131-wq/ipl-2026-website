/**
 * Cloudflare Pages Function for managing user preferences
 * Syncs terms acceptance and email notification settings to backend
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get authorization token
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer', '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validate token
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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

    // Get user data
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = JSON.parse(userData);

    // Handle GET - retrieve user preferences
    if (method === 'GET') {
      return new Response(
        JSON.stringify({
          email: user.email,
          name: user.name,
          termsAccepted: user.termsAccepted || false,
          termsAcceptedDate: user.termsAcceptedDate || null,
          emailNotificationsEnabled: user.emailNotificationsEnabled !== false, // Default to true
          favoriteTeamIds: user.favoriteTeamIds || [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Handle PUT - update user preferences
    if (method === 'PUT') {
      const body = await request.json();
      const { termsAccepted, emailNotificationsEnabled, favoriteTeamIds } = body;

      // Update terms acceptance
      if (typeof termsAccepted === 'boolean') {
        user.termsAccepted = termsAccepted;
        if (termsAccepted) {
          user.termsAcceptedDate = new Date().toISOString();
        }
      }

      // Update email notification preference
      if (typeof emailNotificationsEnabled === 'boolean') {
        user.emailNotificationsEnabled = emailNotificationsEnabled;
      }

      // Update favorite teams
      if (Array.isArray(favoriteTeamIds)) {
        user.favoriteTeamIds = favoriteTeamIds;
      }

      // Save updated user data
      await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
        expirationTtl: 31536000, // 1 year
      });

      // If user accepted terms, add to users index for email notifications
      if (user.termsAccepted) {
        await addUserToIndex(email, env);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Preferences updated',
          user: {
            email: user.email,
            name: user.name,
            termsAccepted: user.termsAccepted,
            termsAcceptedDate: user.termsAcceptedDate,
            emailNotificationsEnabled: user.emailNotificationsEnabled,
            favoriteTeamIds: user.favoriteTeamIds,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Preferences error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

/**
 * Add user to the users index for email notifications
 */
async function addUserToIndex(email, env) {
  try {
    let usersIndex = [];
    const indexRaw = await env.SPORTS_KV.get('users-index');
    
    if (indexRaw) {
      try {
        usersIndex = JSON.parse(indexRaw);
      } catch (e) {
        console.error('Error parsing users index:', e);
        usersIndex = [];
      }
    }

    // Add email to index if not already present
    if (!usersIndex.includes(email)) {
      usersIndex.push(email);
      await env.SPORTS_KV.put('users-index', JSON.stringify(usersIndex), {
        expirationTtl: 31536000, // 1 year
      });
    }
  } catch (error) {
    console.error('Error updating users index:', error);
  }
}
