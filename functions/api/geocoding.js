/**
 * Cloudflare Pages Function for geocoding venue searches
 * Uses multiple geocoding services to find venue information
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (!query) {
    return new Response(
      JSON.stringify({ error: 'Query parameter required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const results = [];

    // Try OpenCage Geocoding API (requires OPENCAGE_API_KEY)
    if (env.OPENCAGE_API_KEY) {
      try {
        const openCageResults = await searchOpenCage(query, env.OPENCAGE_API_KEY);
        results.push(...openCageResults);
      } catch (error) {
        console.error('OpenCage search failed:', error);
      }
    }

    // Try Nominatim (OpenStreetMap) - free but rate limited
    try {
      const nominatimResults = await searchNominatim(query);
      results.push(...nominatimResults);
    } catch (error) {
      console.error('Nominatim search failed:', error);
    }

    // Remove duplicates and limit results
    const uniqueResults = results.filter((result, index, self) =>
      index === self.findIndex(r => 
        Math.abs(r.lat - result.lat) < 0.001 && Math.abs(r.lng - result.lng) < 0.001
      )
    ).slice(0, 5);

    return new Response(JSON.stringify({ results: uniqueResults }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to search venues' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

async function searchOpenCage(query, apiKey) {
  const response = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query + ' stadium')}&key=${apiKey}&limit=3`
  );
  const data = await response.json();

  return data.results.map((result) => ({
    name: result.formatted.split(',')[0],
    city: result.components.city || result.components.town || result.components.village || 'Unknown',
    country: result.components.country || 'Unknown',
    lat: result.geometry.lat,
    lng: result.geometry.lng,
    timezone: result.annotations.timezone?.name || 'UTC',
    confidence: result.confidence || 0
  }));
}

async function searchNominatim(query) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' stadium')}&limit=3&addressdetails=1`,
    {
      headers: {
        'User-Agent': 'CricketVenueManager/1.0' // Required by Nominatim policy
      }
    }
  );
  const data = await response.json();

  return data.map((item) => ({
    name: item.display_name.split(',')[0],
    city: item.address?.city || item.address?.town || item.address?.village || 'Unknown',
    country: item.address?.country || 'Unknown',
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    timezone: 'UTC', // Nominatim doesn't provide timezone
    confidence: item.importance || 0
  }));
}
