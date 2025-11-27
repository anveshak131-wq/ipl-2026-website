/**
 * Cloudflare Pages Function for advanced email preferences
 * Handles unsubscribe, preference center, and personalization
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const { pathname } = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Public unsubscribe endpoint (no auth required)
    if (pathname.includes('/api/email-preferences/unsubscribe/')) {
      const token = pathname.split('/').pop();
      return await handleUnsubscribe(token, env, corsHeaders);
    }

    // All other endpoints require auth
    const authHeader = request.headers.get('Authorization') || '';
    const authToken = authHeader.replace('Bearer', '').trim();

    if (!authToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const tokenValue = await env.SPORTS_KV.get(`token:${authToken}`);
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
        if (parsed?.email) email = parsed.email;
      } catch (e) {
        // fall back
      }
    }

    // GET: Get email preferences
    if (method === 'GET') {
      return await getEmailPreferences(email, env, corsHeaders);
    }

    // PUT: Update email preferences
    if (method === 'PUT') {
      const body = await request.json();
      return await updateEmailPreferences(email, body, env, corsHeaders);
    }

    // DELETE: Delete preference (unsubscribe specific category)
    if (method === 'DELETE') {
      const body = await request.json();
      return await deletePreference(email, body, env, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Email preferences error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

/**
 * Handle one-click unsubscribe via token
 */
async function handleUnsubscribe(token, env, corsHeaders) {
  try {
    const unsubscribeData = await env.SPORTS_KV.get(`unsubscribe-token:${token}`);
    if (!unsubscribeData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired unsubscribe link' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { email, category } = JSON.parse(unsubscribeData);
    const userData = await env.SPORTS_KV.get(`user:${email}`);

    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = JSON.parse(userData);

    // Initialize email preferences if needed
    if (!user.emailPreferences) {
      user.emailPreferences = getDefaultPreferences();
    }

    // Disable specific category
    if (category === 'all') {
      user.emailNotificationsEnabled = false;
      user.unsubscribedAt = new Date().toISOString();
      user.unsubscribeReason = 'clicked-unsubscribe-link';
    } else if (user.emailPreferences[category]) {
      user.emailPreferences[category].enabled = false;
    }

    // Save updated user
    await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
      expirationTtl: 31536000,
    });

    // Delete token
    await env.SPORTS_KV.delete(`unsubscribe-token:${token}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Successfully unsubscribed' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process unsubscribe' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Get all email preferences for user
 */
async function getEmailPreferences(email, env, corsHeaders) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = JSON.parse(userData);
    const preferences = user.emailPreferences || getDefaultPreferences();

    return new Response(
      JSON.stringify({
        email: user.email,
        emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
        unsubscribedAt: user.unsubscribedAt || null,
        unsubscribeReason: user.unsubscribeReason || null,
        preferences: {
          matchReminders: preferences.matchReminders || { enabled: true },
          teamAlerts: preferences.teamAlerts || { enabled: true },
          playerUpdates: preferences.playerUpdates || { enabled: false },
          newsDigest: preferences.newsDigest || { enabled: true },
          weeklyRecap: preferences.weeklyRecap || { enabled: true },
          specialOffers: preferences.specialOffers || { enabled: false },
        },
        frequency: preferences.frequency || 'immediate',
        timezone: user.timezone || 'UTC',
        lastModified: user.preferencesModifiedAt || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Get preferences error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get preferences' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Update email preferences
 */
async function updateEmailPreferences(email, body, env, corsHeaders) {
  try {
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = JSON.parse(userData);
    const {
      emailNotificationsEnabled,
      preferences: newPrefs,
      frequency,
      timezone,
    } = body;

    // Update global email setting
    if (typeof emailNotificationsEnabled === 'boolean') {
      user.emailNotificationsEnabled = emailNotificationsEnabled;
      if (emailNotificationsEnabled) {
        delete user.unsubscribedAt;
        delete user.unsubscribeReason;
      }
    }

    // Update specific preferences
    if (!user.emailPreferences) {
      user.emailPreferences = getDefaultPreferences();
    }

    if (newPrefs) {
      Object.keys(newPrefs).forEach((key) => {
        if (user.emailPreferences[key]) {
          user.emailPreferences[key].enabled = newPrefs[key].enabled ?? true;
          if (newPrefs[key].frequency) {
            user.emailPreferences[key].frequency = newPrefs[key].frequency;
          }
        }
      });
    }

    // Update global frequency
    if (frequency && ['immediate', 'daily', 'weekly'].includes(frequency)) {
      user.emailPreferences.frequency = frequency;
    }

    // Update timezone
    if (timezone) {
      user.timezone = timezone;
    }

    user.preferencesModifiedAt = new Date().toISOString();

    // Save user
    await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
      expirationTtl: 31536000,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Preferences updated',
        preferences: user.emailPreferences,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Update preferences error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update preferences' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Delete specific preference category
 */
async function deletePreference(email, body, env, corsHeaders) {
  try {
    const { category } = body;
    const userData = await env.SPORTS_KV.get(`user:${email}`);

    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = JSON.parse(userData);
    if (!user.emailPreferences) {
      user.emailPreferences = getDefaultPreferences();
    }

    if (user.emailPreferences[category]) {
      user.emailPreferences[category].enabled = false;
    }

    user.preferencesModifiedAt = new Date().toISOString();
    await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
      expirationTtl: 31536000,
    });

    return new Response(
      JSON.stringify({ success: true, message: `${category} disabled` }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Delete preference error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete preference' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Get default email preferences structure
 */
function getDefaultPreferences() {
  return {
    matchReminders: { enabled: true, frequency: 'immediate' },
    teamAlerts: { enabled: true, frequency: 'immediate' },
    playerUpdates: { enabled: false, frequency: 'daily' },
    newsDigest: { enabled: true, frequency: 'daily' },
    weeklyRecap: { enabled: true, frequency: 'weekly' },
    specialOffers: { enabled: false, frequency: 'weekly' },
    frequency: 'immediate',
  };
}

/**
 * Generate unsubscribe token
 */
export function generateUnsubscribeToken(email, category = 'all') {
  const token = crypto.randomUUID();
  return {
    token,
    key: `unsubscribe-token:${token}`,
    data: { email, category },
    expiresIn: 30 * 24 * 60 * 60, // 30 days
  };
}
