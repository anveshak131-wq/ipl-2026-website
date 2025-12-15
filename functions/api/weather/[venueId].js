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

const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

export async function onRequestGet(context) {
  // OpenWeatherMap API (you'll need to add your API key to environment variables)
  const WEATHER_API_KEY = context.env.OPENWEATHER_API_KEY || 'demo_key';
  
  console.log('Weather API called for venue:', context.params.venueId);
  console.log('API Key available:', !!context.env.OPENWEATHER_API_KEY);
  console.log('Using API Key:', WEATHER_API_KEY === 'demo_key' ? 'demo_key' : 'real_key');
  
  try {
    const { venueId } = context.params;
    
    if (!venueId || !WPL_VENUES[venueId]) {
      console.log('Invalid venue ID:', venueId);
      return new Response(JSON.stringify({ error: 'Invalid venue ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const venue = WPL_VENUES[venueId];
    console.log('Fetching weather for:', venue.name, 'at coordinates:', venue.coordinates);
    
    let weatherData;
    
    // Try to fetch real weather data
    try {
      // Fetch current weather
      const currentWeather = await fetch(
        `${WEATHER_API_URL}/weather?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      console.log('OpenWeatherMap response status:', currentWeather.status);
      
      if (!currentWeather.ok) {
        throw new Error(`OpenWeatherMap API failed: ${currentWeather.status}`);
      }
      
      const currentData = await currentWeather.json();
      console.log('OpenWeatherMap data received:', currentData);
      
      // Fetch 5-day forecast
      const forecast = await fetch(
        `${WEATHER_API_URL}/forecast?lat=${venue.coordinates.lat}&lon=${venue.coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      if (!forecast.ok) {
        throw new Error(`OpenWeatherMap forecast failed: ${forecast.status}`);
      }
      
      const forecastData = await forecast.json();
      
      // Process and format weather data
      weatherData = {
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
      
      console.log('Processed weather data:', weatherData);
      
    } catch (apiError) {
      console.error('OpenWeatherMap API error:', apiError);
      console.log('Using fallback weather data for', venue.name);
      
      // Fallback to sample data if API fails
      weatherData = getFallbackWeatherData(venueId, venue);
    }
    
    // Store in KV for caching
    try {
      await context.env.WEATHER_CACHE.put(`weather_${venueId}`, JSON.stringify(weatherData), {
        expirationTtl: 43200 // 12 hours cache
      });
      console.log('Weather data cached for venue:', venueId);
    } catch (cacheError) {
      console.error('Cache storage error:', cacheError);
    }
    
    return new Response(JSON.stringify(weatherData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Weather API error:', error);
    
    // Try to return cached data if available
    try {
      const cached = await context.env.WEATHER_CACHE.get(`weather_${context.params.venueId}`);
      if (cached) {
        console.log('Returning cached weather data');
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
    
    // Return fallback data as last resort
    const venue = WPL_VENUES[context.params.venueId];
    const fallbackData = getFallbackWeatherData(context.params.venueId, venue);
    
    return new Response(JSON.stringify(fallbackData), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Fallback': 'true'
      }
    });
  }
}

// Fallback weather data when OpenWeatherMap API fails
function getFallbackWeatherData(venueId, venue) {
  const fallbackData = {
    'wpl-dy-patil': {
      venueId: 'wpl-dy-patil',
      venueName: venue.name,
      city: venue.city,
      current: {
        temperature: 30,
        feelsLike: 33,
        humidity: 70,
        windSpeed: 15,
        windDirection: 200,
        pressure: 1008,
        visibility: 9,
        uvIndex: 7,
        condition: 'partly-cloudy',
        description: 'Partly cloudy with coastal humidity',
        timestamp: new Date().toISOString(),
        aiPrediction: {
          matchImpact: 'medium',
          pitchEffect: 'Coastal conditions may help swing bowlers early',
          dewFactor: 80,
          playingConditions: 'Moderate humidity with sea breeze',
          recommendations: [
            'Pace bowlers effective in first 10 overs',
            'Dew expected in night matches',
            'Spinners crucial in middle overs'
          ],
          confidence: 87
        }
      },
      forecast: [],
      lastUpdated: new Date().toISOString()
    },
    'wpl-bca-stadium': {
      venueId: 'wpl-bca-stadium',
      venueName: venue.name,
      city: venue.city,
      current: {
        temperature: 28,
        feelsLike: 30,
        humidity: 55,
        windSpeed: 10,
        windDirection: 90,
        pressure: 1012,
        visibility: 10,
        uvIndex: 6,
        condition: 'sunny',
        description: 'Clear weather with moderate temperature',
        timestamp: new Date().toISOString(),
        aiPrediction: {
          matchImpact: 'low',
          pitchEffect: 'Balanced conditions for both bat and ball',
          dewFactor: 60,
          playingConditions: 'Ideal cricket conditions',
          recommendations: [
            'Balanced pitch favors all-rounders',
            'Minimal dew factor',
            'Good visibility throughout match'
          ],
          confidence: 92
        }
      },
      forecast: [],
      lastUpdated: new Date().toISOString()
    }
  };
  
  return fallbackData[venueId] || fallbackData['wpl-dy-patil'];
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
  // OpenWeatherMap API (you'll need to add your API key to environment variables)
  const WEATHER_API_KEY = context.env.OPENWEATHER_API_KEY || 'demo_key';
  
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
