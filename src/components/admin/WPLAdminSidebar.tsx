'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Users, Shield, Award, BarChart3, Upload, ChevronRight, LogOut } from 'lucide-react';
import AdminLeagueSwitcher from './AdminLeagueSwitcher';

interface WPLAdminSidebarProps {
  currentPage?: string;
  onLogout?: () => void;
}

export default function WPLAdminSidebar({ currentPage = '', onLogout }: WPLAdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname() || currentPage;
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('auth_token');
    } catch {}
    router.push('/ops/wpl');
  };

  const navItems = [
    { href: '/ops/wpl/teams', label: 'Teams', icon: Shield },
    { href: '/ops/wpl/players', label: 'Players', icon: Users },
    { href: '/ops/wpl/batting-stats', label: 'Batting Stats', icon: Award },
    { href: '/ops/wpl/bowling-stats', label: 'Bowling Stats', icon: BarChart3 },
    { href: '/ops/wpl/statistics', label: 'Statistics', icon: BarChart3 },
    { href: '/ops/wpl/players/upload', label: 'Player Upload', icon: Upload },
  ];

  return (
    <aside
      className={`sticky top-0 left-0 h-screen z-40 bg-[#0F131C] border-r border-white/10 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-purple-600/30">
              W
            </span>
            <div>
              <div className="text-sm font-bold text-white leading-tight">SportsUP18</div>
              <div className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">WPL Operations</div>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors mx-auto"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* League Switcher */}
      <div className="p-3 border-b border-white/10">
        <AdminLeagueSwitcher />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className={`px-2 py-1 text-[11px] font-semibold text-purple-400/80 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? '•••' : 'Teams & Players'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/25 font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
