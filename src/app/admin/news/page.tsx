'use client';

import { ContentManager } from '@/app/admin/content/page';

export default function AdminNewsPage() {
  return (
    <ContentManager
      initialType="news"
      restrictToType="news"
      currentPagePath="/admin/news"
    />
  );
}
