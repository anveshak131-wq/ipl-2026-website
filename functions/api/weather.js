export const onRequest = async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Try to get cached weather data first (no API call)
    let weatherData = await getCachedWeatherData(env);
    
    if (!weatherData) {
      // If no cached data, return error instead of making API call
      return new Response(
        JSON.stringify({ 
          error: 'Weather data not available',
          message: 'Weather data is being updated. Please try again later.',
          nextUpdate: getNextUpdateTime()
        }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    return new Response(JSON.stringify({ 
      weather: weatherData,
      cached: true,
      lastUpdated: weatherData[0]?.weather?.timestamp || new Date().toISOString(),
      nextUpdate: getNextUpdateTime()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch weather data' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Get cached weather data from KV (no API calls)
async function getCachedWeatherData(env) {
  try {
    // First try latest cache
    const latestWeather = await env.SPORTS_KV.get('weather:latest');
    if (latestWeather) {
      return JSON.parse(latestWeather);
    }
    
    // If no latest, try today's morning/evening cache
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    const timeSlot = currentHour < 12 ? 'morning' : 'evening';
    
    const cachedWeather = await env.SPORTS_KV.get(`weather:${today}:${timeSlot}`);
    if (cachedWeather) {
      return JSON.parse(cachedWeather);
    }
    
    // Try the other time slot if current one doesn't exist
    const otherTimeSlot = currentHour < 12 ? 'evening' : 'morning';
    const otherCachedWeather = await env.SPORTS_KV.get(`weather:${today}:${otherTimeSlot}`);
    if (otherCachedWeather) {
      return JSON.parse(otherCachedWeather);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching cached weather:', error);
    return null;
  }
}

// Calculate next scheduled update time
function getNextUpdateTime() {
  const now = new Date();
  const currentHour = now.getUTCHours();
  
  // Next update is at 6 AM or 6 PM UTC
  if (currentHour < 6) {
    const nextUpdate = new Date(now);
    nextUpdate.setUTCHours(6, 0, 0, 0);
    return nextUpdate.toISOString();
  } else if (currentHour < 18) {
    const nextUpdate = new Date(now);
    nextUpdate.setUTCHours(18, 0, 0, 0);
    return nextUpdate.toISOString();
  } else {
    // Next update is tomorrow at 6 AM
    const nextUpdate = new Date(now);
    nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
    nextUpdate.setUTCHours(6, 0, 0, 0);
    return nextUpdate.toISOString();
  }
}
