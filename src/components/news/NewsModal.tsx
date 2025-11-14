'use client';

import { useEffect, useState } from 'react';
import { Content } from '@/types';

interface NewsModalProps {
  isOpen: boolean;
  newsId: string;
  onClose: () => void;
}

export default function NewsModal({ isOpen, newsId, onClose }: NewsModalProps) {
  const [item, setItem] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchItem = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/content');
        if (!res.ok) throw new Error('Failed to fetch');
        const all: Content[] = await res.json();
        const found = all.find(c => c.id === newsId);
        setItem(found || null);
      } catch (err) {
        console.error('Failed to fetch news item:', err);
        setItem(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [isOpen, newsId]);

  const getImageSrc = (url?: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('//')) return window.location.protocol + trimmed;
    return trimmed;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="glass-effect rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header with close button */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-white/10 bg-black/40 backdrop-blur">
          <h2 className="text-2xl font-bold text-white truncate">
            {isLoading ? 'Loading...' : item?.title || 'News Article'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ipl-gold"></div>
            </div>
          ) : item ? (
            <div className="space-y-6">
              {/* Image */}
              {item.imageUrl && (
                <div className="w-full h-96 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-black">
                  <img
                    src={getImageSrc(item.imageUrl)}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Meta information */}
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="px-3 py-1 rounded-full bg-ipl-gold/20 text-ipl-gold border border-ipl-gold/30">
                  {item.type.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full border ${
                  item.isActive
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {item.isActive ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-4xl font-black text-white mb-2">{item.title}</h1>
              </div>

              {/* Content */}
              <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed">
                <div className="whitespace-pre-wrap text-base">{item.content}</div>
              </div>

              {/* Video if available */}
              {item.videoUrl && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-white mb-4">Video Content</h3>
                  <div className="w-full rounded-xl overflow-hidden bg-black">
                    <video
                      controls
                      className="w-full h-96 object-cover"
                      controlsList="nodownload"
                    >
                      <source src={item.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="pt-6 border-t border-white/10 flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-ipl-gold to-ipl-purple text-white font-semibold py-3 px-6 rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-300 text-lg">Article not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
