import NewsDetailClient from './NewsDetailClient';

// Provide static params for known news items (fallback for static export)
export async function generateStaticParams() {
  const defaultNews = [
    { newsId: '1' },
    { newsId: '2' }
  ];
  return defaultNews;
}

export default function NewsDetailPage({ params }: { params: { newsId: string } }) {
  return <NewsDetailClient newsId={params.newsId} />;
}
