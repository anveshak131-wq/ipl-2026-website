"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Sun, Moon, X, ArrowUpRight, Calendar, Users, Coins, Radio, FileText, BarChart3, Shield, MapPin, Settings, Award } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);
  const hasCheckedAuth = useRef(false);
  const isIndexRoute = pathname === "/ops/wpl" || pathname === "/ops/wpl/";

  // Load theme preference
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("wpl_ops_theme") as "dark" | "light";
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
    } catch {}
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("wpl_ops_theme", next);
    } catch {}
  };

  // Keyboard shortcut listener for ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navRoutes = [
    { label: "Dashboard", path: "/ops/wpl/dashboard", icon: Award, category: "Overview" },
    { label: "Matches & Fixtures", path: "/ops/wpl/matches", icon: Calendar, category: "Live Ops" },
    { label: "Playing 11 Confirmation", path: "/ops/wpl/playing-11", icon: Users, category: "Live Ops" },
    { label: "Toss Submission", path: "/ops/wpl/toss", icon: Coins, category: "Live Ops" },
    { label: "Live Scorer Console", path: "/ops/wpl/live-score", icon: Radio, category: "Live Ops" },
    { label: "Scorecard Review", path: "/ops/wpl/scorecard", icon: FileText, category: "Live Ops" },
    { label: "Points Table", path: "/ops/wpl/points-table", icon: BarChart3, category: "Live Ops" },
    { label: "Teams Roster", path: "/ops/wpl/teams", icon: Shield, category: "League Data" },
    { label: "Players Directory", path: "/ops/wpl/players", icon: Users, category: "League Data" },
    { label: "Batting Stats", path: "/ops/wpl/batting-stats", icon: BarChart3, category: "League Data" },
    { label: "Bowling Stats", path: "/ops/wpl/bowling-stats", icon: BarChart3, category: "League Data" },
    { label: "Venues", path: "/ops/wpl/venues", icon: MapPin, category: "League Data" },
    { label: "Ops Settings", path: "/ops/wpl/settings", icon: Settings, category: "System" },
  ];

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return navRoutes;
    const q = searchQuery.toLowerCase();
    return navRoutes.filter((r) => r.label.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  }, [searchQuery]);

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
          setIsAuthenticated(true);
          setUserRole("super_admin");
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        const fallbackRole = parseRoleFromToken(token);
        if (fallbackRole) setUserRole(fallbackRole);
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

  const isDark = theme === "dark";

  return (
    <LeagueProvider>
      <AdminDataProvider>
        <div
          className={`flex min-h-screen ${
            isDark
              ? "wpl-admin-root wpl-theme-dark bg-[#07080E] text-slate-100"
              : "wpl-theme-light bg-slate-100 text-slate-900"
          }`}
        >
          {/* Main Sidebar - rendered strictly once */}
          <WPLAdminSidebarNew />

          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Operational Toolbar */}
            <header
              className={`sticky top-0 z-20 backdrop-blur-md border-b transition-colors ${
                isDark
                  ? "bg-[#0B0E17]/85 border-white/10"
                  : "bg-white/85 border-slate-300"
              }`}
            >
              <div className="px-6 py-3 flex items-center justify-between gap-4">
                {/* ⌘K Search trigger */}
                <div className="w-full max-w-md">
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className={`w-full flex items-center justify-between px-4 py-2 border rounded-xl text-xs sm:text-sm transition-all ${
                      isDark
                        ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                        : "bg-slate-50 border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Search size={16} className="text-pink-500" />
                      <span>Search WPL routes, tools...</span>
                    </div>
                    <kbd
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isDark ? "bg-white/10 text-slate-300" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      ⌘K
                    </kbd>
                  </button>
                </div>

                {/* Right utility items */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-pink-400 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                    <span>WPL 2027 Console</span>
                  </div>

                  {/* Dark / Light Toggle */}
                  {mounted && (
                    <button
                      onClick={toggleTheme}
                      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
                      className={`p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                        isDark
                          ? "bg-white/5 border-white/10 text-amber-400 hover:bg-white/10"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
                      }`}
                    >
                      {isDark ? <Sun size={17} /> : <Moon size={17} />}
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Page Content Slot */}
            <main className="p-4 md:p-6 overflow-y-auto flex-1">
              {children}
            </main>
          </div>
        </div>

        {/* ⌘K Command Dialog */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
            <div
              className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
                isDark ? "bg-[#0F121E] border-white/10 text-white" : "bg-white border-slate-300 text-slate-900"
              }`}
            >
              <div className="flex items-center px-4 border-b border-white/10 gap-3">
                <Search size={18} className="text-pink-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Jump to route or ops module..."
                  autoFocus
                  className="w-full py-3.5 bg-transparent text-sm focus:outline-none placeholder:text-slate-500"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/5">
                {filteredRoutes.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No matching ops pages found.
                  </div>
                ) : (
                  filteredRoutes.map((route) => {
                    const Icon = route.icon;
                    return (
                      <div
                        key={route.path}
                        onClick={() => {
                          setIsSearchOpen(false);
                          router.push(route.path);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group ${
                          isDark
                            ? "hover:bg-pink-500/10 hover:text-pink-400"
                            : "hover:bg-pink-50 hover:text-pink-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg border ${
                              isDark
                                ? "bg-white/5 border-white/10"
                                : "bg-slate-100 border-slate-200"
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{route.label}</div>
                            <div className="text-[10px] text-slate-400">{route.category}</div>
                          </div>
                        </div>
                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </AdminDataProvider>
    </LeagueProvider>
  );
}
