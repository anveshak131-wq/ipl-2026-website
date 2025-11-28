'use client';

import { useState } from 'react';
import RCBPremiumLogo from '@/components/RCBLion/RCBPremiumLogo';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import AuroraBackground from '@/components/ui/AuroraBackground';
import CustomEmoji from '@/components/emoji/CustomEmoji';

export default function RCBLionPage() {
  const [selectedSize, setSelectedSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [animated, setAnimated] = useState(true);
  const [showParticles, setShowParticles] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-900">
      <AuroraBackground />
      <Navbar />

      <main className="relative py-20 min-h-screen overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(236, 28, 36, 0.3), transparent)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-20 left-20 w-80 h-80 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.25), transparent)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
              <span
                style={{
                  background: 'linear-gradient(135deg, #EC1C24, #FFD700, #EC1C24)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'gradient-shift 3s ease infinite',
                }}
              >
                RCB Premium Logo
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the new Royal Challengers Bangalore logo with dynamic animations,
              premium effects, and modern design
            </p>
          </motion.div>

          {/* Logo Display Area */}
          <div className="flex flex-col items-center justify-center mb-16">
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <RCBPremiumLogo
                size={selectedSize}
                animated={animated}
                showParticles={showParticles}
                className="drop-shadow-2xl"
              />
            </motion.div>
          </div>

          {/* Controls */}
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Customize Your Experience
              </h2>

              <div className="space-y-6">
                {/* Size Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Logo Size
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                          selectedSize === size
                            ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-1">
                      Animations
                    </label>
                    <p className="text-xs text-gray-400">
                      Enable dynamic animations and effects
                    </p>
                  </div>
                  <button
                    onClick={() => setAnimated(!animated)}
                    className={`relative w-16 h-8 rounded-full transition-all ${
                      animated ? 'bg-red-600' : 'bg-gray-600'
                    }`}
                  >
                    <motion.div
                      className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full"
                      animate={{ x: animated ? 32 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Particles Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-1">
                      Energy Particles
                    </label>
                    <p className="text-xs text-gray-400">
                      Show animated particles around the logo
                    </p>
                  </div>
                  <button
                    onClick={() => setShowParticles(!showParticles)}
                    className={`relative w-16 h-8 rounded-full transition-all ${
                      showParticles ? 'bg-red-600' : 'bg-gray-600'
                    }`}
                  >
                    <motion.div
                      className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full"
                      animate={{ x: showParticles ? 32 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: 'sparkles',
                  title: 'Dynamic Animations',
                  description: 'Smooth, fluid animations that bring the logo to life',
                },
                {
                  icon: 'art',
                  title: 'Premium Design',
                  description: 'Modern, bold design with RCB brand colors',
                },
                {
                  icon: 'energy',
                  title: 'Interactive Effects',
                  description: 'Hover effects and responsive animations',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <div className="text-4xl mb-3 flex items-center justify-center">
                    <CustomEmoji type={feature.icon as any} size={48} animate={true} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
