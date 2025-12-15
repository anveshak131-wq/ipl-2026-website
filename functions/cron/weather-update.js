// Cron job for automatic weather updates
// Runs twice daily to update weather data for WPL stadiums

const WPL_VENUES = {
  'wpl-dy-patil': {
    name: 'Dr. DY Patil Sports Academy, Navi Mumbai',
    coordinates: { lat: 19.0471, lng: 73.0695 },
    city: 'Navi Mumbai'
  },
  'wpl-bca-stadium': {
    name: 'BCA Stadium, Kotambi (Vadodara)',
    coordinates: { lat: 22.3072, lng: 73.1812 },
    city: 'Vadodara'
  }
};

// OpenWeatherMap API
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

export async function scheduled(event, env, ctx) {
  // OpenWeatherMap API (you'll need to add your API key to environment variables)
  const WEATHER_API_KEY = env.OPENWEATHER_API_KEY || 'demo_key';
  
  console.log('Starting scheduled weather update for WPL stadiums');
  
  const results = {};
  const updateTimestamp = new Date().toISOString();
  
  for (const [venueId, venue] of Object.entries(WPL_VENUES)) {
    try {
      console.log(`Updating weather for ${venue.name}`);
      
      // Fetch current weather
      const currentWeather = await fetch(
        `${WEATHER_API_URL}/weather?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      if (!currentWeather.ok) {
        throw new Error(`Failed to fetch weather for ${venue.name}: ${currentWeather.status}`);
      }
      
      const currentData = await currentWeather.json();
      
      // Fetch 5-day forecast
      const forecast = await fetch(
        `${WEATHER_API_URL}/forecast?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      if (!forecast.ok) {
        throw new Error(`Failed to fetch forecast for ${venue.name}: ${forecast.status}`);
      }
      
      const forecastData = await forecast.json();
      
      // Process and format weather data
      const weatherData = {
        venueId,
        venueName: venue.name,
        city: venue.city,
        current: {
          temperature: Math.round(currentData.main.temp),
          feelsLike: Math.round(currentData.main.feels_like),
          humidity: currentData.main.humidity,
          windSpeed: currentData.wind.speed,
          windDirection: currentData.wind.deg,
          pressure: currentData.main.pressure,
          visibility: currentData.visibility / 1000,
          uvIndex: 0,
          condition: mapWeatherCondition(currentData.weather[0].main),
          description: currentData.weather[0].description,
          timestamp: new Date().toISOString()
        },
        forecast: forecastData.list.slice(0, 8).map(item => ({
          datetime: item.dt,
          temperature: Math.round(item.main.temp),
          feelsLike: Math.round(item.main.feels_like),
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          windDirection: item.wind.deg,
          condition: mapWeatherCondition(item.weather[0].main),
          description: item.weather[0].description,
          precipitation: item.pop * 100
        })),
        lastUpdated: updateTimestamp
      };
      
      // Store in KV with 12-hour expiration
      await env.WEATHER_CACHE.put(`weather_${venueId}`, JSON.stringify(weatherData), {
        expirationTtl: 43200 // 12 hours
      });
      
      // Also store a backup with longer expiration
      await env.WEATHER_CACHE.put(`weather_${venueId}_backup`, JSON.stringify(weatherData), {
        expirationTtl: 86400 // 24 hours
      });
      
      results[venueId] = { 
        success: true, 
        temperature: weatherData.current.temperature,
        condition: weatherData.current.condition,
        updated: updateTimestamp
      };
      
      console.log(`Successfully updated weather for ${venue.name}: ${weatherData.current.temperature}°C, ${weatherData.current.condition}`);
      
    } catch (error) {
      console.error(`Error updating weather for ${venue.name}:`, error);
      results[venueId] = { 
        success: false, 
        error: error.message,
        updated: updateTimestamp
      };
    }
  }
  
  // Store update summary
  const updateSummary = {
    timestamp: updateTimestamp,
    totalVenues: Object.keys(WPL_VENUES).length,
    successful: Object.values(results).filter(r => r.success).length,
    failed: Object.values(results).filter(r => !r.success).length,
    results
  };
  
  await env.WEATHER_CACHE.put('weather_update_summary', JSON.stringify(updateSummary), {
    expirationTtl: 86400 // 24 hours
  });
  
  console.log('Weather update completed:', updateSummary);
  
  // Optional: Send notification if there are failures
  const failures = Object.values(results).filter(r => !r.success);
  if (failures.length > 0) {
    console.warn(`${failures.length} weather updates failed:`, failures);
  }
  
  return updateSummary;
}

// Map OpenWeather conditions to our format
function mapWeatherCondition(condition) {
  const conditionMap = {
    'Clear': 'sunny',
    'Clouds': 'cloudy',
    'Rain': 'rainy',
    'Drizzle': 'rainy',
    'Thunderstorm': 'stormy',
    'Snow': 'snowy',
    'Mist': 'partly-cloudy',
    'Fog': 'partly-cloudy',
    'Haze': 'partly-cloudy'
  };
  
  return conditionMap[condition] || 'partly-cloudy';
}
