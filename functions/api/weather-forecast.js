export const onRequest = async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  
  const groundId = searchParams.get('groundId');
  const days = parseInt(searchParams.get('days') || '3');
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const grounds = await getGroundsFromKV(env);
    const ground = grounds.find(g => g.id === groundId);
    
    if (!ground) {
      return new Response(
        JSON.stringify({ error: 'Ground not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const forecast = await fetchWeatherForecast(ground, env, days);
    
    return new Response(JSON.stringify({ forecast }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch weather forecast' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

async function fetchWeatherForecast(ground, env, days) {
  const API_KEY = env.OPENWEATHER_API_KEY || env.WEATHER_API_KEY;
  
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${ground.lat}&lon=${ground.lng}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    
    // Process forecast data
    const dailyForecasts = [];
    const processedDates = new Set();
    
    for (const item of data.list) {
      const date = item.dt_txt.split(' ')[0];
      
      if (!processedDates.has(date) && dailyForecasts.length < days) {
        processedDates.add(date);
        
        dailyForecasts.push({
          date: date,
          temperature: {
            min: item.main.temp_min,
            max: item.main.temp_max,
            avg: item.main.temp
          },
          condition: item.weather[0].main,
          description: item.weather[0].description,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          precipitation: item.pop * 100, // Probability of precipitation
          icon: item.weather[0].icon
        });
      }
    }
    
    return {
      groundId: ground.id,
      groundName: ground.name,
      forecasts: dailyForecasts,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to fetch forecast for ${ground.name}:`, error);
    throw error;
  }
}

async function getGroundsFromKV(env) {
  const groundsList = await env.SPORTS_KV.get('grounds:list');
  return groundsList ? JSON.parse(groundsList) : [];
}
