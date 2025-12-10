// Weather scheduler - runs twice daily (6 AM and 6 PM UTC) to update weather for all venues
export async function scheduled(event, env, ctx) {
  console.log('Running weather scheduler...');
  const venues = await getVenuesFromKV(env);
  const weatherData = await fetchWeatherForAllVenues(venues, env);
  await storeWeatherData(env, weatherData);
  console.log(`Updated weather for ${venues.length} venues`);
}

async function getVenuesFromKV(env) {
  // Get all venues from KV store
  const venuesList = await env.SPORTS_KV.get('venues:list');
  return venuesList ? JSON.parse(venuesList) : [];
}

async function fetchWeatherForAllVenues(venues, env) {
  const API_KEY = env.WEATHER_API_KEY;
  const results = [];
  
  for (const venue of venues) {
    try {
      // WeatherAPI current weather endpoint
      const weather = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${venue.lat},${venue.lng}&aqi=no`
      );
      const data = await weather.json();
      
      if (data.current) {
        results.push({
          venueId: venue.id,
          venueName: venue.name,
          weather: {
            temperature: data.current.temp_c,
            condition: data.current.condition.text,
            conditionCode: data.current.condition.code,
            humidity: data.current.humidity,
            windSpeed: data.current.wind_kph,
            windDirection: data.current.wind_dir,
            pressure: data.current.pressure_mb,
            visibility: data.current.vis_km,
            uvIndex: data.current.uv,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error(`Failed to fetch weather for ${venue.name}:`, error);
      results.push({
        venueId: venue.id,
        venueName: venue.name,
        error: 'Weather data unavailable'
      });
    }
  }
  
  return results;
}

async function storeWeatherData(env, weatherData) {
  const today = new Date().toISOString().split('T')[0];
  const timeSlot = new Date().getHours() < 12 ? 'morning' : 'evening';
  const cacheKey = `weather:${today}:${timeSlot}`;
  
  // Store with 24 hour expiration
  await env.SPORTS_KV.put(cacheKey, JSON.stringify(weatherData), {
    expirationTtl: 24 * 60 * 60 // 24 hours
  });
  
  // Also store latest weather for quick access
  await env.SPORTS_KV.put('weather:latest', JSON.stringify(weatherData), {
    expirationTtl: 12 * 60 * 60 // 12 hours
  });
}
