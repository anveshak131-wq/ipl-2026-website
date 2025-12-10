'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Cloud, Wind, Droplets, Thermometer, Clock, Eye, TrendingUp } from 'lucide-react';
import AuroraBackground from '@/components/ui/AuroraBackground';
import GradientText from '@/components/ui/GradientText';
import AnimatedSection from '@/components/ui/AnimatedSection';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';

interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  established: number;
  pitchType: string;
  dimensions: string;
}

interface Weather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'overcast';
  lastUpdated: string;
}

interface MatchConditions {
  pitchReport: string;
  outfieldCondition: string;
  expectedDew: boolean;
  avgFirstInnings: number;
  avgChasing: number;
  tossImpact: string;
}

export default function WPLMatchDayPage() {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [matchConditions, setMatchConditions] = useState<MatchConditions | null>(null);

  useEffect(() => {
    // Load WPL-specific data
    const venues: Venue[] = [
      {
        id: '1',
        name: 'M. Chinnaswamy Stadium',
        city: 'Bengaluru',
        capacity: 38000,
        established: 1969,
        pitchType: 'Red Soil',
        dimensions: '64m x 64m'
      },
      {
        id: '2',
        name: 'M. A. Chidambaram Stadium',
        city: 'Chennai',
        capacity: 50000,
        established: 1916,
        pitchType: 'Black Soil',
        dimensions: '66m x 66m'
      },
      {
        id: '3',
        name: 'Eden Gardens',
        city: 'Kolkata',
        capacity: 66000,
        established: 1864,
        pitchType: 'Red Soil',
        dimensions: '66m x 66m'
      }
    ];

    // Set default venue
    setSelectedVenue(venues[0]);
    
    // Load mock weather data
    setWeather({
      temperature: 28,
      humidity: 70,
      windSpeed: 15,
      condition: 'cloudy',
      lastUpdated: new Date().toISOString()
    });

    // Load mock match conditions
    setMatchConditions({
      pitchReport: 'Balanced pitch with good bounce, expected to assist both batters and bowlers equally',
      outfieldCondition: 'Excellent and well-maintained',
      expectedDew: true,
      avgFirstInnings: 145,
      avgChasing: 135,
      tossImpact: 'Team winning toss likely to bowl first due to expected dew in the evening'
    });
  }, []);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'text-yellow-400';
      case 'cloudy': return 'text-gray-400';
      case 'rainy': return 'text-blue-400';
      case 'overcast': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <AuroraBackground />
      <WPLFloatingParticles />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AnimatedSection>
            <div className="text-center mb-8">
              <GradientText className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400">
                WPL Match Day Experience
              </GradientText>
              <p className="text-gray-300 text-lg">
                Complete venue information, weather updates, and match conditions for Women's Premier League
              </p>
            </div>
          </AnimatedSection>

          {/* Venue Information */}
          <AnimatedSection delay={0.2}>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="text-purple-400" />
                Venue Information
              </h2>
              
              {selectedVenue && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-purple-300 mb-3">{selectedVenue.name}</h3>
                    <div className="space-y-2 text-gray-300">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{selectedVenue.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Est. {selectedVenue.established}</span>
                      </div>
                      <div>Capacity: {selectedVenue.capacity.toLocaleString()}</div>
                      <div>Pitch Type: {selectedVenue.pitchType}</div>
                      <div>Dimensions: {selectedVenue.dimensions}</div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-900/20 rounded-lg p-4">
                    <h4 className="text-purple-300 font-semibold mb-2">Venue Features</h4>
                    <ul className="text-gray-300 space-y-1 text-sm">
                      <li>• Modern floodlights for day-night matches</li>
                      <li>• Excellent drainage system</li>
                      <li>• Premium hospitality facilities</li>
                      <li>• Women's cricket specific amenities</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Weather Conditions */}
          <AnimatedSection delay={0.4}>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Cloud className="text-purple-400" />
                Weather Conditions
              </h2>
              
              {weather && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-purple-900/20 rounded-lg p-4 text-center">
                    <Thermometer className="mx-auto mb-2 text-orange-400" size={24} />
                    <div className="text-2xl font-bold text-white">{weather.temperature}°C</div>
                    <div className="text-gray-300 text-sm">Temperature</div>
                  </div>
                  
                  <div className="bg-purple-900/20 rounded-lg p-4 text-center">
                    <Droplets className="mx-auto mb-2 text-blue-400" size={24} />
                    <div className="text-2xl font-bold text-white">{weather.humidity}%</div>
                    <div className="text-gray-300 text-sm">Humidity</div>
                  </div>
                  
                  <div className="bg-purple-900/20 rounded-lg p-4 text-center">
                    <Wind className="mx-auto mb-2 text-gray-400" size={24} />
                    <div className="text-2xl font-bold text-white">{weather.windSpeed} km/h</div>
                    <div className="text-gray-300 text-sm">Wind Speed</div>
                  </div>
                  
                  <div className="bg-purple-900/20 rounded-lg p-4 text-center">
                    <Cloud className={`mx-auto mb-2 ${getConditionColor(weather.condition)}`} size={24} />
                    <div className="text-xl font-bold text-white capitalize">{weather.condition}</div>
                    <div className="text-gray-300 text-sm">Condition</div>
                  </div>
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Match Conditions */}
          <AnimatedSection delay={0.6}>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Eye className="text-purple-400" />
                Match Conditions
              </h2>
              
              {matchConditions && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Pitch Report</h3>
                    <p className="text-gray-300">{matchConditions.pitchReport}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Outfield Condition</h3>
                    <p className="text-gray-300">{matchConditions.outfieldCondition}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-300 mb-2">Score Expectations</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Average 1st Innings:</span>
                          <span className="text-white font-semibold">{matchConditions.avgFirstInnings} runs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Average Chasing:</span>
                          <span className="text-white font-semibold">{matchConditions.avgChasing} runs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Dew Expected:</span>
                          <span className={`font-semibold ${matchConditions.expectedDew ? 'text-blue-400' : 'text-gray-400'}`}>
                            {matchConditions.expectedDew ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-purple-300 mb-2">Toss Impact</h3>
                      <p className="text-gray-300">{matchConditions.tossImpact}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Key Insights */}
          <AnimatedSection delay={0.8}>
            <div className="mt-8 bg-purple-900/20 rounded-xl p-6 border border-purple-400/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-purple-400" />
                Key Insights for WPL
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
                <div>
                  <h4 className="text-purple-300 font-semibold mb-2">Batting Friendly</h4>
                  <p className="text-sm">Most WPL venues favor batters with shorter boundaries and flat pitches</p>
                </div>
                <div>
                  <h4 className="text-purple-300 font-semibold mb-2">Powerplay Impact</h4>
                  <p className="text-sm">First 6 overs crucial in WPL with aggressive batting approach</p>
                </div>
                <div>
                  <h4 className="text-purple-300 font-semibold mb-2">Death Overs Specialists</h4>
                  <p className="text-sm">Bowling in final overs often decides match outcomes in women's cricket</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
