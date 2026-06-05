'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, BarChart3, Users, Shield, Smartphone, Sparkles } from 'lucide-react';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export default function ModernFeatureShowcase() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features: Feature[] = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Ball-by-ball Updates',
      description: 'Follow every over with live scores, wickets, boundaries, toss notes, and innings breaks as the match moves.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Scorecard Analytics',
      description: 'Track batting strike rates, bowling economy, partnerships, NRR, Orange Cap, and Purple Cap movement.',
      color: 'from-teal-500 to-cyan-500',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Fan Predictions',
      description: 'Pick winners, compare form, and follow leaderboard swings through the league stage and playoffs.',
      color: 'from-violet-500 to-fuchsia-500',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure Accounts',
      description: 'Keep profiles, preferences, notifications, and prediction history protected behind authenticated access.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Matchday Mobile',
      description: 'Use compact cards, touch-friendly filters, and fast score views from the stadium, sofa, or commute.',
      color: 'from-sky-500 to-blue-500',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI Match Notes',
      description: 'Turn live moments into readable summaries for milestones, collapses, chase pressure, and title-race context.',
      color: 'from-rose-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-bold">
          <span className="gradient-text-warm">Matchday Tools</span> for IPL Fans
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Live scorecards, table context, alerts, and predictions built around the way T20 cricket changes ball by ball.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoveredFeature(idx)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <AnimatedCard
              delay={idx}
              hover="lift"
              className="h-full p-8 relative overflow-hidden group"
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />

              {/* Icon */}
              <div
                className={`inline-flex p-4 rounded-lg bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                {feature.icon}
              </div>

              {/* Content */}
              <div className="relative z-10 space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-ipl-gold transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>

              {/* Animated border */}
              <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/20 transition-colors" />

              {/* Hover indicator */}
              {hoveredFeature === idx && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-ipl-gold to-transparent" />
              )}
            </AnimatedCard>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-16 text-center">
        <p className="text-gray-400 mb-6">Jump back into the live scorecard whenever the match is on.</p>
        <Link href="/live-score?league=ipl" className="group relative inline-flex overflow-hidden rounded-xl px-8 py-4 text-lg font-bold">
          <div className="absolute inset-0 bg-gradient-to-r from-ipl-gold to-yellow-400 transition-transform duration-300 group-hover:scale-110" />
          <div className="relative text-black flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Open Live Scorecard
          </div>
        </Link>
      </div>
    </div>
  );
}
