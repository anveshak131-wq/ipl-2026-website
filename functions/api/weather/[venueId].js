// Weather API for WPL stadiums
// Fetches weather data for Dr. DY Patil Sports Academy and BCA Stadium

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

// OpenWeatherMap API (you'll need to add your API key to environment variables)
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

export async function onRequestGet(context) {
  try {
    const { venueId } = context.params;
    
    if (!venueId || !WPL_VENUES[venueId]) {
      return new Response(JSON.stringify({ error: 'Invalid venue ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const venue = WPL_VENUES[venueId];
    
    // Fetch current weather
    const currentWeather = await fetch(
      `${WEATHER_API_URL}/weather?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    if (!currentWeather.ok) {
      throw new Error('Failed to fetch current weather');
    }
    
    const currentData = await currentWeather.json();
    
    // Fetch 5-day forecast
    const forecast = await fetch(
      `${WEATHER_API_URL}/forecast?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    if (!forecast.ok) {
      throw new Error('Failed to fetch weather forecast');
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
        visibility: currentData.visibility / 1000, // Convert to km
        uvIndex: 0, // OpenWeather free tier doesn't include UV index
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
        precipitation: item.pop * 100 // Probability of precipitation
      })),
      lastUpdated: new Date().toISOString()
    };
    
    // Store in KV for caching
    await context.env.WEATHER_CACHE.put(`weather_${venueId}`, JSON.stringify(weatherData), {
      expirationTtl: 43200 // 12 hours cache
    });
    
    return new Response(JSON.stringify(weatherData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Weather API error:', error);
    
    // Try to return cached data if available
    try {
      const cached = await context.env.WEATHER_CACHE.get(`weather_${venueId}`);
      if (cached) {
        return new Response(JSON.stringify(JSON.parse(cached)), {
          headers: { 
            'Content-Type': 'application/json',
            'X-Cached': 'true'
          }
        });
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch weather data',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
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

// Batch update endpoint for cron jobs
export async function onRequestPost(context) {
  try {
    const results = {};
    
    for (const [venueId, venue] of Object.entries(WPL_VENUES)) {
      try {
        // Fetch current weather
        const currentWeather = await fetch(
          `${WEATHER_API_URL}/weather?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
        );
        
        if (!currentWeather.ok) {
          throw new Error(`Failed to fetch weather for ${venue.name}`);
        }
        
        const currentData = await currentWeather.json();
        
        // Fetch 5-day forecast
        const forecast = await fetch(
          `${WEATHER_API_URL}/forecast?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
        );
        
        if (!forecast.ok) {
          throw new Error(`Failed to fetch forecast for ${venue.name}`);
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
          lastUpdated: new Date().toISOString()
        };
        
        // Store in KV
        await context.env.WEATHER_CACHE.put(`weather_${venueId}`, JSON.stringify(weatherData), {
          expirationTtl: 43200 // 12 hours cache
        });
        
        results[venueId] = { success: true, updated: new Date().toISOString() };
        
      } catch (error) {
        console.error(`Error updating weather for ${venue.name}:`, error);
        results[venueId] = { success: false, error: error.message };
      }
    }
    
    return new Response(JSON.stringify({
      message: 'Weather update completed',
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Batch weather update error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update weather data',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
