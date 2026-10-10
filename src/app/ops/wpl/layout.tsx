'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import AdminLogin from "@/components/admin/AdminLogin";
import WPLAdminSidebarNew from "@/components/admin/WPLAdminSidebarNew";
import { LeagueProvider } from "@/contexts/LeagueContext";
import { AdminDataProvider } from "@/contexts/AdminDataContext";
import {
  ADMIN_CSRF_HEADER,
  clearAdminCsrfToken,
  getAdminCsrfToken,
  installAdminCsrfFetch,
  setAdminCsrfToken,
} from "@/lib/admin/csrf";

export default function WPLOpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const hasCheckedAuth = useRef(false);
  const isIndexRoute = pathname === "/ops/wpl" || pathname === "/ops/wpl/";

  const getStoredAdminToken = () => {
    try {
      return (
        localStorage.getItem("adminToken") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("authToken")
      );
    } catch {
      return null;
    }
  };

  const storeAdminToken = (token: string) => {
    if (!token) return;
    try {
      localStorage.setItem("adminToken", token);
      localStorage.setItem("auth_token", token);
      localStorage.setItem("authToken", token);
    } catch {}
  };

  const parseRoleFromToken = (token: string) => {
    try {
      const tokenPayload = JSON.parse(atob(token));
      return tokenPayload.role || null;
    } catch {
      return null;
    }
  };

  const handleLogout = async () => {
    setIsSearchOpen(false);
    setUserRole(null);
    setIsAuthenticated(false);

    const token = getStoredAdminToken();
    try {
      const csrfToken = getAdminCsrfToken();
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: csrfToken ? { [ADMIN_CSRF_HEADER]: csrfToken } : undefined,
      });
    } catch {
      try {
        await fetch("/api/auth?action=signout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } catch {}
    }

    clearAdminCsrfToken();
    try {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("authToken");
    } catch {}

    router.replace("/ops/wpl");
  };

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;
    installAdminCsrfFetch();

    const checkAuth = async () => {
      try {
        const googleSessionResponse = await fetch("/api/admin/session", {
          credentials: "include",
          cache: "no-store",
        });

        if (googleSessionResponse.ok) {
          const data = await googleSessionResponse.json();
          if (data.success && data.token) {
            storeAdminToken(data.token);
            setAdminCsrfToken(data.csrfToken);
            setIsAuthenticated(true);
            setUserRole(data.user?.role || "super_admin");
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      const token = getStoredAdminToken();

      try {
        if (!token) {
          // Allow dev / static fallback or prompt login
          setIsAuthenticated(false);
          setUserRole(null);
          return;
        }

        setIsAuthenticated(true);
        const fallbackRole = parseRoleFromToken(token);
        if (fallbackRole) setUserRole(fallbackRole);

        try {
          const response = await fetch("/api/auth?action=verify&token=" + encodeURIComponent(token));
          const data = await response.json();
          if (response.ok && data.success) {
            setUserRole(data.user?.role || fallbackRole);
            return;
          }
        } catch {}

        if (!fallbackRole) {
          clearAdminCsrfToken();
          try {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("auth_token");
            localStorage.removeItem("authToken");
          } catch {}
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch {
        console.log("localStorage not available");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isIndexRoute) {
      router.replace("/ops/wpl/dashboard");
    }
  }, [isAuthenticated, isIndexRoute, isLoading, router]);

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    setUserRole(parseRoleFromToken(token));
    storeAdminToken(token);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07080E] flex items-center justify-center">
        <div className="text-white font-mono text-sm">Loading WPL Operations...</div>
      </div>
    );
  }

  if (!isAuthenticated && !isIndexRoute && process.env.NODE_ENV !== "development") {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <LeagueProvider>
      <AdminDataProvider>
        <div className="flex min-h-screen bg-[#07080E] text-white">
          <WPLAdminSidebarNew />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="sticky top-0 z-10 bg-[#0B0E17]/90 backdrop-blur-sm border-b border-white/10">
              <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="w-full max-w-md">
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="w-full flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-neutral-300 hover:bg-white/10 transition-colors"
                    >
                      <Search size={18} />
                      <span className="text-sm">Search WPL Operations (⌘K)</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-mono text-purple-400">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                    <span>WPL 2027 Console</span>
                  </div>
                </div>
              </div>
            </div>

            <main className="p-4 md:p-6 overflow-y-auto flex-1">
              {children}
            </main>
          </div>
        </div>
      </AdminDataProvider>
    </LeagueProvider>
  );
}
