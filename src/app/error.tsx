'use client';

import { useEffect } from 'react';

export default function GlobalErrorHandler({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // If a deployed chunk is missing (404 / ChunkLoadError), force a full reload to fetch new bundles
    if (
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch')
    ) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center text-white">
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-sm text-zinc-400 mb-4">A fresh version of this page is loading...</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-pink-600 hover:bg-pink-500 rounded-lg text-sm font-semibold transition"
      >
        Reload Page
      </button>
    </div>
  );
}
