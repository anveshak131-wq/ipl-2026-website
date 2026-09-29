"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PUBLIC_ROUTES_WITHOUT_TERMS, getTermsAcceptanceStatus } from "@/lib/terms-access";

interface TermsGuardProps {
  children: React.ReactNode;
}

export default function TermsGuard({ children }: TermsGuardProps) {
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 1. Always allow admin routes
    if (pathname.startsWith('/ops') || pathname.startsWith('/admin')) {
      setIsChecking(false);
      return;
    }

    // 2. Always allow homepage, terms, privacy, and legal
    if (pathname === '/' || pathname === '/terms' || pathname === '/privacy' || pathname === '/legal') {
      setIsChecking(false);
      return;
    }

    // 3. Check whitelisted public routes
    const isPublicRoute = PUBLIC_ROUTES_WITHOUT_TERMS?.some((route) => {
      if (route.endsWith("/")) {
        return pathname.startsWith(route);
      }
      return pathname === route || pathname.startsWith(route + "/");
    });

    if (isPublicRoute) {
      setIsChecking(false);
      return;
    }

    // 4. Default: allow content rendering so search bots and users are not stuck
    const { isAccepted } = getTermsAcceptanceStatus();
    if (!isAccepted && pathname !== "/") {
      sessionStorage.setItem("terms_redirect_after", pathname);
    }

    setIsChecking(false);
  }, [pathname]);

  if (isChecking) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-slate-950"
        role="status"
        aria-label="Loading sports hub..."
      >
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
