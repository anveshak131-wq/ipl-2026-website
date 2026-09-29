'use client';

import AdminRouter from './AdminRouter';

// Force dynamic rendering to avoid static pre-rendering issues with Client Components
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return <AdminRouter />;
}

