'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Content } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Props {
  newsId: string;
}

export default function NewsDetailClient({ newsId }: Props) {
  const router = useRouter();
  const [item, setItem] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const all = await api.getContent();
        const found = all.find((c: any) => c.id === newsId);
        setItem((found as Content) || null);
      } catch (err) {
        console.error('Failed to fetch news item:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [newsId]);

  const getImageSrc = (url?: string) => {
    if (!url) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"%3E%3Crect fill="%23333" width="800" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
    const trimmed = url.trim();
    if (trimmed.startsWith('//')) return window.location.protocol + trimmed;
    return trimmed;
  };

  if (isLoading) return <div className="min-h-screen"><div className="flex items-center justify-center h-96"><LoadingSpinner size="lg" /></div></div>;

  if (!item) return <div className="min-h-screen"><div className="flex items-center justify-center h-96 text-gray-300">News article not found.</div></div>;

  return (
    <div className="min-h-screen bg-ipl-dark text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button onClick={() => router.back()} className="mb-6 text-sm text-gray-300 hover:text-white">← Back</button>
        <h1 className="text-4xl font-black mb-4">{item.title}</h1>
        <div className="mb-6 relative w-full h-80 rounded-xl overflow-hidden">
          <Image
            src={getImageSrc(item.imageUrl)}
            alt={item.title}
            fill
            className="object-cover rounded-xl"
            priority
            sizes="(max-width: 768px) 100vw, 896px"
            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"%3E%3Crect fill="%23333" width="800" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'; }}
          />
        </div>
        <div className="prose prose-invert max-w-none text-gray-200">
          <p>{item.content}</p>
        </div>
      </div>
    </div>
  );
}
