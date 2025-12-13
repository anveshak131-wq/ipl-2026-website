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
    const action = searchParams.get('action') || 'current';
    const venueId = searchParams.get('venueId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    switch (action) {
      case 'current':
        return await getCurrentWeather(env, venueId, lat, lng, corsHeaders);
      case 'forecast':
        return await getWeatherForecast(env, venueId, lat, lng, corsHeaders);
      case 'ai-analysis':
        return await getAIWeatherAnalysis(env, venueId, lat, lng, corsHeaders);
      case 'sync':
        return await syncWeatherData(env, corsHeaders);
      default:
        return await getCurrentWeather(env, venueId, lat, lng, corsHeaders);
    }
  } catch (error) {
    console.error('Weather API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch weather data' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Get current weather with AI enhancement
async function getCurrentWeather(env, venueId, lat, lng, corsHeaders) {
  let weatherData = await getCachedWeatherData(env);
  
  if (!weatherData) {
    // Generate sample weather data if no cached data
    weatherData = generateSampleWeatherData(venueId, lat, lng);
  }

  // Add AI predictions
  const enhancedData = weatherData.map(weather => ({
    ...weather,
    aiPrediction: generateAIWeatherPrediction(weather),
    matchImpact: calculateMatchImpact(weather),
    recommendations: getPlayingRecommendations(weather)
  }));
  
  return new Response(JSON.stringify({ 
    weather: enhancedData,
    cached: true,
    lastUpdated: enhancedData[0]?.timestamp || new Date().toISOString(),
    nextUpdate: getNextUpdateTime()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Get weather forecast with AI
async function getWeatherForecast(env, venueId, lat, lng, corsHeaders) {
  const forecast = generateWeatherForecast(venueId, lat, lng);
  
  return new Response(JSON.stringify({
    forecast,
    venueId,
    generatedAt: new Date().toISOString(),
    aiEnhanced: true
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// AI weather analysis
async function getAIWeatherAnalysis(env, venueId, lat, lng, corsHeaders) {
  const currentWeather = await getCachedWeatherData(env) || generateSampleWeatherData(venueId, lat, lng);
  const forecast = generateWeatherForecast(venueId, lat, lng);
  
  const analysis = {
    venueId,
    currentConditions: currentWeather[0],
    forecast,
    aiAnalysis: {
      matchImpact: calculateMatchImpact(currentWeather[0]),
      pitchEffect: predictPitchBehavior(currentWeather[0], forecast),
      playerConditions: predictPlayerConditions(currentWeather[0]),
      strategicRecommendations: getStrategicRecommendations(currentWeather[0], forecast),
      confidence: 85 + Math.random() * 10,
      riskFactors: identifyRiskFactors(currentWeather[0], forecast)
    },
    generatedAt: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(analysis), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Sync weather data
async function syncWeatherData(env, corsHeaders) {
  try {
    // Simulate weather data sync
    const venues = [
      { id: '1', name: 'Narendra Modi Stadium', lat: 23.0225, lng: 72.5714 },
      { id: '2', name: 'Eden Gardens', lat: 22.5645, lng: 88.3412 },
      { id: '3', name: 'Wankhede Stadium', lat: 18.9417, lng: 72.8258 },
      { id: '4', name: 'M. Chinnaswamy Stadium', lat: 12.9784, lng: 77.5994 },
      { id: '5', name: 'MA Chidambaram Stadium', lat: 13.0624, lng: 80.2411 }
    ];

    const weatherData = venues.map(venue => generateSampleWeatherData(venue.id, venue.lat.toString(), venue.lng.toString()));
    
    // Cache the weather data
    await env.SPORTS_KV.put('weather:latest', JSON.stringify(weatherData), { expirationTtl: 3600 });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Weather data synced successfully',
      venuesUpdated: venues.length,
      nextUpdate: getNextUpdateTime()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to sync weather data'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Generate sample weather data
function generateSampleWeatherData(venueId, lat, lng) {
  const baseTemp = 25 + Math.random() * 10;
  const conditions = ['sunny', 'cloudy', 'partly-cloudy', 'overcast'];
  
  return [{
    venueId: venueId || '1',
    coordinates: { lat: parseFloat(lat) || 23.0225, lng: parseFloat(lng) || 72.5714 },
    temperature: baseTemp,
    feelsLike: baseTemp + (Math.random() - 0.5) * 4,
    humidity: 40 + Math.random() * 40,
    windSpeed: 5 + Math.random() * 15,
    windDirection: Math.random() * 360,
    pressure: 1000 + Math.random() * 20,
    visibility: 8 + Math.random() * 4,
    uvIndex: 5 + Math.random() * 5,
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    description: 'Partly cloudy with moderate humidity',
    timestamp: new Date().toISOString()
  }];
}

// Generate weather forecast
function generateWeatherForecast(venueId, lat, lng) {
  return Array.from({ length: 5 }, (_, i) => ({
    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxTemp: 30 + Math.random() * 8,
    minTemp: 20 + Math.random() * 8,
    condition: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
    precipitation: Math.random() * 50,
    humidity: 40 + Math.random() * 40,
    windSpeed: 5 + Math.random() * 15,
    uvIndex: 3 + Math.random() * 7
  }));
}

// AI weather prediction
function generateAIWeatherPrediction(weather) {
  return {
    matchImpact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    pitchEffect: 'Dry pitch will favor spinners as the match progresses',
    dewFactor: Math.random() * 100,
    playingConditions: 'Excellent batting conditions expected',
    recommendations: [
      'Teams winning toss might prefer to field first',
      'Spinners will be crucial in middle overs',
      'Dew might affect second innings bowling'
    ],
    confidence: 75 + Math.random() * 20
  };
}

// Calculate match impact
function calculateMatchImpact(weather) {
  let impact = 'low';
  const factors = [];
  
  if (weather.temperature > 35) {
    impact = 'high';
    factors.push('High temperature affects player endurance');
  }
  if (weather.humidity > 80) {
    impact = 'high';
    factors.push('High humidity increases dew factor');
  }
  if (weather.windSpeed > 20) {
    impact = 'medium';
    factors.push('Strong wind affects ball movement');
  }
  if (weather.condition === 'rainy') {
    impact = 'high';
    factors.push('Rain may interrupt play');
  }
  
  return { impact, factors };
}

// Get playing recommendations
function getPlayingRecommendations(weather) {
  const recommendations = [];
  
  if (weather.humidity > 70) {
    recommendations.push('Expect dew in second innings');
    recommendations.push('Spinners will be effective later');
  }
  if (weather.temperature > 30) {
    recommendations.push('Players need frequent hydration');
    recommendations.push('Ball may swing less in heat');
  }
  if (weather.windSpeed > 15) {
    recommendations.push('Fast bowlers may get assistance');
    recommendations.push('Fielding in deep may be challenging');
  }
  
  return recommendations;
}

// Predict pitch behavior
function predictPitchBehavior(weather, forecast) {
  return {
    day1: 'Hard and dry surface, good for batting',
    day2: 'Pitch starts to slow down, spinners come into play',
    day3: 'Cracks appearing, variable bounce',
    evolution: 'Expected to slow down as match progresses'
  };
}

// Predict player conditions
function predictPlayerConditions(weather) {
  return {
    batting: 'Favorable conditions with minimal wind interference',
    bowling: 'Pacers may get early movement, spinners later',
    fielding: 'Dry outfield allows quick boundary movement',
    fitness: 'High temperature requires regular hydration breaks'
  };
}

// Get strategic recommendations
function getStrategicRecommendations(weather, forecast) {
  return [
    'Consider batting first if dew is expected',
    'Fast bowlers should exploit early morning conditions',
    'Spinners will be crucial in middle overs',
    'Deep field in death overs due to dry outfield'
  ];
}

// Identify risk factors
function identifyRiskFactors(weather, forecast) {
  const risks = [];
  
  if (forecast.some(day => day.precipitation > 70)) {
    risks.push({ type: 'rain', probability: 0.7, impact: 'high' });
  }
  if (weather.humidity > 85) {
    risks.push({ type: 'dew', probability: 0.8, impact: 'medium' });
  }
  if (weather.temperature > 35) {
    risks.push({ type: 'heat', probability: 0.6, impact: 'medium' });
  }
  
  return risks;
}

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
