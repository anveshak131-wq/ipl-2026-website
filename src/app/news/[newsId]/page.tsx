import NewsDetailClient from './NewsDetailClient';
import { NEWS_2027_ARTICLES } from '@/lib/news2027';

// Provide static params for all 2027 news items plus legacy IDs (fallback for static export)
export async function generateStaticParams() {
  const staticIds = new Set<string>(['1', '2', ...NEWS_2027_ARTICLES.map((item) => item.id)]);
  return Array.from(staticIds).map((newsId) => ({ newsId }));
}

export default function NewsDetailPage({ params }: { params: { newsId: string } }) {
  return <NewsDetailClient newsId={params.newsId} />;
}
