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
  const isAdminRoute = pathname?.startsWith('/ops/ipl') || pathname?.startsWith('/ops/wpl');
  const isWplAdmin = pathname?.startsWith('/ops/wpl');
  
  if (isAdminRoute) {
    // For admin routes, return children without TermsGuard
    return (
      <div className={`admin-root ${isWplAdmin ? 'wpl-admin-root' : 'ipl-admin-root'}`}>
        {children}
      </div>
    );
  }
  
  // For non-admin routes, apply TermsGuard
  return <TermsGuard>{children}</TermsGuard>;
}
