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
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-gradient-to-b from-purple-900 to-purple-800 
          border-r border-purple-700 shadow-2xl z-50 transition-all duration-300 ease-in-out
          flex flex-col
          ${collapsed ? 'w-20' : 'w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-purple-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div>
                <h1 className="text-2xl font-bold text-white">WPL Admin</h1>
                <p className="text-purple-300 text-sm mt-1">2026 Season</p>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-purple-700 text-white transition-colors hidden lg:block"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronRight 
                size={20} 
                className={`transform transition-transform ${collapsed ? '' : 'rotate-180'}`}
              />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-purple-900">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${active 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-purple-200 hover:bg-purple-700/50 hover:text-white'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-purple-700 flex-shrink-0">
            <div className="text-center text-purple-300 text-sm">
              <p>Women's Premier League</p>
              <p className="text-xs mt-1">Admin Panel v1.0</p>
            </div>
          </div>
        )}
      </aside>

      {/* Spacer for content */}
      <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`} />
    </>
  );
}
