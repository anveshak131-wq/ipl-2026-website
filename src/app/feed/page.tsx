'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function FeedPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-ipl-dark px-4">
        <div className="max-w-md w-full rounded-2xl bg-white/5 border border-white/15 p-6 text-center text-sm text-gray-200">
          <p className="font-semibold mb-1">The personalised feed is no longer available.</p>
          <p className="text-gray-400 text-xs">
            You can continue exploring live scores, stats, news, and AI predictions using the main
            navigation.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
