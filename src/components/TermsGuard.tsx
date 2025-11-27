"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PUBLIC_ROUTES_WITHOUT_TERMS, getTermsAcceptanceStatus } from "@/lib/terms-access";

interface TermsGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side wrapper that enforces terms acceptance
 * Redirects to /terms if user hasn't accepted
 * Allows whitelisted routes to be accessed without acceptance
 * 
 * Features:
 * - Keyboard navigation (Escape to close)
 * - ARIA labels for accessibility
 * - Loading state with animated spinner
 * - Route whitelisting
 * - localStorage persistence
 */
export default function TermsGuard({ children }: TermsGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    // Check if current route is whitelisted (doesn't require terms acceptance)
    const isPublicRoute = PUBLIC_ROUTES_WITHOUT_TERMS.some(route => {
      if (route.endsWith("/")) {
        return pathname.startsWith(route);
      }
      return pathname === route || pathname.startsWith(route + "/");
    });

    if (isPublicRoute) {
      // Public route, allow access
      setCanAccess(true);
      setIsChecking(false);
      return;
    }

    // Check terms acceptance
    const { isAccepted } = getTermsAcceptanceStatus();

    if (!isAccepted) {
      // Terms not accepted, redirect to terms page
      // Store the intended destination for redirect after acceptance
      sessionStorage.setItem("terms_redirect_after", pathname);
      router.push("/terms");
      return;
    }

    // Terms accepted, allow access
    setCanAccess(true);
    setIsChecking(false);
  }, [pathname, router]);

  // Handle Escape key to close loading modal (accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isChecking) {
        // Escape during loading redirects to terms
        sessionStorage.setItem("terms_redirect_after", pathname);
        router.push("/terms");
      }
    };

    if (isChecking) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isChecking, pathname, router]);

  if (isChecking) {
    // Show loading state while checking
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800"
        role="status"
        aria-label="Verifying access..."
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            aria-hidden="true"
          />
          <p className="text-white text-lg">Verifying access...</p>
          <p className="text-gray-400 text-sm mt-2">Press Escape to go to terms page</p>
        </div>
      </motion.div>
    );
  }

  if (!canAccess) {
    // This shouldn't happen as we redirect above, but as a safety net
    return null;
  }

  return (
    <AnimatePresence>
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
