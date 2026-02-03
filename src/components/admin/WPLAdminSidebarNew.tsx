'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, Calendar, MapPin, FileText, Target, Activity, 
  Users, Shield, BarChart3, TrendingUp, Menu, X, ChevronRight, Award 
} from 'lucide-react';

const menuItems = [
  { href: '/wpl-admin-2026/dashboard', label: 'Dashboard', icon: Home },
  { href: '/wpl-admin-2026/matches', label: 'Matches', icon: Calendar },
  { href: '/wpl-admin-2026/teams', label: 'Teams', icon: Shield },
  { href: '/wpl-admin-2026/players', label: 'Players', icon: Users },
  { href: '/wpl-admin-2026/matchday', label: 'Match Day', icon: Activity },
  { href: '/wpl-admin-2026/venues', label: 'Venues', icon: MapPin },
  { href: '/wpl-admin-2026/stories', label: 'Stories', icon: FileText },
  { href: '/wpl-admin-2026/predictions', label: 'Predictions', icon: Target },
  { href: '/wpl-admin-2026/live-score-ai', label: 'Live Score', icon: Activity },
  { href: '/wpl-admin-2026/live-score-csv', label: 'Live Score CSV', icon: FileText },
  { href: '/wpl-admin-2026/playing-11', label: 'Playing 11', icon: Users },
  { href: '/wpl-admin-2026/points-table', label: 'Points Table', icon: BarChart3 },
  { href: '/wpl-admin-2026/batting-stats', label: 'Batting Stats', icon: TrendingUp },
  { href: '/wpl-admin-2026/bowling-stats', label: 'Bowling Stats', icon: TrendingUp },
  { href: '/wpl-admin-2026/scorecard', label: 'Scorecard', icon: FileText },
  { href: '/wpl-admin-2026/statistics', label: 'Statistics', icon: Award },
];

export default function WPLAdminSidebarNew() {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="wpl-admin-fab fixed top-4 left-4 z-50 lg:hidden"
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`wpl-admin-sidebar fixed top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out flex flex-col ${
          collapsed ? 'w-20' : 'w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Header */}
        <div className="p-6 flex-shrink-0 border-b border-white/10">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="space-y-2">
                <div className="wpl-admin-brand">
                  <span className="wpl-admin-brand-dot" />
                  <span>WPL Command</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200/80">
                  <span className="wpl-admin-pill">2026 Season</span>
                  <span className="wpl-admin-pill wpl-admin-pill-muted">Live Ops</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="wpl-admin-icon-btn hidden lg:flex"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronRight 
                size={20} 
                className={`transform transition-transform ${collapsed ? '' : 'rotate-180'}`}
              />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin scrollbar-thumb-indigo-500/60 scrollbar-track-transparent">
          <div className={`mb-3 ${collapsed ? 'hidden' : 'block'}`}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400/80">
              Navigation
            </p>
          </div>
          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`wpl-admin-nav-item ${active ? 'active' : ''} ${collapsed ? 'is-collapsed' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={20} className="flex-shrink-0 text-slate-100/80" />
                  {!collapsed && (
                    <span className="font-medium tracking-tight">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-white/10 flex-shrink-0">
            <div className="wpl-admin-footer">
              <div>
                <p className="text-sm font-semibold text-white/90">Women's Premier League</p>
                <p className="text-xs text-slate-300/80">Admin Console v2</p>
              </div>
              <span className="wpl-admin-status">Online</span>
            </div>
          </div>
        )}
      </aside>

      {/* Spacer for content */}
      <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-72'} transition-all duration-300`} />
    </>
  );
}
