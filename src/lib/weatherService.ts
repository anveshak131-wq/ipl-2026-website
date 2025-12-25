interface WeatherAPIResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
  };
}

interface VenueWeatherData {
  venueId: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  condition: 'sunny' | 'cloudy' | 'partly-cloudy' | 'overcast' | 'rainy';
  description: string;
  timestamp: string;
  aiPrediction: {
    matchImpact: 'low' | 'medium' | 'high';
    pitchEffect: string;
    dewFactor: number;
    playingConditions: string;
    recommendations: string[];
    confidence: number;
  };
}

// Venue coordinates for IPL and WPL stadiums
const VENUE_COORDINATES = {
  // IPL venues
  wankhede: { lat: 19.0, lng: 72.85, city: 'Mumbai' },
  chennai: { lat: 13.0827, lng: 80.2707, city: 'Chennai' },
  bengaluru: { lat: 12.9784, lng: 77.5998, city: 'Bengaluru' },
  kolkata: { lat: 22.5697, lng: 88.3697, city: 'Kolkata' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad' },
  delhi: { lat: 28.6369, lng: 77.2447, city: 'Delhi' },
  jaipur: { lat: 26.9236, lng: 75.8235, city: 'Jaipur' },
  hyderabad: { lat: 17.3850, lng: 78.4867, city: 'Hyderabad' },
  mohali: { lat: 30.6967, lng: 76.7394, city: 'Mohali' },
  dharamsala: { lat: 32.2401, lng: 76.3294, city: 'Dharamsala' },
  visakhapatnam: { lat: 17.7274, lng: 83.3191, city: 'Visakhapatnam' },
  lucknow: { lat: 26.7606, lng: 80.9394, city: 'Lucknow' },
  pune: { lat: 18.5408, lng: 73.8394, city: 'Pune' },
  mullanpur: { lat: 30.7173, lng: 76.5806, city: 'Mullanpur' },
  guwahati: { lat: 26.1258, lng: 91.7394, city: 'Guwahati' },
  indore: { lat: 22.7186, lng: 75.8577, city: 'Indore' },
  ranchi: { lat: 23.3441, lng: 85.3096, city: 'Ranchi' },
  kanpur: { lat: 26.4750, lng: 80.3319, city: 'Kanpur' },
  cuttack: { lat: 20.4625, lng: 85.8828, city: 'Cuttack' },
  barsapara: { lat: 26.1258, lng: 91.7394, city: 'Guwahati' },
  // WPL venues
  'wpl-dy-patil': { lat: 19.0, lng: 73.2, city: 'Navi Mumbai' },
  'wpl-bca-stadium': { lat: 22.3, lng: 73.2, city: 'Vadodara' }
};

// Pitch types for venues
const VENUE_PITCH_TYPES = {
  // IPL venues
  wankhede: 'Clay Soil',
  chennai: 'Clay and Red Soil',
  bengaluru: 'Red Soil',
  kolkata: 'Black Cotton Soil',
  ahmedabad: 'Mixed Soil',
  delhi: 'Black Soil',
  jaipur: 'Red Soil',
  hyderabad: 'Black Soil',
  mohali: 'Red Soil',
  dharamsala: 'Black Soil',
  visakhapatnam: 'Red Soil',
  lucknow: 'Coarse Soil',
  pune: 'Black Soil',
  mullanpur: 'Red Soil',
  guwahati: 'Red Soil',
  indore: 'Red Soil',
  ranchi: 'Red Soil',
  kanpur: 'Red Soil',
  cuttack: 'Red Soil',
  barsapara: 'Red Soil',
  // WPL venues
  'wpl-dy-patil': 'Clay Soil',
  'wpl-bca-stadium': 'Red Soil'
};

class WeatherService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || '';
    this.baseUrl = 'https://api.weatherapi.com/v1';
  }

  private mapWeatherCondition(condition: string): 'sunny' | 'cloudy' | 'partly-cloudy' | 'overcast' | 'rainy' {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return 'sunny';
    if (conditionLower.includes('partly cloudy') || conditionLower.includes('partly sunny')) return 'partly-cloudy';
    if (conditionLower.includes('cloudy') && !conditionLower.includes('partly')) return 'cloudy';
    if (conditionLower.includes('overcast')) return 'overcast';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle') || conditionLower.includes('shower')) return 'rainy';
    return 'sunny'; // default
  }

  private generateAIPrediction(weather: WeatherAPIResponse, venueId: string): VenueWeatherData['aiPrediction'] {
    const temp = weather.current.temp_c;
    const humidity = weather.current.humidity;
    const windSpeed = weather.current.wind_kph;
    const pitchType = VENUE_PITCH_TYPES[venueId as keyof typeof VENUE_PITCH_TYPES];
    const city = VENUE_COORDINATES[venueId as keyof typeof VENUE_COORDINATES].city;

    let matchImpact: 'low' | 'medium' | 'high' = 'medium';
    let pitchEffect = '';
    let dewFactor = 70;
    let playingConditions = '';
    let recommendations: string[] = [];
    let confidence = 85;

    // Generate AI predictions based on weather and pitch type
    if (temp > 35 && humidity > 70) {
      matchImpact = 'high';
      pitchEffect = 'High temperature and humidity will favor spinners significantly';
      dewFactor = 85 + Math.floor(Math.random() * 10);
      playingConditions = 'Very hot and humid conditions';
      recommendations = [
        'Spinners will dominate middle overs',
        'High dew factor expected in evening',
        'Teams winning toss might prefer to field first'
      ];
      confidence = 90 + Math.floor(Math.random() * 8);
    } else if (temp < 20 || humidity < 30) {
      matchImpact = 'medium';
      pitchEffect = 'Cool conditions will provide good bounce and carry';
      dewFactor = 40 + Math.floor(Math.random() * 20);
      playingConditions = 'Cool and dry conditions';
      recommendations = [
        'Pace bowlers will get good bounce',
        'Low dew factor expected',
        'Ideal conditions for batting'
      ];
      confidence = 85 + Math.floor(Math.random() * 10);
    } else if (windSpeed > 20) {
      matchImpact = 'high';
      pitchEffect = 'Strong winds will affect batting and swing bowling';
      dewFactor = 60 + Math.floor(Math.random() * 15);
      playingConditions = 'Windy conditions affecting ball movement';
      recommendations = [
        'Strong winds will aid swing bowlers',
        'Batting will be challenging in crosswinds',
        'Fielding team needs to adjust to wind conditions'
      ];
      confidence = 88 + Math.floor(Math.random() * 8);
    } else {
      // Normal conditions
      matchImpact = 'medium';
      pitchEffect = `${pitchType} provides balanced conditions for both bat and ball`;
      dewFactor = 65 + Math.floor(Math.random() * 15);
      playingConditions = 'Moderate weather with balanced pitch conditions';
      recommendations = [
        `${pitchType} offers traditional playing characteristics`,
        'Both teams should find balanced conditions',
        'Moderate dew factor expected'
      ];
      confidence = 85 + Math.floor(Math.random() * 10);
    }

    return {
      matchImpact,
      pitchEffect,
      dewFactor,
      playingConditions,
      recommendations,
      confidence
    };
  }

  async fetchWeatherForVenue(venueId: string): Promise<VenueWeatherData> {
    try {
      const coords = VENUE_COORDINATES[venueId as keyof typeof VENUE_COORDINATES];
      if (!coords) {
        throw new Error(`Coordinates not found for venue: ${venueId}`);
      }

      const response = await fetch(
        `${this.baseUrl}/current.json?key=${this.apiKey}&q=${coords.lat},${coords.lng}&aqi=no`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data: WeatherAPIResponse = await response.json();

      const weatherData: VenueWeatherData = {
        venueId,
        temperature: Math.round(data.current.temp_c),
        feelsLike: Math.round(data.current.feelslike_c),
        humidity: data.current.humidity,
        windSpeed: Math.round(data.current.wind_kph),
        windDirection: data.current.wind_degree,
        pressure: data.current.pressure_mb,
        visibility: data.current.vis_km,
        uvIndex: data.current.uv,
        condition: this.mapWeatherCondition(data.current.condition.text),
        description: `${data.current.condition.text} in ${coords.city}`,
        timestamp: new Date().toISOString(),
        aiPrediction: this.generateAIPrediction(data, venueId)
      };

      return weatherData;
    } catch (error) {
      console.error(`Error fetching weather for venue ${venueId}:`, error);
      // Return fallback weather data
      return this.getFallbackWeatherData(venueId);
    }
  }

  async fetchWeatherForAllVenues(forceUpdate: boolean = false): Promise<VenueWeatherData[]> {
    const venueIds = Object.keys(VENUE_COORDINATES);
    const weatherPromises = venueIds.map(venueId => this.fetchWeatherForVenue(venueId, forceUpdate));
    
    try {
      const results = await Promise.allSettled(weatherPromises);
      return results
        .filter((result): result is PromiseFulfilledResult<VenueWeatherData> => result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      console.error('Error fetching weather for all venues:', error);
      return [];
    }
  }

  private getFallbackWeatherData(venueId: string): VenueWeatherData {
    const coords = VENUE_COORDINATES[venueId as keyof typeof VENUE_COORDINATES];
    const pitchType = VENUE_PITCH_TYPES[venueId as keyof typeof VENUE_PITCH_TYPES];

    return {
      venueId,
      temperature: 28,
      feelsLike: 30,
      humidity: 60,
      windSpeed: 15,
      windDirection: 180,
      pressure: 1013,
      visibility: 10,
      uvIndex: 6,
      condition: 'partly-cloudy',
      description: `Weather data unavailable for ${coords?.city || venueId}`,
      timestamp: new Date().toISOString(),
      aiPrediction: {
        matchImpact: 'medium',
        pitchEffect: `${pitchType} provides balanced conditions`,
        dewFactor: 70,
        playingConditions: 'Moderate conditions',
        recommendations: [
          'Weather data temporarily unavailable',
          'Using standard venue conditions'
        ],
        confidence: 75
      }
    };
  }
}

export const weatherService = new WeatherService();
export type { VenueWeatherData, WeatherAPIResponse };
