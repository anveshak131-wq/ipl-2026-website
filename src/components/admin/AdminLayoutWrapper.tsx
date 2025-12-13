'use client';

import { usePathname } from 'next/navigation';
import TermsGuard from '@/components/TermsGuard';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that conditionally applies TermsGuard
 * Admin routes bypass TermsGuard entirely
 */
export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const pathname = usePathname();
  
  // Check if current route is an admin route
  const isAdminRoute = pathname?.startsWith('/ipl-admin-2026') || pathname?.startsWith('/wpl-admin-2026');
  
  if (isAdminRoute) {
    // For admin routes, return children without TermsGuard
    return <>{children}</>;
  }
  
  // For non-admin routes, apply TermsGuard
  return <TermsGuard>{children}</TermsGuard>;
}
