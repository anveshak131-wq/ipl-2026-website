'use client';

import ContentManager from '@/app/ops/ipl/content/ContentManager';

export default function AdminNewsPage() {
  return (
    <ContentManager
      initialType="news"
      restrictToType="news"
      currentPagePath="/ops/ipl/news"
    />
  );
}
