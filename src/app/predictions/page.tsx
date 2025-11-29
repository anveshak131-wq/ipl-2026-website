'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import CustomEmoji from '@/components/emoji/CustomEmoji';

export default function PredictionsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page - predictions page is temporarily unavailable
    router.replace('/');
  }, [router]);

  // Show a brief message before redirect
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative py-16 min-h-screen overflow-hidden section-match-bg">
        <AuroraBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              className="mb-6"
            >
              <CustomEmoji type="target" size={80} animate={true} />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Predictions Coming Soon
            </h1>
            <p className="text-gray-300 text-lg mb-6 max-w-md">
              We're working on improving the predictions feature. It will be back soon with better AI-powered insights!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-ipl-gold to-ipl-purple rounded-lg text-white font-semibold hover:from-ipl-gold/90 hover:to-ipl-purple/90 transition-all duration-200 shadow-lg shadow-ipl-gold/20"
            >
              Go to Home
            </motion.button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
