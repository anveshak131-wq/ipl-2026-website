'use client';

import ContentManager from '@/app/ipl-admin-2026/content/ContentManager';

export default function AdminNewsPage() {
  return (
    <ContentManager
      initialType="news"
      restrictToType="news"
      currentPagePath="/ipl-admin-2026/news"
    />
  );
}
