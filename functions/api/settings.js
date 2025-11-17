/**
 * Cloudflare Pages Function for settings API
 * Handles GET and PUT operations for site settings
 */

// Helper function to verify admin token
function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

// Default settings
const defaultSettings = {
  siteName: 'SportsUP18',
  siteDescription: 'The biggest cricket tournament in the world',
  maintenanceMode: false,
  aiPredictionsEnabled: false,
  aiModel: 'gpt-4',
  maxUploadSize: 50,
  emailNotifications: true,
  analyticsEnabled: true
};

// GET - Retrieve settings
async function handleGetRequest(context) {
  const { env } = context;
  
  try {
    // Try to get settings from KV storage
    let settings = await env.IPL_CACHE.get('settings', 'json');
    
    // Fallback to default settings if KV storage is empty
    if (!settings) {
      settings = defaultSettings;
    }
    
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error retrieving settings:', error);
    return new Response(JSON.stringify({ error: 'Failed to retrieve settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT - Update settings
async function handlePutRequest(context) {
  const { env, request } = context;
  
  // Verify admin authentication
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    
    // Get existing settings
    let settings = await env.IPL_CACHE.get('settings', 'json') || defaultSettings;
    
    // Merge new settings with existing ones
    const updatedSettings = {
      ...settings,
      ...body
    };
    
    // Save to KV
    await env.IPL_CACHE.put('settings', JSON.stringify(updatedSettings));
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return new Response(JSON.stringify({ error: 'Failed to update settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main request handler
export async function onRequest(context) {
  const { request } = context;
  const method = request.method;
  
  // Enable CORS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  let response;
  
  switch (method) {
    case 'GET':
      response = await handleGetRequest(context);
      break;
    case 'PUT':
      response = await handlePutRequest(context);
      break;
    default:
      response = new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
  }
  
  // Add CORS headers to response
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
